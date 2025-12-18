/**
 * Repositorio para gestión de Facultades
 */

import { supabase } from '../../supabase.client';
import type {
	Facultad,
	FacultadConCarreras,
	CreateFacultadDTO,
	UpdateFacultadDTO
} from '$lib/models/admin';

export class FacultadesRepository {
	private readonly table = 'facultades';

	/**
	 * Obtener todas las facultades
	 */
	async getAll(): Promise<Facultad[]> {
		const { data, error } = await supabase
			.from(this.table)
			.select('*')
			.order('nombre', { ascending: true });

		if (error) throw new Error(`Error al obtener facultades: ${error.message}`);
		return data || [];
	}

	/**
	 * Obtener facultades con sus carreras e institución
	 */
	async getAllWithRelations(): Promise<FacultadConCarreras[]> {
		const { data, error } = await supabase
			.from(this.table)
			.select(
				`
				*,
				carreras:carreras(*),
				institucion:instituciones(nombre)
			`
			)
			.order('nombre', { ascending: true });

		if (error) throw new Error(`Error al obtener facultades con relaciones: ${error.message}`);

		return (
			data?.map((f: any) => ({
				...f,
				institucion_nombre: f.institucion?.nombre
			})) || []
		);
	}

	/**
	 * Obtener facultades por institución
	 */
	async getByInstitucion(institucionId: number): Promise<Facultad[]> {
		const { data, error } = await supabase
			.from(this.table)
			.select('*')
			.eq('institucion_id', institucionId)
			.order('nombre', { ascending: true });

		if (error) throw new Error(`Error al obtener facultades por institución: ${error.message}`);
		return data || [];
	}

	/**
	 * Obtener una facultad por ID
	 */
	async getById(id: number): Promise<Facultad | null> {
		const { data, error } = await supabase.from(this.table).select('*').eq('id', id).single();

		if (error) {
			if (error.code === 'PGRST116') return null;
			throw new Error(`Error al obtener facultad: ${error.message}`);
		}
		return data;
	}

	/**
	 * Obtener una facultad con sus carreras
	 */
	async getByIdWithCarreras(id: number): Promise<FacultadConCarreras | null> {
		const { data, error } = await supabase
			.from(this.table)
			.select(
				`
				*,
				carreras:carreras(*),
				institucion:instituciones(nombre)
			`
			)
			.eq('id', id)
			.single();

		if (error) {
			if (error.code === 'PGRST116') return null;
			throw new Error(`Error al obtener facultad con carreras: ${error.message}`);
		}

		return {
			...data,
			institucion_nombre: data.institucion?.nombre
		};
	}

	/**
	 * Crear una nueva facultad
	 */
	async create(dto: CreateFacultadDTO): Promise<Facultad> {
		const { data, error } = await supabase
			.from(this.table)
			.insert({
				institucion_id: dto.institucion_id,
				nombre: dto.nombre,
				sigla: dto.sigla || null,
				decano: dto.decano || null,
				subdecano: dto.subdecano || null,
				geometry: dto.geometry || null
			})
			.select()
			.single();

		if (error) throw new Error(`Error al crear facultad: ${error.message}`);
		return data;
	}

	/**
	 * Actualizar una facultad
	 */
	async update(id: number, dto: UpdateFacultadDTO): Promise<Facultad> {
		const updateData: any = {};
		if (dto.institucion_id !== undefined) updateData.institucion_id = dto.institucion_id;
		if (dto.nombre !== undefined) updateData.nombre = dto.nombre;
		if (dto.sigla !== undefined) updateData.sigla = dto.sigla;
		if (dto.decano !== undefined) updateData.decano = dto.decano;
		if (dto.subdecano !== undefined) updateData.subdecano = dto.subdecano;
		if (dto.geometry !== undefined) updateData.geometry = dto.geometry;

		const { data, error } = await supabase
			.from(this.table)
			.update(updateData)
			.eq('id', id)
			.select()
			.single();

		if (error) throw new Error(`Error al actualizar facultad: ${error.message}`);
		return data;
	}

	/**
	 * Eliminar una facultad
	 */
	async delete(id: number): Promise<void> {
		const { error } = await supabase.from(this.table).delete().eq('id', id);

		if (error) throw new Error(`Error al eliminar facultad: ${error.message}`);
	}

	/**
	 * Contar facultades
	 */
	async count(): Promise<number> {
		const { count, error } = await supabase
			.from(this.table)
			.select('*', { count: 'exact', head: true });

		if (error) throw new Error(`Error al contar facultades: ${error.message}`);
		return count || 0;
	}

	/**
	 * Contar facultades por institución
	 */
	async countByInstitucion(institucionId: number): Promise<number> {
		const { count, error } = await supabase
			.from(this.table)
			.select('*', { count: 'exact', head: true })
			.eq('institucion_id', institucionId);

		if (error) throw new Error(`Error al contar facultades por institución: ${error.message}`);
		return count || 0;
	}
}

export const facultadesRepository = new FacultadesRepository();
