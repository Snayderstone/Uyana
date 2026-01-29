/**
 * Herramienta MCP para consultar estadísticas de SIGPI
 * Proporciona información sobre proyectos, participantes, facultades, etc.
 */

import { z } from 'zod';
import type { McpTool, McpResponse } from '$lib/mcp-core/shared/types';
import { estadisticasRepository } from '$lib/db/estadisticas.repository';

/**
 * Esquema de validación para la herramienta de estadísticas
 * Flexible: acepta tanto 'consulta' como 'input'
 */
const estadisticasSigpiSchema = z.object({
	consulta: z
		.string()
		.min(1, 'La consulta es requerida')
		.describe('Consulta sobre proyectos, participantes, facultades o estadísticas generales de los proyectos de investigación')
		.optional(),
	input: z.string().optional(),
	tipo: z
		.enum([
			'resumen',
			'participantes',
			'facultades',
			'facultades-proyectos',
			'carreras',
			'proyectos',
			'areas',
			'lineas',
			'instituciones',
			'busqueda',
			'temporal',
			'presupuesto'
		])
		.optional()
		.describe('Tipo específico de consulta'),
	limite: z.number().min(1).max(50).optional().default(10).describe('Límite de resultados')
});

export type EstadisticasSigpiArgs = z.infer<typeof estadisticasSigpiSchema>;

/**
 * Detecta el tipo de consulta basándose en palabras clave
 */
function detectarTipoConsulta(consulta: string): string {
	const consultaLower = consulta.toLowerCase();

	// Resumen general
	if (
		consultaLower.includes('resumen') ||
		consultaLower.includes('general') ||
		consultaLower.includes('visión general') ||
		consultaLower.includes('overview') ||
		consultaLower.includes('cuántos proyectos hay') ||
		consultaLower.includes('estadísticas generales')
	) {
		return 'resumen';
	}

	// Participantes / Investigadores
	if (
		consultaLower.includes('participante') ||
		consultaLower.includes('investigador') ||
		consultaLower.includes('director') ||
		consultaLower.includes('coordinador') ||
		consultaLower.includes('quién') ||
		consultaLower.includes('quien') ||
		consultaLower.includes('top investigadores') ||
		consultaLower.includes('ranking')
	) {
		return 'participantes';
	}

	// Facultades por proyectos vs participantes
	if (
		consultaLower.includes('facultad') ||
		consultaLower.includes('facultades')
	) {
		// Si menciona explícitamente proyectos, usar el tipo facultades-proyectos
		if (
			consultaLower.includes('proyecto') ||
			consultaLower.includes('activo') ||
			consultaLower.includes('más proyectos') ||
			consultaLower.includes('con proyectos')
		) {
			return 'facultades-proyectos';
		}
		// Por defecto, devolver por participantes
		return 'facultades';
	}
	
	// Decanos y subdecanos (siempre por participantes)
	if (consultaLower.includes('decano') || consultaLower.includes('subdecano')) {
		return 'facultades';
	}

	// Carreras
	if (consultaLower.includes('carrera') || consultaLower.includes('carreras')) {
		return 'carreras';
	}

	// Áreas de conocimiento
	if (
		consultaLower.includes('área') ||
		consultaLower.includes('areas') ||
		consultaLower.includes('conocimiento') ||
		consultaLower.includes('disciplina')
	) {
		return 'areas';
	}

	// Líneas de investigación
	if (
		consultaLower.includes('línea') ||
		consultaLower.includes('linea') ||
		consultaLower.includes('investigación')
	) {
		return 'lineas';
	}

	// Instituciones
	if (consultaLower.includes('institución') || consultaLower.includes('institucion')) {
		return 'instituciones';
	}

	// Proyectos
	if (
		consultaLower.includes('proyecto') ||
		consultaLower.includes('estado') ||
		consultaLower.includes('avance')
	) {
		return 'proyectos';
	}

	// Temporal
	if (
		consultaLower.includes('año') ||
		consultaLower.includes('anio') ||
		consultaLower.includes('mes') ||
		consultaLower.includes('temporal') ||
		consultaLower.includes('evolución') ||
		consultaLower.includes('historial')
	) {
		return 'temporal';
	}

	// Presupuesto
	if (
		consultaLower.includes('presupuesto') ||
		consultaLower.includes('financiamiento') ||
		consultaLower.includes('dinero') ||
		consultaLower.includes('costo')
	) {
		return 'presupuesto';
	}

	// Búsqueda específica
	return 'busqueda';
}

