/**
 * API para gestión de Facultades
 * GET    /api/admin/geoespacial/facultades - Listar todas
 * POST   /api/admin/geoespacial/facultades - Crear nueva
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { geoespacialService } from '$lib/services/admin/geoespacial.service';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const includeRelations = url.searchParams.get('include') === 'carreras';
		const institucionId = url.searchParams.get('institucion_id');

		let facultades;
		if (institucionId) {
			facultades = await geoespacialService.getFacultadesByInstitucion(parseInt(institucionId));
		} else {
			facultades = await geoespacialService.getAllFacultades(includeRelations);
		}

		return json({
			success: true,
			data: facultades
		});
	} catch (error: any) {
		console.error('Error al obtener facultades:', error);
		return json(
			{
				success: false,
				error: error.message || 'Error al obtener facultades'
			},
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const dto = await request.json();
		const facultad = await geoespacialService.createFacultad(dto);

		return json(
			{
				success: true,
				data: facultad
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Error al crear facultad:', error);
		return json(
			{
				success: false,
				error: error.message || 'Error al crear facultad'
			},
			{ status: 400 }
		);
	}
};
