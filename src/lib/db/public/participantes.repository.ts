/**
 * Public Module - Participants Repository
 * ----------------------------------------
 * Repositorio para consultas públicas de participantes/investigadores acreditados.
 * Solo expone datos necesarios para el directorio público de investigadores.
 */

import { supabase } from '../supabase.client';
import type { Investigador } from '$lib/models/investigator.model';

export const PublicParticipantesRepository = {
	/**
	 * Obtener todos los investigadores acreditados con información completa
	 * para el directorio público
	 */
	async getAccreditedResearchers(): Promise<Investigador[]> {
		try {
			const { data, error } = await supabase
				.from('participantes')
				.select(
					`
					id,
					nombre,
					email,
					url_foto,
					redes_sociales,
					linea_investigacion,
					carreras!inner (
						id,
						nombre,
						facultades!inner (
							id,
							nombre
						)
					)
				`
				)
				.eq('acreditado', true)
				.order('nombre', { ascending: true });

			if (error) {
				console.error('Error al obtener investigadores acreditados:', error);
				return [];
			}

			if (!data || data.length === 0) {
				return [];
			}

			// Transformar los datos al formato Investigador
			const investigadores: Investigador[] = data.map((participante: any) => {
				const carrera = participante.carreras;
				const facultad = carrera?.facultades;

				return {
					id: participante.id,
					nombre: participante.nombre,
					email: participante.email || '',
					foto: participante.url_foto || '/images/default-avatar.png',
					linea_investigacion: participante.linea_investigacion || 'No especificada',
					carrera: carrera?.nombre || 'No especificada',
					facultad: facultad?.nombre || 'No especificada',
					redes: participante.redes_sociales || ''
				};
			});

			return investigadores;
		} catch (error) {
			console.error('Error al obtener investigadores acreditados:', error);
			return [];
		}
	},

	/**
	 * Buscar investigadores acreditados por nombre, carrera o línea de investigación
	 */
	async searchAccreditedResearchers(searchTerm: string): Promise<Investigador[]> {
		try {
			if (!searchTerm || searchTerm.trim() === '') {
				return this.getAccreditedResearchers();
			}

			const searchPattern = `%${searchTerm.trim()}%`;

			const { data, error } = await supabase
				.from('participantes')
				.select(
					`
					id,
					nombre,
					email,
					url_foto,
					redes_sociales,
					linea_investigacion,
					carreras!inner (
						id,
						nombre,
						facultades!inner (
							id,
							nombre
						)
					)
				`
				)
				.eq('acreditado', true)
				.or(
					`nombre.ilike.${searchPattern},linea_investigacion.ilike.${searchPattern},carreras.nombre.ilike.${searchPattern}`
				)
				.order('nombre', { ascending: true });

			if (error) {
				console.error('Error al buscar investigadores:', error);
				return [];
			}

			if (!data || data.length === 0) {
				return [];
			}

			// Transformar los datos al formato Investigador
			const investigadores: Investigador[] = data.map((participante: any) => {
				const carrera = participante.carreras;
				const facultad = carrera?.facultades;

				return {
					id: participante.id,
					nombre: participante.nombre,
					email: participante.email || '',
					foto: participante.url_foto || '/images/default-avatar.png',
					linea_investigacion: participante.linea_investigacion || 'No especificada',
					carrera: carrera?.nombre || 'No especificada',
					facultad: facultad?.nombre || 'No especificada',
					redes: participante.redes_sociales || ''
				};
			});

			return investigadores;
		} catch (error) {
			console.error('Error al buscar investigadores:', error);
			return [];
		}
	},

	/**
	 * Obtener un investigador acreditado por ID
	 */
	async getAccreditedResearcherById(id: number): Promise<Investigador | null> {
		try {
			const { data, error } = await supabase
				.from('participantes')
				.select(
					`
					id,
					nombre,
					email,
					url_foto,
					redes_sociales,
					linea_investigacion,
					carreras!inner (
						id,
						nombre,
						facultades!inner (
							id,
							nombre
						)
					)
				`
				)
				.eq('id', id)
				.eq('acreditado', true)
				.single();

			if (error) {
				console.error('Error al obtener investigador:', error);
				return null;
			}

			if (!data) {
				return null;
			}

			const carrera = data.carreras as any;
			const facultad = carrera?.facultades as any;

			return {
				id: data.id,
				nombre: data.nombre,
				email: data.email || '',
				foto: data.url_foto || '/images/default-avatar.png',
				linea_investigacion: data.linea_investigacion || 'No especificada',
				carrera: carrera?.nombre || 'No especificada',
				facultad: facultad?.nombre || 'No especificada',
				redes: data.redes_sociales || ''
			};
		} catch (error) {
			console.error('Error al obtener investigador:', error);
			return null;
		}
	}
};
