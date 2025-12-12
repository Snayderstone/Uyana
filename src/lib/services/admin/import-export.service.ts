/**
 * Admin Module - Import/Export Service
 * -------------------------------------
 * Servicio para importar y exportar proyectos desde/hacia Excel y CSV.
 */

import type { ImportProyectoRowDTO, ImportResultDTO } from '$lib/models/admin/dtos';
import { AdminProjectsService } from './projects.service';
import { AdminParticipantsService } from './participants.service';
import {
	AdminEstadosRepository,
	AdminTiposRepository,
	AdminAreasRepository,
	AdminLineasRepository,
	AdminFuentesRepository,
	AdminInstitucionesRepository,
	AdminFacultadesRepository,
	AdminCarrerasRepository,
	AdminCargosRepository,
	AdminRegimenesRepository
} from '$lib/db/admin/catalogs.repository';

export const AdminImportExportService = {
	/**
	 * Parsear valor de geometría desde string JSON
	 */
	parseGeometry(geometryStr?: string): any {
		if (!geometryStr) return null;
		try {
			return JSON.parse(geometryStr);
		} catch (e) {
			console.error('Error al parsear geometría:', e);
			return null;
		}
	},

	/**
	 * Normalizar valor booleano desde string
	 */
	parseBoolean(value?: string): boolean {
		if (!value) return false;
		const normalized = value.toLowerCase().trim();
		return (
			normalized === 'true' || normalized === 'sí' || normalized === 'si' || normalized === '1'
		);
	},

	/**
	 * Obtener o crear catálogo por nombre
	 */
	async getOrCreateCatalogItem<T extends { id: number; nombre: string }>(
		repository: {
			getAll: () => Promise<T[]>;
			create: (item: Omit<T, 'id'>) => Promise<T | null>;
		},
		nombre: string
	): Promise<number | null> {
		if (!nombre?.trim()) return null;

		// Buscar existente
		const items = await repository.getAll();
		const existing = items.find(
			(item) => item.nombre.toLowerCase() === nombre.toLowerCase().trim()
		);
		if (existing) return existing.id;

		// Crear nuevo
		const newItem = await repository.create({ nombre: nombre.trim() } as any);
		return newItem?.id || null;
	},

	/**
	 * Obtener o crear institución
	 */
	async getOrCreateInstitution(
		nombre: string,
		sigla?: string,
		pais?: string,
		geometry?: string
	): Promise<number | null> {
		if (!nombre?.trim()) return null;

		const existing = await AdminInstitucionesRepository.getByName(nombre.trim());
		if (existing) return existing.id;

		const newInst = await AdminInstitucionesRepository.create({
			nombre: nombre.trim(),
			sigla: sigla?.trim(),
			pais: pais?.trim(),
			geometry: this.parseGeometry(geometry)
		});

		return newInst?.id || null;
	},

	/**
	 * Obtener o crear facultad
	 */
	async getOrCreateFaculty(
		nombre: string,
		institucionId: number,
		sigla?: string,
		decano?: string,
		subdecano?: string,
		geometry?: string
	): Promise<number | null> {
		if (!nombre?.trim()) return null;

		const existing = await AdminFacultadesRepository.getByName(nombre.trim());
		if (existing) return existing.id;

		const newFac = await AdminFacultadesRepository.create({
			nombre: nombre.trim(),
			institucion_id: institucionId,
			sigla: sigla?.trim(),
			decano: decano?.trim(),
			subdecano: subdecano?.trim(),
			geometry: this.parseGeometry(geometry)
		});

		return newFac?.id || null;
	},

	/**
	 * Obtener o crear carrera
	 */
	async getOrCreateCareer(
		nombre: string,
		facultadId: number,
		geometry?: string
	): Promise<number | null> {
		if (!nombre?.trim()) return null;

		const existing = await AdminCarrerasRepository.getByName(nombre.trim());
		if (existing) return existing.id;

		const newCar = await AdminCarrerasRepository.create({
			nombre: nombre.trim(),
			facultad_id: facultadId,
			geometry: this.parseGeometry(geometry)
		});

		return newCar?.id || null;
	},

	/**
	 * Procesar una fila de importación
	 */
	async processImportRow(
		row: ImportProyectoRowDTO,
		rowIndex: number
	): Promise<{
		success: boolean;
		error?: string;
	}> {
		try {
			// 1. Obtener o crear catálogos básicos
			const [estadoId, tipoId, areaId, lineaId, cargoId, regimenId, fuenteId] = await Promise.all([
				this.getOrCreateCatalogItem(AdminEstadosRepository, row.estado),
				this.getOrCreateCatalogItem(AdminTiposRepository, row.tipo_proyecto),
				this.getOrCreateCatalogItem(AdminAreasRepository, row.area_conocimiento),
				this.getOrCreateCatalogItem(AdminLineasRepository, row.linea_investigacion),
				this.getOrCreateCatalogItem(AdminCargosRepository, row.cargo_dentro_del_proyecto),
				this.getOrCreateCatalogItem(AdminRegimenesRepository, row.tiempo_dedicacion_en_el_proyecto),
				this.getOrCreateCatalogItem(AdminFuentesRepository, row.tipo_presupuesto)
			]);

			if (!estadoId || !tipoId || !areaId || !lineaId) {
				return {
					success: false,
					error: 'Error al procesar catálogos básicos'
				};
			}

			// 2. Obtener o crear institución
			const institucionId = await this.getOrCreateInstitution(
				row.institucion_encargada_del_proyecto,
				row.sigla_institucion,
				row.pais_institucion,
				row.geometria_institucion
			);

			if (!institucionId) {
				return { success: false, error: 'Error al procesar institución' };
			}

			// 3. Obtener o crear facultad
			const facultadId = await this.getOrCreateFaculty(
				row.facultad_participante,
				institucionId,
				row.sigla_facultad,
				row.decano_facultad,
				row.subdecano_facultad,
				row.geometria_facultad
			);

			if (!facultadId) {
				return { success: false, error: 'Error al procesar facultad' };
			}

			// 4. Obtener o crear carrera
			const carreraId = await this.getOrCreateCareer(
				row.carrera_participante,
				facultadId,
				row.geometria_carrera
			);

			if (!carreraId) {
				return { success: false, error: 'Error al procesar carrera' };
			}

			// 5. Obtener o crear participante
			let participanteId: number | null = null;
			if (row.correo_electronico_participante) {
				const existingParticipant = await AdminParticipantsService.listParticipants(1, 1, {
					email: row.correo_electronico_participante
				});

				if (existingParticipant.data.length > 0) {
					participanteId = existingParticipant.data[0].id;
				} else {
					const newParticipant = await AdminParticipantsService.createParticipant({
						nombre: row.nombre_participante,
						email: row.correo_electronico_participante,
						genero: row.genero_participante,
						carrera_id: carreraId,
						url_foto: row.foto_url_participante,
						acreditado: this.parseBoolean(row.investigador_acreditado),
						redes_sociales: row.redes_participante
					});

					participanteId = newParticipant?.id || null;
				}
			}

			// 6. Verificar si el proyecto ya existe
			const existingProject = await AdminProjectsService.listProjects(1, 1, {
				codigo: row.codigo_proyecto
			});

			if (existingProject.data.length > 0) {
				// Proyecto ya existe, solo actualizar relaciones si es necesario
				return { success: true };
			}

			// 7. Crear proyecto
			const proyectoData = {
				codigo: row.codigo_proyecto,
				titulo: row.titulo_proyecto,
				objetivo: row.objetivo,
				estado_id: estadoId,
				requiere_aval: this.parseBoolean(row.requiere_aval),
				fecha_inicio_planeada: row.fecha_inicio,
				fecha_fin_planeada: row.fecha_fin,
				fecha_fin_real: row.fecha_real_finalizacion,
				cantidad_meses: row.meses,
				porcentaje_avance: row.avance,
				monto_presupuesto_total: row.presupuesto,
				impacto_cientifico: row.impacto_cientifico,
				impacto_economico: row.impacto_economico,
				impacto_social: row.impacto_social,
				otros_impactos: row.otros_impactos,
				para_siies: this.parseBoolean(row.proyecto_para_siies),
				instituciones_ids: [institucionId],
				tipos_ids: [tipoId],
				areas_conocimiento_ids: [areaId],
				lineas_investigacion_ids: [lineaId],
				fuentes_financiamiento_ids: fuenteId ? [fuenteId] : [],
				participantes:
					participanteId && cargoId && regimenId
						? [
								{
									participante_id: participanteId,
									cargo_id: cargoId,
									regimen_dedicacion_id: regimenId
								}
						  ]
						: []
			};

			const proyecto = await AdminProjectsService.createProject(proyectoData);

			if (!proyecto) {
				return { success: false, error: 'Error al crear el proyecto' };
			}

			return { success: true };
		} catch (error) {
			console.error(`Error procesando fila ${rowIndex}:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Error desconocido'
			};
		}
	},

	/**
	 * Importar proyectos desde datos parseados
	 */
	async importProjects(rows: ImportProyectoRowDTO[]): Promise<ImportResultDTO> {
		const result: ImportResultDTO = {
			success: true,
			imported_count: 0,
			failed_count: 0,
			errors: [],
			warnings: []
		};

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const rowNumber = i + 2; // +2 porque empieza en 1 y hay header

			// Validar campos obligatorios
			if (!row.codigo_proyecto?.trim()) {
				result.failed_count++;
				result.errors.push({
					row: rowNumber,
					message: 'El código del proyecto es obligatorio',
					data: row
				});
				continue;
			}

			if (!row.titulo_proyecto?.trim()) {
				result.failed_count++;
				result.errors.push({
					row: rowNumber,
					message: 'El título del proyecto es obligatorio',
					data: row
				});
				continue;
			}

			// Procesar la fila
			const processResult = await this.processImportRow(row, rowNumber);

			if (processResult.success) {
				result.imported_count++;
			} else {
				result.failed_count++;
				result.errors.push({
					row: rowNumber,
					message: processResult.error || 'Error desconocido',
					data: row
				});
			}
		}

		result.success = result.failed_count === 0;

		return result;
	},

	/**
	 * Exportar proyectos a formato plano para Excel/CSV
	 */
	async exportProjects(projectIds?: number[]): Promise<any[]> {
		// Obtener proyectos
		let projects;
		if (projectIds && projectIds.length > 0) {
			projects = await Promise.all(projectIds.map((id) => AdminProjectsService.getProjectById(id)));
		} else {
			const result = await AdminProjectsService.listProjects(1, 10000); // Obtener todos
			projects = result.data;
		}

		// Convertir a formato plano
		const exportData: any[] = [];

		for (const proyecto of projects) {
			if (!proyecto) continue;

			// Si el proyecto tiene participantes, crear una fila por participante
			if (proyecto.participantes && proyecto.participantes.length > 0) {
				for (const participante of proyecto.participantes) {
					exportData.push({
						codigo_proyecto: proyecto.codigo,
						proyecto_para_siies: proyecto.para_siies ? 'Sí' : 'No',
						titulo_proyecto: proyecto.titulo,
						tipo_proyecto: proyecto.tipos.map((t) => t.nombre).join(', '),
						area_conocimiento: proyecto.areas_conocimiento.map((a) => a.nombre).join(', '),
						linea_investigacion: proyecto.lineas_investigacion.map((l) => l.nombre).join(', '),
						objetivo: proyecto.objetivo,
						impacto_cientifico: proyecto.impacto_cientifico,
						impacto_economico: proyecto.impacto_economico,
						impacto_social: proyecto.impacto_social,
						otros_impactos: proyecto.otros_impactos,
						estado: proyecto.estado.nombre,
						requiere_aval: proyecto.requiere_aval ? 'Sí' : 'No',
						fecha_inicio: proyecto.fecha_inicio_planeada,
						meses: proyecto.cantidad_meses,
						fecha_fin: proyecto.fecha_fin_planeada,
						fecha_real_finalizacion: proyecto.fecha_fin_real || '',
						nombre_participante: participante.nombre,
						correo_electronico_participante: participante.email,
						cargo_dentro_del_proyecto: participante.cargo,
						tiempo_dedicacion_en_el_proyecto: participante.regimen_dedicacion,
						institucion_encargada_del_proyecto: proyecto.instituciones
							.map((i) => i.nombre)
							.join(', '),
						tipo_presupuesto: proyecto.fuentes_financiamiento.map((f) => f.nombre).join(', '),
						presupuesto: proyecto.monto_presupuesto_total,
						avance: proyecto.porcentaje_avance
					});
				}
			} else {
				// Si no tiene participantes, crear una fila sin participante
				exportData.push({
					codigo_proyecto: proyecto.codigo,
					proyecto_para_siies: proyecto.para_siies ? 'Sí' : 'No',
					titulo_proyecto: proyecto.titulo,
					tipo_proyecto: proyecto.tipos.map((t) => t.nombre).join(', '),
					area_conocimiento: proyecto.areas_conocimiento.map((a) => a.nombre).join(', '),
					linea_investigacion: proyecto.lineas_investigacion.map((l) => l.nombre).join(', '),
					objetivo: proyecto.objetivo,
					impacto_cientifico: proyecto.impacto_cientifico,
					impacto_economico: proyecto.impacto_economico,
					impacto_social: proyecto.impacto_social,
					otros_impactos: proyecto.otros_impactos,
					estado: proyecto.estado.nombre,
					requiere_aval: proyecto.requiere_aval ? 'Sí' : 'No',
					fecha_inicio: proyecto.fecha_inicio_planeada,
					meses: proyecto.cantidad_meses,
					fecha_fin: proyecto.fecha_fin_planeada,
					fecha_real_finalizacion: proyecto.fecha_fin_real || '',
					institucion_encargada_del_proyecto: proyecto.instituciones
						.map((i) => i.nombre)
						.join(', '),
					tipo_presupuesto: proyecto.fuentes_financiamiento.map((f) => f.nombre).join(', '),
					presupuesto: proyecto.monto_presupuesto_total,
					avance: proyecto.porcentaje_avance
				});
			}
		}

		return exportData;
	}
};
