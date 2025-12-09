/**
 * Supabase Client
 * ----------------
 * Este archivo contiene ÚNICAMENTE la conexión a la base de datos.
 * Ninguna otra lógica debe ir aquí.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.PUBLIC_SUPABASE_URL || 'https://vsdzamyjdxpcexakupyb.supabase.co';


const supabaseAnonKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzZHphbXlqZHhwY2V4YWt1cHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDEwNjYsImV4cCI6MjA4MDc3NzA2Nn0.M3gvvoKz3W_ecamYBCFFND_yjs-EbtMP5DvUe4ADhJc'; // TODAVÍA

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
