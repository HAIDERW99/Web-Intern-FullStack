# 🚗 Car Fever

A full-stack car marketplace where dealers can list vehicles and buyers can browse, filter, and contact sellers.

🔗 **Live Demo:** [https://your-frontend.vercel.app](https://car-fever-frontend.vercel.app) <!-- Replace with your Vercel URL -->  

---

## 📸 Screenshots

<!-- Add screenshots here -->
<!-- ![Home Page](./screenshots/home.png) --> <img width="945" height="441" alt="Screenshot 2026-07-17 070641" src="https://github.com/user-attachments/assets/dab35dd5-b7f3-4b7b-9d1c-a2cf3f0cdef5" />
<img width="946" height="391" alt="Screenshot 2026-07-17 070722" src="https://github.com/user-attachments/assets/57a0f5b5-bf5d-4c8c-a992-d0c0b225ebe1" />


<!-- ![Search Results](./screenshots/search.png) -->
<!-- ![Vehicle Details](./screenshots/details.png) -->

---

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 19, Vite, Tailwind CSS        |
| Backend    | Node.js, Express 4                  |
| Database   | Supabase (PostgreSQL)               |
| Auth       | JWT (JSON Web Tokens)               |
| Deployment | Vercel (Frontend + Backend)         |

---

## ⚙️ How It Works

1. **Dealers** register/login and access a dashboard to list, edit, and manage their vehicles.
2. **Buyers** browse the homepage, use the search/filter page to narrow down results by make, model, price, mileage, fuel type, etc.
3. **Leads** — buyers submit enquiry forms on vehicle detail pages; dealers see incoming leads in their dashboard.
4. **Favorites** — buyers can save vehicles to a local favorites list.

---

## 🚀 Running Locally

### Prerequisites
- Node.js >= 18
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/Web-Intern-FullStack.git
cd Web-Intern-FullStack/Car-Fever
```

### 2. Backend setup

```bash
cd carfever-backend
npm install
cp .env.example .env
# Fill in your values in .env
npm run dev
# API runs on http://localhost:5000
```

**Required `.env` variables:**

```env
PORT=5000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-supabase-service-role-key
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Frontend setup

```bash
cd carfever
npm install
# Create .env file
echo VITE_API_BASE_URL=http://localhost:5000 > .env
npm run dev
# App runs on http://localhost:5173
```

---

## 🌐 Deploying to Vercel

Both projects have a `vercel.json` configured. Deploy them as **two separate Vercel projects**.

**Backend env vars to set in Vercel:**
```
NODE_ENV=production
SUPABASE_URL=...
SUPABASE_KEY=...
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

**Frontend env var to set in Vercel:**
```
VITE_API_BASE_URL=https://your-backend.vercel.app
```

---

## 📁 Project Structure

```
Car-Fever/
├── carfever/               # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level pages
│   │   ├── context/        # Auth & Favorites context
│   │   ├── hooks/          # Custom React hooks
│   │   └── services/api.js # Centralised API client
│   └── vercel.json
│
└── carfever-backend/       # Express REST API
    ├── src/
    │   ├── routes/         # vehicles, leads, auth
    │   ├── middleware/      # auth guard, error handler
    │   └── supabase.js     # Supabase client
    ├── server.js
    └── vercel.json
```

---

## 📄 License

MIT
