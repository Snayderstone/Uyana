// src/lib/services/map-participants.service.ts
import { MapParticipantsRepository } from '$lib/db/map-participants.repository';
import type {
	MapParticipantDbRow,
	MapParticipantForUI,
	MapParticipantsDataResult,
	MapParticipantsFilterOption,
	MapParticipantsFilterOptions,
	MapParticipantsFilterState,
	MapParticipantsRegionAggregation,
	MapParticipantsStatsSummary
} from '$lib/models/map-participants.model';

/**
 * Servicio de alto nivel para el mapa de participantes.
 *
 * Responsabilidades:
 * - Orquestar la carga de participantes con su ubicación (facultad / institución).
 * - Aplicar filtros en memoria (dado que ~2755 filas es perfectamente manejable).
 * - Construir:
 *   - lista de participantes para la UI,
 *   - agregaciones para el coropleta (por facultad / institución),
 *   - stats globales,
 *   - opciones de filtros.
 *
 * Ahora ENRIQUECIDO con dimensiones de proyectos:
 * - cargos
 * - regimenesDedicacion
 * - areasConocimiento
 * - lineasInvestigacion
 * - tiposProyecto
 * - estadosProyecto
 *
 * OJO:
 * - Este servicio asume que MapParticipantDbRow ya trae estas dimensiones
 *   como arrays de string (cadenas únicas por participante).
 */
export class MapParticipantsService {
	/**
	 * Punto de entrada principal: devuelve todo lo que el mapa necesita
	 * en un solo payload.
	 */
	static async getMapParticipantsData(
		filterState: MapParticipantsFilterState = {}
	): Promise<MapParticipantsDataResult> {
		// 1) Cargamos participantes + instituciones en paralelo
		const [baseRows, allInstitutions] = await Promise.all([
			MapParticipantsRepository.getParticipantsWithLocation(),
			MapParticipantsRepository.getInstitutionsWithGeometry()
		]);

		console.log('[MapParticipantsService] baseRows =', baseRows.length, 'instituciones =', allInstitutions.length);

		// 2) Construimos opciones de filtros a partir del dataset completo
		//const filterOptions = this.buildFilterOptions(baseRows);
		const filterOptions = this.buildFilterOptions(baseRows, allInstitutions);

		// 3) Aplicamos filtros para quedarnos con los participantes visibles
		const filteredParticipantsRows = this.applyFilters(baseRows, filterState);

		// 4) Construimos la forma amigable para la UI (panel de detalle / dashboard)
		const participantsForUI = this.mapToUI(filteredParticipantsRows);

		// 5) Agregaciones para el coropleta
		const byFaculty = this.aggregateByFaculty(filteredParticipantsRows);
		const byInstitutionRaw = this.aggregateByInstitution(filteredParticipantsRows);

		// 👇 nuevo: rellenar con instituciones sin participantes (totalParticipants = 0)
		const byInstitution = this.mergeInstitutionsWithZeroParticipants(byInstitutionRaw, allInstitutions);


		// 6) Stats globales
		const stats = this.buildStatsSummary(baseRows, byFaculty, byInstitution);

		return {
			participants: participantsForUI,
			byFaculty,
			byInstitution,
			stats,
			filterOptions
		};
	}
	private static mergeInstitutionsWithZeroParticipants(
		aggregations: MapParticipantsRegionAggregation[],
		allInstitutions: { id: number; nombre: string; sigla: string | null; pais: string | null; geometry: unknown | null }[]
	): MapParticipantsRegionAggregation[] {
		const map = new Map<number, MapParticipantsRegionAggregation>();

		// Primero las instituciones que sí tienen participantes (según filtros)
		for (const agg of aggregations) {
			map.set(agg.regionId, { ...agg });
		}

		// Luego añadimos TODAS las instituciones del catálogo
		for (const inst of allInstitutions) {
			if (!map.has(inst.id)) {
				map.set(inst.id, {
					level: 'institution',
					regionId: inst.id,
					regionName: inst.nombre,
					regionSigla: inst.sigla ?? undefined,
					totalParticipants: 0,
					geometry: inst.geometry
				});
			} else {
				// Si ya existe por participantes, aseguramos que tenga geometry
				const agg = map.get(inst.id)!;
				if (agg.geometry == null) {
					agg.geometry = inst.geometry;
				}
			}
		}

		return Array.from(map.values());
	}

