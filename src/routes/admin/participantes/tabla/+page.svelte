<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import type { ParticipanteResponseDTO, ParticipanteFiltersDTO } from '$lib/models/admin';
	import {
		icons,
		FilterFeedback,
		Pagination,
		ExportModal,
		SearchBox,
		TableStates,
		ActionButtons
	} from '$lib/components/admin/shared';

	// State
	let participantes: ParticipanteResponseDTO[] = [];
	let loading = false;
	let error: string | null = null;

	// Pagination
	let currentPage = 1;
	let itemsPerPage = 50;
	let totalItems = 0;
	let totalPages = 0;
	let totalAllParticipants = 0; // Total sin filtros

	// Filters
	let searchQuery = '';
	let emailQuery = '';
	let advancedFilters: ParticipanteFiltersDTO = {};
	let acreditadoFilterValue = ''; // Variable string para el select

	// Sorting
	let sortColumn: string = 'created_at';
	let sortDirection: 'asc' | 'desc' = 'desc';

	// Catalog data
	let generos: Array<{ id: string; nombre: string }> = [
		{ id: 'm', nombre: 'Masculino' },
		{ id: 'f', nombre: 'Femenino' }

	];
	let facultades: Array<{ id: number; nombre: string }> = [];

	// Modals
	let showDeleteModal = false;
	let participanteToDelete: ParticipanteResponseDTO | null = null;

	// Selection
	let selectedParticipants: Set<number> = new Set();
	let selectAll = false;

	// Export modal
	let showExportModal = false;
	let exportFormat: 'csv' | 'excel' = 'csv';
	let exportingData = false;

	/**
	 * Fetch participantes from API
	 */
	async function fetchParticipantes() {
		if (!browser) return;

		loading = true;
		error = null;

		// Add artificial delay for better UX feedback (minimum loading time)
		const minLoadingTime = 800; // 800ms minimum loading
		const startTime = Date.now();

		try {
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
				sort: sortColumn,
				order: sortDirection
			});

			// Add search queries
			if (searchQuery.trim()) {
				params.set('nombre', searchQuery.trim());
			}
			if (emailQuery.trim()) {
				params.set('email', emailQuery.trim());
			}

			// Add basic filters
			if (advancedFilters.genero) {
				params.set('genero', advancedFilters.genero);
			}
			if (advancedFilters.acreditado !== undefined) {
				console.log('📤 Adding acreditado param:', {
					value: advancedFilters.acreditado,
					type: typeof advancedFilters.acreditado,
					stringValue:
						advancedFilters.acreditado === null ? 'null' : advancedFilters.acreditado.toString()
				});
				// Send 'null' string for null values, boolean string for true/false
				params.set(
					'acreditado',
					advancedFilters.acreditado === null ? 'null' : advancedFilters.acreditado.toString()
				);
			}
			if (advancedFilters.facultad_id) {
				params.set('facultad_id', advancedFilters.facultad_id.toString());
			}

			console.log('🌐 API Request:', {
				url: `/api/admin/participants?${params.toString()}`,
				params: Object.fromEntries(params.entries()),
				advancedFilters
			});

			const response = await fetch(`/api/admin/participants?${params.toString()}`);

			if (!response.ok) {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();

			console.log('📥 API Response:', {
				success: result.success,
				totalItems: result.data?.pagination?.total,
				recordCount: result.data?.data?.length,
				sampleData: result.data?.data?.slice(0, 3) // First 3 records for debugging
			});

			if (result.success) {
				participantes = result.data.data;
				totalItems = result.data.pagination.total;
				totalPages = result.data.pagination.total_pages;

				// Auto-select all filtered results when any filter is applied
				if (hasActiveFilters()) {
					// Get all filtered participant IDs (across all pages)
					await selectAllFilteredParticipants();
				} else {
					// Clear selections when no filters are active
					selectedParticipants.clear();
					selectedParticipants = selectedParticipants;
					selectAll = false;
				}

				// Update selectAll state based on current page
				updateSelectAllState();
			} else {
				throw new Error(result.message || 'Error al cargar participantes');
			}
		} catch (err) {
			console.error('Error fetching participantes:', err);
			error = err instanceof Error ? err.message : 'Error al cargar participantes';
		} finally {
			// Ensure minimum loading time for better UX
			const elapsedTime = Date.now() - startTime;
			const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

			setTimeout(() => {
				loading = false;
			}, remainingTime);
		}
	}

	/**
	 * Fetch catalogs
	 */
	async function fetchCatalogs() {
		if (!browser) return;

		try {
			const facultadesRes = await fetch('/api/admin/catalogs/facultades');

			if (facultadesRes.ok) {
				const facultadesData = await facultadesRes.json();
				if (facultadesData.success) {
					facultades = facultadesData.data;
				}
			}
		} catch (err) {
			console.error('Error fetching catalogs:', err);
		}
	}

	/**
	 * Delete participant
	 */
	async function deleteParticipante(id: number) {
		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/admin/participants/${id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				showDeleteModal = false;
				participanteToDelete = null;
				showToast('✅ Participante eliminado correctamente', 'success');
				await fetchParticipantes();
			} else {
				throw new Error(result.message || 'Error al eliminar participante');
			}
		} catch (err) {
			console.error('Error deleting participante:', err);
			error = err instanceof Error ? err.message : 'Error al eliminar participante';
		} finally {
			loading = false;
		}
	}

	// Bulk delete modal
	let showBulkDeleteModal = false;

	/**
	 * Open bulk delete modal
	 */
	function openBulkDeleteModal() {
		if (selectedParticipants.size === 0) return;
		showBulkDeleteModal = true;
	}

	/**
	 * Bulk delete
	 */
	async function bulkDelete() {
		if (selectedParticipants.size === 0) return;

		loading = true;
		error = null;

		try {
			const deletePromises = Array.from(selectedParticipants).map((id) =>
				fetch(`/api/admin/participants/${id}`, { method: 'DELETE' })
			);

			await Promise.all(deletePromises);

			selectedParticipants.clear();
			selectedParticipants = selectedParticipants;
			selectAll = false;
			showBulkDeleteModal = false;

			await fetchParticipantes();
			showToast('✅ Participantes eliminados correctamente', 'success');
		} catch (err) {
			console.error('Error in bulk delete:', err);
			error = 'Error al eliminar participantes';
		} finally {
			loading = false;
		}
	}

	/**
	 * Handle export button click
	 */
	function handleExportClick() {
		if (selectedParticipants.size === 0) {
			showToast('⚠️ Selecciona al menos un participante para exportar', 'warning');
			return;
		}
		showExportModal = true;
	}

	/**
	 * Export selected participants
	 */
	async function exportParticipants() {
		if (selectedParticipants.size === 0) return;

		exportingData = true;

		try {
			const selectedData = participantes.filter((p) => selectedParticipants.has(p.id));

			if (exportFormat === 'csv') {
				exportToCSV(selectedData);
			} else {
				exportToExcel(selectedData);
			}

			showToast('✅ Datos exportados correctamente', 'success');
			showExportModal = false;
		} catch (err) {
			console.error('Error exporting:', err);
			showToast('❌ Error al exportar los participantes', 'error');
		} finally {
			exportingData = false;
		}
	}

	/**
	 * Export ALL participants from database
	 */
	async function exportAllParticipants() {
		exportingData = true;

		try {
			showToast('⏳ Obteniendo todos los participantes...', 'info');

			// Fetch all participants using the 'all=true' parameter
			const response = await fetch('/api/admin/participants?all=true');

			if (!response.ok) {
				throw new Error('Error al obtener todos los participantes');
			}

			const result = await response.json();

			if (!result.success || !result.data.data) {
				throw new Error('No se pudieron obtener los participantes');
			}

			const allParticipants = result.data.data;

			showToast(`📊 Exportando ${allParticipants.length} participantes...`, 'info');

			if (exportFormat === 'csv') {
				exportToCSV(allParticipants);
			} else {
				exportToExcel(allParticipants);
			}

			showToast(
				`✅ ${allParticipants.length} participante${
					allParticipants.length !== 1 ? 's' : ''
				} exportado${allParticipants.length !== 1 ? 's' : ''} correctamente`,
				'success'
			);

			showExportModal = false;
		} catch (err) {
			console.error('Error exporting all:', err);
			showToast('❌ Error al exportar todos los participantes', 'error');
		} finally {
			exportingData = false;
		}
	}

	/**
	 * Export to CSV with complete data
	 */
	function exportToCSV(data: ParticipanteResponseDTO[]) {
		const headers = [
			'ID',
			'Nombre',
			'Email',
			'Género',
			'Carrera',
			'Facultad',
			'Acreditado',
			'Redes Sociales',
			'Fecha Creación'
		];

		const rows = data.map((p) => [
			p.id,
			`"${p.nombre.replace(/"/g, '""')}"`,
			p.email || 'N/A',
			p.genero,
			p.carrera?.nombre || 'N/A',
			p.carrera?.facultad?.nombre || 'N/A',
			p.acreditado ? 'Sí' : 'No',
			p.redes_sociales || 'N/A',
			p.created_at || 'N/A'
		]);

		const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `participantes_${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	/**
	 * Export to Excel format
	 */
	function exportToExcel(data: ParticipanteResponseDTO[]) {
		// Create Excel-compatible CSV with UTF-8 BOM
		const headers = [
			'ID',
			'Nombre',
			'Email',
			'Género',
			'Carrera',
			'Facultad',
			'Acreditado',
			'Redes Sociales',
			'Fecha Creación'
		];

		const rows = data.map((p) => [
			p.id,
			`"${p.nombre.replace(/"/g, '""')}"`,
			p.email || 'N/A',
			p.genero,
			p.carrera?.nombre || 'N/A',
			p.carrera?.facultad?.nombre || 'N/A',
			p.acreditado ? 'Sí' : 'No',
			p.redes_sociales || 'N/A',
			p.created_at || 'N/A'
		]);

		const csv = [headers, ...rows].map((row) => row.join('\t')).join('\n');

		// Add UTF-8 BOM for Excel compatibility
		const BOM = '\uFEFF';
		const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `participantes_${new Date().toISOString().split('T')[0]}.xls`;
		a.click();
		URL.revokeObjectURL(url);
	}

	/**
	 * Format date
	 */
	function formatDate(dateStr: string): string {
		if (!dateStr) return 'N/A';
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('es-CR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(date);
	}

	/**
	 * Get acreditado badge class
	 */
	function getAcreditadoBadgeClass(acreditado: boolean): string {
		return acreditado ? 'badge-success' : 'badge-warning';
	}

	/**
	 * Handle select all
	 */
	function handleSelectAll() {
		if (selectAll) {
			participantes.forEach((p) => selectedParticipants.add(p.id));
		} else {
			selectedParticipants.clear();
		}
		selectedParticipants = selectedParticipants;
	}

	/**
	 * Handle select participant
	 */
	function handleSelectParticipant(id: number) {
		if (selectedParticipants.has(id)) {
			selectedParticipants.delete(id);
		} else {
			selectedParticipants.add(id);
		}
		selectedParticipants = selectedParticipants;
		updateSelectAllState();
	}

	/**
	 * Reset filters
	 */
	function resetFilters() {
		searchQuery = '';
		emailQuery = '';
		acreditadoFilterValue = '';
		// Reset advancedFilters to default empty values
		advancedFilters = {
			genero: '',
			acreditado: undefined,
			facultad_id: undefined
		};
		currentPage = 1;
		// Clear selections
		selectedParticipants.clear();
		selectedParticipants = selectedParticipants;
		selectAll = false;
		fetchParticipantes();
	}

	/**
	 * Check if there are active filters
	 */
	function hasActiveFilters() {
		return (
			searchQuery.trim() !== '' ||
			emailQuery.trim() !== '' ||
			(advancedFilters.genero && advancedFilters.genero !== '') ||
			(advancedFilters.acreditado !== undefined && advancedFilters.acreditado !== null) ||
			(advancedFilters.facultad_id && advancedFilters.facultad_id !== undefined)
		);
	}

	/**
	 * Check if there are specific filters that should trigger auto-selection
	 * Only text-based searches that return targeted results
	 */
	function hasSpecificFilters() {
		return searchQuery.trim() !== '' || emailQuery.trim() !== '';
	}

	/**
	 * Select all filtered participants across all pages
	 */
	async function selectAllFilteredParticipants() {
		try {
			// Build same params as fetchParticipantes but get ALL results
			const params = new URLSearchParams({
				page: '1',
				limit: '9999', // Get all filtered results
				sort: sortColumn,
				order: sortDirection
			});

			// Add same search queries as main fetch
			if (searchQuery.trim()) {
				params.set('search', searchQuery.trim());
			}
			if (emailQuery.trim()) {
				params.set('email', emailQuery.trim());
			}
			if (advancedFilters.genero) {
				params.set('genero', advancedFilters.genero);
			}
			if (advancedFilters.acreditado !== undefined) {
				if (advancedFilters.acreditado === null) {
					params.set('acreditado', 'null');
				} else {
					params.set('acreditado', advancedFilters.acreditado.toString());
				}
			}
			if (advancedFilters.facultad_id) {
				params.set('facultad_id', advancedFilters.facultad_id.toString());
			}

			const response = await fetch(`/api/admin/participants?${params}`);
			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					// Clear and select all filtered participant IDs
					selectedParticipants.clear();
					result.data.data.forEach((p: any) => selectedParticipants.add(p.id));

					// Force reactivity update
					selectedParticipants = new Set(selectedParticipants);

					// Check if all current page participants are selected
					selectAll = participantes.every((p) => selectedParticipants.has(p.id));
				}
			}
		} catch (err) {
			console.error('Error selecting all filtered participants:', err);
			// Fallback to current page selection
			selectedParticipants.clear();
			participantes.forEach((p) => selectedParticipants.add(p.id));
			selectedParticipants = selectedParticipants;
			selectAll = selectedParticipants.size === participantes.length;
		}
	}

	/**
	 * Update selectAll state based on current page participants
	 */
	function updateSelectAllState() {
		if (participantes.length === 0) {
			selectAll = false;
		} else {
			selectAll = participantes.every((p) => selectedParticipants.has(p.id));
		}
	}

	/**
	 * Fetch total participants without filters
	 */
	async function fetchTotalParticipants() {
		if (!browser) return;

		try {
			const response = await fetch('/api/admin/participants?page=1&limit=1');
			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					totalAllParticipants = result.data.pagination.total;
				}
			}
		} catch (err) {
			console.error('❌ Error fetching total participants:', err);
		}
	}

	/**
	 * Clear all filters
	 */
	function clearAllFilters() {
		searchQuery = '';
		emailQuery = '';
		acreditadoFilterValue = '';
		// Force complete reset with new object reference
		advancedFilters = {
			genero: '',
			acreditado: undefined
		};
		// Use tick to ensure DOM updates
		tick().then(() => {
			// Force dropdown elements to reset by directly setting values
			const selectElements = document.querySelectorAll('select.filter-select');
			selectElements.forEach((select) => {
				if (select instanceof HTMLSelectElement) {
					select.selectedIndex = 0;
				}
			});
		});
		currentPage = 1;
		// Clear selections
		selectedParticipants.clear();
		selectedParticipants = selectedParticipants;
		selectAll = false;
		fetchParticipantes();
	}

	/**
	 * Show toast notification
	 */
	function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
		displayToast(message, type);
	}

	/**
	 * Handle column sort
	 */
	function handleSort(column: string) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
		fetchParticipantes();
	}

	/**
	 * Sort participantes locally (fallback if API sorting not available)
	 */
	function sortParticipantes() {
		participantes = [...participantes].sort((a, b) => {
			let aVal: any;
			let bVal: any;

			switch (sortColumn) {
				case 'nombre':
					aVal = a.nombre?.toLowerCase() || '';
					bVal = b.nombre?.toLowerCase() || '';
					break;
				case 'email':
					aVal = a.email?.toLowerCase() || '';
					bVal = b.email?.toLowerCase() || '';
					break;
				case 'genero':
					aVal = a.genero?.toLowerCase() || '';
					bVal = b.genero?.toLowerCase() || '';
					break;
				case 'carrera':
					aVal = a.carrera?.nombre?.toLowerCase() || '';
					bVal = b.carrera?.nombre?.toLowerCase() || '';
					break;
				case 'facultad':
					aVal = a.carrera?.facultad?.nombre?.toLowerCase() || '';
					bVal = b.carrera?.facultad?.nombre?.toLowerCase() || '';
					break;
				case 'acreditado':
					aVal = a.acreditado ? 1 : 0;
					bVal = b.acreditado ? 1 : 0;
					break;

				case 'created_at':
					aVal = new Date(a.created_at || 0).getTime();
					bVal = new Date(b.created_at || 0).getTime();
					break;
				default:
					return 0;
			}

			if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});
	}

	/**
	 * Change page
	 */
	function changePage(newPage: number) {
		if (newPage < 1 || newPage > totalPages) return;
		currentPage = newPage;
		fetchParticipantes();
	}

	/**
	 * Format gender for display
	 */
	function formatGenero(genero: string): string {
		switch (genero?.toLowerCase()) {
			case 'm':
			case 'masculino':
				return 'Masculino';
			case 'f':
			case 'femenino':
				return 'Femenino';
			default:
				return genero || 'No especificado';
		}
	}

	/**
	 * Navigate to participant details
	 */
	function viewParticipant(id: number) {
		goto(`/admin/participantes/${id}`);
	}

	/**
	 * Navigate to participant edit
	 */
	function editParticipant(id: number) {
		goto(`/admin/participantes/editar/${id}`);
	}

	/**
	 * Open delete modal
	 */
	function openDeleteModal(participante: ParticipanteResponseDTO) {
		participanteToDelete = participante;
		showDeleteModal = true;
	}

	/**
	 * Confirm delete
	 */
	function confirmDelete() {
		if (participanteToDelete) {
			deleteParticipante(participanteToDelete.id);
		}
	}

	/**
	 * Actions for selected participants
	 */
	function viewSelectedParticipante() {
		if (selectedParticipants.size === 1) {
			const id = Array.from(selectedParticipants)[0];
			viewParticipant(id);
		}
	}

	function editSelectedParticipante() {
		if (selectedParticipants.size === 1) {
			const id = Array.from(selectedParticipants)[0];
			editParticipant(id);
		}
	}

	function deleteSelectedParticipantes() {
		openBulkDeleteModal();
	}

	// Toast system
	let toastMessage = '';
	let toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
	let toastVisible = false;

	function displayToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
		toastMessage = message;
		toastType = type;
		toastVisible = true;
		setTimeout(() => {
			toastVisible = false;
		}, 4000);
	}

	// Lifecycle
	onMount(() => {
		fetchCatalogs();
		fetchTotalParticipants();
		fetchParticipantes();
	});
