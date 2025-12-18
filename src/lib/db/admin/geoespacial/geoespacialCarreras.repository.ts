/**
 * Repositorio para gestión de Carreras
 */

import { supabase } from '../../supabase.client';
import type {
	Carrera,
	CarreraConRelaciones,
	CreateCarreraDTO,
	UpdateCarreraDTO
} from '$lib/models/admin';

export class CarrerasRepository {
	private readonly table = 'carreras';

	/**
	 * Obtener todas las carreras
	 */
	async getAll(): Promise<Carrera[]> {
		const { data, error } = await supabase
			.from(this.table)
			.select('*')
			.order('nombre', { ascending: true });

		if (error) throw new Error(`Error al obtener carreras: ${error.message}`);
		return data || [];
	}

	/**
	 * Obtener carreras con sus relaciones (facultad e institución)
	 */
	async getAllWithRelations(): Promise<CarreraConRelaciones[]> {
		const { data, error } = await supabase
			.from(this.table)
			.select(
				`
				*,
				facultad:facultades(
					nombre,
					institucion:instituciones(nombre)
				)
			`
			)
			.order('nombre', { ascending: true });

		if (error) throw new Error(`Error al obtener carreras con relaciones: ${error.message}`);

		return (
			data?.map((c: any) => ({
				...c,
				facultad_nombre: c.facultad?.nombre,
				institucion_nombre: c.facultad?.institucion?.nombre
			})) || []
		);
	}

	/**
	 * Obtener carreras por facultad
	 */
	async getByFacultad(facultadId: number): Promise<Carrera[]> {
		const { data, error } = await supabase
			.from(this.table)
			.select('*')
			.eq('facultad_id', facultadId)
			.order('nombre', { ascending: true });

		if (error) throw new Error(`Error al obtener carreras por facultad: ${error.message}`);
		return data || [];
	}

	/**
	 * Obtener una carrera por ID
	 */
	async getById(id: number): Promise<Carrera | null> {
		const { data, error } = await supabase.from(this.table).select('*').eq('id', id).single();

		if (error) {
			if (error.code === 'PGRST116') return null;
			throw new Error(`Error al obtener carrera: ${error.message}`);
		}
		return data;
	}

	/**
	 * Obtener una carrera con sus relaciones
	 */
	async getByIdWithRelations(id: number): Promise<CarreraConRelaciones | null> {
		const { data, error } = await supabase
			.from(this.table)
			.select(
				`
				*,
				facultad:facultades(
					nombre,
					institucion:instituciones(nombre)
				)
			`
			)
			.eq('id', id)
			.single();

		if (error) {
			if (error.code === 'PGRST116') return null;
			throw new Error(`Error al obtener carrera con relaciones: ${error.message}`);
		}

		return {
			...data,
			facultad_nombre: data.facultad?.nombre,
			institucion_nombre: data.facultad?.institucion?.nombre
		};
	}

	/**
	 * Crear una nueva carrera
	 */
	async create(dto: CreateCarreraDTO): Promise<Carrera> {
		const { data, error } = await supabase
			.from(this.table)
			.insert({
				facultad_id: dto.facultad_id,
				nombre: dto.nombre,
				geometry: dto.geometry || null
			})
			.select()
			.single();

		if (error) throw new Error(`Error al crear carrera: ${error.message}`);
		return data;
	}

	/**
	 * Actualizar una carrera
	 */
	async update(id: number, dto: UpdateCarreraDTO): Promise<Carrera> {
		const updateData: any = {};
		if (dto.facultad_id !== undefined) updateData.facultad_id = dto.facultad_id;
		if (dto.nombre !== undefined) updateData.nombre = dto.nombre;
		if (dto.geometry !== undefined) updateData.geometry = dto.geometry;

		const { data, error } = await supabase
			.from(this.table)
			.update(updateData)
			.eq('id', id)
			.select()
			.single();

		if (error) throw new Error(`Error al actualizar carrera: ${error.message}`);
		return data;
	}

	/**
	 * Eliminar una carrera
	 */
	async delete(id: number): Promise<void> {
		const { error } = await supabase.from(this.table).delete().eq('id', id);

		if (error) throw new Error(`Error al eliminar carrera: ${error.message}`);
	}

	/**
	 * Contar carreras
	 */
	async count(): Promise<number> {
		const { count, error } = await supabase
			.from(this.table)
			.select('*', { count: 'exact', head: true });

		if (error) throw new Error(`Error al contar carreras: ${error.message}`);
		return count || 0;
	}

	/**
	 * Contar carreras por facultad
	 */
	async countByFacultad(facultadId: number): Promise<number> {
		const { count, error } = await supabase
			.from(this.table)
			.select('*', { count: 'exact', head: true })
			.eq('facultad_id', facultadId);

		if (error) throw new Error(`Error al contar carreras por facultad: ${error.message}`);
		return count || 0;
	}
}

export const carrerasRepository = new CarrerasRepository();
