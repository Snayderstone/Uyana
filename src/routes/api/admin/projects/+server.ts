/**
 * Admin API - Projects Endpoints
 * -------------------------------
 * POST   /api/admin/projects          - Crear proyecto
 * GET    /api/admin/projects          - Listar proyectos
 * GET    /api/admin/projects/[id]     - Obtener proyecto
 * PUT    /api/admin/projects/[id]     - Actualizar proyecto
 * DELETE /api/admin/projects/[id]     - Eliminar proyecto
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminProjectsService } from '$lib/services/admin/projects/projects.service';
import type { CreateProyectoDTO, ApiResponseDTO } from '$lib/models/admin';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * GET - Listar todos los proyectos con paginación y filtros
 * Usa all=true para traer todos los registros sin límite
 */
export const GET: RequestHandler = async (event) => {
	try {
		await requireAdmin(event);
		const { url } = event;
		const all = url.searchParams.get('all') === 'true';

		if (all) {
			// Obtener TODOS los proyectos sin límite
			const data = await AdminProjectsService.getAllProjects();
			return json({
				success: true,
				data: {
					data: data,
					pagination: {
						page: 1,
						limit: data.length,
						total: data.length,
						total_pages: 1
					}
				}
			});
		}

		// Paginación normal
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');

		const filters = {
			codigo: url.searchParams.get('codigo') || undefined,
			titulo: url.searchParams.get('titulo') || undefined,
			estado_id: url.searchParams.get('estado_id')
				? parseInt(url.searchParams.get('estado_id')!)
				: undefined,
			fecha_inicio_desde: url.searchParams.get('fecha_inicio_desde') || undefined,
			fecha_inicio_hasta: url.searchParams.get('fecha_inicio_hasta') || undefined
		};

		const result = await AdminProjectsService.listProjects(page, limit, filters);
		const stats = await AdminProjectsService.getProjectStats();

		return json({
			success: true,
			data: result,
			stats: stats
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al listar proyectos:', error);
		return json(
			{
				success: false,
				message: 'Error al listar proyectos'
			},
			{ status: 500 }
		);
	}
};

/**
 * POST - Crear un nuevo proyecto
 */
export const POST: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { request } = event;
		const body = (await request.json()) as CreateProyectoDTO;

		// Validar campos
		const validationErrors = AdminProjectsService.validateProject(body);
		if (validationErrors.length > 0) {
			return json(
				{
					success: false,
					message: 'Errores de validación',
					errors: validationErrors
				},
				{ status: 400 }
			);
		}

		// Verificar duplicado
		const isDuplicate = await AdminProjectsService.checkDuplicateCode(body.codigo);
		if (isDuplicate) {
			return json(
				{
					success: false,
					message: 'El código del proyecto ya existe',
					errors: [{ field: 'codigo', message: 'El código del proyecto ya existe' }]
				},
				{ status: 409 }
			);
		}

		// Crear proyecto
		const proyecto = await AdminProjectsService.createProject(body);

		if (!proyecto) {
			return json(
				{
					success: false,
					message: 'Error al crear el proyecto'
				},
				{ status: 500 }
			);
		}

		console.log(`[AUDIT] ${usuario.email} creó proyecto: ${proyecto.id}`);
		return json(
			{
				success: true,
				data: proyecto,
				message: 'Proyecto creado exitosamente'
			},
			{ status: 201 }
		);
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al crear proyecto:', error);
		return json(
			{
				success: false,
				message: 'Error al crear el proyecto'
			},
			{ status: 500 }
		);
	}
};
