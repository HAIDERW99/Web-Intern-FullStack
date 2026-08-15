import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';

import { AppLayout } from '@components/layout/AppLayout';
import { AuthGuard } from './guards/AuthGuard';
import { RoleGuard } from './guards/RoleGuard';
import { GuestGuard } from './guards/GuestGuard';
import { Skeleton } from '@components/common/Skeleton';
import { ROUTES } from '@config/routes';
import { authService } from '@services/index';

// ── Lazy-loaded page components ──────────────────────────────────────────────

// Auth
const LoginPage          = lazy(() => import('@modules/auth/pages/LoginPage'));
const SignupPage         = lazy(() => import('@modules/auth/pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@modules/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('@modules/auth/pages/ResetPasswordPage'));
const UnauthorizedPage   = lazy(() => import('@modules/auth/pages/UnauthorizedPage'));

// Super Admin
const SuperAdminDashboard    = lazy(() => import('@modules/super-admin/pages/SuperAdminDashboard'));
const AdminsPage            = lazy(() => import('@modules/super-admin/pages/AdminsPage'));
const BranchesPage          = lazy(() => import('@modules/super-admin/pages/BranchesPage'));
const AuditLogsPage         = lazy(() => import('@modules/super-admin/pages/AuditLogsPage'));
const SuperAdminSettingsPage= lazy(() => import('@modules/super-admin/pages/SuperAdminSettingsPage'));


// Admin
const AdminDashboard   = lazy(() => import('@modules/admin/pages/AdminDashboard'));
const UsersPage        = lazy(() => import('@modules/admin/pages/UsersPage'));
const CoursesAdminPage = lazy(() => import('@modules/admin/pages/CoursesAdminPage'));
const ReportsPage      = lazy(() => import('@modules/admin/pages/ReportsPage'));

// Teacher
const TeacherDashboard  = lazy(() => import('@modules/teacher/pages/TeacherDashboard'));
const TeacherCoursesPage = lazy(() => import('@modules/teacher/pages/TeacherCoursesPage'));
const AttendancePage    = lazy(() => import('@modules/teacher/pages/AttendancePage'));
const AssignmentsPage   = lazy(() => import('@modules/teacher/pages/AssignmentsPage'));
const TeacherGradesPage = lazy(() => import('@modules/teacher/pages/TeacherGradesPage'));

// Student
const StudentDashboard       = lazy(() => import('@modules/student/pages/StudentDashboard'));
const StudentProfilePage     = lazy(() => import('@modules/student/pages/StudentProfilePage'));
const StudentCoursesPage     = lazy(() => import('@modules/student/pages/StudentCoursesPage'));
const StudentAssignmentsPage = lazy(() => import('@modules/student/pages/StudentAssignmentsPage'));

// Settings
const SettingsPage = lazy(() => import('@modules/settings/pages/SettingsPage'));

// 404
const NotFoundPage = lazy(() => import('@modules/auth/pages/NotFoundPage'));

// ── Loading fallback ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div
      className="flex h-full min-h-screen items-center justify-center"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="space-y-3 w-full max-w-sm px-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

/** Wraps any lazy component in a Suspense boundary. */
const wrap = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// ── Root layout — initialises Supabase auth listener once ────────────────────
/**
 * Rendered at the very top of the route tree so `initAuth()` runs exactly
 * once and the subscription is cleaned up when the app unmounts.
 */
function RootLayout() {
  useEffect(() => {
    const unsubscribe = authService.initAuth();
    return unsubscribe;
  // initAuth is module-level stable — safe to run once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Outlet />;
}

// ── Router definition ────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    // RootLayout wraps every route so initAuth() is called exactly once
    element: <RootLayout />,
    children: [

      // ── Guest-only routes (redirect away if already authenticated) ──────
      {
        element: <GuestGuard />,
        children: [
          { path: ROUTES.AUTH.LOGIN,           element: wrap(LoginPage)          },
          { path: ROUTES.AUTH.SIGNUP,          element: wrap(SignupPage)         },
          { path: ROUTES.AUTH.FORGOT_PASSWORD, element: wrap(ForgotPasswordPage) },
          { path: ROUTES.AUTH.RESET_PASSWORD,  element: wrap(ResetPasswordPage)  },
        ],
      },

      // ── Public error pages ─────────────────────────────────────────────
      { path: ROUTES.UNAUTHORIZED, element: wrap(UnauthorizedPage) },
      { path: ROUTES.NOT_FOUND,    element: wrap(NotFoundPage)     },

      // ── Authenticated + layout routes ──────────────────────────────────
      {
        element: <AuthGuard />,
        children: [
          {
            element: <AppLayout />,
            children: [
              // Root redirect: unauthenticated users go to login (handled by
              // AuthGuard above), authenticated users are sent to their dashboard
              // by GuestGuard. This catches any leftover "/" hits.
              { index: true, element: <Navigate to={ROUTES.AUTH.LOGIN} replace /> },

              // ── Super Admin ─────────────────────────────────────────────
              {
                element: <RoleGuard allowedRoles={['super_admin']} />,
                children: [
                  { path: ROUTES.SUPER_ADMIN.ROOT,      element: wrap(SuperAdminDashboard) },
                  { path: ROUTES.SUPER_ADMIN.DASHBOARD, element: wrap(SuperAdminDashboard) },
                  { path: ROUTES.SUPER_ADMIN.ADMINS,    element: wrap(AdminsPage)          },
                  { path: ROUTES.SUPER_ADMIN.BRANCHES,  element: wrap(BranchesPage)        },
                  { path: ROUTES.SUPER_ADMIN.LOGS,      element: wrap(AuditLogsPage)       },
                  { path: ROUTES.SUPER_ADMIN.SETTINGS,  element: wrap(SuperAdminSettingsPage) },
                ],
              },


              // ── Admin (super_admin can also impersonate admin views) ────
              {
                element: <RoleGuard allowedRoles={['admin', 'super_admin']} />,
                children: [
                  { path: ROUTES.ADMIN.DASHBOARD, element: wrap(AdminDashboard)   },
                  { path: ROUTES.ADMIN.USERS,     element: wrap(UsersPage)        },
                  { path: ROUTES.ADMIN.COURSES,   element: wrap(CoursesAdminPage) },
                  { path: ROUTES.ADMIN.REPORTS,   element: wrap(ReportsPage)      },
                ],
              },

              // ── Teacher ─────────────────────────────────────────────────
              {
                element: <RoleGuard allowedRoles={['teacher']} />,
                children: [
                  { path: ROUTES.TEACHER.DASHBOARD,   element: wrap(TeacherDashboard)   },
                  { path: ROUTES.TEACHER.COURSES,     element: wrap(TeacherCoursesPage)  },
                  { path: ROUTES.TEACHER.ATTENDANCE,  element: wrap(AttendancePage)     },
                  { path: ROUTES.TEACHER.ASSIGNMENTS, element: wrap(AssignmentsPage)    },
                  { path: ROUTES.TEACHER.GRADES,      element: wrap(TeacherGradesPage)  },
                ],
              },

              // ── Student ─────────────────────────────────────────────────
              {
                element: <RoleGuard allowedRoles={['student']} />,
                children: [
                  { path: ROUTES.STUDENT.DASHBOARD,    element: wrap(StudentDashboard)       },
                  { path: ROUTES.STUDENT.PROFILE,      element: wrap(StudentProfilePage)     },
                  { path: ROUTES.STUDENT.COURSES,      element: wrap(StudentCoursesPage)     },
                  { path: ROUTES.STUDENT.ASSIGNMENTS,  element: wrap(StudentAssignmentsPage) },
                ],
              },

              // ── Settings (all authenticated roles) ──────────────────────
              {
                element: <RoleGuard allowedRoles={['super_admin', 'admin', 'teacher', 'student']} />,
                children: [
                  { path: ROUTES.SETTINGS.ROOT, element: wrap(SettingsPage) },
                ],
              },
            ],
          },
        ],
      },

      // ── Catch-all ──────────────────────────────────────────────────────
      { path: '*', element: <Navigate to={ROUTES.NOT_FOUND} replace /> },
    ],
  },
]);
