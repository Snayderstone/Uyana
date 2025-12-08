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
	const redes = redesString
		.split('|')
		.map((red) => red.trim())
		.filter((red) => red.length > 0);

	return redes
		.map((red) => {
			// Limpiar la URL y asegurar que tenga protocolo
			let cleanUrl = red;

			// Si la URL no tiene protocolo, añadir https://
			if (
				!cleanUrl.startsWith('http://') &&
				!cleanUrl.startsWith('https://') &&
				!cleanUrl.startsWith('mailto:')
			) {
				// Para URLs que empiecen con HTTPS:// (mal formateadas)
				if (cleanUrl.toUpperCase().startsWith('HTTPS://')) {
					cleanUrl = cleanUrl.replace(/^HTTPS:\/\//i, 'https://');
				} else if (cleanUrl.includes('@') && !cleanUrl.includes('.')) {
					// Es un email sin dominio válido, omitir
					cleanUrl = `mailto:${cleanUrl}`;
				} else {
					cleanUrl = `https://${cleanUrl}`;
				}
			}

			// Detectar el tipo de red social desde la URL
			if (cleanUrl.includes('orcid.org')) {
				return { nombre: 'ORCID', url: cleanUrl };
			} else if (cleanUrl.includes('researchgate.net')) {
				return { nombre: 'ResearchGate', url: cleanUrl };
			} else if (cleanUrl.includes('academia.edu')) {
				return { nombre: 'Academia.edu', url: cleanUrl };
			} else if (cleanUrl.includes('facebook.com')) {
				return { nombre: 'Facebook', url: cleanUrl };
			} else if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
				return { nombre: 'Twitter', url: cleanUrl };
			} else if (cleanUrl.startsWith('mailto:')) {
				return { nombre: 'Email', url: cleanUrl };
			} else {
				// Tratar de extraer el dominio para otros casos
				try {
					const url = new URL(cleanUrl);
					const domain = url.hostname.replace('www.', '').split('.')[0];
					return { nombre: domain.charAt(0).toUpperCase() + domain.slice(1), url: cleanUrl };
				} catch {
					// Si falla, omitir esta URL
					return null;
				}
			}
		})
		.filter((red) => red !== null) as Array<{ nombre: string; url: string }>;
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
