/**
 * Dashboard Data Composable
 * --------------------------
 * Centraliza toda la lógica de fetching, caché y estado del dashboard
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { GraficoConfig } from '$lib/models/admin';
import type { DashboardData } from '$lib/utils/chartConfigs';

// ==========================================
// TYPES
// ==========================================
interface DashboardState {
	loading: boolean;
	error: string | null;
	lastUpdate: string;
	isFetchingUpdate: boolean;
	dashboardData: DashboardData;
	chartConfigs: GraficoConfig[];
	visibleCharts: Record<string, boolean>;
	statsGridVisible: boolean;
	statsGridPublic: boolean;
}

// ==========================================
// CONSTANTS
// ==========================================
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const CACHE_VERSION = 'v3';

const CACHE_KEYS = {
	data: `dashboard_data_${CACHE_VERSION}`,
	timestamp: `dashboard_timestamp_${CACHE_VERSION}`,
	hash: `dashboard_hash_${CACHE_VERSION}`,
	chartConfigs: `chart_configs_${CACHE_VERSION}`
};

// ==========================================
// INITIAL STATE
// ==========================================
const initialState: DashboardState = {
	loading: true,
	error: null,
	lastUpdate: '',
	isFetchingUpdate: false,
	dashboardData: {
		stats: {
			total_projects: 0,
			total_budget: 0,
			completed_count: 0,
			in_progress_count: 0
		},
		projects: []
	},
	chartConfigs: [],
	visibleCharts: {},
	statsGridVisible: true,
	statsGridPublic: false
};

// ==========================================
// STORE
// ==========================================
function createDashboardStore() {
	const store = writable<DashboardState>(initialState);

	// ==========================================
	// CACHE UTILITIES
	// ==========================================
	function generateDataHash(stats: any): string {
		return JSON.stringify({
			count: stats.total_projects,
			totalBudget: stats.total_budget,
			completed: stats.completed_count
		});
	}

	function loadFromCache(): boolean {
		if (!browser) return false;

		try {
			const cached = localStorage.getItem(CACHE_KEYS.data);
			const timestamp = localStorage.getItem(CACHE_KEYS.timestamp);
			const cachedConfigs = localStorage.getItem(CACHE_KEYS.chartConfigs);

			if (!cached || !timestamp) return false;

			const age = Date.now() - parseInt(timestamp);
			if (age > CACHE_DURATION) {
				clearCache();
				return false;
			}

			const dashboardData = JSON.parse(cached);
			const chartConfigs = cachedConfigs ? JSON.parse(cachedConfigs) : [];
			const visibleCharts: Record<string, boolean> = {};

			chartConfigs.forEach((config: GraficoConfig) => {
				visibleCharts[config.nombre_grafico] = true;
			});

			// Cargar configuración de stats-grid
			const statsConfig = localStorage.getItem('stats_grid_config');
			let statsGridVisible = true;
			let statsGridPublic = false;

			if (statsConfig) {
				const config = JSON.parse(statsConfig);
				statsGridVisible = config.visible ?? true;
				statsGridPublic = config.public ?? false;
			}

			store.update((state) => ({
				...state,
				dashboardData,
				chartConfigs,
				visibleCharts,
				statsGridVisible,
				statsGridPublic,
				lastUpdate: new Date(parseInt(timestamp)).toLocaleString('es-ES')
			}));

			return true;
		} catch (err) {
			console.error('Error loading from cache:', err);
			clearCache();
			return false;
		}
	}

	function saveToCache(
		data: DashboardData,
		configs: GraficoConfig[],
		statsGridVisible: boolean,
		statsGridPublic: boolean
	): void {
		if (!browser) return;

		try {
			const timestamp = Date.now().toString();
			const hash = generateDataHash(data.stats);

			localStorage.setItem(CACHE_KEYS.data, JSON.stringify(data));
			localStorage.setItem(CACHE_KEYS.timestamp, timestamp);
			localStorage.setItem(CACHE_KEYS.hash, hash);
			localStorage.setItem(CACHE_KEYS.chartConfigs, JSON.stringify(configs));
			localStorage.setItem(
				'stats_grid_config',
				JSON.stringify({
					visible: statsGridVisible,
					public: statsGridPublic
				})
			);

			store.update((state) => ({
				...state,
				lastUpdate: new Date(parseInt(timestamp)).toLocaleString('es-ES')
			}));
		} catch (err) {
			console.error('Error saving to cache:', err);
		}
	}

	function clearCache(): void {
		if (!browser) return;
		Object.values(CACHE_KEYS).forEach((key) => localStorage.removeItem(key));
	}

	// ==========================================
	// DATA FETCHING
	// ==========================================
	async function fetchDashboardData(silent = false): Promise<void> {
		if (!silent) {
			store.update((state) => ({ ...state, loading: true }));
		}

		store.update((state) => ({ ...state, error: null }));

		try {
			const [analyticsRes, chartsRes] = await Promise.all([
				fetch('/api/admin/projects/dashboard'),
				fetch('/api/admin/graficosConfig?category=proyectos')
			]);

			if (!analyticsRes.ok || !chartsRes.ok) {
				throw new Error('Error fetching data');
			}

			const analyticsData = await analyticsRes.json();
			const chartsData = await chartsRes.json();

			if (!analyticsData.success) {
				throw new Error(analyticsData.message || 'Error fetching analytics');
			}

			// Check if data has changed
			const newHash = generateDataHash(analyticsData.data.resumen);
			const cachedHash = browser ? localStorage.getItem(CACHE_KEYS.hash) : null;

			if (cachedHash && newHash === cachedHash && silent) {
				return;
			}

			// Transform analytics data to dashboard format
			const dashboardData: DashboardData = {
				stats: {
					total_projects: analyticsData.data.resumen.total_proyectos || 0,
					total_budget: analyticsData.data.resumen.presupuesto_total || 0,
					completed_count: analyticsData.data.resumen.proyectos_finalizados || 0,
					in_progress_count: analyticsData.data.resumen.proyectos_en_ejecucion || 0
				},
				projects: [],
				analytics: analyticsData.data
			};

			// Filtrar solo gráficos de proyectos
			const chartConfigs: GraficoConfig[] = chartsData.success
				? chartsData.data.filter(
						(config: GraficoConfig) => !config.nombre_grafico.startsWith('participantes_')
				  )
				: [];

			const visibleCharts: Record<string, boolean> = {};
			chartConfigs.forEach((config) => {
				visibleCharts[config.nombre_grafico] = true;
			});

			store.update((state) => {
				saveToCache(dashboardData, chartConfigs, state.statsGridVisible, state.statsGridPublic);
				return {
					...state,
					dashboardData,
					chartConfigs,
					visibleCharts
				};
			});
		} catch (err) {
			console.error('Error fetching dashboard:', err);
			const errorMessage = err instanceof Error ? err.message : 'Error al cargar el dashboard';

			store.update((state) => {
				// Si es silencioso y tenemos datos cacheados, no mostramos error
				if (silent && state.dashboardData.stats.total_projects > 0) {
					return state;
				}
				return { ...state, error: errorMessage };
			});
		} finally {
			store.update((state) => ({
				...state,
				loading: false,
				isFetchingUpdate: false
			}));
		}
	}

	// ==========================================
	// CHART ACTIONS
	// ==========================================
	function toggleChart(chartName: string): void {
		store.update((state) => ({
			...state,
			visibleCharts: {
				...state.visibleCharts,
				[chartName]: !state.visibleCharts[chartName]
			}
		}));
	}

	function toggleStatsGrid(): void {
		store.update((state) => {
			const newVisible = !state.statsGridVisible;
			saveStatsGridConfig(newVisible, state.statsGridPublic);
			return { ...state, statsGridVisible: newVisible };
		});
	}

	function toggleStatsGridPublic(): void {
		store.update((state) => {
			const newPublic = !state.statsGridPublic;
			saveStatsGridConfig(state.statsGridVisible, newPublic);
			return { ...state, statsGridPublic: newPublic };
		});
	}

	function saveStatsGridConfig(visible: boolean, isPublic: boolean): void {
		if (!browser) return;
		localStorage.setItem(
			'stats_grid_config',
			JSON.stringify({
				visible,
				public: isPublic
			})
		);
	}

	async function togglePublicChart(chartName: string): Promise<void> {
		try {
			const response = await fetch(`/api/admin/graficosConfig/${chartName}/toggle-public`, {
				method: 'POST'
			});

			if (!response.ok) throw new Error('Error updating chart visibility');

			const result = await response.json();
			if (result.success) {
				store.update((state) => {
					const updatedConfigs = state.chartConfigs.map((c) =>
						c.nombre_grafico === chartName ? { ...c, es_publico: result.data.es_publico } : c
					);
					saveToCache(
						state.dashboardData,
						updatedConfigs,
						state.statsGridVisible,
						state.statsGridPublic
					);
					return { ...state, chartConfigs: updatedConfigs };
				});
			}
		} catch (err) {
			console.error('Error toggling visibility:', err);
			throw err;
		}
	}

	// ==========================================
	// INITIALIZATION
	// ==========================================
	async function initialize(): Promise<void> {
		const hasCache = loadFromCache();

		if (hasCache) {
			store.update((state) => ({ ...state, loading: false }));
			await fetchDashboardData(true);
		} else {
			await fetchDashboardData(false);
		}
	}

	return {
		subscribe: store.subscribe,
		initialize,
		fetchDashboardData,
		toggleChart,
		toggleStatsGrid,
		toggleStatsGridPublic,
		togglePublicChart
	};
}

export const dashboardStore = createDashboardStore();
