import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { processMcpRequest, deleteSession, getServerStats } from '$lib/mcp-core/server/mcpServer';
import { McpValidation, JsonRpcErrorCodes } from '$lib/mcp-core/shared/types';
import type { JsonRpcRequest } from '$lib/mcp-core/shared/types';

/**
 * Cabecera para el ID de sesión MCP
 */
const SESSION_ID_HEADER = 'mcp-session-id';

/**
 * Manejador de solicitudes POST para llamadas MCP
 */
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		// Obtener ID de sesión y metadata
		const sessionId = request.headers.get(SESSION_ID_HEADER);
		const userAgent = request.headers.get('user-agent') || 'unknown';
		const clientAddress = getClientAddress();

		// Metadata de la solicitud
		const requestMetadata = {
			userAgent,
			ipAddress: clientAddress,
			timestamp: Date.now()
		};

		// Procesar el cuerpo de la solicitud
		let body: JsonRpcRequest;
		try {
			body = await request.json();
		} catch (parseError) {
			return json(
				McpValidation.createJsonRpcError(
					null,
					JsonRpcErrorCodes.PARSE_ERROR,
					'Error parseando JSON de la solicitud'
				),
				{ status: 400 }
			);
		}

		// Validar que sea una solicitud JSON-RPC válida
		if (!McpValidation.isValidJsonRpcRequest(body)) {
			return json(
				McpValidation.createJsonRpcError(
					(body as any)?.id || null,
					JsonRpcErrorCodes.INVALID_REQUEST,
					'Solicitud JSON-RPC inválida'
				),
				{ status: 400 }
			);
		}

		// Procesar la solicitud MCP
		const { response, sessionId: newSessionId } = await processMcpRequest(
			body,
			sessionId || undefined,
			requestMetadata
		);

		// Determinar el código de estado HTTP
		const statusCode = response.error
			? response.error.code === JsonRpcErrorCodes.INVALID_REQUEST
				? 400
				: 500
			: 200;

		// Construir la respuesta
		return new Response(JSON.stringify(response), {
			status: statusCode,
			headers: {
				'Content-Type': 'application/json',
				[SESSION_ID_HEADER]: newSessionId,
				'Cache-Control': 'no-cache',
				'X-MCP-Server': 'uyana-mcp-server/2.0.0'
			}
		});
	} catch (error) {
		console.error('Error crítico en POST /api/mcp:', error);

		const errorResponse = McpValidation.createJsonRpcError(
			null,
			JsonRpcErrorCodes.INTERNAL_ERROR,
			'Error interno del servidor MCP'
		);

		return json(errorResponse, {
			status: 500,
			headers: {
				'X-MCP-Error': 'internal-server-error'
			}
		});
	}
};

/**
 * Manejador de solicitudes GET para estado del servidor y eventos SSE
 */
export const GET: RequestHandler = async ({ request, url }) => {
	try {
		const searchParams = url.searchParams;
		const action = searchParams.get('action');

		// Manejo de diferentes acciones GET
		switch (action) {
			case 'stats':
				// Retornar estadísticas del servidor
				const stats = getServerStats();
				return json(stats);

			case 'health':
				// Verificación de salud del servidor
				return json({
					status: 'healthy',
					timestamp: Date.now(),
					server: 'uyana-mcp-server',
					version: '2.0.0'
				});

			case 'events':
				// Configurar SSE para eventos en tiempo real
				return createSSEResponse(request);

			default:
				// Información básica del servidor
				return json({
					name: 'uyana-mcp-server',
					version: '2.0.0',
					description: 'Servidor MCP para la plataforma UYANA',
					endpoints: {
						stats: '/api/mcp?action=stats',
						health: '/api/mcp?action=health',
						events: '/api/mcp?action=events'
					},
					documentation: 'https://docs.uyana.com/mcp'
				});
		}
	} catch (error) {
		console.error('Error en GET /api/mcp:', error);
		return json({ error: 'Error interno del servidor' }, { status: 500 });
	}
};

/**
 * Manejador de solicitudes DELETE para terminar sesiones
 */
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const sessionId = request.headers.get(SESSION_ID_HEADER);

		if (!sessionId) {
			return json(
				McpValidation.createJsonRpcError(
					null,
					JsonRpcErrorCodes.INVALID_REQUEST,
					'ID de sesión requerido en el header'
				),
				{ status: 400 }
			);
		}

		const deleted = deleteSession(sessionId);

		if (deleted) {
			return json({
				success: true,
				message: 'Sesión terminada correctamente',
				sessionId
			});
		} else {
			return json(
				McpValidation.createJsonRpcError(
					null,
					JsonRpcErrorCodes.SESSION_NOT_FOUND,
					'Sesión no encontrada'
				),
				{ status: 404 }
			);
		}
	} catch (error) {
		console.error('Error en DELETE /api/mcp:', error);
		return json({ error: 'Error interno del servidor' }, { status: 500 });
	}
};

/**
 * Crea una respuesta SSE para eventos en tiempo real
 */
function createSSEResponse(request: Request): Response {
	const sessionId = request.headers.get(SESSION_ID_HEADER);

	if (!sessionId) {
		return new Response('Session ID required', { status: 400 });
	}

	const stream = new ReadableStream({
		start(controller) {
			// Configuración inicial SSE
			controller.enqueue('retry: 10000\n\n');

			// Evento de conexión exitosa
			controller.enqueue(`event: connected\n`);
			controller.enqueue(
				`data: ${JSON.stringify({
					sessionId,
					timestamp: Date.now(),
					message: 'Conectado al servidor MCP'
				})}\n\n`
			);

			// Ping periódico para mantener la conexión viva
			const pingInterval = setInterval(() => {
				try {
					controller.enqueue(`event: ping\n`);
					controller.enqueue(
						`data: ${JSON.stringify({
							timestamp: Date.now()
						})}\n\n`
					);
				} catch (error) {
					// La conexión se cerró, limpiar el intervalo
					clearInterval(pingInterval);
				}
			}, 30000); // Cada 30 segundos

			// Limpiar cuando el cliente cierra la conexión
			request.signal.addEventListener('abort', () => {
				clearInterval(pingInterval);
				controller.close();
			});
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Cache-Control',
			[SESSION_ID_HEADER]: sessionId
		}
	});
}
