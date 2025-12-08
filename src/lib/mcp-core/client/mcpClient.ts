import type { JsonRpcRequest, JsonRpcResponse, McpValidation, McpResponse } from '../shared/types';
import { mcpLogger } from '../shared/mcpLogger';

/**
 * Configuración del cliente MCP
 */
export interface McpClientConfig {
	baseUrl: string;
	timeout: number;
	retries: number;
	sessionId?: string;
	headers?: Record<string, string>;
}

/**
 * Cliente MCP para comunicarse con servidores MCP
 */
export class McpClient {
	private config: McpClientConfig;
	private sessionId: string | null = null;
	private requestCounter = 0;

	constructor(config: Partial<McpClientConfig> = {}) {
		this.config = {
			baseUrl: '/api/mcp',
			timeout: 30000,
			retries: 3,
			...config
		};

		this.sessionId = config.sessionId || null;
	}

	/**
	 * Genera un ID único para la solicitud
	 */
	private generateRequestId(): string {
		const requestId = `req-${Date.now()}-${++this.requestCounter}`;
		mcpLogger.setRequestId(requestId);
		return requestId;
	}

	/**
	 * Realiza una solicitud HTTP con reintentos
	 */
	private async makeRequest(
		request: JsonRpcRequest,
		attempt = 1
	): Promise<{ response: JsonRpcResponse; sessionId?: string }> {
		const startTime = Date.now();
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

		// Registrar solicitud iniciada
		mcpLogger.info('MCP_CLIENT', 'REQUEST_START', `Iniciando solicitud ${request.method}`, {
			requestId: request.id,
			method: request.method,
			params: request.params,
			attempt: attempt
		});

		try {
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				...this.config.headers
			};

			// Agregar ID de sesión si existe
			if (this.sessionId) {
				headers['mcp-session-id'] = this.sessionId;
				mcpLogger.debug('MCP_CLIENT', 'SESSION', `Usando sessionId: ${this.sessionId}`);
			}

			// Registrar detalles de la solicitud HTTP
			mcpLogger.debug(
				'MCP_CLIENT',
				'HTTP_REQUEST',
				`Enviando solicitud POST a ${this.config.baseUrl}`,
				{
					headers,
					body: request
				}
			);

			const httpResponse = await fetch(this.config.baseUrl, {
				method: 'POST',
				headers,
				body: JSON.stringify(request),
				signal: controller.signal
			});

			if (!httpResponse.ok) {
				const errorMsg = `HTTP ${httpResponse.status}: ${httpResponse.statusText}`;
				mcpLogger.error('MCP_CLIENT', 'HTTP_ERROR', errorMsg, {
					status: httpResponse.status,
					statusText: httpResponse.statusText,
					url: this.config.baseUrl
				});
				throw new Error(errorMsg);
			}

			// Extraer ID de sesión de la respuesta
			const newSessionId = httpResponse.headers.get('mcp-session-id');
			if (newSessionId && newSessionId !== this.sessionId) {
				this.sessionId = newSessionId;
				mcpLogger.info('MCP_CLIENT', 'SESSION_UPDATED', `Nuevo sessionId: ${newSessionId}`);
			}

			const response: JsonRpcResponse = await httpResponse.json();
			const duration = Date.now() - startTime;

			// Registrar respuesta exitosa
			if (response.error) {
				mcpLogger.warn(
					'MCP_CLIENT',
					'JSON_RPC_ERROR',
					`Error en respuesta JSON-RPC: ${response.error.message}`,
					{
						error: response.error,
						requestId: request.id,
						duration: `${duration}ms`
					}
				);
			} else {
				mcpLogger.info(
					'MCP_CLIENT',
					'REQUEST_SUCCESS',
					`Solicitud ${request.method} completada en ${duration}ms`,
					{
						requestId: request.id,
						duration: `${duration}ms`,
						hasResult: response.result !== undefined
					}
				);

				// Registrar detalles de respuesta en debug
				mcpLogger.debug(
					'MCP_CLIENT',
					'RESPONSE_DETAIL',
					`Respuesta detallada para ${request.method}`,
					{
						result: response.result
					}
				);
			}

			// Registrar respuesta MCP
			mcpLogger.mcpResponse(request.method, response.result, duration);

			return { response, sessionId: newSessionId || undefined };
		} catch (error) {
			const duration = Date.now() - startTime;

			if (attempt < this.config.retries && this.shouldRetry(error)) {
				mcpLogger.warn(
					'MCP_CLIENT',
					'RETRY',
					`Reintento ${attempt}/${this.config.retries} para solicitud MCP`,
					{
						error: error instanceof Error ? error.message : String(error),
						requestId: request.id,
						method: request.method,
						duration: `${duration}ms`
					}
				);

				await this.delay(Math.pow(2, attempt) * 1000); // Backoff exponencial
				return this.makeRequest(request, attempt + 1);
			}

			mcpLogger.error(
				'MCP_CLIENT',
				'REQUEST_FAILED',
				`Solicitud ${request.method} falló definitivamente`,
				{
					error: error instanceof Error ? error.message : String(error),
					stackTrace: error instanceof Error ? error.stack : undefined,
					requestId: request.id,
					method: request.method,
					duration: `${duration}ms`,
					attempts: attempt
				}
			);

			throw error;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	/**
	 * Determina si un error debe reintentarse
	 */
	private shouldRetry(error: any): boolean {
		// Reintentar en errores de red, timeout, o errores 5xx
		return (
			error.name === 'AbortError' ||
			error.name === 'TypeError' ||
			(error.message && error.message.includes('fetch'))
		);
	}

	/**
	 * Espera un tiempo determinado
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Envía una solicitud JSON-RPC al servidor MCP
	 */
	async sendRequest(method: string, params?: any): Promise<any> {
		const requestId = this.generateRequestId();
		const request: JsonRpcRequest = {
			jsonrpc: '2.0',
			id: requestId,
			method,
			params
		};

		// Registrar solicitud MCP
		mcpLogger.mcpRequest(method, params);

		const { response } = await this.makeRequest(request);

		if (response.error) {
			const errorMsg = `Error MCP [${response.error.code}]: ${response.error.message}`;
			mcpLogger.error('MCP_CLIENT', 'RPC_ERROR', errorMsg, {
				code: response.error.code,
				message: response.error.message,
				data: response.error.data
			});
			throw new Error(errorMsg);
		}

		return response.result;
	}

	/**
	 * Inicializa la conexión con el servidor MCP
	 */
	async initialize(): Promise<any> {
		return this.sendRequest('initialize');
	}

	/**
	 * Lista las herramientas disponibles
	 */
	async listTools(): Promise<any[]> {
		const result = await this.sendRequest('listTools');
		return result.tools || [];
	}

	/**
	 * Ejecuta una herramienta específica
	 */
	async callTool(name: string, args: any = {}): Promise<McpResponse> {
		return this.sendRequest('callTool', { name, arguments: args });
	}

	/**
	 * Lista los recursos disponibles
	 */
	async listResources(): Promise<any[]> {
		const result = await this.sendRequest('listResources');
		return result.resources || [];
	}

	/**
	 * Obtiene un recurso específico
	 */
	async getResource(name: string): Promise<McpResponse> {
		return this.sendRequest('getResource', { name });
	}

	/**
	 * Lista los prompts disponibles
	 */
	async listPrompts(): Promise<any[]> {
		const result = await this.sendRequest('listPrompts');
		return result.prompts || [];
	}

	/**
	 * Obtiene un prompt específico
	 */
	async getPrompt(name: string, variables?: Record<string, any>): Promise<any> {
		return this.sendRequest('getPrompt', { name, variables });
	}

	/**
	 * Envía un ping al servidor
	 */
	async ping(): Promise<{ status: string; timestamp: number }> {
		return this.sendRequest('ping');
	}

	/**
	 * Verifica la salud de la conexión
	 */
	async healthCheck(): Promise<{ healthy: boolean; details?: any }> {
		try {
			const response = await this.ping();
			return {
				healthy: response.status === 'pong',
				details: {
					sessionId: this.sessionId,
					latency: Date.now() - response.timestamp,
					serverTime: response.timestamp
				}
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
	 * Obtiene el ID de sesión actual
	 */
	getSessionId(): string | null {
		return this.sessionId;
	}

	/**
	 * Establece un nuevo ID de sesión
	 */
	setSessionId(sessionId: string | null): void {
		this.sessionId = sessionId;
	}

	/**
	 * Termina la sesión actual
	 */
	async terminate(): Promise<void> {
		if (!this.sessionId) return;

		try {
			await fetch(this.config.baseUrl, {
				method: 'DELETE',
				headers: {
					'mcp-session-id': this.sessionId,
					...this.config.headers
				}
			});
		} catch (error) {
			console.warn('Error terminando sesión MCP:', error);
		} finally {
			this.sessionId = null;
		}
	}
}

/**
 * Cliente MCP singleton para la aplicación
 */
export const mcpClient = new McpClient();

/**
 * Hook para manejo de estado del cliente MCP
 */
export class McpClientManager {
	private client: McpClient;
	private isInitialized = false;
	private initializationPromise: Promise<void> | null = null;

	constructor(config?: Partial<McpClientConfig>) {
		this.client = new McpClient(config);
	}

	/**
	 * Inicializa el cliente (solo una vez)
	 */
	async ensureInitialized(): Promise<void> {
		if (this.isInitialized) return;

		if (this.initializationPromise) {
			return this.initializationPromise;
		}

		this.initializationPromise = this.performInitialization();
		return this.initializationPromise;
	}

	/**
	 * Realiza la inicialización
	 */
	private async performInitialization(): Promise<void> {
		try {
			await this.client.initialize();
			this.isInitialized = true;
			console.log('Cliente MCP inicializado correctamente');
		} catch (error) {
			console.error('Error inicializando cliente MCP:', error);
			this.initializationPromise = null;
			throw error;
		}
	}

	/**
	 * Obtiene el cliente MCP
	 */
	getClient(): McpClient {
		return this.client;
	}

	/**
	 * Verifica si está inicializado
	 */
	isReady(): boolean {
		return this.isInitialized;
	}

	/**
	 * Reinicia el cliente
	 */
	async reset(): Promise<void> {
		this.isInitialized = false;
		this.initializationPromise = null;
		await this.client.terminate();
		this.client = new McpClient();
	}

	/**
	 * Termina el cliente
	 */
	async terminate(): Promise<void> {
		await this.client.terminate();
		this.isInitialized = false;
		this.initializationPromise = null;
	}
}

/**
 * Manager global del cliente MCP
 */
export const mcpClientManager = new McpClientManager();
