/**
 * Admin Module - Participants Repository
 * ---------------------------------------
 * Repositorio para operaciones CRUD de participantes/investigadores.
 */

import { supabase } from '../supabase.client';
import type { Participante } from '$lib/models/admin';

export const AdminParticipantsRepository = {
	/**
	 * Crear un nuevo participante
	 */
	async createParticipant(participante: Omit<Participante, 'id'>): Promise<Participante | null> {
		const { data, error } = await supabase
			.from('participantes')
			.insert(participante)
			.select()
			.single();

		if (error) {
			console.error('Error al crear participante:', error);
			return null;
		}

		return data;
	},

	/**
	 * Obtener un participante por ID
	 */
	async getParticipantById(id: number): Promise<Participante | null> {
		const { data, error } = await supabase.from('participantes').select('*').eq('id', id).single();

		if (error) {
			console.error('Error al obtener participante:', error);
			return null;
		}

		return data;
	},

	/**
	 * Obtener un participante por email
	 */
	async getParticipantByEmail(email: string): Promise<Participante | null> {
		const { data, error } = await supabase
			.from('participantes')
			.select('*')
			.eq('email', email)
			.single();

		if (error) {
			if (error.code === 'PGRST116') {
				return null;
			}
			console.error('Error al obtener participante por email:', error);
			return null;
		}

		return data;
	},

	/**
	 * Actualizar un participante
	 */
	async updateParticipant(
		id: number,
		participante: Partial<Participante>
	): Promise<Participante | null> {
		const { data, error } = await supabase
			.from('participantes')
			.update(participante)
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error al actualizar participante:', error);
			return null;
		}

		return data;
	},

	/**
	 * Eliminar un participante
	 */
	async deleteParticipant(id: number): Promise<boolean> {
		const { error } = await supabase.from('participantes').delete().eq('id', id);

		if (error) {
			console.error('Error al eliminar participante:', error);
			return false;
		}

		return true;
	},

	/**
	 * Listar participantes con paginación y filtros
	 */
	async listParticipants(
		page: number = 1,
		limit: number = 10,
		filters?: {
			nombre?: string;
			email?: string;
			genero?: string;
			acreditado?: boolean;
			carrera_id?: number;
		}
	): Promise<{ data: Participante[]; total: number }> {
		let query = supabase.from('participantes').select('*', { count: 'exact' });

		// Aplicar filtros
		if (filters?.nombre) {
			query = query.ilike('nombre', `%${filters.nombre}%`);
		}
		if (filters?.email) {
			query = query.ilike('email', `%${filters.email}%`);
		}
		if (filters?.genero) {
			query = query.eq('genero', filters.genero);
		}
		if (filters?.acreditado !== undefined) {
			query = query.eq('acreditado', filters.acreditado);
		}
		if (filters?.carrera_id) {
			query = query.eq('carrera_id', filters.carrera_id);
		}

		// Paginación
		const from = (page - 1) * limit;
		const to = from + limit - 1;

		const { data, error, count } = await query.range(from, to);

		if (error) {
			console.error('Error al listar participantes:', error);
			return { data: [], total: 0 };
		}

		return { data: data || [], total: count || 0 };
	},

	/**
	 * Obtener participante con información de carrera y facultad
	 */
	async getParticipantWithCareer(id: number) {
		const { data, error } = await supabase
			.from('participantes')
			.select(
				`
        *,
        carrera:carreras (
          id,
          nombre,
          facultad:facultades (
            id,
            nombre
          )
        )
      `
			)
			.eq('id', id)
			.single();

		if (error) {
			console.error('Error al obtener participante con carrera:', error);
			return null;
		}

		return data;
	},

	/**
	 * Listar participantes acreditados
	 */
	async listAccreditedParticipants(): Promise<Participante[]> {
		const { data, error } = await supabase.from('participantes').select('*').eq('acreditado', true);

		if (error) {
			console.error('Error al listar participantes acreditados:', error);
			return [];
		}

		return data || [];
	}
};
