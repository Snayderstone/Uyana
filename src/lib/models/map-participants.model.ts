// src/lib/models/map-participants.model.ts
import type { MapLevel } from './map.model';

/**
 * Fila "plana" de participante que usaremos como base para:
 * - construir filtros
 * - agrupar por facultad / institución
 * - alimentar el mapa de participantes
 *
 * Además, ya dejamos listos los campos de dimensiones de proyecto,
 * que por ahora pueden venir vacíos ([]) hasta que el repo los alimente.
 */
export interface MapParticipantDbRow {
	id: number;
	nombre: string;
	email: string | null;
	genero: string | null;
	acreditado: boolean | null;

	// Carrera
	carreraId: number;
	carreraNombre: string;

	// Facultad
	facultadId: number;
	facultadNombre: string;
	facultadSigla: string | null;
	facultadGeometry: unknown | null; // jsonb (GeoJSON)

	// Institución (a través de la facultad)
	institucionId: number;
	institucionNombre: string;
	institucionSigla: string | null;
	institucionPais: string | null;
	institucionGeometry: unknown | null; // jsonb (GeoJSON)

	// 🔥 Dimensiones de proyectos (por ahora opcionales, se llenan después)
	cargos?: string[];
	regimenesDedicacion?: string[];
	areasConocimiento?: string[];
	lineasInvestigacion?: string[];
	tiposProyecto?: string[];
	estadosProyecto?: string[];
}

/**
 * Nivel de agregación: por facultad o por institución.
 * (Reutiliza MapLevel de map.model.ts)
 */
export type MapParticipantsRegionLevel = MapLevel; // 'faculty' | 'institution'

/**
 * Agregación por región (facultad / institución) para el coropleta.
 * Aquí solo van métricas que realmente usará el mapa.
 */
export interface MapParticipantsRegionAggregation {
	level: MapParticipantsRegionLevel;
	regionId: number;
	regionName: string;
	// opcionalmente podrías usar sigla si quieres tooltip más corto
	regionSigla?: string | null;

	// Para pintar el mapa
	totalParticipants: number;

	// Métricas extra que pueden servir en tooltips / stats
	totalFemale?: number;
	totalMale?: number;
	totalAccredited?: number;
}

/**
 * Resumen global para la cajita de estadísticas del mapa.
 */
export interface MapParticipantsStatsSummary {
	totalParticipants: number;
	totalFacultadesConParticipantes: number;
	totalInstitucionesConParticipantes: number;

	minPorFacultad?: number;
	maxPorFacultad?: number;

	minPorInstitucion?: number;
	maxPorInstitucion?: number;
}

/**
 * Opción genérica de filtro (valor, etiqueta y conteo).
 */
export interface MapParticipantsFilterOption {
	value: string;
	label: string;
	count?: number;
}

/**
 * Conjunto de TODAS las dimensiones de filtro que queremos soportar.
 */
export interface MapParticipantsFilterOptions {
	// Ubicación académica / geográfica
	facultades: MapParticipantsFilterOption[];
	instituciones: MapParticipantsFilterOption[];
	carreras: MapParticipantsFilterOption[];

	// Persona
	generos: MapParticipantsFilterOption[];
	acreditados: MapParticipantsFilterOption[];

	// Rol / dedicación dentro de proyectos
	cargos: MapParticipantsFilterOption[];
	regimenesDedicacion: MapParticipantsFilterOption[];

	// Dimensiones de investigación (a partir de proyectos)
	areasConocimiento: MapParticipantsFilterOption[];
	lineasInvestigacion: MapParticipantsFilterOption[];
	tiposProyecto: MapParticipantsFilterOption[];
	estadosProyecto: MapParticipantsFilterOption[];

	// Extras
	paisesInstitucion: MapParticipantsFilterOption[];
}

/**
 * Estado de filtros seleccionados.
 */
export interface MapParticipantsFilterState {
	searchText?: string;

	facultadIds?: number[];
	institucionIds?: number[];
	carreraIds?: number[];

	generos?: string[];
	acreditado?: boolean | null; // null = todos

	cargos?: string[];
	regimenesDedicacion?: string[];

	areasConocimiento?: string[];
	lineasInvestigacion?: string[];
	tiposProyecto?: string[];
	estadosProyecto?: string[];

	paisesInstitucion?: string[];
}

/**
 * Resultado “listo para el front”.
 */
export interface MapParticipantForUI {
	id: number;
	nombre: string;
	email: string | null;
	genero: string | null;
	acreditado: boolean | null;

	carreraNombre: string;
	facultadId: number;
	facultadNombre: string;
	institucionId: number;
	institucionNombre: string;

	// Dimensiones de proyectos (para detalle / dashboard)
	cargos?: string[];
	regimenesDedicacion?: string[];
	areasConocimiento?: string[];
	lineasInvestigacion?: string[];
	tiposProyecto?: string[];
	estadosProyecto?: string[];
}

/**
 * Payload completo que devuelve el service.
 */
export interface MapParticipantsDataResult {
	participants: MapParticipantForUI[];
	byFaculty: MapParticipantsRegionAggregation[];
	byInstitution: MapParticipantsRegionAggregation[];
	stats: MapParticipantsStatsSummary;
	filterOptions: MapParticipantsFilterOptions;
}