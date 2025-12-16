/**
 * API para operaciones sobre una facultad específica
 * GET    /api/admin/geoespacial/facultades/[id] - Obtener por ID
 * PUT    /api/admin/geoespacial/facultades/[id] - Actualizar
 * DELETE /api/admin/geoespacial/facultades/[id] - Eliminar
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

		const includeRelations = url.searchParams.get('include') === 'carreras';
		const facultad = await geoespacialService.getFacultadById(id, includeRelations);

		if (!facultad) {
			return json(
				{
					success: false,
					error: 'Facultad no encontrada'
				},
				{ status: 404 }
			);
		}

		return json({
			success: true,
			data: facultad
		});
	} catch (error: any) {
		console.error('Error al obtener facultad:', error);
		return json(
			{
				success: false,
				error: error.message || 'Error al obtener facultad'
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
		const facultad = await geoespacialService.updateFacultad(id, dto);

		return json({
			success: true,
			data: facultad
		});
	} catch (error: any) {
		console.error('Error al actualizar facultad:', error);
		const status = error.message.includes('no encontrada') ? 404 : 400;
		return json(
			{
				success: false,
				error: error.message || 'Error al actualizar facultad'
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

		await geoespacialService.deleteFacultad(id);

		return json({
			success: true,
			message: 'Facultad eliminada correctamente'
		});
	} catch (error: any) {
		console.error('Error al eliminar facultad:', error);
		const status = error.message.includes('carreras asociadas') ? 409 : 400;
		return json(
			{
				success: false,
				error: error.message || 'Error al eliminar facultad'
			},
			{ status }
		);
	}
};
