"use client";
import { useRef, useState } from "react";
import ProcessingAnimation from "./components/ProcessingAnimation";
import Badge from "./components/Badge";
import Hills from "./components/Hills";
import Copy from "./components/Copy";

type Receipt = {
  vendorName?: string;
  date?: string;
  total?: number;
  items: Array<{ description: string; total?: number; category?: string }>;
  ocrText: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/process-receipt", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Processing failed");
      setResult(data as Receipt);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function onPick(f: File | null) {
    setFile(f);
    setResult(null);
    setError(null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  return (
    <main className="relative min-h-screen bg-gray-50 text-gray-900">
      <div className="relative z-10 mx-auto max-w-4xl p-6">
        <h1 className="text-3xl font-semibold tracking-tight">Quick Reciept</h1>
        <p className="text-gray-600 mt-1">Upload or capture a receipt to extract itemized expenses.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div
            className={`relative flex items-center gap-3 rounded-md border-2 border-dashed ${
              isLoading ? "border-emerald-200" : "border-gray-300 hover:border-emerald-400"
            } p-4 transition-colors`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) onPick(dropped);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => onPick(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-black"
            />
            {file && (
              <button
                type="button"
                className="text-sm text-gray-600 underline"
                onClick={() => {
                  onPick(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                Clear
              </button>
            )}
          </div>

          {preview && (
            <div className="mt-2 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" className="max-h-80 rounded-md border" />
              {isLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-md">
                  <ProcessingAnimation />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || isLoading}
            className="rounded-md bg-emerald-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60 shadow hover:shadow-md transition"
          >
            {isLoading ? "Processing..." : "Process Receipt"}
          </button>
          {!file && (
            <p className="text-xs text-gray-500">Tip: drag and drop a photo of your receipt anywhere on this area.</p>
          )}
        </form>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
        )}

          {result && (
          <div className="mt-6 grid gap-4">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Summary</h2>
                <div className="flex items-center gap-2">
                  {result.vendorName && <Badge color="gray">Vendor</Badge>}
                  {result.date && <Badge color="sky">Date</Badge>}
                  {result.total != null && <Badge color="emerald">Total</Badge>}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-gray-500">Vendor</div>
                  <div className="flex items-center gap-2">
                    <span>{result.vendorName || "—"}</span>
                    {result.vendorName && <Copy value={result.vendorName} />}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Date</div>
                  <div className="flex items-center gap-2">
                    <span>{result.date || "—"}</span>
                    {result.date && <Copy value={result.date} />}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Total</div>
                  <div className="flex items-center gap-2">
                    <span>{result.total != null ? `$${result.total.toFixed(2)}` : "—"}</span>
                    {result.total != null && <Copy value={result.total.toFixed(2)} />}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Items</h2>
                <Badge color="gray">{result.items.length} lines</Badge>
              </div>
              <div className="mt-2 divide-y text-sm">
                {result.items.map((it, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <span>{it.description}</span>
                        <Copy value={it.description} />
                      </div>
                      <div className="text-gray-500 flex items-center gap-2">
                        <span>{it.category || "uncategorized"}</span>
                        {(it.category || "") && <Copy value={it.category || ""} />}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{it.total != null ? `$${it.total.toFixed(2)}` : ""}</span>
                      {it.total != null && <Copy value={it.total.toFixed(2)} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <details className="card p-4">
              <summary className="cursor-pointer font-medium">Raw OCR</summary>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Extracted text</span>
                {result.ocrText && <Copy label="Copy OCR" value={result.ocrText} />}
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600">{result.ocrText}</pre>
            </details>
          </div>
        )}
      </div>
      <Hills />
    </main>
  );
}
