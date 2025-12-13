/**
 * Admin API - Import Projects Endpoint
 * -------------------------------------
 * POST   /api/admin/import            - Importar proyectos desde CSV/Excel
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminImportExportService } from '$lib/services/admin/import-export.service';
import type { ImportProyectoRowDTO, ApiResponseDTO } from '$lib/models/admin/dtos';

/**
 * POST - Importar proyectos desde datos CSV/Excel
 *
 * Body esperado:
 * {
 *   "data": ImportProyectoRowDTO[]
 * }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { data } = body as { data: ImportProyectoRowDTO[] };

		if (!data || !Array.isArray(data) || data.length === 0) {
			return json(
				{
					success: false,
					message: 'No se proporcionaron datos para importar'
				},
				{ status: 400 }
			);
		}

		// Procesar importación
		const result = await AdminImportExportService.importProjects(data);

		const statusCode = result.success ? 200 : 207; // 207 = Multi-Status

		return json(
			{
				success: result.success,
				data: result,
				message: result.success
					? `Se importaron ${result.imported_count} proyectos exitosamente`
					: `Se importaron ${result.imported_count} proyectos, ${result.failed_count} fallaron`
			},
			{ status: statusCode }
		);
	} catch (error) {
		console.error('Error al importar proyectos:', error);
		return json(
			{
				success: false,
				message: 'Error al procesar la importación'
			},
			{ status: 500 }
		);
	}
};
