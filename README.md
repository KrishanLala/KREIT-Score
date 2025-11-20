# KREIT Score

KREIT Score is a Next.js 14 (App Router) application that prototypes an AI-powered real estate scoring workflow. It ships with a Tailwind CSS-powered landing page, a basic API route, and helpers under `lib/` so you can quickly plug in data from ATTOM, Supabase, and other providers.

## Stack
- Next.js 14 + App Router + TypeScript
- Tailwind CSS for styling
- Supabase JS client (browser + server helpers in `lib/supabaseClient.ts`)
- Stripe Checkout for subscriptions (`app/api/checkout`)
- OpenAI + ATTOM enrichment (`app/api/kreit-score`)

## Key folders
- `app/page.tsx` – hero form that calls `/api/kreit-score`, renders summaries, and upsells Premium.
- `app/api/kreit-score/route.ts` – validates addresses, checks Supabase cache, calls ATTOM + OpenAI, and enforces premium gating.
- `app/api/checkout/route.ts` – creates Stripe Checkout sessions using the logged-in Supabase user as `client_reference_id`.
- `app/api/score/route.ts` – original mock endpoint (kept for quick demos).
- `lib/score.ts` – deterministic mock scoring helper.
- `lib/supabaseClient.ts` – client/server Supabase factories.
- `lib/auth.ts` – helpers to read Supabase auth tokens and premium status.
- `.env.example` – master list of required environment variables.

## Getting started
1. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in Supabase (public + service-role), Stripe (secret + price + webhook), ATTOM (URL + key), and OpenAI credentials.

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

## Database expectations
- `profiles` table with columns:
  - `id uuid primary key` referencing `auth.users.id`
  - `is_premium boolean default false`
- `property_cache` table storing cached underwriting:
  - `normalized_address text unique`
  - `raw_address text`
  - `attom_data jsonb`
  - `kreit_score int`
  - `simple_summary text`
  - `pro_summary text`
  - `premium_data jsonb`
  - `last_fetched_at timestamptz`

## Premium flow
1. Visitors can score any address for free and toggle between Simple/Pro summaries.
2. Premium insights remain locked unless the Supabase user has `profiles.is_premium = true`.
3. Clicking “Upgrade to Premium” calls `/api/checkout`, creates a Stripe subscription session for `STRIPE_PRICE_ID`, and redirects back to `/account` on success.
4. Webhook processing (not included) should mark `profiles.is_premium = true` once Stripe confirms payment, unlocking `premium_data` responses automatically.
