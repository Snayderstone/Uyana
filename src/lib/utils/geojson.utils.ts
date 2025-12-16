/**
 * Utilidades para conversión de formatos GeoJSON
 * Convierte entre Feature (formato DB) y FeatureCollection (formato estándar)
 */

import type { GeoJSONGeometry } from '$lib/models/admin';

export interface GeoJSONFeature {
	type: 'Feature';
	geometry: {
		type: string;
		coordinates: any;
	};
	properties: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
	type: 'FeatureCollection';
	features: GeoJSONFeature[];
}

/**
 * Convierte un Feature (formato DB) a FeatureCollection (formato editor)
 * @param feature - Feature desde la base de datos
 * @returns FeatureCollection para el editor
 */
export function featureToFeatureCollection(
	feature: GeoJSONFeature | null
): GeoJSONFeatureCollection | null {
	if (!feature || !feature.geometry) return null;

	return {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: {
					type: capitalizeFirstLetter(feature.geometry.type),
					coordinates: feature.geometry.coordinates
				},
				properties: feature.properties || {}
			}
		]
	};
}

/**
 * Convierte un FeatureCollection (formato editor) a Feature (formato DB)
 * @param featureCollection - FeatureCollection desde el editor
 * @returns Feature para guardar en DB
 */
export function featureCollectionToFeature(
	featureCollection: GeoJSONFeatureCollection | null
): GeoJSONFeature | null {
	if (!featureCollection || !featureCollection.features || featureCollection.features.length === 0)
		return null;

	const firstFeature = featureCollection.features[0];

	return {
		type: 'Feature',
		geometry: {
			type: firstFeature.geometry.type.toLowerCase(),
			coordinates: firstFeature.geometry.coordinates
		},
		properties: firstFeature.properties || {}
	};
}

/**
 * Convierte una geometría simple (Point/Polygon) a FeatureCollection
 * @param geometry - Geometría simple desde la DB
 * @returns FeatureCollection para el editor
 */
export function geometryToFeatureCollection(
	geometry: GeoJSONGeometry
): GeoJSONFeatureCollection | null {
	if (!geometry) return null;

	// Si es un Feature, extraer la geometría
	if ('geometry' in geometry) {
		return {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: geometry.geometry as any,
					properties: geometry.properties || {}
				}
			]
		};
	}

	// Si es Point o Polygon directamente
	return {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: {
					type: geometry.type,
					coordinates: geometry.coordinates
				},
				properties: {}
			}
		]
	};
}

/**
 * Extrae la geometría simple de un FeatureCollection
 * @param featureCollection - FeatureCollection desde el editor
 * @returns Geometría simple para guardar en DB
 */
export function featureCollectionToGeometry(
	featureCollection: GeoJSONFeatureCollection | null
): GeoJSONGeometry {
	if (!featureCollection || !featureCollection.features || featureCollection.features.length === 0)
		return null;

	const firstFeature = featureCollection.features[0];
	const geom = firstFeature.geometry;

	if (geom.type === 'Point') {
		return {
			type: 'Point',
			coordinates: geom.coordinates as [number, number]
		};
	} else if (geom.type === 'Polygon') {
		return {
			type: 'Polygon',
			coordinates: geom.coordinates as [number, number][][]
		};
	}

	return null;
}

/**
 * Obtiene el centro de una geometría para centrar el mapa
 * @param geometry - Geometría GeoJSON
 * @returns [lat, lng] o null
 */
export function getGeometryCenter(geometry: GeoJSONGeometry): [number, number] | null {
	if (!geometry) return null;

	if (geometry.type === 'Point') {
		// Para Point, las coordenadas son [lng, lat] pero Leaflet usa [lat, lng]
		return [geometry.coordinates[1], geometry.coordinates[0]];
	} else if (geometry.type === 'Polygon') {
		// Para Polygon, calculamos el centroide
		const ring = geometry.coordinates[0]; // Primer anillo exterior
		let latSum = 0;
		let lngSum = 0;
		const pointCount = ring.length - 1; // Excluimos el último punto (cierre)

		for (let i = 0; i < pointCount; i++) {
			lngSum += ring[i][0];
			latSum += ring[i][1];
		}

		return [latSum / pointCount, lngSum / pointCount];
	}

	return null;
}

/**
 * Capitaliza la primera letra de un string
 */
function capitalizeFirstLetter(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convierte Feature de DB (con tipos en minúsculas) a formato estándar
 * @param dbFeature - Feature desde la base de datos con tipos en minúsculas
 * @returns Feature con tipos capitalizados correctamente
 */
export function normalizeFeature(dbFeature: any): GeoJSONFeature | null {
	if (!dbFeature || !dbFeature.geometry) return null;

	return {
		type: 'Feature',
		geometry: {
			type: capitalizeFirstLetter(dbFeature.geometry.type),
			coordinates: dbFeature.geometry.coordinates
		},
		properties: dbFeature.properties || {}
	};
}
