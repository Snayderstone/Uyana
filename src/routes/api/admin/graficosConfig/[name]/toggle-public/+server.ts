/**
 * Admin API - Toggle Chart Public Visibility
 * -------------------------------------------
 * POST /api/admin/graficosConfig/[name]/toggle-public
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminChartsRepository } from '$lib/db/admin/graficosConfig/chart.repository';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * POST - Toggle visibilidad pública de un gráfico
 */
export const POST: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { params } = event;
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

		console.log(`[AUDIT] ${usuario.email} post`);
		return json({
			success: true,
			data: updatedChart,
			message: `Gráfico ${updatedChart.es_publico ? 'publicado' : 'hecho privado'} exitosamente`
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
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
