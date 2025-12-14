/**
 * Admin Module - Catalogs Repository
 * -----------------------------------
 * Repositorio para operaciones CRUD de todos los catálogos del sistema.
 */

import { supabase } from '../supabase.client';
import type {
	Estado,
	Tipo,
	AreaConocimiento,
	LineaInvestigacion,
	FuenteFinanciamiento,
	Cargo,
	RegimenDedicacion,
	Institucion,
	Facultad,
	Carrera
} from '$lib/models/admin';

// =====================================
// Estados
// =====================================

export const AdminEstadosRepository = {
	async getAll(): Promise<Estado[]> {
		const { data, error } = await supabase.from('estado').select('*');
		if (error) {
			console.error('Error al obtener estados:', error);
			return [];
		}
		return data || [];
	},

	async getById(id: number): Promise<Estado | null> {
		const { data, error } = await supabase.from('estado').select('*').eq('id', id).single();
		if (error) return null;
		return data;
	},

	async create(estado: Omit<Estado, 'id'>): Promise<Estado | null> {
		const { data, error } = await supabase.from('estado').insert(estado).select().single();
		if (error) {
			console.error('Error al crear estado:', error);
			return null;
		}
		return data;
	},

	async update(id: number, estado: Partial<Estado>): Promise<Estado | null> {
		const { data, error } = await supabase
			.from('estado')
			.update(estado)
			.eq('id', id)
			.select()
			.single();
		if (error) {
			console.error('Error al actualizar estado:', error);
			return null;
		}
		return data;
	},

	async delete(id: number): Promise<boolean> {
		const { error } = await supabase.from('estado').delete().eq('id', id);
		if (error) {
			console.error('Error al eliminar estado:', error);
			return false;
		}
		return true;
	}
};

// =====================================
// Tipos
// =====================================

export const AdminTiposRepository = {
	async getAll(): Promise<Tipo[]> {
		const { data, error } = await supabase.from('tipos').select('*');
		if (error) {
			console.error('Error al obtener tipos:', error);
			return [];
		}
		return data || [];
	},

	async getById(id: number): Promise<Tipo | null> {
		const { data, error } = await supabase.from('tipos').select('*').eq('id', id).single();
		if (error) return null;
		return data;
	},

	async create(tipo: Omit<Tipo, 'id'>): Promise<Tipo | null> {
		const { data, error } = await supabase.from('tipos').insert(tipo).select().single();
		if (error) {
			console.error('Error al crear tipo:', error);
			return null;
		}
		return data;
	},

	async update(id: number, tipo: Partial<Tipo>): Promise<Tipo | null> {
		const { data, error } = await supabase
			.from('tipos')
			.update(tipo)
			.eq('id', id)
			.select()
			.single();
		if (error) {
			console.error('Error al actualizar tipo:', error);
			return null;
		}
		return data;
	},

	async delete(id: number): Promise<boolean> {
		const { error } = await supabase.from('tipos').delete().eq('id', id);
		if (error) {
			console.error('Error al eliminar tipo:', error);
			return false;
		}
		return true;
	}
};

// =====================================
// Áreas de Conocimiento
// =====================================

export const AdminAreasRepository = {
	async getAll(): Promise<AreaConocimiento[]> {
		const { data, error } = await supabase.from('areas_conocimiento').select('*');
		if (error) {
			console.error('Error al obtener áreas:', error);
			return [];
		}
		return data || [];
	},

	async getById(id: number): Promise<AreaConocimiento | null> {
		const { data, error } = await supabase
			.from('areas_conocimiento')
			.select('*')
			.eq('id', id)
			.single();
		if (error) return null;
		return data;
	},

	async create(area: Omit<AreaConocimiento, 'id'>): Promise<AreaConocimiento | null> {
		const { data, error } = await supabase
			.from('areas_conocimiento')
			.insert(area)
			.select()
			.single();
		if (error) {
			console.error('Error al crear área:', error);
			return null;
		}
		return data;
	},

	async update(id: number, area: Partial<AreaConocimiento>): Promise<AreaConocimiento | null> {
		const { data, error } = await supabase
			.from('areas_conocimiento')
			.update(area)
			.eq('id', id)
			.select()
			.single();
		if (error) {
			console.error('Error al actualizar área:', error);
			return null;
		}
		return data;
	},

	async delete(id: number): Promise<boolean> {
		const { error } = await supabase.from('areas_conocimiento').delete().eq('id', id);
		if (error) {
			console.error('Error al eliminar área:', error);
			return false;
		}
		return true;
	}
};

