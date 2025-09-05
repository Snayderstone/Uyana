import { z } from 'zod';
import type { McpTool } from '../../shared/types';
import { mcpLogger } from '../../shared/mcpLogger';

/**
 * Esquema de validación para la herramienta de fecha y tiempo
 */
const fechaTiempoSchema = z.object({
	consulta: z.string().describe('Consulta sobre fecha, hora o tiempo en Ecuador'),
	formato: z
		.enum(['completo', 'fecha', 'hora', 'timestamp'])
		.optional()
		.default('completo')
		.describe('Formato de respuesta deseado'),
	incluirZonaHoraria: z
		.boolean()
		.optional()
		.default(true)
		.describe('Incluir información de zona horaria')
});

type FechaTiempoArgs = z.infer<typeof fechaTiempoSchema>;

/**
 * Obtiene la fecha y hora actual en Ecuador (GMT-5)
 */
function obtenerFechaHoraEcuador(): Date {
	// Ecuador está en GMT-5 (ECT - Ecuador Time)
	const now = new Date();
	const utc = now.getTime() + now.getTimezoneOffset() * 60000;
	const ecuadorTime = new Date(utc + -5 * 3600000); // GMT-5
	return ecuadorTime;
}

/**
 * Formatea la fecha según el tipo solicitado
 */
