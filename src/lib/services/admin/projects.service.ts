/**
 * Admin Module - Projects Service
 * --------------------------------
 * Servicio para gestión de proyectos con lógica de negocio y validaciones.
 */

import { AdminProjectsRepository } from '$lib/db/admin/projects.repository';
import {
	AdminEstadosRepository,
	AdminTiposRepository,
	AdminAreasRepository,
	AdminLineasRepository,
	AdminFuentesRepository,
	AdminInstitucionesRepository,
	AdminCargosRepository,
	AdminRegimenesRepository
} from '$lib/db/admin/catalogs.repository';
import { AdminParticipantsRepository } from '$lib/db/admin/participants.repository';
import type {
	CreateProyectoDTO,
	UpdateProyectoDTO,
	ProyectoResponseDTO,
	ProyectoFiltersDTO,
	ListProyectosResponseDTO,
	ValidationErrorDTO,
	Proyecto
} from '$lib/models/admin';

export const AdminProjectsService = {
	// =====================================
	// Validaciones
	// =====================================

	/**
	 * Validar campos obligatorios de un proyecto
	 */
	validateProject(dto: CreateProyectoDTO | UpdateProyectoDTO): ValidationErrorDTO[] {
		const errors: ValidationErrorDTO[] = [];

		if ('codigo' in dto && !dto.codigo?.trim()) {
			errors.push({ field: 'codigo', message: 'El código del proyecto es obligatorio' });
		}

		if ('titulo' in dto && !dto.titulo?.trim()) {
			errors.push({ field: 'titulo', message: 'El título del proyecto es obligatorio' });
		}

		if ('objetivo' in dto && !dto.objetivo?.trim()) {
			errors.push({ field: 'objetivo', message: 'El objetivo del proyecto es obligatorio' });
		}

		if ('estado_id' in dto && !dto.estado_id) {
			errors.push({ field: 'estado_id', message: 'El estado del proyecto es obligatorio' });
		}

		if ('fecha_inicio_planeada' in dto && !dto.fecha_inicio_planeada) {
			errors.push({
				field: 'fecha_inicio_planeada',
				message: 'La fecha de inicio planeada es obligatoria'
			});
		}

		if ('fecha_fin_planeada' in dto && !dto.fecha_fin_planeada) {
			errors.push({
				field: 'fecha_fin_planeada',
				message: 'La fecha de fin planeada es obligatoria'
			});
		}

		if ('cantidad_meses' in dto && (!dto.cantidad_meses || dto.cantidad_meses < 1)) {
			errors.push({
				field: 'cantidad_meses',
				message: 'La cantidad de meses debe ser mayor a 0'
			});
		}

		if ('porcentaje_avance' in dto && (dto.porcentaje_avance < 0 || dto.porcentaje_avance > 100)) {
			errors.push({
				field: 'porcentaje_avance',
				message: 'El porcentaje de avance debe estar entre 0 y 100'
			});
		}

		if ('monto_presupuesto_total' in dto && dto.monto_presupuesto_total < 0) {
			errors.push({
				field: 'monto_presupuesto_total',
				message: 'El presupuesto no puede ser negativo'
			});
		}

		return errors;
	},

	/**
	 * Verificar si un código de proyecto ya existe
	 */
	async checkDuplicateCode(codigo: string, excludeId?: number): Promise<boolean> {
		const existing = await AdminProjectsRepository.getProjectByCode(codigo);
		if (!existing) return false;
		if (excludeId && existing.id === excludeId) return false;
		return true;
	},

	// =====================================
	// CRUD Operations
	// =====================================

	/**
	 * Crear un nuevo proyecto con todas sus relaciones
	 */
	async createProject(dto: CreateProyectoDTO): Promise<ProyectoResponseDTO | null> {
		// Validar campos
		const validationErrors = this.validateProject(dto);
		if (validationErrors.length > 0) {
			console.error('Errores de validación:', validationErrors);
			return null;
		}

		// Verificar código duplicado
		const isDuplicate = await this.checkDuplicateCode(dto.codigo);
		if (isDuplicate) {
			console.error('El código del proyecto ya existe');
			return null;
		}

		// Crear el proyecto base
		const proyectoData: Omit<Proyecto, 'id' | 'creado_en'> = {
			codigo: dto.codigo.trim(),
			titulo: dto.titulo.trim(),
			objetivo: dto.objetivo.trim(),
			estado_id: dto.estado_id,
			requiere_aval: dto.requiere_aval || false,
			fecha_inicio_planeada: new Date(dto.fecha_inicio_planeada),
			fecha_fin_planeada: new Date(dto.fecha_fin_planeada),
			fecha_fin_real: dto.fecha_fin_real ? new Date(dto.fecha_fin_real) : undefined,
			cantidad_meses: dto.cantidad_meses,
			porcentaje_avance: dto.porcentaje_avance,
			monto_presupuesto_total: Number(dto.monto_presupuesto_total),
			impacto_cientifico: dto.impacto_cientifico.trim(),
			impacto_economico: dto.impacto_economico.trim(),
			impacto_social: dto.impacto_social.trim(),
			otros_impactos: dto.otros_impactos.trim(),
			para_siies: dto.para_siies || false
		};

		const proyecto = await AdminProjectsRepository.createProject(proyectoData);
		if (!proyecto) {
			console.error('Error al crear el proyecto');
			return null;
		}

		// Agregar relaciones
		await this.addProjectRelations(proyecto.id, dto);

		// Obtener el proyecto completo con relaciones
		return await this.getProjectById(proyecto.id);
	},

	/**
	 * Actualizar un proyecto existente
	 */
	async updateProject(dto: UpdateProyectoDTO): Promise<ProyectoResponseDTO | null> {
		const validationErrors = this.validateProject(dto);
		if (validationErrors.length > 0) {
			console.error('Errores de validación:', validationErrors);
			return null;
		}

		// Verificar código duplicado si se está actualizando
		if (dto.codigo) {
			const isDuplicate = await this.checkDuplicateCode(dto.codigo, dto.id);
			if (isDuplicate) {
				console.error('El código del proyecto ya existe');
				return null;
			}
		}

		// Preparar datos de actualización
		const updateData: Partial<Proyecto> = {};
		if (dto.codigo) updateData.codigo = dto.codigo.trim();
		if (dto.titulo) updateData.titulo = dto.titulo.trim();
		if (dto.objetivo) updateData.objetivo = dto.objetivo.trim();
		if (dto.estado_id) updateData.estado_id = dto.estado_id;
		if (dto.requiere_aval !== undefined) updateData.requiere_aval = dto.requiere_aval;
		if (dto.fecha_inicio_planeada)
			updateData.fecha_inicio_planeada = new Date(dto.fecha_inicio_planeada);
		if (dto.fecha_fin_planeada) updateData.fecha_fin_planeada = new Date(dto.fecha_fin_planeada);
		if (dto.fecha_fin_real) updateData.fecha_fin_real = new Date(dto.fecha_fin_real);
		if (dto.cantidad_meses) updateData.cantidad_meses = dto.cantidad_meses;
		if (dto.porcentaje_avance !== undefined) updateData.porcentaje_avance = dto.porcentaje_avance;
		if (dto.monto_presupuesto_total !== undefined)
			updateData.monto_presupuesto_total = Number(dto.monto_presupuesto_total);
		if (dto.impacto_cientifico) updateData.impacto_cientifico = dto.impacto_cientifico.trim();
		if (dto.impacto_economico) updateData.impacto_economico = dto.impacto_economico.trim();
		if (dto.impacto_social) updateData.impacto_social = dto.impacto_social.trim();
		if (dto.otros_impactos) updateData.otros_impactos = dto.otros_impactos.trim();
		if (dto.para_siies !== undefined) updateData.para_siies = dto.para_siies;

		// Actualizar proyecto
		const proyecto = await AdminProjectsRepository.updateProject(dto.id, updateData);
		if (!proyecto) {
			console.error('Error al actualizar el proyecto');
			return null;
		}

		// Actualizar relaciones si se proporcionan
		if (
			dto.instituciones_ids ||
			dto.tipos_ids ||
			dto.areas_conocimiento_ids ||
			dto.lineas_investigacion_ids ||
			dto.fuentes_financiamiento_ids ||
			dto.participantes
		) {
			await this.updateProjectRelations(dto.id, dto);
		}

		return await this.getProjectById(dto.id);
	},

	/**
	 * Eliminar un proyecto
	 */
	async deleteProject(id: number): Promise<boolean> {
		// Primero eliminar todas las relaciones
		await Promise.all([
			AdminProjectsRepository.removeProjectInstitutions(id),
			AdminProjectsRepository.removeProjectTypes(id),
			AdminProjectsRepository.removeProjectAreas(id),
			AdminProjectsRepository.removeProjectLines(id),
			AdminProjectsRepository.removeProjectFunding(id),
			AdminProjectsRepository.removeProjectParticipants(id)
		]);

		// Luego eliminar el proyecto
		return await AdminProjectsRepository.deleteProject(id);
	},

	/**
	 * Obtener un proyecto por ID con todas sus relaciones
	 */
	async getProjectById(id: number): Promise<ProyectoResponseDTO | null> {
		const proyecto = await AdminProjectsRepository.getProjectById(id);
		if (!proyecto) return null;

		// Obtener todas las relaciones
		const [institucionesIds, tiposIds, areasIds, lineasIds, fuentesIds, participantesData, estado] =
			await Promise.all([
				AdminProjectsRepository.getProjectInstitutions(id),
				AdminProjectsRepository.getProjectTypes(id),
				AdminProjectsRepository.getProjectAreas(id),
				AdminProjectsRepository.getProjectLines(id),
				AdminProjectsRepository.getProjectFunding(id),
				AdminProjectsRepository.getProjectParticipants(id),
				AdminEstadosRepository.getById(proyecto.estado_id)
			]);

		// Obtener detalles de cada relación
		const [instituciones, tipos, areas, lineas, fuentes, cargos, regimenes] = await Promise.all([
			Promise.all(institucionesIds.map((id) => AdminInstitucionesRepository.getById(id))),
			Promise.all(tiposIds.map((id) => AdminTiposRepository.getById(id))),
			Promise.all(areasIds.map((id) => AdminAreasRepository.getById(id))),
			Promise.all(lineasIds.map((id) => AdminLineasRepository.getById(id))),
			Promise.all(fuentesIds.map((id) => AdminFuentesRepository.getById(id))),
			Promise.all(participantesData.map((p) => AdminCargosRepository.getById(p.cargo_id))),
			Promise.all(
				participantesData.map((p) => AdminRegimenesRepository.getById(p.regimen_dedicacion_id))
			)
		]);

		// Obtener información de participantes
		const participantes = await Promise.all(
			participantesData.map(async (p, index) => {
				const participante = await AdminParticipantsRepository.getParticipantById(
					p.participante_id
				);
				const cargo = cargos[index];
				const regimen = regimenes[index];

				return {
					id: participante?.id || 0,
					nombre: participante?.nombre || '',
					email: participante?.email || '',
					cargo: cargo?.nombre || '',
					regimen_dedicacion: regimen?.nombre || ''
				};
			})
		);

		// Construir respuesta
		return {
			id: proyecto.id,
			codigo: proyecto.codigo,
			titulo: proyecto.titulo,
			objetivo: proyecto.objetivo,
			estado: {
				id: estado?.id || 0,
				nombre: estado?.nombre || ''
			},
			requiere_aval: proyecto.requiere_aval || false,
			fecha_inicio_planeada:
				typeof proyecto.fecha_inicio_planeada === 'string'
					? proyecto.fecha_inicio_planeada
					: proyecto.fecha_inicio_planeada.toISOString(),
			fecha_fin_planeada:
				typeof proyecto.fecha_fin_planeada === 'string'
					? proyecto.fecha_fin_planeada
					: proyecto.fecha_fin_planeada.toISOString(),
			fecha_fin_real: proyecto.fecha_fin_real
				? typeof proyecto.fecha_fin_real === 'string'
					? proyecto.fecha_fin_real
					: proyecto.fecha_fin_real.toISOString()
				: undefined,
			cantidad_meses: proyecto.cantidad_meses,
			porcentaje_avance: proyecto.porcentaje_avance,
			monto_presupuesto_total: Number(proyecto.monto_presupuesto_total),
			impacto_cientifico: proyecto.impacto_cientifico,
			impacto_economico: proyecto.impacto_economico,
			impacto_social: proyecto.impacto_social,
			otros_impactos: proyecto.otros_impactos,
			para_siies: proyecto.para_siies || false,
			creado_en: proyecto.creado_en
				? typeof proyecto.creado_en === 'string'
					? proyecto.creado_en
					: proyecto.creado_en.toISOString()
				: new Date().toISOString(),
			instituciones: instituciones
				.filter((i) => i)
				.map((i) => ({
					id: i!.id,
					nombre: i!.nombre,
					sigla: i!.sigla
				})),
			tipos: tipos.filter((t) => t).map((t) => ({ id: t!.id, nombre: t!.nombre })),
			areas_conocimiento: areas.filter((a) => a).map((a) => ({ id: a!.id, nombre: a!.nombre })),
			lineas_investigacion: lineas.filter((l) => l).map((l) => ({ id: l!.id, nombre: l!.nombre })),
			fuentes_financiamiento: fuentes
				.filter((f) => f)
				.map((f) => ({ id: f!.id, nombre: f!.nombre })),
			participantes
		};
	},

	/**
	 * Listar proyectos con paginación y filtros
	 */
	async listProjects(
		page: number = 1,
		limit: number = 10,
		filters?: ProyectoFiltersDTO
	): Promise<ListProyectosResponseDTO> {
		const { data, total } = await AdminProjectsRepository.listProjects(page, limit, {
			codigo: filters?.codigo,
			titulo: filters?.titulo,
			estado_id: filters?.estado_id,
			fecha_inicio_desde: filters?.fecha_inicio_desde,
			fecha_inicio_hasta: filters?.fecha_inicio_hasta
		});

		// Obtener estados de todos los proyectos en una sola pasada
		const estadoIds = [...new Set(data.map((p) => p.estado_id))];
		const estadosPromises = estadoIds.map((id) => AdminEstadosRepository.getById(id));
		const estadosResults = await Promise.all(estadosPromises);
		const estadosMap = new Map(estadoIds.map((id, index) => [id, estadosResults[index]]));

		// Construir DTOs optimizados (sin hacer queries individuales por cada proyecto)
		const proyectos: ProyectoResponseDTO[] = data.map((proyecto) => {
			const estado = estadosMap.get(proyecto.estado_id);

			return {
				id: proyecto.id,
				codigo: proyecto.codigo,
				titulo: proyecto.titulo,
				objetivo: proyecto.objetivo,
				estado: {
					id: estado?.id || 0,
					nombre: estado?.nombre || ''
				},
				requiere_aval: proyecto.requiere_aval || false,
				fecha_inicio_planeada:
					typeof proyecto.fecha_inicio_planeada === 'string'
						? proyecto.fecha_inicio_planeada
						: proyecto.fecha_inicio_planeada.toISOString(),
				fecha_fin_planeada:
					typeof proyecto.fecha_fin_planeada === 'string'
						? proyecto.fecha_fin_planeada
						: proyecto.fecha_fin_planeada.toISOString(),
				fecha_fin_real: proyecto.fecha_fin_real
					? typeof proyecto.fecha_fin_real === 'string'
						? proyecto.fecha_fin_real
						: proyecto.fecha_fin_real.toISOString()
					: undefined,
				cantidad_meses: proyecto.cantidad_meses,
				porcentaje_avance: proyecto.porcentaje_avance,
				monto_presupuesto_total: Number(proyecto.monto_presupuesto_total),
				impacto_cientifico: proyecto.impacto_cientifico,
				impacto_economico: proyecto.impacto_economico,
				impacto_social: proyecto.impacto_social,
				otros_impactos: proyecto.otros_impactos,
				para_siies: proyecto.para_siies || false,
				creado_en: proyecto.creado_en
					? typeof proyecto.creado_en === 'string'
						? proyecto.creado_en
						: proyecto.creado_en.toISOString()
					: new Date().toISOString(),
				// Listado simplificado - sin relaciones pesadas
				instituciones: [],
				tipos: [],
				areas_conocimiento: [],
				lineas_investigacion: [],
				fuentes_financiamiento: [],
				participantes: []
			};
		});

		return {
			data: proyectos,
			pagination: {
				page,
				limit,
				total,
				total_pages: Math.ceil(total / limit)
			}
		};
	},

	/**
	 * Obtener estadísticas globales de proyectos
	 * OPTIMIZADO: Solo 4 queries eficientes a la BD
	 */
	async getProjectStats(): Promise<{
		total_projects: number;
		total_budget: number;
		completed_count: number;
		in_progress_count: number;
	}> {
		const stats = await AdminProjectsRepository.getProjectStatsOptimized();

		return {
			total_projects: stats.total,
			total_budget: stats.totalBudget,
			completed_count: stats.completedCount,
			in_progress_count: stats.inProgressCount
		};
	},

	// =====================================
	// Helpers para relaciones
	// =====================================

	async addProjectRelations(proyectoId: number, dto: CreateProyectoDTO | UpdateProyectoDTO) {
		// Agregar instituciones
		if (dto.instituciones_ids) {
			await Promise.all(
				dto.instituciones_ids.map((id) =>
					AdminProjectsRepository.addProjectInstitution(proyectoId, id)
				)
			);
		}

		// Agregar tipos
		if (dto.tipos_ids) {
			await Promise.all(
				dto.tipos_ids.map((id) => AdminProjectsRepository.addProjectType(proyectoId, id))
			);
		}

		// Agregar áreas
		if (dto.areas_conocimiento_ids) {
			await Promise.all(
				dto.areas_conocimiento_ids.map((id) =>
					AdminProjectsRepository.addProjectArea(proyectoId, id)
				)
			);
		}

		// Agregar líneas
		if (dto.lineas_investigacion_ids) {
			await Promise.all(
				dto.lineas_investigacion_ids.map((id) =>
					AdminProjectsRepository.addProjectLine(proyectoId, id)
				)
			);
		}

		// Agregar fuentes
		if (dto.fuentes_financiamiento_ids) {
			await Promise.all(
				dto.fuentes_financiamiento_ids.map((id) =>
					AdminProjectsRepository.addProjectFunding(proyectoId, id)
				)
			);
		}

		// Agregar participantes
		if (dto.participantes) {
			await Promise.all(
				dto.participantes.map((p) =>
					AdminProjectsRepository.addProjectParticipant(
						proyectoId,
						p.participante_id,
						p.cargo_id,
						p.regimen_dedicacion_id
					)
				)
			);
		}
	},

	async updateProjectRelations(proyectoId: number, dto: UpdateProyectoDTO) {
		// Eliminar relaciones existentes
		await Promise.all([
			dto.instituciones_ids !== undefined &&
				AdminProjectsRepository.removeProjectInstitutions(proyectoId),
			dto.tipos_ids !== undefined && AdminProjectsRepository.removeProjectTypes(proyectoId),
			dto.areas_conocimiento_ids !== undefined &&
				AdminProjectsRepository.removeProjectAreas(proyectoId),
			dto.lineas_investigacion_ids !== undefined &&
				AdminProjectsRepository.removeProjectLines(proyectoId),
			dto.fuentes_financiamiento_ids !== undefined &&
				AdminProjectsRepository.removeProjectFunding(proyectoId),
			dto.participantes !== undefined &&
				AdminProjectsRepository.removeProjectParticipants(proyectoId)
		]);

		// Agregar nuevas relaciones
		await this.addProjectRelations(proyectoId, dto);
	}
};
