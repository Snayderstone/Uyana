/**
 * Configuración del sistema de logging MCP
 *
 * Para cambiar el nivel de logs:
 * 1. Desarrollo (ver todos los logs): NODE_ENV=development
 * 2. Producción (solo logs importantes): NODE_ENV=production
 * 3. Custom: Cambiar LOG_LEVEL_OVERRIDE
 */

/**
 * Niveles de log disponibles
 */
export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3
}

/**
 * Verificar si estamos en el servidor (Node.js) o navegador
 */
const isServer = typeof window === 'undefined';

/**
 * Obtener variable de entorno de forma segura
 */
const getEnv = (key: string): string | undefined => {
	if (isServer && typeof process !== 'undefined' && process.env) {
		return process.env[key];
	}
	return undefined;
};

/**
 * Nivel de log por defecto según entorno
 */
export const getDefaultLogLevel = (): LogLevel => {
	// Permitir override manual
	const override = getEnv('LOG_LEVEL_OVERRIDE');
	if (override) {
		switch (override.toUpperCase()) {
			case 'DEBUG':
				return LogLevel.DEBUG;
			case 'INFO':
				return LogLevel.INFO;
			case 'WARN':
				return LogLevel.WARN;
			case 'ERROR':
				return LogLevel.ERROR;
		}
	}

	// Por defecto según NODE_ENV
	// En cliente (navegador) usar INFO por defecto
	const nodeEnv = getEnv('NODE_ENV');
	return nodeEnv === 'production' ? LogLevel.INFO : isServer ? LogLevel.DEBUG : LogLevel.INFO;
};

/**
 * Configuración de logging optimizada
 */
export const loggingConfig = {
	// Nivel de log
	level: getDefaultLogLevel(),

	// Modo producción (elimina logs verbose)
	productionMode: getEnv('NODE_ENV') === 'production',

	// Colorear logs en consola
	colorize: true,

	// Incluir timestamps
	timestamps: true,

	// Incluir fuente del log
	includeSource: true,

	// Almacenar logs en memoria
	storeLogs: true,

	// Tamaño máximo del buffer de logs
	maxLogSize: 1000,

	// Logs que siempre se muestran (independiente del nivel)
	alwaysLog: [
		'CALL_TOOL', // Cuando se ejecuta una herramienta
		'ERROR', // Todos los errores
		'NEW_SESSION' // Creación de nuevas sesiones
	],

	// Logs que se omiten en producción
	omitInProduction: [
		'INIT', // Inicializaciones
		'LIST_TOOLS', // Listado de herramientas
		'LIST_RESOURCES', // Listado de recursos
		'LIST_PROMPTS', // Listado de prompts
		'PROCESS', // Procesamiento genérico
		'REQUEST_METADATA', // Metadata de requests
		'REQUEST_PARAMS', // Parámetros de requests
		'RESULT_DETAIL', // Detalles de resultados
		'RESPONSE_DATA' // Datos de respuesta completos
	]
};

export default loggingConfig;
