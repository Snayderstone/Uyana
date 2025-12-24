/**
 * Repositorio para gestión de Instituciones
 */

import { supabase } from '../../supabase.client';
import type {
	Institucion,
	InstitucionConFacultades,
	CreateInstitucionDTO,
	UpdateInstitucionDTO
} from '$lib/models/admin';

export class InstitucionesRepository {
	private readonly table = 'instituciones';

	/**
	 * Obtener todas las instituciones
	 */
	async getAll(): Promise<Institucion[]> {
		const { data, error } = await supabase
			.from(this.table)
			.select('*')
			.order('nombre', { ascending: true });

		if (error) throw new Error(`Error al obtener instituciones: ${error.message}`);
		return data || [];
	}

	/**
	 * Obtener instituciones con sus facultades
	 */
	async getAllWithFacultades(): Promise<InstitucionConFacultades[]> {
		const { data, error } = await supabase
			.from(this.table)
			.select(
				`
				*,
				facultades:facultades(*)
			`
			)
			.order('nombre', { ascending: true });

		if (error) throw new Error(`Error al obtener instituciones con facultades: ${error.message}`);
		return data || [];
	}

	/**
	 * Obtener una institución por ID
	 */
	async getById(id: number): Promise<Institucion | null> {
		const { data, error } = await supabase.from(this.table).select('*').eq('id', id).single();

		if (error) {
			if (error.code === 'PGRST116') return null; // No encontrado
			throw new Error(`Error al obtener institución: ${error.message}`);
		}
		return data;
	}

	/**
	 * Obtener una institución con sus facultades
	 */
	async getByIdWithFacultades(id: number): Promise<InstitucionConFacultades | null> {
		const { data, error } = await supabase
			.from(this.table)
			.select(
				`
				*,
				facultades:facultades(*)
			`
			)
			.eq('id', id)
			.single();

		if (error) {
			if (error.code === 'PGRST116') return null;
			throw new Error(`Error al obtener institución con facultades: ${error.message}`);
		}
		return data;
	}

	/**
	 * Crear una nueva institución
	 */
	async create(dto: CreateInstitucionDTO): Promise<Institucion> {
		const { data, error } = await supabase
			.from(this.table)
			.insert({
				nombre: dto.nombre,
				sigla: dto.sigla || null,
				pais: dto.pais || null,
				geometry: dto.geometry || null
			})
			.select()
			.single();

		if (error) throw new Error(`Error al crear institución: ${error.message}`);
		return data;
	}

	/**
	 * Actualizar una institución
	 */
	async update(id: number, dto: UpdateInstitucionDTO): Promise<Institucion> {
		const updateData: any = {};
		if (dto.nombre !== undefined) updateData.nombre = dto.nombre;
		if (dto.sigla !== undefined) updateData.sigla = dto.sigla;
		if (dto.pais !== undefined) updateData.pais = dto.pais;
		if (dto.geometry !== undefined) updateData.geometry = dto.geometry;

		const { data, error } = await supabase
			.from(this.table)
			.update(updateData)
			.eq('id', id)
			.select()
			.single();

		if (error) throw new Error(`Error al actualizar institución: ${error.message}`);
		return data;
	}

	/**
	 * Eliminar una institución
	 */
	async delete(id: number): Promise<void> {
		const { error } = await supabase.from(this.table).delete().eq('id', id);

		if (error) throw new Error(`Error al eliminar institución: ${error.message}`);
	}

	/**
	 * Contar instituciones
	 */
	async count(): Promise<number> {
		const { count, error } = await supabase
			.from(this.table)
			.select('*', { count: 'exact', head: true });

		if (error) throw new Error(`Error al contar instituciones: ${error.message}`);
		return count || 0;
	}
}

export const institucionesRepository = new InstitucionesRepository();
