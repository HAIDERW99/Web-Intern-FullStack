# CS Course Allocation & Faculty Workload Command Centre - Frontend

Ultra-responsive, minimal, and academic **Blue and White** themed Single Page Application built with **React (Vite)** and **Tailwind CSS**.

---

## 🎨 Design System & Theme
* **Color Palette**:
  * Primary Academic Blue (`#026ec7`, `#0c8be9`, `#0a1e3b`) for headers, primary actions, active navigational states, and progress indicators.
  * Clean White (`#ffffff`) and Slate (`#f8fafc`) backgrounds for maximum contrast and readability.
* **Typography**: Inter / JetBrains Mono font family.

---

## 📱 Responsive Layout & Navigation
* **Desktop Sidebar**: Fixed 64-width navigation with badge counters for unresolved conflicts and remaining unassigned sections.
* **Mobile Drawer**: Responsive backdrop drawer with hamburger navigation.
* **Header / Navbar**:
  * Real-time Session Tracker (e.g. `FA25 - Fall 2025`).
  * Role Switcher Toggle: Quick demo toggle between **HOD Mode** (full approval authority) and **Convener Mode** (scope-restricted).
  * Quick conflict bell trigger and user avatar.

---

## 🏛️ HOD Command Centre Features
1. **Top Clickable Stat Cards**:
   * Faculty Strength (Permanent vs Visiting).
   * Allocation Progress (Allocated vs Remaining Sections).
   * Policy Conflicts (Critical Overload vs Warnings).
   * Department Workload Health (% Optimal).
2. **Programme Progress Cards**:
   * Dynamic progress bars for **BSCS**, **BSSE**, and **MSCS** with semester counts and completion badges.
3. **Faculty Capacity vs Teaching Demand**:
   * Visual dual-distribution comparison of permanent faculty capacity (in credit hours) vs visiting instructor requirement.
4. **Workload Summary Breakdown**:
   * 4-tier distribution: `Underloaded`, `Balanced`, `Near Maximum`, `Overloaded`.
5. **Interactive Core Modules**:
   * Course Allocation Grid & Approval Pipeline.
   * Policy Conflict Auditor with 1-click scan and resolution.
   * Master Course Catalog with interactive credit string parsing widget.
   * Visiting Faculty Contract and Rate Tracker.

---

## 🚀 How to Run Locally

1. Open a new terminal in the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.
