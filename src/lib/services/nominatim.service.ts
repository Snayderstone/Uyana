/**
 * Servicio de geocodificación usando Nominatim API (OpenStreetMap)
 * Permite buscar direcciones y obtener coordenadas
 */

export interface NominatimResult {
	place_id: number;
	licence: string;
	osm_type: string;
	osm_id: number;
	lat: string;
	lon: string;
	display_name: string;
	address: {
		road?: string;
		suburb?: string;
		city?: string;
		county?: string;
		state?: string;
		country?: string;
		country_code?: string;
	};
	boundingbox: [string, string, string, string]; // [latMin, latMax, lonMin, lonMax]
}

export interface SearchResult {
	id: number;
	lat: number;
	lng: number;
	displayName: string;
	address: string;
	bounds?: [[number, number], [number, number]]; // [[latMin, lngMin], [latMax, lngMax]]
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'Uyana-Geoespacial/1.0'; // Nominatim requiere un User-Agent

/**
 * Busca direcciones usando Nominatim
 * @param query - Texto de búsqueda (ej: "Universidad de Alicante España")
 * @param limit - Número máximo de resultados (default: 5)
 * @returns Array de resultados ordenados por relevancia
 */
export async function searchAddress(query: string, limit: number = 5): Promise<SearchResult[]> {
	if (!query || query.trim().length < 3) {
		return [];
	}

	try {
		const params = new URLSearchParams({
			q: query,
			format: 'json',
			addressdetails: '1',
			limit: limit.toString(),
			bounded: '0',
			'accept-language': 'es'
		});

		const response = await fetch(`${NOMINATIM_URL}/search?${params}`, {
			headers: {
				'User-Agent': USER_AGENT
			}
		});

		if (!response.ok) {
			throw new Error(`Nominatim API error: ${response.status}`);
		}

		const results: NominatimResult[] = await response.json();

		return results.map((result) => ({
			id: result.place_id,
			lat: parseFloat(result.lat),
			lng: parseFloat(result.lon),
			displayName: result.display_name,
			address: formatAddress(result.address),
			bounds: result.boundingbox
				? [
						[parseFloat(result.boundingbox[0]), parseFloat(result.boundingbox[2])],
						[parseFloat(result.boundingbox[1]), parseFloat(result.boundingbox[3])]
				  ]
				: undefined
		}));
	} catch (error) {
		console.error('Error buscando dirección:', error);
		return [];
	}
}

/**
 * Geocodificación inversa: obtiene la dirección de unas coordenadas
 * @param lat - Latitud
 * @param lng - Longitud
 * @returns Información de la dirección
 */
export async function reverseGeocode(lat: number, lng: number): Promise<SearchResult | null> {
	try {
		const params = new URLSearchParams({
			lat: lat.toString(),
			lon: lng.toString(),
			format: 'json',
			addressdetails: '1',
			'accept-language': 'es'
		});

		const response = await fetch(`${NOMINATIM_URL}/reverse?${params}`, {
			headers: {
				'User-Agent': USER_AGENT
			}
		});

		if (!response.ok) {
			throw new Error(`Nominatim API error: ${response.status}`);
		}

		const result: NominatimResult = await response.json();

		return {
			id: result.place_id,
			lat: parseFloat(result.lat),
			lng: parseFloat(result.lon),
			displayName: result.display_name,
			address: formatAddress(result.address)
		};
	} catch (error) {
		console.error('Error en geocodificación inversa:', error);
		return null;
	}
}

/**
 * Formatea la dirección de manera legible
 */
function formatAddress(address: NominatimResult['address']): string {
	const parts: string[] = [];

	if (address.road) parts.push(address.road);
	if (address.suburb) parts.push(address.suburb);
	if (address.city) parts.push(address.city);
	if (address.state) parts.push(address.state);
	if (address.country) parts.push(address.country);

	return parts.join(', ') || 'Dirección no disponible';
}

/**
 * Valida si unas coordenadas son válidas
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
	return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
