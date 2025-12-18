/**
 * Admin API - Participación Directiva por Género Endpoint
 * -------------------------------------------------------
 * GET /api/admin/participants/directiva-genero - Análisis de roles directivos por género
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminParticipantsService } from '$lib/services/admin/participants.service';

/**
 * GET - Obtener participación directiva por género
 */
export const GET: RequestHandler = async () => {
	try {
		console.log('📊 Obteniendo participación directiva por género...');

		const data = await AdminParticipantsService.getParticipacionDirectivaGenero();

		console.log(`✅ Datos de participación directiva obtenidos`);

		return json({
			success: true,
			data
		});
	} catch (error) {
		console.error('❌ Error al obtener participación directiva:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener participación directiva por género',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
