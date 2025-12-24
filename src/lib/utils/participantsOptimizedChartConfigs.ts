/**
 * Configuraciones de Gráficos Optimizadas - Dashboard de Participantes
 * ----------------------------------------------------------------------
 * Funciones que usan vistas materializadas para rendimiento óptimo
 */

import type { ChartConfiguration } from 'chart.js';

// Paleta de colores consistente (igual que proyectos)
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
 * 1. Top Facultades con más participantes
 */
export function getTopFacultadesConfig(data: any): ChartConfiguration {
	const facultades = data.topFacultades || [];
	const sorted = [...facultades].sort((a, b) => b.total_participantes - a.total_participantes);
	const top = sorted.slice(0, 15);

	return {
		type: 'bar',
		data: {
			labels: top.map((f: any) =>
				f.facultad_nombre.length > 40
					? f.facultad_nombre.substring(0, 40) + '...'
					: f.facultad_nombre
			),
			datasets: [
				{
					label: 'Total Participantes',
					data: top.map((f: any) => f.total_participantes),
					backgroundColor: CHART_COLORS.primary,
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
 * 2. Top Facultades por Género
 */
export function getFacultadesGeneroConfig(data: any): ChartConfiguration {
	const facultades = data.topFacultades || [];
	const sorted = [...facultades].sort((a, b) => b.total_participantes - a.total_participantes);
	const top = sorted.slice(0, 10);

	return {
		type: 'bar',
		data: {
			labels: top.map((f: any) =>
				f.facultad_nombre.length > 30
					? f.facultad_nombre.substring(0, 30) + '...'
					: f.facultad_nombre
			),
			datasets: [
				{
					label: 'Masculino',
					data: top.map((f: any) => f.masculino),
					backgroundColor: CHART_COLORS.primary,
					borderRadius: 6
				},
				{
					label: 'Femenino',
					data: top.map((f: any) => f.femenino),
					backgroundColor: CHART_COLORS.pink,
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
					stacked: true,
					beginAtZero: true,
					ticks: {
						...whiteScalesConfig.x.ticks,
						precision: 0
					}
				},
				y: {
					...whiteScalesConfig.y,
					stacked: true
				}
			}
		}
	};
}

/**
 * 3. Top Carreras con más participantes
 */
export function getTopCarrerasConfig(data: any): ChartConfiguration {
	const carreras = data.topCarreras || [];
	const sorted = [...carreras].sort((a, b) => b.total_participantes - a.total_participantes);
	const top = sorted.slice(0, 15);

	return {
		type: 'bar',
		data: {
			labels: top.map((c: any) =>
				c.carrera_nombre.length > 35 ? c.carrera_nombre.substring(0, 35) + '...' : c.carrera_nombre
			),
			datasets: [
				{
					label: 'Total Participantes',
					data: top.map((c: any) => c.total_participantes),
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
 * 4. Top Carreras por Género
 */
export function getCarrerasGeneroConfig(data: any): ChartConfiguration {
	const carreras = data.topCarreras || [];
	const sorted = [...carreras].sort((a, b) => b.total_participantes - a.total_participantes);
	const top = sorted.slice(0, 10);

	return {
		type: 'bar',
		data: {
			labels: top.map((c: any) =>
				c.carrera_nombre.length > 25 ? c.carrera_nombre.substring(0, 25) + '...' : c.carrera_nombre
			),
			datasets: [
				{
					label: 'Masculino',
					data: top.map((c: any) => c.masculino),
					backgroundColor: CHART_COLORS.primary,
					borderRadius: 6
				},
				{
					label: 'Femenino',
					data: top.map((c: any) => c.femenino),
					backgroundColor: CHART_COLORS.pink,
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
					stacked: true,
					beginAtZero: true,
					ticks: {
						...whiteScalesConfig.x.ticks,
						precision: 0
					}
				},
				y: {
					...whiteScalesConfig.y,
					stacked: true
				}
			}
		}
	};
}

/**
 * 5. Top Cargos con más asignaciones
 */
export function getTopCargosConfig(data: any): ChartConfiguration {
	const cargos = data.topCargos || [];
	const sorted = [...cargos].sort((a, b) => b.total_asignaciones - a.total_asignaciones);
	const top = sorted.slice(0, 15);

	return {
		type: 'bar',
		data: {
			labels: top.map((c: any) => c.cargo_nombre),
			datasets: [
				{
					label: 'Total Asignaciones',
					data: top.map((c: any) => c.total_asignaciones),
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
 * 6. Cargos por Género
 */
export function getCargosGeneroConfig(data: any): ChartConfiguration {
	const cargos = data.topCargos || [];
	const sorted = [...cargos].sort((a, b) => b.total_asignaciones - a.total_asignaciones);
	const top = sorted.slice(0, 10);

	return {
		type: 'bar',
		data: {
			labels: top.map((c: any) => c.cargo_nombre),
			datasets: [
				{
					label: 'Masculino',
					data: top.map((c: any) => c.masculino),
					backgroundColor: CHART_COLORS.primary,
					borderRadius: 6
				},
				{
					label: 'Femenino',
					data: top.map((c: any) => c.femenino),
					backgroundColor: CHART_COLORS.pink,
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
					stacked: true,
					beginAtZero: true,
					ticks: {
						...whiteScalesConfig.x.ticks,
						precision: 0
					}
				},
				y: {
					...whiteScalesConfig.y,
					stacked: true
				}
			}
		}
	};
}

/**
 * 7. Top Participantes con más proyectos (Leaderboard)
 * Retorna null para indicar que se debe usar el componente ParticipantsLeaderboard
 */
export function getTopParticipantesProyectosConfig(data: any): ChartConfiguration | null {
	return null; // El componente ParticipantsLeaderboard lo maneja
}

/**
 * 8. Distribución por Género (General)
 */
export function getDistribucionGeneroConfig(data: any): ChartConfiguration {
	const stats = data.stats;
	if (!stats) {
		return getEmptyConfig();
	}

	return {
		type: 'doughnut',
		data: {
			labels: ['Masculino', 'Femenino', 'Otro'],
			datasets: [
				{
					data: [stats.total_masculino, stats.total_femenino, stats.total_otro_genero],
					backgroundColor: [CHART_COLORS.primary, CHART_COLORS.pink, CHART_COLORS.purple],
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
							const total = stats.total_participantes;
							const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
							return `${label}: ${value} (${percentage}%)`;
						}
					}
				}
			}
		}
	};
}

/**
 * 9. Acreditación de Participantes
 */
export function getDistribucionAcreditacionConfig(data: any): ChartConfiguration {
	const stats = data.stats;
	if (!stats) {
		return getEmptyConfig();
	}

	return {
		type: 'doughnut',
		data: {
			labels: ['Acreditados', 'No Acreditados', 'Acreditados No Especifica'],
			datasets: [
				{
					data: [
						stats.total_acreditados,
						stats.total_no_acreditados,
						stats.total_acreditado_no_especifica
					],
					backgroundColor: [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.info],
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
							const total = stats.total_participantes;
							const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
							return `${label}: ${value} (${percentage}%)`;
						}
					}
				}
			}
		}
	};
}

/**
 * 10. Participación Directiva por Género
 */
export function getParticipacionDirectivaGeneroConfig(data: any): ChartConfiguration {
	const participacion = data.participacionDirectiva || [];
	const sorted = [...participacion].sort(
		(a, b) => b.total_roles_directivos - a.total_roles_directivos
	);

	return {
		type: 'bar',
		data: {
			labels: sorted.map((p: any) => p.genero),
			datasets: [
				{
					label: 'Roles Directivos',
					data: sorted.map((p: any) => p.total_roles_directivos),
					backgroundColor: CHART_COLORS.emerald,
					borderRadius: 6
				},
				{
					label: 'Participantes Únicos',
					data: sorted.map((p: any) => p.participantes_unicos),
					backgroundColor: CHART_COLORS.cyan,
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
 * 11. Facultad × Género (Cruzado)
 */
export function getFacultadGeneroConfig(data: any): ChartConfiguration {
	const facultadGenero = data.facultadGenero || [];
	const sorted = [...facultadGenero].sort(
		(a, b) => b.masculino + b.femenino - (a.masculino + a.femenino)
	);
	const top = sorted.slice(0, 12);

	return {
		type: 'bar',
		data: {
			labels: top.map((f: any) =>
				f.facultad_nombre.length > 25
					? f.facultad_nombre.substring(0, 25) + '...'
					: f.facultad_nombre
			),
			datasets: [
				{
					label: 'Masculino',
					data: top.map((f: any) => f.masculino),
					backgroundColor: CHART_COLORS.primary,
					borderRadius: 6
				},
				{
					label: 'Femenino',
					data: top.map((f: any) => f.femenino),
					backgroundColor: CHART_COLORS.pink,
					borderRadius: 6
				}
			]
		},
		options: {
			...commonOptions,
			scales: {
				...whiteScalesConfig,
				x: {
					...whiteScalesConfig.x,
					stacked: true
				},
				y: {
					...whiteScalesConfig.y,
					stacked: true,
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
 * 12. Cargo × Género (Cruzado)
 */
export function getCargoGeneroConfig(data: any): ChartConfiguration {
	const cargoGenero = data.cargoGenero || [];
	const sorted = [...cargoGenero].sort(
		(a, b) => b.masculino + b.femenino - (a.masculino + a.femenino)
	);

	return {
		type: 'bar',
		data: {
			labels: sorted.map((c: any) => c.cargo_nombre),
			datasets: [
				{
					label: 'Masculino',
					data: sorted.map((c: any) => c.masculino),
					backgroundColor: CHART_COLORS.primary,
					borderRadius: 6
				},
				{
					label: 'Femenino',
					data: sorted.map((c: any) => c.femenino),
					backgroundColor: CHART_COLORS.pink,
					borderRadius: 6
				}
			]
		},
		options: {
			...commonOptions,
			scales: {
				...whiteScalesConfig,
				x: {
					...whiteScalesConfig.x,
					stacked: true
				},
				y: {
					...whiteScalesConfig.y,
					stacked: true,
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
 * 13. Resumen Ejecutivo - NO ES UN GRÁFICO, ES UN GRID DE CARDS
 * Retorna null para indicar que debe renderizarse como componente especial
 */
export function getResumenEjecutivoConfig(data: any): ChartConfiguration | null {
	return null; // El componente ResumenEjecutivo lo maneja
}

/**
 * Función helper para gráficos vacíos
 */
function getEmptyConfig(): ChartConfiguration {
	return {
		type: 'bar',
		data: {
			labels: [],
			datasets: []
		},
		options: commonOptions
	};
}

/**
 * Mapeo de nombres de gráficos a funciones
 */
export const participantsChartGenerators: Record<string, (data: any) => ChartConfiguration | null> =
	{
		// Resumen ejecutivo
		participantes_resumen_ejecutivo: getResumenEjecutivoConfig,
		participantes_resumen: getResumenEjecutivoConfig, // Alias para BD

		// Facultades
		participantes_top_facultades: getTopFacultadesConfig,
		participantes_facultades_genero: getFacultadesGeneroConfig,
		participantes_facultad_genero: getFacultadGeneroConfig, // Análisis cruzado

		// Carreras
		participantes_top_carreras: getTopCarrerasConfig,
		participantes_carreras_genero: getCarrerasGeneroConfig,

		// Cargos
		participantes_top_cargos: getTopCargosConfig,
		participantes_cargos_genero: getCargosGeneroConfig,
		participantes_cargo_genero: getCargoGeneroConfig, // Análisis cruzado (alias)

		// Participantes individuales
		participantes_top_proyectos: getTopParticipantesProyectosConfig,
		participantes_leaderboard: getTopParticipantesProyectosConfig, // Alias para BD

		// Distribuciones generales
		participantes_distribucion_genero: getDistribucionGeneroConfig,
		participantes_genero_pie: getDistribucionGeneroConfig, // Alias para BD
		participantes_distribucion_acreditacion: getDistribucionAcreditacionConfig,
		participantes_genero_acreditados: getDistribucionAcreditacionConfig, // Alias para BD

		// Análisis cruzados
		participantes_participacion_directiva: getParticipacionDirectivaGeneroConfig,
		participantes_directiva_genero: getParticipacionDirectivaGeneroConfig // Alias para BD
	};
