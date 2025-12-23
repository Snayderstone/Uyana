/**
 * Map Models
 * ----------
 * Modelos utilizados para mapas (heatmap, clusters, grafos, etc.)
 */
// src/lib/models/map.model.ts
export type MapLevel = 'institution' | 'faculty';

export interface ProjectMapModel {
  id: number;          // id de la institución o facultad
  titulo: string;      // nombre de la institución o facultad
  geometry: any;       // jsonb de la columna geometry (GeoJSON)
  projectCount: number;
  level: MapLevel;     // 'institution' o 'faculty'
}


export type MapPoint = {
    lat: number;
    lng: number;
    weight?: number;
    label?: string;
};

export type MapRegion = {
    id: number;
    name: string;
    geometry: any; // GeoJSON
    projectCount?: number;
};

export type ProjectMapModel2 = {
  id: number;
  titulo: string;

  // Geometría de institución o facultad
  geometry:
    | GeoJSON.Polygon
    | GeoJSON.MultiPolygon
    | GeoJSON.Point
    | null;

  // Para heatmap
  weight?: number;

  // Para cluster o nodos
  info?: {
    institucion?: string;
    facultad?: string;
    count?: number;
  };
};

export interface TimelinePoint {
	date: Date;
	value: number;
	meta?: any; // proyectos, presupuesto, etc
}
