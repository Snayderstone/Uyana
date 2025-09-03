import type { AIMessage, AIResponse } from './aiManager';

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
		try {
			const response = await fetch(this.baseUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					messages,
					options
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`
				);
			}

			const data = await response.json();

			if (!data.success || !data.data) {
				throw new Error('Respuesta inválida del servidor');
			}

			return data.data;
		} catch (error) {
			console.error('Error en llamada a IA:', error);
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
