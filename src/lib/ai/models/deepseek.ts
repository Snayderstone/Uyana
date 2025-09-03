import { AIProvider, type AIMessage, type AIResponse, type AIModelConfig } from '../aiManager';

/**
 * Interfaz específica para DeepSeek API
 */
interface DeepSeekAPIResponse {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: Array<{
		index: number;
		message: {
			role: string;
			content: string;
		};
		finish_reason: string;
	}>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

/**
 * Proveedor de IA para DeepSeek
 */
export class DeepSeekProvider extends AIProvider {
	private static readonly DEFAULT_CONFIG: Partial<AIModelConfig> = {
		baseUrl: 'https://api.deepseek.com/v1/chat/completions',
		maxTokens: 4000,
		temperature: 0.7,
		timeout: 60000 // Aumentado a 60 segundos para herramientas MCP
	};

	constructor(apiKey: string, customConfig?: Partial<AIModelConfig>) {
		const config: AIModelConfig = {
			name: 'deepseek-chat',
			apiKey,
			...DeepSeekProvider.DEFAULT_CONFIG,
			...customConfig
		} as AIModelConfig;

		super(config);
	}

	/**
	 * Genera una respuesta usando la API de DeepSeek
	 */
	async generateResponse(
		messages: AIMessage[],
		options?: Partial<AIModelConfig>
	): Promise<AIResponse> {
		const requestConfig = { ...this.config, ...options };

		if (!requestConfig.apiKey) {
			throw new Error('API key de DeepSeek no configurada');
		}

		// Preparar el cuerpo de la solicitud
		const requestBody = {
			model: requestConfig.name,
			messages: messages.map((msg) => ({
				role: msg.role,
				content: msg.content
			})),
			max_tokens: requestConfig.maxTokens,
			temperature: requestConfig.temperature,
			stream: false
		};

		// Configurar la solicitud HTTP
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), requestConfig.timeout);

		try {
			const response = await fetch(requestConfig.baseUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${requestConfig.apiKey}`,
					'User-Agent': 'uyana-ai-client/2.0'
				},
				body: JSON.stringify(requestBody),
				signal: controller.signal
			});

			if (!response.ok) {
				let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

				try {
					const errorData = await response.json();
					if (errorData.error?.message) {
						errorMessage = errorData.error.message;
					}
				} catch {
					// Ignorar errores al parsear la respuesta de error
				}

				throw new Error(`Error de API DeepSeek: ${errorMessage}`);
			}

			const data: DeepSeekAPIResponse = await response.json();

			// Validar la respuesta
			if (!data.choices || data.choices.length === 0) {
				throw new Error('Respuesta inválida de DeepSeek: no hay choices');
			}

			const choice = data.choices[0];
			if (!choice.message?.content) {
				throw new Error('Respuesta inválida de DeepSeek: contenido vacío');
			}

			return {
				content: choice.message.content,
				model: data.model,
				usage: {
					promptTokens: data.usage?.prompt_tokens || 0,
					completionTokens: data.usage?.completion_tokens || 0,
					totalTokens: data.usage?.total_tokens || 0
				},
				finishReason: this.mapFinishReason(choice.finish_reason),
				timestamp: Date.now()
			};
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error('Timeout en la solicitud a DeepSeek');
			}

			throw error;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	/**
	 * Verifica la salud de la conexión con DeepSeek
	 */
	async healthCheck(): Promise<{ healthy: boolean; details?: any }> {
		try {
			// Hacer una solicitud simple para verificar la conectividad
			const testMessages: AIMessage[] = [{ role: 'user', content: 'Responde solo "OK"' }];

			const startTime = Date.now();
			const response = await this.generateResponse(testMessages, {
				maxTokens: 10,
				temperature: 0
			});
			const latency = Date.now() - startTime;

			return {
				healthy: true,
				details: {
					model: this.config.name,
					latency,
					usage: response.usage,
					timestamp: response.timestamp
				}
			};
		} catch (error) {
			return {
				healthy: false,
				details: {
					error: error instanceof Error ? error.message : String(error),
					timestamp: Date.now()
				}
			};
		}
	}

	/**
	 * Mapea los códigos de finalización de DeepSeek a nuestro formato
	 */
	private mapFinishReason(reason: string): AIResponse['finishReason'] {
		switch (reason) {
			case 'stop':
				return 'stop';
			case 'length':
				return 'length';
			case 'content_filter':
				return 'content_filter';
			default:
				return 'stop';
		}
	}

	/**
	 * Crea una instancia del proveedor desde variables de entorno
	 */
	static fromEnvironment(customConfig?: Partial<AIModelConfig>): DeepSeekProvider {
		// En SvelteKit, usar variables de entorno del navegador
		const apiKey =
			typeof window !== 'undefined'
				? (window as any).env?.DEEPSEEK_API_KEY || ''
				: process.env.DEEPSEEK_API_KEY || '';

		if (!apiKey) {
			throw new Error('DEEPSEEK_API_KEY no está configurada en las variables de entorno');
		}

		return new DeepSeekProvider(apiKey, customConfig);
	}

	/**
	 * Valida la configuración del proveedor
	 */
	static validateConfig(config: Partial<AIModelConfig> & { apiKey: string }): boolean {
		return !!(
			config.apiKey &&
			config.baseUrl &&
			config.maxTokens &&
			config.maxTokens > 0 &&
			config.temperature !== undefined &&
			config.temperature >= 0 &&
			config.temperature <= 2
		);
	}
}

/**
 * Factory function para crear una instancia de DeepSeek
 */
export function createDeepSeekProvider(
	apiKey?: string,
	config?: Partial<AIModelConfig>
): DeepSeekProvider {
	if (apiKey) {
		return new DeepSeekProvider(apiKey, config);
	}

	// Intentar crear desde variables de entorno
	return DeepSeekProvider.fromEnvironment(config);
}

/**
 * Configuración por defecto para DeepSeek
 */
export const DEEPSEEK_DEFAULT_CONFIG: Partial<AIModelConfig> = {
	name: 'deepseek-chat',
	baseUrl: 'https://api.deepseek.com/v1/chat/completions',
	maxTokens: 4000,
	temperature: 0.7,
	timeout: 60000 // Aumentado a 60 segundos para herramientas MCP
};
