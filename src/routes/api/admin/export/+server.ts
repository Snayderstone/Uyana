/**
 * Admin API - Export Projects Endpoint
 * -------------------------------------
 * GET    /api/admin/export            - Exportar proyectos a Excel, CSV o JSON
 *
 * Query params:
 * - format: 'json' | 'excel' | 'csv' (default: 'json')
 * - ids: string (comma-separated project IDs, opcional)
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminImportExportService } from '$lib/services/admin/import-export.service';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * GET - Exportar proyectos en diferentes formatos
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		// Obtener parámetros
		const format = url.searchParams.get('format') || 'json';
		const idsParam = url.searchParams.get('ids');
		let projectIds: number[] | undefined = undefined;

		// Validar formato
		if (!['json', 'excel', 'csv'].includes(format)) {
			return json(
				{
					success: false,
					message: 'Formato no válido. Use: json, excel o csv'
				},
				{ status: 400 }
			);
		}

		// Procesar IDs si se proporcionan
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

		if (exportData.length === 0) {
			return json(
				{
					success: false,
					message: 'No hay proyectos para exportar'
				},
				{ status: 404 }
			);
		}

		// Retornar según el formato solicitado
		if (format === 'json') {
			// JSON - Respuesta normal
			return json({
				success: true,
				data: exportData,
				message: `Se exportaron ${exportData.length} registros`
			});
		} else if (format === 'excel') {
			// Excel - Generar archivo
			const worksheet = XLSX.utils.json_to_sheet(exportData);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Proyectos');

			// Generar buffer
			const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

			// Retornar archivo
			return new Response(buffer, {
				headers: {
					'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					'Content-Disposition': `attachment; filename="proyectos_${
						new Date().toISOString().split('T')[0]
					}.xlsx"`
				}
			});
		} else if (format === 'csv') {
			// CSV - Generar archivo
			const csv = Papa.unparse(exportData, {
				header: true,
				delimiter: ','
			});

			// Retornar archivo
			return new Response(csv, {
				headers: {
					'Content-Type': 'text/csv; charset=utf-8',
					'Content-Disposition': `attachment; filename="proyectos_${
						new Date().toISOString().split('T')[0]
					}.csv"`
				}
			});
		}

		// Esto no debería llegar nunca
		return json(
			{
				success: false,
				message: 'Error interno'
			},
			{ status: 500 }
		);
	} catch (error) {
		console.error('Error al exportar proyectos:', error);
		return json(
			{
				success: false,
				message: 'Error al exportar proyectos',
				error: error instanceof Error ? error.message : 'Error desconocido'
			},
			{ status: 500 }
		);
	}
};
