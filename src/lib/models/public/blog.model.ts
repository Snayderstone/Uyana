/**
 * Blog Models
 * ------------
 * Modelos de dominio para el blog
 */

export interface BlogCategory {
	id: number;
	nombre: string;
	slug: string;
	descripcion?: string;
	creado_en: string;
}

export interface BlogPost {
	id: number;
	titulo: string;
	slug: string;
	contenido: string;
	resumen: string;
	imagen_portada: string;
	fecha_publicacion: string;
	publicado: boolean;
	creado_en: string;
	actualizado_en: string;
}

export interface BlogPostWithCategories extends BlogPost {
	categorias: BlogCategory[];
}
