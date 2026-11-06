# Bill Snap

Snap a bill. Check it. Done. A mobile-first, offline-capable PWA to scan, review, and track receipts with AI vision.

## Stack
- **Frontend**: React 19, Vite, Vanilla CSS, Inter font
- **Storage**: Plain IndexedDB (offline-first, zero external libraries)
- **AI Vision**: Google Gemini Flash API with structured JSON output
- **PWA**: Hand-written Service Worker (offline shell cache, network-only `/api`), Web App Manifest
- **Hosting**: Vercel Serverless Functions (`/api/analyze`)

## Getting Started Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` and configure the variable names:
   ```env
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=gemini-3.1-flash-lite
   ```
3. Start local development server:
   ```bash
   npm run dev
   ```

## Deploying to Vercel
Set the following environment variables in Vercel Project Settings:
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

## Evaluation Suite
- `npm run eval:init` - Create ground truth template
- `npm run eval` - Benchmark pipeline against test images
- `npm run eval:selftest` - Run scoring engine and unsure rules self-tests

Live app: (to be added)
