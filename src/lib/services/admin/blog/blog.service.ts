/**
 * Admin Module - Blog Service
 * ----------------------------
 * Servicio para gestión de contenido del blog.
 */

import { AdminBlogRepository } from '$lib/db/admin/blog/blog.repository';
import type {
	CreateBlogPostDTO,
	UpdateBlogPostDTO,
	BlogPostResponseDTO,
	ValidationErrorDTO,
	BlogPost
} from '$lib/models/admin';

export const AdminBlogService = {
	/**
	 * Validar campos de un post
	 */
	validatePost(dto: CreateBlogPostDTO | UpdateBlogPostDTO): ValidationErrorDTO[] {
		const errors: ValidationErrorDTO[] = [];

		if ('titulo' in dto && !dto.titulo?.trim()) {
			errors.push({ field: 'titulo', message: 'El título es obligatorio' });
		}

		if ('contenido' in dto && !dto.contenido?.trim()) {
			errors.push({ field: 'contenido', message: 'El contenido es obligatorio' });
		}

		return errors;
	},

	/**
	 * Genera un slug único desde un título
	 */
	async generateUniqueSlug(titulo: string): Promise<string> {
		const baseSlug = titulo
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');

		let slug = baseSlug;
		let counter = 1;

		while (await this.checkDuplicateSlug(slug)) {
			slug = `${baseSlug}-${counter}`;
			counter++;
		}

		return slug;
	},

	/**
	 * Verificar si un slug ya existe
	 */
	async checkDuplicateSlug(slug: string, excludeId?: number): Promise<boolean> {
		const existing = await AdminBlogRepository.getPostBySlug(slug);
		if (!existing) return false;
		if (excludeId && existing.id === excludeId) return false;
		return true;
	},

	/**
	 * Crear un post
	 */
	async createPost(dto: CreateBlogPostDTO, autorId: number): Promise<BlogPostResponseDTO | null> {
		const errors = this.validatePost(dto);
		if (errors.length > 0) {
			console.error('Errores de validación:', errors);
			return null;
		}

		// Generar slug único automáticamente desde el título
		const slug = await this.generateUniqueSlug(dto.titulo);

		const postData: Omit<BlogPost, 'id' | 'creado_en' | 'actualizado_en'> = {
			titulo: dto.titulo.trim(),
			contenido: dto.contenido.trim(),
			slug,
			autor_id: autorId,
			resumen: dto.resumen?.trim(),
			imagen_portada: dto.imagen_portada,
			publicado: dto.publicado || false,
			fecha_publicacion: dto.fecha_publicacion ? new Date(dto.fecha_publicacion) : undefined
		};

		const post = await AdminBlogRepository.createPost(postData);
		if (!post) return null;

		// Agregar categorías
		if (dto.categorias && dto.categorias.length > 0) {
			await Promise.all(
				dto.categorias.map((catId) => AdminBlogRepository.addPostCategory(post.id, catId))
			);
		}

		// Agregar etiquetas
		if (dto.etiquetas && dto.etiquetas.length > 0) {
			await Promise.all(
				dto.etiquetas.map((tagId) => AdminBlogRepository.addPostTag(post.id, tagId))
			);
		}

		return await this.getPostById(post.id);
	},

	/**
	 * Actualizar un post
	 */
	async updatePost(dto: UpdateBlogPostDTO): Promise<BlogPostResponseDTO | null> {
		const errors = this.validatePost(dto);
		if (errors.length > 0) {
			console.error('Errores de validación:', errors);
			return null;
		}

		// NOTA: El slug NO se actualiza en ediciones, mantiene el original
		const updateData: Partial<BlogPost> = {};
		if (dto.titulo) updateData.titulo = dto.titulo.trim();
		if (dto.contenido) updateData.contenido = dto.contenido.trim();
		if (dto.resumen !== undefined) updateData.resumen = dto.resumen?.trim();
		if (dto.imagen_portada !== undefined) updateData.imagen_portada = dto.imagen_portada;
		if (dto.publicado !== undefined) updateData.publicado = dto.publicado;
		if (dto.fecha_publicacion !== undefined) {
			updateData.fecha_publicacion = dto.fecha_publicacion
				? new Date(dto.fecha_publicacion)
				: undefined;
		}

		const post = await AdminBlogRepository.updatePost(dto.id, updateData);
		if (!post) return null;

		// Actualizar categorías si se proporcionan
		if (dto.categorias !== undefined) {
			await AdminBlogRepository.removePostCategories(dto.id);
			if (dto.categorias.length > 0) {
				await Promise.all(
					dto.categorias.map((catId) => AdminBlogRepository.addPostCategory(dto.id, catId))
				);
			}
		}

		// Actualizar etiquetas si se proporcionan
		if (dto.etiquetas !== undefined) {
			await AdminBlogRepository.removePostTags(dto.id);
			if (dto.etiquetas.length > 0) {
				await Promise.all(
					dto.etiquetas.map((tagId) => AdminBlogRepository.addPostTag(dto.id, tagId))
				);
			}
		}

		return await this.getPostById(dto.id);
	},

	/**
	 * Eliminar un post
	 */
	async deletePost(id: number): Promise<boolean> {
		// Eliminar categorías y etiquetas asociadas
		await AdminBlogRepository.removePostCategories(id);
		await AdminBlogRepository.removePostTags(id);
		// Eliminar post
		return await AdminBlogRepository.deletePost(id);
	},

	/**
	 * Obtener un post por ID con sus relaciones
	 */
	async getPostById(id: number): Promise<BlogPostResponseDTO | null> {
		const post = await AdminBlogRepository.getPostById(id);
		if (!post) return null;

		// Obtener categorías
		const categoriasIds = await AdminBlogRepository.getPostCategories(id);
		const categorias = await Promise.all(
			categoriasIds.map((catId) => AdminBlogRepository.getCategoryById(catId))
		);

		// Obtener etiquetas
		const etiquetasIds = await AdminBlogRepository.getPostTags(id);
		const etiquetas = await Promise.all(
			etiquetasIds.map((tagId) => AdminBlogRepository.getTagById(tagId))
		);

		// TODO: Obtener información del autor desde la tabla usuarios
		// Por ahora, datos ficticios
		const autor = {
			id: post.autor_id,
			nombre: 'Administrador'
		};

		return {
			id: post.id,
			titulo: post.titulo,
			contenido: post.contenido,
			slug: post.slug,
			resumen: post.resumen,
			imagen_portada: post.imagen_portada,
			publicado: post.publicado,
			fecha_publicacion:
				post.fecha_publicacion instanceof Date
					? post.fecha_publicacion.toISOString()
					: post.fecha_publicacion || null,
			vistas: post.vistas,
			tiempo_lectura_min: post.tiempo_lectura_min,
			creado_en:
				post.creado_en instanceof Date
					? post.creado_en.toISOString()
					: post.creado_en || new Date().toISOString(),
			actualizado_en:
				post.actualizado_en instanceof Date
					? post.actualizado_en.toISOString()
					: post.actualizado_en || new Date().toISOString(),
			autor,
			categorias: categorias
				.filter((c) => c !== null)
				.map((c) => ({
					id: c!.id,
					nombre: c!.nombre,
					slug: c!.slug,
				color: c!.color
				})),
			etiquetas: etiquetas
				.filter((t) => t !== null)
				.map((t) => ({
					id: t!.id,
					nombre: t!.nombre,
					slug: t!.slug,
					color: t!.color
				}))
		};
	},

	/**
	 * Listar posts con paginación y filtros
	 */
	async listPosts(
		page: number = 1,
		limit: number = 10,
		filters?: {
			titulo?: string;
			publicado?: boolean;
			autor_id?: number;
		}
	) {
		const { data, total } = await AdminBlogRepository.listPosts(page, limit, filters);

		const posts = await Promise.all(data.map(async (post) => await this.getPostById(post.id)));

		return {
			data: posts.filter((p) => p !== null) as BlogPostResponseDTO[],
			pagination: {
				page,
				limit,
				total,
				total_pages: Math.ceil(total / limit)
			}
		};
	},

	/**
	 * Obtener todas las categorías
	 */
	async getAllCategories() {
		return await AdminBlogRepository.getAllCategories();
	},

	/**
	 * Crear una categoría
	 */
	async createCategory(nombre: string, slug: string) {
		return await AdminBlogRepository.createCategory({ nombre, slug });
	},

	/**
	 * Actualizar una categoría
	 */
	async updateCategory(id: number, nombre?: string, slug?: string) {
		const updateData: { nombre?: string; slug?: string } = {};
		if (nombre) updateData.nombre = nombre;
		if (slug) updateData.slug = slug;
		return await AdminBlogRepository.updateCategory(id, updateData);
	},

	/**
	 * Eliminar una categoría
	 */
	async deleteCategory(id: number) {
		return await AdminBlogRepository.deleteCategory(id);
	},

	// =====================================
	// Categorías (alias en español)
	// =====================================

	async listCategorias() {
		return await AdminBlogRepository.listCategorias();
	},

	async getCategoriaById(id: number) {
		return await AdminBlogRepository.getCategoriaById(id);
	},

	async getCategoriaBySlug(slug: string) {
		return await AdminBlogRepository.getCategoriaBySlug(slug);
	},

	async createCategoria(data: { nombre: string; slug: string }) {
		return await AdminBlogRepository.createCategoria(data);
	},

	async updateCategoria(
		id: number,
		data: { nombre?: string; slug?: string; descripcion?: string }
	) {
		return await AdminBlogRepository.updateCategoria(id, data);
	},

	async deleteCategoria(id: number) {
		return await AdminBlogRepository.deleteCategoria(id);
	},

	// =====================================
	// Etiquetas
	// =====================================

	/**
	 * Generar slug desde nombre de etiqueta
	 */
	generateSlugFromName(nombre: string): string {
		return nombre
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/^-+|-+$/g, '');
	},

	async listEtiquetas() {
		return await AdminBlogRepository.listEtiquetas();
	},

	async getEtiquetaById(id: number) {
		return await AdminBlogRepository.getEtiquetaById(id);
	},

	async createEtiqueta(data: { nombre: string; color?: string }) {
		const slug = this.generateSlugFromName(data.nombre);
		return await AdminBlogRepository.createEtiqueta({
			nombre: data.nombre,
			slug,
			color: data.color || '#8b5cf6'
		});
	},

	async updateEtiqueta(id: number, data: { nombre?: string; color?: string }) {
		const updateData: { nombre?: string; slug?: string; color?: string } = {};
		if (data.nombre) {
			updateData.nombre = data.nombre;
			updateData.slug = this.generateSlugFromName(data.nombre);
		}
		if (data.color) updateData.color = data.color;
		return await AdminBlogRepository.updateEtiqueta(id, updateData);
	},

	async deleteEtiqueta(id: number) {
		return await AdminBlogRepository.deleteEtiqueta(id);
	}
};
