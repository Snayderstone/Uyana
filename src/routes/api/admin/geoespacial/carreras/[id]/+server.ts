/**
 * API para operaciones sobre una carrera específica
 * GET    /api/admin/geoespacial/carreras/[id] - Obtener por ID
 * PUT    /api/admin/geoespacial/carreras/[id] - Actualizar
 * DELETE /api/admin/geoespacial/carreras/[id] - Eliminar
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { geoespacialService } from '$lib/services/admin/geoespacial/geoespacial.service';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

export const GET: RequestHandler = async (event) => {
	try {
		await requireAdmin(event);
		const { params, url } = event;
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

		const includeRelations = url.searchParams.get('include') === 'relations';
		const carrera = await geoespacialService.getCarreraById(id, includeRelations);

		if (!carrera) {
			return json(
				{
					success: false,
					error: 'Carrera no encontrada'
				},
				{ status: 404 }
			);
		}

		console.log(`[AUDIT] ${usuario.email} put`);
		console.log(`[AUDIT] ${usuario.email} delete`);
		return json({
			success: true,
			data: carrera
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al obtener carrera:', error);
		return json(
			{
				success: false,
				error: error.message || 'Error al obtener carrera'
			},
			{ status: 500 }
		);
	}
};

export const PUT: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { params, request } = event;
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
		const carrera = await geoespacialService.updateCarrera(id, dto);

		console.log(`[AUDIT] ${usuario.email} put`);
		console.log(`[AUDIT] ${usuario.email} delete`);
		return json({
			success: true,
			data: carrera
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al actualizar carrera:', error);
		const status = error.message.includes('no encontrada') ? 404 : 400;
		return json(
			{
				success: false,
				error: error.message || 'Error al actualizar carrera'
			},
			{ status }
		);
	}
};

export const DELETE: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { params } = event;
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

		await geoespacialService.deleteCarrera(id);

		console.log(`[AUDIT] ${usuario.email} put`);
		console.log(`[AUDIT] ${usuario.email} delete`);
		return json({
			success: true,
			message: 'Carrera eliminada correctamente'
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al eliminar carrera:', error);
		return json(
			{
				success: false,
				error: error.message || 'Error al eliminar carrera'
			},
			{ status: 400 }
		);
	}
};
