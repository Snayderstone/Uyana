/**
 * Tipos para Dashboard de Gráficos
 * ----------------------------------
 * Solo interfaces de tipos - las funciones de gráficos están en optimizedChartConfigs.ts
 */

export interface DashboardData {
	stats: {
		total_projects: number;
		total_budget: number;
		completed_count: number;
		in_progress_count: number;
	};
	projects: any[];
	analytics?: any; // Datos de vistas materializadas
}
