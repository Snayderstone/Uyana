import { z } from 'zod';
import type { McpResponse, McpTool } from '../../shared/types';

/**
 * Configuración de APIs del clima
 */
const WEATHER_CONFIG = {
	openMeteo: {
		geocodingUrl: 'https://geocoding-api.open-meteo.com/v1/search',
		weatherUrl: 'https://api.open-meteo.com/v1/forecast',
		timeout: 15000 // 15 segundos
	},
	backup: {
		weatherApi: {
			baseUrl: 'http://api.weatherapi.com/v1',
			timeout: 10000
		}
	},
	defaults: {
		maxRetries: 3,
		cacheTtl: 10 * 60 * 1000, // 10 minutos
		maxCities: 100
	}
} as const;

/**
 * Sistema de logging para herramientas MCP
 */
class WeatherLogger {
	private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

	setLogLevel(level: 'debug' | 'info' | 'warn' | 'error') {
		this.logLevel = level;
	}

	private shouldLog(level: string): boolean {
		const levels = { debug: 0, info: 1, warn: 2, error: 3 };
		return levels[level as keyof typeof levels] >= levels[this.logLevel];
	}

	private formatMessage(level: string, operation: string, message: string, data?: any): string {
		const timestamp = new Date().toISOString();
		const prefix = `[${timestamp}] [WEATHER-MCP] [${level.toUpperCase()}] [${operation}]`;

		if (data) {
			return `${prefix} ${message} | Data: ${JSON.stringify(data)}`;
		}
		return `${prefix} ${message}`;
	}

	debug(operation: string, message: string, data?: any) {
		if (this.shouldLog('debug')) {
			console.debug(this.formatMessage('debug', operation, message, data));
		}
	}

	info(operation: string, message: string, data?: any) {
		if (this.shouldLog('info')) {
			console.info(this.formatMessage('info', operation, message, data));
		}
	}

	warn(operation: string, message: string, data?: any) {
		if (this.shouldLog('warn')) {
			console.warn(this.formatMessage('warn', operation, message, data));
		}
	}

	error(operation: string, message: string, error?: any) {
		if (this.shouldLog('error')) {
			const errorData =
				error instanceof Error ? { message: error.message, stack: error.stack } : error;
			console.error(this.formatMessage('error', operation, message, errorData));
		}
	}

	toolExecution(
		toolName: string,
		args: any,
		startTime: number,
		status: 'success' | 'error',
		result?: any
	) {
		const duration = Date.now() - startTime;
		const operation = 'TOOL_EXECUTION';

		if (status === 'success') {
			this.info(operation, `${toolName} executed successfully`, {
				args,
				duration: `${duration}ms`,
				resultType: typeof result
			});
		} else {
			this.error(operation, `${toolName} execution failed`, {
				args,
				duration: `${duration}ms`,
				error: result
			});
		}
	}
}

/**
 * Cache simple para resultados del clima
 */
class WeatherCache {
	private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
	private maxSize = 1000;

	set(key: string, data: any, ttl: number = WEATHER_CONFIG.defaults.cacheTtl) {
		// Limpiar cache si está lleno
		if (this.cache.size >= this.maxSize) {
			const oldestKey = this.cache.keys().next().value;
			if (oldestKey) {
				this.cache.delete(oldestKey);
			}
		}

		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl
		});
	}

	get(key: string): any | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		// Verificar si no ha expirado
		if (Date.now() - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	clear() {
		this.cache.clear();
	}

	getStats() {
		return {
			size: this.cache.size,
			maxSize: this.maxSize
		};
	}
}

/**
 * Interfaces para respuestas de APIs
 */
interface OpenMeteoGeocoding {
	results?: Array<{
		name: string;
		latitude: number;
		longitude: number;
		country: string;
		admin1?: string;
		admin2?: string;
	}>;
}

interface OpenMeteoWeather {
	hourly: {
		time: string[];
		temperature_2m: number[];
		weather_code: number[];
		relative_humidity_2m: number[];
		wind_speed_10m: number[];
		wind_direction_10m: number[];
	};
	current?: {
		temperature_2m: number;
		weather_code: number;
		wind_speed_10m: number;
		wind_direction_10m: number;
	};
}

interface WeatherSummary {
	date: string;
	day_of_week: string;
	city: string;
	country: string;
	weather: string;
	temperature_celsius: number;
	humidity?: number;
	wind_speed?: number;
	wind_direction?: number;
}

