/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_URL?: string;

  // Super Admin seed credentials (DEV only)
  readonly VITE_SUPER_ADMIN_NAME?: string;
  readonly VITE_SUPER_ADMIN_EMAIL?: string;
  readonly VITE_SUPER_ADMIN_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
