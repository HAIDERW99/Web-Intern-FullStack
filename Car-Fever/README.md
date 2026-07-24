# 🚗 Car Fever

A full-stack car marketplace where dealers can list vehicles and buyers can browse, filter, and contact sellers.

🔗 **Live Demo:**https://car-fever-frontend.vercel.app

---

## 📸 Screenshots

<!-- Add screenshots here -->
<!-- ![Home Page](./screenshots/home.png) --> 
<img width="945" height="441" alt="Screenshot 2026-07-17 070641" src="https://github.com/user-attachments/assets/dab35dd5-b7f3-4b7b-9d1c-a2cf3f0cdef5" />
<img width="946" height="391" alt="Screenshot 2026-07-17 070722" src="https://github.com/user-attachments/assets/57a0f5b5-bf5d-4c8c-a992-d0c0b225ebe1" />
<!-- ![Search Results](./screenshots/search.png) -->
<img width="944" height="443" alt="Screenshot 2026-07-17 071448" src="https://github.com/user-attachments/assets/a242fbdf-f63a-4e8d-b3fc-5a542b940e84" />
<img width="945" height="401" alt="Screenshot 2026-07-17 071522" src="https://github.com/user-attachments/assets/1a2f4161-8bd5-4f19-9cd1-04a8a51d9d7a" />
<!-- ![Vehicle Details](./screenshots/details.png) -->
<img width="944" height="445" alt="Screenshot 2026-07-17 071716" src="https://github.com/user-attachments/assets/101a3d9b-510b-4aa3-85b0-0a930af39008" />
<img width="947" height="389" alt="Screenshot 2026-07-17 071740" src="https://github.com/user-attachments/assets/f4c5f0d1-4953-4203-90d7-bfc672857869" />
<!-- ![Sell info Results](./screenshots/search.png) -->
<img width="946" height="443" alt="Screenshot 2026-07-17 072340" src="https://github.com/user-attachments/assets/3f7c518e-866b-485a-a054-4c77ec067239" />
<img width="945" height="392" alt="Screenshot 2026-07-17 072408" src="https://github.com/user-attachments/assets/c5d43fef-f76b-44bc-bbc0-b70d187152c0" />
<img width="945" height="395" alt="Screenshot 2026-07-17 072446" src="https://github.com/user-attachments/assets/b8953e18-b113-421b-8a79-aa56219f98cc" />
<!-- ![Dealer dashboard Results](./screenshots/search.png) -->
<img width="945" height="412" alt="Screenshot 2026-07-17 072713" src="https://github.com/user-attachments/assets/47e84463-8986-44b8-926f-76983ef1edb8" />
<img width="948" height="397" alt="Screenshot 2026-07-17 072755" src="https://github.com/user-attachments/assets/15a4e356-0304-46f2-bcb9-1bac9afce599" />
<img width="955" height="395" alt="Screenshot 2026-07-17 072848" src="https://github.com/user-attachments/assets/48d7eb03-10a6-4d79-9060-1fc49abeec3e" />
<img width="945" height="392" alt="Screenshot 2026-07-17 072859" src="https://github.com/user-attachments/assets/e8a0af2e-4f44-4dc4-b4aa-792cfb5fa9c6" />

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