	// ---------------------------------------------------------------------
	// 2. Construcción de opciones de filtros
	// ---------------------------------------------------------------------

	private static buildFilterOptions(rows: MapParticipantDbRow[], allInstitutions: { id: number; nombre: string; sigla: string | null; pais: string | null; geometry: unknown | null }[]): MapParticipantsFilterOptions {
		const facultadesMap = new Map<number, MapParticipantsFilterOption & { count: number }>();
		const institucionesMap = new Map<number, MapParticipantsFilterOption & { count: number }>();
		const carrerasMap = new Map<number, MapParticipantsFilterOption & { count: number }>();
		const generosMap = new Map<string, MapParticipantsFilterOption & { count: number }>();
		const acreditadosMap = new Map<string, MapParticipantsFilterOption & { count: number }>();
		const paisesMap = new Map<string, MapParticipantsFilterOption & { count: number }>();

		const cargosMap = new Map<string, MapParticipantsFilterOption & { count: number }>();
		const regimenesMap = new Map<string, MapParticipantsFilterOption & { count: number }>();
		const areasMap = new Map<string, MapParticipantsFilterOption & { count: number }>();
		const lineasMap = new Map<string, MapParticipantsFilterOption & { count: number }>();
		const tiposMap = new Map<string, MapParticipantsFilterOption & { count: number }>();
		const estadosMap = new Map<string, MapParticipantsFilterOption & { count: number }>();

		for (const row of rows) {
			// Facultades
			if (!facultadesMap.has(row.facultadId)) {
				facultadesMap.set(row.facultadId, {
					value: String(row.facultadId),
					label: row.facultadNombre,
					count: 0
				});
			}
			facultadesMap.get(row.facultadId)!.count++;

			// Instituciones
			if (!institucionesMap.has(row.institucionId)) {
				institucionesMap.set(row.institucionId, {
					value: String(row.institucionId),
					label: row.institucionNombre,
					count: 0
				});
			}
			institucionesMap.get(row.institucionId)!.count++;

			// Carreras
			if (!carrerasMap.has(row.carreraId)) {
				carrerasMap.set(row.carreraId, {
					value: String(row.carreraId),
					label: row.carreraNombre,
					count: 0
				});
			}
			carrerasMap.get(row.carreraId)!.count++;

			// Géneros
			if (row.genero) {
				const key = row.genero.toLowerCase();
				if (!generosMap.has(key)) {
					generosMap.set(key, {
						value: key,
						label: key,
						count: 0
					});
				}
				generosMap.get(key)!.count++;
			}

			// Acreditado
			const acreditadoKey =
				row.acreditado === true ? 'acreditado' : row.acreditado === false ? 'no_acreditado' : 'sin_dato';
			if (!acreditadosMap.has(acreditadoKey)) {
				acreditadosMap.set(acreditadoKey, {
					value: acreditadoKey,
					label:
						acreditadoKey === 'acreditado'
							? 'Acreditado'
							: acreditadoKey === 'no_acreditado'
								? 'No acreditado'
								: 'Sin dato',
					count: 0
				});
			}
			acreditadosMap.get(acreditadoKey)!.count++;

			// País institución
			if (row.institucionPais) {
				const key = row.institucionPais;
				if (!paisesMap.has(key)) {
					paisesMap.set(key, {
						value: key,
						label: key,
						count: 0
					});
				}
				paisesMap.get(key)!.count++;
			}

			// -----------------------------
			// Dimensiones de proyectos
			// -----------------------------

			// Cargos
			for (const cargo of row.cargos ?? []) {
				const key = cargo;
				if (!cargosMap.has(key)) {
					cargosMap.set(key, {
						value: key,
						label: cargo,
						count: 0
					});
				}
				cargosMap.get(key)!.count++;
			}

			// Regímenes de dedicación
			for (const regimen of row.regimenesDedicacion ?? []) {
				const key = regimen;
				if (!regimenesMap.has(key)) {
					regimenesMap.set(key, {
						value: key,
						label: regimen,
						count: 0
					});
				}
				regimenesMap.get(key)!.count++;
			}

			// Áreas de conocimiento
			for (const area of row.areasConocimiento ?? []) {
				const key = area;
				if (!areasMap.has(key)) {
					areasMap.set(key, {
						value: key,
						label: area,
						count: 0
					});
				}
				areasMap.get(key)!.count++;
			}

			// Líneas de investigación
			for (const linea of row.lineasInvestigacion ?? []) {
				const key = linea;
				if (!lineasMap.has(key)) {
					lineasMap.set(key, {
						value: key,
						label: linea,
						count: 0
					});
				}
				lineasMap.get(key)!.count++;
			}

			// Tipos de proyecto
			for (const tipo of row.tiposProyecto ?? []) {
				const key = tipo;
				if (!tiposMap.has(key)) {
					tiposMap.set(key, {
						value: key,
						label: tipo,
						count: 0
					});
				}
				tiposMap.get(key)!.count++;
			}

			// Estados de proyecto
			for (const estado of row.estadosProyecto ?? []) {
				const key = estado;
				if (!estadosMap.has(key)) {
					estadosMap.set(key, {
						value: key,
						label: estado,
						count: 0
					});
				}
				estadosMap.get(key)!.count++;
			}
		}

		const sortByLabel = (a: MapParticipantsFilterOption, b: MapParticipantsFilterOption) =>
			a.label.localeCompare(b.label, 'es', { sensitivity: 'base' });

		return {
			facultades: Array.from(facultadesMap.values()).sort(sortByLabel),
			//instituciones: Array.from(institucionesMap.values()).sort(sortByLabel),
			instituciones: Array.from(institucionesMap.values()).sort(sortByLabel),
			carreras: Array.from(carrerasMap.values()).sort(sortByLabel),
			generos: Array.from(generosMap.values()).sort(sortByLabel),
			acreditados: Array.from(acreditadosMap.values()),
			paisesInstitucion: Array.from(paisesMap.values()).sort(sortByLabel),

			cargos: Array.from(cargosMap.values()).sort(sortByLabel),
			regimenesDedicacion: Array.from(regimenesMap.values()).sort(sortByLabel),
			areasConocimiento: Array.from(areasMap.values()).sort(sortByLabel),
			lineasInvestigacion: Array.from(lineasMap.values()).sort(sortByLabel),
			tiposProyecto: Array.from(tiposMap.values()).sort(sortByLabel),
			estadosProyecto: Array.from(estadosMap.values()).sort(sortByLabel)
		};
	}

