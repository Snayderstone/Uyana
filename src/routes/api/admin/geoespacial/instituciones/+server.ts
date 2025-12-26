/**
 * API para gestión de Instituciones
 * GET    /api/admin/geoespacial/instituciones - Listar todas
 * POST   /api/admin/geoespacial/instituciones - Crear nueva
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { geoespacialService } from '$lib/services/admin/geoespacial/geoespacial.service';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

export const GET: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { url } = event;
		const includeRelations = url.searchParams.get('include') === 'facultades';
		const instituciones = await geoespacialService.getAllInstituciones(includeRelations);

		console.log(`[AUDIT] ${usuario.email} obtuvo instituciones`);
		return json({
			success: true,
			data: instituciones
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
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

export const POST: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { request } = event;
		const dto = await request.json();
		const institucion = await geoespacialService.createInstitucion(dto);

		console.log(`[AUDIT] ${usuario.email} creó institución`);
		return json(
			{
				success: true,
				data: institucion
			},
			{ status: 201 }
		);
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
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