/**
 * Formatea el resumen ejecutivo
 */
function formatearResumenEjecutivo(resumen: any): string {
	return `📊 **Resumen Ejecutivo de SIGPI**

**Proyectos de Investigación:**
- Total de proyectos: ${resumen.total_proyectos}
- Proyectos finalizados: ${resumen.proyectos_finalizados}
- Proyectos en ejecución: ${resumen.proyectos_en_ejecucion}
- Proyectos en cierre: ${resumen.proyectos_en_cierre}
- Proyectos en ${resumen.anio_actual}: ${resumen.proyectos_anio_actual}

**Presupuesto:**
- Presupuesto total: $${Number(resumen.presupuesto_total).toLocaleString('es-EC', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}
- Presupuesto promedio: $${Number(resumen.presupuesto_promedio).toLocaleString('es-EC', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}
- Presupuesto máximo: $${Number(resumen.presupuesto_maximo).toLocaleString('es-EC', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}

**Indicadores:**
- Avance promedio global: ${Number(resumen.avance_promedio_global).toFixed(2)}%
- Duración promedio: ${Number(resumen.duracion_promedio_meses).toFixed(1)} meses
- Primer proyecto: ${resumen.fecha_primer_proyecto}
- Último proyecto: ${resumen.fecha_ultimo_proyecto}`;
}

/**
 * Formatea estadísticas de participantes
 */
function formatearEstadisticasParticipantes(stats: any): string {
	return `👥 **Estadísticas de Participantes**

**Total de participantes:** ${stats.total_participantes}

**Por acreditación:**
- Acreditados: ${stats.total_acreditados} (${(
		(stats.total_acreditados / stats.total_participantes) *
		100
	).toFixed(1)}%)
- No acreditados: ${stats.total_no_acreditados} (${(
		(stats.total_no_acreditados / stats.total_participantes) *
		100
	).toFixed(1)}%)
- No especificado: ${stats.total_acreditado_no_especifica}

**Por género:**
- Masculino: ${stats.total_masculino} (${(
		(stats.total_masculino / stats.total_participantes) *
		100
	).toFixed(1)}%)
- Femenino: ${stats.total_femenino} (${(
		(stats.total_femenino / stats.total_participantes) *
		100
	).toFixed(1)}%)
- Otro/No especificado: ${stats.total_otro_genero + stats.total_genero_no_especifica}`;
}

/**
 * Formatea top de participantes
 */
function formatearTopParticipantes(participantes: any[], limite: number): string {
	let resultado = `🏆 **Top ${Math.min(
		limite,
		participantes.length
	)} Investigadores por Número de Proyectos**\n\n`;

	participantes.forEach((p, index) => {
		resultado += `${index + 1}. **${p.participante_nombre}**\n`;
		resultado += `   - Total proyectos: ${p.total_proyectos}\n`;
		resultado += `   - Cargo principal: ${p.cargo_principal}\n`;
		resultado += `   - Como director: ${p.proyectos_como_director}\n`;
		resultado += `   - Como investigador: ${p.proyectos_como_investigador}\n`;
		resultado += `   - Facultad: ${p.facultad_nombre}\n`;
		resultado += `   - Carrera: ${p.carrera_nombre}\n`;
		if (p.acreditado) {
			resultado += `   - ✅ Investigador acreditado\n`;
		}
		resultado += `\n`;
	});

	return resultado;
}

/**
 * Formatea top de facultades por participantes
 */
function formatearTopFacultades(facultades: any[]): string {
	let resultado = `🏛️ **Top Facultades por Participantes**\n\n`;

	facultades.forEach((f, index) => {
		const totalParticipantes = Number(f.total_participantes);
		const masculino = Number(f.masculino);
		const femenino = Number(f.femenino);
		const pctMasculino =
			totalParticipantes > 0 ? ((masculino / totalParticipantes) * 100).toFixed(1) : 0;
		const pctFemenino =
			totalParticipantes > 0 ? ((femenino / totalParticipantes) * 100).toFixed(1) : 0;

		resultado += `${index + 1}. **${f.facultad_nombre}**\n`;
		resultado += `   - Total participantes: ${totalParticipantes}\n`;
		resultado += `   - Masculino: ${masculino} (${pctMasculino}%)\n`;
		resultado += `   - Femenino: ${femenino} (${pctFemenino}%)\n\n`;
	});

	return resultado;
}

