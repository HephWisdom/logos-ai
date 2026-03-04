# Logos AI

Production-ready Bible study SaaS built with Vite + React, Supabase, Groq, Stripe, and Vercel.

## Vercel Deployment (Preview + Production)

1. Import this repo into Vercel.
2. Build settings:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`
3. Ensure `vercel.json` is present (already included) for SPA routing and API functions.
4. Add environment variables in Vercel for both `Preview` and `Production`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GROQ_API_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_APP_NAME`
   - `APP_URL` (deployed app URL)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRO_PRICE_ID`
   - `STRIPE_SCHOLAR_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
5. Deploy.

## Stripe Webhook

Configure Stripe webhook endpoint to:

`https://<your-domain>/api/webhooks/stripe`

Listen to at least:
- `checkout.session.completed`
- `customer.subscription.deleted`

## Local Setup

1. Copy env template:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start development server:

```bash
npm run dev
```

## Notes

- Never commit real `.env` secrets.
- Keep `SUPABASE_SERVICE_KEY` server-side only.
- `VITE_*` variables are exposed to the browser.
