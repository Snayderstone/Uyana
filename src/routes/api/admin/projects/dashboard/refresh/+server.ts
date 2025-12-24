/**
 * Analytics Refresh API Endpoint
 * -------------------------------
 * POST /api/admin/analytics/refresh - Refrescar todas las vistas materializadas
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AnalyticsRepository } from '$lib/db/admin/projects/dashboardProjects.repository';

/**
 * POST - Refrescar todas las vistas materializadas
 * NOTA: Esta operación puede tardar varios segundos
 */
export const POST: RequestHandler = async () => {
	try {
		const startTime = Date.now();

		await AnalyticsRepository.refreshAllViews();

		const duration = Date.now() - startTime;

		return json({
			success: true,
			message: 'Vistas materializadas actualizadas correctamente',
			duration_ms: duration
		});
	} catch (error) {
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