function formatearFecha(fecha: Date, formato: string, incluirZonaHoraria: boolean): string {
	const opciones: Intl.DateTimeFormatOptions = {
		timeZone: 'America/Guayaquil'
	};

	switch (formato) {
		case 'fecha':
			return fecha.toLocaleDateString('es-EC', {
				...opciones,
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});

		case 'hora':
			return (
				fecha.toLocaleTimeString('es-EC', {
					...opciones,
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: false
				}) + (incluirZonaHoraria ? ' (ECT GMT-5)' : '')
			);

		case 'timestamp':
			return fecha.getTime().toString();

		case 'completo':
		default:
			const fechaStr = fecha.toLocaleDateString('es-EC', {
				...opciones,
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
			const horaStr = fecha.toLocaleTimeString('es-EC', {
				...opciones,
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false
			});

			return `${fechaStr} a las ${horaStr}${incluirZonaHoraria ? ' (Hora de Ecuador, GMT-5)' : ''}`;
	}
}

/**
 * Obtiene información adicional sobre la fecha
 */
function obtenerInfoAdicional(fecha: Date): {
	diaSemana: string;
	semanaDelAno: number;
	diaDelAno: number;
	trimestre: number;
	estacion: string;
} {
	const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
	const diaSemana = diasSemana[fecha.getDay()];

	// Calcular semana del año
	const inicioAno = new Date(fecha.getFullYear(), 0, 1);
	const diasTranscurridos = Math.floor(
		(fecha.getTime() - inicioAno.getTime()) / (1000 * 60 * 60 * 24)
	);
	const semanaDelAno = Math.ceil((diasTranscurridos + inicioAno.getDay() + 1) / 7);

	// Calcular día del año
	const diaDelAno = diasTranscurridos + 1;

	// Calcular trimestre
	const trimestre = Math.ceil((fecha.getMonth() + 1) / 3);

	// Determinar estación (Ecuador está en el hemisferio sur, pero cerca del ecuador)
	const mes = fecha.getMonth() + 1;
	let estacion: string;
	if (mes >= 12 || mes <= 2) {
		estacion = 'Estación seca (verano)';
	} else if (mes >= 3 && mes <= 5) {
		estacion = 'Transición a estación lluviosa';
	} else if (mes >= 6 && mes <= 8) {
		estacion = 'Estación lluviosa (invierno)';
	} else {
		estacion = 'Transición a estación seca';
	}

	return {
		diaSemana,
		semanaDelAno,
		diaDelAno,
		trimestre,
		estacion
	};
}

/**
 * Procesa consultas específicas sobre fecha y tiempo
 */
function procesarConsulta(consulta: string, fecha: Date): string {
	const consultaNormalizada = consulta.toLowerCase().trim();

	// Mejorar la detección de patrones relacionados con día actual
	if (
		consultaNormalizada.includes('qué día') ||
		consultaNormalizada.includes('que dia') ||
		consultaNormalizada.includes('día es hoy') ||
		consultaNormalizada.includes('dia es hoy') ||
		consultaNormalizada.includes('qué día es') ||
		consultaNormalizada.includes('que dia es')
	) {
		const info = obtenerInfoAdicional(fecha);
		return `Hoy es **${info.diaSemana}**`;
	}

	if (consultaNormalizada.includes('qué fecha') || consultaNormalizada.includes('que fecha')) {
		return formatearFecha(fecha, 'fecha', false);
	}

	if (consultaNormalizada.includes('qué hora') || consultaNormalizada.includes('que hora')) {
		return formatearFecha(fecha, 'hora', true);
	}

	if (consultaNormalizada.includes('semana')) {
		const info = obtenerInfoAdicional(fecha);
		return `Estamos en la semana **${info.semanaDelAno}** del año ${fecha.getFullYear()}`;
	}

	if (consultaNormalizada.includes('trimestre')) {
		const info = obtenerInfoAdicional(fecha);
		return `Estamos en el **${info.trimestre}º trimestre** del año ${fecha.getFullYear()}`;
	}

	if (consultaNormalizada.includes('estación') || consultaNormalizada.includes('clima')) {
		const info = obtenerInfoAdicional(fecha);
		return `En Ecuador: **${info.estacion}**`;
	}

	// Respuesta por defecto
	return formatearFecha(fecha, 'completo', true);
}

/**
 * Manejador principal de la herramienta de fecha y tiempo
 */
async function manejarConsultaFechaTiempo(args: FechaTiempoArgs): Promise<any> {
	const startTime = Date.now();
	const toolName = 'fecha-tiempo-ecuador';

	// Registrar inicio de la ejecución de la herramienta
	mcpLogger.info(
		'FECHA_TIEMPO',
		'EXECUTION_START',
		'Iniciando consulta de fecha y tiempo en Ecuador',
		{
			args,
			timestamp: startTime
		}
	);

	try {
		mcpLogger.debug('FECHA_TIEMPO', 'GETTING_TIME', 'Obteniendo hora actual de Ecuador');
		const fechaEcuador = obtenerFechaHoraEcuador();

		mcpLogger.debug('FECHA_TIEMPO', 'PROCESSING_QUERY', 'Procesando consulta', {
			consulta: args.consulta,
			timestamp: fechaEcuador.toISOString()
		});
		const respuesta = procesarConsulta(args.consulta, fechaEcuador);

		mcpLogger.debug('FECHA_TIEMPO', 'GETTING_ADDITIONAL_INFO', 'Obteniendo información adicional');
		const info = obtenerInfoAdicional(fechaEcuador);

		// Formatear datos para respuesta completa
		const responseData = {
			respuesta,
			fechaCompleta: formatearFecha(fechaEcuador, 'completo', args.incluirZonaHoraria),
			fecha: formatearFecha(fechaEcuador, 'fecha', false),
			hora: formatearFecha(fechaEcuador, 'hora', args.incluirZonaHoraria),
			timestamp: fechaEcuador.getTime(),
			zonaHoraria: 'America/Guayaquil (GMT-5)',
			infoAdicional: info
		};

		const duration = Date.now() - startTime;

		// Registrar éxito y detalles de la respuesta
		mcpLogger.info(
			'FECHA_TIEMPO',
			'EXECUTION_SUCCESS',
			`Consulta completada exitosamente en ${duration}ms`,
			{
				respuesta,
				data: responseData,
				duration: `${duration}ms`
			}
		);

		// Registrar ejecución de herramienta en formato estándar
		mcpLogger.toolExecution(toolName, args, startTime, 'success', responseData);

		return {
			content: [
				{
					type: 'text',
					text: respuesta
				}
			],
			metadata: {
				success: true,
				data: responseData,
				herramienta: toolName,
				consulta: args.consulta,
				timestamp: Date.now(),
				pais: 'Ecuador',
				zonaHoraria: 'GMT-5',
				executionTimeMs: duration
			}
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
		const duration = Date.now() - startTime;

		// Registrar error detallado
		mcpLogger.error(
			'FECHA_TIEMPO',
			'EXECUTION_ERROR',
			`Error al procesar consulta: ${errorMessage}`,
			{
				error,
				args,
				duration: `${duration}ms`
			}
		);

		// Registrar ejecución fallida de herramienta en formato estándar
		mcpLogger.toolExecution(toolName, args, startTime, 'error', error);

		return {
			content: [
				{
					type: 'text',
					text: `❌ **Error al obtener información de fecha y tiempo**\n\n${errorMessage}\n\n💡 Intente con una consulta diferente.`
				}
			],
			isError: true,
			metadata: {
				success: false,
				error: {
					message: 'Error al obtener información de fecha y tiempo',
					details: errorMessage,
					code: 'FECHA_TIEMPO_ERROR'
				},
				herramienta: toolName,
				consulta: args.consulta,
				timestamp: Date.now(),
				executionTimeMs: duration
			}
		};
	}
}

/**
 * Definición de la herramienta de fecha y tiempo para Ecuador
 */
export const fechaTiempoTool: McpTool = {
	name: 'fecha-tiempo-ecuador',
	title: 'Fecha y Tiempo en Ecuador',
	description: 'Proporciona información precisa sobre fecha, hora y tiempo en Ecuador (GMT-5)',
	category: 'utilidades',
	schema: fechaTiempoSchema,
	handler: manejarConsultaFechaTiempo,
	metadata: {
		version: '1.0.0',
		author: 'UYANA Team',
		tags: ['fecha', 'tiempo', 'ecuador', 'zona-horaria', 'calendar'],
		examples: [
			{
				consulta: '¿Qué día es hoy?',
				descripcion: 'Obtiene el día de la semana actual'
			},
			{
				consulta: '¿Qué fecha es hoy?',
				descripcion: 'Obtiene la fecha completa actual'
			},
			{
				consulta: '¿Qué hora es?',
				descripcion: 'Obtiene la hora actual en Ecuador'
			},
			{
				consulta: '¿En qué semana estamos?',
				descripcion: 'Obtiene la semana del año actual'
			},
			{
				consulta: '¿Qué estación es?',
				descripcion: 'Obtiene información sobre la estación climática'
			}
		],
		limitations: [
			'La información se basa en la zona horaria de Ecuador (GMT-5)',
			'Las estaciones se adaptan al clima ecuatorial del país'
		],
		// Información adicional para el popup de la herramienta
		helpInfo: {
			title: '🕒 Fecha y Tiempo en Ecuador',
			description:
				'Esta herramienta proporciona información precisa sobre la fecha y hora en Ecuador, utilizando la zona horaria de GMT-5 (ECT - Ecuador Time).',
			howToUse: [
				'1️⃣ Simplemente pregunta sobre la fecha, hora o tiempo en Ecuador.',
				'2️⃣ La herramienta detectará automáticamente tu consulta y te dará la información actualizada.',
				'3️⃣ Puedes solicitar información específica como día, fecha, hora, semana o estación del año.'
			],
			suggestedQuestions: [
				'¿Qué día es hoy?',
				'¿Qué fecha es hoy en Ecuador?',
				'¿Qué hora es actualmente en Ecuador?',
				'¿En qué semana del año estamos?',
				'¿En qué trimestre estamos?',
				'¿Qué estación del año es en Ecuador?',
				'¿Qué día del año es hoy?'
			],
			tips: [
				'⏰ Si necesitas solo la hora, pregunta específicamente "¿Qué hora es?"',
				'📅 Si necesitas información detallada sobre la fecha, pregunta "¿Qué fecha es hoy?"',
				'🌡️ Puedes preguntar sobre la estación climática actual en Ecuador'
			]
		}
	}
};