interface WeatherResult {
	current: WeatherSummary;
	forecast: WeatherSummary[];
	metadata: {
		source: 'openmeteo' | 'cache' | 'fallback';
		timestamp: string;
		coordinates: { lat: number; lon: number };
		query_time_ms: number;
	};
}

/**
 * Servicio avanzado para obtener información del clima
 */
class AdvancedWeatherService {
	private logger = new WeatherLogger();
	private cache = new WeatherCache();
	private requestCount = 0;

	constructor() {
		this.logger.setLogLevel('info');
		this.logger.info('SERVICE_INIT', 'Advanced weather service initialized');
	}

	/**
	 * Traducciones de códigos de clima
	 */
	private readonly weatherCodes = new Map([
		[0, 'Cielo despejado'],
		[1, 'Mayormente despejado'],
		[2, 'Parcialmente nublado'],
		[3, 'Nublado'],
		[45, 'Niebla'],
		[48, 'Niebla con escarcha'],
		[51, 'Llovizna ligera'],
		[53, 'Llovizna moderada'],
		[55, 'Llovizna intensa'],
		[56, 'Llovizna helada ligera'],
		[57, 'Llovizna helada intensa'],
		[61, 'Lluvia ligera'],
		[63, 'Lluvia moderada'],
		[65, 'Lluvia intensa'],
		[66, 'Lluvia helada ligera'],
		[67, 'Lluvia helada intensa'],
		[71, 'Nevada ligera'],
		[73, 'Nevada moderada'],
		[75, 'Nevada intensa'],
		[77, 'Granizo'],
		[80, 'Chubascos ligeros'],
		[81, 'Chubascos moderados'],
		[82, 'Chubascos intensos'],
		[85, 'Chubascos de nieve ligeros'],
		[86, 'Chubascos de nieve intensos'],
		[95, 'Tormenta eléctrica'],
		[96, 'Tormenta con granizo ligero'],
		[99, 'Tormenta con granizo intenso']
	]);

