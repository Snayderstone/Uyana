<script lang="ts">
	import { onMount } from 'svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';

	// Estados
	let activeTab: 'categorias' | 'etiquetas' = 'categorias';
	let categorias: any[] = [];
	let etiquetas: any[] = [];
	let loading = true;

	// Estados para crear/editar categorías
	let showCategoriaModal = false;
	let editingCategoria: any = null;
	let categoriaForm = {
		nombre: '',
		descripcion: '',
		slug: '',
		color: '#' + Math.floor(Math.random() * 16777215).toString(16)
	};
	let savingCategoria = false;

	// Estados para crear/editar etiquetas
	let showEtiquetaModal = false;
	let editingEtiqueta: any = null;
	let etiquetaForm = {
		nombre: '',
		slug: '',
		color: '#' + Math.floor(Math.random() * 16777215).toString(16)
	};
	let savingEtiqueta = false;

	// Estados para eliminar
	let showDeleteModal = false;
	let deleteType: 'categoria' | 'etiqueta' | null = null;
	let itemToDelete: any = null;

	onMount(() => {
		loadData();
	});

	async function loadData() {
		loading = true;
		await Promise.all([loadCategorias(), loadEtiquetas()]);
		loading = false;
	}

	async function loadCategorias() {
		const response = await fetch('/api/admin/blog/categorias');
		const data = await response.json();
		categorias = data.data || [];
	}

	async function loadEtiquetas() {
		const response = await fetch('/api/admin/blog/etiquetas');
		const data = await response.json();
		etiquetas = data.data || [];
	}

	// Funciones para categorías
	function openNewCategoriaModal() {
		editingCategoria = null;
		categoriaForm = {
			nombre: '',
			descripcion: '',
			slug: '',
			color: '#' + Math.floor(Math.random() * 16777215).toString(16)
		};
		showCategoriaModal = true;
	}

	function openEditCategoriaModal(categoria: any) {
		editingCategoria = categoria;
		categoriaForm = {
			nombre: categoria.nombre,
			descripcion: categoria.descripcion || '',
			slug: categoria.slug,
			color: categoria.color
		};
		showCategoriaModal = true;
	}

	async function saveCategoria() {
		if (!categoriaForm.nombre.trim()) return;

		// Generar slug automático si está vacío
		if (!categoriaForm.slug.trim()) {
			categoriaForm.slug = categoriaForm.nombre
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '');
		}

		savingCategoria = true;
		try {
			const url = editingCategoria
				? `/api/admin/blog/categorias/${editingCategoria.id}`
				: '/api/admin/blog/categorias';

			const response = await fetch(url, {
				method: editingCategoria ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(categoriaForm)
			});

			if (!response.ok) throw new Error('Error al guardar categoría');

			await loadCategorias();
			showCategoriaModal = false;
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Error al guardar categoría');
		} finally {
			savingCategoria = false;
		}
	}

	// Funciones para etiquetas
	function openNewEtiquetaModal() {
		editingEtiqueta = null;
		etiquetaForm = {
			nombre: '',
			slug: '',
			color: '#' + Math.floor(Math.random() * 16777215).toString(16)
		};
		showEtiquetaModal = true;
	}

	function openEditEtiquetaModal(etiqueta: any) {
		editingEtiqueta = etiqueta;
		etiquetaForm = {
			nombre: etiqueta.nombre,
			slug: etiqueta.slug,
			color: etiqueta.color
		};
		showEtiquetaModal = true;
	}

	async function saveEtiqueta() {
		if (!etiquetaForm.nombre.trim()) return;

		// Generar slug automático si está vacío
		if (!etiquetaForm.slug.trim()) {
			etiquetaForm.slug = etiquetaForm.nombre
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '');
		}

		savingEtiqueta = true;
		try {
			const url = editingEtiqueta
				? `/api/admin/blog/etiquetas/${editingEtiqueta.id}`
				: '/api/admin/blog/etiquetas';

			const response = await fetch(url, {
				method: editingEtiqueta ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(etiquetaForm)
			});

			if (!response.ok) throw new Error('Error al guardar etiqueta');

			await loadEtiquetas();
			showEtiquetaModal = false;
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Error al guardar etiqueta');
		} finally {
			savingEtiqueta = false;
		}
	}

	// Funciones para eliminar
	function confirmDelete(type: 'categoria' | 'etiqueta', item: any) {
		deleteType = type;
		itemToDelete = item;
		showDeleteModal = true;
	}

	async function deleteItem() {
		if (!itemToDelete || !deleteType) return;

		try {
			const url =
				deleteType === 'categoria'
					? `/api/admin/blog/categorias/${itemToDelete.id}`
					: `/api/admin/blog/etiquetas/${itemToDelete.id}`;

			const response = await fetch(url, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Error al eliminar');
			}

			if (deleteType === 'categoria') {
				await loadCategorias();
			} else {
				await loadEtiquetas();
			}

			showDeleteModal = false;
			itemToDelete = null;
			deleteType = null;
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Error al eliminar');
		}
	}
