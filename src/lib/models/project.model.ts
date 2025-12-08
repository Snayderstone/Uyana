/**
 * Project Model
 * -------------
 * Modelo limpio para representar un proyecto dentro de la aplicación.
 * NO sigue el esquema de la base de datos — está optimizado para la UI.
 */

export type ProjectModel = {
  id: number;
  codigo: string;
  titulo: string;
  objetivo: string;

  estado: {
    id: number;
    nombre: string;
  };

  instituciones: InstitutionModel[];
  facultades: FacultyModel[];
  areas: AreaModel[];
  lineas: LineModel[];
  tipos: TypeModel[];
  fuentesFinanciamiento: FundingModel[];

  participantes: ParticipantModel[];

  fechas: {
    inicioPlaneado: string | null;
    finPlaneado: string | null;
    finReal: string | null;
  };

  presupuesto: number | null;

  impactos: {
    cientifico: string | null;
    economico: string | null;
    social: string | null;
    otros: string | null;
  };
};

/**
 * Project Models
 * --------------
 * Modelos usados en mapas (ligeros) y dashboards (completos).
 */

export type MapLevel = 'institution' | 'faculty';

/** Modelo ligero para mapa */
export interface ProjectMapModel {
  id: number;                     // institución o facultad
  titulo: string;
  geometry: any;                  // GeoJSON
  projectCount: number;
  level: MapLevel;
}

/** Modelo ULTRA completo para dashboards */
export interface ProjectFullModel {
  id: number;
  codigo: string;
  titulo: string;
  objetivo: string;

  estado_id: number | null;
  fecha_inicio_planeada: string | null;
  fecha_fin_planeada: string | null;
  fecha_fin_real: string | null;

  cantidad_meses: number | null;
  porcentaje_avance: number | null;

  impacto_cientifico: string | null;
  impacto_economico: string | null;
  impacto_social: string | null;
  otros_impactos: string | null;

  monto_presupuesto_total: number | null;
  requiere_aval: boolean | null;

  instituciones: number[];
  facultades: number[];
  carreras: number[];
  participantes: number[];
  areas: number[];
  lineas: number[];
  tipos: number[];
  financiamiento: number[];
}

