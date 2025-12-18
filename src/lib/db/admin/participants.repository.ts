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
			acreditado?: boolean;
			carrera_id?: number;
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
			query = query.eq('acreditado', filters.acreditado);
		}
		if (filters?.carrera_id) {
			query = query.eq('carrera_id', filters.carrera_id);
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
	 * Obtener todos los datos del dashboard en una sola llamada usando la vista materializada
	 * Requiere ejecutar database/views_participantes.sql primero
	 */
	async getDashboardDataComplete() {
		try {
			const { data, error } = await supabase.rpc('get_participantes_dashboard_data');

			if (error) {
				console.error('Error al obtener datos del dashboard completo:', error);
				return null;
			}

			// Ordenar topParticipantes por total_proyectos y proyectos_como_director
			if (data && data.topParticipantes) {
				data.topParticipantes.sort((a: any, b: any) => {
					// Primero por total_proyectos (descendente)
					if (b.total_proyectos !== a.total_proyectos) {
						return b.total_proyectos - a.total_proyectos;
					}
					// Desempate por proyectos_como_director (descendente)
					return b.proyectos_como_director - a.proyectos_como_director;
				});
			}

			return data;
		} catch (error) {
			console.error('Error al obtener datos del dashboard:', error);
			return null;
		}
	},

	/**
	 * Refrescar todas las vistas materializadas de participantes
	 */
	async refreshParticipantsViews() {
		try {
			console.log('🔄 Intentando refrescar vistas materializadas...');

			// NOTA: Las funciones RPC en Supabase requieren permisos especiales.
			// Si la función falla, significa que:
			// 1. La función no existe en la BD
			// 2. No tienes permisos para ejecutarla
			// 3. Las vistas materializadas no están creadas

			const { data, error } = await supabase.rpc('refresh_participantes_stats');

			if (error) {
				console.error('❌ Error al llamar refresh_participantes_stats():', {
					message: error.message,
					details: error.details,
					hint: error.hint,
					code: error.code
				});

				// Crear mensaje de error detallado según el tipo de error
				let errorMessage = 'Error al refrescar vistas materializadas. ';

				if (
					error.code === '42883' ||
					error.message?.toLowerCase().includes('does not exist') ||
					error.message?.toLowerCase().includes('function')
				) {
					errorMessage +=
						'La función refresh_participantes_stats() no existe en la base de datos. ' +
						'Ejecuta el script database/views_participantes.sql en Supabase SQL Editor.';
				} else if (error.code === '42501' || error.message?.toLowerCase().includes('permission')) {
					errorMessage +=
						'No tienes permisos para ejecutar la función. ' +
						'Contacta al administrador de la base de datos.';
				} else if (error.message?.toLowerCase().includes('does not exist')) {
					errorMessage +=
						'Una o más vistas materializadas no existen. ' +
						'Ejecuta el script database/views_participantes.sql completo.';
				} else {
					errorMessage += `${error.message}. ${error.hint || ''}`;
				}

				throw new Error(errorMessage);
			}

			console.log('✅ Vistas materializadas refrescadas correctamente');
			return true;
		} catch (error) {
			console.error('❌ Error crítico al refrescar vistas:', error);
			throw error;
		}
	},

	/**
	 * Obtener top facultades desde la vista materializada
	 */
	async getTopFacultades(limit: number = 15) {
		try {
			const { data, error } = await supabase.from('top_facultades_mv').select('*').limit(limit);

			if (error) {
				console.error('Error al obtener top facultades:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener top facultades:', error);
			return [];
		}
	},

	/**
	 * Obtener top carreras desde la vista materializada
	 */
	async getTopCarreras(limit: number = 20) {
		try {
			const { data, error } = await supabase.from('top_carreras_mv').select('*').limit(limit);

			if (error) {
				console.error('Error al obtener top carreras:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener top carreras:', error);
			return [];
		}
	},

	/**
	 * Obtener top cargos desde la vista materializada
	 */
	async getTopCargos(limit: number = 20) {
		try {
			const { data, error } = await supabase.from('top_cargos_mv').select('*').limit(limit);

			if (error) {
				console.error('Error al obtener top cargos:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener top cargos:', error);
			return [];
		}
	},

	/**
	 * Obtener top participantes con más proyectos desde la vista materializada
	 */
	async getTopParticipantesProyectos(limit: number = 20) {
		try {
			const { data, error } = await supabase
				.from('top_participantes_proyectos_mv')
				.select('*')
				.order('total_proyectos', { ascending: false })
				.order('proyectos_como_director', { ascending: false })
				.limit(limit);

			if (error) {
				console.error('Error al obtener top participantes:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener top participantes:', error);
			return [];
		}
	},

	/**
	 * Obtener participación directiva por género desde la vista materializada
	 */
	async getParticipacionDirectivaGenero() {
		try {
			const { data, error } = await supabase.from('participacion_directiva_genero_mv').select('*');

			if (error) {
				console.error('Error al obtener participación directiva:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener participación directiva:', error);
			return [];
		}
	},

	/**
	 * Obtener facultad × género desde la vista materializada
	 */
	async getFacultadGenero(limit: number = 15) {
		try {
			const { data, error } = await supabase.from('facultad_genero_mv').select('*').limit(limit);

			if (error) {
				console.error('Error al obtener facultad × género:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener facultad × género:', error);
			return [];
		}
	},

	/**
	 * Obtener cargo × género desde la vista materializada
	 */
	async getCargoGenero(limit: number = 10) {
		try {
			const { data, error } = await supabase.from('cargo_genero_mv').select('*').limit(limit);

			if (error) {
				console.error('Error al obtener cargo × género:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener cargo × género:', error);
			return [];
		}
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
