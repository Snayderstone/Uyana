/**
 * Admin API - Top Facultades Endpoint
 * ------------------------------------
 * GET /api/admin/participants/top-facultades - Top facultades con más participantes
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminParticipantsService } from '$lib/services/admin/participants/participants.service';

/**
 * GET - Obtener top facultades con distribución por género
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '15');

		console.log(`📊 Obteniendo top ${limit} facultades...`);

		const data = await AdminParticipantsService.getTopFacultades(limit);

		console.log(`✅ ${data.length} facultades obtenidas`);

		return json({
			success: true,
			data
		});
	} catch (error) {
		console.error('❌ Error al obtener top facultades:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener top facultades',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
