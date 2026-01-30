/**
 * API Endpoint - Public Researchers Directory
 * --------------------------------------------
 * Endpoint público para obtener el directorio de investigadores acreditados.
 * Soporta búsqueda por nombre, carrera o línea de investigación.
 */

import { json } from '@sveltejs/kit';
import { PublicParticipantesRepository } from '$lib/db/public/participantes.repository';
import type { RequestEvent } from '@sveltejs/kit';

// Deshabilitar prerendering para contenido dinámico
export const prerender = false;

/**
 * GET /api/public/investigadores
 * Obtiene el directorio de investigadores acreditados
 * 
 * Query params:
 * - search: término de búsqueda (opcional)
 */
export async function GET({ url, setHeaders }: RequestEvent) {
	// Configurar headers para evitar cache
	setHeaders({
		'Cache-Control': 'public, s-maxage=300, max-age=60, must-revalidate',
		'CDN-Cache-Control': 'max-age=300'
	});

	try {
		const searchTerm = url.searchParams.get('search');

		let investigadores;
		if (searchTerm && searchTerm.trim() !== '') {
			investigadores = await PublicParticipantesRepository.searchAccreditedResearchers(searchTerm);
		} else {
			investigadores = await PublicParticipantesRepository.getAccreditedResearchers();
		}

		return json({
			success: true,
			data: investigadores,
			total: investigadores.length,
			searchTerm: searchTerm || null
		});
	} catch (error) {
		console.error('Error en endpoint de investigadores:', error);
		return json(
			{
				success: false,
				error: 'Error al obtener investigadores',
				data: [],
				total: 0
			},
			{ status: 500 }
		);
	}
}
