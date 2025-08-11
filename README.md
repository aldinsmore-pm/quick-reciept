# Quick Receipt

AI‑powered receipt parsing for landscaping businesses. Upload or snap a photo of a receipt and get structured, validated, itemized expenses with categories.

## Features
- Upload or camera capture (mobile friendly)
- Image preprocessing with sharp to boost OCR accuracy
- Local OCR with Tesseract.js (optional on Vercel)
- GPT‑5 extraction using image + OCR text to fix mismatches and reconcile totals
- Zod validation to guarantee clean JSON
- Polished UI: drag‑and‑drop, animated loader, rolling hills background, copy‑to‑clipboard

## Tech Stack
- Next.js (App Router, TypeScript), Tailwind CSS
- sharp (image preprocessing)
- tesseract.js (local OCR)
- OpenAI GPT‑5 (Responses API)
- zod (schema validation)
- Vercel (deployment)

## Quick Start (Local)
1) Install

```bash
npm install
```

2) Environment

Create `.env.local` in the project root:

```
OPENAI_API_KEY=your_openai_api_key
```

3) Run dev

```bash
npm run dev
```

Open the app at the printed localhost URL. Drag‑and‑drop a receipt image (or use camera capture on mobile), then click Process.

## How it works
- The client posts the uploaded file to `src/app/api/process-receipt/route.ts`.
- The API route:
  - Preprocesses the image with sharp (rotate/resize/grayscale/normalise/sharpen → PNG)
  - Optionally runs local OCR with Tesseract.js (see OCR toggle below)
  - Calls GPT‑5 Responses API with both the processed image and OCR text
  - Parses and validates the AI output with Zod and returns clean JSON

Key files:
- `src/app/api/process-receipt/route.ts` — API route (preprocess → OCR → GPT‑5 → validate)
- `src/lib/receiptSchema.ts` — Zod schema for `Receipt` and items
- `src/lib/openai.ts` — OpenAI client setup
- `src/app/page.tsx` — UI (upload, preview, results)

## OCR on Vercel
Running Tesseract in serverless can be resource‑intensive. This project supports two modes:

- Recommended (simpler): disable local OCR and let GPT‑5 vision read the image directly
  - Set `DISABLE_LOCAL_OCR=true` in Vercel Environment Variables
  - The “Raw OCR” section will be empty; structured results still work

- Full OCR: enable Tesseract
  - Remove `DISABLE_LOCAL_OCR` (or set it to `false`)
  - The route is configured to load Tesseract assets from CDN and, if needed, download them to `/tmp` at runtime as a fallback
  - Increase function memory and duration (see below)

## Deploy to Vercel
1) Connect the GitHub repo and import the project (branch `main`).

2) Environment Variables (Project → Settings → Environment Variables)
- `OPENAI_API_KEY` (Development/Preview/Production)
- Optional: `DISABLE_LOCAL_OCR=true` to skip Tesseract and rely on GPT‑5 vision only

3) Functions (Project → Settings → Functions)
- Set Memory to 3008 MB (Pro)
- Increase max duration if needed (this project sets `export const maxDuration = 300` in the API route)
- See Vercel limits: Serverless Function Memory
  - https://vercel.com/docs/limits?query=limits#serverless-function-memory

4) Redeploy
- If changes don’t appear, click Redeploy and select “Clear build cache”.

## Troubleshooting
- “WASM not found” / Tesseract errors on Vercel
  - Use `DISABLE_LOCAL_OCR=true` (fastest path), or
  - Ensure you’re on Pro with 3008 MB memory, then redeploy with Clear build cache
  - This repo loads Tesseract worker/core/lang from CDN and falls back to `/tmp` at runtime

- 422 Validation Error
  - The AI response didn’t match the schema; the API returns the issues. Adjust input or tweak prompts if needed.

- Timeouts with large images
  - We downscale on Vercel; still, prefer normal‑sized photos (not multi‑megapixel scans). Consider increasing function duration.

## Scripts
- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run start` — run production build locally

## Notes
- App name: Quick Receipt.
- Keep your OpenAI key private. Do not commit `.env.local`.

## Roadmap ideas
- Export to CSV/QuickBooks
- User accounts and saved receipt history
- Category rules and budgets
- Batch uploads

## License
TBD
