import type { PageLoad } from './$types';

interface ChartConfig {
	nombre: string;
	titulo: string;
	descripcion: string;
	tipo: string;
}

interface LoadResult {
	success: boolean;
	data: any;
	publicCharts: string[];
	chartConfigs: ChartConfig[];
	error?: string;
	message?: string;
}

export const load: PageLoad = async ({ fetch }): Promise<LoadResult> => {
	try {
		const response = await fetch('/api/public/proyectos/charts');
		const result = await response.json();

		if (!result.success) {
			return {
				success: false,
				error: result.error || 'Error al cargar datos',
				data: {},
				publicCharts: [],
				chartConfigs: []
			};
		}

		return {
			success: true,
			data: result.data,
			publicCharts: result.publicCharts || [],
			chartConfigs: result.chartConfigs || [],
			message: result.message
		};
	} catch (error) {
		console.error('Error loading public projects charts:', error);
		return {
			success: false,
			error: 'Error al conectar con el servidor',
			data: {},
			publicCharts: [],
			chartConfigs: []
		};
	}
};
