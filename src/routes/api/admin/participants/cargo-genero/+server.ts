/**
 * Admin API - Cargo × Género Endpoint
 * ------------------------------------
 * GET /api/admin/participants/cargo-genero - Distribución por cargo y género
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminParticipantsService } from '$lib/services/admin/participants.service';

/**
 * GET - Obtener distribución de asignaciones por cargo y género
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '10');

		console.log(`📊 Obteniendo cargo × género (top ${limit})...`);

		const data = await AdminParticipantsService.getCargoGenero(limit);

		console.log(`✅ ${data.length} cargos obtenidos`);

		return json({
			success: true,
			data
		});
	} catch (error) {
		console.error('❌ Error al obtener cargo × género:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener distribución cargo × género',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
