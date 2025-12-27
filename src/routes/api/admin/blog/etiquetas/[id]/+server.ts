/**
 * Admin API - Blog Etiqueta Individual Endpoints
 * -----------------------------------------------
 * GET    /api/admin/blog/etiquetas/[id]     - Obtener etiqueta
 * PUT    /api/admin/blog/etiquetas/[id]     - Actualizar etiqueta
 * DELETE /api/admin/blog/etiquetas/[id]     - Eliminar etiqueta
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminBlogService } from '$lib/services/admin/blog/blog.service';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * GET - Obtener una etiqueta por ID
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

		const etiqueta = await AdminBlogService.getEtiquetaById(id);

		if (!etiqueta) {
			return json(
				{
					success: false,
					message: 'Etiqueta no encontrada'
				},
				{ status: 404 }
			);
		}

		console.log(`[AUDIT] ${usuario.email} obtuvo etiqueta ${id}`);
		return json({
			success: true,
			data: etiqueta
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al obtener etiqueta:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener la etiqueta'
			},
			{ status: 500 }
		);
	}
};

/**
 * PUT - Actualizar una etiqueta
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

		const body = await request.json();

		// Verificar que la etiqueta existe
		const existingEtiqueta = await AdminBlogService.getEtiquetaById(id);
		if (!existingEtiqueta) {
			return json(
				{
					success: false,
					message: 'Etiqueta no encontrada'
				},
				{ status: 404 }
			);
		}

		const etiqueta = await AdminBlogService.updateEtiqueta(id, {
			nombre: body.nombre,
			color: body.color
		});

		if (!etiqueta) {
			return json(
				{
					success: false,
					message: 'Error al actualizar la etiqueta'
				},
				{ status: 500 }
			);
		}

		console.log(`[AUDIT] ${usuario.email} actualizó etiqueta ${id}`);
		return json({
			success: true,
			data: etiqueta,
			message: 'Etiqueta actualizada exitosamente'
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al actualizar etiqueta:', error);
		return json(
			{
				success: false,
				message: 'Error al actualizar la etiqueta',
				error: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};

/**
 * DELETE - Eliminar una etiqueta
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
		const existingEtiqueta = await AdminBlogService.getEtiquetaById(id);
		if (!existingEtiqueta) {
			return json(
				{
					success: false,
					message: 'Etiqueta no encontrada'
				},
				{ status: 404 }
			);
		}

		const deleted = await AdminBlogService.deleteEtiqueta(id);

		if (!deleted) {
			return json(
				{
					success: false,
					message: 'Error al eliminar la etiqueta'
				},
				{ status: 500 }
			);
		}

		console.log(`[AUDIT] ${usuario.email} eliminó etiqueta ${id}`);
		return json({
			success: true,
			message: 'Etiqueta eliminada exitosamente'
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al eliminar etiqueta:', error);
		return json(
			{
				success: false,
				message: 'Error al eliminar la etiqueta'
			},
			{ status: 500 }
		);
	}
};
