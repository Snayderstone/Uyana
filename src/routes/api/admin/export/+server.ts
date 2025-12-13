/**
 * Admin API - Export Projects Endpoint
 * -------------------------------------
 * GET    /api/admin/export            - Exportar proyectos a formato plano (JSON)
 *
 * Query params:
 * - ids: string (comma-separated project IDs, opcional)
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminImportExportService } from '$lib/services/admin/import-export.service';
import type { ApiResponseDTO } from '$lib/models/admin/dtos';

/**
 * GET - Exportar proyectos a formato plano
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const idsParam = url.searchParams.get('ids');
		let projectIds: number[] | undefined = undefined;

		if (idsParam) {
			try {
				projectIds = idsParam.split(',').map((id) => parseInt(id.trim()));

				// Validar que todos los IDs sean números válidos
				if (projectIds.some((id) => isNaN(id))) {
					return json(
						{
							success: false,
							message: 'IDs inválidos'
						},
						{ status: 400 }
					);
				}
			} catch (error) {
				return json(
					{
						success: false,
						message: 'Error al procesar los IDs de proyectos'
					},
					{ status: 400 }
				);
			}
		}

		// Exportar proyectos
		const exportData = await AdminImportExportService.exportProjects(projectIds);

		return json({
			success: true,
			data: exportData,
			message: `Se exportaron ${exportData.length} registros`
		});
	} catch (error) {
		console.error('Error al exportar proyectos:', error);
		return json(
			{
				success: false,
				message: 'Error al exportar proyectos'
			},
			{ status: 500 }
		);
	}
};
