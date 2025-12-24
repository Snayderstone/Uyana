/**
 * Blog Service
 * -------------
 * Capa de lógica de negocio para el blog
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '$lib/db/supabase.client';
import { BlogRepository } from '$lib/db/public/blog.repository';
import type { BlogPostListItemDTO, BlogPostDetailDTO } from '$lib/models/public/blog.dto';

class BlogService {
	private repository: BlogRepository;

	constructor(supabaseClient: SupabaseClient) {
		this.repository = new BlogRepository(supabaseClient);
	}

	/**
	 * Obtiene la lista de posts publicados para la página principal del blog
	 */
	async getPublishedPosts(): Promise<BlogPostListItemDTO[]> {
		const posts = await this.repository.getAllPublishedPosts();

		// Transformar a DTO con solo los campos necesarios
		return posts.map((post) => ({
			id: post.id,
			titulo: post.titulo,
			slug: post.slug,
			resumen: post.resumen,
			imagen_portada: post.imagen_portada,
			fecha_publicacion: post.fecha_publicacion
		}));
	}

	/**
	 * Obtiene el detalle completo de un post por su slug
	 */
	async getPostDetail(slug: string): Promise<BlogPostDetailDTO | null> {
		const post = await this.repository.getPostBySlug(slug);

		if (!post) {
			return null;
		}

		// Obtener las categorías del post
		const categorias = await this.repository.getPostCategories(post.id);
		const tags = categorias.map((cat) => cat.nombre);

		// Transformar a DTO con toda la información necesaria
		return {
			titulo: post.titulo,
			slug: post.slug,
			contenido: post.contenido,
			resumen: post.resumen || '',
			imagen_portada: post.imagen_portada || '/images/posts/placeholder.jpg',
			fecha_publicacion: post.fecha_publicacion || post.creado_en,
			tags,
			autor: {
				nombre: 'Dirección de Investigación UCE',
				avatar: null
			}
		};
	}
}

// Exportar instancia singleton para uso en las rutas
export const blogService = new BlogService(supabase);

// Exportar clase para testing o usos especiales (ej: admin con service_role)
export { BlogService };
