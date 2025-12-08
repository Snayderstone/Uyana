/**
 * Supabase Client
 * ----------------
 * Este archivo contiene ÚNICAMENTE la conexión a la base de datos.
 * Ninguna otra lógica debe ir aquí.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.PUBLIC_SUPABASE_URL || 'https://faakhgfnclqpmnfcmaqs.supabase.co';


const supabaseAnonKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYWtoZ2ZuY2xxcG1uZmNtYXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTkzMTUsImV4cCI6MjA3OTk5NTMxNX0.OrGjcBbc9omNdy3ADWoXztEcH1Q-4x6KFIqBpmC-G9g'; // TODAVÍA

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
