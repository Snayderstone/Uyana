import { z } from 'zod';
import type { McpTool } from '../../shared/types';
import { mcpLogger } from '../../shared/mcpLogger';
import {
	obtenerProyectos,
	obtenerProyectosPorEstado,
	obtenerProyectosPorFacultad,
	obtenerProyectosPorCampoAmplio,
	obtenerProyectosPorAlcance,
	obtenerProyectosPorFinanciamiento,
	obtenerProyectosPorTipo,
	obtenerEstadisticasGenerales,
	type Proyecto
} from '$lib/services/proyectosService';

/**
 * Esquema de validación para la herramienta de consulta de proyectos
 */
const proyectosToolSchema = z.object({
	consulta: z
		.string()
		.describe('Consulta sobre proyectos de investigación de la Universidad Central del Ecuador'),
	limite: z.number().optional().default(10).describe('Cantidad máxima de resultados a devolver'),
	filtro: z
		.object({
			campo: z.string().optional().describe('Campo por el cual filtrar'),
			valor: z.string().optional().describe('Valor del filtro')
		})
		.optional()
		.describe('Filtros para la consulta')
});

type ProyectosToolArgs = z.infer<typeof proyectosToolSchema>;

/**
 * Procesa consultas específicas sobre proyectos
 */
async function procesarConsulta(
	consulta: string,
	limite: number,
	filtro?: { campo?: string; valor?: string }
): Promise<{
	respuesta: string;
	datos: any;
}> {
	const consultaNormalizada = consulta.toLowerCase().trim();

	try {
		// Consultas sobre estadísticas generales
		if (
			consultaNormalizada.includes('cuántos proyectos') ||
			consultaNormalizada.includes('cuantos proyectos') ||
			consultaNormalizada.includes('total de proyectos') ||
			consultaNormalizada.includes('número de proyectos') ||
			consultaNormalizada.includes('numero de proyectos')
		) {
			const estadisticas = await obtenerEstadisticasGenerales();

			return {
				respuesta: `Actualmente hay **${estadisticas.totalProyectos} proyectos** registrados en total, de los cuales **${estadisticas.proyectosActivos} están activos** (en ejecución o en cierre) y **${estadisticas.proyectosCerrados} están cerrados o finalizados**. Además, hay **${estadisticas.investigadoresAcreditados} proyectos con investigadores acreditados por SENESCYT**.`,
				datos: estadisticas
			};
		}

		// Consultas sobre proyectos activos
		if (
			consultaNormalizada.includes('proyectos activos') ||
			consultaNormalizada.includes('en ejecución') ||
			consultaNormalizada.includes('en ejecucion') ||
			(consultaNormalizada.includes('proyectos') && consultaNormalizada.includes('activos'))
		) {
			const estadisticas = await obtenerEstadisticasGenerales();
			const porEstado = await obtenerProyectosPorEstado();

			const proyectosEnEjecucion =
				porEstado.find((e) => e.estado === 'En ejecución')?.cantidad || 0;
			const proyectosEnCierre = porEstado.find((e) => e.estado === 'En cierre')?.cantidad || 0;

			return {
				respuesta: `Hay un total de **${estadisticas.proyectosActivos} proyectos activos**, de los cuales **${proyectosEnEjecucion} están en ejecución** y **${proyectosEnCierre} están en proceso de cierre**.`,
				datos: {
					activos: estadisticas.proyectosActivos,
					enEjecucion: proyectosEnEjecucion,
					enCierre: proyectosEnCierre
				}
			};
		}

		// Consultas sobre proyectos cerrados o finalizados
		if (
			consultaNormalizada.includes('proyectos cerrados') ||
			consultaNormalizada.includes('proyectos finalizados') ||
			(consultaNormalizada.includes('proyectos') &&
				(consultaNormalizada.includes('cerrados') || consultaNormalizada.includes('finalizados')))
		) {
			const estadisticas = await obtenerEstadisticasGenerales();

			return {
				respuesta: `Hay un total de **${estadisticas.proyectosCerrados} proyectos cerrados o finalizados**.`,
				datos: {
					cerrados: estadisticas.proyectosCerrados
				}
			};
		}

		// Consultas sobre facultades
		if (consultaNormalizada.includes('facultad') || consultaNormalizada.includes('facultades')) {
			const facultades = await obtenerProyectosPorFacultad();

			// Consultas sobre ranking o top de facultades
			if (
				consultaNormalizada.includes('ranking') ||
				consultaNormalizada.includes('top') ||
				consultaNormalizada.includes('rankin') ||
				consultaNormalizada.includes('primeras') ||
				consultaNormalizada.includes('primeros') ||
				consultaNormalizada.includes('mejores') ||
				consultaNormalizada.includes('listado')
			) {
				// Determinar cuántas facultades mostrar (top N)
				let topN = limite;

				// Buscar patrones de números como "top 5", "top 10", etc.
				const numMatch = consultaNormalizada.match(
					/top\s+(\d+)|(\d+)\s+primeras?|ranking\s+de\s+(\d+)|primeras?\s+(\d+)|(\d+)\s+facultades/
				);
				if (numMatch) {
					// Encontrar el primer grupo que contenga un número
					const num = numMatch.slice(1).find((n) => n !== undefined);
					if (num) {
						topN = parseInt(num);
					}
				}

				return {
					respuesta: `# Top ${topN} Facultades por Número de Proyectos\n\n${facultades
						.slice(0, topN)
						.map((f, i) => `${i + 1}. **${f.facultad}**: ${f.cantidad} proyectos`)
						.join('\n')}`,
					datos: {
						facultades: facultades.slice(0, topN)
					}
				};
			}

			// Facultad con más proyectos
			if (
				consultaNormalizada.includes('más proyectos') ||
				consultaNormalizada.includes('mas proyectos') ||
				consultaNormalizada.includes('mayor cantidad') ||
				consultaNormalizada.includes('mayor número')
			) {
				const facultadTop = facultades[0];

				return {
					respuesta: `La facultad con más proyectos es **${facultadTop.facultad}** con un total de **${facultadTop.cantidad} proyectos**. Le siguen ${facultades[1]?.facultad} con ${facultades[1]?.cantidad} proyectos y ${facultades[2]?.facultad} con ${facultades[2]?.cantidad} proyectos.`,
					datos: {
						topFacultades: facultades.slice(0, 5)
					}
				};
			}

			// Lista de facultades con proyectos
			return {
				respuesta: `Las principales facultades por número de proyectos son:\n\n${facultades
					.slice(0, limite)
					.map((f, i) => `${i + 1}. **${f.facultad}**: ${f.cantidad} proyectos`)
					.join('\n')}`,
				datos: {
					facultades: facultades.slice(0, limite)
				}
			};
		}

		// Consultas sobre campos de conocimiento
		if (
			consultaNormalizada.includes('campo') ||
			consultaNormalizada.includes('área') ||
			consultaNormalizada.includes('area') ||
			consultaNormalizada.includes('disciplina')
		) {
			const campos = await obtenerProyectosPorCampoAmplio();

			return {
				respuesta: `Los principales campos de conocimiento por número de proyectos son:\n\n${campos
					.slice(0, limite)
					.map((c, i) => `${i + 1}. **${c.campo}**: ${c.cantidad} proyectos`)
					.join('\n')}`,
				datos: {
					campos: campos.slice(0, limite)
				}
			};
		}

		// Consultas sobre alcance territorial
		if (
			consultaNormalizada.includes('alcance') ||
			consultaNormalizada.includes('territorial') ||
			consultaNormalizada.includes('territorio') ||
			consultaNormalizada.includes('locales') ||
			consultaNormalizada.includes('nacionales') ||
			consultaNormalizada.includes('internacionales')
		) {
			const alcances = await obtenerProyectosPorAlcance();

			return {
				respuesta: `La distribución de proyectos por alcance territorial es:\n\n${alcances
					.map((a) => `- **${a.alcance}**: ${a.cantidad} proyectos`)
					.join('\n')}`,
				datos: {
					alcances
				}
			};
		}

		// Consultas sobre financiamiento
		if (
			consultaNormalizada.includes('financiamiento') ||
			consultaNormalizada.includes('financiados') ||
			consultaNormalizada.includes('fondos')
		) {
			const financiamiento = await obtenerProyectosPorFinanciamiento();

			return {
				respuesta: `Las fuentes de financiamiento de los proyectos son:\n\n${financiamiento
					.map((f) => `- **${f.fuente}**: ${f.cantidad} proyectos`)
					.join('\n')}`,
				datos: {
					financiamiento
				}
			};
		}

		// Consultas sobre tipos de proyectos
		if (consultaNormalizada.includes('tipo') || consultaNormalizada.includes('tipos')) {
			const tipos = await obtenerProyectosPorTipo();

			return {
				respuesta: `Los tipos de proyectos registrados son:\n\n${tipos
					.map((t) => `- **${t.tipo}**: ${t.cantidad} proyectos`)
					.join('\n')}`,
				datos: {
					tipos
				}
			};
		}

		// Búsqueda por palabras clave en título o objetivo
		if (
			consultaNormalizada.includes('proyectos sobre') ||
			consultaNormalizada.includes('proyectos de') ||
			consultaNormalizada.includes('investigaciones sobre') ||
			consultaNormalizada.includes('investigaciones de') ||
			consultaNormalizada.includes('buscar proyectos')
		) {
			// Extraer términos de búsqueda
			let terminosBusqueda: string[] = [];

			const frasesAEliminar = [
				'proyectos sobre',
				'proyectos de',
				'investigaciones sobre',
				'investigaciones de',
				'buscar proyectos',
				'buscar',
				'muéstrame',
				'muestrame',
				'dame',
				'dime',
				'cuáles son',
				'cuales son',
				'hay',
				'existen'
			];

			let texto = consultaNormalizada;
			frasesAEliminar.forEach((frase) => {
				texto = texto.replace(frase, '');
			});

			terminosBusqueda = texto
				.trim()
				.split(/\s+/)
				.filter((t) => t.length > 3);

			if (terminosBusqueda.length > 0) {
				const proyectos = await obtenerProyectos();

				// Filtrar proyectos que contengan los términos en título u objetivo
				const proyectosFiltrados = proyectos.filter((proyecto) => {
					const tituloLower = (proyecto.titulo || '').toLowerCase();
					const objetivoLower = (proyecto.objetivo || '').toLowerCase();

					return terminosBusqueda.some(
						(termino) => tituloLower.includes(termino) || objetivoLower.includes(termino)
					);
				});

				if (proyectosFiltrados.length > 0) {
					return {
						respuesta: `Encontré **${
							proyectosFiltrados.length
						} proyectos** relacionados con tu búsqueda. Algunos de ellos son:\n\n${proyectosFiltrados
							.slice(0, limite)
							.map(
								(p, i) =>
									`${i + 1}. **${p.titulo}**\n   - Facultad: ${
										p.facultad_o_entidad_o_area_responsable
									}\n   - Estado: ${p.estado}\n   - Objetivo: ${p.objetivo?.substring(0, 100)}...`
							)
							.join('\n\n')}`,
						datos: {
							proyectos: proyectosFiltrados.slice(0, limite)
						}
					};
				} else {
					return {
						respuesta: `No encontré proyectos que coincidan con los términos de búsqueda. Por favor intenta con otras palabras clave.`,
						datos: { proyectos: [] }
					};
				}
			}
		}

		// Si no se reconoce ninguna consulta específica, devolver estadísticas generales
		const estadisticas = await obtenerEstadisticasGenerales();
		const facultades = await obtenerProyectosPorFacultad();
		const tipos = await obtenerProyectosPorTipo();

		return {
			respuesta: `Hay un total de **${estadisticas.totalProyectos} proyectos de investigación** registrados en la Universidad Central del Ecuador.\n\n**Principales estadísticas:**\n- Proyectos activos: ${estadisticas.proyectosActivos}\n- Proyectos cerrados: ${estadisticas.proyectosCerrados}\n- Investigadores acreditados SENESCYT: ${estadisticas.investigadoresAcreditados}\n\n**Principal tipo de proyecto:** ${tipos[0].tipo} (${tipos[0].cantidad} proyectos)\n\n**Facultad con más proyectos:** ${facultades[0].facultad} (${facultades[0].cantidad} proyectos)`,
			datos: {
				estadisticas,
				topFacultades: facultades.slice(0, 3),
				topTipos: tipos.slice(0, 3)
			}
		};
	} catch (error) {
		mcpLogger.error('PROYECTOS_TOOL', 'CONSULTA_ERROR', `Error procesando consulta: ${error}`, {
			consulta,
			error
		});

		return {
			respuesta: `Lo siento, ocurrió un error al procesar tu consulta sobre proyectos. Por favor, intenta nuevamente con una consulta diferente.`,
			datos: { error: String(error) }
		};
	}
}

