/**
 * Admin Module - Common DTOs
 * ---------------------------
 * DTOs comunes y reutilizables en todo el módulo.
 */

// DTOs para Catálogos

export interface CatalogoItemDTO {
	id: number;
	nombre: string;
	descripcion?: string;
}

export interface CreateCatalogoItemDTO {
	nombre: string;
	descripcion?: string;
}

export interface UpdateCatalogoItemDTO extends Partial<CreateCatalogoItemDTO> {
	id: number;
}

// DTOs de Paginación

export interface PaginationDTO {
	page: number;
	limit: number;
	total: number;
	total_pages: number;
}

// DTOs de Validación y Respuestas

export interface ValidationErrorDTO {
	field: string;
	message: string;
}

export interface ApiResponseDTO<T = any> {
	success: boolean;
	data?: T;
	message?: string;
	errors?: ValidationErrorDTO[];
}
