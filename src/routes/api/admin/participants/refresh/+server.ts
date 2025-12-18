/**
 * Admin API - Refresh Views Endpoint
 * -----------------------------------
 * POST /api/admin/participants/refresh - Refrescar vistas materializadas
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { AdminParticipantsService } from '$lib/services/admin/participants.service';

/**
 * POST - Refrescar todas las vistas materializadas de participantes
 */
export const POST: RequestHandler = async () => {
	try {
		console.log('🔄 Iniciando refresh de vistas materializadas...');

		const success = await AdminParticipantsService.refreshViews();

		if (!success) {
			console.error('❌ El servicio de refresh retornó false');
			return json(
				{
					success: false,
					message: 'Error al refrescar vistas materializadas',
					details:
						'La función refresh_participantes_stats() puede no existir en la base de datos. Ejecuta database/views_participantes.sql'
				},
				{ status: 500 }
			);
		}

		console.log('✅ Vistas materializadas refrescadas correctamente');

		return json({
			success: true,
			message: 'Vistas materializadas refrescadas correctamente'
		});
	} catch (error) {
		console.error('❌ Error crítico al refrescar vistas:', error);

		const errorMessage = error instanceof Error ? error.message : String(error);
		const isDbFunctionError =
			errorMessage.includes('does not exist') || errorMessage.includes('function');

		return json(
			{
				success: false,
				message: isDbFunctionError
					? 'La función de refresh no existe en la base de datos'
					: 'Error al refrescar vistas materializadas',
				details: errorMessage,
				suggestion: isDbFunctionError
					? 'Ejecuta el script database/views_participantes.sql en tu base de datos Supabase'
					: 'Verifica la conexión con la base de datos y los logs del servidor'
			},
			{ status: 500 }
		);
	}
};
