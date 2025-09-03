import { writable, derived, get } from 'svelte/store';
import type { McpToolType } from '$lib/mcp-core/shared/types';

/**
 * Tipos para el sistema de chat
 */
export interface ChatMessage {
	id: string;
	role: 'system' | 'user' | 'assistant' | 'tool';
	content: string;
	timestamp: number;
	pending?: boolean;
	error?: boolean;
	metadata?: {
		toolName?: string;
		toolArgs?: Record<string, any>;
		model?: string;
		usage?: {
			promptTokens?: number;
			completionTokens?: number;
			totalTokens?: number;
		};
		source?: string;
	};
}

export interface ChatState {
	messages: ChatMessage[];
	isLoading: boolean;
	error: string | null;
	sessionId: string | null;
	activeTools: Set<string>;
	connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
}

/**
 * Estado inicial del chat
 */
const initialState: ChatState = {
	messages: [],
	isLoading: false,
	error: null,
	sessionId: null,
	activeTools: new Set(),
	connectionStatus: 'disconnected'
};

/**
 * Store principal del chat
 */
export const chatStore = writable<ChatState>(initialState);

/**
 * Stores derivados para acceso conveniente
 */
export const chatMessages = derived(chatStore, ($store) => $store.messages);
export const isLoading = derived(chatStore, ($store) => $store.isLoading);
export const chatError = derived(chatStore, ($store) => $store.error);
export const sessionId = derived(chatStore, ($store) => $store.sessionId);
export const activeTools = derived(chatStore, ($store) => $store.activeTools);
export const connectionStatus = derived(chatStore, ($store) => $store.connectionStatus);

/**
 * Utilities para generar IDs únicos
 */
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

/**
 * Acciones del chat
 */
