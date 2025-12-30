export type BlogPostListItemDTO = {
	id: number;
	titulo: string;
	slug: string;
	resumen: string;
	imagen_portada: string;
	fecha_publicacion: string;
	tiempo_lectura?: string;
	etiquetas?: string[];
};

export type BlogPostDetailDTO = {
	titulo: string;
	slug: string;
	contenido: string;
	resumen: string;
	imagen_portada: string;
	fecha_publicacion: string;
	categorias: { id: number; nombre: string; slug: string; color: string }[];
	etiquetas: { id: number; nombre: string; slug: string; color: string }[];
	tiempo_lectura?: string;
	autor: {
		nombre: string;
		avatar?: string | null;
	};
};
