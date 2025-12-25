/**
 * Admin API - Charts Configuration Endpoints
 * -------------------------------------------
 * GET    /api/admin/graficosConfig                    - Listar configuraciones
 * GET    /api/admin/graficosConfig/:name              - Obtener configuración específica
 * POST   /api/admin/graficosConfig/:name/toggle-public - Toggle visibilidad pública
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminChartsRepository } from '$lib/db/admin/graficosConfig/chart.repository';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * GET - Listar todas las configuraciones de gráficos
 * Query params:
 *   - category: filtrar por categoría (ej: "participantes", "proyectos")
 */
export const GET: RequestHandler = async (event) => {
	try {
		await requireAdmin(event);
		const { url } = event;
		const category = url.searchParams.get('category');
		let charts = await AdminChartsRepository.getAllChartConfigs();

		// Filtrar por categoría si se proporciona
		if (category) {
			if (category === 'proyectos') {
				// Para proyectos, excluimos los gráficos de participantes
				// Incluye: gráficos cuyo nombre empiece con 'proyectos_'
				charts = charts.filter((chart) => chart.nombre_grafico.startsWith('proyectos_'));
			} else if (category === 'participantes') {
				// Para participantes, filtramos por nombre_grafico que empiece con 'participantes_'
				charts = charts.filter((chart) => chart.nombre_grafico.startsWith('participantes_'));
			}
		}

		return json({
			success: true,
			data: charts
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
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
