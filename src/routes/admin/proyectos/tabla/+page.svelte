<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import type {
		ProyectoResponseDTO,
		ListProyectosResponseDTO,
		ProyectoFiltersDTO
	} from '$lib/models/admin';
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
	let proyectos: ProyectoResponseDTO[] = [];
	let loading = false;
	let error: string | null = null;
	let isFetching = false; // Prevenir llamadas duplicadas

	// Pagination
	let currentPage = 1;
	let itemsPerPage = 15;
	let totalItems = 0;
	let totalPages = 0;

	// Filters
	let searchQuery = '';
	let filterEstado = '';
	let filterTipo = '';
	let showFilters = false;
	let advancedFilters: ProyectoFiltersDTO = {};

	// Filter state management
	let pendingFilters: ProyectoFiltersDTO = {};
	let appliedFiltersCount = 0;
	let hasActiveFilters = false;
	let filterFeedback = '';
	let showFeedback = false;
	let applyingFilters = false;

	// Sorting
	let sortColumn: string = 'fecha_inicio_planeada';
	let sortDirection: 'asc' | 'desc' = 'desc';

	// Debounce para búsqueda
	let searchDebounceTimer: ReturnType<typeof setTimeout>;

	// Configuración de caché
	const CACHE_VERSION = '1.0';
	const CACHE_DURATION = {
		catalogs: 24 * 60 * 60 * 1000, // 24 horas para catálogos
		projects: 5 * 60 * 1000 // 5 minutos para proyectos
	};

	// Catalog data
	let estados: Array<{ id: number; nombre: string }> = [];
	let tipos: Array<{ id: number; nombre: string }> = [];
	let areas: Array<{ id: number; nombre: string }> = [];
	let lineas: Array<{ id: number; nombre: string }> = [];
	let instituciones: Array<{ id: number; nombre: string }> = [];

	// Modals
	let showDeleteModal = false;
	let proyectoToDelete: ProyectoResponseDTO | null = null;

	// Selection
	let selectedProjects: Set<number> = new Set();
	let selectAll = false;

	// Export modal
	let showExportModal = false;
	let exportFormat: 'csv' | 'excel' = 'csv';
	let exportingData = false;

	/**
	 * Sistema de caché para localStorage
	 */
	interface CacheData<T> {
		data: T;
		timestamp: number;
		version: string;
	}

	/**
	 * Guardar en caché
	 */
	function setCache<T>(key: string, data: T, duration?: number): void {
		if (!browser) return;
		try {
			const cacheData: CacheData<T> = {
				data,
				timestamp: Date.now(),
				version: CACHE_VERSION
			};
			localStorage.setItem(key, JSON.stringify(cacheData));
		} catch (error) {
			console.warn('Error guardando en caché:', error);
		}
	}

	/**
	 * Obtener desde caché
	 */
	function getCache<T>(key: string, maxAge: number): T | null {
		if (!browser) return null;
		try {
			const cached = localStorage.getItem(key);
			if (!cached) return null;

			const cacheData: CacheData<T> = JSON.parse(cached);

			// Verificar versión
			if (cacheData.version !== CACHE_VERSION) {
				localStorage.removeItem(key);
				return null;
			}

			// Verificar expiración
			const age = Date.now() - cacheData.timestamp;
			if (age > maxAge) {
				localStorage.removeItem(key);
				return null;
			}

			return cacheData.data;
		} catch (error) {
			console.warn('Error leyendo caché:', error);
			return null;
		}
	}

	/**
	 * Invalidar caché de proyectos
	 */
	function invalidateProjectsCache(): void {
		if (!browser) return;
		try {
			const keys = Object.keys(localStorage);
			keys.forEach((key) => {
				if (key.startsWith('projects_cache_')) {
					localStorage.removeItem(key);
				}
			});
		} catch (error) {
			console.warn('Error invalidando caché:', error);
		}
	}

	/**
	 * Guardar filtros aplicados
	 */
	function saveFiltersToCache(): void {
		if (!browser) return;
		try {
			const filtersState = {
				searchQuery,
				filterEstado,
				filterTipo,
				advancedFilters,
				currentPage,
				itemsPerPage,
				sortColumn,
				sortDirection
			};
			localStorage.setItem('proyectos_filters_state', JSON.stringify(filtersState));
		} catch (error) {
			console.warn('Error guardando filtros:', error);
		}
	}

	/**
	 * Restaurar filtros desde caché
	 */
	function restoreFiltersFromCache(): void {
		if (!browser) return;
		try {
			const cached = localStorage.getItem('proyectos_filters_state');
			if (cached) {
				const filtersState = JSON.parse(cached);
				searchQuery = filtersState.searchQuery || '';
				filterEstado = filtersState.filterEstado || '';
				filterTipo = filtersState.filterTipo || '';
				advancedFilters = filtersState.advancedFilters || {};
				currentPage = filtersState.currentPage || 1;
				itemsPerPage = filtersState.itemsPerPage || 15;
				sortColumn = filtersState.sortColumn || 'fecha_inicio_planeada';
				sortDirection = filtersState.sortDirection || 'desc';
			}
		} catch (error) {
			console.warn('Error restaurando filtros:', error);
		}
	}

	/**
	 * Construir parámetros de consulta de manera optimizada
	 */
	function buildQueryParams(): URLSearchParams {
		const params = new URLSearchParams({
			page: currentPage.toString(),
			limit: itemsPerPage.toString()
		});

		// Mapeo de filtros para evitar repetición
		const filterMap: Record<string, any> = {
			titulo: searchQuery,
			estado_id: filterEstado,
			tipo_id: filterTipo,
			codigo: advancedFilters.codigo,
			fecha_inicio_desde: advancedFilters.fecha_inicio_desde,
			fecha_inicio_hasta: advancedFilters.fecha_inicio_hasta,
			fecha_fin_desde: advancedFilters.fecha_fin_desde,
			fecha_fin_hasta: advancedFilters.fecha_fin_hasta,
			presupuesto_min: advancedFilters.presupuesto_min,
			presupuesto_max: advancedFilters.presupuesto_max,
			avance_min: advancedFilters.avance_min,
			avance_max: advancedFilters.avance_max,
			requiere_aval: advancedFilters.requiere_aval,
			acreditado_senescyt: advancedFilters.acreditado_senescyt,
			area_id: advancedFilters.area_id,
			linea_id: advancedFilters.linea_id,
			institucion_id: advancedFilters.institucion_id
		};

		// Agregar solo filtros con valores
		Object.entries(filterMap).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				params.append(key, value.toString());
			}
		});

		return params;
	}

	/**
	 * Fetch proyectos from API (optimizado con caché)
	 */
	async function fetchProyectos() {
		if (!browser || isFetching) return;

		isFetching = true;
		loading = true;
		error = null;

		try {
			// Construir params de manera optimizada
			const params = buildQueryParams();
			const cacheKey = `projects_cache_${params.toString()}`;

			// Intentar obtener desde caché
			const cachedData = getCache<ListProyectosResponseDTO>(cacheKey, CACHE_DURATION.projects);

			if (cachedData) {
				console.log('📦 Cargando proyectos desde caché');
				proyectos = cachedData.data || [];
				totalItems = cachedData.pagination?.total || 0;
				totalPages = cachedData.pagination?.total_pages || 0;
				appliedFiltersCount = countActiveFilters();
				hasActiveFilters = appliedFiltersCount > 0;
				syncSelectAllState();
				loading = false;
				isFetching = false;
				return;
			}

			// Si no hay caché, hacer petición al servidor
			console.log('🌐 Cargando proyectos desde servidor');
			const response = await fetch(`/api/admin/projects?${params.toString()}`);

			if (!response.ok) {
				throw new Error('Error al cargar proyectos');
			}

			const result = await response.json();

			if (result.success) {
				proyectos = result.data.data || [];
				totalItems = result.data.pagination?.total || 0;
				totalPages = result.data.pagination?.total_pages || 0;

				// Guardar en caché
				setCache(cacheKey, result.data, CACHE_DURATION.projects);

				// Update filter count
				appliedFiltersCount = countActiveFilters();
				hasActiveFilters = appliedFiltersCount > 0;

				// Sincronizar selectAll con la realidad
				syncSelectAllState();

				// Guardar estado de filtros
				saveFiltersToCache();
			} else {
				throw new Error(result.message || 'Error desconocido');
			}
		} catch (err) {
			console.error('Error fetching proyectos:', err);
			error = err instanceof Error ? err.message : 'Error al cargar proyectos';
			proyectos = [];
		} finally {
			loading = false;
			isFetching = false;
		}
	}

	/**
	 * Fetch catalogs (optimizado con caché)
	 */
	async function fetchCatalogs() {
		if (!browser) return;

		try {
			// Intentar cargar desde caché
			const cachedEstados = getCache<Array<{ id: number; nombre: string }>>(
				'catalogs_estados',
				CACHE_DURATION.catalogs
			);
			const cachedTipos = getCache<Array<{ id: number; nombre: string }>>(
				'catalogs_tipos',
				CACHE_DURATION.catalogs
			);
			const cachedAreas = getCache<Array<{ id: number; nombre: string }>>(
				'catalogs_areas',
				CACHE_DURATION.catalogs
			);
			const cachedLineas = getCache<Array<{ id: number; nombre: string }>>(
				'catalogs_lineas',
				CACHE_DURATION.catalogs
			);
			const cachedInstituciones = getCache<Array<{ id: number; nombre: string }>>(
				'catalogs_instituciones',
				CACHE_DURATION.catalogs
			);

			// Si todos los catálogos están en caché, usarlos
			if (cachedEstados && cachedTipos && cachedAreas && cachedLineas && cachedInstituciones) {
				console.log('📦 Cargando catálogos desde caché');
				estados = cachedEstados;
				tipos = cachedTipos;
				areas = cachedAreas;
				lineas = cachedLineas;
				instituciones = cachedInstituciones;
				return;
			}

			// Si no están en caché, cargar desde servidor
			console.log('🌐 Cargando catálogos desde servidor');
			const [estadosRes, tiposRes, areasRes, lineasRes, institucionesRes] = await Promise.all([
				fetch('/api/admin/catalogs/estados'),
				fetch('/api/admin/catalogs/tipos'),
				fetch('/api/admin/catalogs/areas'),
				fetch('/api/admin/catalogs/lineas'),
				fetch('/api/admin/catalogs/instituciones')
			]);

			if (estadosRes.ok) {
				const data = await estadosRes.json();
				estados = data.success ? data.data : [];
				setCache('catalogs_estados', estados, CACHE_DURATION.catalogs);
			}

			if (tiposRes.ok) {
				const data = await tiposRes.json();
				tipos = data.success ? data.data : [];
				setCache('catalogs_tipos', tipos, CACHE_DURATION.catalogs);
			}

			if (areasRes.ok) {
				const data = await areasRes.json();
				areas = data.success ? data.data : [];
				setCache('catalogs_areas', areas, CACHE_DURATION.catalogs);
			}

			if (lineasRes.ok) {
				const data = await lineasRes.json();
				lineas = data.success ? data.data : [];
				setCache('catalogs_lineas', lineas, CACHE_DURATION.catalogs);
			}

			if (institucionesRes.ok) {
				const data = await institucionesRes.json();
				instituciones = data.success ? data.data : [];
				setCache('catalogs_instituciones', instituciones, CACHE_DURATION.catalogs);
			}
		} catch (err) {
			console.error('Error fetching catalogs:', err);
		}
	}

	/**
	 * Delete project (con invalidación de caché)
	 */
	async function deleteProyecto(id: number) {
		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/admin/projects/${id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				// Invalidar caché de proyectos
				invalidateProjectsCache();

				await fetchProyectos();
				showDeleteModal = false;
				proyectoToDelete = null;
			} else {
				throw new Error(result.message || 'Error al eliminar proyecto');
			}
		} catch (err) {
			console.error('Error deleting proyecto:', err);
			error = err instanceof Error ? err.message : 'Error al eliminar proyecto';
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
		if (selectedProjects.size === 0) return;
		showBulkDeleteModal = true;
	}

	/**
	 * Bulk delete (mejorado con mejor manejo de errores e invalidación de caché)
	 */
	async function bulkDelete() {
		if (selectedProjects.size === 0) return;

		loading = true;
		error = null;

		try {
			const idsToDelete = Array.from(selectedProjects);
			const deletePromises = idsToDelete.map((id) =>
				fetch(`/api/admin/projects/${id}`, { method: 'DELETE' }).then((res) => {
					if (!res.ok) throw new Error(`Error eliminando proyecto ${id}`);
					return res.json();
				})
			);

			const results = await Promise.allSettled(deletePromises);

			const failed = results.filter((r) => r.status === 'rejected').length;
			const success = results.length - failed;

			if (failed > 0) {
				showToast(`⚠️ Se eliminaron ${success} proyectos. ${failed} fallaron.`, 'warning');
			} else {
				showToast('✅ Proyectos eliminados correctamente', 'success');
			}

			// Invalidar caché de proyectos
			invalidateProjectsCache();

			selectedProjects.clear();
			selectedProjects = selectedProjects;
			selectAll = false;
			showBulkDeleteModal = false;

			await fetchProyectos();
		} catch (err) {
			console.error('Error in bulk delete:', err);
			error = 'Error al eliminar proyectos';
			showToast('❌ Error al eliminar proyectos', 'error');
		} finally {
			loading = false;
		}
	}

	/**
	 * Handle export button click (mejorado)
	 */
	function handleExportClick() {
		if (selectedProjects.size === 0) {
			showToast('⚠️ Debes seleccionar al menos un proyecto para exportar.', 'warning');
			return;
		}
		showExportModal = true;
	}

	/**
	 * Export selected projects (mejorado con validación)
	 */
	async function exportProjects() {
		if (selectedProjects.size === 0) {
			showToast('⚠️ No hay proyectos seleccionados para exportar', 'warning');
			return;
		}

		exportingData = true;

		try {
			// Get selected projects with all their relations
			const selectedData = proyectos.filter((p) => selectedProjects.has(p.id));

			if (selectedData.length === 0) {
				throw new Error('No se encontraron datos para exportar');
			}

			if (exportFormat === 'csv') {
				exportToCSV(selectedData);
			} else {
				exportToExcel(selectedData);
			}

			showToast(
				`✅ ${selectedData.length} proyecto${selectedData.length !== 1 ? 's' : ''} exportado${
					selectedData.length !== 1 ? 's' : ''
				} correctamente`,
				'success'
			);

			showExportModal = false;
		} catch (err) {
			console.error('Error exporting:', err);
			showToast('❌ Error al exportar los proyectos', 'error');
		} finally {
			exportingData = false;
		}
	}

	/**
	 * Export ALL projects from database
	 */
	async function exportAllProjects() {
		exportingData = true;

		try {
			showToast('⏳ Obteniendo todos los proyectos...', 'info');

			// Fetch all projects using the 'all=true' parameter
			const response = await fetch('/api/admin/projects?all=true');

			if (!response.ok) {
				throw new Error('Error al obtener todos los proyectos');
			}

			const result = await response.json();

			if (!result.success || !result.data.data) {
				throw new Error('No se pudieron obtener los proyectos');
			}

			const allProjects = result.data.data;

			showToast(`📊 Exportando ${allProjects.length} proyectos...`, 'info');

			if (exportFormat === 'csv') {
				exportToCSV(allProjects);
			} else {
				exportToExcel(allProjects);
			}

			showToast(
				`✅ ${allProjects.length} proyecto${allProjects.length !== 1 ? 's' : ''} exportado${
					allProjects.length !== 1 ? 's' : ''
				} correctamente`,
				'success'
			);

			showExportModal = false;
		} catch (err) {
			console.error('Error exporting all:', err);
			showToast('❌ Error al exportar todos los proyectos', 'error');
		} finally {
			exportingData = false;
		}
	}

	/**
	 * Export to CSV with complete data
	 */
	function exportToCSV(data: ProyectoResponseDTO[]) {
		const headers = [
			'Código',
			'Título',
			'Estado',
			'Tipos',
			'Fecha Inicio',
			'Fecha Fin',
			'Avance %',
			'Presupuesto',
			'Áreas',
			'Líneas',
			'Instituciones',
			'Requiere Aval',
			'Para SIIES'
		];

		const rows = data.map((p) => [
			p.codigo,
			`"${p.titulo.replace(/"/g, '""')}"`,
			p.estado.nombre,
			p.tipos.map((t) => t.nombre).join('; ') || 'N/A',
			p.fecha_inicio_planeada,
			p.fecha_fin_planeada,
			p.porcentaje_avance,
			p.monto_presupuesto_total,
			p.areas_conocimiento.map((a) => a.nombre).join('; ') || 'N/A',
			p.lineas_investigacion.map((l) => l.nombre).join('; ') || 'N/A',
			p.instituciones.map((i) => i.nombre).join('; ') || 'N/A',
			p.requiere_aval ? 'Sí' : 'No',
			p.para_siies ? 'Sí' : 'No'
		]);

		const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `proyectos_${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	/**
	 * Export to Excel format
	 */
	function exportToExcel(data: ProyectoResponseDTO[]) {
		// Create Excel-compatible CSV with UTF-8 BOM
		const headers = [
			'Código',
			'Título',
			'Estado',
			'Tipos',
			'Fecha Inicio',
			'Fecha Fin',
			'Avance %',
			'Presupuesto',
			'Áreas',
			'Líneas',
			'Instituciones',
			'Requiere Aval',
			'Para SIIES'
		];

		const rows = data.map((p) => [
			p.codigo,
			`"${p.titulo.replace(/"/g, '""')}"`,
			p.estado.nombre,
			p.tipos.map((t) => t.nombre).join('; ') || 'N/A',
			p.fecha_inicio_planeada,
			p.fecha_fin_planeada,
			p.porcentaje_avance,
			p.monto_presupuesto_total,
			p.areas_conocimiento.map((a) => a.nombre).join('; ') || 'N/A',
			p.lineas_investigacion.map((l) => l.nombre).join('; ') || 'N/A',
			p.instituciones.map((i) => i.nombre).join('; ') || 'N/A',
			p.requiere_aval ? 'Sí' : 'No',
			p.para_siies ? 'Sí' : 'No'
		]);

		const csv = [headers, ...rows].map((row) => row.join('\t')).join('\n');

		// Add UTF-8 BOM for Excel compatibility
		const BOM = '\uFEFF';
		const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `proyectos_${new Date().toISOString().split('T')[0]}.xls`;
		a.click();
		URL.revokeObjectURL(url);
	}

	/**
	 * Format currency
	 */
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('es-CR', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	/**
	 * Format date
	 */
	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('es-CR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(date);
	}

	/**
	 * Get estado badge class
	 */
	function getEstadoBadgeClass(estadoNombre: string): string {
		const nombre = estadoNombre.toLowerCase();
		if (nombre.includes('activo') || nombre.includes('ejecución')) return 'badge-success';
		if (nombre.includes('finalizado') || nombre.includes('completado')) return 'badge-info';
		if (nombre.includes('suspendido') || nombre.includes('cancelado')) return 'badge-danger';
		if (nombre.includes('planeación') || nombre.includes('propuesta')) return 'badge-warning';
		return 'badge-default';
	}

	/**
	 * Sincronizar estado de selectAll con la realidad
	 */
	function syncSelectAllState() {
		if (proyectos.length === 0) {
			selectAll = false;
			return;
		}
		selectAll = proyectos.every((p) => selectedProjects.has(p.id));
	}

	/**
	 * Handle select all (optimizado)
	 */
	function handleSelectAll() {
		if (selectAll) {
			// Agregar solo proyectos que no están seleccionados
			proyectos.forEach((p) => selectedProjects.add(p.id));
		} else {
			// Remover solo proyectos de la página actual
			proyectos.forEach((p) => selectedProjects.delete(p.id));
		}
		selectedProjects = selectedProjects;
	}

	/**
	 * Handle select project (optimizado)
	 */
	function handleSelectProject(id: number) {
		if (selectedProjects.has(id)) {
			selectedProjects.delete(id);
			selectAll = false;
		} else {
			selectedProjects.add(id);
			// Solo actualizar selectAll si todos están seleccionados
			syncSelectAllState();
		}
		selectedProjects = selectedProjects;
	}

	/**
	 * Reset filters (optimizado)
	 */
	function resetFilters() {
		// Limpiar todos los filtros
		searchQuery = '';
		filterEstado = '';
		filterTipo = '';
		advancedFilters = {};
		pendingFilters = {};
		currentPage = 1;
		appliedFiltersCount = 0;
		hasActiveFilters = false;

		// Limpiar selecciones
		selectedProjects.clear();
		selectedProjects = selectedProjects;
		selectAll = false;

		// Limpiar filtros guardados en caché
		if (browser) {
			localStorage.removeItem('proyectos_filters_state');
		}

		showToast('✅ Filtros limpiados correctamente', 'success');
		fetchProyectos();
	}

	/**
	 * Limpiar todo el caché (catálogos y proyectos)
	 */
	function clearAllCache() {
		if (!browser) return;
		try {
			// Limpiar caché de proyectos
			invalidateProjectsCache();

			// Limpiar caché de catálogos
			localStorage.removeItem('catalogs_estados');
			localStorage.removeItem('catalogs_tipos');
			localStorage.removeItem('catalogs_areas');
			localStorage.removeItem('catalogs_lineas');
			localStorage.removeItem('catalogs_instituciones');

			// Limpiar filtros guardados
			localStorage.removeItem('proyectos_filters_state');

			showToast('✅ Caché limpiado correctamente. Recargando datos...', 'success');

			// Recargar todo desde el servidor
			fetchCatalogs();
			fetchProyectos();
		} catch (error) {
			console.error('Error limpiando caché:', error);
			showToast('❌ Error al limpiar caché', 'error');
		}
	}

	/**
	 * Apply filters (optimizado y mejorado)
	 */
	async function applyFilters() {
		if (applyingFilters) return; // Prevenir doble clic

		applyingFilters = true;

		try {
			// Copy pending filters to applied
			advancedFilters = { ...pendingFilters };

			// Resetear página al aplicar filtros
			currentPage = 1;

			// Close filter panel
			showFilters = false;

			await fetchProyectos();

			// Show feedback based on results
			if (proyectos.length === 0) {
				showToast('⚠️ No se encontraron proyectos con los filtros aplicados', 'warning');
				// Limpiar selecciones si no hay resultados
				selectedProjects.clear();
				selectedProjects = selectedProjects;
				selectAll = false;
			} else {
				const count = countActiveFilters();
				if (count > 0) {
					showToast(
						`✅ Se encontraron ${proyectos.length} proyecto${proyectos.length !== 1 ? 's' : ''}`,
						'success'
					);
				}
			}
		} catch (err) {
			console.error('Error applying filters:', err);
			showToast('❌ Error al aplicar filtros', 'error');
		} finally {
			applyingFilters = false;
		}
	}

	/**
	 * Búsqueda con debounce
	 */
	function handleSearchInput() {
		clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(() => {
			currentPage = 1;
			fetchProyectos();
		}, 500); // 500ms de delay
	}

	/**
	 * Count active filters
	 */
	function countActiveFilters(): number {
		let count = 0;

		if (searchQuery) count++;
		if (filterEstado) count++;
		if (filterTipo) count++;
		if (advancedFilters.codigo) count++;
		if (advancedFilters.fecha_inicio_desde) count++;
		if (advancedFilters.fecha_inicio_hasta) count++;
		if (advancedFilters.fecha_fin_desde) count++;
		if (advancedFilters.fecha_fin_hasta) count++;
		if (advancedFilters.presupuesto_min) count++;
		if (advancedFilters.presupuesto_max) count++;
		if (advancedFilters.avance_min !== undefined) count++;
		if (advancedFilters.avance_max !== undefined) count++;
		if (advancedFilters.requiere_aval !== undefined) count++;
		if (advancedFilters.acreditado_senescyt !== undefined) count++;
		if (advancedFilters.area_id) count++;
		if (advancedFilters.linea_id) count++;
		if (advancedFilters.institucion_id) count++;

		return count;
	}

	/**
	 * Show toast notification
	 */
	function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
		filterFeedback = message;
		showFeedback = true;

		setTimeout(() => {
			showFeedback = false;
		}, 4000);
	}

	/**
	 * Handle column sort (optimizado)
	 */
	function handleSort(column: string) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
		sortProyectos();
	}

	/**
	 * Sort proyectos locally (optimizado con función de comparación)
	 */
	function sortProyectos() {
		if (!proyectos || proyectos.length === 0) return;

		const compareFunctions: Record<
			string,
			(a: ProyectoResponseDTO, b: ProyectoResponseDTO) => number
		> = {
			codigo: (a, b) => a.codigo.localeCompare(b.codigo),
			titulo: (a, b) => a.titulo.localeCompare(b.titulo),
			estado: (a, b) => a.estado.nombre.localeCompare(b.estado.nombre),
			fecha_inicio: (a, b) =>
				new Date(a.fecha_inicio_planeada).getTime() - new Date(b.fecha_inicio_planeada).getTime(),
			avance: (a, b) => a.porcentaje_avance - b.porcentaje_avance,
			presupuesto: (a, b) => a.monto_presupuesto_total - b.monto_presupuesto_total
		};

		const compareFunc = compareFunctions[sortColumn];
		if (!compareFunc) return;

		proyectos = [...proyectos].sort((a, b) => {
			const result = compareFunc(a, b);
			return sortDirection === 'asc' ? result : -result;
		});
	}

	/**
	 * Change page (optimizado)
	 */
	function changePage(newPage: number) {
		if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
		currentPage = newPage;
		fetchProyectos();
	}

	/**
	 * Handle items per page change (optimizado)
	 */
	function handleItemsPerPageChange() {
		currentPage = 1; // Resetear a primera página
		fetchProyectos();
	}

	// Lifecycle
	onMount(() => {
		// Restaurar filtros guardados
		restoreFiltersFromCache();

		// Cargar catálogos y proyectos
		fetchCatalogs();
		fetchProyectos();
	});
