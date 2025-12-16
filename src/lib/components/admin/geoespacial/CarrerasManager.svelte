<script lang="ts">
	import { onMount } from 'svelte';
	import GeoJSONEditor from '$lib/components/admin/geoespacial/GeoJSONEditor.svelte';
	import type { Carrera, Facultad, GeoJSONGeometry } from '$lib/models/admin';

	let carreras: any[] = [];
	let facultades: any[] = [];
	let loading = false;
	let error = '';
	let success = '';

	// Modal states
	let showModal = false;
	let modalMode: 'create' | 'edit' = 'create';
	let selectedCarrera: Carrera | null = null;

	// Form data
	let formData = {
		facultad_id: 0,
		nombre: '',
		geometry: null as GeoJSONGeometry
	};

	let editorComponent: any;

	onMount(() => {
		loadData();
	});

	async function loadData() {
		await Promise.all([loadCarreras(), loadFacultades()]);
	}

	async function loadCarreras() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/api/admin/geoespacial/carreras?include=relations');
			const result = await response.json();

			if (result.success) {
				carreras = result.data;
			} else {
				error = result.error;
			}
		} catch (e: any) {
			error = 'Error al cargar carreras: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function loadFacultades() {
		try {
			const response = await fetch('/api/admin/geoespacial/facultades?include=carreras');
			const result = await response.json();

			if (result.success) {
				facultades = result.data;
			}
		} catch (e: any) {
			console.error('Error al cargar facultades:', e);
		}
	}

	function openCreateModal() {
		modalMode = 'create';
		selectedCarrera = null;
		formData = {
			facultad_id: facultades[0]?.id || 0,
			nombre: '',
			geometry: null
		};
		showModal = true;
	}

	function openEditModal(carrera: Carrera) {
		modalMode = 'edit';
		selectedCarrera = carrera;
		formData = {
			facultad_id: carrera.facultad_id,
			nombre: carrera.nombre,
			geometry: carrera.geometry
		};
		showModal = true;

		// Centrar el mapa en la geometría existente después de que el modal se monte
		if (carrera.geometry && editorComponent) {
			setTimeout(() => {
				editorComponent.centerOnGeometry(carrera.geometry);
			}, 300);
		}
	}

	function closeModal() {
		showModal = false;
		selectedCarrera = null;
		if (editorComponent) {
			editorComponent.clearGeometry();
		}
	}

	async function handleSubmit() {
		error = '';
		success = '';
		loading = true;

		try {
			const url =
				modalMode === 'create'
					? '/api/admin/geoespacial/carreras'
					: `/api/admin/geoespacial/carreras/${selectedCarrera?.id}`;

			const method = modalMode === 'create' ? 'POST' : 'PUT';

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					facultad_id: formData.facultad_id,
					nombre: formData.nombre,
					geometry: formData.geometry
				})
			});

			const result = await response.json();

			if (result.success) {
				success =
					modalMode === 'create'
						? 'Carrera creada exitosamente'
						: 'Carrera actualizada exitosamente';
				closeModal();
				await loadCarreras();
			} else {
				error = result.error;
			}
		} catch (e: any) {
			error = 'Error al guardar carrera: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function handleDelete(id: number, nombre: string) {
		if (!confirm(`¿Está seguro de eliminar la carrera "${nombre}"?`)) {
			return;
		}

		error = '';
		success = '';
		loading = true;

		try {
			const response = await fetch(`/api/admin/geoespacial/carreras/${id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				success = 'Carrera eliminada exitosamente';
				await loadCarreras();
			} else {
				error = result.error;
			}
		} catch (e: any) {
			error = 'Error al eliminar carrera: ' + e.message;
		} finally {
			loading = false;
		}
	}

	function handleGeometryChange(newGeometry: GeoJSONGeometry) {
		formData.geometry = newGeometry;
	}
</script>

<div class="carreras-manager">
	<div class="header">
		<h2>Gestión de Carreras</h2>
		<button
			class="btn-primary"
			on:click={openCreateModal}
			disabled={loading || facultades.length === 0}
		>
			+ Nueva Carrera
		</button>
	</div>

	{#if facultades.length === 0}
		<div class="alert alert-warning">
			Debe crear al menos una facultad antes de agregar carreras.
		</div>
	{/if}

	{#if error}
		<div class="alert alert-error">{error}</div>
	{/if}

	{#if success}
		<div class="alert alert-success">{success}</div>
	{/if}

	{#if loading && carreras.length === 0}
		<div class="loading">Cargando carreras...</div>
	{:else}
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Nombre</th>
						<th>Facultad</th>
						<th>Institución</th>
						<th>Geometría</th>
						<th>Acciones</th>
					</tr>
				</thead>
				<tbody>
					{#each carreras as carrera}
						<tr>
							<td>{carrera.nombre}</td>
							<td>{carrera.facultad_nombre || '-'}</td>
							<td>{carrera.institucion_nombre || '-'}</td>
							<td>
								{#if carrera.geometry}
									<span class="badge badge-success">{carrera.geometry.type}</span>
								{:else}
									<span class="badge">Sin geometría</span>
								{/if}
							</td>
							<td class="actions">
								<button
									class="btn-small btn-secondary"
									on:click={() => openEditModal(carrera)}
									disabled={loading}
								>
									Editar
								</button>
								<button
									class="btn-small btn-danger"
									on:click={() => handleDelete(carrera.id, carrera.nombre)}
									disabled={loading}
								>
									Eliminar
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			{#if carreras.length === 0}
				<div class="empty-state">No hay carreras registradas</div>
			{/if}
		</div>
	{/if}
</div>

{#if showModal}
	<div
		class="modal-overlay-fullscreen"
		on:click={closeModal}
		role="button"
		tabindex="-1"
		on:keydown={(e) => e.key === 'Escape' && closeModal()}
	>
		<!-- Mapa en pantalla completa -->
		<div class="fullscreen-map" on:click|stopPropagation role="dialog" on:keydown={() => {}}>
			<GeoJSONEditor
				bind:this={editorComponent}
				geometry={formData.geometry}
				onChange={handleGeometryChange}
				height="100vh"
				autoCenter={modalMode === 'edit'}
			/>
		</div>

		<!-- Formulario flotante -->
		<div class="floating-form" on:click|stopPropagation role="dialog" on:keydown={() => {}}>
			<div class="floating-header">
				<h3>
					{modalMode === 'create' ? '🎓 Nueva Carrera' : '✏️ Editar Carrera'}
				</h3>
				<button type="button" class="close-btn-floating" on:click={closeModal} title="Cerrar">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<form on:submit|preventDefault={handleSubmit} class="floating-form-content">
				<div class="form-group-compact">
					<label for="facultad">Facultad *</label>
					<select id="facultad" bind:value={formData.facultad_id} required>
						{#each facultades as fac}
							<option value={fac.id}>
								{fac.nombre}
								{#if fac.institucion_nombre}
									- {fac.institucion_nombre}
								{/if}
							</option>
						{/each}
					</select>
				</div>

				<div class="form-group-compact">
					<label for="nombre">Nombre *</label>
					<input
						id="nombre"
						type="text"
						bind:value={formData.nombre}
						required
						placeholder="Ej: Ingeniería de Sistemas"
					/>
				</div>

				<div class="form-actions-floating">
					<button
						type="button"
						class="btn-secondary-compact"
						on:click={closeModal}
						disabled={loading}
					>
						Cancelar
					</button>
					<button type="submit" class="btn-primary-compact" disabled={loading}>
						{loading ? 'Guardando...' : 'Guardar'}
					</button>
				</div>
			</form>

			{#if error}
				<div class="alert-floating alert-error">{error}</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.carreras-manager {
		padding: 1.5rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
	}

	.alert {
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.alert-error {
		background-color: #fee;
		color: #c00;
		border: 1px solid #fcc;
	}

	.alert-success {
		background-color: #efe;
		color: #070;
		border: 1px solid #cfc;
	}

	.alert-warning {
		background-color: #fef3cd;
		color: #856404;
		border: 1px solid #ffeaa7;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
	}

	.table-container {
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background-color: #f9fafb;
	}

	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.875rem;
		color: #374151;
		border-bottom: 1px solid #e5e7eb;
		white-space: nowrap;
	}

	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #f3f4f6;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		white-space: nowrap;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		border-radius: 0.25rem;
		background-color: #e5e7eb;
		color: #6b7280;
	}

	.badge-success {
		background-color: #d1fae5;
		color: #065f46;
	}

	.empty-state {
		padding: 3rem;
		text-align: center;
		color: #9ca3af;
	}

	.btn-primary,
	.btn-secondary,
	.btn-danger {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background-color: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.btn-secondary {
		background-color: #e5e7eb;
		color: #374151;
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: #d1d5db;
	}

	.btn-danger {
		background-color: #ef4444;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background-color: #dc2626;
	}

	.btn-small {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Modal */
	/* Modal Fullscreen */
	.modal-overlay-fullscreen {
		position: fixed;
		inset: 0;
		z-index: 1000;
	}

	.fullscreen-map {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	/* Formulario flotante */
	.floating-form {
		position: absolute;
		top: 20px;
		right: 20px;
		background: white;
		border-radius: 0.75rem;
		width: 380px;
		max-height: calc(100vh - 40px);
		overflow-y: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
		z-index: 1001;
	}

	.floating-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem;
		border-bottom: 2px solid #e5e7eb;
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		border-radius: 0.75rem 0.75rem 0 0;
	}

	.floating-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: white;
	}

	.close-btn-floating {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		color: white;
		cursor: pointer;
		padding: 0.5rem;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.375rem;
		transition: background-color 0.2s;
	}

	.close-btn-floating:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.close-btn-floating svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.floating-form-content {
		padding: 1.25rem;
	}

	.form-group-compact {
		margin-bottom: 1rem;
	}

	.form-group-compact label {
		display: block;
		margin-bottom: 0.375rem;
		font-weight: 500;
		font-size: 0.8125rem;
		color: #374151;
	}

	.form-group-compact input,
	.form-group-compact select {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.form-group-compact input:focus,
	.form-group-compact select:focus {
		outline: none;
		border-color: #f59e0b;
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
	}

	.form-actions-floating {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.25rem;
		padding-top: 1.25rem;
		border-top: 1px solid #e5e7eb;
	}

	.btn-primary-compact,
	.btn-secondary-compact {
		flex: 1;
		padding: 0.625rem 1rem;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary-compact {
		background-color: #f59e0b;
		color: white;
	}

	.btn-primary-compact:hover:not(:disabled) {
		background-color: #d97706;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);
	}

	.btn-secondary-compact {
		background-color: #f3f4f6;
		color: #374151;
	}

	.btn-secondary-compact:hover:not(:disabled) {
		background-color: #e5e7eb;
	}

	.btn-primary-compact:disabled,
	.btn-secondary-compact:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.alert-floating {
		margin: 1rem 1.25rem;
		padding: 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.alert-floating.alert-error {
		background-color: #fee;
		color: #c00;
		border: 1px solid #fcc;
	}

	/* Legacy styles */
	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		color: #374151;
	}

	input,
	select {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: #f59e0b;
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.floating-form {
			top: 10px;
			right: 10px;
			left: 10px;
			width: auto;
			max-height: calc(100vh - 20px);
		}
	}
</style>
