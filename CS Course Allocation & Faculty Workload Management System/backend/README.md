# CS Course Allocation & Faculty Workload Management System - Backend API

Production-ready Node.js & Express REST API powered by PostgreSQL (via Supabase SDK) for the CS Course Allocation & Faculty Workload Management System.

---

## 📁 Architecture & Folder Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── environment.js          # Validated environment settings
│   │   └── supabase.js             # Supabase Public & Admin client SDKs
│   ├── controllers/
│   │   ├── academicController.js   # Sessions, Programmes, Semesters, Sections
│   │   ├── activityLogController.js# System audit trail logs
│   │   ├── allocationController.js # Course allocations, pipeline & record locking
│   │   ├── authController.js       # Login, profile, and scope assignments
│   │   ├── conflictController.js   # Live scanning & conflict database sync
│   │   ├── courseController.js     # Master course catalog, offerings & credit parsing
│   │   ├── facultyController.js    # Faculty directory (Permanent & Visiting) CRUD
│   │   ├── recommendationController.js # Faculty candidate ranking for courses
│   │   └── workloadController.js   # Workload Engine & Allocation Simulation
│   ├── middlewares/
│   │   ├── authMiddleware.js       # JWT & Supabase session verification
│   │   ├── errorHandler.js         # Centralized error & 404 handlers
│   │   ├── roleMiddleware.js       # HOD vs Team Member RBAC
│   │   └── scopeMiddleware.js      # Granular Scope (Programme -> Semester -> Section)
│   ├── routes/
│   │   ├── academicRoutes.js
│   │   ├── allocationRoutes.js
│   │   ├── authRoutes.js
│   │   ├── conflictRoutes.js
│   │   ├── courseRoutes.js
│   │   ├── facultyRoutes.js
│   │   ├── logRoutes.js
│   │   ├── recommendationRoutes.js
│   │   ├── workloadRoutes.js
│   │   └── index.js                # Central router aggregator (/api/v1)
│   ├── utils/
│   │   ├── activityLogger.js       # Audit logger writing to `activity_logs` table
│   │   ├── apiResponse.js          # Standardized response envelopes
│   │   ├── conflictDetector.js     # Intelligent conflict & compliance scanner
│   │   ├── creditParser.js         # Parses credit strings like "3(2,1)" or "4(3,1)"
│   │   ├── recommendationEngine.js # Multi-factor ranking algorithm (0 - 100%)
│   │   └── workloadEngine.js       # Real-time workload & dynamic status calculation
│   ├── app.js                      # Express middleware stack & route mounting
│   └── server.js                   # Server bootstrap & graceful shutdown
├── .env.example
├── package.json
└── README.md
```

---

## 🧠 Intelligent Business Logic Engines

### 1. Recommendation Engine (`src/utils/recommendationEngine.js`)
When assigning a course, ranks all faculty candidates and generates a percentage match score ($0-100\%$) based on:
* **Previous Experience (35%)**: Historical frequency of teaching the course code across past and current semesters.
* **Domain & Specialization Alignment (35%)**: Semantic keyword overlap between course curriculum title/department and faculty specialization array.
* **Workload Capacity (30%)**: Remaining credit hours, underload prioritization, and preparation cap limits ($P_{\text{current}} < P_{\text{max}}$).
* **Endpoint**: `POST /api/v1/recommendations/course`

### 2. Conflict & Compliance Scanner (`src/utils/conflictDetector.js`)
Audits all allocations in an academic session and flags:
* 🔴 **Faculty Overload**: Load exceeds designation ceiling in `workload_rules`.
* 🔴 **Duplicate Allocations**: Double-assignment of section, course, or component.
* 🟡 **Lab Eligibility Mismatch**: Senior research professors assigned to standard lab demonstrations without lab suitability.
* 🟡 **Underloaded Faculty**: Full-time faculty below minimum quota.
* 🔵 **Unallocated Offerings**: Active course offerings that have no teacher assigned.
* 🔴 **Visiting Contract Exceeded**: Visiting faculty assigned beyond `max_course_limit`.
* **Endpoints**: `GET /api/v1/conflicts/scan` (live audit) & `POST /api/v1/conflicts/sync` (persist to database).

### 3. Allocation Approval Pipeline & Record Locking
* **Workflow**: `draft` $\rightarrow$ `under_review` $\rightarrow$ `approved` (or `rejected`).
* **🔒 Record Locking**: Once an allocation is marked `approved` by the HOD, it is strictly locked. Team Members cannot edit or delete it; only the HOD can modify or re-draft approved records.
* **Endpoints**:
  * `PATCH /api/v1/allocations/:id/submit`: Team Member submits draft for review.
  * `PATCH /api/v1/allocations/:id/approve`: HOD approves allocation (locks record).
  * `PATCH /api/v1/allocations/:id/reject`: HOD rejects allocation with reason.
  * `POST /api/v1/allocations/bulk-status`: Batch submit or batch approve allocations.

---

## 📋 Comprehensive API Route Reference

| Method | Endpoint | Description | Access Level |
| :--- | :--- | :--- | :--- |
| **Auth & Profiles** | | | |
| `POST` | `/api/v1/auth/login` | Authenticate user & get JWT token | Public |
| `GET` | `/api/v1/auth/me` | Fetch active user profile & assigned scopes | Authenticated |
| `POST` | `/api/v1/auth/assign-scope` | Assign granular scope to team member | **HOD / Admin** |
| **Recommendation Engine** | | | |
| `POST` | `/api/v1/recommendations/course` | Rank faculty for course allocation | Authenticated |
| **Conflict & Compliance Scanner** | | | |
| `GET` | `/api/v1/conflicts/scan` | Live audit of all session conflicts & gaps | Authenticated |
| `POST` | `/api/v1/conflicts/sync` | Persist detected conflicts into DB | Convener / HOD |
| `GET` | `/api/v1/conflicts` | Query persisted conflicts from DB | Authenticated |
| `PATCH` | `/api/v1/conflicts/:id/resolve` | Mark conflict as resolved | Convener / HOD |
| **Allocation Approval Pipeline** | | | |
| `POST` | `/api/v1/allocations` | Create draft course allocation | Scope-Protected |
| `PUT` | `/api/v1/allocations/:id` | Update allocation (Locked if Approved) | Scope-Protected |
| `PATCH` | `/api/v1/allocations/:id/submit` | Submit draft allocation for HOD review | Scope-Protected |
| `PATCH` | `/api/v1/allocations/:id/approve` | Final sign-off & record lock | **HOD Only** |
| `PATCH` | `/api/v1/allocations/:id/reject` | Reject allocation with feedback reason | **HOD Only** |
| `POST` | `/api/v1/allocations/bulk-status` | Batch update allocation status | Role-Protected |
| `DELETE` | `/api/v1/allocations/:id` | Delete allocation (Locked if Approved) | Scope-Protected |
| `GET` | `/api/v1/allocations` | Query allocations with filters | Authenticated |
| `GET` | `/api/v1/allocations/grid` | Full section allocation view | Authenticated |
| `GET` | `/api/v1/allocations/:id/history` | Audit trail of allocation edits | Authenticated |
| **Faculty & Workload** | | | |
| `GET` | `/api/v1/faculty` | Get faculty list with filters | Authenticated |
| `GET` | `/api/v1/faculty/:id` | Get faculty details & allocations | Authenticated |
| `POST` | `/api/v1/faculty` | Create faculty (Permanent / Visiting) | **HOD / Admin** |
| `PUT` | `/api/v1/faculty/:id` | Update faculty profile & contract | **HOD / Admin** |
| `DELETE` | `/api/v1/faculty/:id` | Deactivate/delete faculty | **HOD / Admin** |
| `GET` | `/api/v1/workload/faculty/:id` | Real-time workload & status | Authenticated |
| `GET` | `/api/v1/workload/summary` | Department-wide workload overview | Authenticated |
| `POST` | `/api/v1/workload/simulate` | Simulate course allocation impact | Authenticated |
| **Course Catalog** | | | |
| `GET` | `/api/v1/courses` | Get courses with formatted credits | Authenticated |
| `GET` | `/api/v1/courses/:id` | Get single course & offerings | Authenticated |
| `POST` | `/api/v1/courses` | Create course (supports credit strings) | **HOD / Admin** |
| `PUT` | `/api/v1/courses/:id` | Update course details | **HOD / Admin** |
| `DELETE` | `/api/v1/courses/:id` | Delete unallocated course | **HOD / Admin** |
| `POST` | `/api/v1/courses/parse-credits`| Test & preview credit string parsing | Authenticated |
