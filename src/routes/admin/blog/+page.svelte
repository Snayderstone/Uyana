<script lang="ts">
	import { onMount } from 'svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import RichTextEditor from '$lib/components/molecules/RichTextEditor.svelte';
	import TagSelector from '$lib/components/molecules/TagSelector.svelte';

	// Tipos
	interface BlogPost {
		id: number;
		titulo: string;
		slug: string;
		contenido: string;
		resumen: string | null;
		imagen_portada: string | null;
		publicado: boolean;
		fecha_publicacion: string;
		vistas: number;
		autor_nombre: string;
		categorias: Categoria[];
		etiquetas: Etiqueta[];
	}

	interface Categoria {
		id: number;
		nombre: string;
		slug: string;
		color: string;
	}

	interface Etiqueta {
		id: number;
		nombre: string;
		slug: string;
		color: string;
	}

	// Estado de la lista
	let posts: BlogPost[] = [];
	let categorias: Categoria[] = [];
	let etiquetas: Etiqueta[] = [];
	let loading = true;
	let error = '';
	let searchTerm = '';
	let filterPublicado: 'all' | 'published' | 'draft' = 'all';

	// Estado del modal
	let showEditorModal = false;
	let showDeleteModal = false;
	let editingPost: BlogPost | null = null;
	let postToDelete: BlogPost | null = null;

	// Estado del formulario
	let formData = {
		titulo: '',
		contenido: '',
		resumen: '',
		imagen_portada: '',
		publicado: false,
		categorias_seleccionadas: [] as number[],
		etiquetas_seleccionadas: [] as number[]
	};
	let saving = false;
	let formError = '';
	let imageFile: File | null = null;
	let imagePreview = '';

	// Estados de errores por campo
	let tituloError = false;
	let contenidoError = false;
	let categoriasError = false;

	// Estado para confirmación de publicación
	let showPublishConfirmModal = false;
	let pendingPublishAction: (() => void) | null = null;

	// Estados para confirmaciones de creación y toggle
	let showCreateConfirmModal = false;
	let showTogglePublishModal = false;
	let pendingTogglePost: BlogPost | null = null;

	// Cargar datos iniciales
	onMount(async () => {
		await Promise.all([loadPosts(), loadCategorias(), loadEtiquetas()]);
	});

	async function loadPosts() {
		loading = true;
		error = '';
		try {
			const params = new URLSearchParams();
			if (filterPublicado === 'published') params.set('publicado', 'true');
			if (filterPublicado === 'draft') params.set('publicado', 'false');

			const response = await fetch(`/api/admin/blog?${params}`);
			if (!response.ok) throw new Error('Error al cargar posts');

			const result = await response.json();
			if (result.success && result.data) {
				posts = result.data.data || [];
			} else {
				posts = [];
				error = result.message || 'Error al cargar posts';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error desconocido';
		} finally {
			loading = false;
		}
	}

	async function loadCategorias() {
		try {
			const response = await fetch('/api/admin/blog/categorias');
			if (!response.ok) throw new Error('Error al cargar categorías');

			const result = await response.json();
			categorias = result.success ? result.data : [];
		} catch (err) {
			console.error('Error cargando categorías:', err);
			categorias = [];
		}
	}

	async function loadEtiquetas() {
		try {
			const response = await fetch('/api/admin/blog/etiquetas');
			if (!response.ok) throw new Error('Error al cargar etiquetas');

			const result = await response.json();
			etiquetas = result.success ? result.data : [];
		} catch (err) {
			console.error('Error cargando etiquetas:', err);
			etiquetas = [];
		}
	}

	// Crear nueva categoría

	// Abrir modal para crear
	function openCreateModal() {
		editingPost = null;
		formData = {
			titulo: '',
			contenido: '',
			resumen: '',
			imagen_portada: '/images/posts/placeholder.avif',
			publicado: false,
			categorias_seleccionadas: [],
			etiquetas_seleccionadas: []
		};
		imageFile = null;
		imagePreview = '';
		formError = '';
		showEditorModal = true;
	}

	// Abrir modal para editar
	function openEditModal(post: BlogPost) {
		editingPost = post;
		formData = {
			titulo: post.titulo,
			contenido: post.contenido,
			resumen: post.resumen || '',
			imagen_portada: post.imagen_portada || '/images/posts/placeholder.avif',
			publicado: post.publicado,
			categorias_seleccionadas: post.categorias.map((c) => c.id),
			etiquetas_seleccionadas: post.etiquetas.map((e) => e.id)
		};
		imageFile = null;
		imagePreview = '';
		formError = '';
		showEditorModal = true;
	}

	// Cerrar modal
	function closeEditorModal() {
		showEditorModal = false;
		editingPost = null;
	}

	// Manejar cambio de imagen
	function handleImageChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			if (!file.type.startsWith('image/')) {
				formError = 'Por favor selecciona un archivo de imagen válido';
				return;
			}

			imageFile = file;

			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);

			formData.imagen_portada = `/images/posts/${file.name}`;
		}
	}

	function clearImage() {
		imageFile = null;
		imagePreview = '';
		formData.imagen_portada = '/images/posts/placeholder.avif';
	}

	// Scroll automático a campo con error
	function scrollToError(fieldId: string) {
		setTimeout(() => {
			const element = document.getElementById(fieldId);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'center' });
				element.focus();
			}
		}, 100);
	}

	// Generar resumen automático del contenido HTML
	function generateSummary(html: string): string {
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = html;
		const text = tempDiv.textContent || tempDiv.innerText || '';
		return text.slice(0, 200).trim() + (text.length > 200 ? '...' : '');
	}

	// Guardar post (crear o actualizar)
	async function savePost() {
		// Resetear errores
		tituloError = false;
		contenidoError = false;
		categoriasError = false;
		formError = '';

		// Validaciones con scroll automático
		if (!formData.titulo.trim()) {
			tituloError = true;
			formError = 'El título es obligatorio';
			scrollToError('titulo');
			return;
		}
		if (!formData.contenido.trim()) {
			contenidoError = true;
			formError = 'El contenido es obligatorio';
			scrollToError('contenido');
			return;
		}
		if (formData.categorias_seleccionadas.length === 0) {
			categoriasError = true;
			formError = 'Debes seleccionar al menos una categoría';
			scrollToError('categorias');
			return;
		}

		// Confirmación si está CREANDO un nuevo post
		if (!editingPost) {
			pendingPublishAction = () => executeSavePost();
			showCreateConfirmModal = true;
			return;
		}

		// Confirmación si está cambiando de borrador a publicado (al editar)
		const wasUnpublished = editingPost && !editingPost.publicado;
		const willBePublished = formData.publicado;
		if (wasUnpublished && willBePublished) {
			pendingPublishAction = () => executeSavePost();
			showPublishConfirmModal = true;
			return;
		}

		// Si no necesita confirmación, guardar directamente
		await executeSavePost();
	}

	// Confirmar publicación
	function confirmPublish() {
		showPublishConfirmModal = false;
		if (pendingPublishAction) {
			pendingPublishAction();
			pendingPublishAction = null;
		}
	}

	function cancelPublish() {
		showPublishConfirmModal = false;
		formData.publicado = false;
		pendingPublishAction = null;
	}

	// Confirmar creación de post
	function confirmCreate() {
		showCreateConfirmModal = false;
		if (pendingPublishAction) {
			pendingPublishAction();
			pendingPublishAction = null;
		}
	}

	function cancelCreate() {
		showCreateConfirmModal = false;
		pendingPublishAction = null;
	}

	// Ejecutar guardado del post
	async function executeSavePost() {
		saving = true;
		formError = '';

		try {
			// Generar resumen si está vacío
			if (!formData.resumen.trim()) {
				formData.resumen = generateSummary(formData.contenido);
			}

			const url = editingPost ? `/api/admin/blog/${editingPost.id}` : '/api/admin/blog';
			const method = editingPost ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					titulo: formData.titulo.trim(),
					contenido: formData.contenido.trim(),
					resumen: formData.resumen.trim(),
					imagen_portada: formData.imagen_portada || null,
					publicado: formData.publicado,
					fecha_publicacion: new Date().toISOString(),
					autor_id: 1, // TODO: Usuario autenticado
					categorias: formData.categorias_seleccionadas,
					etiquetas: formData.etiquetas_seleccionadas
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Error al guardar el post');
			}

			await loadPosts();
			closeEditorModal();
		} catch (err) {
			formError = err instanceof Error ? err.message : 'Error desconocido';
		} finally {
			saving = false;
		}
	}

	// Confirmación de eliminación
	function confirmDelete(post: BlogPost) {
		postToDelete = post;
		showDeleteModal = true;
	}

	function cancelDelete() {
		showDeleteModal = false;
		postToDelete = null;
	}

	async function deletePost() {
		if (!postToDelete) return;

		try {
			const response = await fetch(`/api/admin/blog/${postToDelete.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) throw new Error('Error al eliminar el post');

			await loadPosts();
			showDeleteModal = false;
			postToDelete = null;
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Error al eliminar');
		}
	}

	// Toggle publicación rápida
	async function togglePublicado(post: BlogPost) {
		// Si está cambiando de borrador a publicado, pedir confirmación
		if (!post.publicado) {
			pendingTogglePost = post;
			showTogglePublishModal = true;
			return;
		}

		// Si está despublicando, hacerlo directamente
		await executeToggle(post);
	}

	async function executeToggle(post: BlogPost) {
		try {
			const response = await fetch(`/api/admin/blog/${post.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...post,
					publicado: !post.publicado
				})
			});

			if (!response.ok) throw new Error('Error al actualizar el post');
			await loadPosts();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Error al actualizar');
		}
	}

	function confirmTogglePublish() {
		showTogglePublishModal = false;
		if (pendingTogglePost) {
			executeToggle(pendingTogglePost);
			pendingTogglePost = null;
		}
	}

	function cancelTogglePublish() {
		showTogglePublishModal = false;
		pendingTogglePost = null;
	}

	// Filtros reactivos
	$: filteredPosts = posts.filter((post) => {
		const matchesSearch =
			searchTerm === '' || post.titulo.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesSearch;
	});

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="blog-admin">
	<header class="page-header">
		<div class="header-content">
			<div>
				<h1>Blog</h1>
				<p class="subtitle">Gestiona tus publicaciones</p>
			</div>
			<div class="header-actions">
				<a href="/admin/blog/gestionar" class="btn btn-secondary">
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
						/>
						<line x1="7" y1="7" x2="7.01" y2="7" />
					</svg>
					Gestionar Categorías/Etiquetas
				</a>
				<button class="btn btn-primary btn-create" on:click={openCreateModal}>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
					Nuevo Post
				</button>
			</div>
		</div>
	</header>

	<div class="filters">
		<div class="search-box">
			<svg
				class="search-icon"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="11" cy="11" r="8" />
				<path d="m21 21-4.35-4.35" />
			</svg>
			<input
				type="text"
				placeholder="Buscar posts..."
				bind:value={searchTerm}
				class="search-input"
			/>
		</div>

		<select bind:value={filterPublicado} on:change={loadPosts} class="filter-select">
			<option value="all">Todos</option>
			<option value="published">Publicados</option>
			<option value="draft">Borradores</option>
		</select>
	</div>

	{#if loading}
		<div class="loading">
			<div class="spinner" />
			<p>Cargando posts...</p>
		</div>
	{:else if error}
		<div class="error">
			<p>❌ {error}</p>
			<button class="btn" on:click={loadPosts}>Reintentar</button>
		</div>
	{:else if filteredPosts.length === 0}
		<div class="empty-state">
			<svg
				width="64"
				height="64"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
				<polyline points="14 2 14 8 20 8" />
				<line x1="16" y1="13" x2="8" y2="13" />
				<line x1="16" y1="17" x2="8" y2="17" />
				<polyline points="10 9 9 9 8 9" />
			</svg>
			<h3>No hay posts todavía</h3>
			<p>Comienza creando tu primer post</p>
			<button class="btn btn-primary" on:click={openCreateModal}>Crear Post</button>
		</div>
	{:else}
		<div class="posts-grid">
			{#each filteredPosts as post (post.id)}
				<article class="post-card">
					<div class="post-image">
						<img src={post.imagen_portada || '/images/posts/placeholder.avif'} alt={post.titulo} />
						<button
							class="status-badge"
							class:published={post.publicado}
							class:draft={!post.publicado}
							on:click={() => togglePublicado(post)}
							title="Cambiar estado"
						>
							{post.publicado ? 'Publicado' : 'Borrador'}
						</button>
					</div>

					<div class="post-content">
						<h3 class="post-title">{post.titulo}</h3>

						{#if post.resumen}
							<p class="post-excerpt">{post.resumen}</p>
						{/if}

						<div class="post-meta">
							<span class="meta-item">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
									<line x1="16" y1="2" x2="16" y2="6" />
									<line x1="8" y1="2" x2="8" y2="6" />
									<line x1="3" y1="10" x2="21" y2="10" />
								</svg>
								{formatDate(post.fecha_publicacion)}
							</span>
							<span class="meta-item">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
									<circle cx="12" cy="12" r="3" />
								</svg>
								{post.vistas || 0} vistas
							</span>
						</div>

						{#if post.categorias?.length > 0}
							<div class="post-tags">
								{#each post.categorias.slice(0, 3) as cat}
									<span class="tag" style:background-color={cat.color}>{cat.nombre}</span>
								{/each}
							</div>
						{/if}
					</div>

					<div class="post-actions">
						<button class="btn-icon" on:click={() => openEditModal(post)} title="Editar">
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
								<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
							</svg>
						</button>
						<button
							class="btn-icon btn-danger"
							on:click={() => confirmDelete(post)}
							title="Eliminar"
						>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<polyline points="3 6 5 6 21 6" />
								<path
									d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
								/>
								<line x1="10" y1="11" x2="10" y2="17" />
								<line x1="14" y1="11" x2="14" y2="17" />
							</svg>
						</button>
					</div>
				</article>
			{/each}
		</div>

		<div class="table-footer">
			<p>Total: {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}</p>
		</div>
	{/if}
</div>

<!-- Modal de Editor -->
<Modal
	bind:isOpen={showEditorModal}
	title={editingPost ? 'Editar Post' : 'Nuevo Post'}
	size="large"
	onClose={closeEditorModal}
>
	<form on:submit|preventDefault={savePost} class="editor-form">
		{#if formError}
			<div class="alert alert-error">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
				{formError}
			</div>
		{/if}

		<!-- Título -->
		<div class="form-group">
			<label for="titulo"
				>Título {#if tituloError}<span class="error-mark">*</span>{/if}</label
			>
			<input
				type="text"
				id="titulo"
				bind:value={formData.titulo}
				placeholder="Escribe un título atractivo..."
				required
				disabled={saving}
				class="form-control"
				class:error={tituloError}
				on:input={() => (tituloError = false)}
			/>
		</div>

		<!-- Editor de contenido -->
		<div class="form-group" id="contenido">
			<label for="contenido-editor"
				>Contenido {#if contenidoError}<span class="error-mark">*</span>{/if}</label
			>
			<div class="editor-wrapper" class:error={contenidoError}>
				<RichTextEditor
					bind:value={formData.contenido}
					disabled={saving}
					placeholder="Escribe tu contenido aquí..."
					on:input={() => (contenidoError = false)}
				/>
			</div>
		</div>

		<!-- Imagen de portada -->
		<div class="form-group">
			<label for="imagen">Imagen de portada</label>
			<div class="file-input-wrapper">
				<input
					type="file"
					id="imagen"
					accept="image/*"
					on:change={handleImageChange}
					disabled={saving}
					class="file-input"
				/>
				<label for="imagen" class="file-label">
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
						<circle cx="8.5" cy="8.5" r="1.5" />
						<polyline points="21 15 16 10 5 21" />
					</svg>
					{imageFile ? imageFile.name : 'Seleccionar imagen'}
				</label>
				{#if imageFile || formData.imagen_portada !== '/images/posts/placeholder.avif'}
					<button type="button" class="btn-clear" on:click={clearImage} disabled={saving}>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				{/if}
			</div>
			<div class="image-preview">
				<img src={imagePreview || formData.imagen_portada} alt="Preview" />
			</div>
		</div>

		<!-- Categorías -->
		<div class="form-group" id="categorias">
			<span class="form-label"
				>Categorías {#if categoriasError}<span class="error-mark">*</span>{/if}</span
			>

			<!-- Categorías seleccionadas -->
			{#if formData.categorias_seleccionadas.length > 0}
				<div class="selected-categories" class:error-border={categoriasError}>
					{#each categorias.filter( (c) => formData.categorias_seleccionadas.includes(c.id) ) as categoria (categoria.id)}
						<button
							type="button"
							class="category-pill selected"
							style:background-color={categoria.color}
							on:click={() => {
								formData.categorias_seleccionadas = formData.categorias_seleccionadas.filter(
									(id) => id !== categoria.id
								);
								categoriasError = false;
							}}
							title="Clic para quitar"
							disabled={saving}
						>
							<span class="category-name">{categoria.nombre}</span>
							<span class="category-remove">×</span>
						</button>
					{/each}
				</div>
			{/if}

			<!-- Categorías disponibles -->
			{#if categorias.filter((c) => !formData.categorias_seleccionadas.includes(c.id)).length > 0}
				<div class="available-categories">
					<p class="section-label">Categorías disponibles:</p>
					<div class="categories-grid">
						{#each categorias.filter((c) => !formData.categorias_seleccionadas.includes(c.id)) as categoria (categoria.id)}
							<button
								type="button"
								class="category-pill available"
								style:border-color={categoria.color}
								on:click={() => {
									formData.categorias_seleccionadas = [
										...formData.categorias_seleccionadas,
										categoria.id
									];
									categoriasError = false;
								}}
								title="Clic para agregar"
								disabled={saving}
							>
								<span class="category-name">{categoria.nombre}</span>
								<span class="category-indicator" style:background-color={categoria.color} />
								<span class="category-add">+</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Etiquetas -->
		<div class="form-group">
			<span class="form-label">Etiquetas</span>
			<TagSelector
				{etiquetas}
				bind:seleccionadas={formData.etiquetas_seleccionadas}
				disabled={saving}
			/>
		</div>

		<!-- Estado de publicación -->
		<div class="form-group">
			<label class="publish-toggle">
				<input type="checkbox" bind:checked={formData.publicado} disabled={saving} />
				<span class="toggle-slider" />
				<span class="toggle-label">
					{formData.publicado ? '✓ Publicar ahora' : 'Guardar como borrador'}
				</span>
			</label>
		</div>
	</form>

	<div slot="footer">
		<button type="button" class="btn btn-secondary" on:click={closeEditorModal} disabled={saving}>
			Cancelar
		</button>
		<button type="button" class="btn btn-primary" on:click={savePost} disabled={saving}>
			{#if saving}
				<span class="spinner-small" />
				Guardando...
			{:else}
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
					<polyline points="17 21 17 13 7 13 7 21" />
					<polyline points="7 3 7 8 15 8" />
				</svg>
				{editingPost ? 'Actualizar' : 'Crear Post'}
			{/if}
		</button>
	</div>
</Modal>

<!-- Modal de confirmación de eliminación -->
{#if showDeleteModal && postToDelete}
	<Modal
		bind:isOpen={showDeleteModal}
		title="Confirmar eliminación"
		size="small"
		onClose={cancelDelete}
	>
		<div class="delete-confirmation">
			<svg
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				class="warning-icon"
			>
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			<p>¿Estás seguro de que deseas eliminar el post <strong>"{postToDelete.titulo}"</strong>?</p>
			<p class="warning-text">Esta acción no se puede deshacer.</p>
		</div>

		<div slot="footer">
			<button class="btn btn-secondary" on:click={cancelDelete}>Cancelar</button>
			<button class="btn btn-danger" on:click={deletePost}>Eliminar</button>
		</div>
	</Modal>
{/if}

<!-- Modal de confirmación de publicación -->
{#if showPublishConfirmModal}
	<Modal
		bind:isOpen={showPublishConfirmModal}
		title="⚠️ Confirmar Publicación"
		size="small"
		onClose={cancelPublish}
	>
		<div class="confirmation-content">
			<svg
				class="warning-icon"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
				/>
				<line x1="12" y1="9" x2="12" y2="13" />
				<line x1="12" y1="17" x2="12.01" y2="17" />
			</svg>
			<p><strong>¿Estás seguro de que deseas publicar este post?</strong></p>
			<p class="info-text">
				El post pasará de borrador a publicado y será visible para todos los usuarios.
			</p>
			<p class="info-text">Verifica que:</p>
			<ul class="checklist">
				<li>✓ El contenido esté completo y revisado</li>
				<li>✓ Las categorías y etiquetas sean correctas</li>
				<li>✓ La imagen de portada sea apropiada</li>
			</ul>
		</div>

		<div slot="footer">
			<button class="btn btn-secondary" on:click={cancelPublish}>Cancelar</button>
			<button class="btn btn-primary" on:click={confirmPublish}>Sí, publicar</button>
		</div>
	</Modal>
{/if}

<!-- Modal de confirmación al crear nuevo post -->
{#if showCreateConfirmModal}
	<Modal
		bind:isOpen={showCreateConfirmModal}
		title={formData.publicado ? '⚠️ Crear y Publicar Post' : '⚠️ Crear Borrador'}
		size="small"
		onClose={cancelCreate}
	>
		<div class="confirmation-content">
			<svg
				class="warning-icon"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				{#if formData.publicado}
					<path
						d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
					/>
					<line x1="12" y1="9" x2="12" y2="13" />
					<line x1="12" y1="17" x2="12.01" y2="17" />
				{:else}
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				{/if}
			</svg>

			{#if formData.publicado}
				<p><strong>¿Estás seguro de que deseas crear y publicar este post?</strong></p>
				<p class="info-text">El post será visible inmediatamente para todos los usuarios.</p>
				<p class="info-text">Verifica que:</p>
				<ul class="checklist">
					<li>✓ El título sea descriptivo y atractivo</li>
					<li>✓ El contenido esté completo y revisado</li>
					<li>✓ Las categorías y etiquetas sean correctas</li>
					<li>✓ La imagen de portada sea apropiada</li>
				</ul>
			{:else}
				<p><strong>¿Deseas crear este post como borrador?</strong></p>
				<p class="info-text">
					El post se guardará pero no será visible públicamente. Podrás editarlo y publicarlo más
					tarde.
				</p>
			{/if}
		</div>

		<div slot="footer">
			<button class="btn btn-secondary" on:click={cancelCreate}>Cancelar</button>
			<button class="btn btn-primary" on:click={confirmCreate}>
				{formData.publicado ? 'Sí, crear y publicar' : 'Sí, crear borrador'}
			</button>
		</div>
	</Modal>
{/if}

<!-- Modal de confirmación al cambiar estado en la tabla -->
{#if showTogglePublishModal && pendingTogglePost}
	<Modal
		bind:isOpen={showTogglePublishModal}
		title="⚠️ Publicar Post"
		size="small"
		onClose={cancelTogglePublish}
	>
		<div class="confirmation-content">
			<svg
				class="warning-icon"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
				/>
				<line x1="12" y1="9" x2="12" y2="13" />
				<line x1="12" y1="17" x2="12.01" y2="17" />
			</svg>
			<p><strong>¿Estás seguro de que deseas publicar "{pendingTogglePost.titulo}"?</strong></p>
			<p class="info-text">
				El post pasará de borrador a publicado y será visible inmediatamente para todos los
				usuarios.
			</p>
			<p class="info-text">Verifica que el contenido esté listo para publicación.</p>
		</div>

		<div slot="footer">
			<button class="btn btn-secondary" on:click={cancelTogglePublish}>Cancelar</button>
			<button class="btn btn-primary" on:click={confirmTogglePublish}>Sí, publicar</button>
		</div>
	</Modal>
{/if}

<style lang="scss">
	.blog-admin {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;

		.header-content {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 1rem;
			flex-wrap: wrap;
		}

		h1 {
			margin: 0 0 0.25rem;
			color: var(--color--text);
			font-size: 2rem;
			font-family: var(--font--title);
			font-weight: 700;
		}

		.subtitle {
			margin: 0;
			color: var(--color--text-shade);
			font-size: 1rem;
		}

		.header-actions {
			display: flex;
			gap: 1rem;
			align-items: center;
			flex-wrap: wrap;
		}
	}

	.btn-create {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		font-weight: 600;
	}

	.filters {
		background: var(--color--card-background);
		padding: 1.25rem;
		border-radius: 12px;
		box-shadow: var(--card-shadow);
		margin-bottom: 2rem;
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.search-box {
		flex: 1;
		min-width: 250px;
		position: relative;

		.search-icon {
			position: absolute;
			left: 1rem;
			top: 50%;
			transform: translateY(-50%);
			color: var(--color--text-shade);
			pointer-events: none;
		}
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 0.75rem 0.75rem 3rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		font-size: 1rem;
		background: var(--color--page-background);
		color: var(--color--text);
		transition: all 0.2s ease;

		&:focus {
			outline: none;
			border-color: var(--color--primary);
			box-shadow: 0 0 0 3px rgba(var(--color--primary-rgb), 0.1);
		}
	}

	.filter-select {
		padding: 0.75rem 1rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		font-size: 1rem;
		background: var(--color--page-background);
		color: var(--color--text);
		cursor: pointer;
		transition: border-color 0.2s ease;
		min-width: 150px;

		&:focus {
			outline: none;
			border-color: var(--color--primary);
		}
	}

	.posts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.post-card {
		background: var(--color--card-background);
		border-radius: 12px;
		box-shadow: var(--card-shadow);
		overflow: hidden;
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;

		&:hover {
			transform: translateY(-4px);
			box-shadow: var(--card-shadow-hover);
		}
	}

	.post-image {
		position: relative;
		width: 100%;
		height: 200px;
		overflow: hidden;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.status-badge {
			position: absolute;
			top: 0.75rem;
			right: 0.75rem;
			padding: 0.375rem 0.875rem;
			border-radius: 20px;
			font-size: 0.8125rem;
			font-weight: 600;
			border: none;
			cursor: pointer;
			transition: all 0.2s;
			backdrop-filter: blur(8px);

			&.published {
				background: rgba(16, 185, 129, 0.9);
				color: white;

				&:hover {
					background: rgba(16, 185, 129, 1);
				}
			}

			&.draft {
				background: rgba(251, 191, 36, 0.9);
				color: rgba(0, 0, 0, 0.8);

				&:hover {
					background: rgba(251, 191, 36, 1);
				}
			}
		}
	}

	.post-content {
		padding: 1.25rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.post-title {
		margin: 0;
		font-size: 1.25rem;
		font-family: var(--font--title);
		font-weight: 600;
		color: var(--color--text);
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.post-excerpt {
		margin: 0;
		color: var(--color--text-shade);
		font-size: 0.875rem;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.post-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.8125rem;
		color: var(--color--text-shade);
		flex-wrap: wrap;

		.meta-item {
			display: flex;
			align-items: center;
			gap: 0.375rem;

			svg {
				width: 14px;
				height: 14px;
			}
		}
	}

	.post-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-top: auto;

		.tag {
			padding: 0.25rem 0.625rem;
			border-radius: 12px;
			font-size: 0.75rem;
			font-weight: 500;
			color: white;
		}
	}

	.post-actions {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.btn-icon {
		padding: 0.5rem;
		border: none;
		background: transparent;
		color: var(--color--text);
		cursor: pointer;
		border-radius: 6px;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;

		&:hover {
			background: rgba(var(--color--text-rgb), 0.08);
		}

		&.btn-danger {
			color: var(--color--callout-error-color);

			&:hover {
				background: var(--color--callout-error-background);
			}
		}
	}

	.loading,
	.error,
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: var(--color--card-background);
		border-radius: 12px;
		box-shadow: var(--card-shadow);
	}

	.empty-state svg {
		margin: 0 auto 1.5rem;
		color: var(--color--text-shade);
		opacity: 0.5;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem;
		font-family: var(--font--title);
		color: var(--color--text);
	}

	.empty-state p {
		margin: 0 0 1.5rem;
		color: var(--color--text-shade);
	}

	.spinner {
		border: 3px solid rgba(var(--color--text-rgb), 0.1);
		border-top: 3px solid var(--color--primary);
		border-radius: 50%;
		width: 40px;
		height: 40px;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-8px);
		}
		75% {
			transform: translateX(8px);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.editor-wrapper {
		border: 2px solid transparent;
		border-radius: 8px;
		transition: border-color 0.2s ease;

		&.error {
			border-color: var(--color--danger);
			background: rgba(var(--color--danger-rgb), 0.05);
			animation: shake 0.5s ease;
		}
	}

	.table-footer {
		background: var(--color--card-background);
		padding: 1rem 1.5rem;
		border-radius: 8px;
		box-shadow: var(--card-shadow);
		color: var(--color--text-shade);

		p {
			margin: 0;
		}
	}

	/* Estilos del formulario en el modal */
	.editor-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		label,
		.form-label {
			font-weight: 600;
			color: var(--color--text);
			font-size: 0.9375rem;

			.error-mark {
				color: var(--color--danger);
				font-size: 1.125rem;
				margin-left: 0.25rem;
				animation: pulse 1s ease-in-out infinite;
			}
		}
	}

	.form-control {
		padding: 0.75rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		font-size: 1rem;
		font-family: var(--font--default);
		background: var(--color--page-background);
		color: var(--color--text);
		transition: border-color 0.2s ease;

		&.error {
			border-color: var(--color--danger);
			border-width: 2px;
			background: rgba(var(--color--danger-rgb), 0.05);
			animation: shake 0.5s ease;
		}

		&:focus {
			outline: none;
			border-color: var(--color--primary);
			box-shadow: 0 0 0 3px rgba(var(--color--primary-rgb), 0.1);
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}

	.file-input-wrapper {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.file-input {
		display: none;
	}

	.file-label {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		background: var(--color--page-background);
		color: var(--color--text);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s;

		&:hover {
			border-color: var(--color--primary);
			background: rgba(var(--color--primary-rgb), 0.05);
		}
	}

	.btn-clear {
		padding: 0.5rem;
		border: 1px solid rgba(var(--color--danger-rgb), 0.3);
		border-radius: 6px;
		background: var(--color--callout-error-background);
		color: var(--color--callout-error-color);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;

		&:hover:not(:disabled) {
			background: rgba(var(--color--danger-rgb), 0.2);
		}
	}

	.image-preview {
		margin-top: 0.5rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		overflow: hidden;
		max-height: 200px;

		img {
			width: 100%;
			height: auto;
			display: block;
		}
	}

	/* Estilos para categorías pills (igual que etiquetas) */
	.selected-categories {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.75rem;
		background: rgba(var(--color--text-rgb), 0.03);
		border-radius: 8px;
		border: 2px solid transparent;
		transition: border-color 0.3s ease;

		&.error-border {
			border-color: var(--color--danger);
			background: rgba(var(--color--danger-rgb), 0.05);
			animation: shake 0.5s ease;
		}
	}

	.available-categories {
		.section-label {
			font-size: 0.875rem;
			color: var(--color--text-shade);
			margin-bottom: 0.5rem;
			font-weight: 500;
		}
	}

	.categories-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.category-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 500;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: var(--font--default);

		&.selected {
			color: white;

			&:hover:not(:disabled) {
				transform: scale(1.05);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
			}

			&:active:not(:disabled) {
				transform: scale(0.98);
			}

			.category-remove {
				font-size: 1.125rem;
				font-weight: 700;
				line-height: 1;
				opacity: 0.8;
				transition: opacity 0.2s;
			}

			&:hover:not(:disabled) .category-remove {
				opacity: 1;
			}
		}

		&.available {
			background: var(--color--page-background);
			color: var(--color--text);
			border-width: 2px;
			border-style: solid;

			&:hover:not(:disabled) {
				background: rgba(var(--color--primary-rgb), 0.1);
				transform: translateY(-2px);
			}

			&:active:not(:disabled) {
				transform: translateY(0);
			}

			.category-indicator {
				width: 10px;
				height: 10px;
				border-radius: 50%;
			}

			.category-add {
				font-size: 1.125rem;
				font-weight: 700;
				line-height: 1;
				opacity: 0.8;
				transition: opacity 0.2s;
			}

			&:hover:not(:disabled) .category-add {
				opacity: 1;
			}
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.category-name {
			line-height: 1;
		}
	}

	.publish-toggle {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		background: var(--color--page-background);
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			background: rgba(var(--color--text-rgb), 0.03);
		}

		input[type='checkbox'] {
			display: none;
		}

		.toggle-slider {
			position: relative;
			width: 48px;
			height: 24px;
			background: rgba(var(--color--text-rgb), 0.2);
			border-radius: 12px;
			transition: all 0.3s;

			&::before {
				content: '';
				position: absolute;
				width: 20px;
				height: 20px;
				border-radius: 50%;
				background: white;
				top: 2px;
				left: 2px;
				transition: all 0.3s;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
			}
		}

		input[type='checkbox']:checked + .toggle-slider {
			background: var(--color--primary);

			&::before {
				transform: translateX(24px);
			}
		}

		.toggle-label {
			flex: 1;
			color: var(--color--text);
			font-weight: 500;
		}
	}

	.alert {
		padding: 1rem;
		border-radius: 8px;
		display: flex;
		align-items: center;
		gap: 0.75rem;

		&.alert-error {
			background: var(--color--callout-error-background);
			color: var(--color--callout-error-color);
		}
	}

	.delete-confirmation,
	.confirmation-content {
		text-align: center;
		padding: 1rem 0;
	}

	.delete-confirmation .warning-icon,
	.confirmation-content .warning-icon {
		margin: 0 auto 1rem;
		color: var(--color--callout-warning-color);
	}

	.delete-confirmation p,
	.confirmation-content p {
		margin: 0.5rem 0;
		color: var(--color--text);
	}

	.btn {
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		&.btn-primary {
			background: var(--color--primary);
			color: var(--color--text-inverse);

			&:hover:not(:disabled) {
				background: var(--color--primary-shade);
			}
		}

		&.btn-secondary {
			background: rgba(var(--color--text-rgb), 0.1);
			color: var(--color--text);

			&:hover:not(:disabled) {
				background: rgba(var(--color--text-rgb), 0.15);
			}
		}

		&.btn-danger {
			background: var(--color--callout-error-background);
			color: var(--color--callout-error-color);

			&:hover:not(:disabled) {
				background: rgba(var(--color--danger-rgb), 0.2);
			}
		}
	}

	.spinner-small {
		display: inline-block;
		width: 16px;
		height: 16px;
		border: 2px solid rgba(var(--color--text-inverse-rgb), 0.3);
		border-top-color: var(--color--text-inverse);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@media (max-width: 768px) {
		.blog-admin {
			padding: 1rem;
		}

		.posts-grid {
			grid-template-columns: 1fr;
		}

		.filters {
			flex-direction: column;
		}

		.search-box {
			min-width: auto;
		}
	}
</style>
