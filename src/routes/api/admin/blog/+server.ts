/**
 * Admin API - Blog Endpoints
 * ---------------------------
 * GET    /api/admin/blog              - Listar posts
 * POST   /api/admin/blog              - Crear post
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminBlogService } from '$lib/services/admin/blog/blog.service';
import type { CreateBlogPostDTO, ApiResponseDTO } from '$lib/models/admin';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * GET - Listar posts con paginación y filtros
 */
export const GET: RequestHandler = async (event) => {
	try {
		await requireAdmin(event);
		const { url } = event;
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const publicado = url.searchParams.get('publicado');

		const filters = {
			titulo: url.searchParams.get('titulo') || undefined,
			publicado: publicado ? publicado === 'true' : undefined,
			autor_id: url.searchParams.get('autor_id')
				? parseInt(url.searchParams.get('autor_id')!)
				: undefined
		};

		const result = await AdminBlogService.listPosts(page, limit, filters);

		return json({
			success: true,
			data: result
		});
	} catch (error) {
		console.error('Error al listar posts:', error);
		return json(
			{
				success: false,
				message: 'Error al listar posts'
			},
			{ status: 500 }
		);
	}
};

/**
 * POST - Crear un nuevo post
 */
export const POST: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const body = (await event.request.json()) as CreateBlogPostDTO;

		// Validar campos
		const validationErrors = AdminBlogService.validatePost(body);
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

		// Usar el usuario autenticado
		const post = await AdminBlogService.createPost(body, usuario.id, usuario.nombre);

		if (!post) {
			return json(
				{
					success: false,
					message: 'Error al crear el post'
				},
				{ status: 500 }
			);
		}

		return json(
			{
				success: true,
				data: post,
				message: 'Post creado exitosamente'
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error al crear post:', error);
		return json(
			{
				success: false,
				message: 'Error al crear el post'
			},
			{ status: 500 }
		);
	}
};
