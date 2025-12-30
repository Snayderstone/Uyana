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
	 * Calcula el tiempo de lectura basado en el contenido HTML
	 * Promedio de 200 palabras por minuto
	 */
	private calculateReadingTime(htmlContent: string): string {
		// Remover tags HTML
		const textContent = htmlContent.replace(/<[^>]*>/g, ' ');
		// Contar palabras (separadas por espacios)
		const words = textContent.trim().split(/\s+/).length;
		// Calcular minutos (promedio 200 palabras/minuto)
		const minutes = Math.ceil(words / 200);
		return `${minutes} min`;
	}

	/**
	 * Obtiene la lista de posts publicados para la página principal del blog
	 */
	async getPublishedPosts(): Promise<BlogPostListItemDTO[]> {
		const posts = await this.repository.getAllPublishedPosts();

		// Transformar a DTO con campos adicionales
		return await Promise.all(
			posts.map(async (post) => {
				// Obtener etiquetas del post
				const etiquetas = await this.repository.getPostTags(post.id);

				return {
					id: post.id,
					titulo: post.titulo,
					slug: post.slug,
					resumen: post.resumen,
					imagen_portada: post.imagen_portada,
					fecha_publicacion: post.fecha_publicacion,
					tiempo_lectura: this.calculateReadingTime(post.contenido),
					retiquetas: etiquetas.map((e) => ({
						id: e.id,
						nombre: e.nombre,
						slug: e.slug,
						color: e.color
					}))
				};
			})
		);
	}

	/**
	 * Obtiene el detalle completo de un post por su slug
	 */
	async getPostDetail(slug: string): Promise<BlogPostDetailDTO | null> {
		const post = await this.repository.getPostBySlug(slug);

		if (!post) {
			return null;
		}

		// Incrementar contador de vistas de forma asíncrona
		// No esperamos el resultado para no ralentizar la carga
		this.repository.incrementPostViews(post.id).catch((err) => {
			console.error('Error al incrementar vistas:', err);
		});

		// Obtener las categorías y etiquetas del post
		const categorias = await this.repository.getPostCategories(post.id);
		const etiquetas = await this.repository.getPostTags(post.id);

		// Transformar a DTO con toda la información necesaria
		return {
			titulo: post.titulo,
			slug: post.slug,
			contenido: post.contenido,
			resumen: post.resumen || '',
			imagen_portada: post.imagen_portada || '/images/posts/placeholder.jpg',
			fecha_publicacion: post.fecha_publicacion || post.creado_en,
			categorias: categorias.map((c) => ({
				id: c.id,
				nombre: c.nombre,
				slug: c.slug,
				color: c.color
			})),
			etiquetas: etiquetas.map((e) => ({
				id: e.id,
				nombre: e.nombre,
				slug: e.slug,
				color: e.color
			})),
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
