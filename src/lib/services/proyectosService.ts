import { supabase } from '$lib/supabase';

export type Proyecto = {
	id: number;
	codigo: string;
	titulo: string;
	tipo_proyecto: string;
	objetivo: string;
	estado: string;
	facultad_o_entidad_o_area_responsable: string;
	fecha_inicio: string;
	fecha_fin_planeado: string;
	coordinador_director: string;
	correo_electronico_coordinador: string;
	campo_amplio: string;
	campo_especifico: string;
	campo_detallado: string;
	alcance_territorial: string;
	investigadores_acreditados_senescyt: string;
	fuente_financiamiento: string;
};

export async function obtenerProyectos(): Promise<Proyecto[]> {
	const { data, error } = await supabase.from('proyectos_siies_uce').select('*');

	if (error) {
		console.error('Error al obtener proyectos:', error);
		return [];
	}

	return data || [];
}

export async function obtenerProyectosPorEstado(): Promise<{ estado: string; cantidad: number }[]> {
	const proyectos = await obtenerProyectos();

	if (proyectos.length === 0) return [];

	// Agrupar por estado
	const estadoCount: Record<string, number> = {};

	proyectos.forEach((proyecto) => {
		const estado = proyecto.estado || 'No especificado';
		estadoCount[estado] = (estadoCount[estado] || 0) + 1;
	});

	// Convertir a array para mostrar en gráfica
	return Object.entries(estadoCount).map(([estado, cantidad]) => ({
		estado,
		cantidad
	}));
}

export async function obtenerProyectosPorFacultad(): Promise<
	{ facultad: string; cantidad: number }[]
> {
	const proyectos = await obtenerProyectos();

	if (proyectos.length === 0) return [];

	// Agrupar por facultad
	const facultadCount: Record<string, number> = {};

	proyectos.forEach((proyecto) => {
		const facultad = proyecto.facultad_o_entidad_o_area_responsable || 'No especificado';
		facultadCount[facultad] = (facultadCount[facultad] || 0) + 1;
	});

	// Convertir a array para mostrar en gráfica
	return (
		Object.entries(facultadCount)
			.map(([facultad, cantidad]) => ({
				facultad,
				cantidad
			}))
			// Ordenar de mayor a menor
			.sort((a, b) => b.cantidad - a.cantidad)
	);
}

export async function obtenerProyectosPorCampoAmplio(): Promise<
	{ campo: string; cantidad: number }[]
> {
	const proyectos = await obtenerProyectos();

	if (proyectos.length === 0) return [];

	// Agrupar por campo amplio
	const campoCount: Record<string, number> = {};

	proyectos.forEach((proyecto) => {
		const campo = proyecto.campo_amplio || 'No especificado';
		campoCount[campo] = (campoCount[campo] || 0) + 1;
	});

	// Convertir a array para mostrar en gráfica
	return (
		Object.entries(campoCount)
			.map(([campo, cantidad]) => ({
				campo,
				cantidad
			}))
			// Ordenar de mayor a menor
			.sort((a, b) => b.cantidad - a.cantidad)
	);
}

export async function obtenerProyectosPorAlcance(): Promise<
	{ alcance: string; cantidad: number }[]
> {
	const proyectos = await obtenerProyectos();

	if (proyectos.length === 0) return [];

	// Agrupar por alcance territorial
	const alcanceCount: Record<string, number> = {};

	proyectos.forEach((proyecto) => {
		const alcance = proyecto.alcance_territorial || 'No especificado';
		alcanceCount[alcance] = (alcanceCount[alcance] || 0) + 1;
	});

	// Convertir a array para mostrar en gráfica
	return Object.entries(alcanceCount).map(([alcance, cantidad]) => ({
		alcance,
		cantidad
	}));
}

export async function obtenerProyectosPorFinanciamiento(): Promise<
	{ fuente: string; cantidad: number }[]
> {
	const proyectos = await obtenerProyectos();

	if (proyectos.length === 0) return [];

	// Agrupar por fuente de financiamiento
	const fuenteCount: Record<string, number> = {};

	proyectos.forEach((proyecto) => {
		const fuente = proyecto.fuente_financiamiento || 'No especificado';
		fuenteCount[fuente] = (fuenteCount[fuente] || 0) + 1;
	});

	// Convertir a array para mostrar en gráfica
	return Object.entries(fuenteCount).map(([fuente, cantidad]) => ({
		fuente,
		cantidad
	}));
}