/**
 * Formatea top de facultades por número de proyectos
 */
function formatearTopFacultadesPorProyectos(facultades: Array<{facultad: string, cantidad: number}>, limite: number): string {
	let resultado = `🏛️ **Top ${Math.min(limite, facultades.length)} Facultades por Número de Proyectos**\n\n`;

	facultades.forEach((f, index) => {
		resultado += `${index + 1}. **${f.facultad}**\n`;
		resultado += `   - Total proyectos: ${f.cantidad}\n\n`;
	});

	return resultado;
}

/**
 * Formatea top de carreras
 */
function formatearTopCarreras(carreras: any[]): string {
	let resultado = `🎓 **Top Carreras por Participantes**\n\n`;

	carreras.forEach((c, index) => {
		resultado += `${index + 1}. **${c.carrera_nombre}**\n`;
		resultado += `   - Facultad: ${c.facultad_nombre}\n`;
		resultado += `   - Total participantes: ${c.total_participantes}\n`;
		resultado += `   - Masculino: ${c.masculino} | Femenino: ${c.femenino}\n\n`;
	});

	return resultado;
}

/**
 * Formatea distribución de estados
 */
function formatearDistribucionEstados(estados: any[]): string {
	let resultado = `📈 **Distribución de Proyectos por Estado**\n\n`;

	estados.forEach((e) => {
		resultado += `• **${e.estado}**: ${e.cantidad} proyectos (${Number(e.porcentaje).toFixed(
			1
		)}%)\n`;
		resultado += `  Avance promedio: ${Number(e.avance_promedio).toFixed(2)}%\n\n`;
	});

	return resultado;
}

/**
 * Formatea top de áreas de conocimiento
 */
function formatearTopAreas(areas: any[]): string {
	let resultado = `🔬 **Áreas de Conocimiento Principales**\n\n`;

	areas.forEach((a, index) => {
		resultado += `${index + 1}. **${a.area_conocimiento}**\n`;
		resultado += `   - Proyectos: ${a.cantidad} (${Number(a.porcentaje).toFixed(1)}%)\n\n`;
	});

	return resultado;
}

/**
 * Formatea top de líneas de investigación
 */
function formatearTopLineas(lineas: any[]): string {
	let resultado = `🔍 **Líneas de Investigación Principales**\n\n`;

	lineas.forEach((l, index) => {
		resultado += `${index + 1}. **${l.linea}**\n`;
		resultado += `   - Proyectos: ${l.cantidad} (${Number(l.porcentaje).toFixed(1)}%)\n\n`;
	});

	return resultado;
}

/**
 * Formatea estadísticas de presupuesto
 */
function formatearEstadisticasPresupuesto(presupuesto: any): string {
	return `💰 **Estadísticas de Presupuesto**

**Valores generales:**
- Presupuesto total: $${Number(presupuesto.presupuesto_total).toLocaleString('es-EC', {
		minimumFractionDigits: 2
	})}
- Presupuesto promedio: $${Number(presupuesto.presupuesto_promedio).toLocaleString('es-EC', {
		minimumFractionDigits: 2
	})}
- Presupuesto mínimo: $${Number(presupuesto.presupuesto_minimo).toLocaleString('es-EC', {
		minimumFractionDigits: 2
	})}
- Presupuesto máximo: $${Number(presupuesto.presupuesto_maximo).toLocaleString('es-EC', {
		minimumFractionDigits: 2
	})}

**Distribución por rangos:**
- Sin presupuesto: ${presupuesto.proyectos_sin_presupuesto}
- $0 - $1,000: ${presupuesto.proyectos_0_1k}
- $1,000 - $5,000: ${presupuesto.proyectos_1k_5k}
- $5,000 - $10,000: ${presupuesto.proyectos_5k_10k}
- $10,000 - $50,000: ${presupuesto.proyectos_10k_50k}
- $50,000 - $100,000: ${presupuesto.proyectos_50k_100k}
- Más de $100,000: ${presupuesto.proyectos_mas_100k}`;
}

