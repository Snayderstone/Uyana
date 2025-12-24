<script lang="ts">
	import { onMount } from 'svelte';
	import { catalogService, CATALOG_CONFIGS } from '$lib/services/admin/catalog/catalog.service';
	import type { CatalogType } from '$lib/services/admin/catalog/catalog.service';
	import type { CatalogoItemDTO } from '$lib/models/admin';
	import CatalogTable from '$lib/components/admin/CatalogTable.svelte';
	import CatalogModal from '$lib/components/admin/CatalogModal.svelte';

	let activeTab: CatalogType = 'estados';
	let items: CatalogoItemDTO[] = [];
	let loading = false;

	// Modal
	let isModalOpen = false;
	let modalMode: 'create' | 'edit' = 'create';
	let selectedItem: CatalogoItemDTO | null = null;

	// Toast/Notification
	let notification = { show: false, message: '', type: 'success' as 'success' | 'error' };

	onMount(() => {
		loadCatalog();
	});

	async function loadCatalog() {
		loading = true;
		const result = await catalogService.getAll(activeTab);
		if (result.success && result.data) {
			items = result.data;
		}
		loading = false;
	}

	function handleTabChange(tab: CatalogType) {
		activeTab = tab;
		loadCatalog();
	}

	function openCreateModal() {
		modalMode = 'create';
		selectedItem = null;
		isModalOpen = true;
	}

	function openEditModal(item: CatalogoItemDTO) {
		modalMode = 'edit';
		selectedItem = item;
		isModalOpen = true;
	}

	async function handleSave(event: CustomEvent<{ nombre: string; descripcion?: string }>) {
		const data = event.detail;

		if (modalMode === 'create') {
			const result = await catalogService.create(activeTab, data);
			if (result.success) {
				showNotification('Elemento creado exitosamente', 'success');
				loadCatalog();
			} else {
				showNotification(result.message || 'Error al crear elemento', 'error');
			}
		} else if (modalMode === 'edit' && selectedItem) {
			const result = await catalogService.update(activeTab, selectedItem.id, data);
			if (result.success) {
				showNotification('Elemento actualizado exitosamente', 'success');
				loadCatalog();
			} else {
				showNotification(result.message || 'Error al actualizar elemento', 'error');
			}
		}

		isModalOpen = false;
	}

	async function handleDelete(event: CustomEvent<CatalogoItemDTO>) {
		const item = event.detail;

		const confirmed = confirm(
			`¿Está seguro que desea ELIMINAR este elemento?\n\n` +
				`Nombre: "${item.nombre}"\n` +
				`${item.descripcion ? `Descripción: "${item.descripcion}"\n` : ''}\n` +
				`Esta acción no se puede deshacer.`
		);

		if (confirmed) {
			const result = await catalogService.delete(activeTab, item.id);
			if (result.success) {
				showNotification('Elemento eliminado exitosamente', 'success');
				loadCatalog();
			} else {
				showNotification(result.message || 'Error al eliminar elemento', 'error');
			}
		}
	}

	function showNotification(message: string, type: 'success' | 'error') {
		notification = { show: true, message, type };
		setTimeout(() => {
			notification.show = false;
		}, 3000);
	}

	$: activeConfig = catalogService.getConfig(activeTab);
</script>

<svelte:head>
	<title>Administración de Catálogos - Uyana</title>
</svelte:head>

