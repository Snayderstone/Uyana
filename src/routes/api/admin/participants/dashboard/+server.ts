/**
 * Admin API - Participants Dashboard Complete Endpoint
 * -----------------------------------------------------
 * GET /api/admin/participants/dashboard - Obtener todos los datos del dashboard en una llamada
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminParticipantsService } from '$lib/services/admin/participants/participants.service';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * GET - Obtener todos los datos del dashboard usando vistas materializadas
 * Retorna: stats, topFacultades, topCarreras, topCargos, topParticipantes, etc.
 */
export const GET: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		console.log(`[AUDIT] ${usuario.email} obtuvo dashboard de participantes`);

		const dashboardData = await AdminParticipantsService.getDashboardDataComplete();

		if (!dashboardData) {
			console.warn('⚠️ No se pudieron obtener datos del dashboard (vistas no disponibles)');
			return json(
				{
					success: false,
					message:
						'Las vistas materializadas no están disponibles. Ejecutar database/views_participantes.sql'
				},
				{ status: 503 }
			);
		}

		console.log('✅ Dashboard completo obtenido exitosamente');

		return json({
			success: true,
			data: dashboardData
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('❌ Error al obtener datos del dashboard:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener datos del dashboard',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
