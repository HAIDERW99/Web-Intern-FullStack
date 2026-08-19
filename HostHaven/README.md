# 🏨 HostHaven – Modern Hospitality & Hotel Management Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://hosthaven.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> 🌐 **Live Website URL:** [https://hosthaven.vercel.app](https://hosthavenapi.vercel.app)

---

## 📖 About HostHaven

**HostHaven** is an end-to-end, full-stack hospitality and property management platform designed to streamline operations for guests, property owners, and administrators. 

- 🌟 **For Guests & Customers:** Explore curated hotels, resorts, villas, and apartments with real-time filters (category, city, price), view detailed room types, check real-time availability, make instant reservations, and submit verified reviews.
- 🏨 **For Property Owners:** Multi-step property onboarding workflow, starter room auto-generation, live room inventory management (Deluxe/Standard suites, pricing, bed configurations, occupancy toggles), booking tracking, and earnings analytics.
- 🛡️ **For Administrators:** Centralized administrative control with strict property verification workflows (Approve, Reject, or Request Changes on business licenses & CNIC/IDs), platform-wide inventory monitoring, and staff & booking management.

---

## 🔑 Demo Login Credentials

You can use the following pre-configured demo credentials to explore all user roles across the platform:

| Role | Email | Password | Access & Features |
| :--- | :--- | :--- | :--- |
| 🛡️ **Admin** | `haiderwahla199@gmail.com` | `admin199` | Full administrative review, property approvals, inventory & bookings control |
| 🏨 **Hotel Owner** | `herohaitu07@gmail.com` | `owner199` | Register properties, manage rooms & inventory, track bookings & revenue |
| 👤 **Customer / Guest** | `juttinsane199@gmail.com` | `guest199` | Search properties, book rooms, view reservations & submit reviews |

---

## 📸 Screenshots

### 1. Explore & Property Discovery
> *Search and filter through approved luxury hotels, resorts, and apartments.*
![Explore Page](https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80)

### 2. Hotel Details & Room Reservation
> *Real-time booking interface with date pickers, room selection, and price breakdown.*
![Hotel Detail & Booking](https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80)

### 3. Owner Property Registration & Inventory
> *Multi-step property registration wizard and real-time room inventory management.*
![Property Registration](https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80)

### 4. Admin Verification & Approval Dashboard
> *Document verification, property approval/rejection modal with direct owner feedback.*
![Admin Dashboard](https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=80)

---

## 🛠️ Technologies Used

### **Frontend**
- **React.js (Vite)** – Fast single-page application framework
- **Tailwind CSS** – Custom responsive styling and modern UI components
- **Lucide React & Heroicons** – Crisp, modern SVG iconography
- **React Router DOM v6** – Client-side routing with role-based protected routes
- **Supabase JS SDK** – Real-time client-side authentication and database queries

### **Backend**
- **Node.js & Express.js** – RESTful API architecture
- **Supabase Service Client** – Elevated privileges for administrative workflows
- **CORS & Dotenv** – Secure cross-origin resource sharing & configuration management

### **Database & Security**
- **PostgreSQL (Supabase)** – Relational database with Foreign Key cascades
- **Row Level Security (RLS)** – Strict database policies for data privacy & user roles
- **Supabase Auth** – JWT-based secure user authentication & signup triggers

---

## 📂 Project Structure

```bash
HostHaven/
├── frontend/                     # React Frontend Application
│   ├── public/                   # Static assets & favicon
│   ├── src/
│   │   ├── components/           # Reusable UI components (Navbar, Footer, etc.)
│   │   ├── context/              # Auth & Global Context Providers
│   │   ├── lib/                  # Supabase client & API helpers
│   │   ├── pages/                # Main Application Views
│   │   │   ├── admin/            # Admin dashboard, reviews & inventory
│   │   │   ├── owner/            # Owner registration, inventory & bookings
│   │   │   ├── ExplorePage.jsx   # Hotel listing & search
│   │   │   ├── HotelDetailPage.jsx # Room booking interface
│   │   │   └── ReservationsPage.jsx# Customer booking history
│   │   ├── App.jsx               # Route definitions & guards
│   │   └── main.jsx              # Application entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Express.js REST API Server
│   ├── src/
│   │   ├── routes/               # API route definitions
│   │   ├── controllers/          # Business logic handlers
│   │   └── index.js              # Server entry point
│   ├── package.json
│   └── .env.example
│
├── supabase/                     # Database Migrations & Schemas
│   ├── fix_all_schema_and_columns.sql # Complete Master Database Schema
│   └── fix_enum_status.sql       # Dedicated RLS & Column Type Fixes
└── README.md
```

---

## 🚀 How to Run the Project Locally

Follow these step-by-step instructions to get HostHaven running locally on your computer:

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [Git](https://git-scm.com/)
- A free [Supabase](https://supabase.com/) account

---

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/HostHaven.git
cd HostHaven
```

---

### 3. Database Setup (Supabase)
1. Go to your [Supabase Dashboard](https://app.supabase.com/) and create a new project.
2. Open the **SQL Editor** tab on the left sidebar.
3. Copy the entire content of [`supabase/fix_all_schema_and_columns.sql`](supabase/fix_all_schema_and_columns.sql) and paste it into the SQL Editor.
4. Click **Run**. All tables (`profiles`, `hotels`, `rooms`, `bookings`, `reviews`) and security policies will be automatically created.

---

### 4. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Configure your `.env` variables with your Supabase credentials:
   ```env
   PORT=5000
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   FRONTEND_URL=http://localhost:5173
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend API will run on `http://localhost:5000`.*

---

### 5. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Set your frontend environment variables:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_API_URL=http://localhost:5000/api
   ```
5. Start the Vite development server:
   ```bash
   npm run dev
   ```
6. Open your browser and visit: **`http://localhost:5173`** 🎉

---

## 📄 License
This project is licensed under the MIT License — feel free to use it for your portfolio and learning projects.
