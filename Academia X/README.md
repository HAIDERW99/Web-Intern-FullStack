# 🎓 AcademiaX — Next-Gen Academic & Institute Management System

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://academia-x.vercel.app)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.11-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

---

🌐 **Live Vercel Application URL:** [https://academia-x.vercel.app](https://academia-x.vercel.app)

---

## 📌 About AcademiaX

**AcademiaX** is an enterprise-grade, multi-tenant Academic Management System (LMS & School ERP) designed to modernize educational institution operations. It unifies administrative oversight, course scheduling, student enrollment, assignment submissions, automated attendance, and grade tracking into a single, cohesive, high-performance web platform. 

Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, and backed by **Supabase** (PostgreSQL with Row Level Security), AcademiaX offers role-based access control (RBAC) tailored specifically for Super Admins, Institute Admins, Teachers, and Students.

---

## 🔑 Demo Access & Actor Credentials

You can test each user role using the pre-seeded credentials or test accounts below:

| Actor / Role | Full Name | Email Address | Password | Permissions & Dashboard Scope |
| :--- | :--- | :--- | :--- | :--- |
| 👑 **Superadmin** | Haider Raza | `haiderwahla199@gmail.com` | `superadmin199` | System-wide control, multi-branch management, institute setup, global audit logs & global admin provisioning. |
| 🏫 **Admin** | Campus Administrator | `admin@academiax.edu` | `admin123456` | Institution level management, user account provisioning, course catalog control, and campus reporting. |
| 👨‍🏫 **Teacher** | Professor Smith | `teacher@academiax.edu` | `teacher123456` | Course management, daily student attendance logging, assignment creation, and grading portal. |
| 🎓 **Student** | Alex Johnson | `student@academiax.edu` | `student123456` | Enrolled course overview, assignment submissions, grade reports, and personal academic profile. |

> 💡 **Note:** When running locally with Supabase, ensure that seed profiles exist in your Supabase Auth & `profiles` table matching these credentials or create a new user via the `/signup` screen.

---

## 🖼️ Screenshots

<div align="center">

### 👑 Super Admin Analytics & Multi-Branch Control
![Super Admin Dashboard](https://raw.githubusercontent.com/username/Academia-X/main/docs/screenshots/super-admin-dashboard.png)
*Centralized control panel for system metrics, branch provisioning, and real-time database ping monitoring.*

### 🏫 Campus Admin Panel
![Admin User Management](https://raw.githubusercontent.com/username/Academia-X/main/docs/screenshots/admin-management.png)
*Manage campus users, courses, reports, and role assignments with ease.*

### 👨‍🏫 Teacher Portal & Attendance Tracking
![Teacher Dashboard](https://raw.githubusercontent.com/username/Academia-X/main/docs/screenshots/teacher-portal.png)
*Mark student attendance, assign coursework, and record grades dynamically.*

### 🎓 Student Learning Hub
![Student Dashboard](https://raw.githubusercontent.com/username/Academia-X/main/docs/screenshots/student-dashboard.png)
*Personalized academic tracker showing active courses, upcoming assignments, and performance grades.*

</div>

---

## 🛠️ Technologies Used

### **Frontend Architecture**
* **Core Library:** [React 18](https://reactjs.org/) (Functional Components, Custom Hooks)
* **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Type Safety & Schemas)
* **Build Tool:** [Vite 5](https://vitejs.dev/) (Lightning-fast HMR & Optimized Production Bundles)
* **Routing:** [React Router v6](https://reactrouter.com/) (Data-driven client routing & Nested Layout Guards)

### **UI & Styling**
* **Styling Engine:** [Tailwind CSS 3](https://tailwindcss.com/) & [PostCSS](https://postcss.org/)
* **Component Primitives:** [Radix UI](https://www.radix-ui.com/) (Accessible Unstyled Dialogs, Dropdowns, Tabs, Accordions)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Utilities:** `clsx`, `tailwind-merge`, `class-variance-authority`

### **State Management & Data Handling**
* **Server State & Caching:** [TanStack React Query v5](https://tanstack.com/query)
* **Global Client State:** [Zustand](https://zustand-demo.pmnd.rs/)
* **Form Management:** [React Hook Form](https://react-hook-form.com/)
* **Validation:** [Zod](https://zod.dev/)

### **Backend & Database**
* **Backend Platform:** [Supabase](https://supabase.com/)
* **Database:** PostgreSQL with Row Level Security (RLS) policies
* **Authentication:** Supabase Auth (JWT-based RBAC)
* **Functions & Triggers:** PostgreSQL Stored Procedures, Automation Triggers for User Profile Creation & Assignment Schema synchronization

---

## 🎯 Purpose of this Site

Educational institutions often suffer from fragmented systems—using separate software for attendance, assignment submission, grading, and staff management. **AcademiaX** was built to solve this problem by:

1. **Centralizing Campus Operations:** Connecting Super Admins, Campus Admins, Faculty, and Students inside one platform.
2. **Streamlining Academic Workflows:** Enabling teachers to mark attendance in seconds and manage assignment submissions digitally.
3. **Ensuring Enterprise Security:** Leveraging PostgreSQL Row Level Security (RLS) so users only access data relevant to their role and campus.
4. **Providing Real-time Analytics:** Offering instant insights into campus performance, enrollment trends, and student attendance rates.
5. **Modernizing User Experience:** Delivering a high-speed, responsive, dark-themed UI that reduces cognitive overhead for users.

---

## 🚀 How to Run the Project Locally

Follow these steps to set up and run AcademiaX on your local system:

### 1. Prerequisites
Make sure you have the following installed on your machine:
* **Node.js** (v18.0.0 or higher) — [Download Node.js](https://nodejs.org/)
* **npm** (v9+ comes bundled with Node) or **pnpm** / **yarn**
* **Git** — [Download Git](https://git-scm.com/)

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/Academia-X.git
cd "Academia-X"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase project credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# App Base URL
VITE_APP_URL=http://localhost:5173

# Super Admin Seed Credentials (Development)
VITE_SUPER_ADMIN_NAME="Haider Raza"
VITE_SUPER_ADMIN_EMAIL="haiderwahla199@gmail.com"
VITE_SUPER_ADMIN_PASSWORD="superadmin199"
```

### 5. Set Up Database (Supabase)
Execute the SQL migrations found in the `supabase/` directory in your Supabase SQL Editor:
* Execute `supabase/Roles define` to create user roles & enums.
* Execute `supabase/Core Tables Schema`, `Users & Profiles`, `Operational Tables`.
* Execute `supabase/Row Level Security (RLS) Policies` and `Triggers & Functions (Automation)`.
* Apply any fix files from `supabase/migrations/` if needed.

### 6. Run Development Server
```bash
npm run dev
```
The application will start locally at **`http://localhost:5173`**.

### 7. Additional Scripts

* **Type Check:**
  ```bash
  npm run type-check
  ```
* **Lint Codebase:**
  ```bash
  npm run lint
  ```
* **Build for Production:**
  ```bash
  npm run build
  ```
* **Preview Production Build:**
  ```bash
  npm run preview
  ```

---

<div align="center">
  <sub>Built with ❤️ for Educational Excellence — <b>AcademiaX</b></sub>
</div>
