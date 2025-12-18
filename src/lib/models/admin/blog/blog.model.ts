/**
 * Admin Module - Blog Models
 * ---------------------------
 * Entidades relacionadas con el sistema de blog.
 */

export interface BlogPost {
	id: number;
	titulo: string;
	contenido: string;
	autor_id: number;
	slug: string;
	resumen?: string;
	imagen_portada?: string;
	publicado: boolean;
	fecha_publicacion?: Date;
	vistas?: number;
	tiempo_lectura_min?: number;
	creado_en?: Date;
	actualizado_en?: Date;
}

export interface BlogCategoria {
	id: number;
	nombre: string;
	slug: string;
}

export interface BlogPostCategoria {
	id: number;
	post_id: number;
	categoria_id: number;
}
