// src/lib/db/map-participants.repository.ts
import { supabase } from './supabase.client';
import type { MapParticipantDbRow } from '$lib/models/map-participants.model';

/**
 * Repositorio especializado para el mapa de participantes.
 *
 * Importante:
 * - NO usa vistas (vw_*), sólo tablas base.
 * - Devuelve una lista "plana" de participantes con su facultad e institución,
 *   lista para que el service construya filtros, stats y agregaciones.
 */
export class MapParticipantsRepository {
	/**
	 * Obtiene todos los participantes con su carrera, facultad e institución asociadas,
	 * incluyendo geometrías (jsonb) para facultades e instituciones.
	 *
	 * Dado que tenemos ~2755 participantes, es perfectamente razonable
	 * traerlos todos y agregar en el service en memoria.
	 */
	static async getParticipantsWithLocation(): Promise<MapParticipantDbRow[]> {
		const { data, error } = await supabase
			.from('participantes')
			.select(
				`
        id,
        nombre,
        email,
        genero,
        acreditado,
        carrera_id,
        carreras:carreras (
          id,
          nombre,
          facultad:facultades (
            id,
            nombre,
            sigla,
            geometry,
            institucion:instituciones (
              id,
              nombre,
              sigla,
              pais,
              geometry
            )
          )
        )
      `
			)
			.returns<
				{
					id: number;
					nombre: string;
					email: string | null;
					genero: string | null;
					acreditado: boolean | null;
					carrera_id: number;
					carreras: {
						id: number;
						nombre: string;
						facultad: {
							id: number;
							nombre: string;
							sigla: string | null;
							geometry: unknown | null;
							institucion: {
								id: number;
								nombre: string;
								sigla: string | null;
								pais: string | null;
								geometry: unknown | null;
							} | null;
						} | null;
					} | null;
				}[]
			>();

		if (error) {
			console.error('[MapParticipantsRepository] Error fetching participants with location', error);
			throw new Error(`Error al obtener participantes para el mapa: ${error.message}`);
		}

		if (!data) {
			return [];
		}

		// Normalizamos a MapParticipantDbRow (forma plana)
		const result: MapParticipantDbRow[] = data
			.map((row) => {
				const carrera = row.carreras;
				const facultad = carrera?.facultad ?? null;
				const institucion = facultad?.institucion ?? null;

				if (!carrera || !facultad || !institucion) {
					// En tu diagnóstico ya viste que NO hay huecos en las FK,
					// pero igual dejamos el guard por si acaso.
					return null;
				}

				const mapped: MapParticipantDbRow = {
					id: row.id,
					nombre: row.nombre,
					email: row.email,
					genero: row.genero,
					acreditado: row.acreditado,

					carreraId: carrera.id,
					carreraNombre: carrera.nombre,

					facultadId: facultad.id,
					facultadNombre: facultad.nombre,
					facultadSigla: facultad.sigla,
					facultadGeometry: facultad.geometry,

					institucionId: institucion.id,
					institucionNombre: institucion.nombre,
					institucionSigla: institucion.sigla,
					institucionPais: institucion.pais,
					institucionGeometry: institucion.geometry,

					// 🔥 Por ahora vacíos: luego los llenamos uniendo con proyectos
					cargos: [],
					regimenesDedicacion: [],
					areasConocimiento: [],
					lineasInvestigacion: [],
					tiposProyecto: [],
					estadosProyecto: []
				};

				return mapped;
			})
			.filter((row): row is MapParticipantDbRow => row !== null);

		return result;
	}
}
