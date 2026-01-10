import { json } from '@sveltejs/kit';
import { ParticipantsDashboardRepository } from '$lib/db/admin/participants/dashboardParticipants.repository';
import { AdminChartsRepository } from '$lib/db/admin/graficosConfig/chart.repository';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ setHeaders }: RequestEvent) {
	// Configurar headers para evitar cache en producción
	setHeaders({
		'Cache-Control': 'no-cache, no-store, must-revalidate',
		'Pragma': 'no-cache',
		'Expires': '0'
	});

	// 1. Obtener configuraciones públicas SOLO de participantes
	const allPublicCharts = await AdminChartsRepository.getPublicChartConfigs();
	const publicParticipantsCharts = allPublicCharts.filter((c) =>
		c.nombre_grafico.startsWith('participantes_')
	);

	// Si no hay gráficos públicos de participantes, no devolver nada
	if (publicParticipantsCharts.length === 0) {
		return json({
			success: true,
			data: {},
			publicCharts: [],
			message: 'No hay gráficos públicos de participantes disponibles'
		});
	}

	// 2. Obtener datos completos del dashboard
	const fullData = await ParticipantsDashboardRepository.getDashboardDataComplete();

	if (!fullData) {
		return json({ success: false, error: 'Error al obtener datos' }, { status: 500 });
	}

	// 3. Filtrar datos según gráficos públicos
	const publicChartNames = publicParticipantsCharts.map((c) => c.nombre_grafico);
	const filteredData: any = {};

	// Mapeo de qué campos específicos de stats necesita cada gráfico
	const statsFieldsMapping: Record<string, string[]> = {
		participantes_resumen_ejecutivo: [
			'total_participantes',
			'total_acreditados',
			'total_no_acreditados',
			'total_acreditado_no_especifica',
			'total_masculino',
			'total_femenino',
			'total_otro_genero'
		],
		participantes_resumen: [
			'total_participantes',
			'total_acreditados',
			'total_no_acreditados',
			'total_acreditado_no_especifica',
			'total_masculino',
			'total_femenino',
			'total_otro_genero'
		],
		participantes_distribucion_genero: ['total_masculino', 'total_femenino', 'total_otro_genero'],
		participantes_genero_pie: ['total_masculino', 'total_femenino', 'total_otro_genero'],
		participantes_distribucion_acreditacion: [
			'total_acreditados',
			'total_no_acreditados',
			'total_acreditado_no_especifica'
		],
		participantes_genero_acreditados: [
			'total_acreditados',
			'total_no_acreditados',
			'total_acreditado_no_especifica'
		]
	};

	// Mapeo de qué arrays completos necesita cada gráfico
	const arrayFieldsMapping: Record<string, string[]> = {
		participantes_top_facultades: ['topFacultades'],
		participantes_facultades_genero: ['topFacultades'],
		participantes_facultad_genero: ['facultadGenero'],
		participantes_top_carreras: ['topCarreras'],
		participantes_carreras_genero: ['topCarreras'],
		participantes_top_cargos: ['topCargos'],
		participantes_cargos_genero: ['topCargos'],
		participantes_cargo_genero: ['cargoGenero'],
		participantes_top_proyectos: ['topParticipantes'],
		participantes_leaderboard: ['topParticipantes'],
		participantes_participacion_directiva: ['participacionDirectiva'],
		participantes_directiva_genero: ['participacionDirectiva']
	};

	// Recolectar campos de stats necesarios
	const neededStatsFields = new Set<string>();
	publicChartNames.forEach((chartName) => {
		const statsFields = statsFieldsMapping[chartName] || [];
		statsFields.forEach((field) => neededStatsFields.add(field));
	});

	// Si hay campos de stats necesarios, crear objeto stats filtrado
	if (neededStatsFields.size > 0 && fullData.stats) {
		filteredData.stats = {};
		neededStatsFields.forEach((field) => {
			filteredData.stats[field] = fullData.stats[field as keyof typeof fullData.stats];
		});
	}

	// Recolectar arrays completos necesarios
	const neededArrayFields = new Set<string>();
	publicChartNames.forEach((chartName) => {
		const arrayFields = arrayFieldsMapping[chartName] || [];
		arrayFields.forEach((field) => neededArrayFields.add(field));
	});

	// Incluir arrays completos necesarios
	neededArrayFields.forEach((field) => {
		if (fullData[field as keyof typeof fullData]) {
			filteredData[field] = fullData[field as keyof typeof fullData];
		}
	});

	return json({
		success: true,
		data: filteredData,
		publicCharts: publicChartNames,
		chartConfigs: publicParticipantsCharts.map((c) => ({
			nombre: c.nombre_grafico,
			titulo: c.titulo_display,
			descripcion: c.descripcion,
			tipo: c.tipo_grafico
		}))
	});
}
