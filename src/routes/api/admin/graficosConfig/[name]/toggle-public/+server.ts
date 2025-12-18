/**
 * Admin API - Toggle Chart Public Visibility
 * -------------------------------------------
 * POST /api/admin/graficosConfig/[name]/toggle-public
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminChartsRepository } from '$lib/db/admin/graficosConfig/chart.repository';

/**
 * POST - Toggle visibilidad pública de un gráfico
 */
export const POST: RequestHandler = async ({ params }) => {
	try {
		const updatedChart = await AdminChartsRepository.togglePublicVisibility(params.name!);

		if (!updatedChart) {
			return json(
				{
					success: false,
					message: 'Gráfico no encontrado o error al actualizar'
				},
				{ status: 404 }
			);
		}

		return json({
			success: true,
			data: updatedChart,
			message: `Gráfico ${updatedChart.es_publico ? 'publicado' : 'hecho privado'} exitosamente`
		});
	} catch (error) {
		console.error('Error al toggle visibilidad del gráfico:', error);
		return json(
			{
				success: false,
				message: 'Error al actualizar visibilidad del gráfico'
			},
			{ status: 500 }
		);
	}
};
