/**
 * Admin API - Top Cargos Endpoint
 * --------------------------------
 * GET /api/admin/participants/top-cargos - Top cargos más frecuentes
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminParticipantsService } from '$lib/services/admin/participants.service';

/**
 * GET - Obtener top cargos con distribución por género
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '20');

		console.log(`📊 Obteniendo top ${limit} cargos...`);

		const data = await AdminParticipantsService.getTopCargos(limit);

		console.log(`✅ ${data.length} cargos obtenidos`);

		return json({
			success: true,
			data
		});
	} catch (error) {
		console.error('❌ Error al obtener top cargos:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener top cargos',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
