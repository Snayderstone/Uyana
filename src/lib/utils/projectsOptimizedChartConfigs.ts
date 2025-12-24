/**
 * Configuraciones de Gráficos Optimizadas
 * ----------------------------------------
 * Funciones que usan vistas materializadas para rendimiento óptimo
 */

import type { ChartConfiguration } from 'chart.js';

// Paleta de colores consistente
const CHART_COLORS = {
	primary: '#3b82f6',
	secondary: '#8b5cf6',
	success: '#10b981',
	warning: '#f59e0b',
	danger: '#ef4444',
	info: '#06b6d4',
	purple: '#a855f7',
	pink: '#ec4899',
	indigo: '#6366f1',
	teal: '#14b8a6',
	cyan: '#22d3ee',
	lime: '#84cc16',
	emerald: '#059669',
	amber: '#f59e0b'
};

const COLORS_ARRAY = Object.values(CHART_COLORS);

// Detectar si estamos en modo oscuro
function isDarkMode(): boolean {
	if (typeof document !== 'undefined') {
		return document.documentElement.getAttribute('data-theme') === 'dark';
	}
	return false;
}

// Función helper para colores de texto/ejes
function getTextColor(): string {
	return '#ffffff'; // Siempre blanco para mejor contraste en modo oscuro
}

function getGridColor(): string {
	return 'rgba(255, 255, 255, 0.1)'; // Líneas de cuadrícula sutiles
}

// Configuración de scales con colores blancos
const whiteScalesConfig = {
	x: {
		ticks: {
			color: getTextColor(),
			font: {
				size: 11
			}
		},
		grid: {
			color: getGridColor()
		}
	},
	y: {
		ticks: {
			color: getTextColor(),
			font: {
				size: 11
			}
		},
		grid: {
			color: getGridColor()
		}
	}
};

// Opciones comunes
const commonOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			display: true,
			position: 'top' as const,
			labels: {
				usePointStyle: true,
				padding: 15,
				color: '#ffffff', // Texto blanco para leyendas
				font: {
					size: 12,
					family: "'Inter', sans-serif"
				}
			}
		},
		tooltip: {
			enabled: true,
			backgroundColor: 'rgba(0, 0, 0, 0.8)',
			padding: 12,
			cornerRadius: 8,
			titleFont: {
				size: 14,
				weight: 'bold' as const
			},
			bodyFont: {
				size: 13
			},
			titleColor: '#ffffff',
			bodyColor: '#ffffff'
		}
	},
	scales: {
		x: {
			ticks: {
				color: '#ffffff', // Etiquetas del eje X en blanco
				font: {
					size: 11
				}
			},
			grid: {
				color: 'rgba(255, 255, 255, 0.1)' // Líneas de cuadrícula sutiles
			}
		},
		y: {
			ticks: {
				color: '#ffffff', // Etiquetas del eje Y en blanco
				font: {
					size: 11
				}
			},
			grid: {
				color: 'rgba(255, 255, 255, 0.1)'
			}
		}
	}
};

/**
 * 1. Distribución por Año de Inicio
 */
export function getProyectosPorAnioConfig(data: any): ChartConfiguration {
	const aniosData = data.analytics?.temporal || [];

	// Agrupar por año
	const porAnio = aniosData.reduce((acc: any, item: any) => {
		const anio = item.anio;
		if (!acc[anio]) {
			acc[anio] = {
				iniciados: 0,
				finalizados: 0
			};
		}
		acc[anio].iniciados += item.proyectos_iniciados || 0;
		acc[anio].finalizados += item.proyectos_finalizados || 0;
		return acc;
	}, {});

	const anios = Object.keys(porAnio).sort();

	return {
		type: 'bar',
		data: {
			labels: anios,
			datasets: [
				{
					label: 'Proyectos Iniciados',
					data: anios.map((a) => porAnio[a].iniciados),
					backgroundColor: CHART_COLORS.primary,
					borderRadius: 6
				},
				{
					label: 'Proyectos Finalizados',
					data: anios.map((a) => porAnio[a].finalizados),
					backgroundColor: CHART_COLORS.success,
					borderRadius: 6
				}
			]
		},
		options: {
			...commonOptions,
			scales: {
				...whiteScalesConfig,
				y: {
					...whiteScalesConfig.y,
					beginAtZero: true,
					ticks: {
						...whiteScalesConfig.y.ticks,
						precision: 0
					}
				}
			}
		}
	};
}