// =====================================
// Líneas de Investigación
// =====================================

export const AdminLineasRepository = {
	async getAll(): Promise<LineaInvestigacion[]> {
		const { data, error } = await supabase.from('lineas_investigacion').select('*');
		if (error) {
			console.error('Error al obtener líneas:', error);
			return [];
		}
		return data || [];
	},

	async getById(id: number): Promise<LineaInvestigacion | null> {
		const { data, error } = await supabase
			.from('lineas_investigacion')
			.select('*')
			.eq('id', id)
			.single();
		if (error) return null;
		return data;
	},

	async create(linea: Omit<LineaInvestigacion, 'id'>): Promise<LineaInvestigacion | null> {
		const { data, error } = await supabase
			.from('lineas_investigacion')
			.insert(linea)
			.select()
			.single();
		if (error) {
			console.error('Error al crear línea:', error);
			return null;
		}
		return data;
	},

	async update(id: number, linea: Partial<LineaInvestigacion>): Promise<LineaInvestigacion | null> {
		const { data, error } = await supabase
			.from('lineas_investigacion')
			.update(linea)
			.eq('id', id)
			.select()
			.single();
		if (error) {
			console.error('Error al actualizar línea:', error);
			return null;
		}
		return data;
	},

	async delete(id: number): Promise<boolean> {
		const { error } = await supabase.from('lineas_investigacion').delete().eq('id', id);
		if (error) {
			console.error('Error al eliminar línea:', error);
			return false;
		}
		return true;
	}
};

// =====================================
// Fuentes de Financiamiento
// =====================================

export const AdminFuentesRepository = {
	async getAll(): Promise<FuenteFinanciamiento[]> {
		const { data, error } = await supabase.from('fuente_financiamiento').select('*');
		if (error) {
			console.error('Error al obtener fuentes:', error);
			return [];
		}
		return data || [];
	},

	async getById(id: number): Promise<FuenteFinanciamiento | null> {
		const { data, error } = await supabase
			.from('fuente_financiamiento')
			.select('*')
			.eq('id', id)
			.single();
		if (error) return null;
		return data;
	},

	async create(fuente: Omit<FuenteFinanciamiento, 'id'>): Promise<FuenteFinanciamiento | null> {
		const { data, error } = await supabase
			.from('fuente_financiamiento')
			.insert(fuente)
			.select()
			.single();
		if (error) {
			console.error('Error al crear fuente:', error);
			return null;
		}
		return data;
	},

	async update(
		id: number,
		fuente: Partial<FuenteFinanciamiento>
	): Promise<FuenteFinanciamiento | null> {
		const { data, error } = await supabase
			.from('fuente_financiamiento')
			.update(fuente)
			.eq('id', id)
			.select()
			.single();
		if (error) {
			console.error('Error al actualizar fuente:', error);
			return null;
		}
		return data;
	},

	async delete(id: number): Promise<boolean> {
		const { error } = await supabase.from('fuente_financiamiento').delete().eq('id', id);
		if (error) {
			console.error('Error al eliminar fuente:', error);
			return false;
		}
		return true;
	}
};

// =====================================
// Cargos
// =====================================

