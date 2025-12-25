/**
 * Admin API - Top Cargos Endpoint
 * --------------------------------
 * GET /api/admin/participants/top-cargos - Top cargos más frecuentes
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminParticipantsService } from '$lib/services/admin/participants/participants.service';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * GET - Obtener top cargos con distribución por género
 */
export const GET: RequestHandler = async (event) => {
	try {
		await requireAdmin(event);
		const { url } = event;
		const limit = parseInt(url.searchParams.get('limit') || '20');

		console.log(`📊 Obteniendo top ${limit} cargos...`);

		const data = await AdminParticipantsService.getTopCargos(limit);

		console.log(`✅ ${data.length} cargos obtenidos`);

		return json({
			success: true,
			data
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
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
