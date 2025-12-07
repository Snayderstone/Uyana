/**
 * Map Models
 * ----------
 * Modelos utilizados para mapas (heatmap, clusters, grafos, etc.)
 */

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

export type ProjectMapModel = {
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
