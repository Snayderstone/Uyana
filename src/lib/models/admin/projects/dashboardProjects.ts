/**
 * Admin Module - Projects Dashboard Models
 * -----------------------------------------
 * Modelos para el dashboard de analytics de proyectos
 */

export interface ProyectosPorAnio {
	anio_inicio: number;
	cantidad_inicio: number;
	anio_fin: number;
	cantidad_fin: number;
}

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

export interface EstadisticasDuracion {
	total_proyectos: number;
	duracion_promedio: number;
	duracion_desviacion: number;
	duracion_minima: number;
	duracion_maxima: number;
	duracion_percentil_25: number;
	duracion_mediana: number;
	duracion_percentil_75: number;
	proyectos_hasta_1_anio: number;
	proyectos_1_2_anios: number;
	proyectos_2_3_anios: number;
	proyectos_mas_3_anios: number;
}

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

export interface TopItem {
	nombre: string;
	cantidad: number;
	porcentaje: number;
}

export interface TopProyectoPresupuesto {
	proyecto_id: number;
	codigo: string;
	titulo: string;
	presupuesto_total: number;
	estado: string;
	fecha_inicio: Date | string;
}

export interface DistribucionEstado {
	estado_id: number;
	estado: string;
	cantidad: number;
	porcentaje: number;
	avance_promedio: number;
}

export interface DistribucionTemporal {
	anio: number;
	mes: number;
	proyectos_iniciados: number;
	proyectos_finalizados: number;
	avance_promedio: number;
	presupuesto_total: number;
}

export interface ResumenEjecutivo {
	total_proyectos: number;
	proyectos_finalizados: number;
	proyectos_en_ejecucion: number;
	proyectos_en_cierre: number;
	presupuesto_total: number;
	presupuesto_promedio: number;
	presupuesto_maximo: number;
	avance_promedio_global: number;
	fecha_primer_proyecto: Date;
	fecha_ultimo_proyecto: Date;
	duracion_promedio_meses: number;
	anio_actual: number;
	proyectos_anio_actual: number;
}

/**
 * Dashboard completo de analytics de proyectos
 */
export interface ProjectsDashboardData {
	resumen: ResumenEjecutivo;
	avance: EstadisticasAvance;
	duracion: EstadisticasDuracion;
	presupuesto: EstadisticasPresupuesto;
	estados: DistribucionEstado[];
	tiposPresupuesto: TopItem[];
	instituciones: TopItem[];
	lineasInvestigacion: TopItem[];
	areasConocimiento: TopItem[];
	tiposProyecto: TopItem[];
	temporal: DistribucionTemporal[];
	topProyectosPresupuesto: TopProyectoPresupuesto[];
}
