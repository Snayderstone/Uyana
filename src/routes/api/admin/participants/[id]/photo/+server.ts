/**
 * API Endpoint: Upload/Delete Participant Photo
 * ----------------------------------------------
 * Maneja la subida y eliminación de fotos de participantes.
 *
 * POST   - Sube una nueva foto
 * DELETE - Elimina la foto actual
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	uploadParticipantPhoto,
	deleteParticipantPhoto
} from '$lib/services/storage.service';
import { supabase } from '$lib/db/supabase.client';

/**
 * POST /api/admin/participants/[id]/photo
 * Sube una nueva foto para el participante
 */
export const POST: RequestHandler = async ({ request, params }) => {
	try {
		const { id } = params;
		const participantId = parseInt(id, 10);

		if (isNaN(participantId)) {
			return json({ success: false, message: 'ID de participante inválido' }, { status: 400 });
		}

		// Verificar que el participante existe
		const { data: participant, error: participantError } = await supabase
			.from('participantes')
			.select('id')
			.eq('id', participantId)
			.single();

		if (participantError || !participant) {
			return json({ success: false, message: 'Participante no encontrado' }, { status: 404 });
		}

		// Obtener el archivo del FormData
		const formData = await request.formData();
		const file = formData.get('photo') as File;

		if (!file) {
			return json({ success: false, message: 'No se proporcionó ningún archivo' }, { status: 400 });
		}

		// Subir foto al bucket
		const uploadResult = await uploadParticipantPhoto(file, participantId);

		if (!uploadResult.success) {
			return json(
				{ success: false, message: uploadResult.error || 'Error al subir la imagen' },
				{ status: 500 }
			);
		}

		// Actualizar la BD con la nueva URL
		const { error: updateError } = await supabase
			.from('participantes')
			.update({
				url_foto: uploadResult.url
			})
			.eq('id', participantId);

		if (updateError) {
			console.error('Error updating participant photo URL:', updateError);
			return json(
				{ success: false, message: 'Error al actualizar la URL de la foto en la base de datos' },
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: 'Foto subida correctamente',
			data: {
				url: uploadResult.url
			}
		});
	} catch (error) {
		console.error('Error in POST /api/admin/participants/[id]/photo:', error);
		return json(
			{
				success: false,
				message: error instanceof Error ? error.message : 'Error al subir la foto'
			},
			{ status: 500 }
		);
	}
};

/**
 * DELETE /api/admin/participants/[id]/photo
 * Elimina la foto del participante
 */
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		const participantId = parseInt(id, 10);

		if (isNaN(participantId)) {
			return json({ success: false, message: 'ID de participante inválido' }, { status: 400 });
		}

		// Verificar que el participante existe
		const { data: participant, error: participantError } = await supabase
			.from('participantes')
			.select('id')
			.eq('id', participantId)
			.single();

		if (participantError || !participant) {
			return json({ success: false, message: 'Participante no encontrado' }, { status: 404 });
		}

		// Eliminar foto del bucket
		await deleteParticipantPhoto(participantId);

		// Actualizar la BD
		const { error: updateError } = await supabase
			.from('participantes')
			.update({
				url_foto: null
			})
			.eq('id', participantId);

		if (updateError) {
			console.error('Error updating participant after photo deletion:', updateError);
			return json(
				{
					success: false,
					message: 'Error al actualizar el participante después de eliminar la foto'
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: 'Foto eliminada correctamente'
		});
	} catch (error) {
		console.error('Error in DELETE /api/admin/participants/[id]/photo:', error);
		return json(
			{
				success: false,
				message: error instanceof Error ? error.message : 'Error al eliminar la foto'
			},
			{ status: 500 }
		);
	}
};
