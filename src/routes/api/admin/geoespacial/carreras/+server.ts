/**
 * API para gestión de Carreras
 * GET    /api/admin/geoespacial/carreras - Listar todas
 * POST   /api/admin/geoespacial/carreras - Crear nueva
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { geoespacialService } from '$lib/services/admin/geoespacial/geoespacial.service';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

export const GET: RequestHandler = async (event) => {
	try {
		await requireAdmin(event);
		const { url } = event;
		const includeRelations = url.searchParams.get('include') === 'relations';
		const facultadId = url.searchParams.get('facultad_id');

		let carreras;
		if (facultadId) {
			carreras = await geoespacialService.getCarrerasByFacultad(parseInt(facultadId));
		} else {
			carreras = await geoespacialService.getAllCarreras(includeRelations);
		}

		console.log(`[AUDIT] ${usuario.email} post`);
		return json({
			success: true,
			data: carreras
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
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

export const POST: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { request } = event;
		const dto = await request.json();
		const carrera = await geoespacialService.createCarrera(dto);

		console.log(`[AUDIT] ${usuario.email} post`);
		return json(
			{
				success: true,
				data: carrera
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
