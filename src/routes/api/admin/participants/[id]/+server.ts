/**
 * Admin API - Single Participant Endpoints
 * -----------------------------------------
 * GET    /api/admin/participants/[id]     - Obtener participante
 * PUT    /api/admin/participants/[id]     - Actualizar participante
 * DELETE /api/admin/participants/[id]     - Eliminar participante
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminParticipantesService } from '$lib/services/admin/participants.service';
import type { UpdateParticipanteDTO, ApiResponseDTO } from '$lib/models/admin';

/**
 * GET - Obtener un participante por ID
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseInt(params.id);

		if (isNaN(id)) {
			return json(
				{
					success: false,
					message: 'ID inválido'
				},
				{ status: 400 }
			);
		}

		const participante = await AdminParticipantsService.getParticipantById(id);

		if (!participante) {
			return json(
				{
					success: false,
					message: 'Participante no encontrado'
				},
				{ status: 404 }
			);
		}

		return json({
			success: true,
			data: participante
		});
	} catch (error) {
		console.error('Error al obtener participante:', error);
		return json(
			{
				success: false,
				message: 'Error al obtener el participante'
			},
			{ status: 500 }
		);
	}
};

/**
 * PUT - Actualizar un participante
 */
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseInt(params.id);

		if (isNaN(id)) {
			return json(
				{
					success: false,
					message: 'ID inválido'
				},
				{ status: 400 }
			);
		}

		const body = (await request.json()) as Omit<UpdateParticipanteDTO, 'id'>;
		const updateData: UpdateParticipanteDTO = { ...body, id };

		// Validar campos
		const validationErrors = AdminParticipantsService.validateParticipant(updateData);
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

		// Verificar email duplicado si se está actualizando
		if (body.email) {
			const isDuplicate = await AdminParticipantsService.checkDuplicateEmail(body.email, id);
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
		}

		// Actualizar participante
		const participante = await AdminParticipantsService.updateParticipant(updateData);

		if (!participante) {
			return json(
				{
					success: false,
					message: 'Error al actualizar el participante'
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			data: participante,
			message: 'Participante actualizado exitosamente'
		});
	} catch (error) {
		console.error('Error al actualizar participante:', error);
		return json(
			{
				success: false,
				message: 'Error al actualizar el participante'
			},
			{ status: 500 }
		);
	}
};

/**
 * DELETE - Eliminar un participante
 */
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseInt(params.id);

		if (isNaN(id)) {
			return json(
				{
					success: false,
					message: 'ID inválido'
				},
				{ status: 400 }
			);
		}

		// Verificar que existe
		const participante = await AdminParticipantsService.getParticipantById(id);
		if (!participante) {
			return json(
				{
					success: false,
					message: 'Participante no encontrado'
				},
				{ status: 404 }
			);
		}

		// Eliminar
		const deleted = await AdminParticipantsService.deleteParticipant(id);

		if (!deleted) {
			return json(
				{
					success: false,
					message: 'Error al eliminar el participante'
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: 'Participante eliminado exitosamente'
		});
	} catch (error) {
		console.error('Error al eliminar participante:', error);
		return json(
			{
				success: false,
				message: 'Error al eliminar el participante'
			},
			{ status: 500 }
		);
	}
};
