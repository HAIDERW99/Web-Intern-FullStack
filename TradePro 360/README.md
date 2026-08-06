# TradePro 360

🌐 **Live Site:** (https://trade-pro-360.vercel.app/)

---

## About the Project

**TradePro 360** is a full-stack emergency home services platform for the UK market. Customers can book verified local tradespeople — plumbers, electricians, heating engineers, locksmiths, drainage specialists, and general handymen — in under 60 seconds, get a fixed transparent quote, pay securely via Stripe, and then track their assigned engineer live on a map in real time.

The platform has three distinct portals: a public-facing booking and tracking experience for customers, a Kanban-based admin dashboard for managing jobs and fleet, and a mobile-friendly engineer dashboard for accepting and updating job statuses.

---

## Test Credentials

Use these accounts to explore each role without signing up:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tradepro360.com | Admin@123 |
| Engineer | engineer@tradepro360.com | Engineer@123 |
| Customer | customer@tradepro360.com | Customer@123 |

> Sign in via the **Login** button on the homepage header.

---

## Technologies Used

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite 5 | Build tool & dev server |
| Tailwind CSS 3 | Utility-first styling |
| React Router v6 | Client-side routing |
| Supabase JS v2 | Auth, database queries & Realtime |
| Stripe React & JS | Payment element (card / Apple Pay) |
| React Leaflet + Leaflet | Live interactive map for engineer tracking |
| Lucide React | Icon library |
| React Hot Toast | Toast notifications |
| date-fns | Date formatting |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase (PostgreSQL) | Primary database with Row Level Security |
| Supabase Auth | JWT-based authentication & role management |
| Supabase Realtime | Live job status & location updates |
| Supabase Edge Functions (Deno) | Serverless functions for dispatch logic & Stripe webhooks |
| Stripe | Payment processing & webhook event handling |
| OpenStreetMap / postcodes.io | Free map tiles & UK postcode geocoding |

---

## Screenshots

### Homepage — Hero & Booking Widget
![Homepage](./screenshots/homepage.png)

### Booking Flow — 4-Step Wizard
![Booking](./screenshots/booking.png)

### Live Engineer Tracking Map
![Tracking](./screenshots/tracking.png)

### Admin Dashboard — Kanban Board
![Admin Dashboard](./screenshots/admin-kanban.png)

### Engineer Dashboard — Job Queue
![Engineer Dashboard](./screenshots/engineer-dashboard.png)

> **Note:** Add your own screenshots to a `/screenshots` folder in the project root and update the paths above.

---

## Project Structure

```
TradePro 360/
├── frontend/                        # React + Vite application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── modals/
│   │   │   │   └── AuthModal.jsx    # Login / sign-up modal
│   │   │   ├── AdminKanban.jsx      # Drag-and-drop job board for admins
│   │   │   ├── BookingWidget.jsx    # 4-step booking wizard
│   │   │   ├── EngineerActions.jsx  # Accept / complete job controls
│   │   │   ├── Header.jsx           # Global navigation bar
│   │   │   ├── LiveTrackerMap.jsx   # Leaflet map with real-time tracking
│   │   │   └── ProtectedRoute.jsx   # Role-based route guard
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx   # Admin portal (Kanban, fleet, invoices)
│   │   │   ├── BookingPage.jsx      # Full booking page wrapper
│   │   │   ├── EngineerDashboard.jsx# Engineer job queue & status updates
│   │   │   ├── HomePage.jsx         # Marketing landing page
│   │   │   └── TrackingPage.jsx     # Public live-tracking page
│   │   ├── services/
│   │   │   └── supabaseClient.js    # Supabase client initialisation
│   │   ├── App.jsx                  # Root layout & route definitions
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Tailwind base styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vercel.json                  # SPA rewrite rules for Vercel
│   ├── .env.example
│   └── package.json
│
├── backend/                         # Supabase migrations & edge functions
│   ├── supabase/
│   │   ├── functions/
│   │   │   ├── dispatch-engine/
│   │   │   │   └── index.ts         # Auto-assigns engineers to new jobs
│   │   │   └── stripe-webhook/
│   │   │       └── index.ts         # Handles Stripe payment events
│   │   └── migrations/
│   │       ├── 01_initial_schema.sql
│   │       ├── fix_auth_trigger.sql
│   │       └── fix_email_confirm.sql
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Local Installation Guide

### Prerequisites

Make sure the following are installed on your machine:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional — only needed to run migrations locally)
- A [Supabase](https://supabase.com) project (free tier works)
- A [Stripe](https://stripe.com) account (test mode is fine)

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/Web-Intern-FullStack.git
cd "Web-Intern-FullStack/TradePro 360"
```

---

### Step 2 — Install frontend dependencies

```bash
cd frontend
npm install
```

---

### Step 3 — Configure frontend environment variables

```bash
cp .env.example .env
```

Open `frontend/.env` and fill in your values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_APP_URL=http://localhost:5173
```

> Get your Supabase URL and anon key from **Supabase Dashboard → Settings → API**.  
> Get your Stripe publishable key from **Stripe Dashboard → Developers → API Keys**.

---

### Step 4 — Set up the database

Apply the migrations to your Supabase project:

```bash
cd ../backend
npm install

# Link to your Supabase project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push
```

Alternatively, you can copy the SQL from `backend/supabase/migrations/` and run it directly in the Supabase SQL editor.

---

### Step 5 — Configure backend environment variables (Edge Functions)

```bash
cp .env.example .env
```

Open `backend/.env` and fill in:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your_service_role_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Push the secrets to Supabase Vault for Edge Functions:

```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_value"
npx supabase secrets set STRIPE_SECRET_KEY="your_value"
npx supabase secrets set STRIPE_WEBHOOK_SECRET="your_value"
```

---

### Step 6 — Run the development server

```bash
cd ../frontend
npm run dev
```

The app will be available at **http://localhost:5173**

---

### Step 7 — (Optional) Deploy Edge Functions locally

```bash
cd ../backend
npx supabase functions serve
```

For Stripe webhook testing locally, use the Stripe CLI:

```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

---

### Available Scripts

| Command | Directory | Description |
|---------|-----------|-------------|
| `npm run dev` | `frontend/` | Start Vite dev server |
| `npm run build` | `frontend/` | Build for production |
| `npm run preview` | `frontend/` | Preview production build |
| `npm run lint` | `frontend/` | Run ESLint |
| `npm run supabase:migrate` | `backend/` | Push DB migrations |
| `npm run supabase:functions:serve` | `backend/` | Serve edge functions locally |
| `npm run supabase:functions:deploy` | `backend/` | Deploy edge functions to Supabase |

---

## Environment Variables Reference

See the detailed environment variables guide in the [original `.env.example` files](./frontend/.env.example) for a full breakdown of every variable, where to find it, and security rules to follow.

---

*TradePro 360 — Built as part of the Web Intern FullStack programme.*