<div class="catalogos-page">
	<header class="page-header">
		<div class="header-content">
			<h1>Administración de Catálogos</h1>
			<p class="subtitle">Gestiona todos los catálogos del sistema</p>
		</div>
	</header>

	<!-- Navegación por tabs -->
	<nav class="tabs-nav">
		<div class="tabs-container">
			{#each CATALOG_CONFIGS as config}
				<button
					class="tab"
					class:active={activeTab === config.type}
					on:click={() => handleTabChange(config.type)}
				>
					<span class="tab-label">{config.label}</span>
				</button>
			{/each}
		</div>
	</nav>

	<!-- Contenido del catálogo -->
	<section class="catalog-content">
		<div class="content-header">
			<div class="content-title">
				<h2>{activeConfig?.icon} {activeConfig?.label}</h2>
				<p class="description">{activeConfig?.description}</p>
			</div>
			<button class="btn-create" on:click={openCreateModal}>
				<span class="btn-icon">+</span>
				Agregar nuevo elemento
			</button>
		</div>

		<CatalogTable
			{items}
			{loading}
			catalogLabel={activeConfig?.label || 'Catálogo'}
			on:edit={(e) => openEditModal(e.detail)}
			on:delete={handleDelete}
		/>
	</section>

	<!-- Modal -->
	<CatalogModal
		bind:isOpen={isModalOpen}
		mode={modalMode}
		item={selectedItem}
		catalogLabel={activeConfig?.label || 'Catálogo'}
		on:save={handleSave}
		on:cancel={() => (isModalOpen = false)}
	/>

	<!-- Notificación -->
	{#if notification.show}
		<div class="notification {notification.type}">
			{notification.message}
		</div>
	{/if}
</div>

<style lang="scss">
	.catalogos-page {
		padding: 0;
		max-width: 100%;
		margin: 0;
		background: var(--color--page-background);
		min-height: calc(100vh - 65px);
	}

	.page-header {
		padding: 2rem 2.5rem 1.5rem;
		background: var(--color--card-background);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);

		.header-content {
			max-width: 1600px;
			margin: 0 auto;

			h1 {
				margin: 0 0 0.5rem 0;
				font-size: 1.875rem;
				font-weight: 600;
				color: var(--color--text);
				font-family: var(--font--default);
				letter-spacing: -0.5px;
			}

			.subtitle {
				margin: 0;
				font-size: 0.9375rem;
				color: var(--color--text-shade);
				font-weight: 400;
			}
		}
	}

	.tabs-nav {
		position: sticky;
		top: 0;
		z-index: 100;
		background: var(--color--card-background);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		padding: 0.75rem 2.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.tabs-container {
		display: flex;
		gap: 0.25rem;
		overflow-x: auto;
		max-width: 1600px;
		margin: 0 auto;

		&::-webkit-scrollbar {
			height: 4px;
		}

		&::-webkit-scrollbar-track {
			background: transparent;
		}

		&::-webkit-scrollbar-thumb {
			background: rgba(var(--color--text-rgb), 0.2);
			border-radius: 2px;
		}
	}

	.tab {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 1rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s var(--ease-out-3);
		white-space: nowrap;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color--text-shade);
		font-family: var(--font--default);

		&:hover {
			background: rgba(var(--color--primary-rgb), 0.08);
			color: var(--color--text);
		}

		&.active {
			background: var(--color--primary-tint);
			border-color: rgba(var(--color--primary-rgb), 0.2);
			color: var(--color--primary);
			font-weight: 600;
		}
	}

	.catalog-content {
		background: var(--color--card-background);
		border-radius: 8px;
		padding: 0;
		margin: 1.5rem 2.5rem 2.5rem;
		max-width: 1600px;
		margin-left: auto;
		margin-right: auto;
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.content-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 1.5rem 1.5rem 1rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		gap: 1rem;
	}

	.content-title {
		h2 {
			margin: 0 0 0.375rem 0;
			font-size: 1.25rem;
			font-weight: 600;
			color: var(--color--text);
			font-family: var(--font--default);
			letter-spacing: -0.3px;
		}

		.description {
			margin: 0;
			font-size: 0.8125rem;
			color: var(--color--text-shade);
			font-weight: 400;
		}
	}

	.btn-create {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color--primary);
		color: var(--color--text-inverse);
		border: 1px solid var(--color--primary);
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 500;
		font-family: var(--font--default);
		cursor: pointer;
		transition: all 0.15s var(--ease-out-3);
		white-space: nowrap;

		&:hover {
			background: var(--color--primary-shade);
			border-color: var(--color--primary-shade);
			transform: translateY(-1px);
			box-shadow: 0 2px 8px rgba(var(--color--primary-rgb), 0.3);
		}

		&:active {
			transform: translateY(0);
			box-shadow: 0 1px 4px rgba(var(--color--primary-rgb), 0.2);
		}
	}

	.btn-icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	.notification {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		padding: 0.875rem 1.25rem;
		background: var(--color--card-background);
		border-radius: 6px;
		border: 1px solid rgba(var(--color--text-rgb), 0.12);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		font-weight: 500;
		font-size: 0.875rem;
		font-family: var(--font--default);
		z-index: 1000;
		animation: slideIn 0.3s ease;
		min-width: 300px;

		&.success {
			border-left: 3px solid #10b981;
			color: #10b981;
		}

		&.error {
			border-left: 3px solid #ef4444;
			color: #ef4444;
		}
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@media (max-width: 768px) {
		.page-header {
			padding: 1.5rem 1rem;

			.header-content h1 {
				font-size: 1.5rem;
			}
		}

		.tabs-nav {
			padding: 0.75rem 1rem;
		}

		.tab {
			padding: 0.5rem 0.75rem;
			font-size: 0.75rem;
		}

		.catalog-content {
			margin: 1rem;
			border-radius: 6px;
		}

		.content-header {
			padding: 1rem;
			flex-direction: column;
			align-items: stretch;
		}

		.btn-create {
			width: 100%;
			justify-content: center;
		}

		.notification {
			bottom: 1rem;
			right: 1rem;
			left: 1rem;
			min-width: auto;
		}
	}
</style>
