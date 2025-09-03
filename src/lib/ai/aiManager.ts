/**
 * Tipos para integración con modelos de IA
 */

export interface AIMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
	timestamp?: number;
}

export interface AIModelConfig {
	name: string;
	baseUrl: string;
	apiKey?: string;
	maxTokens: number;
	temperature: number;
	timeout: number;
}

export interface AIResponse {
	content: string;
	model: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
	finishReason?: 'stop' | 'length' | 'content_filter';
	timestamp: number;
}

export interface AIError {
	code: string;
	message: string;
	details?: any;
}

/**
 * Clase base para proveedores de IA
 */
export abstract class AIProvider {
	protected config: AIModelConfig;

	constructor(config: AIModelConfig) {
		this.config = config;
	}

	/**
	 * Genera una respuesta usando el modelo de IA
	 */
	abstract generateResponse(
		messages: AIMessage[],
		options?: Partial<AIModelConfig>
	): Promise<AIResponse>;

	/**
	 * Verifica la salud del proveedor
	 */
	abstract healthCheck(): Promise<{ healthy: boolean; details?: any }>;

	/**
	 * Obtiene información del modelo
	 */
	getModelInfo(): AIModelConfig {
		return { ...this.config };
	}
}

/**
 * Manager para múltiples proveedores de IA
 */
export class AIManager {
	private providers = new Map<string, AIProvider>();
	private defaultProvider: string | null = null;

	/**
	 * Registra un proveedor de IA
	 */
	registerProvider(name: string, provider: AIProvider): void {
		this.providers.set(name, provider);

		// El primer proveedor se convierte en el por defecto
		if (!this.defaultProvider) {
			this.defaultProvider = name;
		}
	}

	/**
	 * Obtiene un proveedor específico
	 */
	getProvider(name?: string): AIProvider | null {
		const providerName = name || this.defaultProvider;
		return providerName ? this.providers.get(providerName) || null : null;
	}

	/**
	 * Lista todos los proveedores disponibles
	 */
	listProviders(): string[] {
		return Array.from(this.providers.keys());
	}

	/**
	 * Establece el proveedor por defecto
	 */
	setDefaultProvider(name: string): void {
		if (this.providers.has(name)) {
			this.defaultProvider = name;
		} else {
			throw new Error(`Proveedor no encontrado: ${name}`);
		}
	}

	/**
	 * Genera una respuesta usando el proveedor especificado o el por defecto
	 */
	async generateResponse(
		messages: AIMessage[],
		providerName?: string,
		options?: Partial<AIModelConfig>
	): Promise<AIResponse> {
		const provider = this.getProvider(providerName);
		if (!provider) {
			throw new Error(`Proveedor no disponible: ${providerName || this.defaultProvider}`);
		}

		return provider.generateResponse(messages, options);
	}

	/**
	 * Verifica la salud de todos los proveedores
	 */
	async healthCheckAll(): Promise<Record<string, { healthy: boolean; details?: any }>> {
		const results: Record<string, { healthy: boolean; details?: any }> = {};

		for (const [name, provider] of this.providers) {
			try {
				results[name] = await provider.healthCheck();
			} catch (error) {
				results[name] = {
					healthy: false,
					details: {
						error: error instanceof Error ? error.message : String(error)
					}
				};
			}
		}

		return results;
	}
}

/**
 * Instancia global del manager de IA
 */
export const aiManager = new AIManager();