export const chatActions = {
	/**
	 * Establece el estado de carga
	 */
	setLoading(loading: boolean): void {
		chatStore.update((state) => ({
			...state,
			isLoading: loading
		}));
	},

	/**
	 * Establece un error
	 */
	setError(error: string | null): void {
		chatStore.update((state) => ({
			...state,
			error,
			isLoading: false
		}));
	},

	/**
	 * Establece el ID de sesión
	 */
	setSessionId(sessionId: string | null): void {
		chatStore.update((state) => ({
			...state,
			sessionId
		}));
	},

	/**
	 * Establece el estado de conexión
	 */
	setConnectionStatus(status: ChatState['connectionStatus']): void {
		chatStore.update((state) => ({
			...state,
			connectionStatus: status
		}));
	},

	/**
	 * Agrega un mensaje del usuario
	 */
	addUserMessage(content: string): string {
		const id = generateId();
		const message: ChatMessage = {
			id,
			role: 'user',
			content,
			timestamp: Date.now()
		};

		chatStore.update((state) => ({
			...state,
			messages: [...state.messages, message],
			error: null
		}));

		return id;
	},

	/**
	 * Agrega un mensaje del asistente
	 */
	addAssistantMessage(
		content: string,
		options: {
			pending?: boolean;
			error?: boolean;
			model?: string;
			usage?: {
				promptTokens?: number;
				completionTokens?: number;
				totalTokens?: number;
			};
		} = {}
	): string {
		const id = generateId();
		const message: ChatMessage = {
			id,
			role: 'assistant',
			content,
			timestamp: Date.now(),
			pending: options.pending,
			error: options.error,
			metadata: {
				model: options.model,
				usage: options.usage
			}
		};

		chatStore.update((state) => ({
			...state,
			messages: [...state.messages, message]
		}));

		return id;
	},

	/**
	 * Agrega un mensaje de herramienta
	 */
	addToolMessage(
		content: string,
		toolName: string,
		toolArgs: Record<string, any>,
		source = 'mcp'
	): string {
		const id = generateId();
		const message: ChatMessage = {
			id,
			role: 'tool',
			content,
			timestamp: Date.now(),
			metadata: {
				toolName,
				toolArgs,
				source
			}
		};

		chatStore.update((state) => ({
			...state,
			messages: [...state.messages, message]
		}));

		return id;
	},

	/**
	 * Actualiza un mensaje existente
	 */
	updateMessage(id: string, updates: Partial<ChatMessage>): void {
		chatStore.update((state) => ({
			...state,
			messages: state.messages.map((message) =>
				message.id === id ? { ...message, ...updates, timestamp: message.timestamp } : message
			)
		}));
	},

	/**
	 * Elimina un mensaje
	 */
	removeMessage(id: string): void {
		chatStore.update((state) => ({
			...state,
			messages: state.messages.filter((message) => message.id !== id)
		}));
	},

	/**
	 * Activa/desactiva una herramienta
	 */
	toggleTool(toolName: string): void {
		chatStore.update((state) => {
			const newActiveTools = new Set(state.activeTools);

			if (newActiveTools.has(toolName)) {
				newActiveTools.delete(toolName);
			} else {
				newActiveTools.add(toolName);
			}

			return {
				...state,
				activeTools: newActiveTools
			};
		});
	},

	/**
	 * Establece las herramientas activas
	 */
	setActiveTools(tools: string[]): void {
		chatStore.update((state) => ({
			...state,
			activeTools: new Set(tools)
		}));
	},

	/**
	 * Verifica si una herramienta está activa
	 */
	isToolActive(toolName: string): boolean {
		return get(activeTools).has(toolName);
	},

	/**
	 * Limpia el historial del chat
	 */
	clearChat(): void {
		chatStore.update((state) => ({
			...state,
			messages: [],
			error: null,
			isLoading: false
		}));
	},

	/**
	 * Reinicia completamente el estado del chat
	 */
	resetChat(): void {
		chatStore.set(initialState);
	},

	/**
	 * Obtiene el historial de mensajes en formato para IA
	 */
	getChatHistory(
		includeSystem = false
	): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
		const messages = get(chatMessages);

		return messages
			.filter((msg) => {
				// Filtrar mensajes pendientes y con errores
				if (msg.pending || msg.error) return false;

				// Incluir sistema solo si se solicita
				if (msg.role === 'system' && !includeSystem) return false;

				// Incluir solo mensajes de usuario y asistente
				return msg.role === 'user' || msg.role === 'assistant';
			})
			.map((msg) => ({
				role: msg.role as 'user' | 'assistant',
				content: msg.content
			}));
	},

	/**
	 * Obtiene estadísticas del chat
	 */
	getChatStats(): {
		totalMessages: number;
		userMessages: number;
		assistantMessages: number;
		toolMessages: number;
		errorMessages: number;
		totalTokens: number;
	} {
		const messages = get(chatMessages);

		let userMessages = 0;
		let assistantMessages = 0;
		let toolMessages = 0;
		let errorMessages = 0;
		let totalTokens = 0;

		for (const message of messages) {
			switch (message.role) {
				case 'user':
					userMessages++;
					break;
				case 'assistant':
					assistantMessages++;
					if (message.metadata?.usage?.totalTokens) {
						totalTokens += message.metadata.usage.totalTokens;
					}
					break;
				case 'tool':
					toolMessages++;
					break;
			}

			if (message.error) {
				errorMessages++;
			}
		}

		return {
			totalMessages: messages.length,
			userMessages,
			assistantMessages,
			toolMessages,
			errorMessages,
			totalTokens
		};
	}
};

/**
 * Hook para manejo conveniente del estado del chat
 */
export function useChatStore() {
	return {
		// Stores
		store: chatStore,
		messages: chatMessages,
		isLoading,
		error: chatError,
		sessionId,
		activeTools,
		connectionStatus,

		// Actions
		...chatActions
	};
}

/**
 * Compatibilidad con el código existente
 */
export const chatMessages_old = chatMessages;
export const addUserMessage = chatActions.addUserMessage;
export const addAssistantMessage = chatActions.addAssistantMessage;
export const addToolMessage = chatActions.addToolMessage;
export const updateMessage = chatActions.updateMessage;
export const removeMessage = chatActions.removeMessage;
export const clearChat = chatActions.clearChat;
export const toggleTool = chatActions.toggleTool;
export const isToolActive = chatActions.isToolActive;
export const getChatHistory = chatActions.getChatHistory;
