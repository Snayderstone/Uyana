/**
 * Blog Repository
 * ----------------
 * Capa de acceso a datos para el blog
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BlogPost, BlogCategory } from '$lib/models/public/blog.model';

export class BlogRepository {
	private supabase: SupabaseClient;

	constructor(supabaseClient: SupabaseClient) {
		this.supabase = supabaseClient;
	}

	/**
	 * Obtiene todos los posts publicados ordenados por fecha de publicación
	 */
	async getAllPublishedPosts(): Promise<BlogPost[]> {
		const { data, error } = await this.supabase
			.from('blog_posts')
			.select('*')
			.eq('publicado', true)
			.order('fecha_publicacion', { ascending: false });

		if (error) {
			console.error('Error cargando posts:', error);
			throw new Error('Error al cargar los posts del blog');
		}

		return data || [];
	}

	/**
	 * Obtiene un post por su slug
	 */
	async getPostBySlug(slug: string): Promise<BlogPost | null> {
		const { data, error } = await this.supabase
			.from('blog_posts')
			.select('*')
			.eq('slug', slug)
			.eq('publicado', true)
			.single();

		if (error) {
			if (error.code === 'PGRST116') {
				// No se encontró el post
				return null;
			}
			console.error('Error cargando post:', error);
			throw new Error('Error al cargar el post');
		}

		return data;
	}

	/**
	 * Obtiene las categorías de un post específico
	 */
	async getPostCategories(postId: number): Promise<BlogCategory[]> {
		const { data, error } = await this.supabase
			.from('blog_post_categoria')
			.select('categoria:blog_categorias(id, nombre, slug, color, descripcion, creado_en)')
			.eq('post_id', postId);

		if (error) {
			console.error('Error cargando categorías:', error);
			return [];
		}

		// Extraer las categorías del objeto anidado
		return (data || [])
			.map((item: any) => item.categoria)
			.filter((cat: any) => cat !== null) as BlogCategory[];
	}

	/**
	 * Obtiene las etiquetas de un post específico
	 */
	async getPostTags(
		postId: number
	): Promise<{ id: number; nombre: string; slug: string; color: string }[]> {
		const { data, error } = await this.supabase
			.from('blog_post_etiqueta')
			.select('etiqueta:blog_etiquetas(id, nombre, slug, color)')
			.eq('post_id', postId);

		if (error) {
			console.error('Error cargando etiquetas:', error);
			return [];
		}

		// Extraer las etiquetas del objeto anidado
		return (data || []).map((item: any) => item.etiqueta).filter((tag: any) => tag !== null);
	}

	/**
	 * Incrementa el contador de vistas de un post
	 */
	async incrementPostViews(postId: number): Promise<void> {
		try {
			// Obtener vistas actuales
			const { data: postActual, error: errorGet } = await this.supabase
				.from('blog_posts')
				.select('vistas')
				.eq('id', postId)
				.single();

			if (errorGet) throw errorGet;

			// Incrementar
			const { error: errorUpdate } = await this.supabase
				.from('blog_posts')
				.update({ vistas: (postActual?.vistas || 0) + 1 })
				.eq('id', postId);

			if (errorUpdate) throw errorUpdate;
		} catch (error: any) {
			console.error('Error incrementando vistas:', error.message);
		}
	}
}
