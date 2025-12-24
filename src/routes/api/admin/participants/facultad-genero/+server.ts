/**
 * Admin API - Facultad × Género Endpoint
 * --------------------------------------
 * GET /api/admin/participants/facultad-genero - Distribución por facultad y género
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminParticipantsService } from '$lib/services/admin/participants/participants.service';

/**
 * GET - Obtener distribución de participantes por facultad y género
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '15');

		console.log(`📊 Obteniendo facultad × género (top ${limit})...`);

		const data = await AdminParticipantsService.getFacultadGenero(limit);

		console.log(`✅ ${data.length} facultades obtenidas`);

		return json({
			success: true,
			data
		});
	} catch (error) {
		console.error('❌ Error al obtener facultad × género:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener distribución facultad × género',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
