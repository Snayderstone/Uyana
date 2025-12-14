/**
 * Admin API - Participants Endpoints
 * -----------------------------------
 * GET    /api/admin/participants      - Listar participantes
 * POST   /api/admin/participants      - Crear participante
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminParticipantesService } from '$lib/services/admin/participants.service';
import type { CreateParticipanteDTO, ApiResponseDTO } from '$lib/models/admin';

/**
 * GET - Listar participantes con paginación y filtros
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const acreditado = url.searchParams.get('acreditado');

		const filters = {
			nombre: url.searchParams.get('nombre') || undefined,
			email: url.searchParams.get('email') || undefined,
			genero: url.searchParams.get('genero') || undefined,
			acreditado: acreditado ? acreditado === 'true' : undefined,
			carrera_id: url.searchParams.get('carrera_id')
				? parseInt(url.searchParams.get('carrera_id')!)
				: undefined
		};

		const result = await AdminParticipantsService.listParticipants(page, limit, filters);

		return json({
			success: true,
			data: result
		});
	} catch (error) {
		console.error('Error al listar participantes:', error);
		return json(
			{
				success: false,
				message: 'Error al listar participantes'
			},
			{ status: 500 }
		);
	}
};

/**
 * POST - Crear un nuevo participante
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as CreateParticipanteDTO;

		// Validar campos
		const validationErrors = AdminParticipantsService.validateParticipant(body);
		if (validationErrors.length > 0) {
			return json(
				{
					success: false,
					message: 'Errores de validación',
					errors: validationErrors
				},
				{ status: 400 }
			);
		}

		// Verificar email duplicado
		const isDuplicate = await AdminParticipantsService.checkDuplicateEmail(body.email);
		if (isDuplicate) {
			return json(
				{
					success: false,
					message: 'El email ya está registrado',
					errors: [{ field: 'email', message: 'El email ya está registrado' }]
				},
				{ status: 409 }
			);
		}

		// Crear participante
		const participante = await AdminParticipantsService.createParticipant(body);

		if (!participante) {
			return json(
				{
					success: false,
					message: 'Error al crear el participante'
				},
				{ status: 500 }
			);
		}

		return json(
			{
				success: true,
				data: participante,
				message: 'Participante creado exitosamente'
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error al crear participante:', error);
		return json(
			{
				success: false,
				message: 'Error al crear el participante'
			},
			{ status: 500 }
		);
	}
};
