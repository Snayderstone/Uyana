import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createDeepSeekProvider } from '$lib/ai/models/deepseek';
import type { AIMessage } from '$lib/ai/aiManager';
import { env } from '$env/dynamic/private';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * Función para detectar si una consulta necesita herramientas MCP
 */
function necesitaHerramientasMCP(mensaje: string): string | null {
	const msgLower = mensaje.toLowerCase().trim();

	// Patrones para proyectos de investigación UCE
	const patronesProyectos = [
		/cuántos?\s+proyectos?/,
		/cuánt[oa]s?\s+proyectos?/,
		/proyectos?\s+de\s+investigación/,
		/proyectos?\s+tiene/,
		/facultad/,
		/universidad\s+central/,
		/uce/,
		/investigador/,
		/coordinador/,
		/director/,
		/ranking\s+de\s+investigadores?/,
		/top\s+\d+\s+investigadores?/,
		/quién?\s+es\s+el\s+investigador/,
		/cuál\s+es\s+el\s+investigador/,
		/investigador\s+que\s+más/,
		/coordinador\s+que\s+más/,
		/director\s+que\s+más/,
		/más\s+proyectos?\s+ha\s+dirigido/,
		/estadísticas?\s+de\s+investigadores?/,
		/productividad\s+de\s+investigadores?/
	];

	for (const patron of patronesProyectos) {
		if (patron.test(msgLower)) {
			return 'proyectos-uce';
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
				arguments: {
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
			console.error('Error al llamar herramienta MCP:', response.status, response.statusText);
			return null;
		}

		const data = await response.json();

		if (data.error) {
			console.error('Error en respuesta MCP:', data.error);
			return null;
		}

		// Extraer el contenido de la respuesta MCP
		if (data.result && data.result.content) {
			if (Array.isArray(data.result.content)) {
				return data.result.content.map((c) => c.text || c.content || c).join('\n');
			} else if (typeof data.result.content === 'string') {
				return data.result.content;
			} else if (data.result.content.text) {
				return data.result.content.text;
			}
		}

		return null;
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		console.error('Error al invocar herramienta MCP:', error);
		return null;
	}
}

/**
 * Manejador para consultas de IA usando DeepSeek
 */
export const POST: RequestHandler = async (event) => {
	try {
		const usuario = await requireAdmin(event);
		const { request } = event;
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

		// Buscar el último mensaje del usuario para detectar si necesita herramientas MCP
		const ultimoMensajeUsuario = messages.filter((m) => m.role === 'user').pop();

		let mensajesFinales = [...messages];
		let usedMCPTool = false;

		if (ultimoMensajeUsuario) {
			const herramientaNecesaria = necesitaHerramientasMCP(ultimoMensajeUsuario.content);

			if (herramientaNecesaria) {
				console.log('Detectada necesidad de herramienta MCP:', herramientaNecesaria);

				// Invocar la herramienta MCP
				const resultadoMCP = await invocarHerramientaMCP(
					herramientaNecesaria,
					ultimoMensajeUsuario.content
				);

				if (resultadoMCP) {
					// Agregar el resultado de la herramienta MCP como contexto
					mensajesFinales.push({
						role: 'assistant',
						content: `[Información obtenida de la base de datos de proyectos UCE]:\n\n${resultadoMCP}`
					});

					// Agregar instrucción para usar esta información
					mensajesFinales.push({
						role: 'user',
						content: `Basándote en la información anterior sobre proyectos de investigación de la UCE, responde a mi consulta original: "${ultimoMensajeUsuario.content}"`
					});

					usedMCPTool = true;
					console.log('Herramienta MCP ejecutada exitosamente');
				} else {
					console.log(
						'No se pudo obtener resultado de herramienta MCP, continuando sin herramientas'
					);
				}
			}
		}

		// Crear el proveedor DeepSeek
		const deepseekProvider = createDeepSeekProvider(env.DEEPSEEK_API_KEY);

		// Generar respuesta
		const response = await deepseekProvider.generateResponse(
			mensajesFinales as AIMessage[],
			options
		);

		console.log(`[AUDIT] ${usuario.email} post`);
		return json({
			success: true,
			data: {
				...response,
				mcpToolUsed: usedMCPTool
			}
		});
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
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
	} catch (error: any) {
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
		if (error.message === 'No autenticado' || error.message === 'Permisos insuficientes') {
			return jsonError('No autorizado', 401);
		}
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
