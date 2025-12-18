<script lang="ts">
	import { onMount } from 'svelte';
	import ParticipantForm from './ParticipantForm.svelte';
	import Toast from './Toast.svelte';

	// Estado de datos
	let participants: any[] = [];
	let filteredParticipants: any[] = [];
	let loading = true;
	let showForm = false;
	let editingParticipant: any = null;

	// Estado de filtros
	let searchTerm = '';
	let filterGenero = '';
	let filterAcreditado = '';

	// Estado de paginación
	let currentPage = 1;
	let itemsPerPage = 10;
	let totalPages = 1;

	// Estado de ordenamiento
	let sortColumn = 'nombre';
	let sortDirection: 'asc' | 'desc' = 'asc';

	// Estado de UI
	let selectedParticipants: Set<number> = new Set();
	let showDeleteConfirm = false;
	let participantToDelete: any = null;
	let showBulkDeleteConfirm = false;

	// Estado de toast
	let toastMessage = '';
	let toastType: 'success' | 'error' | 'info' = 'info';
	let showToast = false;

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			// Cargar participantes
			const participantsRes = await fetch('/api/admin/participants?all=true');
			if (participantsRes.ok) {
				const data = await participantsRes.json();
				participants = data.data?.data || [];
				applyFilters();
			}
		} catch (error) {
			showToastMessage('Error al cargar datos', 'error');
			console.error('Error loading data:', error);
		} finally {
			loading = false;
		}
	}

	function applyFilters() {
		let filtered = [...participants];

		// Búsqueda
		if (searchTerm.trim()) {
			const search = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(p) =>
					p.nombre?.toLowerCase().includes(search) ||
					p.email?.toLowerCase().includes(search) ||
					p.carrera_nombre?.toLowerCase().includes(search)
			);
		}

		// Filtro por género
		if (filterGenero) {
			filtered = filtered.filter((p) => p.genero?.toLowerCase() === filterGenero.toLowerCase());
		}

		// Filtro por acreditación
		if (filterAcreditado !== '') {
			const isAcreditado = filterAcreditado === 'true';
			filtered = filtered.filter((p) => p.acreditado === isAcreditado);
		}

		// Ordenamiento
		filtered.sort((a, b) => {
			let aVal = a[sortColumn];
			let bVal = b[sortColumn];

			if (typeof aVal === 'string') aVal = aVal.toLowerCase();
			if (typeof bVal === 'string') bVal = bVal.toLowerCase();

			if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});

		filteredParticipants = filtered;
		totalPages = Math.ceil(filtered.length / itemsPerPage);
		currentPage = 1;
	}

	function handleSort(column: string) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
		applyFilters();
	}

	function getPaginatedData() {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		return filteredParticipants.slice(start, end);
	}

	function handleNew() {
		editingParticipant = null;
		showForm = true;
	}

	function handleEdit(participant: any) {
		editingParticipant = participant;
		showForm = true;
	}

	function handleDelete(participant: any) {
		participantToDelete = participant;
		showDeleteConfirm = true;
	}

	async function confirmDelete() {
		if (!participantToDelete) return;

		try {
			const response = await fetch(`/api/admin/participants/${participantToDelete.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				showToastMessage('Participante eliminado exitosamente', 'success');
				await loadData();
			} else {
				const error = await response.json();
				showToastMessage(error.error || 'Error al eliminar participante', 'error');
			}
		} catch (error) {
			showToastMessage('Error al eliminar participante', 'error');
			console.error('Error deleting participant:', error);
		} finally {
			showDeleteConfirm = false;
			participantToDelete = null;
		}
	}

	function handleBulkDelete() {
		if (selectedParticipants.size === 0) return;
		showBulkDeleteConfirm = true;
	}

	async function confirmBulkDelete() {
		try {
			const deletePromises = Array.from(selectedParticipants).map((id) =>
				fetch(`/api/admin/participants/${id}`, { method: 'DELETE' })
			);

			await Promise.all(deletePromises);
			showToastMessage(
				`${selectedParticipants.size} participantes eliminados exitosamente`,
				'success'
			);
			selectedParticipants.clear();
			await loadData();
		} catch (error) {
			showToastMessage('Error al eliminar participantes', 'error');
			console.error('Error bulk deleting:', error);
		} finally {
			showBulkDeleteConfirm = false;
		}
	}

	function toggleSelectAll() {
		const currentPageData = getPaginatedData();
		const allSelected = currentPageData.every((p) => selectedParticipants.has(p.id));

		if (allSelected) {
			currentPageData.forEach((p) => selectedParticipants.delete(p.id));
		} else {
			currentPageData.forEach((p) => selectedParticipants.add(p.id));
		}
		selectedParticipants = selectedParticipants;
	}

	function toggleSelect(id: number) {
		if (selectedParticipants.has(id)) {
			selectedParticipants.delete(id);
		} else {
			selectedParticipants.add(id);
		}
		selectedParticipants = selectedParticipants;
	}

	async function handleFormSave() {
		showForm = false;
		editingParticipant = null;
		await loadData();
		showToastMessage(
			editingParticipant
				? 'Participante actualizado exitosamente'
				: 'Participante creado exitosamente',
			'success'
		);
	}

	function handleFormCancel() {
		showForm = false;
		editingParticipant = null;
	}

	function showToastMessage(message: string, type: 'success' | 'error' | 'info') {
		toastMessage = message;
		toastType = type;
		showToast = true;
	}

	function clearFilters() {
		searchTerm = '';
		filterGenero = '';
		filterAcreditado = '';
		applyFilters();
	}

	$: {
		searchTerm;
		filterGenero;
		filterAcreditado;
		applyFilters();
	}
</script>

<div class="participants-table-container">
	{#if showForm}
		<ParticipantForm
			participant={editingParticipant}
			on:save={handleFormSave}
			on:cancel={handleFormCancel}
		/>
	{:else}
		<!-- Barra de herramientas -->
		<div class="toolbar">
			<div class="toolbar-left">
				<button class="btn btn-primary" on:click={handleNew}>
					<span class="btn-icon">➕</span>
					Nuevo Participante
				</button>
				{#if selectedParticipants.size > 0}
					<button class="btn btn-danger" on:click={handleBulkDelete}>
						<span class="btn-icon">🗑️</span>
						Eliminar ({selectedParticipants.size})
					</button>
				{/if}
			</div>
			<div class="toolbar-right">
				<button class="btn btn-secondary" on:click={loadData} disabled={loading}>
					<span class="btn-icon">🔄</span>
					Actualizar
				</button>
			</div>
		</div>

		<!-- Filtros -->
		<div class="filters-section">
			<div class="filters-row">
				<div class="filter-group">
					<label for="search">Buscar</label>
					<input
						id="search"
						type="text"
						class="form-input"
						placeholder="Nombre, email o carrera..."
						bind:value={searchTerm}
					/>
				</div>

				<div class="filter-group">
					<label for="filterGenero">Género</label>
					<select id="filterGenero" class="form-select" bind:value={filterGenero}>
						<option value="">Todos</option>
						<option value="masculino">Masculino</option>
						<option value="femenino">Femenino</option>
						<option value="otro">Otro</option>
					</select>
				</div>

				<div class="filter-group">
					<label for="filterAcreditado">Acreditación</label>
					<select id="filterAcreditado" class="form-select" bind:value={filterAcreditado}>
						<option value="">Todos</option>
						<option value="true">Acreditados</option>
						<option value="false">No Acreditados</option>
					</select>
				</div>

				<div class="filter-group filter-actions">
					<button class="btn btn-secondary" on:click={clearFilters}>Limpiar</button>
				</div>
			</div>

			<div class="filters-info">
				<span>Mostrando {filteredParticipants.length} de {participants.length} participantes</span>
			</div>
		</div>

		<!-- Tabla -->
		{#if loading}
			<div class="loading-state">
				<div class="spinner" />
				<p>Cargando participantes...</p>
			</div>
		{:else if filteredParticipants.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📭</div>
				<h3>No se encontraron participantes</h3>
				<p>No hay participantes que coincidan con los filtros aplicados</p>
				<button class="btn btn-primary" on:click={clearFilters}>Limpiar Filtros</button>
			</div>
		{:else}
			<div class="table-container">
				<table class="data-table">
					<thead>
						<tr>
							<th class="checkbox-col">
								<input
									type="checkbox"
									on:change={toggleSelectAll}
									checked={getPaginatedData().every((p) => selectedParticipants.has(p.id))}
								/>
							</th>
							<th class="sortable" on:click={() => handleSort('nombre')}>
								Nombre
								{#if sortColumn === 'nombre'}
									<span class="sort-icon">{sortDirection === 'asc' ? '▲' : '▼'}</span>
								{/if}
							</th>
							<th class="sortable" on:click={() => handleSort('email')}>
								Email
								{#if sortColumn === 'email'}
									<span class="sort-icon">{sortDirection === 'asc' ? '▲' : '▼'}</span>
								{/if}
							</th>
							<th>Carrera</th>
							<th class="sortable" on:click={() => handleSort('genero')}>
								Género
								{#if sortColumn === 'genero'}
									<span class="sort-icon">{sortDirection === 'asc' ? '▲' : '▼'}</span>
								{/if}
							</th>
							<th class="sortable text-center" on:click={() => handleSort('acreditado')}>
								Acreditado
								{#if sortColumn === 'acreditado'}
									<span class="sort-icon">{sortDirection === 'asc' ? '▲' : '▼'}</span>
								{/if}
							</th>
							<th class="text-center">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{#each getPaginatedData() as participant}
							<tr>
								<td class="checkbox-col">
									<input
										type="checkbox"
										checked={selectedParticipants.has(participant.id)}
										on:change={() => toggleSelect(participant.id)}
									/>
								</td>
								<td>
									<div class="participant-cell">
										{#if participant.url_foto}
											<img
												src={participant.url_foto}
												alt={participant.nombre}
												class="participant-avatar"
											/>
										{:else}
											<div class="avatar-placeholder">
												{participant.nombre?.charAt(0).toUpperCase() || '?'}
											</div>
										{/if}
										<span class="participant-name">{participant.nombre || 'Sin nombre'}</span>
									</div>
								</td>
								<td>{participant.email || '-'}</td>
								<td>{participant.carrera_nombre || 'Sin carrera'}</td>
								<td>
									<span class="gender-badge gender-{participant.genero?.toLowerCase()}">
										{participant.genero || 'No especificado'}
									</span>
								</td>
								<td class="text-center">
									{#if participant.acreditado}
										<span class="badge badge-success">✓ Sí</span>
									{:else}
										<span class="badge badge-warning">⏳ No</span>
									{/if}
								</td>
								<td class="text-center">
									<div class="action-buttons">
										<button
											class="btn-icon-action btn-edit"
											on:click={() => handleEdit(participant)}
											title="Editar"
										>
											✏️
										</button>
										<button
											class="btn-icon-action btn-delete"
											on:click={() => handleDelete(participant)}
											title="Eliminar"
										>
											🗑️
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Paginación -->
			{#if totalPages > 1}
				<div class="pagination">
					<button
						class="pagination-btn"
						on:click={() => (currentPage = 1)}
						disabled={currentPage === 1}
					>
						«
					</button>
					<button
						class="pagination-btn"
						on:click={() => (currentPage = Math.max(1, currentPage - 1))}
						disabled={currentPage === 1}
					>
						‹
					</button>

					<span class="pagination-info">
						Página {currentPage} de {totalPages}
					</span>

					<button
						class="pagination-btn"
						on:click={() => (currentPage = Math.min(totalPages, currentPage + 1))}
						disabled={currentPage === totalPages}
					>
						›
					</button>
					<button
						class="pagination-btn"
						on:click={() => (currentPage = totalPages)}
						disabled={currentPage === totalPages}
					>
						»
					</button>

					<select class="items-per-page-select" bind:value={itemsPerPage} on:change={applyFilters}>
						<option value={10}>10 por página</option>
						<option value={25}>25 por página</option>
						<option value={50}>50 por página</option>
						<option value={100}>100 por página</option>
					</select>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<!-- Modal de confirmación de eliminación -->
{#if showDeleteConfirm}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={() => (showDeleteConfirm = false)}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3>Confirmar Eliminación</h3>
			</div>
			<div class="modal-body">
				<p>
					¿Está seguro que desea eliminar al participante <strong
						>{participantToDelete?.nombre}</strong
					>?
				</p>
				<p class="warning-text">Esta acción no se puede deshacer.</p>
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={() => (showDeleteConfirm = false)}>
					Cancelar
				</button>
				<button class="btn btn-danger" on:click={confirmDelete}> Eliminar </button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal de confirmación de eliminación masiva -->
{#if showBulkDeleteConfirm}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={() => (showBulkDeleteConfirm = false)}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3>Confirmar Eliminación Masiva</h3>
			</div>
			<div class="modal-body">
				<p>
					¿Está seguro que desea eliminar <strong>{selectedParticipants.size}</strong> participantes?
				</p>
				<p class="warning-text">Esta acción no se puede deshacer.</p>
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={() => (showBulkDeleteConfirm = false)}>
					Cancelar
				</button>
				<button class="btn btn-danger" on:click={confirmBulkDelete}> Eliminar Todos </button>
			</div>
		</div>
	</div>
{/if}

{#if showToast}
	<Toast message={toastMessage} type={toastType} on:close={() => (showToast = false)} />
{/if}

<style lang="scss">
	.participants-table-container {
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		gap: 1rem;
		flex-wrap: wrap;

		.toolbar-left,
		.toolbar-right {
			display: flex;
			gap: 0.75rem;
			flex-wrap: wrap;
		}
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s ease;

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.btn-icon {
			font-size: 1rem;
		}

		&.btn-primary {
			background: var(--color-primary);
			color: white;

			&:hover:not(:disabled) {
				background: var(--color-primary-dark);
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(110, 41, 231, 0.3);
			}
		}

		&.btn-secondary {
			background: var(--color-background-elevated);
			color: var(--color-text);
			border: 1px solid var(--color-border);

			&:hover:not(:disabled) {
				background: var(--color-background-hover);
			}
		}

		&.btn-danger {
			background: #ef4444;
			color: white;

			&:hover:not(:disabled) {
				background: #dc2626;
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
			}
		}
	}

	.filters-section {
		background: var(--color-background-elevated);
		padding: 1.5rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

		.filters-row {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 1rem;
			margin-bottom: 1rem;
		}

		.filter-group {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;

			label {
				font-weight: 500;
				font-size: 0.875rem;
				color: var(--color-text-secondary);
			}

			&.filter-actions {
				justify-content: flex-end;
			}
		}

		.filters-info {
			padding-top: 1rem;
			border-top: 1px solid var(--color-border);
			color: var(--color-text-secondary);
			font-size: 0.875rem;
		}
	}

	.form-input,
	.form-select {
		padding: 0.625rem 0.875rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background: var(--color-background);
		color: var(--color-text);
		font-size: 0.875rem;
		transition: all 0.2s ease;

		&:focus {
			outline: none;
			border-color: var(--color-primary);
			box-shadow: 0 0 0 3px rgba(110, 41, 231, 0.1);
		}
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		color: var(--color-text-secondary);
	}

	.loading-state {
		.spinner {
			width: 50px;
			height: 50px;
			border: 4px solid var(--color-border);
			border-top-color: var(--color-primary);
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
			margin-bottom: 1rem;
		}

		@keyframes spin {
			to {
				transform: rotate(360deg);
			}
		}
	}

	.empty-state {
		.empty-icon {
			font-size: 4rem;
			margin-bottom: 1rem;
		}

		h3 {
			margin: 0 0 0.5rem 0;
			color: var(--color-text);
		}

		p {
			margin: 0 0 1.5rem 0;
		}
	}

	.table-container {
		overflow-x: auto;
		background: var(--color-background);
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;

		thead {
			background: var(--color-background-elevated);
			border-bottom: 2px solid var(--color-border);

			th {
				padding: 1rem;
				text-align: left;
				font-weight: 600;
				color: var(--color-text);
				white-space: nowrap;

				&.sortable {
					cursor: pointer;
					user-select: none;
					transition: background 0.2s ease;

					&:hover {
						background: var(--color-background-hover);
					}

					.sort-icon {
						margin-left: 0.25rem;
						color: var(--color-primary);
					}
				}

				&.checkbox-col {
					width: 40px;
				}

				&.text-center {
					text-align: center;
				}
			}
		}

		tbody {
			tr {
				border-bottom: 1px solid var(--color-border);
				transition: background 0.2s ease;

				&:hover {
					background: var(--color-background-hover);
				}

				td {
					padding: 1rem;
					color: var(--color-text);

					&.checkbox-col {
						width: 40px;
					}

					&.text-center {
						text-align: center;
					}
				}
			}
		}
	}

	.participant-cell {
		display: flex;
		align-items: center;
		gap: 0.75rem;

		.participant-avatar {
			width: 36px;
			height: 36px;
			border-radius: 50%;
			object-fit: cover;
		}

		.avatar-placeholder {
			width: 36px;
			height: 36px;
			border-radius: 50%;
			background: var(--color-primary);
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 600;
			font-size: 0.875rem;
		}

		.participant-name {
			font-weight: 500;
		}
	}

	.gender-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: capitalize;

		&.gender-masculino {
			background: rgba(59, 130, 246, 0.1);
			color: #3b82f6;
		}

		&.gender-femenino {
			background: rgba(236, 72, 153, 0.1);
			color: #ec4899;
		}

		&.gender-otro {
			background: rgba(139, 92, 246, 0.1);
			color: #8b5cf6;
		}
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;

		&.badge-success {
			background: rgba(16, 185, 129, 0.1);
			color: #10b981;
		}

		&.badge-warning {
			background: rgba(245, 158, 11, 0.1);
			color: #f59e0b;
		}
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.btn-icon-action {
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 6px;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		transition: all 0.2s ease;

		&.btn-edit:hover {
			background: rgba(59, 130, 246, 0.1);
			transform: scale(1.1);
		}

		&.btn-delete:hover {
			background: rgba(239, 68, 68, 0.1);
			transform: scale(1.1);
		}
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1.5rem;
		flex-wrap: wrap;

		.pagination-btn {
			width: 36px;
			height: 36px;
			border: 1px solid var(--color-border);
			background: var(--color-background);
			color: var(--color-text);
			border-radius: 6px;
			cursor: pointer;
			transition: all 0.2s ease;

			&:hover:not(:disabled) {
				background: var(--color-primary);
				color: white;
				border-color: var(--color-primary);
			}

			&:disabled {
				opacity: 0.4;
				cursor: not-allowed;
			}
		}

		.pagination-info {
			padding: 0 1rem;
			color: var(--color-text-secondary);
			font-size: 0.875rem;
		}

		.items-per-page-select {
			padding: 0.5rem;
			border: 1px solid var(--color-border);
			border-radius: 6px;
			background: var(--color-background);
			color: var(--color-text);
			font-size: 0.875rem;
			cursor: pointer;
		}
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fadeIn 0.2s ease;
	}

	.modal {
		background: var(--color-background);
		border-radius: 12px;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: slideUp 0.3s ease;

		@keyframes slideUp {
			from {
				transform: translateY(20px);
				opacity: 0;
			}
			to {
				transform: translateY(0);
				opacity: 1;
			}
		}

		.modal-header {
			padding: 1.5rem;
			border-bottom: 1px solid var(--color-border);

			h3 {
				margin: 0;
				color: var(--color-text);
			}
		}

		.modal-body {
			padding: 1.5rem;

			p {
				margin: 0 0 1rem 0;
				color: var(--color-text);

				&:last-child {
					margin-bottom: 0;
				}
			}

			.warning-text {
				color: #ef4444;
				font-weight: 500;
			}
		}

		.modal-footer {
			padding: 1.5rem;
			border-top: 1px solid var(--color-border);
			display: flex;
			justify-content: flex-end;
			gap: 0.75rem;
		}
	}

	@media (max-width: 768px) {
		.toolbar {
			flex-direction: column;
			align-items: stretch;

			.toolbar-left,
			.toolbar-right {
				width: 100%;
			}

			.btn {
				flex: 1;
				justify-content: center;
			}
		}

		.filters-section {
			.filters-row {
				grid-template-columns: 1fr;
			}
		}

		.data-table {
			font-size: 0.75rem;

			thead th,
			tbody td {
				padding: 0.75rem 0.5rem;
			}
		}
	}
</style>
