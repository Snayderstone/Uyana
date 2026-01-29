/**
 * Repositorio para consultar vistas materializadas de estadísticas
 * Datos públicos para el chat asistente de sigpi
 */

import { supabase } from './supabase.client';

/**
 * Interfaz para resumen ejecutivo
 */
export interface ResumenEjecutivo {
	total_proyectos: number;
	proyectos_finalizados: number;
	proyectos_en_ejecucion: number;
	proyectos_en_cierre: number;
	presupuesto_total: number;
	presupuesto_promedio: number;
	presupuesto_maximo: number;
	avance_promedio_global: number;
	fecha_primer_proyecto: string;
	fecha_ultimo_proyecto: string;
	duracion_promedio_meses: number;
	anio_actual: number;
	proyectos_anio_actual: number;
}

/**
 * Interfaz para distribución de estados
 */
export interface DistribucionEstado {
	estado_id: number;
	estado: string;
	cantidad: number;
	porcentaje: number;
	avance_promedio: number;
}

/**
 * Interfaz para top participantes
 */
export interface TopParticipante {
	participante_id: number;
	participante_nombre: string;
	email: string;
	url_foto: string;
	redes_sociales: string;
	genero: string;
	acreditado: boolean;
	carrera_nombre: string;
	facultad_nombre: string;
	total_proyectos: number;
	cargo_principal: string;
	proyectos_como_director: number;
	proyectos_como_investigador: number;
}

/**
 * Interfaz para estadísticas de participantes
 */
export interface ParticipantesStats {
	total_participantes: number;
	total_acreditados: number;
	total_no_acreditados: number;
	total_acreditado_no_especifica: number;
	total_masculino: number;
	total_femenino: number;
	total_genero_no_especifica: number;
	total_otro_genero: number;
}

/**
 * Interfaz para top facultades
 */
export interface TopFacultad {
	facultad_id: number;
	facultad_nombre: string;
	total_participantes: number;
	masculino: number;
	femenino: number;
}

/**
 * Interfaz para top carreras
 */
export interface TopCarrera {
	carrera_id: number;
	carrera_nombre: string;
	facultad_nombre: string;
	total_participantes: number;
	masculino: number;
	femenino: number;
}

/**
 * Interfaz para top áreas de conocimiento
 */
export interface TopAreaConocimiento {
	area_conocimiento: string;
	cantidad: number;
	porcentaje: number;
}

/**
 * Interfaz para top líneas de investigación
 */
export interface TopLineaInvestigacion {
	linea: string;
	cantidad: number;
	porcentaje: number;
}

/**
 * Interfaz para top instituciones
 */
export interface TopInstitucion {
	institucion: string;
	cantidad: number;
	porcentaje: number;
}

/**
 * Interfaz para top tipos de proyecto
 */
export interface TopTipoProyecto {
	tipo_proyecto: string;
	cantidad: number;
	porcentaje: number;
}

/**
 * Interfaz para distribución temporal
 */
export interface DistribucionTemporal {
	anio: number;
	mes: number;
	proyectos_iniciados: number;
	proyectos_finalizados: number;
	avance_promedio: number;
	presupuesto_total: number;
}

/**
 * Interfaz para estadísticas de avance
 */
export interface EstadisticasAvance {
	total_proyectos: number;
	avance_promedio: number;
	avance_desviacion: number;
	avance_minimo: number;
	avance_maximo: number;
	avance_percentil_25: number;
	avance_mediana: number;
	avance_percentil_75: number;
	proyectos_0_pct: number;
	proyectos_1_25_pct: number;
	proyectos_26_50_pct: number;
	proyectos_51_75_pct: number;
	proyectos_76_99_pct: number;
	proyectos_100_pct: number;
}

/**
 * Interfaz para estadísticas de presupuesto
 */
export interface EstadisticasPresupuesto {
	total_proyectos: number;
	presupuesto_promedio: number;
	presupuesto_desviacion: number;
	presupuesto_minimo: number;
	presupuesto_maximo: number;
	presupuesto_total: number;
	presupuesto_percentil_25: number;
	presupuesto_mediana: number;
	presupuesto_percentil_75: number;
	proyectos_sin_presupuesto: number;
	proyectos_0_1k: number;
	proyectos_1k_5k: number;
	proyectos_5k_10k: number;
	proyectos_10k_50k: number;
	proyectos_50k_100k: number;
	proyectos_mas_100k: number;
}

