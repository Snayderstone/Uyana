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
