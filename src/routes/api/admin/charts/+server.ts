/**
 * Admin API - Charts Configuration Endpoints
 * -------------------------------------------
 * GET    /api/admin/charts                    - Listar configuraciones
 * GET    /api/admin/charts/:name              - Obtener configuración específica
 * POST   /api/admin/charts/:name/toggle-public - Toggle visibilidad pública
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminChartsRepository } from '$lib/db/admin/charts.repository';

/**
 * GET - Listar todas las configuraciones de gráficos
 */
export const GET: RequestHandler = async () => {
	try {
		const charts = await AdminChartsRepository.getAllChartConfigs();

		return json({
			success: true,
			data: charts
		});
	} catch (error) {
		console.error('Error al obtener configuraciones de gráficos:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener configuraciones de gráficos'
			},
			{ status: 500 }
		);
	}
};
