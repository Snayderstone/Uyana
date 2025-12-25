/**
 * Admin API - Reports Endpoint
 * -----------------------------
 * GET /api/admin/reports - Generar informes de proyectos en PDF o DOCX
 *
 * Query params:
 * - format: 'pdf' | 'docx' (default: 'pdf')
 * - type: 'single' | 'consolidated' (default: 'consolidated')
 * - id: number (requerido si type='single')
 * - ids: string (comma-separated project IDs para consolidated, opcional)
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminReportsService } from '$lib/services/admin/reports.service';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * GET - Generar informe de proyecto(s)
 */
export const GET: RequestHandler = async (event) => {
	try {
		await requireAdmin(event);
		const { url } = event;
		const format = url.searchParams.get('format') || 'pdf';
		const type = url.searchParams.get('type') || 'consolidated';
		const idParam = url.searchParams.get('id');
		const idsParam = url.searchParams.get('ids');

		// Validar formato
		if (!['pdf', 'docx'].includes(format)) {
			return json(
				{
					success: false,
					message: 'Formato no válido. Use: pdf o docx'
				},
				{ status: 400 }
			);
		}

		// Validar tipo
		if (!['single', 'consolidated'].includes(type)) {
			return json(
				{
					success: false,
					message: 'Tipo no válido. Use: single o consolidated'
				},
				{ status: 400 }
			);
		}

		// Informe individual
		if (type === 'single') {
			if (!idParam) {
				return json(
					{
						success: false,
						message: 'Se requiere el parámetro "id" para informes individuales'
					},
					{ status: 400 }
				);
			}

			const projectId = parseInt(idParam);
			if (isNaN(projectId)) {
				return json(
					{
						success: false,
						message: 'ID de proyecto inválido'
					},
					{ status: 400 }
				);
			}

			let buffer: Buffer;
			let contentType: string;
			let filename: string;

			if (format === 'pdf') {
				buffer = await AdminReportsService.generateProjectPDF(projectId);
				contentType = 'application/pdf';
				filename = `informe_proyecto_${projectId}_${new Date().toISOString().split('T')[0]}.pdf`;
			} else {
				buffer = await AdminReportsService.generateProjectDOCX(projectId);
				contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
				filename = `informe_proyecto_${projectId}_${new Date().toISOString().split('T')[0]}.docx`;
			}

			return new Response(buffer, {
				headers: {
					'Content-Type': contentType,
					'Content-Disposition': `attachment; filename="${filename}"`,
					'Content-Length': buffer.length.toString()
				}
			});
		}
		// Informe consolidado
		else {
			// Solo PDF para consolidados
			if (format === 'docx') {
				return json(
					{
						success: false,
						message: 'El formato DOCX no está disponible para informes consolidados. Use PDF.'
					},
					{ status: 400 }
				);
			}

			let projectIds: number[] | undefined = undefined;

			// Procesar IDs si se proporcionan
			if (idsParam) {
				try {
					projectIds = idsParam.split(',').map((id) => parseInt(id.trim()));

					if (projectIds.some((id) => isNaN(id))) {
						return json(
							{
								success: false,
								message: 'IDs de proyectos inválidos'
							},
							{ status: 400 }
						);
					}
				} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
					return json(
						{
							success: false,
							message: 'Error al procesar los IDs de proyectos'
						},
						{ status: 400 }
					);
				}
			}

			const buffer = await AdminReportsService.generateConsolidatedPDF(projectIds);
			const filename = `informe_consolidado_proyectos_${
				new Date().toISOString().split('T')[0]
			}.pdf`;

			return new Response(buffer, {
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': `attachment; filename="${filename}"`,
					'Content-Length': buffer.length.toString()
				}
			});
		}
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al generar informe:', error);

		const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

		return json(
			{
				success: false,
				message: 'Error al generar el informe',
				error: errorMessage
			},
			{ status: 500 }
		);
	}
};
