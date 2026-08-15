import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  FileText,
  BarChart3,
  Settings,
  UserCircle,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from './routes';
import type { UserRole } from '@/types/auth.types';

export interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Which roles can see this item */
  roles: UserRole[];
  /** Nested items */
  children?: MenuItem[];
}

export const MENU_ITEMS: MenuItem[] = [
  // ── Super Admin ──────────────────────────────────────────
  {
    label: 'Dashboard',
    href: ROUTES.SUPER_ADMIN.DASHBOARD,
    icon: LayoutDashboard,
    roles: ['super_admin'],
  },
  {
    label: 'Admin Management',
    href: ROUTES.SUPER_ADMIN.ADMINS,
    icon: Users,
    roles: ['super_admin'],
  },
  {
    label: 'Institutes & Branches',
    href: ROUTES.SUPER_ADMIN.BRANCHES,
    icon: GraduationCap,
    roles: ['super_admin'],
  },
  {
    label: 'Audit & System Logs',
    href: ROUTES.SUPER_ADMIN.LOGS,
    icon: BarChart3,
    roles: ['super_admin'],
  },
  {
    label: 'Global Settings',
    href: ROUTES.SUPER_ADMIN.SETTINGS,
    icon: Settings,
    roles: ['super_admin'],
  },


  // ── Admin ────────────────────────────────────────────────
  {
    label: 'Dashboard',
    href: ROUTES.ADMIN.DASHBOARD,
    icon: LayoutDashboard,
    roles: ['admin'],
  },
  {
    label: 'User Management',
    href: ROUTES.ADMIN.USERS,
    icon: Users,
    roles: ['admin'],
  },
  {
    label: 'Courses',
    href: ROUTES.ADMIN.COURSES,
    icon: BookOpen,
    roles: ['admin'],
  },
  {
    label: 'Reports',
    href: ROUTES.ADMIN.REPORTS,
    icon: BarChart3,
    roles: ['admin'],
  },

  // ── Teacher ──────────────────────────────────────────────
  {
    label: 'Dashboard',
    href: ROUTES.TEACHER.DASHBOARD,
    icon: LayoutDashboard,
    roles: ['teacher'],
  },
  {
    label: 'My Courses',
    href: ROUTES.TEACHER.COURSES,
    icon: BookOpen,
    roles: ['teacher'],
  },
  {
    label: 'Attendance',
    href: ROUTES.TEACHER.ATTENDANCE,
    icon: CalendarCheck,
    roles: ['teacher'],
  },
  {
    label: 'Assignments',
    href: ROUTES.TEACHER.ASSIGNMENTS,
    icon: ClipboardList,
    roles: ['teacher'],
  },
  {
    label: 'Grades',
    href: ROUTES.TEACHER.GRADES,
    icon: FileText,
    roles: ['teacher'],
  },

  // ── Student ──────────────────────────────────────────────
  {
    label: 'Dashboard',
    href: ROUTES.STUDENT.DASHBOARD,
    icon: LayoutDashboard,
    roles: ['student'],
  },
  {
    label: 'My Courses',
    href: ROUTES.STUDENT.COURSES,
    icon: GraduationCap,
    roles: ['student'],
  },
  {
    label: 'Assignments',
    href: ROUTES.STUDENT.ASSIGNMENTS,
    icon: ClipboardList,
    roles: ['student'],
  },
  {
    label: 'My Profile',
    href: ROUTES.STUDENT.PROFILE,
    icon: UserCircle,
    roles: ['student'],
  },

  // ── Shared ───────────────────────────────────────────────
  {
    label: 'Settings',
    href: ROUTES.SETTINGS.ROOT,
    icon: Settings,
    roles: ['admin', 'teacher', 'student'],
  },
];
