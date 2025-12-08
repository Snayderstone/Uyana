import type { z } from 'zod';

/**
 * Tipos base para Model Context Protocol (MCP)
 */

export enum McpToolType {
	CHAT = 'chat',
	WEATHER = 'weather',
	TIME = 'time',
	CHART = 'chart',
	SEARCH = 'search',
	DOCUMENT = 'document',
	FEEDBACK = 'feedback'
}

export enum McpResourceType {
	DOCUMENT = 'document',
	CONFIGURATION = 'configuration',
	DATA = 'data'
}

export enum McpPromptType {
	CHAT = 'chat',
	SYSTEM = 'system',
	TEMPLATE = 'template'
}

/**
 * Contenido MCP que puede ser texto, imagen, archivo, etc.
 */
export interface McpContent {
	type: 'text' | 'image' | 'file' | 'json' | 'link';
	text?: string;
	url?: string;
	data?: any;
	title?: string;
	description?: string;
	mimeType?: string;
	[key: string]: any;
}

/**
 * Respuesta de una herramienta o servidor MCP
 */
export interface McpResponse {
	content: McpContent[];
	isError?: boolean;
	metadata?: Record<string, any>;
}

/**
 * Definición de una herramienta MCP
 */
export interface McpTool<T = any> {
	name: string;
	title: string;
	description: string;
	category?: string;
	schema: z.ZodObject<any>;
	handler: (args: T) => Promise<McpResponse>;
	isEnabled?: boolean;
	metadata?: Record<string, any>;
}

/**
 * Definición de un recurso MCP
 */
export interface McpResource {
	name: string;
	uri: string;
	title: string;
	description: string;
	mimeType?: string;
	handler: () => Promise<McpResponse>;
	metadata?: Record<string, any>;
}

/**
 * Definición de un prompt MCP
 */
export interface McpPrompt {
	name: string;
	title: string;
	description: string;
	template: string;
	variables?: Record<string, any>;
	metadata?: Record<string, any>;
}

/**
 * Configuración del servidor MCP
 */
export interface McpServerConfig {
	name: string;
	version: string;
	description?: string;
	author?: string;
	capabilities?: {
		tools?: boolean;
		resources?: boolean;
		prompts?: boolean;
		logging?: boolean;
	};
	metadata?: Record<string, any>;
}

/**
 * Estado de sesión MCP
 */
export interface McpSession {
	id: string;
	createdAt: number;
	lastActivity: number;
	tools: Map<string, McpTool>;
	resources: Map<string, McpResource>;
	prompts: Map<string, McpPrompt>;
	metadata?: Record<string, any>;
}

/**
 * Solicitud JSON-RPC para MCP
 */
export interface JsonRpcRequest {
	jsonrpc: '2.0';
	id: string | number;
	method: string;
	params?: any;
}

/**
 * Respuesta JSON-RPC para MCP
 */
export interface JsonRpcResponse {
	jsonrpc: '2.0';
	id: string | number | null;
	result?: any;
	error?: {
		code: number;
		message: string;
		data?: any;
	};
}

/**
 * Error personalizado para MCP
 */
export class McpError extends Error {
	public code: number;
	public data?: any;

	constructor(code: number, message: string, data?: any) {
		super(message);
		this.name = 'McpError';
		this.code = code;
		this.data = data;
	}
}

/**
 * Códigos de error JSON-RPC estándar
 */
export const JsonRpcErrorCodes = {
	PARSE_ERROR: -32700,
	INVALID_REQUEST: -32600,
	METHOD_NOT_FOUND: -32601,
	INVALID_PARAMS: -32602,
	INTERNAL_ERROR: -32603,
	// Códigos personalizados para MCP
	TOOL_NOT_FOUND: -32001,
	RESOURCE_NOT_FOUND: -32002,
	SESSION_NOT_FOUND: -32003,
	UNAUTHORIZED: -32004,
	RATE_LIMITED: -32005
} as const;

/**
 * Utilitarios para validación
 */
export const McpValidation = {
	isValidJsonRpcRequest: (obj: unknown): obj is JsonRpcRequest => {
		return (
			typeof obj === 'object' &&
			obj !== null &&
			'jsonrpc' in obj &&
			(obj as any).jsonrpc === '2.0' &&
			'method' in obj &&
			typeof (obj as any).method === 'string' &&
			'id' in obj
		);
	},

	createJsonRpcError: (
		id: string | number | null,
		code: number,
		message: string,
		data?: any
	): JsonRpcResponse => ({
		jsonrpc: '2.0',
		id,
		error: { code, message, ...(data && { data }) }
	}),

	createJsonRpcSuccess: (id: string | number, result: any): JsonRpcResponse => ({
		jsonrpc: '2.0',
		id,
		result
	})
};
