import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SuperAdminHeader } from './SuperAdminHeader';
import { useAuthStore } from '@store/authStore';

/**
 * Root layout for all authenticated pages.
 * Dynamically switches layout for super_admin vs standard roles.
 */
export function AppLayout() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      {isSuperAdmin ? <SuperAdminSidebar /> : <Sidebar />}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {isSuperAdmin ? <SuperAdminHeader /> : <TopNavbar />}

        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-6 animate-fade-in"
          aria-label="Page content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

