/**
 * Analytics Repository
 * --------------------
 * Acceso optimizado a vistas materializadas para análisis estadístico
 * de proyectos sin sobrecargar el servidor.
 */

import { supabase } from '../../supabase.client';
import type {
	ProyectosPorAnio,
	EstadisticasAvance,
	EstadisticasDuracion,
	EstadisticasPresupuesto,
	TopItem,
	TopProyectoPresupuesto,
	DistribucionEstado,
	DistribucionTemporal,
	ResumenEjecutivo,
	ProjectsDashboardData
} from '$lib/models/admin/projects/dashboardProjects';

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
			.order('anio_inicio', { ascending: false });

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
			.select('tipo_presupuesto, cantidad, porcentaje')
			.order('cantidad', { ascending: false });

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
			.select('institucion, cantidad, porcentaje')
			.order('cantidad', { ascending: false });

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
			.select('linea, cantidad, porcentaje')
			.neq('linea', 'por revisar') // Excluir "por revisar" para evitar análisis sesgado
			.order('cantidad', { ascending: false });

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
	 * Obtener top áreas de conocimiento
	 */
	static async getTopAreasConocimiento(): Promise<TopItem[]> {
		const { data, error } = await supabase
			.from('mv_top_areas_conocimiento')
			.select('area_conocimiento, cantidad, porcentaje')
			.order('cantidad', { ascending: false });

		if (error) {
			console.error('Error fetching top areas:', error);
			return [];
		}
		return (data || []).map((item) => ({
			nombre: item.area_conocimiento,
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
			.select('tipo_proyecto, cantidad, porcentaje')
			.order('cantidad', { ascending: false });

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
	 * Obtener top proyectos por presupuesto
	 * Retorna los proyectos ordenados de mayor a menor presupuesto
	 * @param limit - Número máximo de proyectos a retornar (default: 20)
	 */
	static async getTopProyectosPresupuesto(limit = 20): Promise<TopProyectoPresupuesto[]> {
		const { data, error } = await supabase
			.from('mv_top_presupuesto_proyectos')
			.select('proyecto_id, codigo, titulo, presupuesto_total, estado, fecha_inicio')
			.order('presupuesto_total', { ascending: false })
			.limit(limit);

		if (error) {
			console.error('Error fetching top proyectos presupuesto:', error);
			return [];
		}
		return data || [];
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
	static async getDashboardAnalytics(): Promise<ProjectsDashboardData> {
		// Ejecutar todas las consultas en paralelo para máxima eficiencia
		const [
			resumen,
			avance,
			duracion,
			presupuesto,
			estados,
			tiposPresupuesto,
			instituciones,
			lineasInvestigacion,
			areasConocimiento,
			tiposProyecto,
			temporal,
			topProyectosPresupuesto
		] = await Promise.all([
			this.getResumenEjecutivo(),
			this.getEstadisticasAvance(),
			this.getEstadisticasDuracion(),
			this.getEstadisticasPresupuesto(),
			this.getDistribucionEstado(),
			this.getTopTiposPresupuesto(),
			this.getTopInstituciones(),
			this.getTopLineasInvestigacion(),
			this.getTopAreasConocimiento(),
			this.getTopTiposProyecto(),
			this.getDistribucionTemporal(5),
			this.getTopProyectosPresupuesto(20)
		]);

		return {
			resumen,
			avance,
			duracion,
			presupuesto,
			estados,
			tiposPresupuesto,
			instituciones,
			lineasInvestigacion,
			areasConocimiento,
			tiposProyecto,
			temporal,
			topProyectosPresupuesto
		};
	}
}
