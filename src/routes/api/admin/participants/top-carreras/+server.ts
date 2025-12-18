/**
 * Admin API - Top Carreras Endpoint
 * ----------------------------------
 * GET /api/admin/participants/top-carreras - Top carreras con más participantes
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminParticipantsService } from '$lib/services/admin/participants/participants.service';

/**
 * GET - Obtener top carreras con distribución por género
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '20');

		console.log(`📊 Obteniendo top ${limit} carreras...`);

		const data = await AdminParticipantsService.getTopCarreras(limit);

		console.log(`✅ ${data.length} carreras obtenidas`);

		return json({
			success: true,
			data
		});
	} catch (error) {
		console.error('❌ Error al obtener top carreras:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener top carreras',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
