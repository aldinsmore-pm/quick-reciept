import sharp from "sharp";
import { createWorker } from "tesseract.js";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { getOpenAIClient } from "@/lib/openai";
import { ReceiptSchema } from "@/lib/receiptSchema";

export const runtime = "nodejs"; // ensure Node runtime for sharp
export const maxDuration = 300; // allow more time on Pro for OCR

async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  const isServerless = Boolean(process.env.VERCEL);
  const targetWidth = isServerless ? 1200 : 1800; // reduce memory usage on Vercel
  const processed = await sharp(imageBuffer)
    .rotate()
    .resize({ width: targetWidth, withoutEnlargement: true })
    .grayscale()
    .normalise()
    .sharpen()
    .toFormat("png")
    .toBuffer();
  return processed;
}

async function runLocalOCR(imageBuffer: Buffer): Promise<string> {
  if (process.env.DISABLE_LOCAL_OCR === "true") {
    return "";
  }
  // Prefer CDN URLs so serverless can fetch assets instead of reading local FS
  const cdnWorkerUrl = "https://unpkg.com/tesseract.js@6.0.1/dist/worker.min.js";
  const cdnCoreUrl = "https://unpkg.com/tesseract.js-core@6.0.1/tesseract-core-simd.wasm";
  const resolvedLangPath = "https://tessdata.projectnaptha.com/4.0.0";

  async function ensureLocalCopy(url: string, filename: string): Promise<string> {
    const tmpDir = os.tmpdir();
    const target = path.join(tmpDir, filename);
    try {
      // If already exists, reuse
      await fs.access(target);
      return target;
    } catch {
      const res = await fetch(url);
      if (!res.ok || !res.body) throw new Error(`Failed to fetch ${url}: ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(target, buffer);
      return target;
    }
  }

  // Create worker with explicit asset paths; load/init language separately
  const createWorkerFn = createWorker as unknown as (
    langs?: string | string[],
    options?: Record<string, unknown>
  ) => Promise<{
    loadLanguage: (lang: string) => Promise<void>;
    initialize: (lang: string) => Promise<void>;
    recognize: (image: Buffer | string) => Promise<{ data: { text: string } }>;
    terminate: () => Promise<void>;
  }>;
  let worker: Awaited<ReturnType<typeof createWorkerFn>>;
  try {
    // Try CDN paths first
    worker = await createWorkerFn("eng", {
      workerPath: cdnWorkerUrl,
      corePath: cdnCoreUrl,
      langPath: resolvedLangPath,
      gzip: true,
    });
  } catch {
    // Fallback: download assets to /tmp and load from local file paths
    const localWorker = await ensureLocalCopy(cdnWorkerUrl, "tess-worker.min.js");
    const localCore = await ensureLocalCopy(cdnCoreUrl, "tesseract-core-simd.wasm");
    worker = await createWorkerFn("eng", {
      workerPath: localWorker,
      corePath: localCore,
      langPath: resolvedLangPath,
      gzip: true,
    });
  }
  try {
    // Ensure language is ready
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    const { data } = await worker.recognize(imageBuffer);
    return data.text || "";
  } finally {
    await worker.terminate();
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const textField = formData.get("ocrText");
    let ocrText: string | null = null;
    let processed: Buffer | null = null;
    let imageDataUrl: string | null = null;
    if (typeof textField === "string" && textField.trim().length > 0) {
      ocrText = textField;
    } else {
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "Missing file or ocrText" }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);
      processed = await preprocessImage(inputBuffer);
      ocrText = await runLocalOCR(processed);
      imageDataUrl = `data:image/png;base64,${processed.toString("base64")}`;
    }

    const openai = getOpenAIClient();

    const systemPrompt = `You are an expert bookkeeping assistant for a landscaping business. Given raw OCR text (and the receipt image if provided), extract structured data and reconcile any mismatches between line items, prices, and totals.
Return ONLY valid JSON matching this TypeScript type (do not wrap in markdown):
type Receipt = {
  vendorName?: string;
  vendorAddress?: string;
  vendorPhone?: string;
  date?: string; // ISO if possible
  subtotal?: number;
  tax?: number;
  tip?: number;
  total?: number;
  currency?: string; // e.g. USD
  paymentMethod?: string;
  invoiceNumber?: string;
  items: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
    sku?: string;
    category?: string; // landscaping expense category guess
  }>;
  notes?: string;
  ocrText: string;
}`;
    const userPrompt = `Use BOTH the OCR text and, if available, the attached receipt image to extract itemized data. If the OCR and image disagree, prefer the image. Reconcile mismatched line items and totals. Make sure sum(items.total) + tax + tip = total (when fields are present). If subtotal is present, ensure it matches sum of item totals. Round sensibly.\n\nOCR TEXT:\n\n${ocrText}`;

    // Use Responses API (GPT-5) with image + text inputs when available
    type ResponsesContent =
      | { type: "input_text"; text: string }
      | { type: "input_image"; image_url: string; detail: "low" | "high" | "auto" };
    type ResponsesMessage = { role: "system" | "user"; content: ResponsesContent[] };

    const input: ResponsesMessage[] = [
      { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
    ];
    if (imageDataUrl) {
      input.push({
        role: "user",
        content: [
          { type: "input_text", text: userPrompt },
          { type: "input_image", image_url: imageDataUrl, detail: "auto" },
        ],
      });
    } else {
      input.push({ role: "user", content: [{ type: "input_text", text: userPrompt }] });
    }

    const completion = await openai.responses.create({
      model: "gpt-5",
      input,
      reasoning: { effort: "minimal" },
      text: { verbosity: "low" },
    });

    const completionAny = completion as unknown as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const content = completionAny.output_text
      ?? completionAny.output?.[0]?.content?.[0]?.text
      ?? "";

    // Attempt to parse JSON from content
    let parsed: unknown;
    try {
      const jsonStart = content.indexOf("{");
      const jsonEnd = content.lastIndexOf("}");
      const jsonStr = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : content;
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI JSON", raw: content, ocrText }, { status: 502 });
    }

    const result = ReceiptSchema.safeParse(parsed);
    if (!result.success) {
      return NextResponse.json({ error: "Validation error", issues: result.error.issues, raw: parsed, ocrText }, { status: 422 });
    }

    return NextResponse.json(result.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


