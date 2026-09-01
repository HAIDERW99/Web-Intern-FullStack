import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// ── Auth ──────────────────────────────────────────────────────────────────
import LoginPage           from './pages/auth/LoginPage';
import AdminLoginPage      from './pages/auth/AdminLoginPage';
import RegisterPage        from './pages/auth/RegisterPage';
import ForgotPasswordPage  from './pages/auth/ForgotPasswordPage';
import AuthCallbackPage    from './pages/auth/AuthCallbackPage';

// ── Public / Guest pages ──────────────────────────────────────────────────
import ExplorePage         from './pages/ExplorePage';
import HotelDetailPage     from './pages/HotelDetailPage';
import ReservationsPage    from './pages/ReservationsPage';
import ProfilePage         from './pages/ProfilePage';

// ── Owner pages ───────────────────────────────────────────────────────────
import PropertiesPage      from './pages/PropertiesPage';
import EarningsPage        from './pages/EarningsPage';
import OwnerDashboard      from './pages/owner/OwnerDashboard';
import OwnerBookings       from './pages/owner/OwnerBookings';
import OwnerInventory      from './pages/owner/OwnerInventory';
import OwnerStaff          from './pages/owner/OwnerStaff';
import OwnerAnalytics      from './pages/owner/OwnerAnalytics';
import OwnerSettings       from './pages/owner/OwnerSettings';
import RegisterPropertyPage from './pages/owner/RegisterPropertyPage';

// ── Admin pages ───────────────────────────────────────────────────────────
import AdminDashboard  from './pages/admin/AdminDashboard';
import AdminBookings   from './pages/admin/AdminBookings';
import AdminInventory  from './pages/admin/AdminInventory';
import AdminStaff      from './pages/admin/AdminStaff';
import AdminAnalytics  from './pages/admin/AdminAnalytics';
import AdminSettings   from './pages/admin/AdminSettings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ── Auth ─────────────────────────────────────────── */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/admin/login"     element={<AdminLoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/callback"   element={<AuthCallbackPage />} />

          {/* ── Public ───────────────────────────────────────── */}
          <Route path="/"              element={<ExplorePage />} />
          <Route path="/properties"    element={<PropertiesPage />} />
          <Route path="/hotels/:id"    element={<HotelDetailPage />} />

          {/* ── Guest (customer / user) ───────────────────────── */}
          <Route path="/reservations" element={
            <ProtectedRoute allowedRoles={['customer', 'hotel_owner', 'admin']}>
              <ReservationsPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['customer', 'hotel_owner', 'admin']}>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* ── Owner ────────────────────────────────────────── */}
          <Route path="/owner/dashboard" element={<ProtectedRoute allowedRoles={['hotel_owner', 'admin']}><OwnerDashboard /></ProtectedRoute>} />
          <Route path="/owner/register-property" element={<ProtectedRoute allowedRoles={['hotel_owner', 'admin']}><RegisterPropertyPage /></ProtectedRoute>} />
          <Route path="/owner/bookings"  element={<ProtectedRoute allowedRoles={['hotel_owner', 'admin']}><OwnerBookings /></ProtectedRoute>} />
          <Route path="/owner/inventory" element={<ProtectedRoute allowedRoles={['hotel_owner', 'admin']}><OwnerInventory /></ProtectedRoute>} />
          <Route path="/owner/staff"     element={<ProtectedRoute allowedRoles={['hotel_owner', 'admin']}><OwnerStaff /></ProtectedRoute>} />
          <Route path="/owner/analytics" element={<ProtectedRoute allowedRoles={['hotel_owner', 'admin']}><OwnerAnalytics /></ProtectedRoute>} />
          <Route path="/owner/settings"  element={<ProtectedRoute allowedRoles={['hotel_owner', 'admin']}><OwnerSettings /></ProtectedRoute>} />
          <Route path="/owner/support"   element={<ProtectedRoute allowedRoles={['hotel_owner', 'admin']}><OwnerSettings /></ProtectedRoute>} />
          <Route path="/earnings" element={
            <ProtectedRoute allowedRoles={['hotel_owner', 'admin']}>
              <EarningsPage />
            </ProtectedRoute>
          } />

          {/* ── Admin ────────────────────────────────────────── */}
          <Route path="/admin/dashboard"  element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/bookings"   element={<ProtectedRoute allowedRoles={['admin']}><AdminBookings /></ProtectedRoute>} />
          <Route path="/admin/inventory"  element={<ProtectedRoute allowedRoles={['admin']}><AdminInventory /></ProtectedRoute>} />
          <Route path="/admin/staff"      element={<ProtectedRoute allowedRoles={['admin']}><AdminStaff /></ProtectedRoute>} />
          <Route path="/admin/analytics"  element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/settings"   element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/support"    element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />

          {/* ── Misc ─────────────────────────────────────────── */}
          <Route path="/unauthorized" element={
            <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
              <div className="text-center">
                <p className="text-4xl mb-3">🚫</p>
                <h1 className="text-xl font-semibold text-[#191c1e] mb-1">Access Denied</h1>
                <p className="text-sm text-[#45464d]">You don't have permission to view this page.</p>
              </div>
            </div>
          } />

          {/* ── Catch-all ────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
