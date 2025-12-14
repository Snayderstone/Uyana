/**
 * Admin Module - Charts Repository
 * ----------------------------------
 * Repositorio para operaciones de configuración de gráficos públicos
 */

import { supabase } from '../supabase.client';
import type { GraficoConfig, UpdateGraficoConfigDTO } from '$lib/models/admin';

export const AdminChartsRepository = {
	/**
	 * Obtener todas las configuraciones de gráficos
	 */
	async getAllChartConfigs(): Promise<GraficoConfig[]> {
		const { data, error } = await supabase
			.from('grafico_config')
			.select('*')
			.order('orden', { ascending: true });

		if (error) {
			console.error('Error al obtener configuraciones de gráficos:', error);
			return [];
		}

		return data || [];
	},

	/**
	 * Obtener solo gráficos públicos
	 */
	async getPublicChartConfigs(): Promise<GraficoConfig[]> {
		const { data, error } = await supabase
			.from('grafico_config')
			.select('*')
			.eq('es_publico', true)
			.order('orden', { ascending: true });

		if (error) {
			console.error('Error al obtener gráficos públicos:', error);
			return [];
		}

		return data || [];
	},

	/**
	 * Obtener configuración de un gráfico específico
	 */
	async getChartConfigByName(nombre_grafico: string): Promise<GraficoConfig | null> {
		const { data, error } = await supabase
			.from('grafico_config')
			.select('*')
			.eq('nombre_grafico', nombre_grafico)
			.single();

		if (error) {
			console.error('Error al obtener configuración del gráfico:', error);
			return null;
		}

		return data;
	},

	/**
	 * Actualizar configuración de un gráfico
	 */
	async updateChartConfig(
		nombre_grafico: string,
		updates: UpdateGraficoConfigDTO
	): Promise<GraficoConfig | null> {
		const { data, error } = await supabase
			.from('grafico_config')
			.update(updates)
			.eq('nombre_grafico', nombre_grafico)
			.select()
			.single();

		if (error) {
			console.error('Error al actualizar configuración del gráfico:', error);
			return null;
		}

		return data;
	},

	/**
	 * Toggle visibilidad pública de un gráfico
	 */
	async togglePublicVisibility(nombre_grafico: string): Promise<GraficoConfig | null> {
		// Primero obtenemos el estado actual
		const config = await this.getChartConfigByName(nombre_grafico);
		if (!config) return null;

		// Invertimos el estado
		return await this.updateChartConfig(nombre_grafico, {
			es_publico: !config.es_publico
		});
	},

	/**
	 * Actualizar orden de múltiples gráficos
	 */
	async updateMultipleOrders(
		updates: Array<{ nombre_grafico: string; orden: number }>
	): Promise<boolean> {
		try {
			const promises = updates.map((update) =>
				this.updateChartConfig(update.nombre_grafico, { orden: update.orden })
			);

			await Promise.all(promises);
			return true;
		} catch (error) {
			console.error('Error al actualizar órdenes de gráficos:', error);
			return false;
		}
	}
};
