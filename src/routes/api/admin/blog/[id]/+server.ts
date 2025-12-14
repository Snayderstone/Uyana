/**
 * Admin API - Single Blog Post Endpoints
 * ---------------------------------------
 * GET    /api/admin/blog/[id]         - Obtener post
 * PUT    /api/admin/blog/[id]         - Actualizar post
 * DELETE /api/admin/blog/[id]         - Eliminar post
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminBlogService } from '$lib/services/admin/blog.service';
import type { UpdateBlogPostDTO, ApiResponseDTO } from '$lib/models/admin';

/**
 * GET - Obtener un post por ID
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

		const post = await AdminBlogService.getPostById(id);

		if (!post) {
			return json(
				{
					success: false,
					message: 'Post no encontrado'
				},
				{ status: 404 }
			);
		}

		return json({
			success: true,
			data: post
		});
	} catch (error) {
		console.error('Error al obtener post:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener el post'
			},
			{ status: 500 }
		);
	}
};

/**
 * PUT - Actualizar un post
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

		const body = (await request.json()) as Omit<UpdateBlogPostDTO, 'id'>;
		const updateData: UpdateBlogPostDTO = { ...body, id };

		// Validar campos
		const validationErrors = AdminBlogService.validatePost(updateData);
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

		// Actualizar post (slug no se modifica en updates)
		const post = await AdminBlogService.updatePost(updateData);

		if (!post) {
			return json(
				{
					success: false,
					message: 'Error al actualizar el post'
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			data: post,
			message: 'Post actualizado exitosamente'
		});
	} catch (error) {
		console.error('Error al actualizar post:', error);
		return json(
			{
				success: false,
				message: 'Error al actualizar el post'
			},
			{ status: 500 }
		);
	}
};

/**
 * DELETE - Eliminar un post
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

		// Verificar que existe
		const post = await AdminBlogService.getPostById(id);
		if (!post) {
			return json(
				{
					success: false,
					message: 'Post no encontrado'
				},
				{ status: 404 }
			);
		}

		// Eliminar
		const deleted = await AdminBlogService.deletePost(id);

		if (!deleted) {
			return json(
				{
					success: false,
					message: 'Error al eliminar el post'
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: 'Post eliminado exitosamente'
		});
	} catch (error) {
		console.error('Error al eliminar post:', error);
		return json(
			{
				success: false,
				message: 'Error al eliminar el post'
			},
			{ status: 500 }
		);
	}
};