</script>

<svelte:head>
	<title>Gestionar Categorías y Etiquetas - Panel de Administración</title>
</svelte:head>

<div class="admin-container">
	<header class="admin-header">
		<div class="header-content">
			<div>
				<h1>Gestión de Categorías y Etiquetas</h1>
				<p class="subtitle">Administra las categorías y etiquetas de tu blog</p>
			</div>
			<a href="/admin/blog" class="btn btn-secondary">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M19 12H5M12 19l-7-7 7-7" />
				</svg>
				Volver a posts
			</a>
		</div>
	</header>

	<div class="tabs">
		<button
			class="tab"
			class:active={activeTab === 'categorias'}
			on:click={() => (activeTab = 'categorias')}
		>
			Categorías ({categorias.length})
		</button>
		<button
			class="tab"
			class:active={activeTab === 'etiquetas'}
			on:click={() => (activeTab = 'etiquetas')}
		>
			Etiquetas ({etiquetas.length})
		</button>
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="spinner" />
			<p>Cargando...</p>
		</div>
	{:else if activeTab === 'categorias'}
		<div class="content-section">
			<div class="section-header">
				<h2>Categorías</h2>
				<button class="btn btn-primary" on:click={openNewCategoriaModal}>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
					Nueva Categoría
				</button>
			</div>

			{#if categorias.length === 0}
				<div class="empty-state">
					<p>No hay categorías creadas</p>
					<button class="btn btn-primary" on:click={openNewCategoriaModal}
						>Crear primera categoría</button
					>
				</div>
			{:else}
				<div class="items-grid">
					{#each categorias as categoria}
						<div class="item-card">
							<div class="item-color" style:background-color={categoria.color} />
							<div class="item-info">
								<h3>{categoria.nombre}</h3>
								{#if categoria.descripcion}
									<p class="item-description">{categoria.descripcion}</p>
								{/if}
								<span class="item-slug">{categoria.slug}</span>
							</div>
							<div class="item-actions">
								<button
									class="btn-icon"
									on:click={() => openEditCategoriaModal(categoria)}
									title="Editar"
								>
									<svg
										width="16"
										height="16"
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
									on:click={() => confirmDelete('categoria', categoria)}
									title="Eliminar"
								>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<polyline points="3 6 5 6 21 6" />
										<path
											d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
										/>
									</svg>
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<div class="content-section">
			<div class="section-header">
				<h2>Etiquetas</h2>
				<button class="btn btn-primary" on:click={openNewEtiquetaModal}>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
					Nueva Etiqueta
				</button>
			</div>

			{#if etiquetas.length === 0}
				<div class="empty-state">
					<p>No hay etiquetas creadas</p>
					<button class="btn btn-primary" on:click={openNewEtiquetaModal}
						>Crear primera etiqueta</button
					>
				</div>
			{:else}
				<div class="items-grid">
					{#each etiquetas as etiqueta}
						<div class="item-card">
							<div class="item-color" style:background-color={etiqueta.color} />
							<div class="item-info">
								<h3>{etiqueta.nombre}</h3>
								<span class="item-slug">{etiqueta.slug}</span>
							</div>
							<div class="item-actions">
								<button
									class="btn-icon"
									on:click={() => openEditEtiquetaModal(etiqueta)}
									title="Editar"
								>
									<svg
										width="16"
										height="16"
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
									on:click={() => confirmDelete('etiqueta', etiqueta)}
									title="Eliminar"
								>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<polyline points="3 6 5 6 21 6" />
										<path
											d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
										/>
									</svg>
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Modal para crear/editar categoría -->
{#if showCategoriaModal}
	<Modal
		bind:isOpen={showCategoriaModal}
		title={editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
		size="medium"
	>
		<form on:submit|preventDefault={saveCategoria} class="modal-form">
			<div class="form-group">
				<label for="cat-nombre">Nombre *</label>
				<input
					id="cat-nombre"
					type="text"
					bind:value={categoriaForm.nombre}
					placeholder="Ej: Tecnología"
					required
					disabled={savingCategoria}
				/>
			</div>

			<div class="form-group">
				<label for="cat-descripcion">Descripción</label>
				<textarea
					id="cat-descripcion"
					bind:value={categoriaForm.descripcion}
					placeholder="Descripción opcional de la categoría..."
					rows="3"
					disabled={savingCategoria}
				/>
			</div>

			<div class="form-group">
				<label for="cat-slug">Slug *</label>
				<input
					id="cat-slug"
					type="text"
					bind:value={categoriaForm.slug}
					placeholder="tecnologia (se genera automáticamente)"
					disabled={savingCategoria}
				/>
				<small>Se usa en la URL. Déjalo vacío para generarlo automáticamente.</small>
			</div>

			<div class="form-group">
				<label for="cat-color">Color</label>
				<div class="color-picker">
					<input
						id="cat-color"
						type="color"
						bind:value={categoriaForm.color}
						disabled={savingCategoria}
					/>
					<input
						type="text"
						bind:value={categoriaForm.color}
						placeholder="#000000"
						disabled={savingCategoria}
					/>
				</div>
			</div>
		</form>

		<div slot="footer">
			<button
				class="btn btn-secondary"
				on:click={() => (showCategoriaModal = false)}
				disabled={savingCategoria}
			>
				Cancelar
			</button>
			<button
				class="btn btn-primary"
				on:click={saveCategoria}
				disabled={savingCategoria || !categoriaForm.nombre.trim()}
			>
				{#if savingCategoria}
					<span class="spinner-small" />
				{:else}
					{editingCategoria ? 'Guardar cambios' : 'Crear categoría'}
				{/if}
			</button>
		</div>
	</Modal>
{/if}

<!-- Modal para crear/editar etiqueta -->
{#if showEtiquetaModal}
	<Modal
		bind:isOpen={showEtiquetaModal}
		title={editingEtiqueta ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
		size="medium"
	>
		<form on:submit|preventDefault={saveEtiqueta} class="modal-form">
			<div class="form-group">
				<label for="tag-nombre">Nombre *</label>
				<input
					id="tag-nombre"
					type="text"
					bind:value={etiquetaForm.nombre}
					placeholder="Ej: JavaScript"
					required
					disabled={savingEtiqueta}
				/>
			</div>

			<div class="form-group">
				<label for="tag-slug">Slug *</label>
				<input
					id="tag-slug"
					type="text"
					bind:value={etiquetaForm.slug}
					placeholder="javascript (se genera automáticamente)"
					disabled={savingEtiqueta}
				/>
				<small>Se usa en la URL. Déjalo vacío para generarlo automáticamente.</small>
			</div>

			<div class="form-group">
				<label for="tag-color">Color</label>
				<div class="color-picker">
					<input
						id="tag-color"
						type="color"
						bind:value={etiquetaForm.color}
						disabled={savingEtiqueta}
					/>
					<input
						type="text"
						bind:value={etiquetaForm.color}
						placeholder="#000000"
						disabled={savingEtiqueta}
					/>
				</div>
			</div>
		</form>

		<div slot="footer">
			<button
				class="btn btn-secondary"
				on:click={() => (showEtiquetaModal = false)}
				disabled={savingEtiqueta}
			>
				Cancelar
			</button>
			<button
				class="btn btn-primary"
				on:click={saveEtiqueta}
				disabled={savingEtiqueta || !etiquetaForm.nombre.trim()}
			>
				{#if savingEtiqueta}
					<span class="spinner-small" />
				{:else}
					{editingEtiqueta ? 'Guardar cambios' : 'Crear etiqueta'}
				{/if}
			</button>
		</div>
	</Modal>
{/if}

<!-- Modal de confirmación de eliminación -->
{#if showDeleteModal && itemToDelete}
	<Modal
		bind:isOpen={showDeleteModal}
		title="Eliminar {deleteType === 'categoria' ? 'Categoría' : 'Etiqueta'}"
		size="small"
	>
		<div class="delete-confirmation">
			<svg
				class="warning-icon"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			<p>
				¿Estás seguro de que deseas eliminar {deleteType === 'categoria'
					? 'la categoría'
					: 'la etiqueta'}
				<strong>"{itemToDelete.nombre}"</strong>?
			</p>
			<p class="warning-text">
				Esta acción no se puede deshacer. Los posts que usen {deleteType === 'categoria'
					? 'esta categoría'
					: 'esta etiqueta'} ya no la tendrán asignada.
			</p>
		</div>

		<div slot="footer">
			<button class="btn btn-secondary" on:click={() => (showDeleteModal = false)}>
				Cancelar
			</button>
			<button class="btn btn-danger" on:click={deleteItem}>Eliminar</button>
		</div>
	</Modal>
{/if}

<style lang="scss">
	.admin-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.admin-header {
		margin-bottom: 2rem;

		.header-content {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 2rem;

			h1 {
				margin: 0;
				color: var(--color--text);
				font-size: 2rem;
			}

			.subtitle {
				margin: 0.5rem 0 0;
				color: var(--color--text-shade);
				font-size: 1rem;
			}
		}
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid rgba(var(--color--text-rgb), 0.1);

		.tab {
			padding: 0.75rem 1.5rem;
			background: none;
			border: none;
			color: var(--color--text-shade);
			font-size: 1rem;
			font-weight: 500;
			cursor: pointer;
			border-bottom: 2px solid transparent;
			margin-bottom: -2px;
			transition: all 0.2s ease;

			&:hover {
				color: var(--color--text);
			}

			&.active {
				color: var(--color--primary);
				border-bottom-color: var(--color--primary);
			}
		}
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem;
		color: var(--color--text-shade);

		.spinner {
			width: 40px;
			height: 40px;
			border: 3px solid rgba(var(--color--primary-rgb), 0.2);
			border-top-color: var(--color--primary);
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
		}

		p {
			margin-top: 1rem;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.content-section {
		.section-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 1.5rem;

			h2 {
				margin: 0;
				color: var(--color--text);
				font-size: 1.5rem;
			}
		}
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: var(--color--text-shade);

		p {
			margin-bottom: 1.5rem;
			font-size: 1.125rem;
		}
	}

	.items-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.item-card {
		display: flex;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--color--page-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		border-radius: 12px;
		transition: all 0.2s ease;

		&:hover {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
			transform: translateY(-2px);
		}

		.item-color {
			width: 4px;
			border-radius: 2px;
			flex-shrink: 0;
		}

		.item-info {
			flex: 1;
			min-width: 0;

			h3 {
				margin: 0 0 0.5rem;
				font-size: 1.125rem;
				color: var(--color--text);
			}

			.item-description {
				margin: 0 0 0.5rem;
				font-size: 0.875rem;
				color: var(--color--text-shade);
				line-height: 1.5;
			}

			.item-slug {
				display: inline-block;
				padding: 0.25rem 0.5rem;
				font-size: 0.75rem;
				font-family: monospace;
				background: rgba(var(--color--text-rgb), 0.05);
				border-radius: 4px;
				color: var(--color--text-shade);
			}
		}

		.item-actions {
			display: flex;
			gap: 0.5rem;
			align-items: flex-start;
		}
	}

	.btn-icon {
		padding: 0.5rem;
		background: rgba(var(--color--text-rgb), 0.05);
		border: none;
		border-radius: 6px;
		cursor: pointer;
		color: var(--color--text);
		transition: all 0.2s ease;

		&:hover {
			background: rgba(var(--color--text-rgb), 0.1);
		}

		&.btn-danger {
			color: var(--color--danger);

			&:hover {
				background: rgba(var(--color--danger-rgb), 0.1);
			}
		}
	}

	.modal-form {
		.form-group {
			margin-bottom: 1.5rem;

			label {
				display: block;
				margin-bottom: 0.5rem;
				font-weight: 500;
				color: var(--color--text);
			}

			input,
			textarea {
				width: 100%;
				padding: 0.75rem;
				border: 1px solid rgba(var(--color--text-rgb), 0.2);
				border-radius: 8px;
				font-size: 1rem;
				background: var(--color--page-background);
				color: var(--color--text);
				font-family: var(--font--default);

				&:focus {
					outline: none;
					border-color: var(--color--primary);
				}

				&:disabled {
					opacity: 0.6;
					cursor: not-allowed;
				}
			}

			textarea {
				resize: vertical;
			}

			small {
				display: block;
				margin-top: 0.25rem;
				font-size: 0.875rem;
				color: var(--color--text-shade);
			}
		}

		.color-picker {
			display: flex;
			gap: 0.75rem;
			align-items: center;

			input[type='color'] {
				width: 60px;
				height: 40px;
				padding: 0.25rem;
				cursor: pointer;
			}

			input[type='text'] {
				flex: 1;
			}
		}
	}

	.delete-confirmation {
		text-align: center;
		padding: 1rem;

		.warning-icon {
			color: var(--color--danger);
			margin-bottom: 1rem;
		}

		p {
			margin-bottom: 1rem;
			color: var(--color--text);
			line-height: 1.6;
		}

		.warning-text {
			font-size: 0.875rem;
			color: var(--color--text-shade);
		}
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: var(--font--default);
		text-decoration: none;

		&.btn-primary {
			background: var(--color--primary);
			color: white;

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
			background: var(--color--danger);
			color: white;

			&:hover:not(:disabled) {
				background: color-mix(in srgb, var(--color--danger) 85%, black);
			}
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		svg {
			flex-shrink: 0;
		}
	}

	.spinner-small {
		display: inline-block;
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
</style>
