import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase - Usando variables de entorno
const supabaseUrl =
	import.meta.env.PUBLIC_SUPABASE_URL || 'https://vsnmjaarlfqkxdfghfkp.supabase.co';
const supabaseAnonKey =
	import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzbm1qYWFybGZxa3hkZmdoZmtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTUzNDQsImV4cCI6MjA3MTI5MTM0NH0.8P9ez7hgvdSrZFa5YR-YnCiEh8VIzixBWMDT2mD_q0s';

// Crear un cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipo para los investigadores
export type Investigador = {
	id: number;
	foto: string;
	nombre: string;
	email: string;
	linea_investigacion: string;
	facultad: string;
	redes: string;
	// Propiedades calculadas para la interfaz
	redesArray?: Array<{ nombre: string; url: string }>;
};

// Función para procesar las redes sociales
export function procesarRedes(redesString: string): Array<{ nombre: string; url: string }> {
	if (!redesString) return [];

	// Dividir por el separador pipe
	const redes = redesString.split('|').map((red) => red.trim());

	return redes.map((red) => {
		// Detectar el tipo de red social desde la URL
		if (red.includes('orcid.org')) {
			return { nombre: 'ORCID', url: red };
		} else if (red.includes('researchgate.net')) {
			return { nombre: 'ResearchGate', url: red };
		} else if (red.includes('facebook.com')) {
			return { nombre: 'Facebook', url: red };
		} else if (red.includes('twitter.com') || red.includes('x.com')) {
			return { nombre: 'Twitter', url: red };
		} else if (red.includes('@') && !red.includes('http')) {
			// Es un correo
			return { nombre: 'Email', url: `mailto:${red}` };
		} else {
			// Tratar de extraer el dominio para otros casos
			try {
				const url = new URL(red);
				const domain = url.hostname.replace('www.', '').split('.')[0];
				return { nombre: domain.charAt(0).toUpperCase() + domain.slice(1), url: red };
			} catch {
				return { nombre: 'Web', url: red };
			}
		}
	});
}

// Función para obtener todos los investigadores
export async function obtenerInvestigadores(): Promise<Investigador[]> {
	const { data, error } = await supabase.from('investigadores_uce_def').select('*');

	if (error) {
		console.error('Error al obtener investigadores:', error);
		return [];
	}

	// Procesamos las redes sociales para cada investigador
	return data.map((investigador: Investigador) => ({
		...investigador,
		redesArray: procesarRedes(investigador.redes)
	}));
}
