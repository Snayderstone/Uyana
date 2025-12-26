/**
 * API para gestión de Facultades
 * GET    /api/admin/geoespacial/facultades - Listar todas
 * POST   /api/admin/geoespacial/facultades - Crear nueva
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { geoespacialService } from '$lib/services/admin/geoespacial/geoespacial.service';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

export const GET: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { url } = event;
		const includeRelations = url.searchParams.get('include') === 'carreras';
		const institucionId = url.searchParams.get('institucion_id');

		let facultades;
		if (institucionId) {
			facultades = await geoespacialService.getFacultadesByInstitucion(parseInt(institucionId));
		} else {
			facultades = await geoespacialService.getAllFacultades(includeRelations);
		}

		console.log(`[AUDIT] ${usuario.email} obtuvo facultades`);
		return json({
			success: true,
			data: facultades
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
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

export const POST: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { request } = event;
		const dto = await request.json();
		const facultad = await geoespacialService.createFacultad(dto);

		console.log(`[AUDIT] ${usuario.email} creó facultad`);
		return json(
			{
				success: true,
				data: facultad
			},
			{ status: 201 }
		);
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
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