// Función para obtener estadísticas generales de los proyectos
export async function obtenerProyectosPorTipo(): Promise<{ tipo: string; cantidad: number }[]> {
	const proyectos = await obtenerProyectos();

	if (proyectos.length === 0) return [];

	// Agrupar por tipo de proyecto
	const tipoCount: Record<string, number> = {};

	proyectos.forEach((proyecto) => {
		const tipo = proyecto.tipo_proyecto || 'No especificado';
		tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
	});

	// Convertir a array para mostrar en gráfica
	return Object.entries(tipoCount)
		.map(([tipo, cantidad]) => ({
			tipo,
			cantidad
		}))
		.sort((a, b) => b.cantidad - a.cantidad);
}

export async function obtenerEstadisticasGenerales(): Promise<{
	totalProyectos: number;
	proyectosActivos: number;
	proyectosCerrados: number;
	investigadoresAcreditados: number;
	proyectosPorTipoPrincipal: { tipo: string; cantidad: number };
}> {
	const proyectos = await obtenerProyectos();
	const tiposProyectos = await obtenerProyectosPorTipo();

	if (proyectos.length === 0) {
		return {
			totalProyectos: 0,
			proyectosActivos: 0,
			proyectosCerrados: 0,
			investigadoresAcreditados: 0,
			proyectosPorTipoPrincipal: { tipo: 'No hay datos', cantidad: 0 }
		};
	}

	// Calcular estadísticas
	const totalProyectos = proyectos.length;

	const proyectosActivos = proyectos.filter(
		(p) => p.estado === 'En ejecución' || p.estado === 'En cierre'
	).length;

	const proyectosCerrados = proyectos.filter(
		(p) => p.estado === 'Cerrado' || p.estado === 'Finalizado'
	).length;

	const investigadoresAcreditados = proyectos.filter(
		(p) => p.investigadores_acreditados_senescyt === 'SI'
	).length;

	// Obtener el tipo de proyecto más común
	const proyectosPorTipoPrincipal =
		tiposProyectos.length > 0 ? tiposProyectos[0] : { tipo: 'No hay datos', cantidad: 0 };

	return {
		totalProyectos,
		proyectosActivos,
		proyectosCerrados,
		investigadoresAcreditados,
		proyectosPorTipoPrincipal
	};
}

export async function obtenerEstadisticasPorFacultad(nombreFacultad: string) {
	const proyectos = await obtenerProyectos();

	const proyectosFacultad = proyectos.filter(
		(p) => p.facultad_o_entidad_o_area_responsable === nombreFacultad
	);

	const totalProyectos = proyectos.length;
	const cantidadFacultad = proyectosFacultad.length;

	const estados = {
		ejecucion: proyectosFacultad.filter((p) => p.estado === 'En ejecución').length,
		cierre: proyectosFacultad.filter((p) => p.estado === 'En cierre').length,
		cerrados: proyectosFacultad.filter((p) => p.estado === 'Cerrado' || p.estado === 'Finalizado')
			.length
	};

	return {
		totalProyectos,
		cantidadFacultad,
		estados
	};
}

/**
 * Obtiene el ranking de investigadores por número de proyectos dirigidos
 */
export async function obtenerRankingInvestigadores(limite: number = 10): Promise<
	Array<{
		investigador: string;
		total_proyectos: number;
		proyectos_activos: number;
		proyectos_completados: number;
		detalles_proyectos: Array<{
			codigo: string;
			titulo: string;
			estado: string;
			facultad: string;
		}>;
	}>
> {
	try {
		const { data, error } = await supabase
			.from('proyectos_siies_uce')
			.select('coordinador_director, codigo, titulo, estado, facultad_o_entidad_o_area_responsable')
			.not('coordinador_director', 'is', null)
			.neq('coordinador_director', '');

		if (error) throw error;

		// Agrupar proyectos por coordinador/director
		const agrupacionInvestigadores = new Map<
			string,
			{
				total: number;
				activos: number;
				completados: number;
				proyectos: Array<{
					codigo: string;
					titulo: string;
					estado: string;
					facultad: string;
				}>;
			}
		>();

		data?.forEach((proyecto) => {
			const investigador = proyecto.coordinador_director?.trim();
			if (investigador) {
				if (!agrupacionInvestigadores.has(investigador)) {
					agrupacionInvestigadores.set(investigador, {
						total: 0,
						activos: 0,
						completados: 0,
						proyectos: []
					});
				}

				const stats = agrupacionInvestigadores.get(investigador)!;
				stats.total++;

				const estado = proyecto.estado?.toLowerCase() || '';
				if (estado.includes('ejecución') || estado.includes('activo')) {
					stats.activos++;
				} else if (
					estado.includes('finalizado') ||
					estado.includes('completado') ||
					estado.includes('cierre')
				) {
					stats.completados++;
				}

				stats.proyectos.push({
					codigo: proyecto.codigo || '',
					titulo: proyecto.titulo || '',
					estado: proyecto.estado || '',
					facultad: proyecto.facultad_o_entidad_o_area_responsable || ''
				});
			}
		});

		// Convertir a array y ordenar por total de proyectos
		const ranking = Array.from(agrupacionInvestigadores.entries())
			.map(([investigador, stats]) => ({
				investigador,
				total_proyectos: stats.total,
				proyectos_activos: stats.activos,
				proyectos_completados: stats.completados,
				detalles_proyectos: stats.proyectos
			}))
			.sort((a, b) => b.total_proyectos - a.total_proyectos)
			.slice(0, limite);

		return ranking;
	} catch (error) {
		console.error('Error al obtener ranking de investigadores:', error);
		throw new Error('Error al obtener el ranking de investigadores');
	}
}

