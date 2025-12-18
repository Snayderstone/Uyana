/**
 * DTOs para el módulo de gestión geoespacial
 */

import type { GeoJSONGeometry } from './geoespacial.model';

// DTOs para crear entidades
export interface CreateInstitucionDTO {
	nombre: string;
	sigla?: string | null;
	pais?: string | null;
	geometry?: GeoJSONGeometry;
}

export interface CreateFacultadDTO {
	institucion_id: number;
	nombre: string;
	sigla?: string | null;
	decano?: string | null;
	subdecano?: string | null;
	geometry?: GeoJSONGeometry;
}

export interface CreateCarreraDTO {
	facultad_id: number;
	nombre: string;
	geometry?: GeoJSONGeometry;
}

// DTOs para actualizar entidades
export interface UpdateInstitucionDTO {
	nombre?: string;
	sigla?: string | null;
	pais?: string | null;
	geometry?: GeoJSONGeometry;
}

export interface UpdateFacultadDTO {
	institucion_id?: number;
	nombre?: string;
	sigla?: string | null;
	decano?: string | null;
	subdecano?: string | null;
	geometry?: GeoJSONGeometry;
}

export interface UpdateCarreraDTO {
	facultad_id?: number;
	nombre?: string;
	geometry?: GeoJSONGeometry;
}

// Validación de geometrías
export function validateGeoJSON(geometry: any): GeoJSONGeometry {
	if (!geometry) return null;

	// Normalizar tipo a minúsculas para comparación
	const geoType = geometry.type?.toLowerCase();

	// Si es un Feature, validar su geometría interna
	if (geoType === 'feature') {
		if (!geometry.geometry) {
			throw new Error('Feature debe contener una geometría');
		}

		const validatedGeometry = validateGeoJSON(geometry.geometry);
		if (!validatedGeometry) {
			throw new Error('Geometría del Feature inválida');
		}

		return {
			type: 'feature',
			geometry: {
				type: geometry.geometry.type.toLowerCase(),
				coordinates: (validatedGeometry as any).coordinates
			},
			properties: geometry.properties || {}
		};
	}

	// Validar geometría directa (Point o Polygon)
	if (geoType === 'point') {
		const coords = geometry.coordinates;
		if (!Array.isArray(coords) || coords.length !== 2) {
			throw new Error('Point debe tener exactamente 2 coordenadas [lng, lat]');
		}
		const [lng, lat] = coords;
		if (typeof lng !== 'number' || typeof lat !== 'number') {
			throw new Error('Las coordenadas deben ser números');
		}
		if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
			throw new Error('Coordenadas fuera de rango válido');
		}
		return { type: 'point', coordinates: [lng, lat] };
	}

	if (geoType === 'polygon') {
		const coords = geometry.coordinates;
		if (!Array.isArray(coords) || coords.length === 0) {
			throw new Error('Polygon debe tener al menos un anillo de coordenadas');
		}
		// Validar cada anillo
		for (const ring of coords) {
			if (!Array.isArray(ring) || ring.length < 4) {
				throw new Error('Cada anillo del polígono debe tener al menos 4 puntos');
			}
			// Validar que el primer y último punto sean iguales
			const first = ring[0];
			const last = ring[ring.length - 1];
			if (first[0] !== last[0] || first[1] !== last[1]) {
				throw new Error('El primer y último punto del anillo deben ser iguales');
			}
		}
		return { type: 'polygon', coordinates: coords };
	}

	throw new Error('Tipo de geometría no soportado. Solo Point, Polygon y Feature son válidos');
}