	// ---------------------------------------------------------------------
	// 3. Aplicar filtros sobre las filas base
	// ---------------------------------------------------------------------

	private static applyFilters(
		rows: MapParticipantDbRow[],
		filterState: MapParticipantsFilterState
	): MapParticipantDbRow[] {
		const {
			searchText,
			facultadIds,
			institucionIds,
			carreraIds,
			generos,
			acreditado,
			paisesInstitucion,
			cargos,
			regimenesDedicacion,
			areasConocimiento,
			lineasInvestigacion,
			tiposProyecto,
			estadosProyecto
		} = filterState;

		return rows.filter((row) => {
			// Texto libre: buscamos en nombre, email, carrera, facultad, institución
			if (searchText && searchText.trim().length > 0) {
				const q = searchText.trim().toLowerCase();
				const hayCoincidencia =
					row.nombre.toLowerCase().includes(q) ||
					(row.email ?? '').toLowerCase().includes(q) ||
					row.carreraNombre.toLowerCase().includes(q) ||
					row.facultadNombre.toLowerCase().includes(q) ||
					row.institucionNombre.toLowerCase().includes(q);

				if (!hayCoincidencia) return false;
			}

			// Facultades
			if (facultadIds && facultadIds.length > 0 && !facultadIds.includes(row.facultadId)) {
				return false;
			}

			// Instituciones
			if (institucionIds && institucionIds.length > 0 && !institucionIds.includes(row.institucionId)) {
				return false;
			}

			// Carreras
			if (carreraIds && carreraIds.length > 0 && !carreraIds.includes(row.carreraId)) {
				return false;
			}

			// Géneros
			if (generos && generos.length > 0) {
				const generoKey = row.genero ? row.genero.toLowerCase() : '';
				if (!generos.map((g) => g.toLowerCase()).includes(generoKey)) {
					return false;
				}
			}

			// Acreditado
			if (acreditado !== undefined && acreditado !== null) {
				if (row.acreditado !== acreditado) return false;
			}

			// País institución
			if (paisesInstitucion && paisesInstitucion.length > 0) {
				if (!row.institucionPais || !paisesInstitucion.includes(row.institucionPais)) {
					return false;
				}
			}

			// -----------------------------
			// Filtros de proyectos
			// -----------------------------

			// Cargos (al menos uno en común)
			if (cargos && cargos.length > 0) {
				const rowCargos = row.cargos ?? [];
				if (!rowCargos.some((c) => cargos.includes(c))) {
					return false;
				}
			}

			// Regímenes de dedicación
			if (regimenesDedicacion && regimenesDedicacion.length > 0) {
				const rowRegs = row.regimenesDedicacion ?? [];
				if (!rowRegs.some((r) => regimenesDedicacion.includes(r))) {
					return false;
				}
			}

			// Áreas de conocimiento
			if (areasConocimiento && areasConocimiento.length > 0) {
				const rowAreas = row.areasConocimiento ?? [];
				if (!rowAreas.some((a) => areasConocimiento.includes(a))) {
					return false;
				}
			}

			// Líneas de investigación
			if (lineasInvestigacion && lineasInvestigacion.length > 0) {
				const rowLineas = row.lineasInvestigacion ?? [];
				if (!rowLineas.some((l) => lineasInvestigacion.includes(l))) {
					return false;
				}
			}

			// Tipos de proyecto
			if (tiposProyecto && tiposProyecto.length > 0) {
				const rowTipos = row.tiposProyecto ?? [];
				if (!rowTipos.some((t) => tiposProyecto.includes(t))) {
					return false;
				}
			}

			// Estados de proyecto
			if (estadosProyecto && estadosProyecto.length > 0) {
				const rowEstados = row.estadosProyecto ?? [];
				if (!rowEstados.some((e) => estadosProyecto.includes(e))) {
					return false;
				}
			}

			return true;
		});
	}

