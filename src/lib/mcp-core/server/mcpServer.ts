import { randomUUID } from 'crypto';
import type {
	McpServerConfig,
	McpSession,
	McpTool,
	McpResource,
	McpPrompt,
	JsonRpcRequest,
	JsonRpcResponse
} from '../shared/types';
import { JsonRpcErrorCodes, McpValidation } from '../shared/types';
import { weatherTool } from './tools/weatherTool';

/**
 * Configuración del servidor MCP de UYANA
 */
const UYANA_MCP_CONFIG: McpServerConfig = {
	name: 'uyana-mcp-server',
	version: '2.0.0',
	description:
		'Servidor MCP para la plataforma UYANA con herramientas de investigación y datos geoespaciales',
	author: 'UYANA Team',
	capabilities: {
		tools: true,
		resources: true,
		prompts: true,
		logging: true
	},
	metadata: {
		homepage: 'https://uyana.com',
		repository: 'https://github.com/uyana/mcp-server',
		documentation: 'https://docs.uyana.com/mcp'
	}
};

/**
 * Gestor de sesiones MCP
 */
class SessionManager {
	private sessions = new Map<string, McpSession>();
	private readonly sessionTimeout = 15 * 60 * 1000; // 15 minutos
	private readonly maxSessions = 1000;
	private cleanupInterval?: NodeJS.Timeout;

	constructor() {
		this.startCleanupTimer();
	}

	/**
	 * Inicia el timer de limpieza automática
	 */
	private startCleanupTimer(): void {
		if (typeof setInterval !== 'undefined') {
			this.cleanupInterval = setInterval(() => {
				this.cleanupExpiredSessions();
			}, 5 * 60 * 1000); // Cada 5 minutos
		}
	}

	/**
	 * Limpia sesiones expiradas
	 */
	private cleanupExpiredSessions(): void {
		const now = Date.now();
		const expiredSessions: string[] = [];

		for (const [id, session] of this.sessions) {
			if (now - session.lastActivity > this.sessionTimeout) {
				expiredSessions.push(id);
			}
		}

		expiredSessions.forEach((id) => {
			this.sessions.delete(id);
			console.log(`Sesión MCP expirada eliminada: ${id}`);
		});

		// Si hay demasiadas sesiones, eliminar las más antiguas
		if (this.sessions.size > this.maxSessions) {
			const sortedSessions = Array.from(this.sessions.entries()).sort(
				([, a], [, b]) => a.lastActivity - b.lastActivity
			);

			const toRemove = sortedSessions.slice(0, this.sessions.size - this.maxSessions);
			toRemove.forEach(([id]) => {
				this.sessions.delete(id);
				console.log(`Sesión MCP eliminada por límite: ${id}`);
			});
		}
	}

	/**
	 * Crea una nueva sesión
	 */
	createSession(sessionId?: string): McpSession {
		const id = sessionId || randomUUID();
		const now = Date.now();

		const session: McpSession = {
			id,
			createdAt: now,
			lastActivity: now,
			tools: new Map(),
			resources: new Map(),
			prompts: new Map(),
			metadata: {
				userAgent: 'unknown',
				ipAddress: 'unknown'
			}
		};

		// Registrar herramientas por defecto
		this.registerDefaultTools(session);
		this.registerDefaultResources(session);
		this.registerDefaultPrompts(session);

		this.sessions.set(id, session);
		console.log(`Nueva sesión MCP creada: ${id}`);

		return session;
	}

