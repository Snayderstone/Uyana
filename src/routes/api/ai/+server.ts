import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createDeepSeekProvider } from '$lib/ai/models/deepseek';
import type { AIMessage } from '$lib/ai/aiManager';
import { env } from '$env/dynamic/private';

/**
 * Manejador para consultas de IA usando DeepSeek
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Validar Content-Type
		const contentType = request.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) {
			return json({ error: 'Content-Type debe ser application/json' }, { status: 400 });
		}

		// Obtener el cuerpo de la solicitud
		const { messages, options } = await request.json();

		// Validar mensajes
		if (!Array.isArray(messages) || messages.length === 0) {
			return json({ error: 'Se requiere un array de mensajes válido' }, { status: 400 });
		}

		// Validar estructura de mensajes
		for (const message of messages) {
			if (
				!message.role ||
				!message.content ||
				!['system', 'user', 'assistant'].includes(message.role)
			) {
				return json({ error: 'Formato de mensaje inválido' }, { status: 400 });
			}
		}

		// Verificar que tenemos la API key
		if (!env.DEEPSEEK_API_KEY) {
			console.error('DEEPSEEK_API_KEY no está configurada');
			return json({ error: 'Configuración de IA no disponible' }, { status: 500 });
		}

		// Crear el proveedor DeepSeek
		const deepseekProvider = createDeepSeekProvider(env.DEEPSEEK_API_KEY);

		// Generar respuesta
		const response = await deepseekProvider.generateResponse(messages as AIMessage[], options);

		return json({
			success: true,
			data: response
		});
	} catch (error) {
		console.error('Error en consulta de IA:', error);

		const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

		return json(
			{
				error: 'Error al procesar consulta de IA',
				details: errorMessage
			},
			{ status: 500 }
		);
	}
};

/**
 * Manejador para verificar el estado del servicio de IA
 */
export const GET: RequestHandler = async () => {
	try {
		// Verificar que tenemos la API key
		if (!env.DEEPSEEK_API_KEY) {
			return json(
				{
					status: 'error',
					message: 'DEEPSEEK_API_KEY no configurada'
				},
				{ status: 500 }
			);
		}

		// Crear el proveedor y verificar salud
		const deepseekProvider = createDeepSeekProvider(env.DEEPSEEK_API_KEY);
		const healthCheck = await deepseekProvider.healthCheck();

		return json({
			status: healthCheck.healthy ? 'ok' : 'error',
			details: healthCheck.details,
			timestamp: Date.now()
		});
	} catch (error) {
		console.error('Error en health check de IA:', error);

		return json(
			{
				status: 'error',
				message: error instanceof Error ? error.message : 'Error desconocido',
				timestamp: Date.now()
			},
			{ status: 500 }
		);
	}
};
