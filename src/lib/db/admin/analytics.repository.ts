/**
 * Analytics Repository
 * --------------------
 * Acceso optimizado a vistas materializadas para análisis estadístico
 * de proyectos sin sobrecargar el servidor.
 */

import { supabase } from '../supabase.client';

// ==========================================
// INTERFACES
// ==========================================

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

// ==========================================
// REPOSITORY CLASS
// ==========================================

export class AnalyticsRepository {
	/**
	 * Obtener distribución de proyectos por año
	 */
	static async getProyectosPorAnio(): Promise<ProyectosPorAnio[]> {
		const { data, error } = await supabase
			.from('mv_proyectos_por_anio')
			.select('*')
			.order('anio_inicio');

		if (error) {
			console.error('Error fetching proyectos por anio:', error);
			return [];
		}
		return data || [];
	}

	/**
	 * Obtener estadísticas de avance
	 */
	static async getEstadisticasAvance(): Promise<EstadisticasAvance> {
		const { data, error } = await supabase.from('mv_estadisticas_avance').select('*').single();

		if (error) {
			console.error('Error fetching estadisticas avance:', error);
			return {} as EstadisticasAvance;
		}
		return data;
	}

	/**
	 * Obtener estadísticas de duración
	 */
	static async getEstadisticasDuracion(): Promise<EstadisticasDuracion> {
		const { data, error } = await supabase.from('mv_estadisticas_duracion').select('*').single();

		if (error) {
			console.error('Error fetching estadisticas duracion:', error);
			return {} as EstadisticasDuracion;
		}
		return data;
	}

	/**
	 * Obtener estadísticas de presupuesto
	 */
	static async getEstadisticasPresupuesto(): Promise<EstadisticasPresupuesto> {
		const { data, error } = await supabase.from('mv_estadisticas_presupuesto').select('*').single();

		if (error) {
			console.error('Error fetching estadisticas presupuesto:', error);
			return {} as EstadisticasPresupuesto;
		}
		return data;
	}

	/**
	 * Obtener top tipos de presupuesto
	 */
	static async getTopTiposPresupuesto(): Promise<TopItem[]> {
		const { data, error } = await supabase
			.from('mv_top_tipos_presupuesto')
			.select('tipo_presupuesto, cantidad, porcentaje');

		if (error) {
			console.error('Error fetching top tipos presupuesto:', error);
			return [];
		}
		return (data || []).map((item) => ({
			nombre: item.tipo_presupuesto,
			cantidad: item.cantidad,
			porcentaje: item.porcentaje
		}));
	}

	/**
	 * Obtener top instituciones
	 */
	static async getTopInstituciones(): Promise<TopItem[]> {
		const { data, error } = await supabase
			.from('mv_top_instituciones')
			.select('institucion, cantidad, porcentaje');

		if (error) {
			console.error('Error fetching top instituciones:', error);
			return [];
		}
		return (data || []).map((item) => ({
			nombre: item.institucion,
			cantidad: item.cantidad,
			porcentaje: item.porcentaje
		}));
	}

	/**
	 * Obtener distribución por estado
	 */
	static async getDistribucionEstado(): Promise<DistribucionEstado[]> {
		const { data, error } = await supabase
			.from('mv_distribucion_estado')
			.select('*')
			.order('cantidad', { ascending: false });

		if (error) {
			console.error('Error fetching distribucion estado:', error);
			return [];
		}
		return data || [];
	}

	/**
	 * Obtener top líneas de investigación
	 */
	static async getTopLineasInvestigacion(): Promise<TopItem[]> {
		const { data, error } = await supabase
			.from('mv_top_lineas_investigacion')
			.select('linea, cantidad, porcentaje');

		if (error) {
			console.error('Error fetching top lineas:', error);
			return [];
		}
		return (data || []).map((item) => ({
			nombre: item.linea,
			cantidad: item.cantidad,
			porcentaje: item.porcentaje
		}));
	}

	/**
	 * Obtener macro-líneas de investigación
	 */
	static async getMacroLineasInvestigacion(): Promise<TopItem[]> {
		const { data, error } = await supabase
			.from('mv_macro_lineas_investigacion')
			.select('macro_linea, cantidad, porcentaje')
			.order('cantidad', { ascending: false });

		if (error) {
			console.error('Error fetching macro lineas:', error);
			return [];
		}
		return (data || []).map((item) => ({
			nombre: item.macro_linea,
			cantidad: item.cantidad,
			porcentaje: item.porcentaje
		}));
	}