/**
 * Manejador principal de la herramienta de estadísticas
 */
async function manejarEstadisticasSigpi(args: any): Promise<McpResponse> {
	try {
		// Normalizar args: aceptar tanto 'consulta' como 'input'
		const consulta = args.consulta || args.input || '';
		const limite = args.limite || 10;

		if (!consulta || consulta.trim() === '') {
			return {
				content: [
					{
						type: 'text',
						text: '❌ Por favor proporciona una consulta. Ejemplos: "resumen general", "top investigadores", "facultades con más proyectos"'
					}
				],
				isError: true
			};
		}

		const consultaLower = consulta.toLowerCase().trim();

		// Detectar si es un saludo simple o mensaje irrelevante
		const saludosSimples = [
			'hola',
			'hi',
			'hello',
			'buenas',
			'saludos',
			'hey',
			'que tal',
			'buenos dias',
			'buenas tardes',
			'buenas noches',
			'como estas'
		];

		if (
			saludosSimples.some((saludo) => consultaLower === saludo || consultaLower === saludo + '!')
		) {
			return {
				content: [
					{
						type: 'text',
						text:
							'👋 ¡Hola! Soy el módulo de estadísticas de SIGPI. Para obtener información, puedes preguntarme sobre:\n\n' +
							'• Resumen general de proyectos\n' +
							'• Top de investigadores\n' +
							'• Estadísticas por facultad o carrera\n' +
							'• Áreas de conocimiento\n' +
							'• Presupuestos\n\n' +
							'💡 *Ejemplo: "¿Cuántos proyectos hay en total?"*'
					}
				],
				isError: false,
				metadata: {
					tipo: 'saludo',
					consulta: consulta,
					timestamp: Date.now()
				}
			};
		}

		// Detectar tipo de consulta si no se especificó
		const tipo = args.tipo || detectarTipoConsulta(consulta);

		// Construir respuesta según tipo de consulta
		let respuesta = '';

		switch (tipo) {
			case 'resumen': {
				const resumen = await estadisticasRepository.obtenerResumenEjecutivo();
				if (resumen) {
					respuesta = formatearResumenEjecutivo(resumen);
				} else {
					respuesta = '❌ No se pudo obtener el resumen ejecutivo.';
				}
				break;
			}

			case 'participantes': {
				const topParticipantes = await estadisticasRepository.obtenerTopParticipantes(limite);
				if (topParticipantes.length > 0) {
					respuesta += formatearTopParticipantes(topParticipantes, limite);
				}

				if (!respuesta) {
					respuesta = '❌ No se encontraron estadísticas de participantes.';
				}
				break;
			}

			case 'facultades': {
				const facultades = await estadisticasRepository.obtenerTopFacultades(limite);
				if (facultades.length > 0) {
					respuesta = formatearTopFacultades(facultades);
				} else {
					respuesta = '❌ No se encontraron datos de facultades.';
				}
				break;
			}

			case 'facultades-proyectos': {
				const facultades = await estadisticasRepository.obtenerTopFacultadesPorProyectos(limite);
				if (facultades.length > 0) {
					respuesta = formatearTopFacultadesPorProyectos(facultades, limite);
				} else {
					respuesta = '❌ No se encontraron datos de facultades por proyectos.';
				}
				break;
			}

			case 'carreras': {
				const carreras = await estadisticasRepository.obtenerTopCarreras(limite);
				if (carreras.length > 0) {
					respuesta = formatearTopCarreras(carreras);
				} else {
					respuesta = '❌ No se encontraron datos de carreras.';
				}
				break;
			}

			case 'proyectos': {
				const resumen = await estadisticasRepository.obtenerResumenEjecutivo();
				const estados = await estadisticasRepository.obtenerDistribucionEstados();

				if (resumen) {
					respuesta += `📊 **Estado de Proyectos de Investigación**\n\n`;
					respuesta += `- Total: ${resumen.total_proyectos}\n`;
					respuesta += `- Finalizados: ${resumen.proyectos_finalizados}\n`;
					respuesta += `- En ejecución: ${resumen.proyectos_en_ejecucion}\n`;
					respuesta += `- En cierre: ${resumen.proyectos_en_cierre}\n\n`;
				}

				if (estados.length > 0) {
					respuesta += formatearDistribucionEstados(estados);
				}

				if (!respuesta) {
					respuesta = '❌ No se encontraron datos de proyectos.';
				}
				break;
			}

			case 'areas': {
				const areas = await estadisticasRepository.obtenerTopAreasConocimiento(limite);
				if (areas.length > 0) {
					respuesta = formatearTopAreas(areas);
				} else {
					respuesta = '❌ No se encontraron áreas de conocimiento.';
				}
				break;
			}

			case 'lineas': {
				const lineas = await estadisticasRepository.obtenerTopLineasInvestigacion(limite);
				if (lineas.length > 0) {
					respuesta = formatearTopLineas(lineas);
				} else {
					respuesta = '❌ No se encontraron líneas de investigación.';
				}
				break;
			}

			case 'instituciones': {
				const instituciones = await estadisticasRepository.obtenerTopInstituciones(limite);
				if (instituciones.length > 0) {
					respuesta = `🏢 **Instituciones Colaboradoras**\n\n`;
					instituciones.forEach((i, index) => {
						respuesta += `${index + 1}. **${i.institucion}**\n`;
						respuesta += `   - Proyectos: ${i.cantidad} (${Number(i.porcentaje).toFixed(1)}%)\n\n`;
					});
				} else {
					respuesta = '❌ No se encontraron datos de instituciones.';
				}
				break;
			}

			case 'presupuesto': {
				const presupuesto = await estadisticasRepository.obtenerEstadisticasPresupuesto();
				if (presupuesto) {
					respuesta = formatearEstadisticasPresupuesto(presupuesto);
				} else {
					respuesta = '❌ No se encontraron estadísticas de presupuesto.';
				}
				break;
			}

			case 'temporal': {
				const temporal = await estadisticasRepository.obtenerDistribucionTemporal();
				if (temporal.length > 0) {
					respuesta = `📅 **Evolución Temporal de Proyectos**\n\n`;

					// Agrupar por año
					const porAnio: Record<number, any[]> = {};
					temporal.forEach((t) => {
						if (!porAnio[t.anio]) {
							porAnio[t.anio] = [];
						}
						porAnio[t.anio].push(t);
					});

					Object.keys(porAnio)
						.sort()
						.reverse()
						.slice(0, 5)
						.forEach((anio) => {
							const datos = porAnio[Number(anio)];
							const totalIniciados = datos.reduce(
								(sum, d) => sum + Number(d.proyectos_iniciados),
								0
							);
							const totalFinalizados = datos.reduce(
								(sum, d) => sum + Number(d.proyectos_finalizados),
								0
							);
							const avancePromedio =
								datos.reduce((sum, d) => sum + Number(d.avance_promedio), 0) / datos.length;

							respuesta += `**Año ${anio}:**\n`;
							respuesta += `- Proyectos iniciados: ${totalIniciados}\n`;
							respuesta += `- Proyectos finalizados: ${totalFinalizados}\n`;
							respuesta += `- Avance promedio: ${avancePromedio.toFixed(2)}%\n\n`;
						});
				} else {
					respuesta = '❌ No se encontraron datos temporales.';
				}
				break;
			}

			case 'busqueda': {
				// Intentar búsqueda específica
				const consultaLower = consulta.toLowerCase();

				// Buscar por facultad
				if (consultaLower.includes('facultad')) {
					const palabras = consulta.split(' ');
					const posibleFacultad = palabras.slice(palabras.length - 2).join(' ');
					const resultado = await estadisticasRepository.buscarPorFacultad(posibleFacultad);

					if (resultado.facultades.length > 0) {
						respuesta = formatearTopFacultades(resultado.facultades);
						if (resultado.carreras.length > 0) {
							respuesta += '\n\n' + formatearTopCarreras(resultado.carreras);
						}
					}
				}
				// Buscar participante
				else if (consultaLower.includes('investigador') || consultaLower.includes('participante')) {
					const palabras = consulta.split(' ');
					const posibleNombre = palabras.slice(palabras.length - 2).join(' ');
					const participantes = await estadisticasRepository.buscarParticipante(posibleNombre);

					if (participantes.length > 0) {
						respuesta = formatearTopParticipantes(participantes, participantes.length);
					}
				}

				if (!respuesta) {
					// Si no se encontró nada específico, dar resumen general
					const resumen = await estadisticasRepository.obtenerResumenEjecutivo();
					if (resumen) {
						respuesta = formatearResumenEjecutivo(resumen);
						respuesta +=
							'\n\n💡 *Tip: Puedes preguntar sobre participantes, facultades, carreras, áreas de conocimiento, líneas de investigación, presupuestos, etc.*';
					} else {
						respuesta =
							'❌ No se pudo procesar tu consulta. Intenta ser más específico o pregunta sobre:\n- Resumen general\n- Participantes/Investigadores\n- Facultades\n- Carreras\n- Proyectos\n- Áreas de conocimiento\n- Líneas de investigación\n- Presupuestos';
					}
				}
				break;
			}

			default:
				respuesta = '❌ Tipo de consulta no reconocido. Por favor, intenta reformular tu pregunta.';
		}

		return {
			content: [
				{
					type: 'text',
					text: respuesta
				}
			],
			isError: false,
			metadata: {
				tipo: tipo,
				consulta: consulta,
				timestamp: Date.now()
			}
		};
	} catch (error: any) {
		console.error('Error en estadisticasSigpiTool:', error);
		return {
			content: [
				{
					type: 'text',
					text: `❌ Error al procesar la consulta: ${error.message}`
				}
			],
			isError: true
		};
	}
}

