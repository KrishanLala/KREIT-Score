# KREIT Score

KREIT Score is a Next.js 14 (App Router) application that prototypes an AI-powered real estate scoring workflow. It ships with a Tailwind CSS-powered landing page, a basic API route, and helpers under `lib/` so you can quickly plug in data from ATTOM, Supabase, and other providers.

## Stack
- Next.js 14 + App Router + TypeScript
- Tailwind CSS for styling
- API routes under `app/api`
- Utility helpers in `lib/`

## Project structure
- `app/page.tsx` – homepage with the address form, Simple/Pro toggle, and CTA.
- `app/api/score/route.ts` – placeholder API endpoint that returns a mock score.
- `lib/score.ts` – deterministic helper that generates mock scores per plan.
- `.env.example` – reference list of env vars (`SUPABASE_URL`, `ATTOM_API_KEY`, etc.).

## Getting started
1. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the secrets for Supabase, Stripe, OpenAI, ATTOM, and any other providers.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Visit [http://localhost:3000](http://localhost:3000) to use the KREIT Score form.

## Scripts
- `npm run dev` – start the local dev server.
- `npm run build` – create a production build.
- `npm run start` – run the production server.
- `npm run lint` – lint the codebase with ESLint.