	/**
	 * Obtiene una sesión existente
	 */
	getSession(sessionId: string): McpSession | null {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.lastActivity = Date.now();
			return session;
		}
		return null;
	}

	/**
	 * Obtiene o crea una sesión
	 */
	getOrCreateSession(sessionId?: string): { sessionId: string; session: McpSession } {
		if (sessionId) {
			const existing = this.getSession(sessionId);
			if (existing) {
				return { sessionId, session: existing };
			}
		}

		const session = this.createSession(sessionId);
		return { sessionId: session.id, session };
	}

	/**
	 * Elimina una sesión
	 */
	deleteSession(sessionId: string): boolean {
		const deleted = this.sessions.delete(sessionId);
		if (deleted) {
			console.log(`Sesión MCP eliminada: ${sessionId}`);
		}
		return deleted;
	}

	/**
	 * Registra herramientas por defecto
	 */
	private registerDefaultTools(session: McpSession): void {
		// Herramienta de clima
		session.tools.set(weatherTool.name, weatherTool);
	}

	/**
	 * Registra recursos por defecto
	 */
	private registerDefaultResources(session: McpSession): void {
		// TODO: Implementar recursos como documentación, configuración, etc.
	}

	/**
	 * Registra prompts por defecto
	 */
	private registerDefaultPrompts(session: McpSession): void {
		// TODO: Implementar prompts para guiar al usuario
	}

	/**
	 * Obtiene estadísticas de sesiones
	 */
	getStats(): {
		totalSessions: number;
		activeSessions: number;
		expiredSessions: number;
	} {
		const now = Date.now();
		let activeSessions = 0;
		let expiredSessions = 0;

		for (const session of this.sessions.values()) {
			if (now - session.lastActivity > this.sessionTimeout) {
				expiredSessions++;
			} else {
				activeSessions++;
			}
		}

		return {
			totalSessions: this.sessions.size,
			activeSessions,
			expiredSessions
		};
	}

	/**
	 * Destructor para limpiar recursos
	 */
	destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}
		this.sessions.clear();
	}
}

/**
 * Servidor MCP principal
 */
class UyanaMcpServer {
	private sessionManager: SessionManager;
	private config: McpServerConfig;

	constructor() {
		this.sessionManager = new SessionManager();
		this.config = UYANA_MCP_CONFIG;
	}

	/**
	 * Procesa una solicitud JSON-RPC
	 */
	async processRequest(
		request: JsonRpcRequest,
		sessionId?: string,
		metadata?: Record<string, any>
	): Promise<{ response: JsonRpcResponse; sessionId: string }> {
		// Validar solicitud
		if (!McpValidation.isValidJsonRpcRequest(request)) {
			return {
				response: McpValidation.createJsonRpcError(
					(request as any)?.id || null,
					JsonRpcErrorCodes.INVALID_REQUEST,
					'Solicitud JSON-RPC inválida'
				),
				sessionId: sessionId || ''
			};
		}

		// Obtener o crear sesión
		const { sessionId: newSessionId, session } = this.sessionManager.getOrCreateSession(sessionId);

		// Agregar metadata si se proporciona
		if (metadata) {
			session.metadata = { ...session.metadata, ...metadata };
		}

		try {
			let result: any;

			switch (request.method) {
				case 'initialize':
					result = await this.handleInitialize(session, request.params);
					break;

				case 'listTools':
					result = await this.handleListTools(session);
					break;

				case 'callTool':
					result = await this.handleCallTool(session, request.params);
					break;

				case 'listResources':
					result = await this.handleListResources(session);
					break;

				case 'getResource':
					result = await this.handleGetResource(session, request.params);
					break;

				case 'listPrompts':
					result = await this.handleListPrompts(session);
					break;

				case 'getPrompt':
					result = await this.handleGetPrompt(session, request.params);
					break;

				case 'ping':
					result = { status: 'pong', timestamp: Date.now() };
					break;

				default:
					return {
						response: McpValidation.createJsonRpcError(
							request.id,
							JsonRpcErrorCodes.METHOD_NOT_FOUND,
							`Método no implementado: ${request.method}`
						),
						sessionId: newSessionId
					};
			}

			return {
				response: McpValidation.createJsonRpcSuccess(request.id, result),
				sessionId: newSessionId
			};
		} catch (error) {
			console.error(`Error procesando ${request.method}:`, error);

			const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
			const errorCode =
				error instanceof Error && 'code' in error
					? (error as any).code
					: JsonRpcErrorCodes.INTERNAL_ERROR;

			return {
				response: McpValidation.createJsonRpcError(request.id, errorCode, errorMessage),
				sessionId: newSessionId
			};
		}
	}

	/**
	 * Maneja la inicialización del servidor
	 */
	private async handleInitialize(session: McpSession, params?: any): Promise<any> {
		return {
			server: {
				name: this.config.name,
				version: this.config.version,
				description: this.config.description,
				author: this.config.author
			},
			capabilities: this.config.capabilities,
			session: {
				id: session.id,
				createdAt: session.createdAt
			},
			metadata: this.config.metadata
		};
	}

