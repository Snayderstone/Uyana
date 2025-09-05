import type { AIMessage, AIResponse } from './aiManager';
import { mcpLogger } from '../mcp-core/shared/mcpLogger';

/**
 * Cliente para hacer llamadas a la API de IA del servidor
 */
export class AIClientManager {
	private baseUrl: string;

	constructor(baseUrl: string = '/api/ai') {
		this.baseUrl = baseUrl;
	}

	/**
	 * Genera una respuesta usando el servidor de IA
	 */
	async generateResponse(
		messages: AIMessage[],
		options?: Record<string, any>
	): Promise<AIResponse> {
		const startTime = Date.now();
		const requestId = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

		// Establecer ID único para esta solicitud
		mcpLogger.setRequestId(requestId);

		// Registrar solicitud de AI
		mcpLogger.info('AI_CLIENT', 'REQUEST_START', 'Iniciando solicitud al modelo de IA', {
			model: options?.model || 'default',
			messageCount: messages.length,
			lastMessageRole: messages[messages.length - 1]?.role,
			options
		});

		// Registrar entrada de usuario para análisis posterior
		mcpLogger.userInput(messages[messages.length - 1]?.content || '', {
			history: messages.length > 1,
			historySize: messages.length - 1
		});

		// Registrar contexto completo enviado al modelo (nivel debug)
		mcpLogger.debug('AI_CLIENT', 'CONTEXT', 'Contexto completo enviado al modelo', {
			messages,
			options
		});

		// Registrar procesamiento de AI
		mcpLogger.aiProcessing(messages, options?.model || 'deepseek');

		try {
			mcpLogger.debug('AI_CLIENT', 'HTTP_REQUEST', `Enviando solicitud a ${this.baseUrl}`);

			const response = await fetch(this.baseUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Request-ID': requestId
				},
				body: JSON.stringify({
					messages,
					options
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const errorMsg =
					errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`;

				mcpLogger.error('AI_CLIENT', 'HTTP_ERROR', `Error en respuesta HTTP: ${errorMsg}`, {
					status: response.status,
					statusText: response.statusText,
					errorData
				});

				throw new Error(errorMsg);
			}

			const data = await response.json();
			const duration = Date.now() - startTime;

			if (!data.success || !data.data) {
				mcpLogger.error('AI_CLIENT', 'INVALID_RESPONSE', 'Respuesta inválida del servidor', {
					data,
					duration: `${duration}ms`
				});

				throw new Error('Respuesta inválida del servidor');
			}

			// Registrar éxito y estadísticas
			mcpLogger.info('AI_CLIENT', 'RESPONSE_SUCCESS', `Respuesta de IA generada exitosamente`, {
				model: options?.model || 'default',
				duration: `${duration}ms`,
				tokenStats: data.data.usage || {}
			});

			// Registrar respuesta detallada (nivel debug)
			mcpLogger.debug('AI_CLIENT', 'RESPONSE_DETAIL', 'Respuesta detallada de IA', {
				response: data.data
			});

			// Registrar respuesta en formato estandarizado
			mcpLogger.aiResponse(data.data, duration);

			return data.data;
		} catch (error) {
			const duration = Date.now() - startTime;

			mcpLogger.error('AI_CLIENT', 'REQUEST_FAILED', 'Error en llamada a IA', {
				error: error instanceof Error ? error.message : String(error),
				stackTrace: error instanceof Error ? error.stack : undefined,
				model: options?.model || 'default',
				duration: `${duration}ms`
			});

			throw new Error(
				error instanceof Error ? error.message : 'Error al conectar con el servidor de IA'
			);
		}
	}

	/**
	 * Verifica el estado del servicio de IA
	 */
	async healthCheck(): Promise<{ healthy: boolean; details?: any }> {
		try {
			const response = await fetch(this.baseUrl, {
				method: 'GET'
			});

			const data = await response.json();

			return {
				healthy: data.status === 'ok',
				details: data.details || data
			};
		} catch (error) {
			return {
				healthy: false,
				details: {
					error: error instanceof Error ? error.message : String(error)
				}
			};
		}
	}

	/**
	 * Obtiene información del modelo (simulado)
	 */
	getModelInfo() {
		return {
			name: 'deepseek-chat',
			provider: 'server-side',
			description: 'DeepSeek AI model running on server'
		};
	}
}

/**
 * Instancia global del cliente de IA
 */
export const aiClient = new AIClientManager();
