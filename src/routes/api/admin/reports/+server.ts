/**
 * Admin API - Reports Endpoint
 * -----------------------------
 * POST   /api/admin/reports           - Generar informe de proyectos
 *
 * Body:
 * {
 *   "format": "pdf" | "doc",
 *   "projectIds": number[] (opcional, si no se envía se exportan todos)
 * }
 *
 * NOTA: Para la generación de PDF y DOC se requieren librerías adicionales:
 * - PDF: pdfkit, @pdfme/generator, jspdf, etc.
 * - DOC: docx, officegen, etc.
 *
 * Por ahora, este endpoint retorna los datos en JSON que pueden ser
 * procesados por el cliente para generar los documentos.
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminProjectsService } from '$lib/services/admin/projects.service';
import type { ApiResponseDTO } from '$lib/models/admin/dtos';

/**
 * POST - Generar informe de proyectos
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { format, projectIds } = body as {
			format: 'pdf' | 'doc' | 'json';
			projectIds?: number[];
		};

		if (!format || !['pdf', 'doc', 'json'].includes(format)) {
			return json(
				{
					success: false,
					message: 'Formato inválido. Use "pdf", "doc" o "json"'
				},
				{ status: 400 }
			);
		}

		// Obtener proyectos
		let projects;
		if (projectIds && projectIds.length > 0) {
			projects = await Promise.all(projectIds.map((id) => AdminProjectsService.getProjectById(id)));
			projects = projects.filter((p) => p !== null);
		} else {
			const result = await AdminProjectsService.listProjects(1, 10000);
			projects = result.data;
		}

		// Por ahora retornar datos en JSON
		// TODO: Implementar generación real de PDF/DOC
		const reportData = {
			metadata: {
				generated_at: new Date().toISOString(),
				format: format,
				total_projects: projects.length
			},
			projects: projects.map((p) => ({
				codigo: p.codigo,
				titulo: p.titulo,
				estado: p.estado.nombre,
				fecha_inicio: p.fecha_inicio_planeada,
				fecha_fin: p.fecha_fin_planeada,
				avance: `${p.porcentaje_avance}%`,
				presupuesto: p.monto_presupuesto_total,
				instituciones: p.instituciones.map((i) => i.nombre).join(', '),
				participantes_count: p.participantes.length,
				objetivo: p.objetivo,
				impacto_cientifico: p.impacto_cientifico,
				impacto_economico: p.impacto_economico,
				impacto_social: p.impacto_social
			}))
		};

		return json({
			success: true,
			data: reportData,
			message: `Informe generado con ${projects.length} proyectos`
		});
	} catch (error) {
		console.error('Error al generar informe:', error);
		return json(
			{
				success: false,
				message: 'Error al generar el informe'
			},
			{ status: 500 }
		);
	}
};