	// ---------------------------------------------------------------------
	// 4. Mapeo a modelo para UI
	// ---------------------------------------------------------------------

	private static mapToUI(rows: MapParticipantDbRow[]): MapParticipantForUI[] {
		return rows.map((row) => ({
			id: row.id,
			nombre: row.nombre,
			email: row.email,
			genero: row.genero,
			acreditado: row.acreditado,

			carreraNombre: row.carreraNombre,
			facultadId: row.facultadId,
			facultadNombre: row.facultadNombre,
			institucionId: row.institucionId,
			institucionNombre: row.institucionNombre,

			// Ahora propagamos las dimensiones de proyectos
			cargos: row.cargos ?? [],
			regimenesDedicacion: row.regimenesDedicacion ?? [],
			areasConocimiento: row.areasConocimiento ?? [],
			lineasInvestigacion: row.lineasInvestigacion ?? [],
			tiposProyecto: row.tiposProyecto ?? [],
			estadosProyecto: row.estadosProyecto ?? []
		}));
	}

	// ---------------------------------------------------------------------
	// 5. Agregaciones para el coropleta
	// ---------------------------------------------------------------------

	private static aggregateByFaculty(rows: MapParticipantDbRow[]): MapParticipantsRegionAggregation[] {
		const map = new Map<
			number,
			MapParticipantsRegionAggregation & {
				totalFemale: number;
				totalMale: number;
				totalAccredited: number;
			}
		>();

		for (const row of rows) {
			if (!map.has(row.facultadId)) {
				map.set(row.facultadId, {
					level: 'faculty',
					regionId: row.facultadId,
					regionName: row.facultadNombre,
					regionSigla: row.facultadSigla ?? undefined,
					totalParticipants: 0,
					totalFemale: 0,
					totalMale: 0,
					totalAccredited: 0,
					geometry: row.facultadGeometry
				});
			}

			const agg = map.get(row.facultadId)!;
			agg.totalParticipants++;

			const genero = row.genero?.toLowerCase();
			if (genero === 'f') agg.totalFemale++;
			if (genero === 'm') agg.totalMale++;

			if (row.acreditado === true) {
				agg.totalAccredited++;
			}
		}

		return Array.from(map.values()).map((agg) => ({
			level: agg.level,
			regionId: agg.regionId,
			regionName: agg.regionName,
			regionSigla: agg.regionSigla,
			totalParticipants: agg.totalParticipants,
			totalFemale: agg.totalFemale,
			totalMale: agg.totalMale,
			totalAccredited: agg.totalAccredited,
			geometry: agg.geometry
		}));
	}

