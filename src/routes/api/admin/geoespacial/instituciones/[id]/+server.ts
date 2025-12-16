/**
 * API para operaciones sobre una institución específica
 * GET    /api/admin/geoespacial/instituciones/[id] - Obtener por ID
 * PUT    /api/admin/geoespacial/instituciones/[id] - Actualizar
 * DELETE /api/admin/geoespacial/instituciones/[id] - Eliminar
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { geoespacialService } from '$lib/services/admin/geoespacial.service';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const id = parseInt(params.id);
		if (isNaN(id)) {
			return json(
				{
					success: false,
					error: 'ID inválido'
				},
				{ status: 400 }
			);
		}

		const includeRelations = url.searchParams.get('include') === 'facultades';
		const institucion = await geoespacialService.getInstitucionById(id, includeRelations);

		if (!institucion) {
			return json(
				{
					success: false,
					error: 'Institución no encontrada'
				},
				{ status: 404 }
			);
		}

		return json({
			success: true,
			data: institucion
		});
	} catch (error: any) {
		console.error('Error al obtener institución:', error);
		return json(
			{
				success: false,
				error: error.message || 'Error al obtener institución'
			},
			{ status: 500 }
		);
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseInt(params.id);
		if (isNaN(id)) {
			return json(
				{
					success: false,
					error: 'ID inválido'
				},
				{ status: 400 }
			);
		}

		const dto = await request.json();
		const institucion = await geoespacialService.updateInstitucion(id, dto);

		return json({
			success: true,
			data: institucion
		});
	} catch (error: any) {
		console.error('Error al actualizar institución:', error);
		const status = error.message.includes('no encontrada') ? 404 : 400;
		return json(
			{
				success: false,
				error: error.message || 'Error al actualizar institución'
			},
			{ status }
		);
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseInt(params.id);
		if (isNaN(id)) {
			return json(
				{
					success: false,
					error: 'ID inválido'
				},
				{ status: 400 }
			);
		}

		await geoespacialService.deleteInstitucion(id);

		return json({
			success: true,
			message: 'Institución eliminada correctamente'
		});
	} catch (error: any) {
		console.error('Error al eliminar institución:', error);
		const status = error.message.includes('facultades asociadas') ? 409 : 400;
		return json(
			{
				success: false,
				error: error.message || 'Error al eliminar institución'
			},
			{ status }
		);
	}
};
