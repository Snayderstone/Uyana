import type { PageServerLoad } from './$types';

interface MapConfig {
	initialCenter: [number, number];
	initialZoom: number;
	apiKeys: Record<string, string>;
}

interface PageData {
	mapConfig: MapConfig;
}

// Esta función se ejecuta en el servidor antes de que se renderice la página
export const load = (async () => {
	// Aquí podríamos cargar datos iniciales para el mapa desde una API o base de datos
	// Por ahora, solo devolvemos algunos datos de configuración básicos

	return {
		mapConfig: {
			initialCenter: [-0.1992, -78.5059] as [number, number], // Quito - UCE
			initialZoom: 16,
			apiKeys: {
				// Aquí podrías incluir claves de API si fueran necesarias
				// Por ejemplo: mapbox: 'tu_clave_api_mapbox'
			}
		}
	} as PageData;
}) satisfies PageServerLoad;
