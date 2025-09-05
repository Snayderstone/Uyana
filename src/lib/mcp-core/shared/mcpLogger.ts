/**
 * Sistema de logging avanzado para MCP
 *
 * Este logger permite rastrear todo el flujo de comunicación entre:
 * - Usuario -> DeepSeek
 * - DeepSeek -> MCP Tools
 * - MCP Tools -> DeepSeek
 * - DeepSeek -> Usuario
 */

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3
}

export interface LogOptions {
	level?: LogLevel;
	colorize?: boolean;
	timestamps?: boolean;
	includeSource?: boolean;
	storeLogs?: boolean;
	maxLogSize?: number;
}

export class McpLogger {
	private static instance: McpLogger;
	private logLevel: LogLevel;
	private colorize: boolean;
	private timestamps: boolean;
	private includeSource: boolean;
	private logs: string[] = [];
	private maxLogSize: number;
	private storeLogs: boolean;
	private requestId: string = 'unknown';
	private isServer: boolean = typeof window === 'undefined';

	constructor(options: LogOptions = {}) {
		this.logLevel = options.level ?? LogLevel.INFO;
		this.colorize = options.colorize ?? true;
		this.timestamps = options.timestamps ?? true;
		this.includeSource = options.includeSource ?? true;
		this.storeLogs = options.storeLogs ?? true;
		this.maxLogSize = options.maxLogSize ?? 1000;

		// Si estamos en el navegador, intentar cargar logs existentes
		if (!this.isServer && this.storeLogs) {
			try {
				if (typeof localStorage !== 'undefined') {
					const storedLogs = localStorage.getItem('mcp_logs');
					if (storedLogs) {
						this.logs = JSON.parse(storedLogs);
					}
				}
			} catch (e) {
				console.error('Error al cargar logs desde localStorage:', e);
			}
		}
	}

	/**
	 * Obtener instancia singleton del logger
	 */
	public static getInstance(options?: LogOptions): McpLogger {
		if (!McpLogger.instance) {
			McpLogger.instance = new McpLogger(options);
		}
		return McpLogger.instance;
	}

	/**
	 * Establecer ID de solicitud actual para relacionar logs
	 */
	public setRequestId(requestId: string): void {
		this.requestId = requestId;
	}

	/**
	 * Formatear mensaje de log
	 */
	private formatMessage(
		level: string,
		source: string,
		operation: string,
		message: string,
		data?: any
	): string {
		const parts: string[] = [];

		// Añadir timestamp
		if (this.timestamps) {
			const timestamp = new Date().toISOString();
			parts.push(`[${timestamp}]`);
		}

		// Añadir ID de solicitud
		parts.push(`[${this.requestId}]`);

		// Añadir nivel de log
		const levelStr = this.colorize ? this.colorizeLevel(level) : `[${level}]`;
		parts.push(levelStr);

		// Añadir fuente
		if (this.includeSource) {
			parts.push(`[${source}]`);
		}

		// Añadir operación
		parts.push(`[${operation}]`);

		// Añadir mensaje
		parts.push(message);

		// Añadir datos si existen
		let formattedLog = parts.join(' ');
		if (data !== undefined) {
			try {
				const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
				formattedLog += `\n${dataStr}`;
			} catch (error) {
				formattedLog += `\n[Error serializando datos: ${error}]`;
			}
		}

		return formattedLog;
	}

	/**
	 * Colorear nivel de log para consola
	 */
	private colorizeLevel(level: string): string {
		switch (level.toUpperCase()) {
			case 'DEBUG':
				return '\x1b[36m[DEBUG]\x1b[0m'; // Cyan
			case 'INFO':
				return '\x1b[32m[INFO]\x1b[0m'; // Verde
			case 'WARN':
				return '\x1b[33m[WARN]\x1b[0m'; // Amarillo
			case 'ERROR':
				return '\x1b[31m[ERROR]\x1b[0m'; // Rojo
			default:
				return `[${level}]`;
		}
	}

	/**
	 * Determinar si un nivel debe registrarse
	 */
	private shouldLog(level: LogLevel): boolean {
		return level >= this.logLevel;
	}

	/**
	 * Registrar mensaje
	 */
	private log(
		level: LogLevel,
		levelName: string,
		source: string,
		operation: string,
		message: string,
		data?: any
	): void {
		if (!this.shouldLog(level)) {
			return;
		}

		const formattedMessage = this.formatMessage(levelName, source, operation, message, data);

		// En servidor o cliente, siempre imprimir en consola
		switch (level) {
			case LogLevel.DEBUG:
				console.debug(formattedMessage);
				break;
			case LogLevel.INFO:
				console.info(formattedMessage);
				break;
			case LogLevel.WARN:
				console.warn(formattedMessage);
				break;
			case LogLevel.ERROR:
				console.error(formattedMessage);
				break;
		}

		// Almacenar logs
		if (this.storeLogs) {
			// Añadir un identificador para cuando se renderiza en el cliente
			const logEntry = this.isServer ? `${formattedMessage}` : `${formattedMessage}`;

			this.logs.push(logEntry);

			// Limitar tamaño del buffer
			if (this.logs.length > this.maxLogSize) {
				this.logs = this.logs.slice(-Math.floor(this.maxLogSize / 2));
			}

			// Si estamos en el navegador, podemos persistir los logs en localStorage
			if (!this.isServer) {
				try {
					if (typeof localStorage !== 'undefined') {
						localStorage.setItem('mcp_logs', JSON.stringify(this.logs.slice(-100)));
					}
				} catch (e) {
					console.error('Error al guardar logs en localStorage:', e);
				}
			}
		}
	}