	private static aggregateByInstitution(rows: MapParticipantDbRow[]): MapParticipantsRegionAggregation[] {
		const map = new Map<
			number,
			MapParticipantsRegionAggregation & {
				totalFemale: number;
				totalMale: number;
				totalAccredited: number;
			}
		>();

		for (const row of rows) {
			if (!map.has(row.institucionId)) {
				map.set(row.institucionId, {
					level: 'institution',
					regionId: row.institucionId,
					regionName: row.institucionNombre,
					regionSigla: row.institucionSigla ?? undefined,
					totalParticipants: 0,
					totalFemale: 0,
					totalMale: 0,
					totalAccredited: 0,
					geometry: row.institucionGeometry
				});
			}

			const agg = map.get(row.institucionId)!;
			agg.totalParticipants++;

			const genero = row.genero?.toLowerCase();
			if (genero === 'f') agg.totalFemale++;
			if (genero === 'm') agg.totalMale++;

			if (row.acreditado === true) {
				agg.totalAccredited++;
			}
		}

		return Array.from(map.values()).map((agg) => ({
			level: agg.level,
			regionId: agg.regionId,
			regionName: agg.regionName,
			regionSigla: agg.regionSigla,
			totalParticipants: agg.totalParticipants,
			totalFemale: agg.totalFemale,
			totalMale: agg.totalMale,
			totalAccredited: agg.totalAccredited,
			geometry: agg.geometry
		}));
	}

	// ---------------------------------------------------------------------
	// 6. Stats globales
	// ---------------------------------------------------------------------

	private static buildStatsSummary(
		allRows: MapParticipantDbRow[],
		byFaculty: MapParticipantsRegionAggregation[],
		byInstitution: MapParticipantsRegionAggregation[]
	): MapParticipantsStatsSummary {
		const totalParticipants = allRows.length;

		const totalFacultadesConParticipantes = byFaculty.length;
		const totalInstitucionesConParticipantes = byInstitution.length;
		//const totalInstitucionesConParticipantes = byInstitution.filter((i) => i.totalParticipants > 0).length;

		const facultadCounts = byFaculty.map((f) => f.totalParticipants);
		const institucionCounts = byInstitution.map((i) => i.totalParticipants);

		const minPorFacultad = facultadCounts.length > 0 ? Math.min(...facultadCounts) : undefined;
		const maxPorFacultad = facultadCounts.length > 0 ? Math.max(...facultadCounts) : undefined;

		const minPorInstitucion = institucionCounts.length > 0 ? Math.min(...institucionCounts) : undefined;
		const maxPorInstitucion = institucionCounts.length > 0 ? Math.max(...institucionCounts) : undefined;

		const stats: MapParticipantsStatsSummary = {
			totalParticipants,
			totalFacultadesConParticipantes,
			totalInstitucionesConParticipantes,
			minPorFacultad,
			maxPorFacultad,
			minPorInstitucion,
			maxPorInstitucion
		};

		return stats;
	}
}
