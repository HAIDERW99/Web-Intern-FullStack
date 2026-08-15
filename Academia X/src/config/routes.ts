/**
 * Centralised route path registry.
 * Use these constants in <Link to={ROUTES.ADMIN.DASHBOARD} /> and
 * navigate(ROUTES.AUTH.LOGIN) so path strings live in one place.
 */
export const ROUTES = {
  // Public / Auth
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Error pages
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '/404',

  // Super Admin module
  SUPER_ADMIN: {
    ROOT: '/super-admin',
    DASHBOARD: '/super-admin/dashboard',
    ADMINS: '/super-admin/admins',
    BRANCHES: '/super-admin/branches',
    LOGS: '/super-admin/logs',
    SETTINGS: '/super-admin/settings',
  },


  // Admin module
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    USER_DETAIL: (id = ':id') => `/admin/users/${id}`,
    COURSES: '/admin/courses',
    COURSE_DETAIL: (id = ':id') => `/admin/courses/${id}`,
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
  },

  // Teacher module
  TEACHER: {
    ROOT: '/teacher',
    DASHBOARD: '/teacher/dashboard',
    COURSES: '/teacher/courses',
    COURSE_DETAIL: (id = ':id') => `/teacher/courses/${id}`,
    ATTENDANCE: '/teacher/attendance',
    ASSIGNMENTS: '/teacher/assignments',
    GRADES: '/teacher/grades',
  },

  // Student module
  STUDENT: {
    ROOT: '/student',
    DASHBOARD: '/student/dashboard',
    COURSES: '/student/courses',
    COURSE_DETAIL: (id = ':id') => `/student/courses/${id}`,
    ASSIGNMENTS: '/student/assignments',
    SUBMISSIONS: '/student/submissions',
    PROFILE: '/student/profile',
  },

  // Shared settings
  SETTINGS: {
    ROOT: '/settings',
    PROFILE: '/settings/profile',
    SECURITY: '/settings/security',
    APPEARANCE: '/settings/appearance',
    NOTIFICATIONS: '/settings/notifications',
  },
} as const;
