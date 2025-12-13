/**
 * Supabase Server Client
 * ----------------------
 * Cliente de Supabase para usar en el servidor (SSR, API routes)
 * Usa la Service Role Key para tener acceso completo
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vsdzamyjdxpcexakupyb.supabase.co';
const supabaseServiceKey =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzZHphbXlqZHhwY2V4YWt1cHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwMTA2NiwiZXhwIjoyMDgwNzc3MDY2fQ.VdQXDmj3mdDx8i74zAGPlvAGnxRiwmcgJG_8oOyPI5M';

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);
