/**
 * API para gestión de Instituciones
 * GET    /api/admin/geoespacial/instituciones - Listar todas
 * POST   /api/admin/geoespacial/instituciones - Crear nueva
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { geoespacialService } from '$lib/services/admin/geoespacial.service';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const includeRelations = url.searchParams.get('include') === 'facultades';
		const instituciones = await geoespacialService.getAllInstituciones(includeRelations);

		return json({
			success: true,
			data: instituciones
		});
	} catch (error: any) {
		console.error('Error al obtener instituciones:', error);
		return json(
			{
				success: false,
				error: error.message || 'Error al obtener instituciones'
			},
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const dto = await request.json();
		const institucion = await geoespacialService.createInstitucion(dto);

		return json(
			{
				success: true,
				data: institucion
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Error al crear institución:', error);
		return json(
			{
				success: false,
				error: error.message || 'Error al crear institución'
			},
			{ status: 400 }
		);
	}
};