export const AdminCargosRepository = {
	async getAll(): Promise<Cargo[]> {
		const { data, error } = await supabase.from('cargos').select('*');
		if (error) {
			console.error('Error al obtener cargos:', error);
			return [];
		}
		return data || [];
	},

	async getById(id: number): Promise<Cargo | null> {
		const { data, error } = await supabase.from('cargos').select('*').eq('id', id).single();
		if (error) return null;
		return data;
	},

	async create(cargo: Omit<Cargo, 'id'>): Promise<Cargo | null> {
		const { data, error } = await supabase.from('cargos').insert(cargo).select().single();
		if (error) {
			console.error('Error al crear cargo:', error);
			return null;
		}
		return data;
	},

	async update(id: number, cargo: Partial<Cargo>): Promise<Cargo | null> {
		const { data, error } = await supabase
			.from('cargos')
			.update(cargo)
			.eq('id', id)
			.select()
			.single();
		if (error) {
			console.error('Error al actualizar cargo:', error);
			return null;
		}
		return data;
	},

	async delete(id: number): Promise<boolean> {
		const { error } = await supabase.from('cargos').delete().eq('id', id);
		if (error) {
			console.error('Error al eliminar cargo:', error);
			return false;
		}
		return true;
	}
};

// =====================================
// Regímenes de Dedicación
// =====================================

export const AdminRegimenesRepository = {
	async getAll(): Promise<RegimenDedicacion[]> {
		const { data, error } = await supabase.from('regimenes_dedicacion').select('*');
		if (error) {
			console.error('Error al obtener regímenes:', error);
			return [];
		}
		return data || [];
	},

	async getById(id: number): Promise<RegimenDedicacion | null> {
		const { data, error } = await supabase
			.from('regimenes_dedicacion')
			.select('*')
			.eq('id', id)
			.single();
		if (error) return null;
		return data;
	},

	async create(regimen: Omit<RegimenDedicacion, 'id'>): Promise<RegimenDedicacion | null> {
		const { data, error } = await supabase
			.from('regimenes_dedicacion')
			.insert(regimen)
			.select()
			.single();
		if (error) {
			console.error('Error al crear régimen:', error);
			return null;
		}
		return data;
	},

	async update(id: number, regimen: Partial<RegimenDedicacion>): Promise<RegimenDedicacion | null> {
		const { data, error } = await supabase
			.from('regimenes_dedicacion')
			.update(regimen)
			.eq('id', id)
			.select()
			.single();
		if (error) {
			console.error('Error al actualizar régimen:', error);
			return null;
		}
		return data;
	},

	async delete(id: number): Promise<boolean> {
		const { error } = await supabase.from('regimenes_dedicacion').delete().eq('id', id);
		if (error) {
			console.error('Error al eliminar régimen:', error);
			return false;
		}
		return true;
	}
};

// =====================================
// Instituciones
// =====================================

export const AdminInstitucionesRepository = {
	async getAll(): Promise<Institucion[]> {
		const { data, error } = await supabase.from('instituciones').select('*');
		if (error) {
			console.error('Error al obtener instituciones:', error);
			return [];
		}
		return data || [];
	},

	async getById(id: number): Promise<Institucion | null> {
		const { data, error } = await supabase.from('instituciones').select('*').eq('id', id).single();
		if (error) return null;
		return data;
	},

	async getByName(nombre: string): Promise<Institucion | null> {
		const { data, error } = await supabase
			.from('instituciones')
			.select('*')
			.eq('nombre', nombre)
			.single();
		if (error) {
			if (error.code === 'PGRST116') return null;
			console.error('Error al obtener institución por nombre:', error);
			return null;
		}
		return data;
	},

	async create(institucion: Omit<Institucion, 'id'>): Promise<Institucion | null> {
		const { data, error } = await supabase
			.from('instituciones')
			.insert(institucion)
			.select()
			.single();
		if (error) {
			console.error('Error al crear institución:', error);
			return null;
		}
		return data;
	},

	async update(id: number, institucion: Partial<Institucion>): Promise<Institucion | null> {
		const { data, error } = await supabase
			.from('instituciones')
			.update(institucion)
			.eq('id', id)
			.select()
			.single();
		if (error) {
			console.error('Error al actualizar institución:', error);
			return null;
		}
		return data;
	},

	async delete(id: number): Promise<boolean> {
		const { error } = await supabase.from('instituciones').delete().eq('id', id);
		if (error) {
			console.error('Error al eliminar institución:', error);
			return false;
		}
		return true;
	}
};

