/**
 * Dashboard Data Composable - Participantes
 * ------------------------------------------
 * Centraliza toda la lógica de fetching, caché y estado del dashboard de participantes
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { GraficoConfig } from '$lib/models/admin';
import type { ParticipantsDashboardData } from '$lib/models/admin/participants/dashboardParticipants.model';

// ==========================================
// TYPES
// ==========================================
interface DashboardState {
	loading: boolean;
	error: string | null;
	lastUpdate: string;
	isFetchingUpdate: boolean;
	dashboardData: ParticipantsDashboardData | null;
	chartConfigs: GraficoConfig[];
	visibleCharts: Record<string, boolean>;
	statsGridVisible: boolean;
	statsGridPublic: boolean;
}

// ==========================================
// CONSTANTS
// ==========================================
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const CACHE_VERSION = 'v1';

const CACHE_KEYS = {
	data: `participants_dashboard_data_${CACHE_VERSION}`,
	timestamp: `participants_dashboard_timestamp_${CACHE_VERSION}`,
	hash: `participants_dashboard_hash_${CACHE_VERSION}`,
	chartConfigs: `participants_chart_configs_${CACHE_VERSION}`
};

// ==========================================
// INITIAL STATE
// ==========================================
const initialState: DashboardState = {
	loading: true,
	error: null,
	lastUpdate: '',
	isFetchingUpdate: false,
	dashboardData: null,
	chartConfigs: [],
	visibleCharts: {},
	statsGridVisible: true,
	statsGridPublic: false
};

// ==========================================
// STORE
// ==========================================
function createParticipantsDashboardStore() {
	const store = writable<DashboardState>(initialState);

	// ==========================================
	// CACHE UTILITIES
	// ==========================================
	function generateDataHash(stats: any): string {
		if (!stats) return '';
		return JSON.stringify({
			total: stats.total_participantes,
			acreditados: stats.total_acreditados,
			masculino: stats.total_masculino,
			femenino: stats.total_femenino
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
			const statsConfig = localStorage.getItem('participants_stats_grid_config');
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
		data: ParticipantsDashboardData,
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
				'participants_stats_grid_config',
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
			const [participantsRes, chartsRes] = await Promise.all([
				fetch('/api/admin/participants/dashboard'),
				fetch('/api/admin/graficosConfig?category=participantes')
			]);

			if (!participantsRes.ok || !chartsRes.ok) {
				throw new Error('Error fetching data');
			}

			const participantsData = await participantsRes.json();
			const chartsData = await chartsRes.json();

			if (!participantsData.success) {
				throw new Error(participantsData.message || 'Error fetching participants data');
			}

			// Check if data has changed
			const newHash = generateDataHash(participantsData.data.stats);
			const cachedHash = browser ? localStorage.getItem(CACHE_KEYS.hash) : null;

			if (cachedHash && newHash === cachedHash && silent) {
				return;
			}

			const dashboardData: ParticipantsDashboardData = participantsData.data;

			// Filtrar solo gráficos de participantes
			const chartConfigs: GraficoConfig[] = chartsData.success
				? chartsData.data.filter((config: GraficoConfig) =>
						config.nombre_grafico.startsWith('participantes_')
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
			console.error('Error fetching participants dashboard:', err);
			const errorMessage = err instanceof Error ? err.message : 'Error al cargar el dashboard';

			store.update((state) => {
				// Si es silencioso y tenemos datos cacheados, no mostramos error
				if (silent && state.dashboardData) {
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
			'participants_stats_grid_config',
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
					if (state.dashboardData) {
						saveToCache(
							state.dashboardData,
							updatedConfigs,
							state.statsGridVisible,
							state.statsGridPublic
						);
					}
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

export const participantsDashboardStore = createParticipantsDashboardStore();
