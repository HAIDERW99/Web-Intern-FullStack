export const APP_NAME = 'AcademiaX';
export const APP_VERSION = '0.1.0';

/** Default pagination sizes available in dropdowns */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;

/** Debounce delay for search inputs (ms) */
export const SEARCH_DEBOUNCE_MS = 300;

/** Toast auto-dismiss duration (ms) */
export const TOAST_DURATION_MS = 5000;

/** Local-storage keys */
export const STORAGE_KEYS = {
  THEME: 'academia-x-theme',
  SIDEBAR_COLLAPSED: 'academia-x-sidebar-collapsed',
} as const;

/** Supabase storage bucket names */
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  SUBMISSIONS: 'submissions',
  COURSE_ASSETS: 'course-assets',
} as const;

/** Maximum file upload sizes in bytes */
export const MAX_FILE_SIZES = {
  AVATAR: 2 * 1024 * 1024,       // 2 MB
  SUBMISSION: 20 * 1024 * 1024,  // 20 MB
} as const;