	/**
	 * Métodos públicos para registrar eventos
	 */
	public debug(source: string, operation: string, message: string, data?: any): void {
		this.log(LogLevel.DEBUG, 'DEBUG', source, operation, message, data);
	}

	public info(source: string, operation: string, message: string, data?: any): void {
		this.log(LogLevel.INFO, 'INFO', source, operation, message, data);
	}

	public warn(source: string, operation: string, message: string, data?: any): void {
		this.log(LogLevel.WARN, 'WARN', source, operation, message, data);
	}

	public error(source: string, operation: string, message: string, data?: any): void {
		this.log(LogLevel.ERROR, 'ERROR', source, operation, message, data);
	}

	/**
	 * Logs específicos para flujos MCP
	 */
	public userInput(message: string, metadata?: any): void {
		this.info('USER', 'INPUT', 'Mensaje de usuario recibido', {
			message,
			timestamp: Date.now(),
			...metadata
		});
	}

	public aiProcessing(prompt: any, model: string): void {
		this.info('AI', 'PROCESSING', `Enviando solicitud a ${model}`, {
			prompt,
			model,
			timestamp: Date.now()
		});
	}

	public toolDetection(toolName: string, args: any): void {
		this.info('AI', 'TOOL_DETECTION', `Herramienta ${toolName} detectada`, {
			toolName,
			args,
			timestamp: Date.now()
		});
	}

	public toolExecution(
		toolName: string,
		args: any,
		startTime: number,
		status: 'success' | 'error',
		result?: any
	): void {
		const duration = Date.now() - startTime;

		if (status === 'success') {
			this.info(
				'MCP',
				'TOOL_EXECUTION',
				`Herramienta ${toolName} ejecutada con éxito (${duration}ms)`,
				{
					toolName,
					args,
					duration: `${duration}ms`,
					result
				}
			);
		} else {
			this.error(
				'MCP',
				'TOOL_EXECUTION',
				`Error al ejecutar herramienta ${toolName} (${duration}ms)`,
				{
					toolName,
					args,
					duration: `${duration}ms`,
					error: result
				}
			);
		}
	}

	public aiResponse(response: any, duration: number): void {
		this.info('AI', 'RESPONSE', `Respuesta generada en ${duration}ms`, {
			response,
			duration: `${duration}ms`,
			timestamp: Date.now()
		});
	}

	public mcpRequest(method: string, params: any): void {
		this.info('MCP', 'REQUEST', `Llamada a método ${method}`, {
			method,
			params,
			timestamp: Date.now()
		});
	}

	public mcpResponse(method: string, result: any, duration: number): void {
		this.info('MCP', 'RESPONSE', `Respuesta de ${method} (${duration}ms)`, {
			method,
			result,
			duration: `${duration}ms`,
			timestamp: Date.now()
		});
	}

	/**
	 * Obtener todos los logs almacenados
	 */
	public getLogs(): string[] {
		// Si estamos en el navegador, intentar recuperar logs del localStorage
		if (!this.isServer && this.logs.length === 0) {
			try {
				if (typeof localStorage !== 'undefined') {
					const storedLogs = localStorage.getItem('mcp_logs');
					if (storedLogs) {
						this.logs = JSON.parse(storedLogs);
					}
				}
			} catch (e) {
				console.error('Error al recuperar logs de localStorage:', e);
			}
		}
		return [...this.logs];
	}

	/**
	 * Limpiar logs almacenados
	 */
	public clearLogs(): void {
		this.logs = [];

		// Si estamos en el navegador, también limpiar localStorage
		if (!this.isServer) {
			try {
				if (typeof localStorage !== 'undefined') {
					localStorage.removeItem('mcp_logs');
				}
			} catch (e) {
				console.error('Error al limpiar logs de localStorage:', e);
			}
		}
	}

	/**
	 * Cambiar nivel de log
	 */
	public setLogLevel(level: LogLevel): void {
		this.logLevel = level;
	}
}

// Instancia global del logger MCP
export const mcpLogger = McpLogger.getInstance({
	level: LogLevel.DEBUG,
	colorize: true,
	timestamps: true,
	includeSource: true,
	storeLogs: true
});

// Exportar como default para facilitar importación
export default mcpLogger;
