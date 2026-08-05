# TradePro 360 — Environment Variables Guide

This document explains every environment variable used in the project, where to find the real values, and the security rules that must be followed.

---

## Quick Setup

```bash
# 1. Frontend
cp frontend/.env.example frontend/.env

# 2. Backend / Edge Functions
cp backend/.env.example backend/.env

# 3. Fill in your real values in both .env files (see sections below)
```

---

## Security Rules (Read First)

| Rule | Detail |
|------|--------|
| **Never commit `.env` files** | Both `.env` files are in `.gitignore`. Only `.env.example` files are committed. |
| **VITE_ prefix = browser-visible** | Vite bundles every `VITE_*` variable into the JavaScript sent to the user's browser. Only put **public/publishable** keys here. |
| **No secret keys in frontend** | `sk_test_`, `service_role` keys must **never** appear in `frontend/.env`. |
| **Service role key = full DB access** | This key bypasses Row Level Security entirely. Treat it like a root database password. |

---

## `frontend/.env`

Used by the Vite dev server and browser bundle.

### `VITE_SUPABASE_URL`

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
```

**What it is:** The public REST/Realtime endpoint for your Supabase project.  
**Safe in browser:** Yes — it is not a secret.  
**Where to get it:**
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings → API**
4. Copy **Project URL**

---

### `VITE_SUPABASE_ANON_KEY`

```
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

**What it is:** A JWT that identifies the project and grants the `anon` (unauthenticated) role. Row Level Security policies control what this key can actually access.  
**Safe in browser:** Yes — it is a *public* key protected by RLS.  
**Where to get it:**
1. Supabase Dashboard → **Settings → API**
2. Under **Project API Keys**, copy **anon / public**

> **Difference from service_role:** The anon key respects RLS policies. The service_role key bypasses them entirely. Always use the anon key on the frontend.

---

### `VITE_STRIPE_PUBLISHABLE_KEY`

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**What it is:** Stripe's *publishable* key. Used by Stripe.js / React Stripe to render the payment UI (card element, Apple Pay button) and create a `PaymentMethod` token in the browser. It **cannot** be used to charge a card — that requires the secret key.  
**Safe in browser:** Yes — publishable keys are designed to be public.  
**Where to get it:**
1. Open [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers → API Keys**
3. Copy **Publishable key** (starts with `pk_test_` for test mode, `pk_live_` for production)

> ⚠ **Critical:** Never put `sk_test_` (secret key) here. The booking flow only needs the publishable key on the frontend.

---

### `VITE_APP_URL`

```
VITE_APP_URL=http://localhost:3000
```

**What it is:** The base URL of the frontend app. Used when constructing shareable tracking links sent to customers.  
**Development:** `http://localhost:3000` (Vite default port for this project)  
**Production:** Your deployed domain, e.g. `https://tradepro360.com`

---

## `backend/.env`

Used by Supabase Edge Functions (`dispatch-engine`, `stripe-webhook`). These run **server-side** in Deno and are never exposed to the browser.

When deploying Edge Functions, set these via:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_value
supabase secrets set STRIPE_SECRET_KEY=your_value
supabase secrets set STRIPE_WEBHOOK_SECRET=your_value
```

---

### `SUPABASE_URL`

Same value as `VITE_SUPABASE_URL`. Used by Edge Functions to construct API requests.

---

### `SUPABASE_ANON_KEY`

Same value as `VITE_SUPABASE_ANON_KEY`. Rarely needed in Edge Functions (they use service_role instead), but kept for completeness.

---

### `SUPABASE_SERVICE_ROLE_KEY`

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...service_role...
```

**What it is:** A JWT granting the `service_role` which **bypasses all Row Level Security policies**. Gives full read/write access to every table.  
**Safe in browser:** **NO — never expose this anywhere on the frontend.**  
**Used by:**
- `dispatch-engine` — assigns engineers to jobs and sends notifications
- `stripe-webhook` — updates payment status on jobs table

**Where to get it:**
1. Supabase Dashboard → **Settings → API**
2. Under **Project API Keys**, click **Reveal** next to **service_role / secret**
3. Copy the value — treat it like a database root password

> ⚠ If this key is accidentally committed or exposed, go to Supabase Dashboard → Settings → API → **Rotate service_role key** immediately.

---

### `STRIPE_SECRET_KEY`

```
STRIPE_SECRET_KEY=sk_test_...
```

**What it is:** Stripe's *secret* key. Used by the `stripe-webhook` Edge Function to create `PaymentIntents`, capture payments, and issue refunds.  
**Safe in browser:** **NO — never expose this.**  
**Where to get it:**
1. Stripe Dashboard → **Developers → API Keys**
2. Click **Reveal test key** next to **Secret key**
3. Starts with `sk_test_` (test) or `sk_live_` (production)

---

### `STRIPE_WEBHOOK_SECRET`

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

**What it is:** A signing secret Stripe uses to sign every webhook event payload. The `stripe-webhook` Edge Function uses it to call `stripe.webhooks.constructEventAsync()` which verifies the signature — preventing anyone from sending fake webhook events.  
**Where to get it:**
1. Stripe Dashboard → **Developers → Webhooks**
2. Click **Add endpoint** → enter your Edge Function URL:
   `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
3. Select these events: `payment_intent.created`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.amount_capturable_updated`, `charge.refunded`
4. After saving, click the endpoint and copy **Signing secret** (`whsec_...`)

For **local testing** with the Stripe CLI:
```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
# This prints a temporary whsec_ value to use in your local .env
```

---

### `STRIPE_PUBLISHABLE_KEY`

Same value as `VITE_STRIPE_PUBLISHABLE_KEY`. Stored here for reference — some server-side SDKs need it to initialise the Stripe client.

---

## Anon Key vs Service Role Key — Side-by-Side

| Property | Anon Key (`anon`) | Service Role Key (`service_role`) |
|----------|-------------------|-----------------------------------|
| Safe in browser | ✅ Yes | ❌ No |
| Respects RLS policies | ✅ Yes | ❌ Bypasses all RLS |
| Used in | `frontend/.env` | `backend/.env` / Supabase Secrets |
| Starts with | `eyJ...role":"anon"...` | `eyJ...role":"service_role"...` |
| If leaked | Limited damage (RLS protects data) | Full database read/write access |

---

## `.gitignore` Checklist

Make sure your root `.gitignore` (or each folder's `.gitignore`) contains:

```gitignore
# Environment secrets — never commit
.env
frontend/.env
backend/.env

# Keep examples for onboarding
!.env.example
!frontend/.env.example
!backend/.env.example
```

---

## Environment Variables by Feature

| Feature | Variable(s) needed |
|---------|-------------------|
| Supabase DB queries (frontend) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Supabase Realtime (live tracking) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Stripe payment element (booking step 3) | `VITE_STRIPE_PUBLISHABLE_KEY` |
| Map tiles & postcode geocoding | **None** — uses OpenStreetMap (free) + postcodes.io (free) |
| Tracking link construction | `VITE_APP_URL` |
| Dispatch engine (Edge Function) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Stripe webhook (Edge Function) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

---

## Deploying Edge Function Secrets

Supabase Edge Functions read secrets from the project's **Vault**, not from a file on disk. After setting up `backend/.env` locally, push the secrets:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref faxkzuhmbleveqoedxfg

# Push each secret
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_value_here"
supabase secrets set STRIPE_SECRET_KEY="your_value_here"
supabase secrets set STRIPE_WEBHOOK_SECRET="your_value_here"

# Verify
supabase secrets list
```

---

*Last updated: TradePro 360 project setup*