/**
 * Obtiene estadísticas detalladas de un investigador específico
 */
export async function obtenerEstadisticasInvestigador(nombreInvestigador: string): Promise<{
	investigador: string;
	total_proyectos: number;
	proyectos_por_estado: Record<string, number>;
	proyectos_por_facultad: Record<string, number>;
	proyectos_por_año: Record<string, number>;
	detalles_proyectos: Array<{
		codigo: string;
		titulo: string;
		estado: string;
		facultad: string;
		fecha_inicio: string;
		fecha_fin: string;
	}>;
} | null> {
	try {
		const { data, error } = await supabase
			.from('proyectos_siies_uce')
			.select('*')
			.ilike('coordinador_director', `%${nombreInvestigador}%`);

		if (error) throw error;

		if (!data || data.length === 0) {
			return null;
		}

		const proyectosPorEstado: Record<string, number> = {};
		const proyectosPorFacultad: Record<string, number> = {};
		const proyectosPorAño: Record<string, number> = {};
		const detallesProyectos: Array<{
			codigo: string;
			titulo: string;
			estado: string;
			facultad: string;
			fecha_inicio: string;
			fecha_fin: string;
		}> = [];

		data.forEach((proyecto) => {
			// Estadísticas por estado
			const estado = proyecto.estado || 'Sin estado';
			proyectosPorEstado[estado] = (proyectosPorEstado[estado] || 0) + 1;

			// Estadísticas por facultad
			const facultad = proyecto.facultad_o_entidad_o_area_responsable || 'Sin facultad';
			proyectosPorFacultad[facultad] = (proyectosPorFacultad[facultad] || 0) + 1;

			// Estadísticas por año
			const fechaInicio = proyecto.fecha_inicio;
			if (fechaInicio) {
				const año = fechaInicio.split('/')[2] || 'Sin año';
				proyectosPorAño[año] = (proyectosPorAño[año] || 0) + 1;
			}

			// Detalles del proyecto
			detallesProyectos.push({
				codigo: proyecto.codigo || '',
				titulo: proyecto.titulo || '',
				estado: proyecto.estado || '',
				facultad: proyecto.facultad_o_entidad_o_area_responsable || '',
				fecha_inicio: proyecto.fecha_inicio || '',
				fecha_fin: proyecto.fecha_fin_planeado || ''
			});
		});

		return {
			investigador: nombreInvestigador,
			total_proyectos: data.length,
			proyectos_por_estado: proyectosPorEstado,
			proyectos_por_facultad: proyectosPorFacultad,
			proyectos_por_año: proyectosPorAño,
			detalles_proyectos: detallesProyectos
		};
	} catch (error) {
		console.error('Error al obtener estadísticas de investigador:', error);
		throw new Error('Error al obtener las estadísticas del investigador');
	}
}

/**
 * Busca investigadores por término de búsqueda
 */
export async function buscarInvestigadores(
	termino: string
): Promise<Array<{ investigador: string; total_proyectos: number }>> {
	try {
		const ranking = await obtenerRankingInvestigadores(50); // Obtener más resultados para filtrar
		const terminoNormalizado = termino.toLowerCase().trim();

		return ranking
			.filter((inv) => inv.investigador.toLowerCase().includes(terminoNormalizado))
			.map((inv) => ({
				investigador: inv.investigador,
				total_proyectos: inv.total_proyectos
			}));
	} catch (error) {
		console.error('Error al buscar investigadores:', error);
		throw new Error('Error al buscar investigadores');
	}
}
