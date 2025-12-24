/**
 * Admin Module - Catalog Service
 * -------------------------------
 * Servicio para la gestión de catálogos con operaciones CRUD y estadísticas.
 */

import type { CatalogoItemDTO, ApiResponseDTO } from '$lib/models/admin';

export type CatalogType =
	| 'estados'
	| 'tipos'
	| 'areas'
	| 'lineas'
	| 'fuentes'
	| 'cargos'
	| 'regimenes';

export interface CatalogConfig {
	type: CatalogType;
	label: string;
	description: string;
	icon?: string;
}

export interface CatalogStats {
	total: number;
	withDescription: number;
	withoutDescription: number;
	recentlyAdded: number;
}

export const CATALOG_CONFIGS: CatalogConfig[] = [
	{
		type: 'estados',
		label: 'Estados',
		description: 'Estados de proyectos',
		icon: '📊'
	},
	{
		type: 'tipos',
		label: 'Tipos',
		description: 'Tipos de proyectos',
		icon: '🏷️'
	},
	{
		type: 'areas',
		label: 'Áreas de Conocimiento',
		description: 'Áreas del conocimiento',
		icon: '🎓'
	},
	{
		type: 'lineas',
		label: 'Líneas de Investigación',
		description: 'Líneas de investigación',
		icon: '🔬'
	},
	{
		type: 'fuentes',
		label: 'Fuentes de Financiamiento',
		description: 'Fuentes de financiamiento',
		icon: '💰'
	},
	{
		type: 'cargos',
		label: 'Cargos',
		description: 'Cargos de participantes',
		icon: '👔'
	},
	{
		type: 'regimenes',
		label: 'Regímenes de Dedicación',
		description: 'Regímenes de dedicación',
		icon: '⏰'
	}
];

export class CatalogService {
	private baseUrl = '/api/admin/catalogs';

	/**
	 * Obtener todos los elementos de un catálogo
	 */
	async getAll(type: CatalogType): Promise<ApiResponseDTO<CatalogoItemDTO[]>> {
		try {
			const response = await fetch(`${this.baseUrl}/${type}`);
			return await response.json();
		} catch (error) {
			console.error(`Error al obtener catálogo ${type}:`, error);
			return {
				success: false,
				message: 'Error al obtener el catálogo'
			};
		}
	}

	/**
	 * Crear un nuevo elemento en el catálogo
	 */
	async create(
		type: CatalogType,
		data: Omit<CatalogoItemDTO, 'id'>
	): Promise<ApiResponseDTO<CatalogoItemDTO>> {
		try {
			const response = await fetch(`${this.baseUrl}/${type}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			return await response.json();
		} catch (error) {
			console.error(`Error al crear elemento en ${type}:`, error);
			return {
				success: false,
				message: 'Error al crear el elemento'
			};
		}
	}

	/**
	 * Actualizar un elemento del catálogo
	 */
	async update(
		type: CatalogType,
		id: number,
		data: Partial<CatalogoItemDTO>
	): Promise<ApiResponseDTO<CatalogoItemDTO>> {
		try {
			const response = await fetch(`${this.baseUrl}/${type}?id=${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			return await response.json();
		} catch (error) {
			console.error(`Error al actualizar elemento en ${type}:`, error);
			return {
				success: false,
				message: 'Error al actualizar el elemento'
			};
		}
	}

	/**
	 * Eliminar un elemento del catálogo
	 */
	async delete(type: CatalogType, id: number): Promise<ApiResponseDTO> {
		try {
			const response = await fetch(`${this.baseUrl}/${type}?id=${id}`, {
				method: 'DELETE'
			});
			return await response.json();
		} catch (error) {
			console.error(`Error al eliminar elemento en ${type}:`, error);
			return {
				success: false,
				message: 'Error al eliminar el elemento'
			};
		}
	}

	/**
	 * Obtener estadísticas de un catálogo
	 */
	async getStats(type: CatalogType): Promise<CatalogStats> {
		const result = await this.getAll(type);

		if (!result.success || !result.data) {
			return {
				total: 0,
				withDescription: 0,
				withoutDescription: 0,
				recentlyAdded: 0
			};
		}

		const items = result.data;
		const withDescription = items.filter((item) => item.descripcion?.trim()).length;

		return {
			total: items.length,
			withDescription,
			withoutDescription: items.length - withDescription,
			recentlyAdded: 0 // Por ahora, se puede implementar con fecha de creación
		};
	}

	/**
	 * Obtener estadísticas generales de todos los catálogos
	 */
	async getAllStats(): Promise<Map<CatalogType, CatalogStats>> {
		const statsMap = new Map<CatalogType, CatalogStats>();

		await Promise.all(
			CATALOG_CONFIGS.map(async (config) => {
				const stats = await this.getStats(config.type);
				statsMap.set(config.type, stats);
			})
		);

		return statsMap;
	}

	/**
	 * Obtener configuración de un catálogo
	 */
	getConfig(type: CatalogType): CatalogConfig | undefined {
		return CATALOG_CONFIGS.find((config) => config.type === type);
	}

	/**
	 * Obtener todas las configuraciones de catálogos
	 */
	getAllConfigs(): CatalogConfig[] {
		return CATALOG_CONFIGS;
	}
}

// Exportar instancia singleton
export const catalogService = new CatalogService();
