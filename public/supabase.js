// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://bpigsoahqafsieyvcoru.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaWdzb2FocWFmc2lleXZjb3J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NTM3ODcsImV4cCI6MjA2NzUyOTc4N30.LVtVzQbnxgon_WpJg-mvalzgmMCDCHraLl3TAOJdAiI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});