	/**
	 * Obtener top áreas de conocimiento
	 */
	static async getTopAreasConocimiento(): Promise<TopItem[]> {
		const { data, error } = await supabase
			.from('mv_top_areas_conocimiento')
			.select('area_simplificada, cantidad, porcentaje')
			.order('cantidad', { ascending: false });

		if (error) {
			console.error('Error fetching top areas:', error);
			return [];
		}
		return (data || []).map((item) => ({
			nombre: item.area_simplificada,
			cantidad: item.cantidad,
			porcentaje: item.porcentaje
		}));
	}

	/**
	 * Obtener top tipos de proyecto
	 */
	static async getTopTiposProyecto(): Promise<TopItem[]> {
		const { data, error } = await supabase
			.from('mv_top_tipos_proyecto')
			.select('tipo_proyecto, cantidad, porcentaje');

		if (error) {
			console.error('Error fetching top tipos proyecto:', error);
			return [];
		}
		return (data || []).map((item) => ({
			nombre: item.tipo_proyecto,
			cantidad: item.cantidad,
			porcentaje: item.porcentaje
		}));
	}

	/**
	 * Obtener distribución temporal
	 * @param limitAnios - Limitar a los últimos N años (default: 5)
	 */
	static async getDistribucionTemporal(limitAnios = 5): Promise<DistribucionTemporal[]> {
		const currentYear = new Date().getFullYear();
		const minYear = currentYear - limitAnios;

		const { data, error } = await supabase
			.from('mv_distribucion_temporal')
			.select('*')
			.gte('anio', minYear)
			.order('anio', { ascending: false })
			.order('mes', { ascending: false });

		if (error) {
			console.error('Error fetching distribucion temporal:', error);
			return [];
		}
		return data || [];
	}

	/**
	 * Obtener resumen ejecutivo completo
	 */
	static async getResumenEjecutivo(): Promise<ResumenEjecutivo> {
		const { data, error } = await supabase.from('mv_resumen_ejecutivo').select('*').single();

		if (error) {
			console.error('Error fetching resumen ejecutivo:', error);
			return {} as ResumenEjecutivo;
		}
		return data;
	}

	/**
	 * Refrescar todas las vistas materializadas
	 * NOTA: Esta operación puede tardar varios segundos en bases de datos grandes.
	 * Se recomienda ejecutarla mediante un cron job o tarea programada.
	 */
	static async refreshAllViews(): Promise<void> {
		const { error } = await supabase.rpc('refresh_all_analytics_views');
		if (error) {
			console.error('Error refreshing analytics views:', error);
			throw error;
		}
	}

	/**
	 * Obtener paquete completo de analytics para dashboard
	 */
	static async getDashboardAnalytics(): Promise<{
		resumen: ResumenEjecutivo;
		avance: EstadisticasAvance;
		duracion: EstadisticasDuracion;
		presupuesto: EstadisticasPresupuesto;
		estados: DistribucionEstado[];
		tiposPresupuesto: TopItem[];
		instituciones: TopItem[];
		macroLineas: TopItem[];
		lineasInvestigacion: TopItem[];
		areasConocimiento: TopItem[];
		tiposProyecto: TopItem[];
		temporal: DistribucionTemporal[];
	}> {
		// Ejecutar todas las consultas en paralelo para máxima eficiencia
		const [
			resumen,
			avance,
			duracion,
			presupuesto,
			estados,
			tiposPresupuesto,
			instituciones,
			macroLineas,
			lineasInvestigacion,
			areasConocimiento,
			tiposProyecto,
			temporal
		] = await Promise.all([
			this.getResumenEjecutivo(),
			this.getEstadisticasAvance(),
			this.getEstadisticasDuracion(),
			this.getEstadisticasPresupuesto(),
			this.getDistribucionEstado(),
			this.getTopTiposPresupuesto(),
			this.getTopInstituciones(),
			this.getMacroLineasInvestigacion(),
			this.getTopLineasInvestigacion(),
			this.getTopAreasConocimiento(),
			this.getTopTiposProyecto(),
			this.getDistribucionTemporal(5)
		]);

		return {
			resumen,
			avance,
			duracion,
			presupuesto,
			estados,
			tiposPresupuesto,
			instituciones,
			macroLineas,
			lineasInvestigacion,
			areasConocimiento,
			tiposProyecto,
			temporal
		};
	}
}