</script>

<svelte:head>
	<title>Tabla de Participantes - Admin UYANA</title>
</svelte:head>

<div class="tabla-participantes-page">
	<!-- Header -->
	<div class="page-header">
		<div class="header-content">
			<h1>Gestión de Participantes</h1>
			<p class="subtitle">Administra y visualiza todos los participantes e investigadores</p>
		</div>
		<div class="header-actions">
			<a href="/admin/participantes/nuevo" class="btn-primary">
				{@html icons.plus}
				Nuevo Participante
			</a>
		</div>
	</div>

	<!-- Toolbar -->
	<div class="toolbar responsive-toolbar">
		<div class="toolbar-left responsive-toolbar-left">
			<!-- Search by name -->
			<div class="search-box">
				<div class="search-icon">
					{@html icons.search}
				</div>
				<input
					type="text"
					placeholder="Buscar por nombre..."
					bind:value={searchQuery}
					on:input={(e) => {
						searchQuery = e.currentTarget.value;
						currentPage = 1;
						fetchParticipantes();
					}}
				/>
				{#if searchQuery}
					<button
						class="clear-btn"
						on:click={() => {
							searchQuery = '';
							currentPage = 1;
							fetchParticipantes();
						}}
					>
						{@html icons.close}
					</button>
				{/if}
			</div>

			<!-- Search by email -->
			<div class="search-box">
				<input
					type="email"
					placeholder="Buscar por email..."
					bind:value={emailQuery}
					on:input={(e) => {
						emailQuery = e.currentTarget.value;
						currentPage = 1;
						fetchParticipantes();
					}}
				/>
				{#if emailQuery}
					<button
						class="clear-btn"
						on:click={() => {
							emailQuery = '';
							currentPage = 1;
							fetchParticipantes();
						}}
					>
						{@html icons.close}
					</button>
				{/if}
			</div>

			<!-- Filter by gender -->
			<select
				bind:value={advancedFilters.genero}
				class="filter-select"
				on:change={() => {
					currentPage = 1;
					fetchParticipantes();
				}}
			>
				<option value="">Todos los géneros</option>
				{#each generos as genero}
					<option value={genero.id}>{genero.nombre}</option>
				{/each}
			</select>

			<!-- Filter by acreditado status -->
			<select
				bind:value={acreditadoFilterValue}
				class="filter-select"
				on:change={() => {
					// Convertir string a valor apropiado para advancedFilters
					if (acreditadoFilterValue === '') {
						advancedFilters.acreditado = undefined;
					} else if (acreditadoFilterValue === 'null') {
						advancedFilters.acreditado = null;
					} else {
						advancedFilters.acreditado = acreditadoFilterValue === 'true';
					}
					currentPage = 1;
					fetchParticipantes();
				}}
			>
				<option value="">Selecciona estado acreditación</option>
				<option value="true">Acreditados</option>
				<option value="false">No Acreditados</option>
				<option value="null">No Especificado</option>
			</select>

			<!-- Clear filters button -->

			<button class="btn-secondary" on:click={clearAllFilters}>
				{@html icons.close}
				Limpiar Filtros
			</button>
		</div>

		<!-- Right toolbar actions -->
		<div class="toolbar-right">
			<button
				class="btn-primary"
				on:click={handleExportClick}
				disabled={selectedParticipants.size === 0}
			>
				{@html icons.download}
				Exportar Seleccionados
				{#if selectedParticipants.size > 0}
					<strong>({selectedParticipants.size})</strong>
				{/if}
			</button>

			<button
				class="btn-primary"
				on:click={() => (showExportModal = true)}
				disabled={exportingData}
			>
				{@html icons.download}
				Exportar Todo <strong>({totalAllParticipants})</strong>
				{#if exportingData}
					<div class="spinner-sm" />
				{/if}
			</button>
		</div>
	</div>

	<!-- Records Information -->

	<!-- Error message -->
	{#if error}
		<div class="error-banner">
			<p>{error}</p>
			<button on:click={() => (error = null)}>
				{@html icons.close}
			</button>
		</div>
	{/if}

	<!-- Table -->
	<div class="table-container">
		<!-- Loading overlay for filters -->
		{#if loading}
			<div class="loading-overlay">
				<div class="loading-content">
					<div class="spinner" />
					<p>
						{#if participantes.length === 0}
							Cargando participantes...
						{:else}
							Aplicando filtros...
						{/if}
					</p>
				</div>
			</div>
		{/if}

		{#if loading && participantes.length === 0}
			<div class="loading-state">
				<div class="spinner" />
				<p>Cargando participantes...</p>
			</div>
		{:else if participantes.length === 0}
			<div class="empty-state">
				{@html icons.user}
				<p>No se encontraron participantes</p>
				<a href="/admin/participantes/nuevo" class="btn-primary">
					{@html icons.plus}
					Crear Primer Participante
				</a>
			</div>
		{:else}
			<div class="responsive-table-wrapper">
				<table class="participants-table responsive-table">
					<thead>
						<tr>
							<th class="col-checkbox">
								<label class="checkbox-container" title="Seleccionar todos los registros visibles">
									<input
										type="checkbox"
										bind:checked={selectAll}
										on:change={handleSelectAll}
										class="select-all-checkbox"
									/>
									<span class="checkmark" />
								</label>
							</th>

							<th class="col-participante sortable" on:click={() => handleSort('nombre')}>
								<div class="th-content">
									<span>Participante</span>
									{#if sortColumn === 'nombre'}
										<div class="sort-icon {sortDirection === 'asc' ? 'asc' : 'desc'}">
											{@html icons.sort}
										</div>
									{/if}
								</div>
							</th>
							<th class="col-genero sortable" on:click={() => handleSort('genero')}>
								<div class="th-content">
									<span>Género</span>
									{#if sortColumn === 'genero'}
										<div class="sort-icon {sortDirection === 'asc' ? 'asc' : 'desc'}">
											{@html icons.sort}
										</div>
									{/if}
								</div>
							</th>
							<th class="col-carrera sortable" on:click={() => handleSort('carrera')}>
								<div class="th-content">
									<span>Carrera</span>
									{#if sortColumn === 'carrera'}
										<div class="sort-icon {sortDirection === 'asc' ? 'asc' : 'desc'}">
											{@html icons.sort}
										</div>
									{/if}
								</div>
							</th>
							<th class="col-facultad sortable" on:click={() => handleSort('facultad')}>
								<div class="th-content">
									<span>Facultad</span>
									{#if sortColumn === 'facultad'}
										<div class="sort-icon {sortDirection === 'asc' ? 'asc' : 'desc'}">
											{@html icons.sort}
										</div>
									{/if}
								</div>
							</th>

							<th class="col-acreditado sortable" on:click={() => handleSort('acreditado')}>
								<div class="th-content">
									<span>Acreditado</span>
									{#if sortColumn === 'acreditado'}
										<div class="sort-icon {sortDirection === 'asc' ? 'asc' : 'desc'}">
											{@html icons.sort}
										</div>
									{/if}
								</div>
							</th>
							<th class="col-actions">
								<div class="th-content">
									<span>Acciones</span>
								</div>
							</th>
						</tr>
					</thead>
					<tbody>
						{#each participantes as participante (participante.id)}
							<tr class="participant-row">
								<td class="col-checkbox">
									<label class="checkbox-container">
										<input
											type="checkbox"
											checked={selectedParticipants.has(participante.id)}
											on:change={() => handleSelectParticipant(participante.id)}
										/>
										<span class="checkmark" />
									</label>
								</td>
								<td class="col-participante">
									<div class="participant-info">
										{#if participante.url_foto || participante.foto}
											<img
												src={participante.url_foto || participante.foto}
												alt={participante.nombre}
												class="participant-avatar"
											/>
										{:else}
											<div class="participant-avatar-placeholder">
												{participante.nombre.charAt(0).toUpperCase()}
											</div>
										{/if}
										<div class="participant-details">
											<div class="participant-name">{participante.nombre}</div>
											<div class="participant-email">
												{#if participante.email}
													<a href="mailto:{participante.email}" class="email-link">
														{participante.email}
													</a>
												{:else}
													<span class="text-muted">Sin email</span>
												{/if}
											</div>
										</div>
									</div>
								</td>
								<td class="col-genero">
									<div class="genero-badge genero-{participante.genero?.toLowerCase()}">
										{formatGenero(participante.genero)}
									</div>
								</td>
								<td class="col-carrera">
									{#if participante.carrera}
										<div class="carrera-info">
											<div class="carrera-name">{participante.carrera.nombre}</div>
										</div>
									{:else}
										<span class="text-muted">Sin carrera</span>
									{/if}
								</td>
								<td class="col-facultad">
									{#if participante.carrera?.facultad}
										<div class="facultad-badge">
											{participante.carrera.facultad.nombre}
										</div>
									{:else}
										<span class="text-muted">Sin facultad</span>
									{/if}
								</td>

								<td class="col-acreditado">
									<span class="badge-simple {participante.acreditado ? 'badge-yes' : 'badge-no'}">
										{participante.acreditado ? 'Sí' : 'No'}
									</span>
								</td>
								<td class="col-actions">
									<div class="action-buttons">
										<button
											class="btn-action btn-view"
											on:click={() => goto(`/admin/participantes/${participante.id}`)}
											title="Ver detalles"
										>
											{@html icons.eye}
										</button>
										<button
											class="btn-action btn-edit"
											on:click={() => goto(`/admin/participantes/editar/${participante.id}`)}
											title="Editar"
										>
											{@html icons.edit}
										</button>
										<button
											class="btn-action btn-delete"
											on:click={() => {
												participanteToDelete = participante;
												showDeleteModal = true;
											}}
											title="Eliminar"
										>
											{@html icons.delete}
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="pagination">
			<div class="pagination-info">
				<span>
					Mostrando {(currentPage - 1) * itemsPerPage + 1}-{Math.min(
						currentPage * itemsPerPage,
						totalItems
					)} de {totalItems} participantes
				</span>
			</div>

			<div class="pagination-controls">
				<button
					class="btn-pagination"
					on:click={() => changePage(currentPage - 1)}
					disabled={currentPage <= 1}
				>
					{@html icons.chevronLeft}
				</button>

				{#if totalPages <= 7}
					{#each Array(totalPages) as _, i}
						<button
							class="btn-pagination {currentPage === i + 1 ? 'active' : ''}"
							on:click={() => changePage(i + 1)}
						>
							{i + 1}
						</button>
					{/each}
				{:else}
					<button
						class="btn-pagination {currentPage === 1 ? 'active' : ''}"
						on:click={() => changePage(1)}
					>
						1
					</button>

					{#if currentPage > 3}
						<span class="pagination-ellipsis">...</span>
					{/if}

					{#each Array(3) as _, i}
						{@const page = Math.max(2, Math.min(totalPages - 1, currentPage - 1 + i))}
						{#if page > 1 && page < totalPages}
							<button
								class="btn-pagination {currentPage === page ? 'active' : ''}"
								on:click={() => changePage(page)}
							>
								{page}
							</button>
						{/if}
					{/each}

					{#if currentPage < totalPages - 2}
						<span class="pagination-ellipsis">...</span>
					{/if}

					<button
						class="btn-pagination {currentPage === totalPages ? 'active' : ''}"
						on:click={() => changePage(totalPages)}
					>
						{totalPages}
					</button>
				{/if}

				<button
					class="btn-pagination"
					on:click={() => changePage(currentPage + 1)}
					disabled={currentPage >= totalPages}
				>
					{@html icons.chevronRight}
				</button>
			</div>

			<select bind:value={itemsPerPage} on:change={() => ((currentPage = 1), fetchParticipantes())}>
				<option value={10}>10 por página</option>
				<option value={15}>15 por página</option>
				<option value={25}>25 por página</option>
				<option value={50}>50 por página</option>
			</select>
		</div>
	{/if}
</div>

<!-- Delete Confirmation Modal (Single) -->
{#if showDeleteModal && participanteToDelete}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={() => (showDeleteModal = false)}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal modal-delete" on:click|stopPropagation>
			<div class="modal-header modal-header-danger">
				<div class="modal-title">
					{@html icons.error}
					<span>Confirmar Eliminación</span>
				</div>
				<button class="modal-close" on:click={() => (showDeleteModal = false)}>
					{@html icons.close}
				</button>
			</div>

			<div class="modal-body">
				<div class="delete-confirmation">
					<div class="participant-preview">
						{#if participanteToDelete.url_foto || participanteToDelete.foto}
							<img
								src={participanteToDelete.url_foto || participanteToDelete.foto}
								alt={participanteToDelete.nombre}
								class="preview-avatar"
							/>
						{:else}
							<div class="preview-avatar-placeholder">
								{participanteToDelete.nombre.charAt(0).toUpperCase()}
							</div>
						{/if}
						<div class="preview-details">
							<h4>{participanteToDelete.nombre}</h4>
							<p class="preview-meta">ID: #{participanteToDelete.id}</p>
							{#if participanteToDelete.email}
								<p class="preview-meta">{participanteToDelete.email}</p>
							{/if}
						</div>
					</div>

					<div class="delete-warning">
						<p>
							¿Estás seguro de que deseas eliminar permanentemente a este participante del sistema?
						</p>
						<div class="warning-list">
							<div class="warning-item">
								{@html icons.error}
								<span>Se eliminará toda la información personal del participante</span>
							</div>
							<div class="warning-item">
								{@html icons.error}
								<span>Esta acción no se puede deshacer</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn-secondary" on:click={() => (showDeleteModal = false)}> Cancelar </button>
				<button
					class="btn-danger"
					on:click={() => participanteToDelete && deleteParticipante(participanteToDelete.id)}
					disabled={loading}
				>
					{#if loading}
						<div class="spinner-sm" />
					{:else}
						{@html icons.delete}
					{/if}
					Eliminar Participante
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Export Confirmation Modal -->
{#if showExportModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={() => (showExportModal = false)}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal modal-export" on:click|stopPropagation>
			<div class="modal-header">
				<div class="modal-title">
					{@html icons.download}
					<span>Exportar Participantes</span>
				</div>
				<button class="modal-close" on:click={() => (showExportModal = false)}>
					{@html icons.close}
				</button>
			</div>

			<div class="modal-body">
				<div class="export-options">
					<div class="export-info">
						<p>
							{#if selectedParticipants.size > 0}
								Se exportarán <strong>{selectedParticipants.size}</strong> participante(s) seleccionado(s).
							{:else}
								Se exportarán <strong>todos los {totalItems}</strong> participantes.
							{/if}
						</p>
					</div>

					<div class="format-selection">
						<h4>Selecciona el formato de exportación:</h4>
						<div class="format-options">
							<label class="format-option">
								<input type="radio" bind:group={exportFormat} value="csv" />
								<div class="option-content">
									<div class="option-icon">📊</div>
									<div class="option-details">
										<span class="option-title">CSV</span>
										<span class="option-description">Compatible con Excel, Google Sheets</span>
									</div>
								</div>
							</label>

							<label class="format-option">
								<input type="radio" bind:group={exportFormat} value="excel" />
								<div class="option-content">
									<div class="option-icon">📋</div>
									<div class="option-details">
										<span class="option-title">Excel</span>
										<span class="option-description">Formato nativo de Microsoft Excel</span>
									</div>
								</div>
							</label>
						</div>
					</div>

					<div class="export-preview">
						<h4>Datos a incluir:</h4>
						<div class="data-fields">
							<div class="field-item">
								{@html icons.check}
								<span>Información personal (nombre, email, género)</span>
							</div>
							<div class="field-item">
								{@html icons.check}
								<span>Información académica (facultad)</span>
							</div>
							<div class="field-item">
								{@html icons.check}
								<span>Estado de acreditación</span>
							</div>
							<div class="field-item">
								{@html icons.check}
								<span>Fecha de registro</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn-secondary" on:click={() => (showExportModal = false)}> Cancelar </button>
				<button
					class="btn-primary"
					on:click={selectedParticipants.size > 0 ? exportParticipants : exportAllParticipants}
					disabled={exportingData}
				>
					{#if exportingData}
						<div class="spinner-sm" />
					{:else}
						{@html icons.download}
					{/if}
					Exportar {selectedParticipants.size > 0 ? 'Seleccionados' : 'Todos'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Bulk Delete Confirmation Modal -->
{#if showBulkDeleteModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={() => (showBulkDeleteModal = false)}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal modal-delete" on:click|stopPropagation>
			<div class="modal-header modal-header-danger">
				<div class="modal-title">
					{@html icons.error}
					<span>Eliminar Múltiples Participantes</span>
				</div>
				<button class="modal-close" on:click={() => (showBulkDeleteModal = false)}>
					{@html icons.close}
				</button>
			</div>

			<div class="modal-body">
				<div class="bulk-delete-confirmation">
					<div class="selection-summary">
						<div class="summary-count">
							<div class="count-badge">{selectedParticipants.size}</div>
							<div class="count-text">
								<span class="count-title">Participantes Seleccionados</span>
								<span class="count-subtitle">para eliminación</span>
							</div>
						</div>
					</div>

					<div class="selected-items-preview">
						<h4>Participantes que serán eliminados:</h4>
						<div class="preview-list">
							{#each participantes
								.filter((p) => selectedParticipants.has(p.id))
								.slice(0, 5) as participante}
								<div class="preview-item">
									{#if participante.url_foto || participante.foto}
										<img
											src={participante.url_foto || participante.foto}
											alt={participante.nombre}
											class="preview-avatar-sm"
										/>
									{:else}
										<div class="preview-avatar-placeholder-sm">
											{participante.nombre.charAt(0).toUpperCase()}
										</div>
									{/if}
									<div class="preview-info">
										<span class="preview-name">{participante.nombre}</span>
										<span class="preview-details">ID: #{participante.id}</span>
									</div>
								</div>
							{/each}
							{#if selectedParticipants.size > 5}
								<div class="preview-more">
									<span>... y {selectedParticipants.size - 5} más</span>
								</div>
							{/if}
						</div>
					</div>

					<div class="bulk-delete-warning">
						<div class="warning-box">
							<div class="warning-icon">
								{@html icons.error}
							</div>
							<div class="warning-content">
								<p class="warning-title">¡Atención! Esta acción es irreversible</p>
								<ul class="warning-list">
									<li>Se eliminarán permanentemente {selectedParticipants.size} participante(s)</li>
									<li>Se perderá toda su información personal y académica</li>
									<li>Esta acción no se puede deshacer</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn-secondary" on:click={() => (showBulkDeleteModal = false)}>
					Cancelar
				</button>
				<button class="btn-danger" on:click={bulkDelete} disabled={loading}>
					{#if loading}
						<div class="spinner-sm" />
					{:else}
						{@html icons.delete}
					{/if}
					Eliminar {selectedParticipants.size} Participante(s)
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Toast Component -->
{#if toastVisible}
	<div class="toast toast-{toastType}">
		<div class="toast-content">
			<span class="toast-message">{toastMessage}</span>
		</div>
		<button class="toast-close" on:click={() => (toastVisible = false)}>
			{@html icons.close}
		</button>
	</div>
{/if}

<style lang="scss">
	.tabla-participantes-page {
		padding: 2rem;
		max-width: 1600px;
		margin: 0 auto;
	}

	// ==================== Header ====================
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 2rem;

		.header-content {
			h1 {
				font-size: 2.5rem;
				font-weight: 700;
				color: var(--color--text);
				margin: 0 0 0.5rem 0;
				letter-spacing: -0.025em;
			}

			.subtitle {
				font-size: 1rem;
				color: var(--color--text-shade);
				margin: 0;
			}
		}

		.header-actions {
			display: flex;
			gap: 0.75rem;
		}
	}

	// ==================== Toolbar ====================
	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		padding: 0.875rem 1rem;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 8px;
		flex-wrap: wrap;

		.toolbar-left,
		.toolbar-right {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			flex-wrap: wrap;
		}

		.toolbar-left {
			flex: 1;
			min-width: 0;
			max-width: none;
		}

		.toolbar-right {
			flex-shrink: 0;
		}
	}

	.search-box {
		position: relative;
		width: 450px;
		max-width: 500px;
		min-width: 300px;
		flex-shrink: 1;

		.search-icon {
			position: absolute;
			left: 10px;
			top: 50%;
			transform: translateY(-50%);
			color: var(--color--text-shade);
			font-size: 1.125rem;
		}

		input {
			width: 100%;
			padding: 0.5rem 2rem 0.5rem 2.25rem;
			background: var(--color--input-background, rgba(255, 255, 255, 0.05));
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			border-radius: 6px;
			color: var(--color--text);
			font-size: 0.8125rem;

			&:focus {
				outline: none;
				border-color: #10b981;
			}

			&::placeholder {
				color: var(--color--text-shade);
			}
		}

		.clear-btn {
			position: absolute;
			right: 6px;
			top: 50%;
			transform: translateY(-50%);
			background: none;
			border: none;
			color: var(--color--text-shade);
			cursor: pointer;
			padding: 4px;
			display: flex;
			align-items: center;

			&:hover {
				color: var(--color--text);
			}
		}
	}

	.filter-select {
		padding: 0.5rem 2rem 0.5rem 0.75rem;
		background: var(--color--input-background, rgba(255, 255, 255, 0.05));
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 6px;
		color: var(--color--text);
		font-size: 0.8125rem;
		cursor: pointer;
		min-width: 200px;
		max-width: 350px;

		&:focus {
			outline: none;
			border-color: #10b981;
		}
	}

	// ==================== Records Information Section ====================
	.records-info-section {
		padding: 1rem 1.5rem;
		margin-bottom: 1rem;
	}

	.records-counter {
		display: flex;
		align-items: center;
		gap: 1rem;
		justify-content: flex-start;
	}

	.records-found {
		font-size: 0.875rem;
		font-weight: 600;
		color: #10b981;
	}

	.selected-counter {
		font-size: 0.875rem;
		color: #6366f1;
		font-weight: 500;
		background: rgba(99, 102, 241, 0.1);
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
	}

	.selection-count {
		position: absolute;
		top: -8px;
		right: -8px;
		background: #10b981;
		color: #ffffff;
		border-radius: 50%;
		width: 18px;
		height: 18px;
		font-size: 0.6875rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid var(--color--card-background);
	}

	.col-checkbox {
		position: relative;
		text-align: center;
		width: 60px;
		min-width: 60px;
	}

	.checkbox-container {
		position: relative;
		display: inline-block;
		cursor: pointer;

		input[type='checkbox'] {
			opacity: 0;
			position: absolute;
			cursor: pointer;
		}

		.checkmark {
			display: inline-block;
			width: 20px;
			height: 20px;
			background-color: transparent;
			border: 2px solid rgba(var(--color--text-rgb), 0.3);
			border-radius: 4px;
			position: relative;
			transition: all 0.2s ease;
		}

		input:checked + .checkmark {
			background-color: #10b981;
			border-color: #10b981;
		}

		input:checked + .checkmark:after {
			content: '';
			position: absolute;
			left: 6px;
			top: 2px;
			width: 6px;
			height: 10px;
			border: solid white;
			border-width: 0 2px 2px 0;
			transform: rotate(45deg);
		}

		&:hover .checkmark {
			border-color: #10b981;
		}
	}

	// ==================== Records Counter ====================
	.records-counter {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
		margin-right: 1rem;
	}

	.records-found {
		font-size: 0.875rem;
		font-weight: 600;
		color: #10b981;
	}

	.selected-counter {
		font-size: 0.75rem;
		color: var(--color--text-shade);
		font-style: italic;
	}

	.selection-count {
		position: absolute;
		top: -8px;
		right: -8px;
		background: #10b981;
		color: #ffffff;
		border-radius: 50%;
		width: 18px;
		height: 18px;
		font-size: 0.6875rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid var(--color--card-background);
	}

	// ==================== Filter Badge ====================
	.filter-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		background: #10b981;
		color: #ffffff;
		border-radius: 9px;
		font-size: 0.6875rem;
		font-weight: 700;
		line-height: 1;
	}

	// ==================== Toast Notification ====================
	.toast-notification {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: var(--color--card-background);
		border: 1px solid #10b981;
		border-radius: 8px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
		z-index: 10000;
		animation: slideIn 0.3s ease;
		max-width: 400px;

		span {
			color: var(--color--text);
			font-size: 0.875rem;
			line-height: 1.4;
		}

		.toast-close {
			background: none;
			border: none;
			color: var(--color--text-shade);
			cursor: pointer;
			padding: 4px;
			display: flex;
			align-items: center;
			transition: color 0.15s ease;

			&:hover {
				color: var(--color--text);
			}
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

	// ==================== Error Banner ====================
	.error-banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		margin-bottom: 1.5rem;

		p {
			color: #ef4444;
			margin: 0;
			font-size: 0.875rem;
		}

		button {
			background: none;
			border: none;
			color: #ef4444;
			cursor: pointer;
			padding: 4px;
			display: flex;
			align-items: center;

			&:hover {
				color: #dc2626;
			}
		}
	}

	// ==================== Table ====================
	.table-container {
		position: relative;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 8px;
		overflow-x: auto;
		margin-bottom: 1rem;
	}

	.participants-table {
		width: 100%;
		border-collapse: collapse;

		thead {
			background: rgba(var(--color--text-rgb), 0.02);
			border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);

			th {
				padding: 0.625rem 0.75rem;
				text-align: center;
				font-size: 0.6875rem;
				font-weight: 700;
				color: var(--color--text-shade);
				text-transform: uppercase;
				letter-spacing: 0.1em;
				border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
				user-select: none;

				&.sortable {
					cursor: pointer;
					transition: all 0.15s ease;

					&:hover {
						color: #10b981;
						background: rgba(16, 185, 129, 0.05);
					}
				}

				.th-content {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					justify-content: space-between;
				}

				.sort-icon {
					transition: all 0.15s ease;
					display: flex;
					align-items: center;
					justify-content: center;

					&.asc {
						transform: rotate(0deg);
						color: #10b981;
					}

					&.desc {
						transform: rotate(180deg);
						color: #10b981;
					}

					&.inactive {
						opacity: 0.3;
						color: var(--color--text-shade);
					}

					:global(svg) {
						width: 12px;
						height: 12px;
					}
				}

				&.col-actions {
					position: sticky;
					right: 0;
					background: rgba(var(--color--text-rgb), 0.02);
					z-index: 20;
				}
			}
		}

		tbody {
			.participant-row {
				border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
				transition: background-color 0.15s ease;

				&:hover {
					background: rgba(16, 185, 129, 0.02);
				}

				&:last-child {
					border-bottom: none;
				}

				td {
					padding: 0.5rem 0.75rem;
					color: var(--color--text);
					font-size: 0.8125rem;
					vertical-align: top;
					line-height: 1.3;

					&.col-checkbox {
						width: 40px;
						padding: 0.5rem 0.375rem;

						input[type='checkbox'] {
							cursor: pointer;
							width: 16px;
							height: 16px;
							accent-color: #10b981;
						}
					}

					&.col-participante {
						min-width: 250px;
						max-width: 300px;
					}

					&.col-genero {
						width: 120px;
					}

					&.col-carrera {
						min-width: 150px;
						max-width: 180px;
					}

					&.col-facultad {
						min-width: 140px;
						max-width: 160px;
					}

					&.col-acreditado {
						width: 140px;
					}

					&.col-actions {
						width: 150px;
						position: sticky;
						right: 0;
						background: var(--color--card-background);
						z-index: 10;
					}
				}
			}
		}
	}

	.participant-info {
		display: flex;
		align-items: center;
		gap: 0.875rem;

		.participant-avatar,
		.participant-avatar-placeholder {
			width: 40px;
			height: 40px;
			min-width: 40px;
			border-radius: 50%;
			object-fit: cover;
			flex-shrink: 0;
		}

		.participant-avatar-placeholder {
			background: linear-gradient(135deg, #10b981 0%, #059669 100%);
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 700;
			font-size: 1.125rem;
		}

		.participant-details {
			min-width: 0;

			.participant-name {
				font-weight: 600;
				color: var(--color--text);
				margin-bottom: 2px;
				line-height: 1.3;
			}
		}
	}

	.email-link {
		color: #3b82f6;
		text-decoration: none;
		transition: color 0.15s ease;

		&:hover {
			color: #60a5fa;
			text-decoration: underline;
		}
	}

	.text-muted {
		color: var(--color--text-shade);
		font-style: italic;
	}

	.genero-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.625rem;
		background: rgba(59, 130, 246, 0.1);
		color: #60a5fa;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;

		&.genero-m {
			background: rgba(59, 130, 246, 0.1);
			color: #3b82f6;
		}

		&.genero-f {
			background: rgba(236, 72, 153, 0.1);
			color: #ec4899;
		}

		&.genero-otro {
			background: rgba(16, 185, 129, 0.1);
			color: #10b981;
		}

		&.genero-prefiero_no_decir {
			background: rgba(156, 163, 175, 0.1);
			color: var(--color--text-shade);
		}
	}

	.carrera-info {
		.carrera-name {
			font-weight: 500;
			color: var(--color--text);
			line-height: 1.3;
			max-width: 150px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	.facultad-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.625rem;
		background: rgba(168, 85, 247, 0.1);
		color: #a78bfa;
		max-width: 130px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
		max-width: 100%;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}

	.fecha-info {
		font-size: 0.8125rem;
		color: var(--color--text-shade);
		font-weight: 500;
	}

	.action-buttons {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}

	.btn-action {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 6px;
		background: rgba(var(--color--text-rgb), 0.03);
		color: var(--color--text-shade);
		cursor: pointer;
		transition: all 0.15s ease;

		&:hover {
			border-color: #10b981;
			color: #10b981;
		}

		&.btn-view:hover {
			border-color: #3b82f6;
			color: #3b82f6;
		}

		&.btn-edit:hover {
			border-color: #f59e0b;
			color: #f59e0b;
		}

		&.btn-delete:hover {
			border-color: #ef4444;
			color: #ef4444;
		}

		:global(svg) {
			width: 16px;
			height: 16px;
		}
	}

	// ==================== Badges ====================
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 4px;
		white-space: nowrap;

		&.badge-success {
			background: rgba(16, 185, 129, 0.15);
			color: #10b981;
		}

		&.badge-warning {
			background: rgba(245, 158, 11, 0.15);
			color: #f59e0b;
		}

		:global(svg) {
			width: 12px;
			height: 12px;
		}
	}

	// ==================== States ====================
	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(var(--color--card-background-rgb, 26, 31, 38), 0.9);
		backdrop-filter: blur(2px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		border-radius: 8px;

		.loading-content {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 1rem;
			padding: 2rem;
			background: var(--color--card-background);
			border-radius: 8px;
			border: 1px solid rgba(var(--color--text-rgb), 0.08);

			p {
				color: #10b981;
				margin: 0;
				font-weight: 500;
				text-align: center;
			}
		}
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		gap: 1rem;

		p {
			color: var(--color--text-shade);
			margin: 0;
		}

		:global(svg) {
			width: 48px;
			height: 48px;
			color: var(--color--text-shade);
		}
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(var(--color--text-rgb), 0.1);
		border-top: 3px solid #10b981;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.spinner-sm {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid #ffffff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.spinning {
		animation: spin 0.8s linear infinite;
	}

	// ==================== Buttons ====================
	.btn-primary,
	.btn-secondary,
	.btn-danger,
	.btn-danger-outline,
	.btn-icon,
	.btn-icon-text {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
		text-decoration: none;
		border: none;
		white-space: nowrap;
		line-height: 1;

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		:global(svg) {
			width: 16px;
			height: 16px;
		}
	}

	.btn-primary {
		background: #10b981;
		color: #ffffff;

		&:hover:not(:disabled) {
			background: #059669;
		}
	}

	.btn-secondary {
		background: rgba(var(--color--text-rgb), 0.05);
		color: var(--color--text);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);

		&:hover:not(:disabled) {
			background: rgba(var(--color--text-rgb), 0.1);
			border-color: rgba(var(--color--text-rgb), 0.2);
		}
	}

	.btn-danger {
		background: #ef4444;
		color: #ffffff;

		&:hover:not(:disabled) {
			background: #dc2626;
		}
	}

	.btn-danger-outline {
		background: transparent;
		border: 1px solid #ef4444;
		color: #ef4444;

		&:hover:not(:disabled) {
			background: rgba(239, 68, 68, 0.1);
		}
	}

	.btn-icon {
		padding: 0.5rem;
		min-width: 36px;
		min-height: 36px;
	}

	.btn-icon-text {
		background: rgba(var(--color--text-rgb), 0.03);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		color: var(--color--text-shade);
		min-width: fit-content;
		position: relative;

		&:hover:not(:disabled) {
			background: rgba(var(--color--text-rgb), 0.05);
			border-color: #10b981;
			color: var(--color--text);
		}

		&.active {
			background: rgba(var(--color--text-rgb), 0.05);
			border-color: #10b981;
			color: #10b981;
		}

		&.btn-reset {
			&:disabled {
				opacity: 0.4;
				cursor: not-allowed;

				&:hover {
					background: rgba(var(--color--text-rgb), 0.03);
					border-color: rgba(var(--color--text-rgb), 0.08);
					color: var(--color--text-shade);
				}
			}

			&:not(:disabled) {
				animation: pulse 2s infinite;

				&:hover {
					animation: none;
				}
			}
		}
	}

	@keyframes pulse {
		0%,
		100% {
			border-color: rgba(var(--color--text-rgb), 0.08);
		}
		50% {
			border-color: #ef4444;
		}
	}

	// ==================== Export Badge ====================
	.export-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0 4px;
		background: #10b981;
		color: #ffffff;
		border-radius: 4px;
		font-size: 0.6875rem;
		font-weight: 700;
		line-height: 1;
		margin-left: 2px;
	}

	// ==================== Pagination ====================
	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1.5rem;
		padding: 1rem;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 8px;

		.pagination-info {
			font-size: 0.875rem;
			color: var(--color--text-shade);
		}

		.pagination-controls {
			display: flex;
			gap: 0.5rem;
		}

		.btn-pagination {
			display: flex;
			align-items: center;
			justify-content: center;
			min-width: 36px;
			height: 36px;
			padding: 0 0.75rem;
			background: var(--color--input-background, rgba(255, 255, 255, 0.05));
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			border-radius: 6px;
			color: var(--color--text-shade);
			font-size: 0.875rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.15s ease;
			text-decoration: none;

			&:hover:not(:disabled) {
				background: rgba(var(--color--text-rgb), 0.05);
				border-color: #10b981;
				color: var(--color--text);
			}

			&.active {
				background: #10b981;
				border-color: #10b981;
				color: #ffffff;
				font-weight: 600;
			}

			&:disabled {
				opacity: 0.4;
				cursor: not-allowed;
			}
		}

		.pagination-ellipsis {
			display: flex;
			align-items: center;
			padding: 0 0.5rem;
			color: var(--color--text-shade);
		}

		select {
			padding: 0.5rem 0.75rem;
			background: var(--color--input-background, rgba(255, 255, 255, 0.05));
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			border-radius: 6px;
			color: var(--color--text);
			font-size: 0.875rem;
			cursor: pointer;

			&:focus {
				outline: none;
				border-color: #10b981;
			}
		}
	}

	// ==================== Modal ====================
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 1rem;
		backdrop-filter: blur(2px);
		overflow-y: auto;
	}

	.modal {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
		animation: modalSlideIn 0.2s ease-out;

		&.modal-export {
			max-width: 600px;
		}

		&.modal-delete {
			max-width: 550px;
		}

		.modal-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 1.5rem;
			border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);

			&.modal-header-danger {
				background: linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%);
				border-bottom-color: rgba(239, 68, 68, 0.2);
			}

			.modal-title {
				display: flex;
				align-items: center;
				gap: 0.75rem;
				font-size: 1.25rem;
				font-weight: 600;
				color: var(--color--text);
				margin: 0;

				:global(svg) {
					width: 20px;
					height: 20px;
					color: #10b981;
				}
			}

			.modal-close {
				background: none;
				border: none;
				color: var(--color--text-shade);
				cursor: pointer;
				padding: 0.5rem;
				border-radius: 6px;
				transition: all 0.15s ease;

				&:hover {
					background: rgba(var(--color--text-rgb), 0.08);
					color: var(--color--text);
				}

				:global(svg) {
					width: 18px;
					height: 18px;
				}
			}
		}

		.modal-body {
			padding: 1.5rem;
			color: var(--color--text);

			p {
				margin: 0 0 1rem 0;
				line-height: 1.6;

				&:last-child {
					margin-bottom: 0;
				}
			}
		}

		.modal-footer {
			display: flex;
			justify-content: flex-end;
			gap: 0.75rem;
			padding: 1.5rem;
			border-top: 1px solid rgba(var(--color--text-rgb), 0.08);
		}
	}

	// Delete Modal Specific Styles
	.delete-confirmation {
		.participant-preview {
			display: flex;
			align-items: center;
			gap: 1rem;
			padding: 1rem;
			background: rgba(var(--color--text-rgb), 0.03);
			border: 1px solid rgba(var(--color--text-rgb), 0.08);
			border-radius: 8px;
			margin-bottom: 1.5rem;

			.preview-avatar,
			.preview-avatar-placeholder {
				width: 48px;
				height: 48px;
				border-radius: 50%;
				object-fit: cover;
				flex-shrink: 0;
			}

			.preview-avatar-placeholder {
				background: linear-gradient(135deg, #10b981 0%, #059669 100%);
				color: white;
				display: flex;
				align-items: center;
				justify-content: center;
				font-weight: 700;
				font-size: 1.25rem;
			}

			.preview-details {
				min-width: 0;

				h4 {
					margin: 0 0 0.25rem 0;
					font-size: 1.125rem;
					font-weight: 600;
					color: var(--color--text);
				}

				.preview-meta {
					margin: 0.125rem 0;
					font-size: 0.8125rem;
					color: var(--color--text-shade);
				}
			}
		}

		.delete-warning {
			.warning-list {
				margin-top: 1rem;

				.warning-item {
					display: flex;
					align-items: flex-start;
					gap: 0.5rem;
					margin-bottom: 0.75rem;
					color: #fbbf24;

					:global(svg) {
						width: 16px;
						height: 16px;
						margin-top: 2px;
						flex-shrink: 0;
					}

					span {
						font-size: 0.875rem;
						line-height: 1.4;
					}
				}
			}
		}
	}

	// Bulk Delete Modal Specific Styles
	.bulk-delete-confirmation {
		.selection-summary {
			.summary-count {
				display: flex;
				align-items: center;
				gap: 1rem;
				padding: 1rem;
				background: rgba(var(--color--text-rgb), 0.03);
				border: 1px solid rgba(var(--color--text-rgb), 0.08);
				border-radius: 8px;
				margin-bottom: 1.5rem;

				.count-badge {
					display: flex;
					align-items: center;
					justify-content: center;
					width: 48px;
					height: 48px;
					background: #ef4444;
					color: white;
					border-radius: 50%;
					font-size: 1.25rem;
					font-weight: 700;
				}

				.count-text {
					.count-title {
						display: block;
						font-size: 1.125rem;
						font-weight: 600;
						color: var(--color--text);
					}

					.count-subtitle {
						display: block;
						font-size: 0.875rem;
						color: var(--color--text-shade);
					}
				}
			}
		}

		.selected-items-preview {
			margin-bottom: 1.5rem;

			h4 {
				margin: 0 0 1rem 0;
				font-size: 1rem;
				font-weight: 600;
				color: var(--color--text);
			}

			.preview-list {
				background: rgba(var(--color--text-rgb), 0.03);
				border: 1px solid rgba(var(--color--text-rgb), 0.08);
				border-radius: 8px;
				padding: 1rem;
				max-height: 200px;
				overflow-y: auto;

				.preview-item {
					display: flex;
					align-items: center;
					gap: 0.75rem;
					padding: 0.5rem 0;
					border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);

					&:last-child {
						border-bottom: none;
					}

					.preview-avatar-sm,
					.preview-avatar-placeholder-sm {
						width: 32px;
						height: 32px;
						border-radius: 50%;
						object-fit: cover;
						flex-shrink: 0;
					}

					.preview-avatar-placeholder-sm {
						background: linear-gradient(135deg, #10b981 0%, #059669 100%);
						color: white;
						display: flex;
						align-items: center;
						justify-content: center;
						font-weight: 600;
						font-size: 0.875rem;
					}

					.preview-info {
						min-width: 0;

						.preview-name {
							display: block;
							font-size: 0.875rem;
							font-weight: 500;
							color: var(--color--text);
						}

						.preview-details {
							display: block;
							font-size: 0.75rem;
							color: var(--color--text-shade);
						}
					}
				}

				.preview-more {
					padding: 0.5rem 0;
					text-align: center;
					font-size: 0.875rem;
					color: var(--color--text-shade);
					font-style: italic;
				}
			}
		}

		.bulk-delete-warning {
			.warning-box {
				display: flex;
				gap: 1rem;
				padding: 1rem;
				background: rgba(239, 68, 68, 0.1);
				border: 1px solid rgba(239, 68, 68, 0.3);
				border-radius: 8px;

				.warning-icon {
					flex-shrink: 0;
					margin-top: 2px;

					:global(svg) {
						width: 20px;
						height: 20px;
						color: #fbbf24;
					}
				}

				.warning-content {
					.warning-title {
						margin: 0 0 0.5rem 0;
						font-size: 0.875rem;
						font-weight: 600;
						color: #fbbf24;
					}

					.warning-list {
						margin: 0;
						padding-left: 1rem;

						li {
							font-size: 0.8125rem;
							color: #fbbf24;
							margin-bottom: 0.25rem;
						}
					}
				}
			}
		}
	}

	// Export Modal Specific Styles
	.export-options {
		.export-info {
			margin-bottom: 1.5rem;

			p {
				background: rgba(var(--color--text-rgb), 0.03);
				border: 1px solid rgba(var(--color--text-rgb), 0.08);
				border-radius: 6px;
				padding: 1rem;
				margin: 0;
				font-size: 0.875rem;
			}
		}

		.format-selection {
			margin-bottom: 1.5rem;

			h4 {
				margin: 0 0 1rem 0;
				font-size: 1rem;
				font-weight: 600;
				color: var(--color--text);
			}

			.format-options {
				display: grid;
				gap: 0.75rem;

				.format-option {
					cursor: pointer;

					input[type='radio'] {
						display: none;
					}

					.option-content {
						display: flex;
						align-items: center;
						gap: 1rem;
						padding: 1rem;
						background: rgba(var(--color--text-rgb), 0.03);
						border: 2px solid rgba(var(--color--text-rgb), 0.08);
						border-radius: 8px;
						transition: all 0.15s ease;

						&:hover {
							border-color: #10b981;
						}

						.option-icon {
							font-size: 1.5rem;
						}

						.option-details {
							.option-title {
								display: block;
								font-weight: 600;
								color: var(--color--text);
								margin-bottom: 0.25rem;
							}

							.option-description {
								display: block;
								font-size: 0.8125rem;
								color: var(--color--text-shade);
							}
						}
					}

					input[type='radio']:checked + .option-content {
						border-color: #10b981;
						background: rgba(16, 185, 129, 0.05);
					}
				}
			}
		}

		.export-preview {
			h4 {
				margin: 0 0 1rem 0;
				font-size: 1rem;
				font-weight: 600;
				color: var(--color--text);
			}

			.data-fields {
				background: rgba(var(--color--text-rgb), 0.03);
				border: 1px solid rgba(var(--color--text-rgb), 0.08);
				border-radius: 8px;
				padding: 1rem;

				.field-item {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					margin-bottom: 0.75rem;
					font-size: 0.875rem;
					color: var(--color--text);

					&:last-child {
						margin-bottom: 0;
					}

					:global(svg) {
						width: 16px;
						height: 16px;
						color: #10b981;
						flex-shrink: 0;
					}
				}
			}
		}
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	// ==================== Responsive Design ====================
	.responsive-table-wrapper {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		border-radius: 12px;
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.responsive-table {
		min-width: 1000px; // Ensure table doesn't get too compressed
		width: 100%;
	}

	@media (max-width: 1200px) {
		.tabla-participantes-page {
			padding: 1.5rem;
		}

		.responsive-toolbar {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
			padding: 1rem;
		}

		.responsive-toolbar-left {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 1rem;
			width: 100%;
		}

		.search-box {
			width: 100%;
			min-width: 250px;
			max-width: none;
		}

		.filter-select {
			width: 100%;
			min-width: 200px;
		}

		.toolbar-right {
			flex-direction: row;
			justify-content: center;
			flex-wrap: wrap;
			gap: 0.75rem;
		}

		.records-counter {
			align-items: center;
			margin-right: 0;
			order: -1;
			width: 100%;
			text-align: center;
			margin-bottom: 0.5rem;
		}
	}

	@media (max-width: 768px) {
		.tabla-participantes-page {
			padding: 1rem;
		}

		.responsive-toolbar-left {
			grid-template-columns: 1fr;
		}

		.toolbar-right {
			flex-direction: column;
			align-items: stretch;
		}

		.records-info-section {
			padding: 0.75rem 1rem;
		}

		.records-counter {
			flex-direction: column;
			gap: 0.5rem;
			text-align: center;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
			justify-content: center;
		}

		.responsive-table {
			min-width: 900px;
		}

		// Hide less important columns on mobile
		.participants-table {
			.col-genero,
			.col-carrera,
			.col-facultad {
				display: none;
			}
		}
	}

	@media (max-width: 480px) {
		.responsive-table {
			min-width: 700px;
		}

		.participants-table {
			.col-acreditado {
				display: none;
			}

			.col-participante {
				min-width: 200px;
			}
		}

		.search-box {
			min-width: 200px;
		}

		.filter-select {
			min-width: 150px;
		}

		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;

			.header-content h1 {
				font-size: 2rem;
			}
		}

		.toolbar {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;

			.toolbar-left,
			.toolbar-right {
				flex-direction: column;
				width: 100%;
				gap: 0.75rem;
			}
		}

		.search-box {
			width: 100%;
			max-width: none;
		}

		.filter-select {
			width: 100%;
			max-width: none;
		}

		.table-container {
			overflow-x: auto;
		}

		.participants-table {
			min-width: 900px;
		}

		.pagination {
			flex-direction: column;
			gap: 1rem;
			text-align: center;

			.pagination-controls {
				justify-content: center;
			}
		}

		// ==================== New Badge Styles ====================
		.badge-simple {
			display: inline-flex;
			align-items: center;
			padding: 0.375rem 0.75rem;
			border-radius: 6px;
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;

			&.badge-yes {
				background: rgba(72, 187, 120, 0.2);
				color: #48bb78;
			}

			&.badge-no {
				background: rgba(237, 137, 54, 0.2);
				color: #ed8936;
			}
		}

		.participant-email {
			margin-top: 0.25rem;
			font-size: 0.75rem;

			.email-link {
				color: #6e29e7;
				text-decoration: none;

				&:hover {
					text-decoration: underline;
				}
			}

			.text-muted {
				color: var(--color--text-shade);
				font-style: italic;
			}
		}

		// ==================== Toast Component ====================
		.toast {
			position: fixed;
			bottom: 2rem;
			right: 2rem;
			display: flex;
			align-items: center;
			gap: 1rem;
			padding: 1rem 1.5rem;
			border-radius: 8px;
			box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
			z-index: 10000;
			animation: slideInToast 0.3s ease-out;
			max-width: 400px;
			border: 1px solid;

			&.toast-success {
				background: rgba(16, 185, 129, 0.1);
				border-color: #10b981;
				color: #10b981;
			}

			&.toast-error {
				background: rgba(239, 68, 68, 0.1);
				border-color: #ef4444;
				color: #ef4444;
			}

			&.toast-warning {
				background: rgba(245, 158, 11, 0.1);
				border-color: #f59e0b;
				color: #f59e0b;
			}

			&.toast-info {
				background: rgba(59, 130, 246, 0.1);
				border-color: #3b82f6;
				color: #3b82f6;
			}

			.toast-content {
				flex: 1;

				.toast-message {
					font-size: 0.875rem;
					line-height: 1.4;
				}
			}

			.toast-close {
				background: none;
				border: none;
				color: inherit;
				cursor: pointer;
				padding: 4px;
				display: flex;
				align-items: center;
				transition: opacity 0.15s ease;
				opacity: 0.7;

				&:hover {
					opacity: 1;
				}

				:global(svg) {
					width: 16px;
					height: 16px;
				}
			}
		}

		@keyframes slideInToast {
			from {
				transform: translateX(100%);
				opacity: 0;
			}
			to {
				transform: translateX(0);
				opacity: 1;
			}
		}
	}
</style>