/**
 * 2. Distribución por Estado
 */
export function getDistribucionEstadoConfig(data: any): ChartConfiguration {
	const estados = data.analytics?.estados || [];

	return {
		type: 'doughnut',
		data: {
			labels: estados.map((e: any) => e.estado),
			datasets: [
				{
					data: estados.map((e: any) => e.cantidad),
					backgroundColor: COLORS_ARRAY,
					borderWidth: 2,
					borderColor: '#ffffff'
				}
			]
		},
		options: {
			...commonOptions,
			plugins: {
				...commonOptions.plugins,
				tooltip: {
					...commonOptions.plugins.tooltip,
					callbacks: {
						label: function (context: any) {
							const label = context.label || '';
							const value = context.parsed || 0;
							const dataset = context.dataset.data;
							const total = dataset.reduce((a: number, b: number) => a + b, 0);
							const percentage = ((value / total) * 100).toFixed(1);
							return `${label}: ${value} (${percentage}%)`;
						}
					}
				}
			}
		}
	};
}

/**
 * 3. Top Tipos de Presupuesto
 */
export function getTiposPresupuestoConfig(data: any): ChartConfiguration {
	const tipos = data.analytics?.tiposPresupuesto || [];

	return {
		type: 'pie',
		data: {
			labels: tipos.map((t: any) => t.nombre),
			datasets: [
				{
					data: tipos.map((t: any) => t.cantidad),
					backgroundColor: COLORS_ARRAY,
					borderWidth: 2,
					borderColor: '#ffffff'
				}
			]
		},
		options: {
			...commonOptions,
			plugins: {
				...commonOptions.plugins,
				tooltip: {
					...commonOptions.plugins.tooltip,
					callbacks: {
						label: function (context: any) {
							const label = context.label || '';
							const value = context.parsed || 0;
							const porcentaje = tipos[context.dataIndex]?.porcentaje || 0;
							return `${label}: ${value} (${porcentaje}%)`;
						}
					}
				}
			}
		}
	};
}

/**
 * 4. Top Instituciones
 */
export function getTopInstitucionesConfig(data: any): ChartConfiguration {
	const instituciones = (data.analytics?.instituciones || []).slice(0, 10);

	return {
		type: 'bar',
		data: {
			labels: instituciones.map((i: any) =>
				i.nombre.length > 40 ? i.nombre.substring(0, 40) + '...' : i.nombre
			),
			datasets: [
				{
					label: 'Número de Proyectos',
					data: instituciones.map((i: any) => i.cantidad),
					backgroundColor: CHART_COLORS.secondary,
					borderRadius: 6
				}
			]
		},
		options: {
			...commonOptions,
			indexAxis: 'y' as const,
			scales: {
				...whiteScalesConfig,
				x: {
					...whiteScalesConfig.x,
					beginAtZero: true,
					ticks: {
						...whiteScalesConfig.x.ticks,
						precision: 0
					}
				}
			}
		}
	};
}

/**
 * 5. Áreas de Conocimiento
 */
export function getAreasConocimientoConfig(data: any): ChartConfiguration {
	const areas = data.analytics?.areasConocimiento || [];

	return {
		type: 'doughnut',
		data: {
			labels: areas.map((a: any) => a.nombre),
			datasets: [
				{
					data: areas.map((a: any) => a.cantidad),
					backgroundColor: COLORS_ARRAY,
					borderWidth: 2,
					borderColor: '#ffffff'
				}
			]
		},
		options: {
			...commonOptions,
			plugins: {
				...commonOptions.plugins,
				tooltip: {
					...commonOptions.plugins.tooltip,
					callbacks: {
						label: function (context: any) {
							const label = context.label || '';
							const value = context.parsed || 0;
							const porcentaje = areas[context.dataIndex]?.porcentaje || 0;
							return `${label}: ${value} (${porcentaje}%)`;
						}
					}
				}
			}
		}
	};
}

