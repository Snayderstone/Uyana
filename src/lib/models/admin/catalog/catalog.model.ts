/**
 * Admin Module - Catalog Models
 * ------------------------------
 * Entidades de catálogos y tablas de referencia.
 */

export interface Estado {
	id: number;
	nombre: string;
	descripcion?: string;
}

export interface Tipo {
	id: number;
	nombre: string;
	descripcion?: string;
}

export interface AreaConocimiento {
	id: number;
	nombre: string;
	descripcion?: string;
}

export interface LineaInvestigacion {
	id: number;
	nombre: string;
	descripcion?: string;
}

export interface Cargo {
	id: number;
	nombre: string;
	descripcion?: string;
}

export interface RegimenDedicacion {
	id: number;
	nombre: string;
	descripcion?: string;
}

export interface FuenteFinanciamiento {
	id: number;
	nombre: string;
	descripcion?: string;
}

export interface Institucion {
	id: number;
	nombre: string;
	sigla?: string;
	pais?: string;
	geometry?: any; // GeoJSON
}

export interface Facultad {
	id: number;
	institucion_id: number;
	nombre: string;
	sigla?: string;
	subdecano?: string;
	decano?: string;
	geometry?: any; // GeoJSON
}

export interface Carrera {
	id: number;
	facultad_id: number;
	nombre: string;
	geometry?: any; // GeoJSON
}
