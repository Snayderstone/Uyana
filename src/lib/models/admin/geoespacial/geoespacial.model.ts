/**
 * Modelos para el módulo de gestión geoespacial
 */

// Tipos GeoJSON
export type GeoJSONPointCoordinates = [number, number]; // [lng, lat]
export type GeoJSONPolygonCoordinates = [number, number][][]; // array de anillos

export interface GeoJSONPoint {
	type: 'Point' | 'point';
	coordinates: GeoJSONPointCoordinates;
}

export interface GeoJSONPolygon {
	type: 'Polygon' | 'polygon';
	coordinates: GeoJSONPolygonCoordinates;
}

// Feature GeoJSON (formato completo)
export interface GeoJSONFeature {
	type: 'Feature' | 'feature';
	geometry: {
		type: 'Point' | 'point' | 'Polygon' | 'polygon';
		coordinates: GeoJSONPointCoordinates | GeoJSONPolygonCoordinates;
	};
	properties: Record<string, any>;
}

export type GeoJSONGeometry = GeoJSONPoint | GeoJSONPolygon | GeoJSONFeature | null;

// Modelo de Institución
export interface Institucion {
	id: number;
	nombre: string;
	sigla: string | null;
	pais: string | null;
	geometry: GeoJSONGeometry;
}

// Modelo de Facultad
export interface Facultad {
	id: number;
	institucion_id: number;
	nombre: string;
	sigla: string | null;
	decano: string | null;
	subdecano: string | null;
	geometry: GeoJSONGeometry;
}

// Modelo de Carrera
export interface Carrera {
	id: number;
	facultad_id: number;
	nombre: string;
	geometry: GeoJSONGeometry;
}

// Modelos con relaciones para vistas
export interface InstitucionConFacultades extends Institucion {
	facultades?: Facultad[];
}

export interface FacultadConCarreras extends Facultad {
	carreras?: Carrera[];
	institucion_nombre?: string;
}

export interface CarreraConRelaciones extends Carrera {
	facultad_nombre?: string;
	institucion_nombre?: string;
}
