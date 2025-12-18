/**
 * Admin API - Top Participantes por Proyectos Endpoint
 * ----------------------------------------------------
 * GET /api/admin/participants/top-investigadores - Top participantes con más proyectos
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminParticipantsService } from '$lib/services/admin/participants/participants.service';

/**
 * GET - Obtener top participantes con más proyectos
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '20');

		console.log(`📊 Obteniendo top ${limit} investigadores...`);

		const data = await AdminParticipantsService.getTopParticipantesProyectos(limit);

		console.log(`✅ ${data.length} investigadores obtenidos`);

		return json({
			success: true,
			data
		});
	} catch (error) {
		console.error('❌ Error al obtener top investigadores:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener top investigadores',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