/**
 * 7. Top Tipos de Proyecto
 */
export function getTiposProyectoConfig(data: any): ChartConfiguration {
	const tipos = (data.analytics?.tiposProyecto || []).slice(0, 10);

	return {
		type: 'bar',
		data: {
			labels: tipos.map((t: any) => t.nombre),
			datasets: [
				{
					label: 'Número de Proyectos',
					data: tipos.map((t: any) => t.cantidad),
					backgroundColor: CHART_COLORS.purple,
					borderRadius: 6
				}
			]
		},
		options: {
			...commonOptions,
			indexAxis: 'y' as const,
			scales: {
				...whiteScalesConfig,
				x: {
					...whiteScalesConfig.x,
					beginAtZero: true,
					ticks: {
						...whiteScalesConfig.x.ticks,
						precision: 0
					}
				}
			}
		}
	};
}

/**
 * 6. Distribución Geográfica
 */
export function getDistribucionAvanceConfig(data: any): ChartConfiguration {
	const avance = data.analytics?.avance;
	if (!avance) {
		return { type: 'bar', data: { labels: [], datasets: [] }, options: commonOptions };
	}

	return {
		type: 'bar',
		data: {
			labels: ['0%', '1-25%', '26-50%', '51-75%', '76-99%', '100%'],
			datasets: [
				{
					label: 'Número de Proyectos',
					data: [
						avance.proyectos_0_pct || 0,
						avance.proyectos_1_25_pct || 0,
						avance.proyectos_26_50_pct || 0,
						avance.proyectos_51_75_pct || 0,
						avance.proyectos_76_99_pct || 0,
						avance.proyectos_100_pct || 0
					],
					backgroundColor: [
						CHART_COLORS.danger,
						CHART_COLORS.warning,
						CHART_COLORS.amber,
						CHART_COLORS.info,
						CHART_COLORS.lime,
						CHART_COLORS.success
					],
					borderRadius: 6
				}
			]
		},
		options: {
			...commonOptions,
			scales: {
				...whiteScalesConfig,
				y: {
					...whiteScalesConfig.y,
					beginAtZero: true,
					ticks: {
						...whiteScalesConfig.y.ticks,
						precision: 0
					}
				}
			}
		}
	};
}

/**
 * 9. Distribución de Duración
 */
export function getDistribucionDuracionConfig(data: any): ChartConfiguration {
	const duracion = data.analytics?.duracion;
	if (!duracion) {
		return { type: 'bar', data: { labels: [], datasets: [] }, options: commonOptions };
	}

	return {
		type: 'bar',
		data: {
			labels: ['Hasta 1 año', '1-2 años', '2-3 años', 'Más de 3 años'],
			datasets: [
				{
					label: 'Número de Proyectos',
					data: [
						duracion.proyectos_hasta_1_anio || 0,
						duracion.proyectos_1_2_anios || 0,
						duracion.proyectos_2_3_anios || 0,
						duracion.proyectos_mas_3_anios || 0
					],
					backgroundColor: [
						CHART_COLORS.info,
						CHART_COLORS.primary,
						CHART_COLORS.purple,
						CHART_COLORS.warning
					],
					borderRadius: 6
				}
			]
		},
		options: {
			...commonOptions,
			scales: {
				...whiteScalesConfig,
				y: {
					...whiteScalesConfig.y,
					beginAtZero: true,
					ticks: {
						...whiteScalesConfig.y.ticks,
						precision: 0
					}
				}
			}
		}
	};
}

/**
 * 10. Distribución de Presupuesto
 */
