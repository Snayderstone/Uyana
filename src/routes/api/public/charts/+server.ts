/**
 * Public API - Public Charts Data
 * --------------------------------
 * GET /api/public/charts - Retorna solo gráficos marcados como públicos
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminChartsRepository } from '$lib/db/admin/graficosConfig/chart.repository';
import { AdminProjectsService } from '$lib/services/admin/projects/projects.service';

/**
 * GET - Obtener gráficos públicos con datos
 */
export const GET: RequestHandler = async () => {
	try {
		// Obtener configuraciones de gráficos públicos
		const publicCharts = await AdminChartsRepository.getPublicChartConfigs();

		// Obtener datos de proyectos para los gráficos
		const projectsResult = await AdminProjectsService.listProjects(1, 9999, {});
		const stats = await AdminProjectsService.getProjectStats();

		return json({
			success: true,
			data: {
				charts: publicCharts,
				projectsData: {
					stats,
					projects: projectsResult.data
				}
			}
		});
	} catch (error) {
		console.error('Error al obtener gráficos públicos:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener gráficos públicos'
			},
			{ status: 500 }
		);
	}
};
