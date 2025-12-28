/**
 * Admin API - Single Project Endpoints
 * -------------------------------------
 * GET    /api/admin/projects/[id]     - Obtener proyecto
 * PUT    /api/admin/projects/[id]     - Actualizar proyecto
 * DELETE /api/admin/projects/[id]     - Eliminar proyecto
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminProjectsService } from '$lib/services/admin/projects/projects.service';
import type { UpdateProyectoDTO, ApiResponseDTO } from '$lib/models/admin';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * GET - Obtener un proyecto por ID
 */
export const GET: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { params } = event;
		const id = parseInt(params.id);

		if (isNaN(id)) {
			return json(
				{
					success: false,
					message: 'ID inválido'
				},
				{ status: 400 }
			);
		}

		const proyecto = await AdminProjectsService.getProjectById(id);

		if (!proyecto) {
			return json(
				{
					success: false,
					message: 'Proyecto no encontrado'
				},
				{ status: 404 }
			);
		}

		console.log(`[AUDIT] ${usuario.email} obtuvo proyecto #${id}`);
		return json({
			success: true,
			data: proyecto
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al obtener proyecto:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener el proyecto'
			},
			{ status: 500 }
		);
	}
};

/**
 * PUT - Actualizar un proyecto
 */
export const PUT: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { params, request } = event;
		const id = parseInt(params.id);

		if (isNaN(id)) {
			return json(
				{
					success: false,
					message: 'ID inválido'
				},
				{ status: 400 }
			);
		}

		const body = (await request.json()) as Omit<UpdateProyectoDTO, 'id'>;
		const updateData: UpdateProyectoDTO = { ...body, id };

		// Validar campos
		const validationErrors = AdminProjectsService.validateProject(updateData);
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

		// Verificar código duplicado si se está actualizando
		if (body.codigo) {
			const isDuplicate = await AdminProjectsService.checkDuplicateCode(body.codigo, id);
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
		}

		// Actualizar proyecto
		const proyecto = await AdminProjectsService.updateProject(updateData);

		if (!proyecto) {
			return json(
				{
					success: false,
					message: 'Error al actualizar el proyecto'
				},
				{ status: 500 }
			);
		}

		console.log(`[AUDIT] ${usuario.email} put`);
		console.log(`[AUDIT] ${usuario.email} delete`);
		return json({
			success: true,
			data: proyecto,
			message: 'Proyecto actualizado exitosamente'
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al actualizar proyecto:', error);
		return json(
			{
				success: false,
				message: 'Error al actualizar el proyecto'
			},
			{ status: 500 }
		);
	}
};

/**
 * DELETE - Eliminar un proyecto
 */
export const DELETE: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { params } = event;
		const id = parseInt(params.id);

		if (isNaN(id)) {
			return json(
				{
					success: false,
					message: 'ID inválido'
				},
				{ status: 400 }
			);
		}

		// Verificar que existe
		const proyecto = await AdminProjectsService.getProjectById(id);
		if (!proyecto) {
			return json(
				{
					success: false,
					message: 'Proyecto no encontrado'
				},
				{ status: 404 }
			);
		}

		// Eliminar
		const deleted = await AdminProjectsService.deleteProject(id);

		if (!deleted) {
			return json(
				{
					success: false,
					message: 'Error al eliminar el proyecto'
				},
				{ status: 500 }
			);
		}

		console.log(`[AUDIT] ${usuario.email} eliminó proyecto #${id}`);
		return json({
			success: true,
			message: 'Proyecto eliminado exitosamente'
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al eliminar proyecto:', error);
		return json(
			{
				success: false,
				message: 'Error al eliminar el proyecto'
			},
			{ status: 500 }
		);
	}
};
