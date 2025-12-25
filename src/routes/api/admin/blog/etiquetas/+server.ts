/**
 * Admin API - Blog Etiquetas Endpoints
 * -------------------------------------
 * GET  /api/admin/blog/etiquetas     - Listar etiquetas
 * POST /api/admin/blog/etiquetas     - Crear etiqueta
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminBlogService } from '$lib/services/admin/blog/blog.service';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * GET - Listar todas las etiquetas
 */
export const GET: RequestHandler = async () => {
	try {
		const etiquetas = await AdminBlogService.listEtiquetas();

		console.log(`[AUDIT] ${usuario.email} post`);
		return json({
			success: true,
			data: etiquetas
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al listar etiquetas:', error);
		return json(
			{
				success: false,
				message: 'Error al listar etiquetas'
			},
			{ status: 500 }
		);
	}
};

/**
 * POST - Crear una nueva etiqueta
 */
export const POST: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { request } = event;
		const body = await request.json();

		// Validar campos obligatorios
		if (!body.nombre) {
			return json(
				{
					success: false,
					message: 'El nombre es obligatorio',
					errors: [{ field: 'nombre', message: 'El nombre es obligatorio' }]
				},
				{ status: 400 }
			);
		}

		const etiqueta = await AdminBlogService.createEtiqueta({
			nombre: body.nombre,
			color: body.color
		});

		if (!etiqueta) {
			return json(
				{
					success: false,
					message: 'Error al crear la etiqueta'
				},
				{ status: 500 }
			);
		}

		console.log(`[AUDIT] ${usuario.email} post`);
		return json(
			{
				success: true,
				data: etiqueta,
				message: 'Etiqueta creada exitosamente'
			},
			{ status: 201 }
		);
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al crear etiqueta:', error);
		return json(
			{
				success: false,
				message: 'Error al crear la etiqueta',
				error: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