export function getDistribucionPresupuestoConfig(data: any): ChartConfiguration {
	const presupuesto = data.analytics?.presupuesto;
	if (!presupuesto) {
		return { type: 'bar', data: { labels: [], datasets: [] }, options: commonOptions };
	}

	return {
		type: 'pie',
		data: {
			labels: [
				'Sin presupuesto',
				'$0-$1k',
				'$1k-$5k',
				'$5k-$10k',
				'$10k-$50k',
				'$50k-$100k',
				'Más de $100k'
			],
			datasets: [
				{
					data: [
						presupuesto.proyectos_sin_presupuesto || 0,
						presupuesto.proyectos_0_1k || 0,
						presupuesto.proyectos_1k_5k || 0,
						presupuesto.proyectos_5k_10k || 0,
						presupuesto.proyectos_10k_50k || 0,
						presupuesto.proyectos_50k_100k || 0,
						presupuesto.proyectos_mas_100k || 0
					],
					backgroundColor: COLORS_ARRAY,
					borderWidth: 2,
					borderColor: '#ffffff'
				}
			]
		},
		options: {
			...commonOptions,
			plugins: {
				...commonOptions.plugins,
				tooltip: {
					...commonOptions.plugins.tooltip,
					callbacks: {
						label: function (context: any) {
							const label = context.label || '';
							const value = context.parsed || 0;
							return `${label}: ${value} proyectos`;
						}
					}
				}
			}
		}
	};
}

/**
 * 11. Serie Temporal (Distribución Temporal)
 */
export function getDistribucionTemporalConfig(data: any): ChartConfiguration {
	const temporal = data.analytics?.temporal || [];

	// Agrupar por año-mes
	const labels = temporal.map((t: any) => {
		const mes = String(t.mes).padStart(2, '0');
		return `${t.anio}-${mes}`;
	});

	return {
		type: 'line',
		data: {
			labels,
			datasets: [
				{
					label: 'Proyectos Iniciados',
					data: temporal.map((t: any) => t.proyectos_iniciados || 0),
					borderColor: CHART_COLORS.primary,
					backgroundColor: CHART_COLORS.primary + '20',
					tension: 0.4,
					fill: true
				},
				{
					label: 'Proyectos Finalizados',
					data: temporal.map((t: any) => t.proyectos_finalizados || 0),
					borderColor: CHART_COLORS.success,
					backgroundColor: CHART_COLORS.success + '20',
					tension: 0.4,
					fill: true
				}
			]
		},
		options: {
			...commonOptions,
			scales: {
				...whiteScalesConfig,
				y: {
					...whiteScalesConfig.y,
					beginAtZero: true,
					ticks: {
						...whiteScalesConfig.y.ticks,
						precision: 0
					}
				}
			}
		}
	};
}

/**
 * 12. Top Líneas de Investigación
 */
export function getTopLineasConfig(data: any): ChartConfiguration {
	const lineas = (data.analytics?.lineasInvestigacion || []).slice(0, 10);

	return {
		type: 'bar',
		data: {
			labels: lineas.map((l: any) =>
				l.nombre.length > 40 ? l.nombre.substring(0, 40) + '...' : l.nombre
			),
			datasets: [
				{
					label: 'Número de Proyectos',
					data: lineas.map((l: any) => l.cantidad),
					backgroundColor: CHART_COLORS.teal,
					borderRadius: 6
				}
			]
		},
		options: {
			...commonOptions,
			indexAxis: 'y' as const,
			scales: {
				...whiteScalesConfig,
				x: {
					...whiteScalesConfig.x,
					beginAtZero: true,
					ticks: {
						...whiteScalesConfig.x.ticks,
						precision: 0
					}
				}
			}
		}
	};
}

/**
 * 13. Resumen Ejecutivo (Stats Cards)
 */
/**
 * 13. Resumen Ejecutivo - NO ES UN GRÁFICO, ES UN GRID DE CARDS
 * Retorna null para indicar que debe renderizarse como componente especial
 */
export function getResumenEjecutivoConfig(data: any): ChartConfiguration | null {
	return null;
}

/**
 * 14. Top Proyectos por Presupuesto
 */
