/**
 * Admin API - Blog Endpoints
 * ---------------------------
 * GET    /api/admin/blog              - Listar posts
 * POST   /api/admin/blog              - Crear post
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminBlogService } from '$lib/services/admin/blog/blog.service';
import type { CreateBlogPostDTO, ApiResponseDTO } from '$lib/models/admin';

/**
 * GET - Listar posts con paginación y filtros
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
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
 * NOTA: Por ahora usar autor_id = 1 (debe implementarse autenticación)
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as CreateBlogPostDTO;

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

		// TODO: Obtener autor_id del token/sesión
		const autorId = 1;

		// Crear post (slug se genera automáticamente)
		const post = await AdminBlogService.createPost(body, autorId);

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
