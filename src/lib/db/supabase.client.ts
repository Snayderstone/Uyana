/**
 * Supabase Client
 * ----------------
 * Este archivo contiene ÚNICAMENTE la conexión a la base de datos.
 * Ninguna otra lógica debe ir aquí.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
