/**
 * Analytics Refresh API Endpoint
 * -------------------------------
 * POST /api/admin/analytics/refresh - Refrescar todas las vistas materializadas
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AnalyticsRepository } from '$lib/db/admin/projects/dashboardProjects.repository';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * POST - Refrescar todas las vistas materializadas
 * NOTA: Esta operación puede tardar varios segundos
 */
export const POST: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const startTime = Date.now();

		await AnalyticsRepository.refreshAllViews();

		const duration = Date.now() - startTime;

		console.log(`[AUDIT] ${usuario.email} actualizó vistas materializadas (${duration}ms)`);
		return json({
			success: true,
			message: 'Vistas materializadas actualizadas correctamente',
			duration_ms: duration
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error refreshing analytics views:', error);
		return json(
			{
				success: false,
				message: 'Error al actualizar las vistas materializadas'
			},
			{ status: 500 }
		);
	}
};
