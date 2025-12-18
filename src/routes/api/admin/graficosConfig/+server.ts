/**
 * Admin API - Charts Configuration Endpoints
 * -------------------------------------------
 * GET    /api/admin/graficosConfig                    - Listar configuraciones
 * GET    /api/admin/graficosConfig/:name              - Obtener configuración específica
 * POST   /api/admin/graficosConfig/:name/toggle-public - Toggle visibilidad pública
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminChartsRepository } from '$lib/db/admin/graficosConfig/chart.repository';

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
			if (category === 'proyectos') {
				// Para proyectos, excluimos los gráficos de participantes
				// Incluye: overview, presupuesto, y cualquier otro tab_categoria que no sea de participantes
				charts = charts.filter((chart) => !chart.tab_categoria.startsWith('participantes_'));
			} else if (category === 'participantes') {
				// Para participantes, filtramos por tab_categoria que empiece con 'participantes_'
				charts = charts.filter((chart) => chart.tab_categoria.startsWith('participantes_'));
			}
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