</script>

<svelte:head>
	<title>Tabla de Proyectos - Admin SIGPI</title>
</svelte:head>

<div class="tabla-proyectos-page">
	<!-- Header -->
	<div class="page-header">
		<div class="header-content">
			<h1>Gestión de Proyectos</h1>
			<p class="subtitle">Administra y visualiza todos los proyectos de investigación</p>
		</div>
		<div class="header-actions">
			<a href="/admin/proyectos/nuevo" class="btn-primary">
				<span class="icon">{icons.plus}</span>
				Nuevo Proyecto
			</a>
		</div>
	</div>

	<!-- Toolbar -->
	<div class="toolbar">
		<div class="toolbar-left">
			<!-- Search -->
			<div class="search-box">
				<span class="search-icon">{icons.search}</span>
				<input
					type="text"
					placeholder="Buscar por título o código..."
					bind:value={searchQuery}
					on:input={handleSearchInput}
					on:keydown={(e) => e.key === 'Enter' && applyFilters()}
				/>
				{#if searchQuery}
					<button class="clear-btn" on:click={() => (searchQuery = '')}>
						<span>{icons.close}</span>
					</button>
				{/if}
			</div>

			<!-- Quick filters -->
			<select bind:value={filterEstado} class="filter-select">
				<option value="">Todos los estados</option>
				{#each estados as estado}
					<option value={estado.id}>{estado.nombre}</option>
				{/each}
			</select>

			<select bind:value={filterTipo} class="filter-select">
				<option value="">Todos los tipos</option>
				{#each tipos as tipo}
					<option value={tipo.id}>{tipo.nombre}</option>
				{/each}
			</select>

			<button
				class="btn-icon-text"
				class:active={showFilters}
				on:click={() => (showFilters = !showFilters)}
			>
				<span>{icons.filter}</span>
				Más filtros
				{#if hasActiveFilters}
					<span class="filter-badge">{appliedFiltersCount}</span>
				{/if}
			</button>

			<button class="btn-primary" on:click={applyFilters} disabled={applyingFilters}>
				{#if applyingFilters}
					<span class="spinner-sm" />
				{:else}
					<span>{icons.check}</span>
				{/if}
				Aplicar
			</button>

			<button
				class="btn-icon-text btn-reset"
				class:active={hasActiveFilters}
				on:click={resetFilters}
				title="Limpiar todos los filtros"
				disabled={!hasActiveFilters}
			>
				<span>{icons.close}</span>
				Limpiar
			</button>

			<button
				class="btn-icon-text"
				on:click={clearAllCache}
				title="Limpiar caché y recargar datos del servidor"
			>
				<span>🔄</span>
				Actualizar
			</button>
		</div>

		<div class="toolbar-right">
			{#if selectedProjects.size > 0}
				<button class="btn-danger-outline" on:click={openBulkDeleteModal}>
					{@html icons.delete}
					Eliminar ({selectedProjects.size})
				</button>
			{/if}

			<button class="btn-primary" on:click={handleExportClick}>
				<span>{icons.download}</span>
				Exportar Selección
				{#if selectedProjects.size > 0}
					<span class="export-badge">({selectedProjects.size})</span>
				{/if}
			</button>

			<button
				class="btn-primary"
				on:click={() => (showExportModal = true)}
				disabled={exportingData}
			>
				<span>{icons.download}</span>
				Exportar Todo
				<span class="export-badge">({totalItems})</span>
			</button>
		</div>
	</div>

	<!-- Advanced filters panel -->
	{#if showFilters}
		<div class="filters-panel">
			<div class="filters-header">
				<h3 class="filters-title">
					<span class="title-icon">{icons.filter}</span>
					Filtros Avanzados
				</h3>
				<button class="filters-close" on:click={() => (showFilters = false)}>
					<span>{icons.close}</span>
				</button>
			</div>

			<!-- General Filters -->
			<div class="filter-section">
				<h4 class="section-title">Información General</h4>
				<div class="filters-grid-3">
					<div class="filter-group">
						<label for="filter-codigo"> Código del Proyecto </label>
						<input
							id="filter-codigo"
							type="text"
							placeholder="Ej: PROJ-2024-001"
							bind:value={pendingFilters.codigo}
						/>
					</div>

					<div class="filter-group">
						<label for="filter-requiere-aval"> Requiere Aval </label>
						<select id="filter-requiere-aval" bind:value={pendingFilters.requiere_aval}>
							<option value={undefined}>Todos</option>
							<option value={true}>Sí</option>
							<option value={false}>No</option>
						</select>
					</div>

					<div class="filter-group">
						<label for="filter-acreditado"> Acreditado SENESCYT </label>
						<select id="filter-acreditado" bind:value={pendingFilters.acreditado_senescyt}>
							<option value={undefined}>Todos</option>
							<option value={true}>Acreditado</option>
							<option value={false}>No acreditado</option>
						</select>
					</div>
				</div>
			</div>
			<!-- Classification Filters -->
			<div class="filter-section">
				<h4 class="section-title">Clasificación</h4>
				<div class="filters-grid-3">
					<div class="filter-group">
						<label for="filter-area"> Área de Conocimiento </label>
						<select id="filter-area" bind:value={pendingFilters.area_id}>
							<option value="">Todas las áreas</option>
							{#each areas as area}
								<option value={area.id}>{area.nombre}</option>
							{/each}
						</select>
					</div>

					<div class="filter-group">
						<label for="filter-linea"> Línea de Investigación </label>
						<select id="filter-linea" bind:value={pendingFilters.linea_id}>
							<option value="">Todas las líneas</option>
							{#each lineas as linea}
								<option value={linea.id}>{linea.nombre}</option>
							{/each}
						</select>
					</div>

					<div class="filter-group">
						<label for="filter-institucion"> Institución </label>
						<select id="filter-institucion" bind:value={pendingFilters.institucion_id}>
							<option value="">Todas las instituciones</option>
							{#each instituciones as institucion}
								<option value={institucion.id}>{institucion.nombre}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<!-- Date Range Filters -->
			<div class="filter-section">
				<h4 class="section-title">Rangos de Fechas</h4>
				<div class="filters-grid-2">
					<div class="date-range-group">
						<div class="range-label">Fecha de Inicio</div>
						<div class="date-inputs">
							<div class="filter-group">
								<label for="filter-fecha-inicio-desde">Desde</label>
								<input
									id="filter-fecha-inicio-desde"
									type="date"
									bind:value={pendingFilters.fecha_inicio_desde}
								/>
							</div>
							<div class="filter-group">
								<label for="filter-fecha-inicio-hasta">Hasta</label>
								<input
									id="filter-fecha-inicio-hasta"
									type="date"
									bind:value={pendingFilters.fecha_inicio_hasta}
								/>
							</div>
						</div>
					</div>

					<div class="date-range-group">
						<div class="range-label">Fecha de Finalización</div>
						<div class="date-inputs">
							<div class="filter-group">
								<label for="filter-fecha-fin-desde">Desde</label>
								<input
									id="filter-fecha-fin-desde"
									type="date"
									bind:value={pendingFilters.fecha_fin_desde}
								/>
							</div>
							<div class="filter-group">
								<label for="filter-fecha-fin-hasta">Hasta</label>
								<input
									id="filter-fecha-fin-hasta"
									type="date"
									bind:value={pendingFilters.fecha_fin_hasta}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Numeric Range Filters -->
			<div class="filter-section">
				<h4 class="section-title">Rangos Numéricos</h4>
				<div class="filters-grid-2">
					<div class="range-group">
						<div class="range-label">Presupuesto (USD)</div>
						<div class="range-inputs">
							<div class="filter-group">
								<label for="filter-presupuesto-min">Mínimo</label>
								<input
									id="filter-presupuesto-min"
									type="number"
									placeholder="0"
									min="0"
									step="1000"
									bind:value={pendingFilters.presupuesto_min}
								/>
							</div>
							<span class="range-separator">-</span>
							<div class="filter-group">
								<label for="filter-presupuesto-max">Máximo</label>
								<input
									id="filter-presupuesto-max"
									type="number"
									placeholder="1000000"
									min="0"
									step="1000"
									bind:value={pendingFilters.presupuesto_max}
								/>
							</div>
						</div>
					</div>

					<div class="range-group">
						<div class="range-label">Porcentaje de Avance</div>
						<div class="range-inputs">
							<div class="filter-group">
								<label for="filter-avance-min">Mínimo (%)</label>
								<input
									id="filter-avance-min"
									type="number"
									placeholder="0"
									min="0"
									max="100"
									bind:value={pendingFilters.avance_min}
								/>
							</div>
							<span class="range-separator">-</span>
							<div class="filter-group">
								<label for="filter-avance-max">Máximo (%)</label>
								<input
									id="filter-avance-max"
									type="number"
									placeholder="100"
									min="0"
									max="100"
									bind:value={pendingFilters.avance_max}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Filters Actions -->
			<div class="filters-actions">
				<button class="btn-primary btn-apply" on:click={applyFilters} disabled={applyingFilters}>
					{#if applyingFilters}
						<span class="spinner-sm" />
						<span>Aplicando...</span>
					{:else}
						<span>{icons.check}</span>
						<span>Aplicar Filtros</span>
					{/if}
				</button>
			</div>
		</div>
	{/if}

	<!-- Toast Feedback -->
	{#if showFeedback}
		<div class="toast-notification">
			<span>{filterFeedback}</span>
			<button class="toast-close" on:click={() => (showFeedback = false)}>
				<span>{icons.close}</span>
			</button>
		</div>
	{/if}
	<!-- Error message -->
	{#if error}
		<div class="error-banner">
			<p>{error}</p>
			<button on:click={() => (error = null)}>
				<span>{icons.close}</span>
			</button>
		</div>
	{/if}

	<!-- Table -->
	<div class="table-container">
		{#if loading && proyectos.length === 0}
			<div class="loading-state">
				<div class="spinner" />
				<p>Cargando proyectos...</p>
			</div>
		{:else if proyectos.length === 0}
			<div class="empty-state">
				<p>No se encontraron proyectos</p>
				<a href="/admin/proyectos/nuevo" class="btn-primary">
					<span>{icons.plus}</span>
					Crear primer proyecto
				</a>
			</div>
		{:else}
			<table class="projects-table">
				<thead>
					<tr>
						<th class="th-checkbox">
							<input type="checkbox" bind:checked={selectAll} on:change={handleSelectAll} />
						</th>
						<th
							class="th-sortable"
							class:active={sortColumn === 'codigo'}
							on:click={() => handleSort('codigo')}
						>
							<span class="th-content">
								Código
								<span class="sort-icon">
									{#if sortColumn === 'codigo'}
										{@html sortDirection === 'asc' ? icons.sortAsc : icons.sortDesc}
									{:else}
										{@html icons.sort}
									{/if}
								</span>
							</span>
						</th>
						<th
							class="th-sortable"
							class:active={sortColumn === 'titulo'}
							on:click={() => handleSort('titulo')}
						>
							<span class="th-content">
								Título
								<span class="sort-icon">
									{#if sortColumn === 'titulo'}
										{@html sortDirection === 'asc' ? icons.sortAsc : icons.sortDesc}
									{:else}
										{@html icons.sort}
									{/if}
								</span>
							</span>
						</th>
						<th
							class="th-sortable"
							class:active={sortColumn === 'estado'}
							on:click={() => handleSort('estado')}
						>
							<span class="th-content">
								Estado
								<span class="sort-icon">
									{#if sortColumn === 'estado'}
										{@html sortDirection === 'asc' ? icons.sortAsc : icons.sortDesc}
									{:else}
										{@html icons.sort}
									{/if}
								</span>
							</span>
						</th>
						<th
							class="th-sortable"
							class:active={sortColumn === 'fecha_inicio'}
							on:click={() => handleSort('fecha_inicio')}
						>
							<span class="th-content">
								Fecha Inicio
								<span class="sort-icon">
									{#if sortColumn === 'fecha_inicio'}
										{@html sortDirection === 'asc' ? icons.sortAsc : icons.sortDesc}
									{:else}
										{@html icons.sort}
									{/if}
								</span>
							</span>
						</th>
						<th
							class="th-sortable"
							class:active={sortColumn === 'avance'}
							on:click={() => handleSort('avance')}
						>
							<span class="th-content">
								Avance
								<span class="sort-icon">
									{#if sortColumn === 'avance'}
										{@html sortDirection === 'asc' ? icons.sortAsc : icons.sortDesc}
									{:else}
										{@html icons.sort}
									{/if}
								</span>
							</span>
						</th>
						<th
							class="th-sortable"
							class:active={sortColumn === 'presupuesto'}
							on:click={() => handleSort('presupuesto')}
						>
							<span class="th-content">
								Presupuesto
								<span class="sort-icon">
									{#if sortColumn === 'presupuesto'}
										{@html sortDirection === 'asc' ? icons.sortAsc : icons.sortDesc}
									{:else}
										{@html icons.sort}
									{/if}
								</span>
							</span>
						</th>
						<th class="th-actions">Acciones</th>
					</tr>
				</thead>
				<tbody>
					{#each proyectos as proyecto (proyecto.id)}
						<tr class:selected={selectedProjects.has(proyecto.id)}>
							<td class="td-checkbox">
								<input
									type="checkbox"
									checked={selectedProjects.has(proyecto.id)}
									on:change={() => handleSelectProject(proyecto.id)}
								/>
							</td>
							<td class="td-codigo">
								<code>{proyecto.codigo}</code>
							</td>
							<td class="td-titulo">
								<div class="titulo-cell">
									<span class="titulo-text">{proyecto.titulo}</span>
									{#if proyecto.requiere_aval}
										<span class="badge badge-info-outline">Requiere aval</span>
									{/if}
								</div>
							</td>
							<td class="td-estado">
								<span class="badge {getEstadoBadgeClass(proyecto.estado.nombre)}">
									{proyecto.estado.nombre}
								</span>
							</td>
							<td class="td-fecha">
								{formatDate(proyecto.fecha_inicio_planeada)}
							</td>
							<td class="td-avance">
								<div class="progress-container">
									<div class="progress-bar">
										<div class="progress-fill" style="width: {proyecto.porcentaje_avance}%" />
									</div>
									<span class="progress-text">{proyecto.porcentaje_avance}%</span>
								</div>
							</td>
							<td class="td-presupuesto">
								{formatCurrency(proyecto.monto_presupuesto_total)}
							</td>
							<td class="td-actions">
								<div class="action-buttons">
									<a
										href="/admin/proyectos/{proyecto.id}"
										class="btn-action btn-view"
										title="Ver detalles"
									>
										{@html icons.eye}
									</a>
									<a
										href="/admin/proyectos/{proyecto.id}/editar"
										class="btn-action btn-edit"
										title="Editar"
									>
										{@html icons.edit}
									</a>
									<button
										class="btn-action btn-delete"
										title="Eliminar"
										on:click={() => {
											proyectoToDelete = proyecto;
											showDeleteModal = true;
										}}
									>
										{@html icons.delete}
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="pagination">
			<div class="pagination-info">
				Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(
					currentPage * itemsPerPage,
					totalItems
				)} de {totalItems} proyectos
			</div>

			<div class="pagination-controls">
				<button
					class="btn-pagination"
					disabled={currentPage === 1}
					on:click={() => changePage(currentPage - 1)}
				>
					<span>{icons.chevronLeft}</span>
				</button>

				{#each Array(totalPages) as _, i}
					{#if i + 1 === 1 || i + 1 === totalPages || Math.abs(i + 1 - currentPage) <= 2}
						<button
							class="btn-pagination"
							class:active={currentPage === i + 1}
							on:click={() => changePage(i + 1)}
						>
							{i + 1}
						</button>
					{:else if i + 1 === currentPage - 3 || i + 1 === currentPage + 3}
						<span class="pagination-ellipsis">...</span>
					{/if}
				{/each}

				<button
					class="btn-pagination"
					disabled={currentPage === totalPages}
					on:click={() => changePage(currentPage + 1)}
				>
					<span>{icons.chevronRight}</span>
				</button>
			</div>

			<select bind:value={itemsPerPage} on:change={handleItemsPerPageChange}>
				<option value={10}>10 por página</option>
				<option value={15}>15 por página</option>
				<option value={25}>25 por página</option>
				<option value={50}>50 por página</option>
			</select>
		</div>
	{/if}
</div>

<!-- Delete Confirmation Modal (Single & Multiple) -->
{#if showDeleteModal && proyectoToDelete}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={() => (showDeleteModal = false)}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal modal-delete" on:click|stopPropagation>
			<div class="modal-header modal-header-danger">
				<div class="modal-icon-warning">⚠️</div>
				<h3>Confirmar Eliminación</h3>
				<button class="modal-close" on:click={() => (showDeleteModal = false)}>
					<span>{icons.close}</span>
				</button>
			</div>

			<div class="modal-body">
				<div class="warning-box">
					<p class="warning-title">
						Estás a punto de eliminar <strong>este proyecto</strong>
					</p>
					<p class="warning-message">Esta acción es permanente y no se puede deshacer.</p>
				</div>

				<div class="projects-preview">
					<p class="preview-title">Proyecto a eliminar:</p>
					<div class="preview-list">
						<div class="preview-item">
							<code class="preview-code">{proyectoToDelete.codigo}</code>
							<span class="preview-title-text">{proyectoToDelete.titulo}</span>
						</div>
					</div>
				</div>

				<div class="deletion-details">
					<p class="details-intro">Se eliminarán:</p>
					<ul class="detail-list">
						<li>
							<span class="detail-icon">📋</span>
							<span>Toda la información del proyecto</span>
						</li>
						<li>
							<span class="detail-icon">👥</span>
							<span>Participantes y roles asociados</span>
						</li>
						<li>
							<span class="detail-icon">📄</span>
							<span>Actividades, productos y documentos</span>
						</li>
					</ul>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn-secondary" on:click={() => (showDeleteModal = false)}> Cancelar </button>
				<button
					class="btn-danger"
					on:click={() => proyectoToDelete && deleteProyecto(proyectoToDelete.id)}
					disabled={loading}
				>
					{#if loading}
						<div class="spinner-sm" />
						<span>Eliminando...</span>
					{:else}
						{@html icons.delete}
						<span>Sí, Eliminar Proyecto</span>
					{/if}
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
				<h3>Exportar Proyectos</h3>
				<button class="modal-close" on:click={() => (showExportModal = false)}>
					<span>{icons.close}</span>
				</button>
			</div>

			<div class="modal-body">
				<p class="export-info">
					{#if selectedProjects.size > 0}
						Se exportarán <strong>{selectedProjects.size}</strong>
						proyecto{selectedProjects.size !== 1 ? 's' : ''} seleccionado{selectedProjects.size !==
						1
							? 's'
							: ''} con toda su información y relaciones.
					{:else}
						Se exportarán <strong>TODOS</strong> los proyectos (<strong>{totalItems}</strong> en total)
						con toda su información y relaciones.
					{/if}
				</p>

				<div class="export-format-selection">
					<div class="format-label">Selecciona el formato:</div>
					<div class="format-options">
						<label class="format-option" class:selected={exportFormat === 'csv'}>
							<input type="radio" name="format" value="csv" bind:group={exportFormat} />
							<div class="format-card">
								<div class="format-icon">📄</div>
								<div class="format-name">CSV</div>
								<div class="format-desc">Archivo de valores separados por comas</div>
							</div>
						</label>
						<label class="format-option" class:selected={exportFormat === 'excel'}>
							<input type="radio" name="format" value="excel" bind:group={exportFormat} />
							<div class="format-card">
								<div class="format-icon">📊</div>
								<div class="format-name">Excel</div>
								<div class="format-desc">Compatible con Microsoft Excel</div>
							</div>
						</label>
					</div>
				</div>

				<div class="export-details">
					<h4>Campos a exportar:</h4>
					<ul>
						<li>Código, Título, Estado y Tipos de proyecto</li>
						<li>Fechas de inicio y finalización</li>
						<li>Porcentaje de avance y presupuesto total</li>
						<li>Áreas de conocimiento y líneas de investigación</li>
						<li>Instituciones participantes</li>
						<li>Requiere aval y registro SIIES</li>
					</ul>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn-secondary" on:click={() => (showExportModal = false)}> Cancelar </button>
				<button
					class="btn-primary"
					on:click={selectedProjects.size > 0 ? exportProjects : exportAllProjects}
					disabled={exportingData}
				>
					{#if exportingData}
						<span class="spinner-sm" />
					{:else}
						<span>{icons.download}</span>
					{/if}
					Exportar {exportFormat === 'csv' ? 'CSV' : 'Excel'}
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
				<div class="modal-icon-warning">⚠️</div>
				<h3>Confirmar Eliminación Múltiple</h3>
				<button class="modal-close" on:click={() => (showBulkDeleteModal = false)}>
					<span>{icons.close}</span>
				</button>
			</div>

			<div class="modal-body">
				<div class="warning-box">
					<p class="warning-title">
						Estás a punto de eliminar <strong>{selectedProjects.size}</strong>
						proyecto{selectedProjects.size !== 1 ? 's' : ''}
					</p>
					<p class="warning-message">Esta acción es permanente y no se puede deshacer.</p>
				</div>

				<div class="projects-preview">
					<p class="preview-title">Proyectos seleccionados:</p>
					<div class="preview-list">
						{#each proyectos.filter((p) => selectedProjects.has(p.id)).slice(0, 3) as proyecto}
							<div class="preview-item">
								<code class="preview-code">{proyecto.codigo}</code>
								<span class="preview-title-text">{proyecto.titulo}</span>
							</div>
						{/each}
						{#if selectedProjects.size > 3}
							<div class="preview-more">
								Y {selectedProjects.size - 3} proyecto{selectedProjects.size - 3 !== 1 ? 's' : ''} más...
							</div>
						{/if}
					</div>
				</div>

				<div class="deletion-details">
					<p class="details-intro">Se eliminarán:</p>
					<ul class="detail-list">
						<li>
							<span class="detail-icon">📋</span>
							<span
								>Toda la información de los {selectedProjects.size} proyecto{selectedProjects.size !==
								1
									? 's'
									: ''}</span
							>
						</li>
						<li>
							<span class="detail-icon">👥</span>
							<span>Participantes y roles asociados</span>
						</li>
						<li>
							<span class="detail-icon">📄</span>
							<span>Actividades, productos y documentos</span>
						</li>
					</ul>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn-secondary" on:click={() => (showBulkDeleteModal = false)}>
					Cancelar
				</button>
				<button class="btn-danger" on:click={bulkDelete} disabled={loading}>
					{#if loading}
						<div class="spinner-sm" />
						<span>Eliminando...</span>
					{:else}
						{@html icons.delete}
						<span
							>Sí, Eliminar {selectedProjects.size} Proyecto{selectedProjects.size !== 1
								? 's'
								: ''}</span
						>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.tabla-proyectos-page {
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
				font-size: 2rem;
				font-weight: 700;
				color: var(--color--text);
				margin: 0 0 0.5rem 0;
			}

			.subtitle {
				color: var(--color--text-shade);
				font-size: 0.95rem;
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
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		flex-wrap: wrap;

		.toolbar-left,
		.toolbar-right {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			flex-wrap: wrap;
		}

		.toolbar-left {
			flex: 1;
			min-width: 0;
		}

		.toolbar-right {
			flex-shrink: 0;
		}
	}

	.search-box {
		position: relative;
		width: 280px;
		min-width: 200px;
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
			background: rgba(var(--color--text-rgb), 0.03);
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			border-radius: 6px;
			color: var(--color--text);
			font-size: 0.8125rem;

			&:focus {
				outline: none;
				border-color: var(--color--primary);
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
		background: rgba(var(--color--text-rgb), 0.03);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 6px;
		color: var(--color--text);
		font-size: 0.8125rem;
		cursor: pointer;
		min-width: 140px;
		max-width: 180px;

		&:focus {
			outline: none;
			border-color: var(--color--primary);
		}
	}

	// ==================== Filters Panel ====================
	.filters-panel {
		margin-bottom: 1.5rem;
		padding: 0;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 12px;
		box-shadow: var(--card-shadow);
		overflow: hidden;

		.filters-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 1.25rem 1.5rem;
			background: rgba(var(--color--primary-rgb), 0.05);
			border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);

			.filters-title {
				display: flex;
				align-items: center;
				gap: 0.75rem;
				font-size: 1.25rem;
				font-weight: 700;
				color: var(--color--text);
				margin: 0;

				.title-icon {
					font-size: 1.5rem;
				}
			}

			.filters-close {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 32px;
				height: 32px;
				background: rgba(var(--color--text-rgb), 0.05);
				border: 1px solid rgba(var(--color--text-rgb), 0.15);
				border-radius: 6px;
				color: var(--color--text-shade);
				cursor: pointer;
				transition: all 0.15s ease;
				font-size: 1.25rem;

				&:hover {
					border-color: var(--color--primary);
					color: var(--color--primary);
				}
			}
		}

		.filter-section {
			padding: 1.5rem;
			border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);

			&:last-of-type {
				border-bottom: none;
			}

			.section-title {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				font-size: 0.9375rem;
				font-weight: 600;
				color: var(--color--primary);
				text-transform: uppercase;
				letter-spacing: 0.5px;
				margin: 0 0 1.25rem 0;
			}
		}

		.filters-grid-2 {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
			gap: 1.5rem;
		}

		.filters-grid-3 {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 1rem;
		}

		.filter-group {
			label {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				font-size: 0.8125rem;
				font-weight: 500;
				color: var(--color--text-shade);
				margin-bottom: 0.5rem;
			}

			input,
			select {
				width: 100%;
				padding: 0.625rem 1rem;
				background: rgba(var(--color--text-rgb), 0.03);
				border: 1px solid rgba(var(--color--text-rgb), 0.15);
				border-radius: 6px;
				color: var(--color--text);
				font-size: 0.875rem;
				transition: all 0.15s ease;

				&:focus {
					outline: none;
					border-color: var(--color--primary);
					box-shadow: 0 0 0 3px rgba(var(--color--primary-rgb), 0.1);
				}

				&::placeholder {
					color: var(--color--text-shade);
				}
			}

			select {
				cursor: pointer;
			}
		}

		.date-range-group,
		.range-group {
			.range-label {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				font-size: 0.875rem;
				font-weight: 600;
				color: var(--color--text);
				margin-bottom: 0.75rem;
				padding-bottom: 0.5rem;
				border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);
			}

			.date-inputs,
			.range-inputs {
				display: grid;
				grid-template-columns: 1fr auto 1fr;
				gap: 0.75rem;
				align-items: end;

				.range-separator {
					color: var(--color--text-shade);
					font-weight: 500;
					padding-bottom: 0.625rem;
				}
			}

			.date-inputs {
				grid-template-columns: 1fr 1fr;
			}
		}
	}

	// ==================== Filters Actions ====================
	.filters-actions {
		display: flex;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(var(--color--text-rgb), 0.02);
		border-top: 1px solid rgba(var(--color--text-rgb), 0.1);

		.btn-apply {
			min-width: 180px;
			padding: 0.75rem 2rem;
			font-size: 0.9375rem;
		}
	}

	// ==================== Filter Badge ====================
	.filter-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		background: var(--color--primary);
		color: white;
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
		border: 1px solid var(--color--primary);
		border-radius: 8px;
		box-shadow: var(--card-shadow);
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
				opacity: 0.8;
			}
		}
	}

	// ==================== Table ====================
	.table-container {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		overflow: hidden;
	}

	.projects-table {
		width: 100%;
		border-collapse: collapse;

		thead {
			background: rgba(var(--color--text-rgb), 0.03);
			border-bottom: 1px solid rgba(var(--color--text-rgb), 0.15);

			th {
				padding: 1rem;
				text-align: left;
				font-size: 0.75rem;
				font-weight: 600;
				text-transform: uppercase;
				letter-spacing: 0.5px;
				color: var(--color--text-shade);
				white-space: nowrap;

				&.th-checkbox {
					width: 40px;
					text-align: center;
				}

				&.th-actions {
					width: 140px;
					text-align: center;
				}

				&.th-sortable {
					cursor: pointer;
					user-select: none;
					transition: color 0.15s ease;

					.th-content {
						display: flex;
						align-items: center;
						gap: 0.5rem;
					}

					.sort-icon {
						font-size: 0.7rem;
						opacity: 0.4;
						transition: opacity 0.15s ease;
					}

					&:hover {
						color: var(--color--primary);

						.sort-icon {
							opacity: 0.8;
						}
					}

					&.active {
						color: var(--color--primary);
						.sort-icon {
							opacity: 1;
						}
					}
				}
			}
		}

		tbody {
			tr {
				border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);
				transition: background-color 0.15s ease;

				&:hover {
					background: rgba(var(--color--primary-rgb), 0.05);
				}

				&.selected {
					background: rgba(var(--color--primary-rgb), 0.1);
				}

				&:last-child {
					border-bottom: none;
				}
			}

			td {
				padding: 1rem;
				font-size: 0.875rem;
				color: var(--color--text);

				&.td-checkbox {
					text-align: center;
				}

				&.td-codigo {
					code {
						padding: 0.25rem 0.5rem;
						background: rgba(var(--color--primary-rgb), 0.1);
						border: 1px solid rgba(var(--color--primary-rgb), 0.2);
						border-radius: 4px;
						font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
						font-size: 0.8125rem;
						color: var(--color--primary);
					}
				}

				&.td-titulo {
					max-width: 400px;

					.titulo-cell {
						display: flex;
						flex-direction: column;
						gap: 0.5rem;
					}

					.titulo-text {
						font-weight: 500;
						line-height: 1.4;
						display: -webkit-box;
						-webkit-line-clamp: 2;
						line-clamp: 2;
						-webkit-box-orient: vertical;
						overflow: hidden;
					}
				}

				&.td-estado {
					white-space: nowrap;
				}

				&.td-fecha {
					color: var(--color--text-shade);
					white-space: nowrap;
				}

				&.td-avance {
					min-width: 120px;
				}

				&.td-presupuesto {
					font-weight: 600;
					color: var(--color--primary);
					white-space: nowrap;
				}

				&.td-actions {
					text-align: center;
				}
			}
		}
	}

	// ==================== Checkbox Styles ====================
	input[type='checkbox'] {
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		width: 18px;
		height: 18px;
		border: 2px solid rgba(var(--color--text-rgb), 0.3);
		border-radius: 4px;
		background: var(--color--card-background);
		cursor: pointer;
		position: relative;
		transition: all 0.2s ease;
		margin: 0;

		&:hover {
			border-color: var(--color--primary);
		}

		&:checked {
			background: var(--color--primary);
			border-color: var(--color--primary);

			&::after {
				content: '';
				position: absolute;
				left: 5px;
				top: 2px;
				width: 4px;
				height: 8px;
				border: solid white;
				border-width: 0 2px 2px 0;
				transform: rotate(45deg);
			}
		}

		&:focus {
			outline: none;
			box-shadow: 0 0 0 3px rgba(var(--color--primary-rgb), 0.1);
		}
	}

	.progress-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;

		.progress-bar {
			flex: 1;
			height: 6px;
			background: rgba(var(--color--text-rgb), 0.1);
			border-radius: 3px;
			overflow: hidden;

			.progress-fill {
				height: 100%;
				background: var(--color--primary);
				border-radius: 3px;
				transition: width 0.3s ease;
			}
		}

		.progress-text {
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--color--text-shade);
			min-width: 35px;
			text-align: right;
		}
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
			border-color: var(--color--primary);
			color: var(--color--primary);
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
	}

	// ==================== Badges ====================
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 4px;
		white-space: nowrap;

		&.badge-success {
			background: rgba(16, 185, 129, 0.15);
			color: #10b981;
		}

		&.badge-info {
			background: rgba(59, 130, 246, 0.15);
			color: #3b82f6;
		}

		&.badge-warning {
			background: rgba(245, 158, 11, 0.15);
			color: #f59e0b;
		}

		&.badge-danger {
			background: rgba(239, 68, 68, 0.15);
			color: #ef4444;
		}

		&.badge-default {
			background: rgba(var(--color--text-rgb), 0.1);
			color: var(--color--text-shade);
		}

		&.badge-info-outline {
			background: transparent;
			border: 1px solid #3b82f6;
			color: #3b82f6;
		}
	}

	// ==================== Pagination ====================
	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1.5rem;
		padding: 1rem;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
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
			background: rgba(var(--color--text-rgb), 0.03);
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			border-radius: 6px;
			color: var(--color--text-shade);
			cursor: pointer;
			font-size: 0.875rem;
			transition: all 0.15s ease;

			&:hover:not(:disabled) {
				border-color: var(--color--primary);
				color: var(--color--primary);
			}

			&.active {
				background: var(--color--primary);
				border-color: var(--color--primary);
				color: white;
				font-weight: 600;
			}

			&:disabled {
				opacity: 0.5;
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
			padding: 0.5rem 2rem 0.5rem 1rem;
			background: rgba(var(--color--text-rgb), 0.03);
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			border-radius: 6px;
			color: var(--color--text);
			font-size: 0.875rem;
			cursor: pointer;

			&:focus {
				outline: none;
				border-color: var(--color--primary);
			}
		}
	}

	// ==================== States ====================
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
			font-size: 0.95rem;
		}
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(var(--color--text-rgb), 0.1);
		border-top: 3px solid var(--color--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.spinner-sm {
		width: 16px;
		height: 16px;
		border: 2px solid #ffffff40;
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
	}

	.btn-primary {
		background: #10b981;
		color: white;

		&:hover:not(:disabled) {
			background: #059669;
			filter: brightness(0.95);
		}
	}

	.btn-secondary {
		background: rgba(var(--color--text-rgb), 0.08);
		color: var(--color--text);
		border: 1px solid rgba(var(--color--text-rgb), 0.2);

		&:hover:not(:disabled) {
			background: rgba(var(--color--text-rgb), 0.12);
			border-color: rgba(var(--color--text-rgb), 0.3);
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
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		color: var(--color--text-shade);
		min-width: fit-content;
		position: relative;

		&:hover:not(:disabled) {
			border-color: var(--color--primary);
			color: var(--color--primary);
			background: rgba(var(--color--primary-rgb), 0.05);
		}

		&.active {
			border-color: var(--color--primary);
			color: var(--color--primary);
			background: rgba(var(--color--primary-rgb), 0.1);
		}

		&.btn-reset {
			&:not(:disabled) {
				color: #f59e0b;
				border-color: rgba(var(--color--text-rgb), 0.15);

				&:hover {
					border-color: #f59e0b;
					background: rgba(245, 158, 11, 0.05);
				}

				&.active {
					border-color: #f59e0b;
					background: rgba(245, 158, 11, 0.1);
					animation: pulse 2s ease-in-out infinite;
				}
			}

			&:disabled {
				opacity: 0.4;
				cursor: not-allowed;
			}
		}
	}

	@keyframes pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
		}
		50% {
			box-shadow: 0 0 0 4px rgba(245, 158, 11, 0);
		}
	}

	// ==================== Badges ====================
	.export-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0 4px;
		background: #059669;
		color: white;
		border-radius: 4px;
		font-size: 0.6875rem;
		font-weight: 700;
		line-height: 1;
		margin-left: 2px;
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
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: var(--card-shadow);
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
			border-bottom: 1px solid rgba(var(--color--text-rgb), 0.15);

			h3 {
				font-size: 1.25rem;
				font-weight: 600;
				color: var(--color--text);
				margin: 0;
			}

			&.modal-header-danger {
				background: rgba(239, 68, 68, 0.05);
				border-bottom-color: rgba(239, 68, 68, 0.2);
				flex-direction: column;
				gap: 0.5rem;
				align-items: center;
				text-align: center;
				padding: 1rem 1.5rem;

				.modal-icon-warning {
					font-size: 2rem;
					line-height: 1;
					filter: drop-shadow(0 2px 8px rgba(239, 68, 68, 0.3));
				}

				h3 {
					color: #ef4444;
					font-size: 1.125rem;
				}

				.modal-close {
					position: absolute;
					right: 0.75rem;
					top: 0.75rem;
				}
			}

			.modal-close {
				background: none;
				border: none;
				color: var(--color--text-shade);
				cursor: pointer;
				padding: 4px;
				display: flex;
				align-items: center;
				font-size: 1.25rem;

				&:hover {
					color: var(--color--text);
				}
			}
		}

		.modal-body {
			padding: 1rem 1.25rem;

			// Export modal specific styles
			.export-info {
				font-size: 0.9375rem;
				color: var(--color--text);
				text-align: center;
				margin-bottom: 1.5rem;

				strong {
					color: var(--color--primary);
					font-size: 1.125rem;
				}
			}

			.export-format-selection {
				margin-bottom: 1.5rem;

				.format-label {
					display: block;
					font-size: 0.875rem;
					font-weight: 600;
					color: var(--color--text);
					margin-bottom: 0.75rem;
				}

				.format-options {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 1rem;

					.format-option {
						cursor: pointer;

						input[type='radio'] {
							display: none;
						}

						.format-card {
							padding: 1rem;
							background: rgba(var(--color--text-rgb), 0.03);
							border: 2px solid rgba(var(--color--text-rgb), 0.15);
							border-radius: 8px;
							text-align: center;
							transition: all 0.15s ease;

							.format-icon {
								font-size: 2rem;
								margin-bottom: 0.5rem;
							}

							.format-name {
								font-size: 0.9375rem;
								font-weight: 600;
								color: var(--color--text);
								margin-bottom: 0.25rem;
							}

							.format-desc {
								font-size: 0.75rem;
								color: var(--color--text-shade);
								line-height: 1.3;
							}
						}

						&:hover .format-card {
							border-color: var(--color--primary);
						}

						&.selected .format-card {
							border-color: var(--color--primary);
							background: rgba(var(--color--primary-rgb), 0.1);

							.format-name {
								color: var(--color--primary);
							}
						}
					}
				}
			}

			.export-details {
				padding: 1rem;
				background: rgba(var(--color--text-rgb), 0.03);
				border: 1px solid rgba(var(--color--text-rgb), 0.15);
				border-radius: 8px;

				h4 {
					font-size: 0.875rem;
					font-weight: 600;
					color: var(--color--text);
					margin: 0 0 0.75rem 0;
				}

				ul {
					margin: 0;
					padding-left: 1.25rem;
					color: var(--color--text-shade);
					font-size: 0.8125rem;
					line-height: 1.6;

					li {
						margin-bottom: 0.25rem;

						&:last-child {
							margin-bottom: 0;
						}
					}
				}
			}

			// Delete modal specific styles
			.warning-box {
				padding: 0.75rem 1rem;
				background: rgba(239, 68, 68, 0.1);
				border: 1px solid rgba(239, 68, 68, 0.3);
				border-radius: 6px;
				margin-bottom: 1rem;

				.warning-title {
					font-size: 0.9375rem;
					color: var(--color--text);
					margin: 0 0 0.375rem 0;
					font-weight: 600;

					strong {
						color: #ef4444;
					}
				}

				.warning-message {
					font-size: 0.8125rem;
					color: var(--color--text-shade);
					margin: 0;
				}
			}

			.deletion-details {
				margin-bottom: 1rem;

				.details-intro {
					font-size: 0.8125rem;
					font-weight: 600;
					color: var(--color--text-shade);
					margin: 0 0 0.5rem 0;
				}

				.detail-list {
					list-style: none;
					padding: 0;
					margin: 0;

					li {
						display: flex;
						align-items: flex-start;
						gap: 0.625rem;
						padding: 0.5rem 0.75rem;
						background: rgba(var(--color--text-rgb), 0.03);
						border: 1px solid rgba(var(--color--text-rgb), 0.15);
						border-radius: 4px;
						margin-bottom: 0.375rem;
						font-size: 0.8125rem;
						color: var(--color--text-shade);

						&:last-child {
							margin-bottom: 0;
						}

						.detail-icon {
							font-size: 1rem;
							line-height: 1;
							flex-shrink: 0;
						}

						span:last-child {
							flex: 1;
						}
					}
				}
			}

			.projects-preview {
				margin-bottom: 1rem;

				.preview-title {
					font-size: 0.8125rem;
					font-weight: 600;
					color: var(--color--text);
					margin: 0 0 0.5rem 0;
				}

				.preview-list {
					background: rgba(var(--color--text-rgb), 0.03);
					border: 1px solid rgba(var(--color--text-rgb), 0.15);
					border-radius: 6px;
					overflow: hidden;

					.preview-item {
						display: flex;
						align-items: center;
						gap: 0.625rem;
						padding: 0.625rem 0.875rem;
						border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);

						&:last-child {
							border-bottom: none;
						}

						.preview-code {
							display: inline-block;
							padding: 0.1875rem 0.4375rem;
							background: rgba(var(--color--primary-rgb), 0.1);
							color: var(--color--primary);
							border-radius: 3px;
							font-size: 0.6875rem;
							font-family: 'SF Mono', monospace;
							flex-shrink: 0;
						}

						.preview-title-text {
							flex: 1;
							font-size: 0.8125rem;
							color: var(--color--text-shade);
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
						}
					}

					.preview-more {
						padding: 0.625rem 0.875rem;
						text-align: center;
						font-size: 0.8125rem;
						color: var(--color--text-shade);
						font-style: italic;
					}
				}
			}
		}

		.modal-footer {
			display: flex;
			justify-content: flex-end;
			gap: 0.75rem;
			padding: 1rem 1.25rem;
			border-top: 1px solid rgba(var(--color--text-rgb), 0.15);
		}
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	// ==================== Responsive ====================
	@media (max-width: 1200px) {
		.tabla-proyectos-page {
			padding: 1.5rem;
		}

		.search-box {
			width: 250px;
		}
	}

	@media (max-width: 768px) {
		.tabla-proyectos-page {
			padding: 1rem;
		}

		.page-header {
			flex-direction: column;
			align-items: flex-start;

			.header-actions {
				width: 100%;

				a {
					flex: 1;
					justify-content: center;
				}
			}
		}

		.toolbar {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
			padding: 0.75rem;

			.toolbar-left,
			.toolbar-right {
				width: 100%;
				flex-wrap: wrap;
				gap: 0.5rem;
			}

			.toolbar-right {
				justify-content: stretch;

				> * {
					flex: 1;
					min-width: fit-content;
				}
			}
		}

		.search-box {
			width: 100%;
		}

		.table-container {
			overflow-x: auto;
		}

		.projects-table {
			min-width: 900px;
		}

		.pagination {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;

			.pagination-controls {
				justify-content: center;
			}
		}
	}
</style>
