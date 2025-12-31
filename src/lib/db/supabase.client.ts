/**
 * Supabase Client
 * ----------------
 * Este archivo contiene ÚNICAMENTE la conexión a la base de datos.
 * Ninguna otra lógica debe ir aquí.
 */

import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

// En el servidor, usar process.env; en el cliente, usar import.meta.env
const supabaseUrl = browser
	? import.meta.env.PUBLIC_SUPABASE_URL
	: process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;

const supabaseAnonKey = browser
	? import.meta.env.PUBLIC_SUPABASE_ANON_KEY
	: process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		'Faltan las variables de entorno de Supabase. Asegúrate de configurar PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY'
	);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
