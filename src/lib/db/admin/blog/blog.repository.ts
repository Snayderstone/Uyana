/**
 * Admin Module - Blog Repository
 * -------------------------------
 * Repositorio para operaciones CRUD de blog posts.
 */

import { supabase } from '../../supabase.client';
import type { BlogPost, BlogCategoria, BlogPostCategoria } from '$lib/models/admin';

export const AdminBlogRepository = {
	// =====================================
	// Blog Posts
	// =====================================

	async createPost(
		post: Omit<BlogPost, 'id' | 'creado_en' | 'actualizado_en'>
	): Promise<BlogPost | null> {
		const { data, error } = await supabase.from('blog_posts').insert(post).select().single();

		if (error) {
			console.error('Error al crear post:', error);
			return null;
		}

		return data;
	},

	async getPostById(id: number): Promise<BlogPost | null> {
		const { data, error } = await supabase.from('blog_posts').select('*').eq('id', id).single();

		if (error) {
			console.error('Error al obtener post:', error);
			return null;
		}

		return data;
	},

	async getPostBySlug(slug: string): Promise<BlogPost | null> {
		const { data, error } = await supabase.from('blog_posts').select('*').eq('slug', slug).single();

		if (error) {
			if (error.code === 'PGRST116') return null;
			console.error('Error al obtener post por slug:', error);
			return null;
		}

		return data;
	},

	async updatePost(id: number, post: Partial<BlogPost>): Promise<BlogPost | null> {
		const { data, error } = await supabase
			.from('blog_posts')
			.update({ ...post, actualizado_en: new Date() })
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error al actualizar post:', error);
			return null;
		}

		return data;
	},

	async deletePost(id: number): Promise<boolean> {
		const { error } = await supabase.from('blog_posts').delete().eq('id', id);

		if (error) {
			console.error('Error al eliminar post:', error);
			return false;
		}

		return true;
	},

	async listPosts(
		page: number = 1,
		limit: number = 10,
		filters?: {
			titulo?: string;
			publicado?: boolean;
			autor_id?: number;
		}
	): Promise<{ data: BlogPost[]; total: number }> {
		let query = supabase.from('blog_posts').select('*', { count: 'exact' });

		if (filters?.titulo) {
			query = query.ilike('titulo', `%${filters.titulo}%`);
		}
		if (filters?.publicado !== undefined) {
			query = query.eq('publicado', filters.publicado);
		}
		if (filters?.autor_id) {
			query = query.eq('autor_id', filters.autor_id);
		}

		query = query.order('creado_en', { ascending: false });

		const from = (page - 1) * limit;
		const to = from + limit - 1;

		const { data, error, count } = await query.range(from, to);

		if (error) {
			console.error('Error al listar posts:', error);
			return { data: [], total: 0 };
		}

		return { data: data || [], total: count || 0 };
	},

	// =====================================
	// Categorías
	// =====================================

	async createCategory(categoria: Omit<BlogCategoria, 'id'>): Promise<BlogCategoria | null> {
		const { data, error } = await supabase
			.from('blog_categorias')
			.insert(categoria)
			.select()
			.single();

		if (error) {
			console.error('Error al crear categoría [REPOSITORY]:', error);
			throw new Error(`Error Supabase: ${error.message} (${error.code})`);
		}

		return data;
	},

	// Alias para createCategoria
	async createCategoria(categoria: Omit<BlogCategoria, 'id'>): Promise<BlogCategoria | null> {
		return this.createCategory(categoria);
	},

	async getAllCategories(): Promise<BlogCategoria[]> {
		const { data, error } = await supabase.from('blog_categorias').select('*');

		if (error) {
			console.error('Error al obtener categorías:', error);
			return [];
		}

		return data || [];
	},

	// Alias para listCategorias
	async listCategorias(): Promise<BlogCategoria[]> {
		return this.getAllCategories();
	},

	async getCategoryById(id: number): Promise<BlogCategoria | null> {
		const { data, error } = await supabase
			.from('blog_categorias')
			.select('*')
			.eq('id', id)
			.single();

		if (error) return null;
		return data;
	},

	// Alias para getCategoriaById
	async getCategoriaById(id: number): Promise<BlogCategoria | null> {
		return this.getCategoryById(id);
	},

	async getCategoriaBySlug(slug: string): Promise<BlogCategoria | null> {
		const { data, error } = await supabase
			.from('blog_categorias')
			.select('*')
			.eq('slug', slug)
			.single();

		if (error) {
			if (error.code === 'PGRST116') return null;
			console.error('Error al obtener categoría por slug:', error);
			return null;
		}

		return data;
	},

	async updateCategory(
		id: number,
		categoria: Partial<BlogCategoria>
	): Promise<BlogCategoria | null> {
		const { data, error } = await supabase
			.from('blog_categorias')
			.update(categoria)
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error al actualizar categoría:', error);
			return null;
		}

		return data;
	},

	// Alias para updateCategoria
	async updateCategoria(
		id: number,
		categoria: Partial<BlogCategoria>
	): Promise<BlogCategoria | null> {
		return this.updateCategory(id, categoria);
	},

	async deleteCategory(id: number): Promise<boolean> {
		const { error } = await supabase.from('blog_categorias').delete().eq('id', id);

		if (error) {
			console.error('Error al eliminar categoría:', error);
			return false;
		}

		return true;
	},

	// Alias para deleteCategoria
	async deleteCategoria(id: number): Promise<boolean> {
		return this.deleteCategory(id);
	},

	// =====================================
	// Relaciones Post-Categoría
	// =====================================

	async addPostCategory(post_id: number, categoria_id: number): Promise<boolean> {
		const { error } = await supabase.from('blog_post_categoria').insert({ post_id, categoria_id });

		if (error) {
			console.error('Error al agregar categoría al post:', error);
			return false;
		}

		return true;
	},

	async getPostCategories(post_id: number): Promise<number[]> {
		const { data, error } = await supabase
			.from('blog_post_categoria')
			.select('categoria_id')
			.eq('post_id', post_id);

		if (error) {
			console.error('Error al obtener categorías del post:', error);
			return [];
		}

		return data.map((item) => item.categoria_id);
	},

	async removePostCategories(post_id: number): Promise<boolean> {
		const { error } = await supabase.from('blog_post_categoria').delete().eq('post_id', post_id);

		if (error) {
			console.error('Error al eliminar categorías del post:', error);
			return false;
		}

		return true;
	},

	// =====================================
	// Relaciones Post-Etiqueta
	// =====================================

	async addPostTag(post_id: number, etiqueta_id: number): Promise<boolean> {
		const { error } = await supabase.from('blog_post_etiqueta').insert({ post_id, etiqueta_id });

		if (error) {
			console.error('Error al agregar etiqueta al post:', error);
			return false;
		}

		return true;
	},

	async getPostTags(post_id: number): Promise<number[]> {
		const { data, error } = await supabase
			.from('blog_post_etiqueta')
			.select('etiqueta_id')
			.eq('post_id', post_id);

		if (error) {
			console.error('Error al obtener etiquetas del post:', error);
			return [];
		}

		return data.map((item) => item.etiqueta_id);
	},

	async removePostTags(post_id: number): Promise<boolean> {
		const { error } = await supabase.from('blog_post_etiqueta').delete().eq('post_id', post_id);

		if (error) {
			console.error('Error al eliminar etiquetas del post:', error);
			return false;
		}

		return true;
	},

	// =====================================
	// Etiquetas
	// =====================================

	async createEtiqueta(etiqueta: {
		nombre: string;
		slug: string;
		color?: string;
	}): Promise<any | null> {
		const { data, error } = await supabase
			.from('blog_etiquetas')
			.insert({
				...etiqueta,
				color: etiqueta.color || '#8b5cf6'
			})
			.select()
			.single();

		if (error) {
			console.error('Error al crear etiqueta [REPOSITORY]:', error);
			throw new Error(`Error Supabase: ${error.message} (${error.code})`);
		}

		return data;
	},

	async listEtiquetas(): Promise<any[]> {
		const { data, error } = await supabase
			.from('blog_etiquetas')
			.select('id, nombre, slug, color, uso_count')
			.order('uso_count', { ascending: false });

		if (error) {
			console.error('Error al listar etiquetas:', error);
			return [];
		}

		return data || [];
	},

	async getEtiquetaById(id: number): Promise<any | null> {
		const { data, error } = await supabase.from('blog_etiquetas').select('*').eq('id', id).single();

		if (error) return null;
		return data;
	},

	async getEtiquetaBySlug(slug: string): Promise<any | null> {
		const { data, error } = await supabase
			.from('blog_etiquetas')
			.select('*')
			.eq('slug', slug)
			.single();

		if (error) {
			if (error.code === 'PGRST116') return null;
			console.error('Error al obtener etiqueta por slug:', error);
			return null;
		}

		return data;
	},

	async updateEtiqueta(
		id: number,
		etiqueta: { nombre?: string; slug?: string; color?: string }
	): Promise<any | null> {
		const { data, error } = await supabase
			.from('blog_etiquetas')
			.update(etiqueta)
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error al actualizar etiqueta:', error);
			return null;
		}

		return data;
	},

	async deleteEtiqueta(id: number): Promise<boolean> {
		// Primero eliminar relaciones
		const { error: junctionError } = await supabase
			.from('blog_post_etiqueta')
			.delete()
			.eq('etiqueta_id', id);

		if (junctionError) {
			console.error('Error al eliminar relaciones de etiqueta:', junctionError);
			return false;
		}

		// Luego eliminar la etiqueta
		const { error } = await supabase.from('blog_etiquetas').delete().eq('id', id);

		if (error) {
			console.error('Error al eliminar etiqueta:', error);
			return false;
		}

		return true;
	},

	// Alias para compatibilidad
	async getTagById(id: number): Promise<any | null> {
		return this.getEtiquetaById(id);
	},

	async getAllTags(): Promise<any[]> {
		return this.listEtiquetas();
	}
};