	/**
	 * Realiza una petición HTTP con timeout y reintentos
	 */
	private async fetchWithTimeout(
		url: string,
		options: RequestInit = {},
		timeoutMs: number = WEATHER_CONFIG.openMeteo.timeout,
		retries: number = WEATHER_CONFIG.defaults.maxRetries
	): Promise<Response> {
		const startTime = Date.now();

		for (let attempt = 1; attempt <= retries; attempt++) {
			try {
				this.logger.debug('HTTP_REQUEST', `Attempt ${attempt}/${retries}`, {
					url,
					timeout: timeoutMs
				});

				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

				const response = await fetch(url, {
					...options,
					signal: controller.signal,
					headers: {
						'User-Agent': 'SIGPI-MCP-Weather/2.0',
						Accept: 'application/json',
						...options.headers
					}
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				const duration = Date.now() - startTime;
				this.logger.debug('HTTP_SUCCESS', `Request completed`, {
					url,
					status: response.status,
					duration: `${duration}ms`,
					attempt
				});

				return response;
			} catch (error) {
				const duration = Date.now() - startTime;
				this.logger.warn('HTTP_RETRY', `Attempt ${attempt}/${retries} failed`, {
					url,
					error: error instanceof Error ? error.message : String(error),
					duration: `${duration}ms`
				});

				if (attempt === retries) {
					throw error;
				}

				// Esperar antes del siguiente intento (backoff exponencial)
				await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
			}
		}

		throw new Error('Max retries exceeded');
	}

	/**
	 * Obtiene las coordenadas de una ciudad
	 */
	private async getCoordinates(
		city: string
	): Promise<{ lat: number; lon: number; country: string; fullName: string }> {
		const cacheKey = `coords:${city.toLowerCase()}`;
		const cached = this.cache.get(cacheKey);

		if (cached) {
			this.logger.debug('GEOCODING_CACHE', 'Using cached coordinates', {
				city,
				coordinates: cached
			});
			return cached;
		}

		const url = `${WEATHER_CONFIG.openMeteo.geocodingUrl}?name=${encodeURIComponent(
			city
		)}&count=1&language=es&format=json`;

		this.logger.info('GEOCODING_REQUEST', 'Fetching coordinates', { city, url });

		const response = await this.fetchWithTimeout(url);
		const data: OpenMeteoGeocoding = await response.json();

		if (!data.results || data.results.length === 0) {
			throw new Error(`No se encontraron coordenadas para la ciudad: ${city}`);
		}

		const result = data.results[0];
		const coordinates = {
			lat: result.latitude,
			lon: result.longitude,
			country: result.country,
			fullName: `${result.name}, ${result.admin1 || ''} ${result.country}`.trim()
		};

		// Cache por 24 horas para coordenadas
		this.cache.set(cacheKey, coordinates, 24 * 60 * 60 * 1000);

		this.logger.info('GEOCODING_SUCCESS', 'Coordinates found', { city, coordinates });
		return coordinates;
	}

	/**
	 * Obtiene datos del clima desde Open-Meteo
	 */
	private async getWeatherData(lat: number, lon: number): Promise<OpenMeteoWeather> {
		const cacheKey = `weather:${lat.toFixed(4)},${lon.toFixed(4)}`;
		const cached = this.cache.get(cacheKey);

		if (cached) {
			this.logger.debug('WEATHER_CACHE', 'Using cached weather data', {
				coordinates: { lat, lon }
			});
			return cached;
		}

		const url = `${WEATHER_CONFIG.openMeteo.weatherUrl}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,wind_direction_10m&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto&past_days=1&forecast_days=7`;

		this.logger.info('WEATHER_REQUEST', 'Fetching weather data', {
			coordinates: { lat, lon },
			url
		});

		const response = await this.fetchWithTimeout(url);
		const data: OpenMeteoWeather = await response.json();

		// Cache por 10 minutos para datos del clima
		this.cache.set(cacheKey, data, WEATHER_CONFIG.defaults.cacheTtl);

		this.logger.info('WEATHER_SUCCESS', 'Weather data fetched', {
			coordinates: { lat, lon },
			hourlyDataPoints: data.hourly?.time?.length || 0
		});

		return data;
	}

	/**
	 * Procesa los datos del clima en resúmenes diarios
	 */
	private processWeatherData(
		weatherData: OpenMeteoWeather,
		cityName: string,
		country: string
	): { current: WeatherSummary; forecast: WeatherSummary[] } {
		const { hourly, current } = weatherData;

		if (!hourly || !hourly.time || hourly.time.length === 0) {
			throw new Error('No hay datos de clima disponibles');
		}

		// Agrupar datos por día
		const dailyData = new Map<
			string,
			{
				temperatures: number[];
				codes: number[];
				humidity: number[];
				windSpeed: number[];
				windDirection: number[];
			}
		>();

		for (let i = 0; i < hourly.time.length; i++) {
			const date = hourly.time[i].split('T')[0];
			const temp = hourly.temperature_2m[i];
			const code = hourly.weather_code[i];
			const humidity = hourly.relative_humidity_2m[i];
			const windSpeed = hourly.wind_speed_10m[i];
			const windDirection = hourly.wind_direction_10m[i];

			if (!dailyData.has(date)) {
				dailyData.set(date, {
					temperatures: [],
					codes: [],
					humidity: [],
					windSpeed: [],
					windDirection: []
				});
			}

			const dayData = dailyData.get(date)!;
			if (temp !== null) dayData.temperatures.push(temp);
			if (code !== null) dayData.codes.push(code);
			if (humidity !== null) dayData.humidity.push(humidity);
			if (windSpeed !== null) dayData.windSpeed.push(windSpeed);
			if (windDirection !== null) dayData.windDirection.push(windDirection);
		}

		// Crear resúmenes diarios
		const summaries: WeatherSummary[] = [];
		const today = new Date().toISOString().split('T')[0];

		for (const [date, data] of Array.from(dailyData.entries()).sort()) {
			if (data.temperatures.length === 0) continue;

			const avgTemp =
				Math.round(
					(data.temperatures.reduce((sum, temp) => sum + temp, 0) / data.temperatures.length) * 10
				) / 10;

			// Código de clima más frecuente
			const codeFreq = data.codes.reduce((acc, code) => {
				acc[code] = (acc[code] || 0) + 1;
				return acc;
			}, {} as Record<number, number>);

			const mostFrequentCode = parseInt(
				Object.entries(codeFreq).sort(([, a], [, b]) => b - a)[0][0]
			);

			const avgHumidity =
				data.humidity.length > 0
					? Math.round(data.humidity.reduce((sum, h) => sum + h, 0) / data.humidity.length)
					: undefined;

			const avgWindSpeed =
				data.windSpeed.length > 0
					? Math.round(
							(data.windSpeed.reduce((sum, w) => sum + w, 0) / data.windSpeed.length) * 10
					  ) / 10
					: undefined;

			const avgWindDirection =
				data.windDirection.length > 0
					? Math.round(
							data.windDirection.reduce((sum, w) => sum + w, 0) / data.windDirection.length
					  )
					: undefined;

			const dayOfWeek = new Date(date).toLocaleDateString('es-ES', { weekday: 'long' });

			summaries.push({
				date,
				day_of_week: dayOfWeek,
				city: cityName,
				country,
				weather: this.weatherCodes.get(mostFrequentCode) || 'Desconocido',
				temperature_celsius: avgTemp,
				humidity: avgHumidity,
				wind_speed: avgWindSpeed,
				wind_direction: avgWindDirection
			});
		}

		// Usar datos actuales si están disponibles, sino el primer día
		let currentSummary: WeatherSummary;
		if (current) {
			const todayData = summaries.find((s) => s.date === today);
			currentSummary = {
				date: today,
				day_of_week: new Date().toLocaleDateString('es-ES', { weekday: 'long' }),
				city: cityName,
				country,
				weather: this.weatherCodes.get(current.weather_code) || 'Desconocido',
				temperature_celsius: Math.round(current.temperature_2m * 10) / 10,
				wind_speed: Math.round(current.wind_speed_10m * 10) / 10,
				wind_direction: Math.round(current.wind_direction_10m),
				humidity: todayData?.humidity
			};
		} else {
			currentSummary = summaries[0];
		}

		return {
			current: currentSummary,
			forecast: summaries.slice(1, 8) // Próximos 7 días
		};
	}

	/**
	 * Obtiene el pronóstico del clima para una ciudad
	 */
	async getWeatherForecast(city: string): Promise<WeatherResult> {
		const startTime = Date.now();
		this.requestCount++;

		this.logger.info('FORECAST_REQUEST', 'Starting weather forecast request', {
			city,
			requestId: this.requestCount
		});

		try {
			// 1. Obtener coordenadas
			const coordinates = await this.getCoordinates(city);

			// 2. Obtener datos del clima
			const weatherData = await this.getWeatherData(coordinates.lat, coordinates.lon);

			// 3. Procesar datos
			const processed = this.processWeatherData(weatherData, city, coordinates.country);

			const result: WeatherResult = {
				current: processed.current,
				forecast: processed.forecast,
				metadata: {
					source: 'openmeteo',
					timestamp: new Date().toISOString(),
					coordinates: { lat: coordinates.lat, lon: coordinates.lon },
					query_time_ms: Date.now() - startTime
				}
			};

			this.logger.info('FORECAST_SUCCESS', 'Weather forecast completed successfully', {
				city,
				requestId: this.requestCount,
				duration: `${result.metadata.query_time_ms}ms`,
				forecastDays: result.forecast.length
			});

			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logger.error('FORECAST_ERROR', 'Weather forecast failed', {
				city,
				requestId: this.requestCount,
				duration: `${duration}ms`,
				error: error instanceof Error ? error.message : String(error)
			});
			throw error;
		}
	}

	/**
	 * Formatea el resultado como texto legible
	 */
	formatWeatherText(result: WeatherResult): string {
		const { current, forecast, metadata } = result;

		let text = `🌤️ **Pronóstico del Clima - ${current.city}, ${current.country}**\n\n`;

		// Condiciones actuales
		text += `**📍 Condiciones Actuales (${current.day_of_week}):**\n`;
		text += `• 🌡️ Temperatura: ${current.temperature_celsius}°C\n`;
		text += `• ☁️ Condiciones: ${current.weather}\n`;
		if (current.humidity) text += `• 💧 Humedad: ${current.humidity}%\n`;
		if (current.wind_speed) text += `• 💨 Viento: ${current.wind_speed} km/h`;
		if (current.wind_direction) text += ` (${current.wind_direction}°)`;
		text += '\n\n';

		// Pronóstico
		if (forecast.length > 0) {
			text += `**📅 Pronóstico (próximos ${Math.min(forecast.length, 5)} días):**\n`;
			forecast.slice(0, 5).forEach((day, index) => {
				const dayLabel = index === 0 ? 'Mañana' : day.day_of_week;
				text += `• ${dayLabel}: ${day.temperature_celsius}°C, ${day.weather}\n`;
			});
			text += '\n';
		}

		// Metadata
		text += `*📊 Fuente: ${metadata.source} | Consultado: ${new Date(
			metadata.timestamp
		).toLocaleString('es-ES')} | Tiempo: ${metadata.query_time_ms}ms*`;

		return text;
	}

	/**
	 * Obtiene estadísticas del servicio
	 */
	getServiceStats() {
		return {
			requests: this.requestCount,
			cache: this.cache.getStats(),
			uptime: Date.now()
		};
	}
}

/**
 * Schema de validación para la herramienta de clima
 */
export const weatherToolSchema = z.object({
	city: z
		.string()
		.min(1, 'El nombre de la ciudad es requerido')
		.max(100, 'El nombre de la ciudad es demasiado largo')
		.describe('Ciudad para consultar el pronóstico del clima (cualquier ciudad del mundo)')
});

export type WeatherToolArgs = z.infer<typeof weatherToolSchema>;

/**
 * Instancia del servicio de clima
 */
export const weatherService = new AdvancedWeatherService();

/**
 * Manejador de la herramienta de clima
 */
export async function handleWeatherTool(args: WeatherToolArgs): Promise<McpResponse> {
	const startTime = Date.now();

	try {
		const result = await weatherService.getWeatherForecast(args.city);
		const formattedText = weatherService.formatWeatherText(result);

		// Log exitoso
		weatherService['logger'].toolExecution('weather', args, startTime, 'success', result);

		return {
			content: [
				{
					type: 'text',
					text: formattedText
				}
			],
			metadata: {
				source: 'weather_tool',
				processed: true,
				direct_response: true
			}
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido al obtener el clima';

		// Log error
		weatherService['logger'].toolExecution('weather', args, startTime, 'error', error);

		return {
			content: [
				{
					type: 'text',
					text: `❌ **Error al obtener el clima para "${args.city}"**\n\n${errorMessage}\n\n💡 **Sugerencias:**\n• Verifica que el nombre de la ciudad esté escrito correctamente\n• Intenta con el nombre en inglés\n• Incluye el país si hay múltiples ciudades con el mismo nombre\n• Ejemplo: "Madrid, Spain" o "New York, USA"`
				}
			],
			isError: true
		};
	}
}

/**
 * Definición de la herramienta de clima para MCP
 */
export const weatherTool: McpTool<WeatherToolArgs> = {
	name: 'weather',
	title: 'Pronóstico del Clima Global',
	description:
		'Obtiene el pronóstico del clima actual y de los próximos 7 días para cualquier ciudad del mundo.',
	category: 'information',
	schema: weatherToolSchema,
	handler: handleWeatherTool,
	metadata: {
		version: '2.0.0',
		author: 'SIGPI',
		supportedRegions: ['Global'],
		dataSource: 'Open-Meteo API',
		rateLimit: 'Sin límites para uso normal',
		caching: 'Datos cacheados por 10 minutos',
		timeout: '15 segundos con reintentos automáticos',
		// Información adicional para el popup de la herramienta
		helpInfo: {
			title: '🌤️ Pronóstico del Clima Global',
			description:
				'Esta herramienta te permite obtener información meteorológica actualizada para cualquier ciudad del mundo, incluyendo pronósticos para los próximos 7 días.',
			howToUse: [
				'1️⃣ Pregunta por el clima o pronóstico de cualquier ciudad del mundo.',
				'2️⃣ Especifica el nombre de la ciudad claramente en tu consulta.',
				'3️⃣ La herramienta detectará automáticamente la ciudad y te mostrará la información meteorológica actual y el pronóstico.'
			],
			suggestedQuestions: [
				'¿Cómo está el clima en Quito?',
				'Muéstrame el pronóstico del clima en Madrid',
				'¿Cuál es la temperatura actual en Tokio?',
				'¿Va a llover en Nueva York esta semana?',
				'¿Qué tiempo hace en Buenos Aires?',
				'Pronóstico del clima para Ciudad de México',
				'¿Cómo estará el clima en París los próximos días?'
			],
			tips: [
				'🌍 Funciona con ciudades de cualquier país y en cualquier idioma',
				'⏱️ Los datos se actualizan cada 10 minutos para mayor precisión',
				'🔍 Incluye el nombre completo de la ciudad para mayor precisión (ej. "Santiago de Chile" en lugar de solo "Santiago")',
				'🌡️ Muestra temperaturas en grados Celsius, velocidad del viento en km/h y más detalles relevantes'
			]
		}
	}
};
