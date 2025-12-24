import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { processMcpRequest, deleteSession, getServerStats } from '$lib/mcp-core/server/mcpServer';
import { McpValidation, JsonRpcErrorCodes } from '$lib/mcp-core/shared/types';
import type { JsonRpcRequest } from '$lib/mcp-core/shared/types';
import { mcpLogger } from '$lib/mcp-core/shared/mcpLogger';

/**
 * Cabecera para el ID de sesión MCP
 */
const SESSION_ID_HEADER = 'mcp-session-id';

/**
 * Manejador de solicitudes POST para llamadas MCP
 */
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const startTime = Date.now();
	const requestId = `api-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

	// Establecer ID de solicitud para logs
	mcpLogger.setRequestId(requestId);

	try {
		// Obtener ID de sesión y metadata
		const sessionId = request.headers.get(SESSION_ID_HEADER);
		const userAgent = request.headers.get('user-agent') || 'unknown';
		const clientAddress = getClientAddress();
		const requestUrl = request.url;

		// Registrar nueva solicitud recibida
		mcpLogger.info('API_MCP', 'REQUEST_RECEIVED', 'Nueva solicitud MCP recibida', {
			url: requestUrl,
			method: 'POST',
			sessionId: sessionId || 'new-session',
			clientAddress,
			requestId
		});

		// Metadata de la solicitud
		const requestMetadata = {
			userAgent,
			ipAddress: clientAddress,
			timestamp: Date.now(),
			requestId
		};

		mcpLogger.debug('API_MCP', 'REQUEST_METADATA', 'Metadata de la solicitud', requestMetadata);

		// Procesar el cuerpo de la solicitud
		let body: JsonRpcRequest;
		try {
			body = await request.json();
			mcpLogger.debug('API_MCP', 'REQUEST_BODY', 'Cuerpo de la solicitud JSON-RPC', body);
		} catch (parseError) {
			mcpLogger.error('API_MCP', 'PARSE_ERROR', 'Error parseando JSON de la solicitud', {
				error: parseError,
				headers: Object.fromEntries(request.headers.entries())
			});

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
			mcpLogger.error('API_MCP', 'INVALID_REQUEST', 'Solicitud JSON-RPC inválida', {
				body,
				validation: 'failed',
				requestId
			});

			return json(
				McpValidation.createJsonRpcError(
					(body as any)?.id || null,
					JsonRpcErrorCodes.INVALID_REQUEST,
					'Solicitud JSON-RPC inválida'
				),
				{ status: 400 }
			);
		}

		mcpLogger.info('API_MCP', 'JSON_RPC_VALID', `Solicitud JSON-RPC válida: ${body.method}`, {
			method: body.method,
			id: body.id
		});

		// Procesar la solicitud MCP
		mcpLogger.info('API_MCP', 'PROCESSING_START', `Enviando solicitud a mcpServer: ${body.method}`);

		const processStartTime = Date.now();
		const { response, sessionId: newSessionId } = await processMcpRequest(
			body,
			sessionId || undefined,
			requestMetadata
		);

		const processDuration = Date.now() - processStartTime;
		mcpLogger.info(
			'API_MCP',
			'PROCESSING_COMPLETE',
			`Procesamiento completado para ${body.method}`,
			{
				duration: `${processDuration}ms`,
				method: body.method,
				hasError: !!response.error
			}
		);

		// Determinar el código de estado HTTP
		const statusCode = response.error
			? response.error.code === JsonRpcErrorCodes.INVALID_REQUEST
				? 400
				: 500
			: 200;

		mcpLogger.debug('API_MCP', 'RESPONSE_DATA', 'Datos de la respuesta', {
			statusCode,
			sessionId: newSessionId,
			response
		});

		// Construir la respuesta
		const totalDuration = Date.now() - startTime;

		// Registrar estadísticas completas de la solicitud
		mcpLogger.info('API_MCP', 'REQUEST_COMPLETE', `Solicitud MCP completada: ${body.method}`, {
			method: body.method,
			id: body.id,
			statusCode,
			sessionId: newSessionId,
			duration: `${totalDuration}ms`,
			hasError: !!response.error
		});

		return new Response(JSON.stringify(response), {
			status: statusCode,
			headers: {
				'Content-Type': 'application/json',
				[SESSION_ID_HEADER]: newSessionId,
				'Cache-Control': 'no-cache',
				'X-MCP-Server': 'uyana-mcp-server/2.0.0',
				'X-Request-ID': requestId,
				'X-Response-Time': `${totalDuration}ms`
			}
		});
	} catch (error) {
		const totalDuration = Date.now() - startTime;

		mcpLogger.error('API_MCP', 'CRITICAL_ERROR', 'Error crítico en API MCP', {
			error: error instanceof Error ? error.message : String(error),
			stackTrace: error instanceof Error ? error.stack : undefined,
			duration: `${totalDuration}ms`,
			requestId
		});

		const errorResponse = McpValidation.createJsonRpcError(
			null,
			JsonRpcErrorCodes.INTERNAL_ERROR,
			'Error interno del servidor MCP'
		);

		return json(errorResponse, {
			status: 500,
			headers: {
				'X-MCP-Error': 'internal-server-error',
				'X-Request-ID': requestId,
				'X-Response-Time': `${totalDuration}ms`
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
						stats: '/api/admin/mcp?action=stats',
						health: '/api/admin/mcp?action=health',
						events: '/api/admin/mcp?action=events'
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
