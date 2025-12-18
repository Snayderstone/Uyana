/**
 * Admin Module - Blog DTOs
 * -------------------------
 * DTOs para el sistema de blog.
 */

export interface CreateBlogPostDTO {
	titulo: string;
	contenido: string;
	resumen?: string;
	imagen_portada?: string;
	publicado?: boolean;
	fecha_publicacion?: string;
	categorias?: number[];
	etiquetas?: number[];
}

export interface UpdateBlogPostDTO extends Partial<CreateBlogPostDTO> {
	id: number;
}

export interface BlogPostResponseDTO {
	id: number;
	titulo: string;
	contenido: string;
	slug: string;
	resumen?: string;
	imagen_portada?: string;
	publicado: boolean;
	fecha_publicacion?: string;
	vistas?: number;
	tiempo_lectura_min?: number;
	creado_en: string;
	actualizado_en: string;
	autor: {
		id: number;
		nombre: string;
	};
	categorias: Array<{
		id: number;
		nombre: string;
		slug: string;
	}>;
	etiquetas: Array<{
		id: number;
		nombre: string;
		slug: string;
		color?: string;
	}>;
}

export interface CreateBlogCategoriaDTO {
	nombre: string;
	slug: string;
}

export interface UpdateBlogCategoriaDTO extends Partial<CreateBlogCategoriaDTO> {
	id?: number;
}
