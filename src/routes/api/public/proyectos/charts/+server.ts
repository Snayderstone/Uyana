import { json } from '@sveltejs/kit';
import { AnalyticsRepository } from '$lib/db/admin/projects/dashboardProjects.repository';
import { AdminChartsRepository } from '$lib/db/admin/graficosConfig/chart.repository';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ setHeaders }: RequestEvent) {
	// Configurar headers para evitar cache en producción
	setHeaders({
		'Cache-Control': 'no-cache, no-store, must-revalidate',
		'Pragma': 'no-cache',
		'Expires': '0'
	});

	// 1. Obtener configuraciones públicas SOLO de proyectos
	const allPublicCharts = await AdminChartsRepository.getPublicChartConfigs();
	const publicProjectsCharts = allPublicCharts.filter((c) =>
		c.nombre_grafico.startsWith('proyectos_')
	);

	// Si no hay gráficos públicos de proyectos, no devolver nada
	if (publicProjectsCharts.length === 0) {
		return json({
			success: true,
			data: {},
			publicCharts: [],
			message: 'No hay gráficos públicos de proyectos disponibles'
		});
	}

	// 2. Obtener datos completos del dashboard
	const fullData = await AnalyticsRepository.getDashboardAnalytics();

	if (!fullData) {
		return json({ success: false, error: 'Error al obtener datos' }, { status: 500 });
	}

	// 3. Filtrar datos según gráficos públicos
	const publicChartNames = publicProjectsCharts.map((c) => c.nombre_grafico);
	const filteredData: any = {};

	// Mapeo de qué campos específicos de resumen necesita cada gráfico
	const resumenFieldsMapping: Record<string, string[]> = {
		proyectos_resumen_ejecutivo: [
			'total_proyectos',
			'proyectos_finalizados',
			'proyectos_en_ejecucion',
			'proyectos_en_cierre',
			'presupuesto_total',
			'presupuesto_promedio',
			'presupuesto_maximo',
			'avance_promedio_global',
			'fecha_primer_proyecto',
			'fecha_ultimo_proyecto',
			'duracion_promedio_meses',
			'anio_actual',
			'proyectos_anio_actual'
		]
	};

	// Mapeo de qué objetos/arrays completos necesita cada gráfico
	const dataFieldsMapping: Record<string, string[]> = {
		proyectos_distribucion_estado: ['estados'],
		proyectos_tipos_presupuesto: ['tiposPresupuesto'],
		proyectos_top_instituciones: ['instituciones'],
		proyectos_areas_conocimiento: ['areasConocimiento'],
		proyectos_tipos_proyecto: ['tiposProyecto'],
		proyectos_distribucion_avance: ['avance'],
		proyectos_distribucion_duracion: ['duracion'],
		proyectos_distribucion_presupuesto: ['presupuesto'],
		proyectos_distribucion_temporal: ['temporal'],
		proyectos_por_anio: ['temporal'],
		proyectos_top_lineas: ['lineasInvestigacion'],
		proyectos_top_presupuesto: ['topProyectosPresupuesto']
	};

	// Recolectar campos de resumen necesarios
	const neededResumenFields = new Set<string>();
	publicChartNames.forEach((chartName) => {
		const resumenFields = resumenFieldsMapping[chartName] || [];
		resumenFields.forEach((field) => neededResumenFields.add(field));
	});

	// Si hay campos de resumen necesarios, crear objeto resumen filtrado
	if (neededResumenFields.size > 0 && fullData.resumen) {
		filteredData.resumen = {};
		neededResumenFields.forEach((field) => {
			filteredData.resumen[field] = fullData.resumen[field as keyof typeof fullData.resumen];
		});
	}

	// Recolectar campos de datos necesarios
	const neededDataFields = new Set<string>();
	publicChartNames.forEach((chartName) => {
		const dataFields = dataFieldsMapping[chartName] || [];
		dataFields.forEach((field) => neededDataFields.add(field));
	});

	// Incluir campos de datos necesarios
	neededDataFields.forEach((field) => {
		if (fullData[field as keyof typeof fullData]) {
			filteredData[field] = fullData[field as keyof typeof fullData];
		}
	});

	return json({
		success: true,
		data: filteredData,
		publicCharts: publicChartNames,
		chartConfigs: publicProjectsCharts.map((c) => ({
			nombre: c.nombre_grafico,
			titulo: c.titulo_display,
			descripcion: c.descripcion,
			tipo: c.tipo_grafico
		}))
	});
}