	/**
	 * Lista las herramientas disponibles
	 */
	private async handleListTools(session: McpSession): Promise<any> {
		const tools = Array.from(session.tools.values()).map((tool) => ({
			name: tool.name,
			title: tool.title,
			description: tool.description,
			category: tool.category,
			schema: tool.schema.shape,
			metadata: tool.metadata
		}));

		return { tools };
	}

	/**
	 * Ejecuta una herramienta
	 */
	private async handleCallTool(session: McpSession, params?: any): Promise<any> {
		if (!params?.name) {
			throw new Error('Nombre de herramienta requerido');
		}

		const tool = session.tools.get(params.name);
		if (!tool) {
			throw new Error(`Herramienta no encontrada: ${params.name}`);
		}

		// Validar argumentos
		const validatedArgs = tool.schema.parse(params.arguments || {});

		// Ejecutar herramienta
		const result = await tool.handler(validatedArgs);

		return result;
	}

	/**
	 * Lista los recursos disponibles
	 */
	private async handleListResources(session: McpSession): Promise<any> {
		const resources = Array.from(session.resources.values()).map((resource) => ({
			name: resource.name,
			uri: resource.uri,
			title: resource.title,
			description: resource.description,
			mimeType: resource.mimeType,
			metadata: resource.metadata
		}));

		return { resources };
	}

	/**
	 * Obtiene un recurso específico
	 */
	private async handleGetResource(session: McpSession, params?: any): Promise<any> {
		if (!params?.name) {
			throw new Error('Nombre de recurso requerido');
		}

		const resource = session.resources.get(params.name);
		if (!resource) {
			throw new Error(`Recurso no encontrado: ${params.name}`);
		}

		return await resource.handler();
	}

	/**
	 * Lista los prompts disponibles
	 */
	private async handleListPrompts(session: McpSession): Promise<any> {
		const prompts = Array.from(session.prompts.values()).map((prompt) => ({
			name: prompt.name,
			title: prompt.title,
			description: prompt.description,
			variables: prompt.variables,
			metadata: prompt.metadata
		}));

		return { prompts };
	}

	/**
	 * Obtiene un prompt específico
	 */
	private async handleGetPrompt(session: McpSession, params?: any): Promise<any> {
		if (!params?.name) {
			throw new Error('Nombre de prompt requerido');
		}

		const prompt = session.prompts.get(params.name);
		if (!prompt) {
			throw new Error(`Prompt no encontrado: ${params.name}`);
		}

		// Procesar variables del prompt
		let processedTemplate = prompt.template;
		if (params.variables && prompt.variables) {
			for (const [key, value] of Object.entries(params.variables)) {
				if (key in prompt.variables) {
					processedTemplate = processedTemplate.replace(
						new RegExp(`{{${key}}}`, 'g'),
						String(value)
					);
				}
			}
		}

		return {
			name: prompt.name,
			title: prompt.title,
			description: prompt.description,
			template: processedTemplate,
			metadata: prompt.metadata
		};
	}

	/**
	 * Elimina una sesión
	 */
	deleteSession(sessionId: string): boolean {
		return this.sessionManager.deleteSession(sessionId);
	}

	/**
	 * Obtiene estadísticas del servidor
	 */
	getServerStats(): any {
		return {
			server: this.config,
			sessions: this.sessionManager.getStats(),
			uptime: process.uptime?.() || 0,
			timestamp: Date.now()
		};
	}

	/**
	 * Destructor para limpiar recursos
	 */
	destroy(): void {
		this.sessionManager.destroy();
	}
}

/**
 * Instancia principal del servidor MCP
 */
export const uyanaMcpServer = new UyanaMcpServer();

/**
 * Función de conveniencia para procesar solicitudes
 */
export async function processMcpRequest(
	request: JsonRpcRequest,
	sessionId?: string,
	metadata?: Record<string, any>
): Promise<{ response: JsonRpcResponse; sessionId: string }> {
	return uyanaMcpServer.processRequest(request, sessionId, metadata);
}

/**
 * Función de conveniencia para eliminar sesiones
 */
export function deleteSession(sessionId: string): boolean {
	return uyanaMcpServer.deleteSession(sessionId);
}

/**
 * Función de conveniencia para obtener estadísticas
 */
export function getServerStats(): any {
	return uyanaMcpServer.getServerStats();
}
