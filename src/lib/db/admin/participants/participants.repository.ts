/**
 * Admin Module - Participants Repository
 * ---------------------------------------
 * Repositorio para operaciones CRUD de participantes/investigadores.
 * Para consultas de dashboard y vistas materializadas, ver dashboard.participants.repository.ts
 */

import { supabase } from '../../supabase.client';
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
			acreditado?: boolean | null;
			carrera_id?: number;
			carrera_nombre?: string;
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
			if (filters.acreditado === null) {
				// Filter for NULL values in database
				query = query.is('acreditado', null);
			} else {
				// Filter for boolean values (true/false)
				query = query.eq('acreditado', filters.acreditado);
			}
		}
		if (filters?.carrera_id) {
			query = query.eq('carrera_id', filters.carrera_id);
		}
		if (filters?.carrera_nombre) {
			// Filter by career name through relationship (this method doesn't have career join)
			// This method might need career join to work properly
		}

		// Ordenar por nombre
		query = query.order('nombre', { ascending: true });

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
	 * Listar participantes con carrera (optimizado con JOIN)
	 */
	async listParticipantsWithCareer(
		page: number = 1,
		limit: number = 10,
		filters?: {
			nombre?: string;
			email?: string;
			genero?: string;
			acreditado?: boolean | null;
			carrera_id?: number;
			facultad_id?: number;
			carrera_nombre?: string;
		}
	) {
		let query = supabase.from('participantes').select(
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
		`,
			{ count: 'exact' }
		);

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
			if (filters.acreditado === null) {
				// Filter for NULL values in database
				query = query.is('acreditado', null);
			} else {
				// Filter for boolean values (true/false)
				query = query.eq('acreditado', filters.acreditado);
			}
		}
		if (filters?.carrera_id) {
			query = query.eq('carrera_id', filters.carrera_id);
		}
		if (filters?.facultad_id) {
			// Filter by faculty through the career relationship
			query = query.eq('carrera.facultad_id', filters.facultad_id);
		}
		if (filters?.carrera_nombre) {
			// Filter by career name through the relationship
			query = query.ilike('carrera.nombre', `%${filters.carrera_nombre}%`);
		}

		// Ordenar por ID
		query = query.order('id', { ascending: true });

		// Paginación
		const from = (page - 1) * limit;
		const to = from + limit - 1;

		const { data, error, count } = await query.range(from, to);

		if (error) {
			console.error('Error al listar participantes con carrera:', error);
			return { data: [], total: 0 };
		}

		return { data: data || [], total: count || 0 };
	},

	/**
	 * Obtener todos los participantes sin límite (para cargar en frontend)
	 */
	async getAllParticipantsWithCareer() {
		// Supabase tiene límite de 1000 por consulta, así que hacemos múltiples llamadas
		const pageSize = 1000;
		let allData: any[] = [];
		let page = 1;
		let hasMore = true;

		while (hasMore) {
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
				.order('id', { ascending: true })
				.range((page - 1) * pageSize, page * pageSize - 1);

			if (error) {
				console.error('Error al obtener participantes:', error);
				break;
			}

			if (data && data.length > 0) {
				allData = [...allData, ...data];
				page++;
				hasMore = data.length === pageSize; // Si trae menos de 1000, ya no hay más
			} else {
				hasMore = false;
			}
		}

		console.log(`✅ Cargados ${allData.length} participantes en ${page - 1} páginas`);
		return allData;
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