/**
 * Manejador principal de la herramienta de proyectos
 */
async function manejarConsultaProyectos(args: ProyectosToolArgs): Promise<any> {
	const startTime = Date.now();
	const toolName = 'proyectos-uce';

	// Registrar inicio de la ejecución
	mcpLogger.info('PROYECTOS_TOOL', 'EXECUTION_START', 'Iniciando consulta de proyectos UCE', {
		args,
		timestamp: startTime
	});

	try {
		// Procesar la consulta
		mcpLogger.debug('PROYECTOS_TOOL', 'PROCESSING_QUERY', 'Procesando consulta', {
			consulta: args.consulta
		});

		const { respuesta, datos } = await procesarConsulta(args.consulta, args.limite, args.filtro);

		const duration = Date.now() - startTime;

		// Registrar éxito
		mcpLogger.info(
			'PROYECTOS_TOOL',
			'EXECUTION_SUCCESS',
			`Consulta completada exitosamente en ${duration}ms`,
			{
				respuesta: respuesta.substring(0, 100) + '...',
				duration: `${duration}ms`
			}
		);

		// Registrar ejecución de herramienta
		mcpLogger.toolExecution(toolName, args, startTime, 'success', {
			respuesta: respuesta.substring(0, 100) + '...',
			datos
		});

		return {
			content: [
				{
					type: 'text',
					text: respuesta
				}
			],
			metadata: {
				success: true,
				data: datos,
				herramienta: toolName,
				consulta: args.consulta,
				timestamp: Date.now(),
				executionTimeMs: duration
			}
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
		const duration = Date.now() - startTime;

		// Registrar error
		mcpLogger.error(
			'PROYECTOS_TOOL',
			'EXECUTION_ERROR',
			`Error al procesar consulta: ${errorMessage}`,
			{
				error,
				args,
				duration: `${duration}ms`
			}
		);

		// Registrar ejecución fallida
		mcpLogger.toolExecution(toolName, args, startTime, 'error', error);

		return {
			content: [
				{
					type: 'text',
					text: `❌ **Error al obtener información de proyectos**\n\n${errorMessage}\n\n💡 Intente con una consulta diferente.`
				}
			],
			isError: true,
			metadata: {
				success: false,
				error: {
					message: 'Error al obtener información de proyectos',
					details: errorMessage,
					code: 'PROYECTOS_TOOL_ERROR'
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
 * Definición de la herramienta de proyectos para UCE
 */
export const proyectosTool: McpTool = {
	name: 'proyectos-uce',
	title: 'Proyectos de Investigación UCE',
	description:
		'Consulta información sobre proyectos de investigación de la Universidad Central del Ecuador',
	category: 'académico',
	schema: proyectosToolSchema,
	handler: manejarConsultaProyectos,
	metadata: {
		version: '1.0.0',
		author: 'UYANA Team',
		tags: [
			'proyectos',
			'investigación',
			'UCE',
			'academia',
			'database',
			'dirección de investigación'
		],
		examples: [
			{
				consulta: '¿Cuántos proyectos hay en total?',
				descripcion: 'Obtiene el número total de proyectos'
			},
			{
				consulta: '¿Cuáles son las facultades con más proyectos?',
				descripcion: 'Lista las facultades ordenadas por número de proyectos'
			},
			{
				consulta: 'Muestra el top 5 de facultades',
				descripcion: 'Muestra un ranking de las 5 facultades con más proyectos'
			},
			{
				consulta: '¿Cuántos proyectos están en ejecución?',
				descripcion: 'Informa sobre proyectos activos'
			},
			{
				consulta: '¿Qué tipos de proyectos existen?',
				descripcion: 'Muestra los diferentes tipos de proyectos y su cantidad'
			},
			{
				consulta: 'Proyectos sobre desarrollo sostenible',
				descripcion: 'Busca proyectos relacionados con un tema específico'
			}
		],
		limitations: [
			'La información proviene de la base de datos de proyectos SIIES de la UCE',
			'Las consultas de texto libre pueden no devolver todos los resultados relevantes',
			'Los datos están limitados a los campos disponibles en la tabla proyectos_siies_uce'
		],
		// Información adicional para el popup de la herramienta
		helpInfo: {
			title: '🔍 Consulta de Proyectos de Investigación UCE',
			description:
				'Esta herramienta te permite acceder a la información de los proyectos de investigación registrados en la Universidad Central del Ecuador.',
			howToUse: [
				'1️⃣ Simplemente escribe tu pregunta sobre proyectos de investigación de la UCE.',
				'2️⃣ La herramienta identificará automáticamente tu consulta y buscará la información.',
				'3️⃣ Puedes preguntar sobre estadísticas generales, rankings por facultades, temas específicos, etc.'
			],
			suggestedQuestions: [
				'¿Cuántos proyectos de investigación hay registrados en total?',
				'¿Cuál es la facultad que más proyectos tiene?',
				'Muéstrame el ranking de las 5 facultades con más proyectos',
				'¿Hay proyectos sobre desarrollo sostenible?',
				'¿Cuáles son los diferentes tipos de proyectos?',
				'¿Qué campos de conocimiento tienen más investigaciones?',
				'¿Cuántos proyectos tienen alcance internacional?'
			],
			tips: [
				'📊 Para consultar rankings, puedes especificar "top 3" o "top 10" en tu pregunta',
				'🔎 Para buscar proyectos sobre un tema específico, usa "proyectos sobre [tema]"',
				'📋 Si necesitas filtrar por facultad, menciona el nombre de la facultad en tu consulta'
			]
		}
	}
};
