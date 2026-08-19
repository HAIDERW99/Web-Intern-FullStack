import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://iuvykwbgixplgtzghjnu.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dnlrd2JnaXhwbGd0emdoam51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4OTY3NTcsImV4cCI6MjEwMjQ3Mjc1N30.Xs1Cki5ByW79GGNouxY9VzfsbBAmqEFIuNS3PW7XhoY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
