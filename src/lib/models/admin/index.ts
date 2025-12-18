/**
 * Admin Module - Models Index
 * ----------------------------
 * Exporta todos los modelos y DTOs del módulo de administración.
 */

// Models
export * from './auth/user.model';
export * from './catalog/catalog.model';
export * from './projects/project.model';
export * from './participants/participant.model';
export * from './blog/blog.model';
export * from './graficosConfig/chart.model';
export * from './participants/dashboardParticipants.model';
export * from './projects/dashboardProjects';

// Geoespacial models with renamed exports to avoid conflicts
export type {
	GeoJSONPointCoordinates,
	GeoJSONPolygonCoordinates,
	GeoJSONPoint,
	GeoJSONPolygon,
	GeoJSONFeature,
	GeoJSONGeometry,
	Institucion as InstitucionGeo,
	Facultad as FacultadGeo,
	Carrera as CarreraGeo,
	InstitucionConFacultades,
	FacultadConCarreras,
	CarreraConRelaciones
} from './geoespacial/geoespacial.model';

// DTOs
export * from './projects/project.dto';
export * from './participants/participant.dto';
export * from './blog/blog.dto';
export * from './catalog/common.dto';
export * from './geoespacial/geoespacial.dto';
