/**
 * Modelos para Configuración de Gráficos Públicos
 * ------------------------------------------------
 * Tipos TypeScript para la gestión de gráficos del dashboard
 */

export interface GraficoConfig {
	id: number;
	nombre_grafico: string;
	titulo_display: string;
	descripcion: string | null;
	es_publico: boolean;
	orden: number;
	tipo_grafico:
		| 'bar'
		| 'line'
		| 'pie'
		| 'doughnut'
		| 'radar'
		| 'horizontalBar'
		| 'map'
		| 'timeline';
	tab_categoria:
		| 'overview'
		| 'analytics'
		| 'geographic'
		| 'presupuesto'
		| 'participantes_overview'
		| 'participantes_facultades'
		| 'participantes_carreras'
		| 'participantes_cargos'
		| 'participantes_investigadores'
		| 'participantes_genero';
	creado_en: string;
	actualizado_en: string;
}

export interface UpdateGraficoConfigDTO {
	es_publico?: boolean;
	orden?: number;
	titulo_display?: string;
	descripcion?: string;
}

export interface ChartDataset {
	label: string;
	data: number[];
	backgroundColor?: string | string[];
	borderColor?: string | string[];
	borderWidth?: number;
	fill?: boolean;
	tension?: number;
}

export interface ChartData {
	labels: string[];
	datasets: ChartDataset[];
}

export interface ChartConfig {
	type: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'horizontalBar';
	data: ChartData;
	options: any;
}
