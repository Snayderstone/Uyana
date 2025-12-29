/**
 * API pública de IA para usuarios no autenticados
 * Permite consultas sobre proyectos de investigación de la UCE
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createDeepSeekProvider } from '$lib/ai/models/deepseek';
import type { AIMessage } from '$lib/ai/aiManager';

/**
 * Función para detectar si una consulta necesita herramientas MCP
 */
function necesitaHerramientasMCP(mensaje: string): string | null {
	const msgLower = mensaje.toLowerCase().trim();

	// Patrones para estadísticas de UYANA
	const patronesEstadisticas = [
		/cuántos?\s+proyectos?/,
		/cuánt[oa]s?\s+proyectos?/,
		/estadísticas?/,
		/resumen/,
		/proyectos?\s+de\s+investigación/,
		/facultad/,
		/carrera/,
		/universidad\s+central/,
		/uce/,
		/investigador/,
		/participante/,
		/coordinador/,
		/director/,
		/ranking/,
		/top\s+\d+/,
		/quién?\s+es/,
		/cuál\s+es/,
		/más\s+proyectos/,
		/presupuesto/,
		/financiamiento/,
		/área\s+de\s+conocimiento/,
		/línea\s+de\s+investigación/,
		/institución/,
		/avance/,
		/estado/,
		/temporal/,
		/evolución/,
		/año/,
		/anio/
	];

	for (const patron of patronesEstadisticas) {
		if (patron.test(msgLower)) {
			return 'estadisticas-uyana';
		}
	}

	// Patrones para clima
	const patronesClima = [
		/clima/,
		/tiempo/,
		/temperatura/,
		/pronóstico/,
		/lluvia/,
		/soleado/,
		/nublado/
	];

	for (const patron of patronesClima) {
		if (patron.test(msgLower)) {
			return 'weather';
		}
	}

	// Patrones para fecha y hora
	const patronesFecha = [
		/qué\s+día/,
		/qué\s+fecha/,
		/qué\s+hora/,
		/día\s+es/,
		/fecha\s+es/,
		/hora\s+es/,
		/semana/,
		/mes\s+es/,
		/estación/
	];

	for (const patron of patronesFecha) {
		if (patron.test(msgLower)) {
			return 'fecha-tiempo-ecuador';
		}
	}

	return null;
}

/**
 * Función para invocar herramientas MCP
 */
async function invocarHerramientaMCP(
	herramienta: string,
	consulta: string
): Promise<string | null> {
	try {
		const mcpRequest = {
			jsonrpc: '2.0',
			id: `ai-req-${Date.now()}`,
			method: 'callTool',
			params: {
				name: herramienta,
				arguments:
					herramienta === 'weather'
						? { city: consulta.split(' ').pop() || 'Quito' }
						: herramienta === 'fecha-tiempo-ecuador'
						? { consulta: consulta }
						: {
								consulta: consulta,
								limite: 10
						  }
			}
		};

		const response = await fetch('http://localhost:5173/api/mcp', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(mcpRequest)
		});

		if (!response.ok) {
			console.error('Error al llamar a MCP:', await response.text());
			return null;
		}

		const data = await response.json();

		if (data.error) {
			console.error('Error en respuesta MCP:', data.error);
			return null;
		}

		// Extraer el contenido de la respuesta MCP
		if (data.result && data.result.content) {
			const content = data.result.content;
			if (Array.isArray(content) && content.length > 0) {
				return content[0].text || null;
			}
		}

		return null;
	} catch (error: any) {
		console.error('Error al invocar herramienta MCP:', error);
		return null;
	}
}

/**
 * Manejador para consultas de IA públicas
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Validar Content-Type
		const contentType = request.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) {
			return json(
				{ success: false, error: 'Content-Type debe ser application/json' },
				{ status: 400 }
			);
		}

		// Obtener el cuerpo de la solicitud
		const { messages, options } = await request.json();

		// Validar mensajes
		if (!Array.isArray(messages) || messages.length === 0) {
			return json({ success: false, error: 'Se requiere al menos un mensaje' }, { status: 400 });
		}

		// Validar estructura de mensajes
		for (const message of messages) {
			if (!message.role || !message.content) {
				return json(
					{ success: false, error: 'Cada mensaje debe tener role y content' },
					{ status: 400 }
				);
			}
		}

		// Verificar que tenemos la API key
		if (!env.DEEPSEEK_API_KEY) {
			console.error('DEEPSEEK_API_KEY no está configurada');
			return json({ success: false, error: 'Servicio de IA no disponible' }, { status: 500 });
		}

		// Buscar el último mensaje del usuario para detectar si necesita herramientas MCP
		const ultimoMensajeUsuario = messages.filter((m: AIMessage) => m.role === 'user').pop();

		let mensajesFinales = [...messages];
		let usedMCPTool = false;

		if (ultimoMensajeUsuario) {
			const herramientaNecesaria = necesitaHerramientasMCP(ultimoMensajeUsuario.content);

			if (herramientaNecesaria) {
				console.log(`🔧 Detectada necesidad de herramienta: ${herramientaNecesaria}`);

				// Invocar la herramienta MCP
				const resultadoMCP = await invocarHerramientaMCP(
					herramientaNecesaria,
					ultimoMensajeUsuario.content
				);

				if (resultadoMCP) {
					console.log('✅ Resultado MCP obtenido exitosamente');
					usedMCPTool = true;

					// Agregar el resultado de la herramienta como contexto
					mensajesFinales.push({
						role: 'system',
						content: `Contexto obtenido de la herramienta ${herramientaNecesaria}:\n\n${resultadoMCP}\n\nUSA ESTA INFORMACIÓN para responder a la pregunta del usuario. Presenta los datos de forma clara y organizada.`
					});
				} else {
					console.log('⚠️ No se pudo obtener resultado de MCP, continuando sin herramienta');
				}
			}
		}

		// Crear el proveedor DeepSeek
		const deepseekProvider = createDeepSeekProvider(env.DEEPSEEK_API_KEY);

		// Generar respuesta
		const aiResponse = await deepseekProvider.generateResponse(mensajesFinales, {
			...options,
			temperature: options?.temperature || 0.7,
			maxTokens: options?.maxTokens || 4000
		});

		return json({
			success: true,
			data: aiResponse,
			metadata: {
				usedMCPTool,
				timestamp: Date.now()
			}
		});
	} catch (error: any) {
		console.error('Error en /api/ai:', error);

		return json(
			{
				success: false,
				error: error.message || 'Error al procesar la solicitud',
				details: error.stack
			},
			{ status: 500 }
		);
	}
};

/**
 * Manejador para verificar el estado del servicio de IA público
 */
export const GET: RequestHandler = async () => {
	try {
		if (!env.DEEPSEEK_API_KEY) {
			return json(
				{
					status: 'error',
					message: 'Servicio de IA no configurado',
					details: { apiKeyConfigured: false }
				},
				{ status: 503 }
			);
		}

		return json({
			status: 'ok',
			message: 'Servicio de IA público disponible',
			details: {
				apiKeyConfigured: true,
				version: '1.0.0',
				provider: 'DeepSeek',
				availableTools: ['estadisticas-uyana', 'weather', 'fecha-tiempo-ecuador']
			}
		});
	} catch (error: any) {
		return json(
			{
				status: 'error',
				message: 'Error al verificar el estado del servicio',
				details: { error: error.message }
			},
			{ status: 500 }
		);
	}
};
