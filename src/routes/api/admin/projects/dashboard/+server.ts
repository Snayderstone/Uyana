/**
 * Analytics API Endpoint
 * ----------------------
 * GET /api/admin/analytics - Obtener todas las estadísticas de analytics
 * GET /api/admin/analytics/refresh - Refrescar vistas materializadas
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '../dashboard/$types';
import { AnalyticsRepository } from '$lib/db/admin/projects/dashboardProjects.repository';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * GET - Obtener todas las estadísticas de analytics
 */
export const GET: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const analytics = await AnalyticsRepository.getDashboardAnalytics();

		return json({
			success: true,
			data: analytics
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error fetching analytics:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener las estadísticas de analytics'
			},
			{ status: 500 }
		);
	}
};