/**
 * Definición de la herramienta MCP
 */
export const estadisticasSigpiTool: McpTool<EstadisticasSigpiArgs> = {
	name: 'estadisticas-sigpi',
	title: 'Estadísticas de SIGPI',
	description:
		'Proporciona información estadística sobre proyectos de investigación, participantes y facultades',
	category: 'information',
	schema: estadisticasSigpiSchema,
	handler: manejarEstadisticasSigpi,
	metadata: {
		version: '1.0.0',
		author: 'SIGPI Team',
		supportedQueries: [
			'Resumen ejecutivo',
			'Estadísticas de participantes',
			'Top investigadores',
			'Facultades',
			'Carreras',
			'Proyectos por estado',
			'Áreas de conocimiento',
			'Líneas de investigación',
			'Instituciones colaboradoras',
			'Presupuestos',
			'Evolución temporal'
		],
		dataSources: [
			'mv_resumen_ejecutivo',
			'top_participantes_proyectos_mv',
			'participantes_stats_mv',
			'top_facultades_mv',
			'top_carreras_mv',
			'mv_distribucion_estado',
			'mv_top_areas_conocimiento',
			'mv_top_lineas_investigacion',
			'mv_top_instituciones',
			'mv_estadisticas_presupuesto',
			'mv_distribucion_temporal'
		],
		helpInfo: {
			title: '📊 Estadísticas de SIGPI',
			description:
				'Esta herramienta te permite consultar información detallada sobre los proyectos de investigación de la Universidad Central del Ecuador (UCE) gestionados en la plataforma SIGPI.',
			howToUse: [
				'1️⃣ Pregunta sobre cualquier aspecto de los proyectos de investigación de la UCE.',
				'2️⃣ La herramienta detectará automáticamente el tipo de información que necesitas.',
				'3️⃣ Recibirás estadísticas actualizadas y detalladas.'
			],
			suggestedQuestions: [
				'¿Cuántos proyectos de investigación hay en total?',
			'Muéstrame el top de investigadores',
			'¿Cuáles son las 5 facultades con más proyectos activos?',
			'¿Cuáles son las facultades con más participantes?',
			'¿Qué instituciones colaboradoras tienen más proyectos?',
				'¿Qué carreras tienen más proyectos?',
				'Estadísticas de proyectos por estado',
				'¿Cuáles son las principales áreas de conocimiento?',
				'Líneas de investigación más populares',
				'Estadísticas de presupuesto',
				'Evolución temporal de proyectos',
				'¿Cuántos investigadores acreditados hay?'
			],
			tips: [
				'🔍 Puedes preguntar de forma natural, la herramienta entenderá tu consulta',
				'📈 Las estadísticas se actualizan periódicamente desde las vistas materializadas',
				'🏛️ Puedes buscar información específica de facultades, carreras o investigadores',
				'💰 Consulta información sobre presupuestos y financiamiento de proyectos'
			]
		}
	}
};
