/**
 * API para gestión de Carreras
 * GET    /api/admin/geoespacial/carreras - Listar todas
 * POST   /api/admin/geoespacial/carreras - Crear nueva
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { geoespacialService } from '$lib/services/admin/geoespacial.service';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const includeRelations = url.searchParams.get('include') === 'relations';
		const facultadId = url.searchParams.get('facultad_id');

		let carreras;
		if (facultadId) {
			carreras = await geoespacialService.getCarrerasByFacultad(parseInt(facultadId));
		} else {
			carreras = await geoespacialService.getAllCarreras(includeRelations);
		}

		return json({
			success: true,
			data: carreras
		});
	} catch (error: any) {
		console.error('Error al obtener carreras:', error);
		return json(
			{
				success: false,
				error: error.message || 'Error al obtener carreras'
			},
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const dto = await request.json();
		const carrera = await geoespacialService.createCarrera(dto);

		return json(
			{
				success: true,
				data: carrera
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Error al crear carrera:', error);
		return json(
			{
				success: false,
				error: error.message || 'Error al crear carrera'
			},
			{ status: 400 }
		);
	}
};
