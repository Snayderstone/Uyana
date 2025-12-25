/**
 * Admin API - Participants Endpoints
 * -----------------------------------
 * GET    /api/admin/participants      - Listar participantes
 * POST   /api/admin/participants      - Crear participante
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminParticipantsService } from '$lib/services/admin/participants/participants.service';
import type { CreateParticipanteDTO, ApiResponseDTO } from '$lib/models/admin';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * GET - Listar participantes con paginación y filtros
 * Usa all=true para traer todos los registros sin límite (múltiples páginas automáticas)
 */
export const GET: RequestHandler = async (event) => {
	try {
		await requireAdmin(event);
		const { url } = event;
		const all = url.searchParams.get('all') === 'true';

		if (all) {
			// Obtener TODOS los participantes sin límite
			const data = await AdminParticipantsService.getAllParticipants();
			return json({
				success: true,
				data: {
					data: data,
					pagination: {
						page: 1,
						limit: data.length,
						total: data.length,
						total_pages: 1
					}
				}
			});
		}

		// Paginación normal
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const acreditado = url.searchParams.get('acreditado');

		console.log('🔍 API received acreditado param:', {
			raw: acreditado,
			type: typeof acreditado,
			isTruthy: !!acreditado,
			equalTrue: acreditado === 'true',
			equalFalse: acreditado === 'false',
			equalNull: acreditado === 'null'
		});

		// Handle acreditado parameter: null string -> null, true/false strings -> booleans
		let acreditadoValue: boolean | null | undefined = undefined;
		if (acreditado === 'null') {
			acreditadoValue = null; // Filter for NULL values in database
		} else if (acreditado === 'true') {
			acreditadoValue = true;
		} else if (acreditado === 'false') {
			acreditadoValue = false;
		}

		const filters = {
			nombre: url.searchParams.get('nombre') || undefined,
			email: url.searchParams.get('email') || undefined,
			genero: url.searchParams.get('genero') || undefined,
			acreditado: acreditadoValue,
			facultad_id: url.searchParams.get('facultad_id')
				? parseInt(url.searchParams.get('facultad_id')!)
				: undefined,
			carrera_id: url.searchParams.get('carrera_id')
				? parseInt(url.searchParams.get('carrera_id')!)
				: undefined,
			carrera_nombre: url.searchParams.get('carrera_nombre') || undefined
		};

		console.log('📋 API filters object:', filters);

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
export const POST: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { request } = event;
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
