import { useState, useCallback } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header     from "./components/Header";
import AuthModal  from "./components/modals/AuthModal";
import ProtectedRoute   from "./components/ProtectedRoute";
import HomePage         from "./pages/HomePage";
import BookingPage      from "./pages/BookingPage";
import AdminDashboard   from "./pages/AdminDashboard";
import TrackingPage     from "./pages/TrackingPage";
import EngineerDashboard from "./pages/EngineerDashboard";

// Routes that render their own full-page header — hide the global one
const NO_HEADER_ROUTES = ["/admin", "/engineer", "/book"];

function Layout() {
  const { pathname } = useLocation();

  // ── Auth modal state — lives here so any child can trigger it ──────────
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const openAuthModal  = useCallback(() => setAuthModalOpen(true),  []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  const hideHeader =
    NO_HEADER_ROUTES.some((r) => pathname.startsWith(r)) ||
    /^\/track\/.+/.test(pathname); // hide on /track/:jobId but NOT on /track (demo)

  return (
    <>
      {/* Global header — receives opener so Login button can fire the modal */}
      {!hideHeader && <Header onOpenAuth={openAuthModal} />}

      {/* Global AuthModal — mounted once at root, visible from every route */}
      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} />

      <Routes>
        <Route path="/"              element={<HomePage onOpenAuth={openAuthModal} />} />
        <Route path="/book"          element={<BookingPage />} />
        <Route path="/track"         element={<TrackingPage />} />
        <Route path="/track/:jobId"  element={<TrackingPage />} />

        {/* Admin — only role=admin */}
        <Route path="/admin"          element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/kanban"   element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/fleet"    element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/invoices" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />

        {/* Engineer — role=engineer or admin (admin can view engineer portal) */}
        <Route path="/engineer"       element={<ProtectedRoute allowedRoles={["engineer","admin"]}><EngineerDashboard /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*"              element={<HomePage onOpenAuth={openAuthModal} />} />
      </Routes>
    </>
  );
}

export default function App() {
  return <Layout />;
}
