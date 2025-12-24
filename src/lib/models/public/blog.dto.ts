export type BlogPostListItemDTO = {
	id: number;
	titulo: string;
	slug: string;
	resumen: string;
	imagen_portada: string;
	fecha_publicacion: string;
};

export type BlogPostDetailDTO = {
	titulo: string;
	slug: string;
	contenido: string;
	resumen: string;
	imagen_portada: string;
	fecha_publicacion: string;
	tags: string[];
	autor: {
		nombre: string;
		avatar?: string | null;
	};
};
