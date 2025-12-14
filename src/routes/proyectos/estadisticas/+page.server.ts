/**
 * Public Page - Charts Statistics Server Load
 * ---------------------------------------------
 * SSR para página pública de estadísticas usando vistas materializadas
 */

import type { PageServerLoad } from './$types';
import { AdminChartsRepository } from '$lib/db/admin/charts.repository';
import { AnalyticsRepository } from '$lib/db/admin/analytics.repository';
import type { GraficoConfig } from '$lib/models/admin/chart.model';

interface DashboardStats {
	total_projects: number;
	total_budget: number;
	completed_count: number;
	in_progress_count: number;
}

interface DashboardData {
	stats: DashboardStats;
	projects: any[];
	analytics?: any;
}

interface LoadReturn {
	charts: GraficoConfig[];
	dashboardData: DashboardData;
	error?: string;
}

export const load: PageServerLoad<LoadReturn> = async () => {
	try {
		// Obtener configuraciones de gráficos públicos
		const publicCharts = await AdminChartsRepository.getPublicChartConfigs();

		// Obtener datos de analytics (vistas materializadas)
		const analytics = await AnalyticsRepository.getDashboardAnalytics();

		// Transformar resumen a stats
		const stats: DashboardStats = {
			total_projects: analytics.resumen.total_proyectos || 0,
			total_budget: analytics.resumen.presupuesto_total || 0,
			completed_count: analytics.resumen.proyectos_finalizados || 0,
			in_progress_count: analytics.resumen.proyectos_en_ejecucion || 0
		};

		return {
			charts: publicCharts,
			dashboardData: {
				stats,
				projects: [], // Ya no necesitamos la lista completa
				analytics // Datos de vistas materializadas
			}
		};
	} catch (error) {
		console.error('Error loading public charts:', error);
		return {
			charts: [],
			dashboardData: {
				stats: {
					total_projects: 0,
					total_budget: 0,
					completed_count: 0,
					in_progress_count: 0
				},
				projects: []
			},
			error: 'Error al cargar las estadísticas'
		};
	}
};