// =====================================
// Facultades
// =====================================

export const AdminFacultadesRepository = {
	async getAll(): Promise<Facultad[]> {
		const { data, error } = await supabase.from('facultades').select('*');
		if (error) {
			console.error('Error al obtener facultades:', error);
			return [];
		}
		return data || [];
	},

	async getById(id: number): Promise<Facultad | null> {
		const { data, error } = await supabase.from('facultades').select('*').eq('id', id).single();
		if (error) return null;
		return data;
	},

	async getByName(nombre: string): Promise<Facultad | null> {
		const { data, error } = await supabase
			.from('facultades')
			.select('*')
			.eq('nombre', nombre)
			.single();
		if (error) {
			if (error.code === 'PGRST116') return null;
			console.error('Error al obtener facultad por nombre:', error);
			return null;
		}
		return data;
	},

	async create(facultad: Omit<Facultad, 'id'>): Promise<Facultad | null> {
		const { data, error } = await supabase.from('facultades').insert(facultad).select().single();
		if (error) {
			console.error('Error al crear facultad:', error);
			return null;
		}
		return data;
	},

	async update(id: number, facultad: Partial<Facultad>): Promise<Facultad | null> {
		const { data, error } = await supabase
			.from('facultades')
			.update(facultad)
			.eq('id', id)
			.select()
			.single();
		if (error) {
			console.error('Error al actualizar facultad:', error);
			return null;
		}
		return data;
	},

	async delete(id: number): Promise<boolean> {
		const { error } = await supabase.from('facultades').delete().eq('id', id);
		if (error) {
			console.error('Error al eliminar facultad:', error);
			return false;
		}
		return true;
	}
};

// =====================================
// Carreras
// =====================================

export const AdminCarrerasRepository = {
	async getAll(): Promise<Carrera[]> {
		const { data, error } = await supabase.from('carreras').select('*');
		if (error) {
			console.error('Error al obtener carreras:', error);
			return [];
		}
		return data || [];
	},

	async getById(id: number): Promise<Carrera | null> {
		const { data, error } = await supabase.from('carreras').select('*').eq('id', id).single();
		if (error) return null;
		return data;
	},

	async getByName(nombre: string): Promise<Carrera | null> {
		const { data, error } = await supabase
			.from('carreras')
			.select('*')
			.eq('nombre', nombre)
			.single();
		if (error) {
			if (error.code === 'PGRST116') return null;
			console.error('Error al obtener carrera por nombre:', error);
			return null;
		}
		return data;
	},

	async create(carrera: Omit<Carrera, 'id'>): Promise<Carrera | null> {
		const { data, error } = await supabase.from('carreras').insert(carrera).select().single();
		if (error) {
			console.error('Error al crear carrera:', error);
			return null;
		}
		return data;
	},

	async update(id: number, carrera: Partial<Carrera>): Promise<Carrera | null> {
		const { data, error } = await supabase
			.from('carreras')
			.update(carrera)
			.eq('id', id)
			.select()
			.single();
		if (error) {
			console.error('Error al actualizar carrera:', error);
			return null;
		}
		return data;
	},

	async delete(id: number): Promise<boolean> {
		const { error } = await supabase.from('carreras').delete().eq('id', id);
		if (error) {
			console.error('Error al eliminar carrera:', error);
			return false;
		}
		return true;
	}
};
