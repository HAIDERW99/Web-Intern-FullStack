import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { AllocationsPage } from './pages/AllocationsPage';
import { ConflictCentrePage } from './pages/ConflictCentrePage';
import { FacultyPage } from './pages/FacultyPage';
import { CoursesPage } from './pages/CoursesPage';
import { VisitingFacultyPage } from './pages/VisitingFacultyPage';
import { RemainingCoursesPage } from './pages/RemainingCoursesPage';
import { PlanningPage } from './pages/PlanningPage';
import { ImportExportPage } from './pages/ImportExportPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { ConvenerPermissionsModal } from './components/permissions/ConvenerPermissionsModal';
import { HODPermissionsModal } from './components/permissions/HODPermissionsModal';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

const MainLayout = () => {
  const { activeTab, isAuthenticated, toast } = useApp();

  // If user is not authenticated or explicitly navigated to landing page
  if (!isAuthenticated || activeTab === 'landing') {
    return <LandingPage />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'allocations':
        return <AllocationsPage />;
      case 'conflicts':
        return <ConflictCentrePage />;
      case 'faculty':
        return <FacultyPage />;
      case 'courses':
        return <CoursesPage />;
      case 'visiting':
        return <VisitingFacultyPage />;
      case 'remaining':
        return <RemainingCoursesPage />;
      case 'planning':
        return <PlanningPage />;
      case 'import-export':
        return <ImportExportPage />;
      case 'activity-log':
        return <ActivityLogPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Fixed Header with User Avatar Dropdown & Logout */}
      <Navbar />

      {/* Main Body with Sidebar and Active Screen */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar Navigation */}
        <Sidebar />

        {/* Dynamic Page Container */}
        <main className="flex-1 lg:pl-64 min-w-0 transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {renderActivePage()}
          </div>
        </main>
      </div>

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : toast.type === 'error'
              ? 'bg-red-900 text-red-100 border-red-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}>
            {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
            {toast.type === 'error' && <XCircle size={16} className="text-red-400" />}
            {toast.type === 'info' && <Info size={16} className="text-academic-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
      {/* Global Convener Role Guidance Modal */}
      <ConvenerPermissionsModal />

      {/* Global HOD Permissions Governance Modal */}
      <HODPermissionsModal />
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Exception caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center mb-4">
            <XCircle size={32} />
          </div>
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-academic-600 hover:bg-academic-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              Reset Session &amp; Reload
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
