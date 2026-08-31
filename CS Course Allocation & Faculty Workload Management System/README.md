# 🎓 CS Course Allocation & Faculty Workload Management System

An intelligent, full-stack departmental platform built for Computer Science and Software Engineering departments to streamline **Academic Planning**, **Course-to-Faculty Allocation**, and **HEC Statutory Workload Compliance**.

🔗 **Live Portal:** `http://localhost:3000`

---

## 📌 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [System Architecture & Roles](#-system-architecture--roles)
- [Statutory Workload Engine (HEC Guidelines)](#-statutory-workload-engine-hec-guidelines)
- [How It Works](#-how-it-works)
- [📸 Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started & Installation](#-getting-started--installation)
- [Default Demo Credentials](#-default-demo-credentials)
- [API Endpoints Reference](#-api-endpoints-reference)
- [License & Authors](#-license--authors)

---

## 🌟 Project Overview

Managing curriculum distribution across multiple degree programs (BSCS, BSSE, MSCS) and faculty ranks while maintaining statutory workload boundaries (HEC guidelines) is a complex challenge for academic departments.

The **CS Course Allocation & Faculty Workload Management System** eliminates spreadsheet clutter by providing:
- **Real-Time Allocation Matrix:** Interactive course-to-instructor mapping with separate Theory and Lab component handling.
- **Dynamic Role Governance:** Clean separation between **Head of Department (HOD)** authority and **Convener** drafting privileges with instant real-time permission synchronization.
- **Statutory Workload Compliance Engine:** Automatic tracking of minimum, maximum, and optimal credit hours per faculty designation.
- **Automated Conflict Resolution:** Instant scanning for double-bookings, shift overlaps, and credit overloads with 1-click resolution.
- **Master Curriculum & Faculty Directory:** Full CRUD database operations with live HEC credit structure parsers.

---

## ✨ Key Features

### 🛡️ 1. Dynamic Role Governance & Permissions Control
- **HOD Executive Command Centre:** Full authority to approve allocations, lock academic sessions, manage master courses/faculty, and dynamically configure Convener privileges.
- **Convener Portal with Login Guidance Popup:** When the Convener logs in, an automated popup informs them of **Allowed** vs. **Restricted (HOD-only)** features in real time.
- **Live Policy Updates:** When the HOD toggles a permission switch (e.g. *Allow Convener to add courses*), the Convener's interface and popup synchronize instantly without page reloads.

### 📊 2. Intelligent Workload Matrix & Compliance Engine
- Real-time calculation of Theory Credit Hours, Lab Credit Hours, Total Load, and Contact Hours (`Theory + Lab * 3`).
- Automatic status indicators:
  - 🟢 **Balanced (Optimal):** Faculty within rank minimum and maximum statutory bounds.
  - 🔴 **Overloaded:** Total load exceeds the statutory ceiling.
  - 🔵 **Underloaded:** Total load is below statutory minimum teaching expectations.
- Dedicated rosters for **Permanent Faculty** and **Visiting Faculty**.

### 🧩 3. Course Allocation & Section Grid
- Multi-section matrix supporting Morning and Evening shifts across BSCS, BSSE, and MSCS programs.
- Split component assignments (e.g., Theory assigned to Professor, Lab assigned to Lab Engineer/Lecturer).
- AI-assisted recommendation match scores based on faculty domain expertise.

### 🚨 4. Real-Time Conflict Detection Centre
- Automated detector scanning for:
  - **Faculty Double Booking:** Same instructor scheduled simultaneously across sections.
  - **Statutory Load Breaches:** Exceeding maximum allowable credit hours.
  - **Unassigned Core Offerings:** Missing theory or lab instructors before semester freeze.
  - **Shift / Room Conflicts:** Morning/Evening scheduling overlaps.
- One-click resolution and dynamic notification counters in the top navigation bar.

### 📖 5. Master Course Catalog & HEC Credit Parser
- Live interactive **HEC Credit Parser Widget** evaluating `Total(Theory,Lab)` formulas with real-time validation.
- Database persistence connected to PostgreSQL (`POST /api/v1/courses`, `DELETE /api/v1/courses/:id`).
- Tag-based required domain expertise mapping (e.g., `Data Structures`, `PostgreSQL`, `Distributed Systems`).

### 🗓️ 6. Academic Planning & Semester Offerings
- Multi-session management (`FA25`, `SP26`, `FA26`) with timeline tracking.
- Session freeze locks to prevent unauthorized modifications post-approval.

---

## 🏛️ System Architecture & Roles

```
                      ┌─────────────────────────────────────────┐
                      │        PostgreSQL / Supabase DB         │
                      │  (Faculty, Courses, Allocations, Logs)  │
                      └────────────────────┬────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │        Express.js REST APIs         │
                        │    (JWT Auth, RBAC, Workload Engine) │
                        └──────────────────┬──────────────────┘
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         │                                                                   │
┌────────▼────────────────────────┐                       ┌──────────────────▼─────────────────┐
│     HOD Command Portal          │                       │       Convener Workspace           │
│ - Full Executive Approvals      │                       │ - Propose Course Allocations       │
│ - Manage Courses & Faculty      │                       │ - View Workload & Directories      │
│ - Real-Time Policy Controller   │                       │ - Live Permission Sync Popup       │
│ - Session Lock / Unlock         │                       │ - Export Draft Reports             │
└─────────────────────────────────┘                       └────────────────────────────────────┘
```

---

## ⚖️ Statutory Workload Engine (HEC Guidelines)

| Academic Rank / Designation | Statutory Min Load | Statutory Max Load | Teaching Eligibility |
|---|---|---|---|
| **Professor** | `3.0 Cr` | `9.0 Cr` | Theory & Lab |
| **Associate Professor** | `6.0 Cr` | `12.0 Cr` | Theory & Lab |
| **Assistant Professor** | `9.0 Cr` | `12.0 Cr` | Theory & Lab |
| **Lecturer** | `12.0 Cr` | `15.0 Cr` | Theory & Lab |
| **Lab Engineer** | `12.0 Cr` | `18.0 Cr` | Lab Only |
| **Visiting Lecturer** | `3.0 Cr` | `6.0 Cr` | Theory & Lab (Max 2 Courses) |

> **Compliance Formula:** 
> - $\text{Total Load} = \text{Theory Hours} + \text{Lab Hours}$
> - $\text{Contact Hours} = \text{Theory Hours} + (\text{Lab Hours} \times 3)$
> - Status is **Balanced** if $\text{Min} \le \text{Total Load} \le \text{Max}$.

---

## ⚙️ How It Works

1. **Academic Session Setup:**
   The HOD sets the active academic semester (e.g., `FA25`) and verifies that course offerings and batch sections are unlocked for allocation.

2. **Curriculum & Faculty Synchronization:**
   The master course catalog (with HEC credit structure formulas) and faculty directory (with statutory credit caps) are loaded from PostgreSQL.

3. **Convener Allocation Proposals:**
   The Convener logs in, reviews active role permissions via the dynamic policy popup, and assigns faculty to course sections. The system scores candidate matches using faculty expertise tags.

4. **Automated Conflict Scanning:**
   As allocations are made, the Conflict Engine actively scans the matrix for double-bookings, credit overload breaches, and unassigned sections.

5. **HOD Executive Review & Approval:**
   The HOD reviews submitted allocation proposals, resolves remaining conflicts, grants final departmental sign-off, and applies the session freeze lock.

---

## 📸 Screenshots

<!-- 1. Landing Page & Role Selection -->
### 1. Landing Page & Role Authentication
<!-- Add Landing Page Screenshot -->
<img width="950" alt="Landing Page" src="https://github.com/user-attachments/assets/placeholder-landing.png" />

---

<!-- 2. HOD Dashboard & Live Metrics -->
### 2. HOD Command Dashboard & Live Metrics
<!-- Add Dashboard Screenshot -->
<img width="950" alt="Dashboard Command Centre" src="https://github.com/user-attachments/assets/placeholder-dashboard.png" />

---

<!-- 3. Convener Login & Dynamic Role Privileges Popup -->
### 3. Convener Portal & Real-Time Role Privileges Popup
<!-- Add Convener Permissions Popup Screenshot -->
<img width="950" alt="Convener Role Guidance Popup" src="https://github.com/user-attachments/assets/placeholder-convener-modal.png" />

---

<!-- 4. HOD Real-Time Policy Governance Manager -->
### 4. HOD Real-Time Policy Governance Manager
<!-- Add HOD Permissions Modal Screenshot -->
<img width="950" alt="HOD Policy Governance Manager" src="https://github.com/user-attachments/assets/placeholder-hod-policy.png" />

---

<!-- 5. Course Allocation Matrix & Section Grid -->
### 5. Course Allocation Matrix & Section Grid
<!-- Add Allocations Matrix Screenshot -->
<img width="950" alt="Allocation Matrix" src="https://github.com/user-attachments/assets/placeholder-allocations.png" />

---

<!-- 6. Master Course Catalog & HEC Credit Parser Widget -->
### 6. Master Course Catalog & HEC Credit Parser Widget
<!-- Add Courses Page Screenshot -->
<img width="950" alt="Course Catalog and Credit Parser" src="https://github.com/user-attachments/assets/placeholder-courses.png" />

---

<!-- 7. Faculty Directory & Statutory Workload Compliance -->
### 7. Faculty Directory & Workload Compliance Matrix
<!-- Add Faculty Directory Screenshot -->
<img width="950" alt="Faculty Workload Directory" src="https://github.com/user-attachments/assets/placeholder-faculty.png" />

---

<!-- 8. Real-Time Conflict Resolution Centre -->
### 8. Real-Time Conflict Resolution Centre
<!-- Add Conflict Centre Screenshot -->
<img width="950" alt="Conflict Detection Centre" src="https://github.com/user-attachments/assets/placeholder-conflicts.png" />

---

<!-- 9. Academic Planning & Semester Offerings -->
### 9. Academic Planning & Session Offerings
<!-- Add Planning Page Screenshot -->
<img width="950" alt="Academic Planning" src="https://github.com/user-attachments/assets/placeholder-planning.png" />

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 (Vite SPA)
- **State Management:** React Context API (`AppContext`) + LocalStorage Persistence Fallback
- **Icons & UI:** Lucide React, Tailwind CSS / Vanilla CSS Custom Design Tokens
- **Client Networking:** Fetch API with automatic token fallback & error boundaries

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Architecture:** MVC (Model-View-Controller) Pattern
- **Security:** Helmet, CORS, Rate Limiting, RBAC (`requireHOD`, `requireAuth`)
- **Database Client:** Supabase Admin Client / PostgreSQL

### Database
- **Database:** PostgreSQL (Cloud Supabase instance / Local Postgres)
- **Schema:** Relational schema with foreign key constraints, JSONB specializations, and triggers

---

## 📁 Project Structure

```
CS Course Allocation & Faculty Workload Management System/
├── backend/
│   ├── src/
│   │   ├── config/             # Database & Supabase configurations
│   │   ├── controllers/        # Express Route Controllers (Auth, Courses, Faculty, Allocations)
│   │   ├── middlewares/        # Authentication & Role verification middlewares
│   │   ├── routes/             # REST API Routes
│   │   ├── utils/              # Workload calculation engine, logger, response helpers
│   │   └── server.js           # Main backend entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── allocations/    # Allocation modals and assignment cards
│   │   │   ├── auth/           # LoginModal and role selection
│   │   │   ├── faculty/        # FacultyDetailModal and workload cards
│   │   │   ├── layout/         # Navbar, Sidebar, and mobile responsive menus
│   │   │   └── permissions/    # ConvenerPermissionsModal & HODPermissionsModal
│   │   ├── context/            # Global AppContext with reactive stores
│   │   ├── pages/              # Dashboard, Allocations, Courses, Faculty, Planning, Conflicts
│   │   ├── services/           # api.js client methods
│   │   ├── App.jsx             # Main Application Routing and Error Boundaries
│   │   └── main.jsx            # React root mount
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/
│   ├── schema.sql              # Core database relational schema
│   └── seed_hod.sql            # Seed dataset for faculty, courses, sessions, and roles
└── README.md
```

---

## 🚀 Getting Started & Installation

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**
- **PostgreSQL** or a free [Supabase](https://supabase.com) account

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/HAIDERW99/Web-Intern-FullStack.git
cd "CS Course Allocation & Faculty Workload Management System"
```

---

### Step 2: Backend Configuration & Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   npm install
   ```

2. Configure environment variables by creating `.env` in the `backend/` directory:
   ```env
   PORT=5000
   NODE_ENV=development
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-secure-jwt-secret-key-2026
   ```

3. Seed the PostgreSQL Database:
   - Run the SQL scripts from `database/schema.sql` and `database/seed_hod.sql` in your PostgreSQL or Supabase SQL Editor.

4. Start the backend server:
   ```bash
   npm run dev
   ```
   *Backend will start on `http://localhost:5000`*

---

### Step 3: Frontend Configuration & Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   npm install
   ```

2. Configure environment variables in `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *Frontend application will launch on `http://localhost:3000`*

---

## 🔑 Default Demo Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Head of Department (HOD)** | `haiderwahla199@gmail.com` | `HodSecure@2026!` | Full Executive Admin Authority |
| **BSCS Convener** | `convener.cs@university.edu` | `Convener@2026!` | Course Allocation & Drafting Scope |
| **Faculty Member** | `dr.amina@university.edu` | `Faculty@2026!` | Workload Matrix & Schedule View |

---

## 📡 API Endpoints Reference

### Authentication & Sessions
- `POST /api/v1/auth/login` — User authentication with JWT & RBAC payload.
- `GET /api/v1/academic/sessions` — Fetch list of academic sessions.
- `POST /api/v1/academic/sessions` — Create a new semester session *(HOD Only)*.
- `PATCH /api/v1/academic/sessions/:id/lock` — Freeze/Lock semester allocations *(HOD Only)*.

### Course Catalog Management
- `GET /api/v1/courses` — Retrieve all courses with credit structures and filter queries.
- `POST /api/v1/courses` — Add new course with HEC credit parsing *(HOD / Authorized)*.
- `DELETE /api/v1/courses/:id` — Remove course from catalog *(HOD / Authorized)*.

### Faculty & Workload
- `GET /api/v1/faculty` — List all permanent and visiting faculty members with loads.
- `POST /api/v1/faculty` — Register a new faculty profile with rank limits *(HOD / Authorized)*.
- `DELETE /api/v1/faculty/:id` — Delete faculty profile *(HOD / Authorized)*.
- `GET /api/v1/workload/summary/:session_id` — Real-time department workload metrics.

### Allocations & Conflict Scanner
- `GET /api/v1/allocations` — Get active course section allocations.
- `POST /api/v1/allocations` — Propose course assignment.
- `PATCH /api/v1/allocations/:id/approve` — Approve allocation *(HOD Only)*.
- `GET /api/v1/conflicts/scan` — Run real-time automated conflict scanner.

---

## 📄 License & Authors

Developed by **Haider Wahla** for the **CS Course Allocation & Faculty Workload Management System**.  
Licensed under the [MIT License](LICENSE).
