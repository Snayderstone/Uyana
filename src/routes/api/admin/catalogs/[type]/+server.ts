/**
 * Admin API - Catalogs Endpoints
 * -------------------------------
 * GET    /api/admin/catalogs/[type]   - Obtener catálogo
 *
 * Tipos disponibles:
 * - estados
 * - tipos
 * - areas
 * - lineas
 * - fuentes
 * - cargos
 * - regimenes
 * - instituciones
 * - facultades
 * - carreras
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import {
	AdminEstadosRepository,
	AdminTiposRepository,
	AdminAreasRepository,
	AdminLineasRepository,
	AdminFuentesRepository,
	AdminCargosRepository,
	AdminRegimenesRepository,
	AdminInstitucionesRepository,
	AdminFacultadesRepository,
	AdminCarrerasRepository
} from '$lib/db/admin/catalogs.repository';
import type { ApiResponseDTO } from '$lib/models/admin';

const catalogRepositories: Record<string, any> = {
	estados: AdminEstadosRepository,
	tipos: AdminTiposRepository,
	areas: AdminAreasRepository,
	lineas: AdminLineasRepository,
	fuentes: AdminFuentesRepository,
	cargos: AdminCargosRepository,
	regimenes: AdminRegimenesRepository,
	instituciones: AdminInstitucionesRepository,
	facultades: AdminFacultadesRepository,
	carreras: AdminCarrerasRepository
};

/**
 * GET - Obtener todos los elementos de un catálogo
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { type } = params;

		const repository = catalogRepositories[type];

		if (!repository) {
			return json(
				{
					success: false,
					message: `Catálogo '${type}' no encontrado`
				},
				{ status: 404 }
			);
		}

		const data = await repository.getAll();

		return json({
			success: true,
			data
		});
	} catch (error) {
		console.error('Error al obtener catálogo:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener el catálogo'
			},
			{ status: 500 }
		);
	}
};

/**
 * POST - Crear un nuevo elemento en el catálogo
 */
export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { type } = params;
		const repository = catalogRepositories[type];

		if (!repository) {
			return json(
				{
					success: false,
					message: `Catálogo '${type}' no encontrado`
				},
				{ status: 404 }
			);
		}

		const body = await request.json();

		if (!body.nombre || !body.nombre.trim()) {
			return json(
				{
					success: false,
					message: 'El nombre es obligatorio',
					errors: [{ field: 'nombre', message: 'El nombre es obligatorio' }]
				},
				{ status: 400 }
			);
		}

		const newItem = await repository.create(body);

		if (!newItem) {
			return json(
				{
					success: false,
					message: 'Error al crear el elemento'
				},
				{ status: 500 }
			);
		}

		return json(
			{
				success: true,
				data: newItem,
				message: 'Elemento creado exitosamente'
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error al crear elemento del catálogo:', error);
		return json(
			{
				success: false,
				message: 'Error al crear el elemento'
			},
			{ status: 500 }
		);
	}
};

/**
 * PUT - Actualizar un elemento del catálogo
 */
export const PUT: RequestHandler = async ({ params, request, url }) => {
	try {
		const { type } = params;
		const repository = catalogRepositories[type];

		if (!repository) {
			return json(
				{
					success: false,
					message: `Catálogo '${type}' no encontrado`
				},
				{ status: 404 }
			);
		}

		const id = parseInt(url.searchParams.get('id') || '0');

		if (isNaN(id) || id <= 0) {
			return json(
				{
					success: false,
					message: 'ID inválido'
				},
				{ status: 400 }
			);
		}

		const body = await request.json();

		const updatedItem = await repository.update(id, body);

		if (!updatedItem) {
			return json(
				{
					success: false,
					message: 'Error al actualizar el elemento'
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			data: updatedItem,
			message: 'Elemento actualizado exitosamente'
		});
	} catch (error) {
		console.error('Error al actualizar elemento del catálogo:', error);
		return json(
			{
				success: false,
				message: 'Error al actualizar el elemento'
			},
			{ status: 500 }
		);
	}
};

/**
 * DELETE - Eliminar un elemento del catálogo
 */
export const DELETE: RequestHandler = async ({ params, url }) => {
	try {
		const { type } = params;
		const repository = catalogRepositories[type];

		if (!repository) {
			return json(
				{
					success: false,
					message: `Catálogo '${type}' no encontrado`
				},
				{ status: 404 }
			);
		}

		const id = parseInt(url.searchParams.get('id') || '0');

		if (isNaN(id) || id <= 0) {
			return json(
				{
					success: false,
					message: 'ID inválido'
				},
				{ status: 400 }
			);
		}

		const deleted = await repository.delete(id);

		if (!deleted) {
			return json(
				{
					success: false,
					message: 'Error al eliminar el elemento'
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: 'Elemento eliminado exitosamente'
		});
	} catch (error) {
		console.error('Error al eliminar elemento del catálogo:', error);
		return json(
			{
				success: false,
				message: 'Error al eliminar el elemento'
			},
			{ status: 500 }
		);
	}
};
