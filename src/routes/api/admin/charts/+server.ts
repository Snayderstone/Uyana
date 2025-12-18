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
 * Query params:
 *   - category: filtrar por categoría (ej: "participantes", "proyectos")
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const category = url.searchParams.get('category');
		let charts = await AdminChartsRepository.getAllChartConfigs();

		// Filtrar por categoría si se proporciona
		if (category) {
			charts = charts.filter(
				(chart) =>
					chart.nombre_grafico.startsWith(`${category}_`) ||
					chart.tab_categoria.startsWith(`${category}_`)
			);
		}

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