/**
 * Clase repositorio para estadísticas
 */
export class EstadisticasRepository {
	/**
	 * Obtiene el resumen ejecutivo general
	 */
	async obtenerResumenEjecutivo(): Promise<ResumenEjecutivo | null> {
		try {
			const { data, error } = await supabase.from('mv_resumen_ejecutivo').select('*').single();

			if (error) {
				console.error('Error al obtener resumen ejecutivo:', error);
				return null;
			}

			return data;
		} catch (error) {
			console.error('Error al obtener resumen ejecutivo:', error);
			return null;
		}
	}

	/**
	 * Obtiene la distribución de estados de proyectos
	 */
	async obtenerDistribucionEstados(): Promise<DistribucionEstado[]> {
		try {
			const { data, error } = await supabase
				.from('mv_distribucion_estado')
				.select('*')
				.order('cantidad', { ascending: false });

			if (error) {
				console.error('Error al obtener distribución de estados:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener distribución de estados:', error);
			return [];
		}
	}

	/**
	 * Obtiene el top de participantes con más proyectos
	 */
	async obtenerTopParticipantes(limite: number = 10): Promise<TopParticipante[]> {
		try {
			const { data, error } = await supabase
				.from('top_participantes_proyectos_mv')
				.select('*')
				.order('total_proyectos', { ascending: false })
				.limit(limite);

			if (error) {
				console.error('Error al obtener top participantes:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener top participantes:', error);
			return [];
		}
	}

	/**
	 * Obtiene estadísticas generales de participantes
	 */
	async obtenerEstadisticasParticipantes(): Promise<ParticipantesStats | null> {
		try {
			const { data, error } = await supabase.from('participantes_stats_mv').select('*').single();

			if (error) {
				console.error('Error al obtener estadísticas de participantes:', error);
				return null;
			}

			return data;
		} catch (error) {
			console.error('Error al obtener estadísticas de participantes:', error);
			return null;
		}
	}

	/**
	 * Obtiene el top de facultades con más participantes
	 */
	async obtenerTopFacultades(limite: number = 10): Promise<TopFacultad[]> {
		try {
			const { data, error } = await supabase
				.from('top_facultades_mv')
				.select('*')
				.order('total_participantes', { ascending: false })
				.limit(limite);

			if (error) {
				console.error('Error al obtener top facultades:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener top facultades:', error);
			return [];
		}
	}

	/**
	 * Obtiene el top de facultades con más proyectos activos
	 */
	async obtenerTopFacultadesPorProyectos(limite: number = 10): Promise<Array<{facultad: string, cantidad: number}>> {
		try {
			// Importar dinámicamente el servicio para evitar dependencias circulares
			const { obtenerProyectosPorFacultad } = await import('$lib/services/proyectosService');
			const facultades = await obtenerProyectosPorFacultad();
			
			// Ordenar por cantidad descendente y limitar
			return facultades
				.sort((a, b) => b.cantidad - a.cantidad)
				.slice(0, limite);
		} catch (error) {
			console.error('Error al obtener top facultades por proyectos:', error);
			return [];
		}
	}

	/**
	 * Obtiene el top de carreras con más participantes
	 */
	async obtenerTopCarreras(limite: number = 10): Promise<TopCarrera[]> {
		try {
			const { data, error } = await supabase
				.from('top_carreras_mv')
				.select('*')
				.order('total_participantes', { ascending: false })
				.limit(limite);

			if (error) {
				console.error('Error al obtener top carreras:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener top carreras:', error);
			return [];
		}
	}

	/**
	 * Obtiene el top de áreas de conocimiento
	 */
	async obtenerTopAreasConocimiento(limite: number = 10): Promise<TopAreaConocimiento[]> {
		try {
			const { data, error } = await supabase
				.from('mv_top_areas_conocimiento')
				.select('*')
				.limit(limite);

			if (error) {
				console.error('Error al obtener top áreas de conocimiento:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener top áreas de conocimiento:', error);
			return [];
		}
	}

	/**
	 * Obtiene el top de líneas de investigación
	 */
	async obtenerTopLineasInvestigacion(limite: number = 10): Promise<TopLineaInvestigacion[]> {
		try {
			const { data, error } = await supabase
				.from('mv_top_lineas_investigacion')
				.select('*')
				.limit(limite);

			if (error) {
				console.error('Error al obtener top líneas de investigación:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener top líneas de investigación:', error);
			return [];
		}
	}

	/**
	 * Obtiene el top de instituciones
	 */
	async obtenerTopInstituciones(limite: number = 10): Promise<TopInstitucion[]> {
		try {
			const { data, error } = await supabase
				.from('mv_top_instituciones')
				.select('*')
				.order('cantidad', { ascending: false })
				.limit(limite);

			if (error) {
				console.error('Error al obtener top instituciones:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener top instituciones:', error);
			return [];
		}
	}

	/**
	 * Obtiene el top de tipos de proyecto
	 */
	async obtenerTopTiposProyecto(limite: number = 10): Promise<TopTipoProyecto[]> {
		try {
			const { data, error } = await supabase
				.from('mv_top_tipos_proyecto')
				.select('*')
				.limit(limite);

			if (error) {
				console.error('Error al obtener top tipos de proyecto:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener top tipos de proyecto:', error);
			return [];
		}
	}

	/**
	 * Obtiene la distribución temporal de proyectos
	 */
	async obtenerDistribucionTemporal(): Promise<DistribucionTemporal[]> {
		try {
			const { data, error } = await supabase
				.from('mv_distribucion_temporal')
				.select('*')
				.order('anio', { ascending: true })
				.order('mes', { ascending: true });

			if (error) {
				console.error('Error al obtener distribución temporal:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener distribución temporal:', error);
			return [];
		}
	}

	/**
	 * Obtiene estadísticas de avance de proyectos
	 */
	async obtenerEstadisticasAvance(): Promise<EstadisticasAvance | null> {
		try {
			const { data, error } = await supabase.from('mv_estadisticas_avance').select('*').single();

			if (error) {
				console.error('Error al obtener estadísticas de avance:', error);
				return null;
			}

			return data;
		} catch (error) {
			console.error('Error al obtener estadísticas de avance:', error);
			return null;
		}
	}

	/**
	 * Obtiene estadísticas de presupuesto
	 */
	async obtenerEstadisticasPresupuesto(): Promise<EstadisticasPresupuesto | null> {
		try {
			const { data, error } = await supabase
				.from('mv_estadisticas_presupuesto')
				.select('*')
				.single();

			if (error) {
				console.error('Error al obtener estadísticas de presupuesto:', error);
				return null;
			}

			return data;
		} catch (error) {
			console.error('Error al obtener estadísticas de presupuesto:', error);
			return null;
		}
	}

	/**
	 * Busca información específica por facultad
	 */
	async buscarPorFacultad(facultadNombre: string): Promise<any> {
		try {
			// Buscar en top facultades
			const { data: facultades, error: errorFacultades } = await supabase
				.from('top_facultades_mv')
				.select('*')
				.ilike('facultad_nombre', `%${facultadNombre}%`);

			// Buscar carreras de esa facultad
			const { data: carreras, error: errorCarreras } = await supabase
				.from('top_carreras_mv')
				.select('*')
				.ilike('facultad_nombre', `%${facultadNombre}%`)
				.order('total_participantes', { ascending: false });

			return {
				facultades: facultades || [],
				carreras: carreras || []
			};
		} catch (error) {
			console.error('Error al buscar por facultad:', error);
			return { facultades: [], carreras: [] };
		}
	}

	/**
	 * Busca información de un participante específico
	 */
	async buscarParticipante(nombreOEmail: string): Promise<TopParticipante[]> {
		try {
			const { data, error } = await supabase
				.from('top_participantes_proyectos_mv')
				.select('*')
				.or(`participante_nombre.ilike.%${nombreOEmail}%,email.ilike.%${nombreOEmail}%`)
				.order('total_proyectos', { ascending: false })
				.limit(5);

			if (error) {
				console.error('Error al buscar participante:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al buscar participante:', error);
			return [];
		}
	}
}

/**
 * Instancia singleton del repositorio
 */
export const estadisticasRepository = new EstadisticasRepository();
