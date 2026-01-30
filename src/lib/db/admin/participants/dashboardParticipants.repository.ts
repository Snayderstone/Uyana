/**
 * Admin Module - Participants Dashboard Repository
 * -------------------------------------------------
 * Repositorio para consultas optimizadas del dashboard de participantes
 * usando vistas materializadas.
 */

import { supabase } from '../../supabase.client';
import type { ParticipantsDashboardData } from '$lib/models/admin';

export const ParticipantsDashboardRepository = {
	/**
	 * Obtener todos los datos del dashboard en una sola llamada usando la vista materializada
	 * Requiere ejecutar database/views_participantes.sql primero
	 */
	async getDashboardDataComplete(): Promise<ParticipantsDashboardData | null> {
		try {
			const { data, error } = await supabase.rpc('get_participantes_dashboard_data');

			if (error) {
				console.error('Error al obtener datos del dashboard completo:', error);
				return null;
			}

			// Ordenar topParticipantes por monto_total_direccion y proyectos_en_direccion
			if (data && data.topParticipantes) {
				data.topParticipantes.sort((a: any, b: any) => {
					// Primero por monto_total_direccion (descendente)
					if (b.monto_total_direccion !== a.monto_total_direccion) {
						return b.monto_total_direccion - a.monto_total_direccion;
					}
					// Desempate por proyectos_en_direccion (descendente)
					if (b.proyectos_en_direccion !== a.proyectos_en_direccion) {
						return b.proyectos_en_direccion - a.proyectos_en_direccion;
					}
					// Segundo desempate por monto_maximo_direccion (descendente)
					return b.monto_maximo_direccion - a.monto_maximo_direccion;
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
	async refreshParticipantsViews(): Promise<boolean> {
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
			const { data, error } = await supabase
				.from('top_facultades_mv')
				.select('*')
				.order('total_participantes', { ascending: false })
				.limit(limit);

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
			const { data, error } = await supabase
				.from('top_carreras_mv')
				.select('*')
				.order('total_participantes', { ascending: false })
				.limit(limit);

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
			const { data, error } = await supabase
				.from('top_cargos_mv')
				.select('*')
				.order('total_participantes', { ascending: false })
				.limit(limit);

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
	 * Obtener top participantes con más presupuesto como director desde la vista materializada
	 */
	async getTopParticipantesProyectos(limit: number = 20) {
		try {
			const { data, error } = await supabase
				.from('top_participantes_proyectos_mv')
				.select('*')
				.order('monto_total_direccion', { ascending: false })
				.order('proyectos_en_direccion', { ascending: false })
				.order('monto_maximo_direccion', { ascending: false })
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
			const { data, error } = await supabase
				.from('participacion_directiva_genero_mv')
				.select('*')
				.order('total_proyectos', { ascending: false });

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
			const { data, error } = await supabase
				.from('facultad_genero_mv')
				.select('*')
				.order('total_participantes', { ascending: false })
				.limit(limit);

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
			const { data, error } = await supabase
				.from('cargo_genero_mv')
				.select('*')
				.order('total_participantes', { ascending: false })
				.limit(limit);

			if (error) {
				console.error('Error al obtener cargo × género:', error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error('Error al obtener cargo × género:', error);
			return [];
		}
	}
};
