/**
 * API pública de MCP para usuarios no autenticados
 * Permite acceso a herramientas MCP sin autenticación
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import type { JsonRpcRequest, JsonRpcResponse } from '$lib/mcp-core/shared/types';
import { McpValidation, JsonRpcErrorCodes } from '$lib/mcp-core/shared/types';
import { processMcpRequest, deleteSession, getServerStats } from '$lib/mcp-core/server/mcpServer';
import { mcpLogger } from '$lib/mcp-core/shared/mcpLogger';

/**
 * Cabecera para el ID de sesión MCP
 */
const SESSION_ID_HEADER = 'mcp-session-id';

/**
 * Manejador de solicitudes POST para llamadas MCP públicas
 */
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const startTime = Date.now();
	const requestId = `public-api-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

	// Establecer ID de solicitud para logs
	mcpLogger.setRequestId(requestId);

	try {
		// Obtener ID de sesión y metadata
		const sessionId = request.headers.get(SESSION_ID_HEADER);
		const userAgent = request.headers.get('user-agent') || 'unknown';
		const clientAddress = getClientAddress();
		const requestUrl = request.url;

		// Registrar nueva solicitud recibida
		mcpLogger.info('API_MCP_PUBLIC', 'REQUEST_RECEIVED', 'Nueva solicitud MCP pública recibida', {
			url: requestUrl,
			method: 'POST',
			sessionId: sessionId || 'new-session',
			requestId
		});

		// Procesar el cuerpo de la solicitud
		let body: JsonRpcRequest;
		try {
			body = await request.json();
		} catch (parseError) {
			mcpLogger.error('API_MCP_PUBLIC', 'PARSE_ERROR', 'Error al parsear JSON de la solicitud', {
				error: parseError
			});

			return json(
				McpValidation.createJsonRpcError(
					null,
					JsonRpcErrorCodes.PARSE_ERROR,
					'Error al parsear la solicitud JSON'
				),
				{ status: 400 }
			);
		}

		// Validar que sea una solicitud JSON-RPC válida
		if (!McpValidation.isValidJsonRpcRequest(body)) {
			mcpLogger.warn('API_MCP_PUBLIC', 'INVALID_REQUEST', 'Solicitud JSON-RPC inválida', {
				body
			});

			const bodyId = (body as any).id || null;

			return json(
				McpValidation.createJsonRpcError(
					bodyId,
					JsonRpcErrorCodes.INVALID_REQUEST,
					'Solicitud JSON-RPC inválida'
				),
				{ status: 400 }
			);
		}

		mcpLogger.info('API_MCP_PUBLIC', 'REQUEST', `${body.method} - ${body.id}`);

		const processStartTime = Date.now();
		const { response, sessionId: newSessionId } = await processMcpRequest(
			body,
			sessionId || undefined,
			{
				userAgent,
				ipAddress: clientAddress,
				timestamp: Date.now(),
				requestId,
				isPublic: true
			}
		);

		const processDuration = Date.now() - processStartTime;
		const statusCode = response.error
			? response.error.code === JsonRpcErrorCodes.INVALID_REQUEST
				? 400
				: 500
			: 200;

		// Calcular tiempo total
		const totalDuration = Date.now() - startTime;
		mcpLogger.info('API_MCP_PUBLIC', 'COMPLETE', `${body.method} completado`, {
			status: statusCode,
			duration: `${totalDuration}ms`
		});

		// Retornar la respuesta con el header de sesión
		return json(response, {
			status: statusCode,
			headers: {
				[SESSION_ID_HEADER]: newSessionId
			}
		});
	} catch (error: any) {
		const totalDuration = Date.now() - startTime;

		mcpLogger.error('API_MCP_PUBLIC', 'UNCAUGHT_ERROR', 'Error no capturado en API MCP pública', {
			error: error.message,
			stack: error.stack,
			duration: `${totalDuration}ms`
		});

		return json(
			McpValidation.createJsonRpcError(
				null,
				JsonRpcErrorCodes.INTERNAL_ERROR,
				'Error interno del servidor',
				{ message: error.message }
			),
			{ status: 500 }
		);
	}
};

/**
 * Manejador de solicitudes GET para estado del servidor público
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const includeStats = url.searchParams.get('stats') === 'true';

		const response: any = {
			status: 'ok',
			message: 'Servidor MCP público operativo',
			version: '2.0.0',
			isPublic: true,
			availableTools: ['estadisticas-sigpi', 'weather', 'fecha-tiempo-ecuador'],
			capabilities: {
				tools: true,
				resources: true,
				prompts: true,
				logging: true
			}
		};

		if (includeStats) {
			response.stats = getServerStats();
		}

		mcpLogger.info('API_MCP_PUBLIC', 'HEALTH_CHECK', 'Health check exitoso', {
			includeStats
		});

		return json(response);
	} catch (error: any) {
		mcpLogger.error('API_MCP_PUBLIC', 'HEALTH_CHECK_ERROR', 'Error en health check', {
			error: error.message
		});

		return json(
			{
				status: 'error',
				message: 'Error al obtener el estado del servidor',
				details: { error: error.message }
			},
			{ status: 500 }
		);
	}
};

/**
 * Manejador de solicitudes DELETE para terminar sesiones públicas
 */
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const sessionId = request.headers.get(SESSION_ID_HEADER);

		if (!sessionId) {
			return json(
				{
					success: false,
					message: 'Se requiere un ID de sesión'
				},
				{ status: 400 }
			);
		}

		mcpLogger.info('API_MCP_PUBLIC', 'DELETE_SESSION', `Eliminando sesión pública: ${sessionId}`);

		const deleted = deleteSession(sessionId);

		if (deleted) {
			mcpLogger.info('API_MCP_PUBLIC', 'SESSION_DELETED', `Sesión eliminada: ${sessionId}`);

			return json({
				success: true,
				message: 'Sesión eliminada correctamente',
				sessionId
			});
		} else {
			mcpLogger.warn('API_MCP_PUBLIC', 'SESSION_NOT_FOUND', `Sesión no encontrada: ${sessionId}`);

			return json(
				{
					success: false,
					message: 'Sesión no encontrada'
				},
				{ status: 404 }
			);
		}
	} catch (error: any) {
		mcpLogger.error('API_MCP_PUBLIC', 'DELETE_ERROR', 'Error al eliminar sesión', {
			error: error.message
		});

		return json(
			{
				success: false,
				message: 'Error al eliminar la sesión',
				details: { error: error.message }
			},
			{ status: 500 }
		);
	}
};
