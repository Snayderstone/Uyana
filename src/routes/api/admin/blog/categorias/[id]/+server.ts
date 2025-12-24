/**
 * Admin API - Blog Categoría Individual Endpoints
 * ------------------------------------------------
 * GET    /api/admin/blog/categorias/[id]     - Obtener categoría
 * PUT    /api/admin/blog/categorias/[id]     - Actualizar categoría
 * DELETE /api/admin/blog/categorias/[id]     - Eliminar categoría
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminBlogService } from '$lib/services/admin/blog/blog.service';
import type { UpdateBlogCategoriaDTO } from '$lib/models/admin';

/**
 * GET - Obtener una categoría por ID
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
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

		const categoria = await AdminBlogService.getCategoriaById(id);

		if (!categoria) {
			return json(
				{
					success: false,
					message: 'Categoría no encontrada'
				},
				{ status: 404 }
			);
		}

		return json({
			success: true,
			data: categoria
		});
	} catch (error) {
		console.error('Error al obtener categoría:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener la categoría'
			},
			{ status: 500 }
		);
	}
};

/**
 * PUT - Actualizar una categoría
 */
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
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

		const body = (await request.json()) as UpdateBlogCategoriaDTO;

		// Verificar que la categoría existe
		const existingCategoria = await AdminBlogService.getCategoriaById(id);
		if (!existingCategoria) {
			return json(
				{
					success: false,
					message: 'Categoría no encontrada'
				},
				{ status: 404 }
			);
		}

		// Si se actualiza el slug, verificar que no esté en uso
		if (body.slug && body.slug !== existingCategoria.slug) {
			const slugInUse = await AdminBlogService.getCategoriaBySlug(body.slug);
			if (slugInUse && slugInUse.id !== id) {
				return json(
					{
						success: false,
						message: 'El slug ya está en uso',
						errors: [{ field: 'slug', message: 'El slug ya está en uso' }]
					},
					{ status: 409 }
				);
			}
		}

		const categoria = await AdminBlogService.updateCategoria(id, body);

		if (!categoria) {
			return json(
				{
					success: false,
					message: 'Error al actualizar la categoría'
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			data: categoria,
			message: 'Categoría actualizada exitosamente'
		});
	} catch (error) {
		console.error('Error al actualizar categoría:', error);
		return json(
			{
				success: false,
				message: 'Error al actualizar la categoría'
			},
			{ status: 500 }
		);
	}
};

/**
 * DELETE - Eliminar una categoría
 */
export const DELETE: RequestHandler = async ({ params }) => {
	try {
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

		const success = await AdminBlogService.deleteCategoria(id);

		if (!success) {
			return json(
				{
					success: false,
					message: 'Error al eliminar la categoría'
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: 'Categoría eliminada exitosamente'
		});
	} catch (error) {
		console.error('Error al eliminar categoría:', error);
		return json(
			{
				success: false,
				message: 'Error al eliminar la categoría'
			},
			{ status: 500 }
		);
	}
};
