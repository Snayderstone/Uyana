/**
 * Admin API - Blog Categorías Endpoints
 * --------------------------------------
 * POST   /api/admin/blog/categorias     - Crear categoría
 * GET    /api/admin/blog/categorias     - Listar categorías
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminBlogService } from '$lib/services/admin/blog.service';
import type { CreateBlogCategoriaDTO } from '$lib/models/admin';

/**
 * GET - Listar todas las categorías
 */
export const GET: RequestHandler = async () => {
	try {
		const categorias = await AdminBlogService.listCategorias();

		return json({
			success: true,
			data: categorias
		});
	} catch (error) {
		console.error('Error al listar categorías:', error);
		return json(
			{
				success: false,
				message: 'Error al listar categorías'
			},
			{ status: 500 }
		);
	}
};

/**
 * POST - Crear una nueva categoría
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as CreateBlogCategoriaDTO;

		// Validar campos obligatorios
		if (!body.nombre || !body.slug) {
			return json(
				{
					success: false,
					message: 'Nombre y slug son obligatorios',
					errors: [
						{ field: 'nombre', message: 'El nombre es obligatorio' },
						{ field: 'slug', message: 'El slug es obligatorio' }
					]
				},
				{ status: 400 }
			);
		}

		// Verificar si el slug ya existe
		const existingCategoria = await AdminBlogService.getCategoriaBySlug(body.slug);
		if (existingCategoria) {
			return json(
				{
					success: false,
					message: 'El slug ya existe',
					errors: [{ field: 'slug', message: 'El slug ya está en uso' }]
				},
				{ status: 409 }
			);
		}

		const categoria = await AdminBlogService.createCategoria(body);

		if (!categoria) {
			return json(
				{
					success: false,
					message: 'Error al crear la categoría'
				},
				{ status: 500 }
			);
		}

		return json(
			{
				success: true,
				data: categoria,
				message: 'Categoría creada exitosamente'
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error al crear categoría:', error);
		return json(
			{
				success: false,
				message: 'Error al crear la categoría',
				error: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
