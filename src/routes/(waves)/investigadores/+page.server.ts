// Directorio público de investigadores acreditados
import { PublicParticipantesRepository } from '$lib/db/public/participantes.repository';
import type { Investigador } from '$lib/models/investigator.model';

// Deshabilitar prerendering para esta página
export const prerender = false;
export const ssr = true;

// Caché en memoria de investigadores
let cachedInvestigadores: Investigador[] | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function load({ setHeaders }) {
	const now = Date.now();
	
	// Usar caché si está disponible y no ha expirado
	if (cachedInvestigadores && (now - lastFetch) < CACHE_DURATION) {
		// Configurar headers de caché para el navegador
		setHeaders({
			'Cache-Control': 'public, max-age=300, s-maxage=300',
			'CDN-Cache-Control': 'max-age=300'
		});
		
		return {
			investigadores: cachedInvestigadores
		};
	}
	
	// Obtener datos frescos de la base de datos
	const investigadores = await PublicParticipantesRepository.getAccreditedResearchers();
	
	// Actualizar caché
	cachedInvestigadores = investigadores;
	lastFetch = now;
	
	// Configurar headers de caché
	setHeaders({
		'Cache-Control': 'public, max-age=300, s-maxage=300',
		'CDN-Cache-Control': 'max-age=300'
	});

	return {
		investigadores
	};
}