export function getTopProyectosPresupuestoConfig(data: any): ChartConfiguration {
	const proyectos = data.analytics?.topProyectosPresupuesto || [];

	// Si no hay datos, retornar configuración vacía
	if (!proyectos || proyectos.length === 0) {
		return {
			type: 'bar',
			data: {
				labels: ['Sin datos'],
				datasets: [
					{
						label: 'Presupuesto (US$)',
						data: [0],
						backgroundColor: CHART_COLORS.success,
						borderRadius: 6
					}
				]
			},
			options: {
				...commonOptions,
				indexAxis: 'y' as const
			}
		};
	}

	// Limitar a los top 20 proyectos
	const topProyectos = proyectos.slice(0, 20);

	// Formatear etiquetas solo con el código del proyecto
	const labels = topProyectos.map((p: any) => p.codigo || 'N/A');

	// Función para formatear moneda
	const formatCurrency = (value: number): string => {
		if (value >= 1000000) {
			return `${(value / 1000000).toFixed(2)}M`;
		} else if (value >= 1000) {
			return `${(value / 1000).toFixed(0)}K`;
		}
		return value.toFixed(0);
	};

	return {
		type: 'bar',
		data: {
			labels: labels,
			datasets: [
				{
					label: 'Presupuesto (US$)',
					data: topProyectos.map((p: any) => p.presupuesto_total),
					backgroundColor: CHART_COLORS.success,
					borderRadius: 6
				}
			]
		},
		options: {
			...commonOptions,
			indexAxis: 'y' as const,
			scales: {
				...whiteScalesConfig,
				x: {
					...whiteScalesConfig.x,
					beginAtZero: true,
					ticks: {
						...whiteScalesConfig.x.ticks,
						callback: function (value: any) {
							return formatCurrency(value);
						}
					}
				},
				y: {
					...whiteScalesConfig.y,
					ticks: {
						...whiteScalesConfig.y.ticks,
						autoSkip: false
					}
				}
			},
			plugins: {
				...commonOptions.plugins,
				tooltip: {
					...commonOptions.plugins.tooltip,
					callbacks: {
						title: function (context: any) {
							const proyecto = topProyectos[context[0].dataIndex];
							return proyecto?.codigo || 'N/A';
						},
						label: function (context: any) {
							const value = context.parsed.x || 0;
							const proyecto = topProyectos[context.dataIndex];
							if (!proyecto) return [`Presupuesto: $${value.toFixed(2)}`];

							const tooltipLines = [
								`Título: ${proyecto.titulo || 'Sin título'}`,
								`Presupuesto: $${value.toLocaleString('en-US', {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2
								})}`
							];

							if (proyecto.estado) {
								tooltipLines.push(`Estado: ${proyecto.estado}`);
							}

							if (proyecto.fecha_inicio) {
								try {
									const fecha = new Date(proyecto.fecha_inicio);
									tooltipLines.push(`Inicio: ${fecha.toLocaleDateString('es-ES')}`);
								} catch (e) {
									// Si hay error parseando la fecha, no la mostramos
								}
							}

							return tooltipLines;
						}
					}
				}
			}
		}
	};
}

/**
 * Mapeo de nombres de gráficos a funciones
 */
export const chartGenerators: Record<string, (data: any) => ChartConfiguration | null> = {
	// Proyectos - con nuevo prefijo
	proyectos_por_anio: getProyectosPorAnioConfig,
	proyectos_distribucion_temporal: getDistribucionTemporalConfig,
	proyectos_distribucion_estado: getDistribucionEstadoConfig,
	proyectos_tipos_presupuesto: getTiposPresupuestoConfig,
	proyectos_top_instituciones: getTopInstitucionesConfig,
	proyectos_top_lineas: getTopLineasConfig,
	proyectos_areas_conocimiento: getAreasConocimientoConfig,
	proyectos_tipos_proyecto: getTiposProyectoConfig,
	proyectos_distribucion_avance: getDistribucionAvanceConfig,
	proyectos_distribucion_duracion: getDistribucionDuracionConfig,
	proyectos_distribucion_presupuesto: getDistribucionPresupuestoConfig,
	proyectos_resumen_ejecutivo: getResumenEjecutivoConfig,
	proyectos_top_presupuesto: getTopProyectosPresupuestoConfig
};
