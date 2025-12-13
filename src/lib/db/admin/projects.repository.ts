/**
 * Admin Module - Projects Repository
 * -----------------------------------
 * Repositorio para operaciones CRUD de proyectos y sus relaciones.
 * Capa de infraestructura - solo consultas a Supabase.
 */

import { supabase } from '../supabase.client';
import type {
	Proyecto,
	ProyectoInstitucion,
	ProyectoTipo,
	ProyectoAreaConocimiento,
	ProyectoLineaInvestigacion,
	ProyectoParticipante,
	ProyectoFuenteFinanciamiento
} from '$lib/models/admin/entities';

export const AdminProjectsRepository = {
	// =====================================
	// CRUD Proyectos
	// =====================================

	/**
	 * Crear un nuevo proyecto
	 */
	async createProject(proyecto: Omit<Proyecto, 'id' | 'creado_en'>): Promise<Proyecto | null> {
		const { data, error } = await supabase.from('proyectos').insert(proyecto).select().single();

		if (error) {
			console.error('Error al crear proyecto:', error);
			return null;
		}

		return data;
	},

	/**
	 * Obtener un proyecto por ID
	 */
	async getProjectById(id: number): Promise<Proyecto | null> {
		const { data, error } = await supabase.from('proyectos').select('*').eq('id', id).single();

		if (error) {
			console.error('Error al obtener proyecto:', error);
			return null;
		}

		return data;
	},

	/**
	 * Obtener un proyecto por código
	 */
	async getProjectByCode(codigo: string): Promise<Proyecto | null> {
		const { data, error } = await supabase
			.from('proyectos')
			.select('*')
			.eq('codigo', codigo)
			.single();

		if (error) {
			if (error.code === 'PGRST116') {
				// No se encontró el registro
				return null;
			}
			console.error('Error al obtener proyecto por código:', error);
			return null;
		}

		return data;
	},

	/**
	 * Actualizar un proyecto
	 */
	async updateProject(id: number, proyecto: Partial<Proyecto>): Promise<Proyecto | null> {
		const { data, error } = await supabase
			.from('proyectos')
			.update(proyecto)
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error al actualizar proyecto:', error);
			return null;
		}

		return data;
	},

	/**
	 * Eliminar un proyecto
	 */
	async deleteProject(id: number): Promise<boolean> {
		const { error } = await supabase.from('proyectos').delete().eq('id', id);

		if (error) {
			console.error('Error al eliminar proyecto:', error);
			return false;
		}

		return true;
	},

	/**
	 * Listar proyectos con paginación y filtros
	 */
	async listProjects(
		page: number = 1,
		limit: number = 10,
		filters?: {
			codigo?: string;
			titulo?: string;
			estado_id?: number;
			fecha_inicio_desde?: string;
			fecha_inicio_hasta?: string;
		}
	): Promise<{ data: Proyecto[]; total: number }> {
		let query = supabase.from('proyectos').select('*', { count: 'exact' });

		// Aplicar filtros
		if (filters?.codigo) {
			query = query.ilike('codigo', `%${filters.codigo}%`);
		}
		if (filters?.titulo) {
			query = query.ilike('titulo', `%${filters.titulo}%`);
		}
		if (filters?.estado_id) {
			query = query.eq('estado_id', filters.estado_id);
		}
		if (filters?.fecha_inicio_desde) {
			query = query.gte('fecha_inicio_planeada', filters.fecha_inicio_desde);
		}
		if (filters?.fecha_inicio_hasta) {
			query = query.lte('fecha_inicio_planeada', filters.fecha_inicio_hasta);
		}

		// Paginación
		const from = (page - 1) * limit;
		const to = from + limit - 1;

		const { data, error, count } = await query.range(from, to);

		if (error) {
			console.error('Error al listar proyectos:', error);
			return { data: [], total: 0 };
		}

		return { data: data || [], total: count || 0 };
	},

	// =====================================
	// Relaciones: Proyectos - Instituciones
	// =====================================

	async addProjectInstitution(proyecto_id: number, institucion_id: number): Promise<boolean> {
		const { error } = await supabase
			.from('proyecto_institucion')
			.insert({ proyecto_id, institucion_id });

		if (error) {
			console.error('Error al agregar institución al proyecto:', error);
			return false;
		}

		return true;
	},

	async getProjectInstitutions(proyecto_id: number): Promise<number[]> {
		const { data, error } = await supabase
			.from('proyecto_institucion')
			.select('institucion_id')
			.eq('proyecto_id', proyecto_id);

		if (error) {
			console.error('Error al obtener instituciones del proyecto:', error);
			return [];
		}

		return data.map((item) => item.institucion_id);
	},

	async removeProjectInstitutions(proyecto_id: number): Promise<boolean> {
		const { error } = await supabase
			.from('proyecto_institucion')
			.delete()
			.eq('proyecto_id', proyecto_id);

		if (error) {
			console.error('Error al eliminar instituciones del proyecto:', error);
			return false;
		}

		return true;
	},

	// =====================================
	// Relaciones: Proyectos - Tipos
	// =====================================

	async addProjectType(proyecto_id: number, tipo_id: number): Promise<boolean> {
		const { error } = await supabase.from('proyecto_tipo').insert({ proyecto_id, tipo_id });

		if (error) {
			console.error('Error al agregar tipo al proyecto:', error);
			return false;
		}

		return true;
	},

	async getProjectTypes(proyecto_id: number): Promise<number[]> {
		const { data, error } = await supabase
			.from('proyecto_tipo')
			.select('tipo_id')
			.eq('proyecto_id', proyecto_id);

		if (error) {
			console.error('Error al obtener tipos del proyecto:', error);
			return [];
		}

		return data.map((item) => item.tipo_id);
	},

	async removeProjectTypes(proyecto_id: number): Promise<boolean> {
		const { error } = await supabase.from('proyecto_tipo').delete().eq('proyecto_id', proyecto_id);

		if (error) {
			console.error('Error al eliminar tipos del proyecto:', error);
			return false;
		}

		return true;
	},

	// =====================================
	// Relaciones: Proyectos - Áreas de Conocimiento
	// =====================================

	async addProjectArea(proyecto_id: number, area_id: number): Promise<boolean> {
		const { error } = await supabase
			.from('proyecto_area_conocimiento')
			.insert({ proyecto_id, area_conocimiento_id: area_id });

		if (error) {
			console.error('Error al agregar área al proyecto:', error);
			return false;
		}

		return true;
	},

	async getProjectAreas(proyecto_id: number): Promise<number[]> {
		const { data, error } = await supabase
			.from('proyecto_area_conocimiento')
			.select('area_conocimiento_id')
			.eq('proyecto_id', proyecto_id);

		if (error) {
			console.error('Error al obtener áreas del proyecto:', error);
			return [];
		}

		return data.map((item) => item.area_conocimiento_id);
	},

	async removeProjectAreas(proyecto_id: number): Promise<boolean> {
		const { error } = await supabase
			.from('proyecto_area_conocimiento')
			.delete()
			.eq('proyecto_id', proyecto_id);

		if (error) {
			console.error('Error al eliminar áreas del proyecto:', error);
			return false;
		}

		return true;
	},

	// =====================================
	// Relaciones: Proyectos - Líneas de Investigación
	// =====================================

	async addProjectLine(proyecto_id: number, linea_id: number): Promise<boolean> {
		const { error } = await supabase
			.from('proyecto_linea_investigacion')
			.insert({ proyecto_id, linea_investigacion_id: linea_id });

		if (error) {
			console.error('Error al agregar línea al proyecto:', error);
			return false;
		}

		return true;
	},

	async getProjectLines(proyecto_id: number): Promise<number[]> {
		const { data, error } = await supabase
			.from('proyecto_linea_investigacion')
			.select('linea_investigacion_id')
			.eq('proyecto_id', proyecto_id);

		if (error) {
			console.error('Error al obtener líneas del proyecto:', error);
			return [];
		}

		return data.map((item) => item.linea_investigacion_id);
	},

	async removeProjectLines(proyecto_id: number): Promise<boolean> {
		const { error } = await supabase
			.from('proyecto_linea_investigacion')
			.delete()
			.eq('proyecto_id', proyecto_id);

		if (error) {
			console.error('Error al eliminar líneas del proyecto:', error);
			return false;
		}

		return true;
	},

	// =====================================
	// Relaciones: Proyectos - Fuentes de Financiamiento
	// =====================================

	async addProjectFunding(proyecto_id: number, fuente_id: number): Promise<boolean> {
		const { error } = await supabase
			.from('proyecto_fuente_financiamiento')
			.insert({ proyecto_id, fuente_financiamiento_id: fuente_id });

		if (error) {
			console.error('Error al agregar fuente de financiamiento al proyecto:', error);
			return false;
		}

		return true;
	},

	async getProjectFunding(proyecto_id: number): Promise<number[]> {
		const { data, error } = await supabase
			.from('proyecto_fuente_financiamiento')
			.select('fuente_financiamiento_id')
			.eq('proyecto_id', proyecto_id);

		if (error) {
			console.error('Error al obtener fuentes de financiamiento del proyecto:', error);
			return [];
		}

		return data.map((item) => item.fuente_financiamiento_id);
	},

	async removeProjectFunding(proyecto_id: number): Promise<boolean> {
		const { error } = await supabase
			.from('proyecto_fuente_financiamiento')
			.delete()
			.eq('proyecto_id', proyecto_id);

		if (error) {
			console.error('Error al eliminar fuentes de financiamiento del proyecto:', error);
			return false;
		}

		return true;
	},

	// =====================================
	// Relaciones: Proyectos - Participantes
	// =====================================

	async addProjectParticipant(
		proyecto_id: number,
		participante_id: number,
		cargo_id: number,
		regimen_dedicacion_id: number
	): Promise<boolean> {
		const { error } = await supabase.from('proyecto_participante').insert({
			proyecto_id,
			participante_id,
			cargo_id,
			regimen_dedicacion_id
		});

		if (error) {
			console.error('Error al agregar participante al proyecto:', error);
			return false;
		}

		return true;
	},

	async getProjectParticipants(proyecto_id: number) {
		const { data, error } = await supabase
			.from('proyecto_participante')
			.select('participante_id, cargo_id, regimen_dedicacion_id')
			.eq('proyecto_id', proyecto_id);

		if (error) {
			console.error('Error al obtener participantes del proyecto:', error);
			return [];
		}

		return data;
	},

	async removeProjectParticipants(proyecto_id: number): Promise<boolean> {
		const { error } = await supabase
			.from('proyecto_participante')
			.delete()
			.eq('proyecto_id', proyecto_id);

		if (error) {
			console.error('Error al eliminar participantes del proyecto:', error);
			return false;
		}

		return true;
	},

	// =====================================
	// Consultas con relaciones completas
	// =====================================

	async getProjectWithRelations(proyecto_id: number) {
		// Obtener el proyecto base
		const proyecto = await this.getProjectById(proyecto_id);
		if (!proyecto) return null;

		// Obtener todas las relaciones en paralelo
		const [instituciones, tipos, areas, lineas, fuentes, participantes] = await Promise.all([
			this.getProjectInstitutions(proyecto_id),
			this.getProjectTypes(proyecto_id),
			this.getProjectAreas(proyecto_id),
			this.getProjectLines(proyecto_id),
			this.getProjectFunding(proyecto_id),
			this.getProjectParticipants(proyecto_id)
		]);

		return {
			...proyecto,
			instituciones,
			tipos,
			areas,
			lineas,
			fuentes,
			participantes
		};
	}
};
