/**
 * Admin API - Individual Chart Configuration
 * -------------------------------------------
 * GET    /api/admin/graficosConfig/[name]              - Obtener configuración específica
 * POST   /api/admin/graficosConfig/[name]/toggle-public - Toggle visibilidad pública
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminChartsRepository } from '$lib/db/admin/graficosConfig/chart.repository';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * GET - Obtener configuración de un gráfico específico
 */
export const GET: RequestHandler = async (event) => {
	try {
		await requireAdmin(event);
		const { params } = event;
		const chart = await AdminChartsRepository.getChartConfigByName(params.name!);

		if (!chart) {
			return json(
				{
					success: false,
					message: 'Gráfico no encontrado'
				},
				{ status: 404 }
			);
		}

		return json({
			success: true,
			data: chart
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al obtener configuración del gráfico:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener configuración del gráfico'
			},
			{ status: 500 }
		);
	}
};
