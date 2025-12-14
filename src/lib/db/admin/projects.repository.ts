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
} from '$lib/models/admin';

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

		// Convertir numeric a number (PostgreSQL devuelve numeric como string)
		if (data && data.monto_presupuesto_total) {
			data.monto_presupuesto_total = parseFloat(data.monto_presupuesto_total);
		}
		if (data && data.porcentaje_avance) {
			data.porcentaje_avance = parseFloat(data.porcentaje_avance);
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

		// Convertir numeric a number (PostgreSQL devuelve numeric como string)
		if (data) {
			if (data.monto_presupuesto_total) {
				data.monto_presupuesto_total = parseFloat(data.monto_presupuesto_total);
			}
			if (data.porcentaje_avance) {
				data.porcentaje_avance = parseFloat(data.porcentaje_avance);
			}
		}

		return data;
	},
	/**
	 * Actualizar un proyecto
	 */ async updateProject(id: number, proyecto: Partial<Proyecto>): Promise<Proyecto | null> {
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

		// Convertir numeric a number en cada proyecto (PostgreSQL devuelve numeric como string)
		const proyectos = (data || []).map((proyecto) => ({
			...proyecto,
			monto_presupuesto_total: proyecto.monto_presupuesto_total
				? parseFloat(proyecto.monto_presupuesto_total)
				: 0,
			porcentaje_avance: proyecto.porcentaje_avance ? parseFloat(proyecto.porcentaje_avance) : 0
		}));

		return { data: proyectos, total: count || 0 };
	},

	/**
	 * Obtener estadísticas optimizadas sin traer todos los datos
	 *
	 * OPCIÓN 1 (ACTUAL): 4-5 queries directas - Funciona bien hasta ~1000 proyectos
	 * OPCIÓN 2 (OPCIONAL): Vista materializada - Para +1000 proyectos
	 *
	 * Para usar OPCIÓN 2:
	 * 1. Ejecuta database/optimizations.sql en Supabase
	 * 2. Descomenta el código de "Opción 2" abajo
	 * 3. Comenta la "Opción 1"
	 */
	async getProjectStatsOptimized(): Promise<{
		total: number;
		totalBudget: number;
		completedCount: number;
		inProgressCount: number;
	}> {
		// ============ OPCIÓN 1: Queries directas (ACTUAL) ============
		// Usa esto si tienes < 1000 proyectos

		// Query 1: Total count
		const { count: total } = await supabase
			.from('proyectos')
			.select('*', { count: 'exact', head: true });

		// Query 2: Sum de presupuestos
		const { data: budgetData } = await supabase.from('proyectos').select('monto_presupuesto_total');

		// Query 3: Count de completados
		const { count: completedCount } = await supabase
			.from('proyectos')
			.select('*', { count: 'exact', head: true })
			.eq('porcentaje_avance', 100);

		// Query 4: Count de en progreso
		const { count: inProgressCount } = await supabase
			.from('proyectos')
			.select('*', { count: 'exact', head: true })
			.gt('porcentaje_avance', 0)
			.lt('porcentaje_avance', 100);

		const totalBudget = (budgetData || []).reduce(
			(sum, p) => sum + parseFloat(p.monto_presupuesto_total || '0'),
			0
		);

		return {
			total: total || 0,
			totalBudget,
			completedCount: completedCount || 0,
			inProgressCount: inProgressCount || 0
		};

		// ============ OPCIÓN 2: Vista Materializada (OPCIONAL) ============
		// Usa esto si tienes +1000 proyectos y ejecutaste database/optimizations.sql
		/*
		const { data, error } = await supabase.rpc('get_project_stats_fast');
		
		if (error || !data || data.length === 0) {
			console.error('Error al obtener stats desde vista materializada:', error);
			// Fallback a queries directas si falla
			return this.getProjectStatsOptimizedFallback();
		}

		const stats = data[0];
		return {
			total: Number(stats.total_projects) || 0,
			totalBudget: Number(stats.total_budget) || 0,
			completedCount: Number(stats.completed_count) || 0,
			inProgressCount: Number(stats.in_progress_count) || 0
		};
		*/
	},

	/**
	 * Fallback para estadísticas (si falla la vista materializada)
	 */
	async getProjectStatsOptimizedFallback(): Promise<{
		total: number;
		totalBudget: number;
		completedCount: number;
		inProgressCount: number;
	}> {
		const { count: total } = await supabase
			.from('proyectos')
			.select('*', { count: 'exact', head: true });

		return {
			total: total || 0,
			totalBudget: 0,
			completedCount: 0,
			inProgressCount: 0
		};
	},

	/**
	 * Obtener datos completos del dashboard en UNA sola query
	 * Requiere ejecutar database/optimizations.sql primero
	 */
	async getDashboardDataComplete(): Promise<any> {
		const { data, error } = await supabase.rpc('get_dashboard_data');

		if (error) {
			console.error('Error al obtener datos del dashboard:', error);
			return null;
		}

		return data;
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
