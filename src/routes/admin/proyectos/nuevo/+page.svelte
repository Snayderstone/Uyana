<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import type { CreateProyectoDTO } from '$lib/models/admin';

	// State
	let loading = false;
	let error: string | null = null;
	let success = false;
	let validationErrors: Array<{ field: string; message: string }> = [];

	// Form data
	let formData: Partial<CreateProyectoDTO> = {
		codigo: '',
		titulo: '',
		objetivo: '',
		estado_id: undefined,
		requiere_aval: false,
		fecha_inicio_planeada: '',
		fecha_fin_planeada: '',
		cantidad_meses: 12,
		porcentaje_avance: 0,
		monto_presupuesto_total: 0,
		impacto_cientifico: '',
		impacto_economico: '',
		impacto_social: '',
		otros_impactos: '',
		para_siies: false,
		instituciones_ids: [],
		tipos_ids: [],
		areas_conocimiento_ids: [],
		lineas_investigacion_ids: [],
		fuentes_financiamiento_ids: [],
		participantes: []
	};

	// Catalogs
	let estados: Array<{ id: number; nombre: string }> = [];
	let tipos: Array<{ id: number; nombre: string }> = [];
	let areas: Array<{ id: number; nombre: string }> = [];
	let lineas: Array<{ id: number; nombre: string }> = [];
	let fuentes: Array<{ id: number; nombre: string }> = [];
	let instituciones: Array<{ id: number; nombre: string; sigla?: string }> = [];
	let participantes: Array<{
		id: number;
		nombre: string;
		email: string;
		carrera?: { nombre: string; facultad?: { nombre: string } };
	}> = [];
	let cargos: Array<{ id: number; nombre: string }> = [];
	let regimenes: Array<{ id: number; nombre: string }> = [];

	// UI State
	let currentStep = 1;
	let totalSteps = 4;

	// Institución state
	let showCreateInstitucionModal = false;
	let institucionSearch = '';
	let filteredInstituciones: Array<{ id: number; nombre: string; sigla?: string }> = [];
	let newInstitucion = {
		nombre: '',
		sigla: '',
		pais: 'Ecuador',
		geometry: ''
	};
	let geoJsonError = '';

	// Combobox país state
	let showPaisDropdown = false;
	let filteredPaises: string[] = [];

	// Tipos state
	let showCreateTipoModal = false;
	let tipoSearch = '';
	let filteredTipos: Array<{ id: number; nombre: string }> = [];
	let newTipo = { nombre: '', descripcion: '' };

	// Áreas state
	let showCreateAreaModal = false;
	let areaSearch = '';
	let filteredAreas: Array<{ id: number; nombre: string }> = [];
	let newArea = { nombre: '', descripcion: '' };

	// Líneas state
	let showCreateLineaModal = false;
	let lineaSearch = '';
	let filteredLineas: Array<{ id: number; nombre: string }> = [];
	let newLinea = { nombre: '', descripcion: '' };

	// Fuentes state
	let showCreateFuenteModal = false;
	let fuenteSearch = '';
	let filteredFuentes: Array<{ id: number; nombre: string }> = [];
	let newFuente = { nombre: '', descripcion: '' };

	// Participantes search state (por cada índice del array)
	let participanteSearches: { [key: number]: string } = {};
	let filteredParticipantesByIndex: {
		[key: number]: Array<{
			id: number;
			nombre: string;
			email: string;
			carrera?: { nombre: string; facultad?: { nombre: string } };
		}>;
	} = {};
	let showParticipanteDropdown: { [key: number]: boolean } = {};

	// Cargos search state (por cada índice del array)
	let cargoSearches: { [key: number]: string } = {};
	let filteredCargosByIndex: { [key: number]: Array<{ id: number; nombre: string }> } = {};
	let showCargoDropdown: { [key: number]: boolean } = {};

	// Regimenes search state (por cada índice del array)
	let regimenSearches: { [key: number]: string } = {};
	let filteredRegimenesByIndex: { [key: number]: Array<{ id: number; nombre: string }> } = {};
	let showRegimenDropdown: { [key: number]: boolean } = {};

	// Lista de países (principales de Latinoamérica y otros)
	const paises = [
		'Ecuador',
		'Argentina',
		'Bolivia',
		'Brasil',
		'Chile',
		'Colombia',
		'Costa Rica',
		'Cuba',
		'República Dominicana',
		'El Salvador',
		'Guatemala',
		'Honduras',
		'México',
		'Nicaragua',
		'Panamá',
		'Paraguay',
		'Perú',
		'Uruguay',
		'Venezuela',
		'España',
		'Estados Unidos',
		'Canadá',
		'Otro'
	];

	/**
	 * Filter países based on input
	 */
	function filterPaises() {
		const search = newInstitucion.pais.toLowerCase().trim();
		if (!search) {
			filteredPaises = paises;
		} else {
			filteredPaises = paises.filter((p) => p.toLowerCase().includes(search));
		}
	}

	/**
	 * Handle país input focus
	 */
	function handlePaisFocus() {
		filterPaises();
		showPaisDropdown = true;
	}

	/**
	 * Handle país selection
	 */
	function selectPais(pais: string) {
		newInstitucion.pais = pais;
		showPaisDropdown = false;
	}

	/**
	 * Handle país blur - cierra dropdown después de un delay
	 */
	function handlePaisBlur() {
		// Delay para permitir clic en opciones
		setTimeout(() => {
			showPaisDropdown = false;
		}, 150);
	}

	/**
	 * Filter instituciones based on search
	 */
	function filterInstituciones() {
		if (!institucionSearch.trim()) {
			filteredInstituciones = instituciones;
		} else {
			const search = institucionSearch.toLowerCase();
			filteredInstituciones = instituciones.filter(
				(inst) =>
					inst.nombre.toLowerCase().includes(search) ||
					(inst.sigla && inst.sigla.toLowerCase().includes(search))
			);
		}
	}

	/**
	 * Filter tipos based on search
	 */
	function filterTipos() {
		if (!tipoSearch.trim()) {
			filteredTipos = tipos;
		} else {
			const search = tipoSearch.toLowerCase();
			filteredTipos = tipos.filter((tipo) => tipo.nombre.toLowerCase().includes(search));
		}
	}

	/**
	 * Filter areas based on search
	 */
	function filterAreas() {
		if (!areaSearch.trim()) {
			filteredAreas = areas;
		} else {
			const search = areaSearch.toLowerCase();
			filteredAreas = areas.filter((area) => area.nombre.toLowerCase().includes(search));
		}
	}

	/**
	 * Filter lineas based on search
	 */
	function filterLineas() {
		if (!lineaSearch.trim()) {
			filteredLineas = lineas;
		} else {
			const search = lineaSearch.toLowerCase();
			filteredLineas = lineas.filter((linea) => linea.nombre.toLowerCase().includes(search));
		}
	}

	/**
	 * Filter fuentes based on search
	 */
	function filterFuentes() {
		if (!fuenteSearch.trim()) {
			filteredFuentes = fuentes;
		} else {
			const search = fuenteSearch.toLowerCase();
			filteredFuentes = fuentes.filter((fuente) => fuente.nombre.toLowerCase().includes(search));
		}
	}

	/**
	 * Filter participantes for a specific index
	 */
	function filterParticipantesForIndex(index: number) {
		const search = participanteSearches[index]?.toLowerCase().trim() || '';
		if (!search) {
			filteredParticipantesByIndex[index] = participantes;
		} else {
			filteredParticipantesByIndex[index] = participantes.filter((p) =>
				p.nombre.toLowerCase().includes(search)
			);
		}
		showParticipanteDropdown[index] = true;
	}

	/**
	 * Select participante for index
	 */
	function selectParticipante(index: number, participanteId: number) {
		const participante = participantes.find((p) => p.id === participanteId);
		if (participante && formData.participantes) {
			formData.participantes[index].participante_id = participanteId;
			participanteSearches[index] = participante.nombre;
			showParticipanteDropdown[index] = false;
		}
	}

	/**
	 * Filter cargos for a specific index
	 */
	function filterCargosForIndex(index: number) {
		const search = cargoSearches[index]?.toLowerCase().trim() || '';
		if (!search) {
			filteredCargosByIndex[index] = cargos;
		} else {
			filteredCargosByIndex[index] = cargos.filter((c) => c.nombre.toLowerCase().includes(search));
		}
		showCargoDropdown[index] = true;
	}

	/**
	 * Select cargo for index
	 */
	function selectCargo(index: number, cargoId: number) {
		const cargo = cargos.find((c) => c.id === cargoId);
		if (cargo && formData.participantes) {
			formData.participantes[index].cargo_id = cargoId;
			cargoSearches[index] = cargo.nombre;
			showCargoDropdown[index] = false;
		}
	}

	/**
	 * Filter regimenes for a specific index
	 */
	function filterRegimenesForIndex(index: number) {
		const search = regimenSearches[index]?.toLowerCase().trim() || '';
		if (!search) {
			filteredRegimenesByIndex[index] = regimenes;
		} else {
			filteredRegimenesByIndex[index] = regimenes.filter((r) =>
				r.nombre.toLowerCase().includes(search)
			);
		}
		showRegimenDropdown[index] = true;
	}

	/**
	 * Select regimen for index
	 */
	function selectRegimen(index: number, regimenId: number) {
		const regimen = regimenes.find((r) => r.id === regimenId);
		if (regimen && formData.participantes) {
			formData.participantes[index].regimen_dedicacion_id = regimenId;
			regimenSearches[index] = regimen.nombre;
			showRegimenDropdown[index] = false;
		}
	}

	/**
	 * Handle blur for participante search
	 */
	function handleParticipanteBlur(index: number) {
		setTimeout(() => {
			showParticipanteDropdown[index] = false;

			// Buscar automáticamente el ID si el nombre coincide exactamente
			const searchText = participanteSearches[index]?.trim();
			if (searchText && formData.participantes) {
				const participante = participantes.find(
					(p) => p.nombre.toLowerCase() === searchText.toLowerCase()
				);
				if (participante) {
					formData.participantes[index].participante_id = participante.id;
					participanteSearches[index] = participante.nombre;
				}
			}
		}, 150);
	}

	/**
	 * Handle blur for cargo search
	 */
	function handleCargoBlur(index: number) {
		setTimeout(() => {
			showCargoDropdown[index] = false;

			// Buscar automáticamente el ID si el nombre coincide exactamente
			const searchText = cargoSearches[index]?.trim();
			if (searchText && formData.participantes) {
				const cargo = cargos.find((c) => c.nombre.toLowerCase() === searchText.toLowerCase());
				if (cargo) {
					formData.participantes[index].cargo_id = cargo.id;
					cargoSearches[index] = cargo.nombre;
				}
			}
		}, 150);
	}

	/**
	 * Handle blur for regimen search
	 */
	function handleRegimenBlur(index: number) {
		setTimeout(() => {
			showRegimenDropdown[index] = false;

			// Buscar automáticamente el ID si el nombre coincide exactamente
			const searchText = regimenSearches[index]?.trim();
			if (searchText && formData.participantes) {
				const regimen = regimenes.find((r) => r.nombre.toLowerCase() === searchText.toLowerCase());
				if (regimen) {
					formData.participantes[index].regimen_dedicacion_id = regimen.id;
					regimenSearches[index] = regimen.nombre;
				}
			}
		}, 150);
	}

	/**
	 * Validate and auto-format GeoJSON
	 * Extracts first Feature from FeatureCollection if needed
	 */
	function validateGeoJson(jsonStr: string): boolean {
		if (!jsonStr.trim()) return false;
		try {
			const parsed = JSON.parse(jsonStr);

			// Si es FeatureCollection, extraer el primer Feature automáticamente
			if (parsed.type === 'FeatureCollection' || parsed.type === 'featureCollection') {
				if (!parsed.features || parsed.features.length === 0) {
					geoJsonError = 'El FeatureCollection no contiene ningún Feature';
					return false;
				}
				// Auto-extraer el primer feature
				const firstFeature = parsed.features[0];
				newInstitucion.geometry = JSON.stringify(firstFeature, null, 2);
				geoJsonError = '';
				return validateGeoJson(newInstitucion.geometry); // Validar recursivamente
			}

			// Validar que sea un Feature
			if (parsed.type !== 'Feature' && parsed.type !== 'feature') {
				geoJsonError = 'El GeoJSON debe ser de tipo "Feature" o "FeatureCollection"';
				return false;
			}

			// Validar geometry
			if (!parsed.geometry || !parsed.geometry.type || !parsed.geometry.coordinates) {
				geoJsonError = 'El GeoJSON debe tener geometry con type y coordinates';
				return false;
			}

			geoJsonError = '';
			return true;
		} catch (e) {
			geoJsonError = 'JSON inválido: ' + (e as Error).message;
			return false;
		}
	}

	/**
	 * Create new institucion
	 */
	async function createInstitucion() {
		if (!newInstitucion.nombre.trim()) {
			error = 'El nombre de la institución es obligatorio';
			return;
		}
		if (!validateGeoJson(newInstitucion.geometry)) {
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await fetch('/api/admin/catalogs/instituciones', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nombre: newInstitucion.nombre,
					sigla: newInstitucion.sigla || null,
					pais: newInstitucion.pais,
					geometry: JSON.parse(newInstitucion.geometry)
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Error al crear institución');
			}

			const createdInst = await response.json();

			// Reload instituciones
			const instRes = await fetch('/api/admin/catalogs/instituciones');
			instituciones = await instRes.json();
			filteredInstituciones = instituciones;

			// Select the newly created institution
			formData.instituciones_ids = [...(formData.instituciones_ids || []), createdInst.id];

			// Reset form and close modal
			newInstitucion = { nombre: '', sigla: '', pais: 'Ecuador', geometry: '' };
			geoJsonError = '';
			showCreateInstitucionModal = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al crear institución';
		} finally {
			loading = false;
		}
	}

	/**
	 * Create new tipo
	 */
	async function createTipo() {
		if (!newTipo.nombre.trim()) {
			error = 'El nombre del tipo es obligatorio';
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await fetch('/api/admin/catalogs/tipos', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nombre: newTipo.nombre,
					descripcion: newTipo.descripcion || undefined
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Error al crear tipo');
			}

			const created = await response.json();

			// Reload tipos
			const res = await fetch('/api/admin/catalogs/tipos');
			const data = await res.json();
			tipos = data.success ? data.data : [];
			filteredTipos = tipos;

			// Select the newly created item
			formData.tipos_ids = [...(formData.tipos_ids || []), created.id];

			// Reset form and close modal
			newTipo = { nombre: '', descripcion: '' };
			showCreateTipoModal = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al crear tipo';
		} finally {
			loading = false;
		}
	}

	/**
	 * Create new area
	 */
	async function createArea() {
		if (!newArea.nombre.trim()) {
			error = 'El nombre del área es obligatorio';
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await fetch('/api/admin/catalogs/areas', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nombre: newArea.nombre,
					descripcion: newArea.descripcion || undefined
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Error al crear área');
			}

			const created = await response.json();

			// Reload areas
			const res = await fetch('/api/admin/catalogs/areas');
			const data = await res.json();
			areas = data.success ? data.data : [];
			filteredAreas = areas;

			// Select the newly created item
			formData.areas_conocimiento_ids = [...(formData.areas_conocimiento_ids || []), created.id];

			// Reset form and close modal
			newArea = { nombre: '', descripcion: '' };
			showCreateAreaModal = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al crear área';
		} finally {
			loading = false;
		}
	}

	/**
	 * Create new linea
	 */
	async function createLinea() {
		if (!newLinea.nombre.trim()) {
			error = 'El nombre de la línea es obligatorio';
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await fetch('/api/admin/catalogs/lineas', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nombre: newLinea.nombre,
					descripcion: newLinea.descripcion || undefined
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Error al crear línea');
			}

			const created = await response.json();

			// Reload lineas
			const res = await fetch('/api/admin/catalogs/lineas');
			const data = await res.json();
			lineas = data.success ? data.data : [];
			filteredLineas = lineas;

			// Select the newly created item
			formData.lineas_investigacion_ids = [
				...(formData.lineas_investigacion_ids || []),
				created.id
			];

			// Reset form and close modal
			newLinea = { nombre: '', descripcion: '' };
			showCreateLineaModal = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al crear línea';
		} finally {
			loading = false;
		}
	}

	/**
	 * Create new fuente
	 */
	async function createFuente() {
		if (!newFuente.nombre.trim()) {
			error = 'El nombre de la fuente es obligatorio';
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await fetch('/api/admin/catalogs/fuentes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nombre: newFuente.nombre,
					descripcion: newFuente.descripcion || undefined
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Error al crear fuente');
			}

			const created = await response.json();

			// Reload fuentes
			const res = await fetch('/api/admin/catalogs/fuentes');
			const data = await res.json();
			fuentes = data.success ? data.data : [];
			filteredFuentes = fuentes;

			// Select the newly created item
			formData.fuentes_financiamiento_ids = [
				...(formData.fuentes_financiamiento_ids || []),
				created.id
			];

			// Reset form and close modal
			newFuente = { nombre: '', descripcion: '' };
			showCreateFuenteModal = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al crear fuente';
		} finally {
			loading = false;
		}
	}

	/**
	 * Fetch catalogs
	 */
	async function fetchCatalogs() {
		try {
			const [
				estadosRes,
				tiposRes,
				areasRes,
				lineasRes,
				fuentesRes,
				institucionesRes,
				participantesRes,
				cargosRes,
				regimenesRes
			] = await Promise.all([
				fetch('/api/admin/catalogs/estados'),
				fetch('/api/admin/catalogs/tipos'),
				fetch('/api/admin/catalogs/areas'),
				fetch('/api/admin/catalogs/lineas'),
				fetch('/api/admin/catalogs/fuentes'),
				fetch('/api/admin/catalogs/instituciones'),
				fetch('/api/admin/participants?all=true'),
				fetch('/api/admin/catalogs/cargos'),
				fetch('/api/admin/catalogs/regimenes')
			]);

			if (estadosRes.ok) {
				const data = await estadosRes.json();
				estados = data.success ? data.data : [];
			}
			if (tiposRes.ok) {
				const data = await tiposRes.json();
				tipos = data.success ? data.data : [];
			}
			if (areasRes.ok) {
				const data = await areasRes.json();
				areas = data.success ? data.data : [];
			}
			if (lineasRes.ok) {
				const data = await lineasRes.json();
				lineas = data.success ? data.data : [];
			}
			if (fuentesRes.ok) {
				const data = await fuentesRes.json();
				fuentes = data.success ? data.data : [];
			}
			if (institucionesRes.ok) {
				const data = await institucionesRes.json();
				instituciones = data.success ? data.data : [];
				filteredInstituciones = instituciones;
			}
			if (participantesRes.ok) {
				const response = await participantesRes.json();
				// La API retorna: { success: true, data: { data: [...], pagination: {...} } }
				if (response.success && response.data && Array.isArray(response.data.data)) {
					participantes = response.data.data;
					console.log('✅ Participantes cargados:', participantes.length);
				} else {
					participantes = [];
					console.error('❌ No se pudieron cargar participantes. Estructura:', response);
				}
			}
			if (cargosRes.ok) {
				const data = await cargosRes.json();
				cargos = data.success ? data.data : [];
			}
			if (regimenesRes.ok) {
				const data = await regimenesRes.json();
				regimenes = data.success ? data.data : [];
			}

			// Initialize filtered arrays
			filteredTipos = tipos;
			filteredAreas = areas;
			filteredLineas = lineas;
			filteredFuentes = fuentes;
		} catch (err) {
			console.error('Error fetching catalogs:', err);
		}
	}

	// Reactive statements
	$: if (institucionSearch !== undefined) {
		filterInstituciones();
	}

	$: if (instituciones.length && !filteredInstituciones.length && !institucionSearch) {
		filteredInstituciones = instituciones;
	}

	/**
	 * Calculate months between dates
	 */
	function calculateMonths() {
		if (formData.fecha_inicio_planeada && formData.fecha_fin_planeada) {
			const start = new Date(formData.fecha_inicio_planeada);
			const end = new Date(formData.fecha_fin_planeada);
			const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
			formData.cantidad_meses = Math.max(1, months);
		}
	}

	/**
	 * Add participante
	 */
	function addParticipante() {
		const newIndex = (formData.participantes || []).length;
		formData.participantes = [
			...(formData.participantes || []),
			{
				participante_id: undefined,
				cargo_id: undefined,
				regimen_dedicacion_id: undefined
			}
		];
		// Initialize search states for new participante
		participanteSearches[newIndex] = '';
		cargoSearches[newIndex] = '';
		regimenSearches[newIndex] = '';
		filteredParticipantesByIndex[newIndex] = participantes;
		filteredCargosByIndex[newIndex] = cargos;
		filteredRegimenesByIndex[newIndex] = regimenes;
		showParticipanteDropdown[newIndex] = false;
		showCargoDropdown[newIndex] = false;
		showRegimenDropdown[newIndex] = false;
	}

	/**
	 * Remove participante
	 */
	function removeParticipante(index: number) {
		formData.participantes = formData.participantes?.filter((_, i) => i !== index) || [];
	}

	/**
	 * Submit form
	 */
	async function handleSubmit() {
		error = null;
		validationErrors = [];

		// Validar el último paso antes de enviar
		if (!validateStep4()) {
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/admin/projects', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				const result = await response.json();
				console.error('Error del servidor:', result);
				if (result.errors) {
					validationErrors = result.errors;
				}
				error = result.message || `Error al crear el proyecto (HTTP ${response.status})`;
				return;
			}

			const result = await response.json();

			if (result.success) {
				success = true;
				setTimeout(() => {
					goto('/admin/proyectos/tabla');
				}, 1500);
			} else {
				if (result.errors) {
					validationErrors = result.errors;
				}
				error = result.message || 'Error al crear el proyecto';
				console.error('Error en la respuesta:', result);
			}
		} catch (err) {
			console.error('Error creating project:', err);
			error = err instanceof Error ? err.message : 'Error de conexión al crear el proyecto';
		} finally {
			loading = false;
		}
	}

	/**
	 * Get field error - check both frontend and backend validation
	 */
	function getFieldError(field: string): boolean {
		return fieldsWithError.has(field);
	}

	// Campos con error para resaltado visual
	let fieldsWithError: Set<string> = new Set();

	/**
	 * Validate Step 1: Información Básica
	 */
	function validateStep1(): boolean {
		const errors: string[] = [];
		fieldsWithError.clear();
		let firstErrorField: string | null = null;

		if (!formData.codigo?.trim()) {
			errors.push('El código del proyecto es obligatorio');
			fieldsWithError.add('codigo');
			if (!firstErrorField) firstErrorField = 'codigo';
		}
		if (!formData.titulo?.trim()) {
			errors.push('El título del proyecto es obligatorio');
			fieldsWithError.add('titulo');
			if (!firstErrorField) firstErrorField = 'titulo';
		}
		if (!formData.objetivo?.trim()) {
			errors.push('El objetivo del proyecto es obligatorio');
			fieldsWithError.add('objetivo');
			if (!firstErrorField) firstErrorField = 'objetivo';
		}
		if (!formData.estado_id) {
			errors.push('Debes seleccionar un estado');
			fieldsWithError.add('estado');
			if (!firstErrorField) firstErrorField = 'estado';
		}
		if (!formData.fecha_inicio_planeada) {
			errors.push('La fecha de inicio es obligatoria');
			fieldsWithError.add('fecha_inicio');
			if (!firstErrorField) firstErrorField = 'fecha_inicio';
		}
		if (!formData.fecha_fin_planeada) {
			errors.push('La fecha de fin es obligatoria');
			fieldsWithError.add('fecha_fin');
			if (!firstErrorField) firstErrorField = 'fecha_fin';
		}
		if (!formData.monto_presupuesto_total || formData.monto_presupuesto_total <= 0) {
			errors.push('El presupuesto debe ser mayor a cero');
			fieldsWithError.add('presupuesto');
			if (!firstErrorField) firstErrorField = 'presupuesto';
		}

		if (errors.length > 0) {
			error = errors.join('. ');
			// Scroll al primer campo con error
			if (firstErrorField) {
				setTimeout(() => {
					const element = document.getElementById(firstErrorField);
					if (element) {
						element.scrollIntoView({ behavior: 'smooth', block: 'center' });
						element.focus();
					}
				}, 100);
			}
			return false;
		}

		error = null;
		return true;
	}

	/**
	 * Validate Step 2: Clasificación
	 */
	function validateStep2(): boolean {
		const errors: string[] = [];
		fieldsWithError.clear();
		let firstErrorField: string | null = null;

		if (!formData.instituciones_ids || formData.instituciones_ids.length === 0) {
			errors.push('Debes seleccionar al menos una institución');
			fieldsWithError.add('instituciones');
			if (!firstErrorField) firstErrorField = 'instituciones';
		}
		if (!formData.tipos_ids || formData.tipos_ids.length === 0) {
			errors.push('Debes seleccionar al menos un tipo de proyecto');
			fieldsWithError.add('tipos');
			if (!firstErrorField) firstErrorField = 'tipos';
		}
		if (!formData.areas_conocimiento_ids || formData.areas_conocimiento_ids.length === 0) {
			errors.push('Debes seleccionar al menos un área de conocimiento');
			fieldsWithError.add('areas');
			if (!firstErrorField) firstErrorField = 'areas';
		}
		if (!formData.lineas_investigacion_ids || formData.lineas_investigacion_ids.length === 0) {
			errors.push('Debes seleccionar al menos una línea de investigación');
			fieldsWithError.add('lineas');
			if (!firstErrorField) firstErrorField = 'lineas';
		}
		if (!formData.fuentes_financiamiento_ids || formData.fuentes_financiamiento_ids.length === 0) {
			errors.push('Debes seleccionar al menos una fuente de financiamiento');
			fieldsWithError.add('fuentes');
			if (!firstErrorField) firstErrorField = 'fuentes';
		}

		if (errors.length > 0) {
			error = errors.join('. ');
			// Scroll al primer campo con error
			if (firstErrorField) {
				setTimeout(() => {
					const element = document.getElementById(`${firstErrorField}-search`);
					if (element) {
						element.scrollIntoView({ behavior: 'smooth', block: 'center' });
					}
				}, 100);
			}
			return false;
		}

		error = null;
		return true;
	}

	/**
	 * Validate Step 3: Impacto
	 */
	function validateStep3(): boolean {
		const errors: string[] = [];
		fieldsWithError.clear();
		let firstErrorField: string | null = null;

		if (!formData.impacto_cientifico?.trim()) {
			errors.push('El impacto científico es obligatorio');
			fieldsWithError.add('impacto_cientifico');
			if (!firstErrorField) firstErrorField = 'impacto_cientifico';
		}
		if (!formData.impacto_economico?.trim()) {
			errors.push('El impacto económico es obligatorio');
			fieldsWithError.add('impacto_economico');
			if (!firstErrorField) firstErrorField = 'impacto_economico';
		}
		if (!formData.impacto_social?.trim()) {
			errors.push('El impacto social es obligatorio');
			fieldsWithError.add('impacto_social');
			if (!firstErrorField) firstErrorField = 'impacto_social';
		}

		if (errors.length > 0) {
			error = errors.join('. ');
			// Scroll al primer campo con error
			if (firstErrorField) {
				setTimeout(() => {
					const element = document.getElementById(firstErrorField);
					if (element) {
						element.scrollIntoView({ behavior: 'smooth', block: 'center' });
						element.focus();
					}
				}, 100);
			}
			return false;
		}

		error = null;
		return true;
	}

	/**
	 * Validate Step 4: Participantes
	 */
	function validateStep4(): boolean {
		const errors: string[] = [];
		fieldsWithError.clear();

		if (!formData.participantes || formData.participantes.length === 0) {
			errors.push('Debes agregar al menos un participante');
			error = errors.join('. ');
			return false;
		}

		// Validar que cada participante tenga todos los campos
		for (let i = 0; i < formData.participantes.length; i++) {
			const p = formData.participantes[i];

			// Convertir a número si es string y validar
			const participanteId =
				typeof p.participante_id === 'string' ? parseInt(p.participante_id) : p.participante_id;
			const cargoId = typeof p.cargo_id === 'string' ? parseInt(p.cargo_id) : p.cargo_id;
			const regimenId =
				typeof p.regimen_dedicacion_id === 'string'
					? parseInt(p.regimen_dedicacion_id)
					: p.regimen_dedicacion_id;

			// Validar participante_id
			if (!participanteId || isNaN(participanteId) || participanteId <= 0) {
				errors.push(
					`El participante #${i + 1} debe tener un nombre válido. Selecciona uno de la lista.`
				);
				fieldsWithError.add(`participante-${i}`);
			}
			// Validar cargo_id
			if (!cargoId || isNaN(cargoId) || cargoId <= 0) {
				errors.push(`El participante #${i + 1} debe tener un cargo. Selecciona uno de la lista.`);
				fieldsWithError.add(`cargo-${i}`);
			}
			// Validar regimen_dedicacion_id
			if (!regimenId || isNaN(regimenId) || regimenId <= 0) {
				errors.push(
					`El participante #${
						i + 1
					} debe tener un régimen de dedicación. Selecciona uno de la lista.`
				);
				fieldsWithError.add(`regimen-${i}`);
			}
		}

		if (errors.length > 0) {
			error = errors.join('. ');
			// Scroll al primer participante con error
			setTimeout(() => {
				const element = document.querySelector('.participante-item.has-error');
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			}, 100);
			return false;
		}

		error = null;
		return true;
	}

	/**
	 * Navigate steps with validation
	 */
	function nextStep() {
		// Validar el paso actual antes de avanzar
		let isValid = false;

		switch (currentStep) {
			case 1:
				isValid = validateStep1();
				break;
			case 2:
				isValid = validateStep2();
				break;
			case 3:
				isValid = validateStep3();
				break;
			case 4:
				isValid = validateStep4();
				break;
			default:
				isValid = true;
		}

		if (isValid && currentStep < totalSteps) {
			currentStep++;
			// Scroll to top when changing steps
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function prevStep() {
		error = null; // Limpiar errores al retroceder
		if (currentStep > 1) {
			currentStep--;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	onMount(() => {
		fetchCatalogs();
	});

	$: if (institucionSearch !== undefined) {
		filterInstituciones();
	}

	$: if (tipoSearch !== undefined) {
		filterTipos();
	}

	$: if (areaSearch !== undefined) {
		filterAreas();
	}

	$: if (lineaSearch !== undefined) {
		filterLineas();
	}

	$: if (fuenteSearch !== undefined) {
		filterFuentes();
	}

	$: if (instituciones.length && !filteredInstituciones.length && !institucionSearch) {
		filteredInstituciones = instituciones;
	}
</script>

<svelte:head>
	<title>Nuevo Proyecto - Admin UYANA</title>
</svelte:head>

<div class="proyecto-form-page">
	<!-- Header -->
	<div class="page-header">
		<div class="header-content">
			<h1>Crear Nuevo Proyecto</h1>
			<p class="subtitle">Completa la información del proyecto de investigación</p>
		</div>
		<div class="header-actions">
			<a href="/admin/proyectos/tabla" class="btn-secondary">
				<span>←</span>
				Volver
			</a>
		</div>
	</div>

	<!-- Progress Steps -->
	<div class="progress-steps">
		<div class="step" class:active={currentStep === 1} class:completed={currentStep > 1}>
			<div class="step-number">1</div>
			<div class="step-label">Información Básica</div>
		</div>
		<div class="step-line" class:completed={currentStep > 1} />
		<div class="step" class:active={currentStep === 2} class:completed={currentStep > 2}>
			<div class="step-number">2</div>
			<div class="step-label">Clasificación</div>
		</div>
		<div class="step-line" class:completed={currentStep > 2} />
		<div class="step" class:active={currentStep === 3} class:completed={currentStep > 3}>
			<div class="step-number">3</div>
			<div class="step-label">Impacto</div>
		</div>
		<div class="step-line" class:completed={currentStep > 3} />
		<div class="step" class:active={currentStep === 4} class:completed={currentStep > 4}>
			<div class="step-number">4</div>
			<div class="step-label">Participantes</div>
		</div>
	</div>

	<!-- Success message -->
	{#if success}
		<div class="success-banner">
			<span>✓</span>
			<p>Proyecto creado exitosamente. Redirigiendo...</p>
		</div>
	{/if}

	<!-- Error message -->
	{#if error}
		<div class="error-banner">
			<p>{error}</p>
			<button on:click={() => (error = null)}>
				<span>✕</span>
			</button>
		</div>
	{/if}

	<!-- Form -->
	<form on:submit|preventDefault={handleSubmit} class="proyecto-form">
		<!-- Step 1: Información Básica -->
		{#if currentStep === 1}
			<div class="form-section">
				<h2>Información Básica del Proyecto</h2>

				<div class="form-grid">
					<div class="form-group" class:has-error={getFieldError('codigo')}>
						<label for="codigo">
							Código del Proyecto <span class="required">*</span>
						</label>
						<input
							id="codigo"
							type="text"
							bind:value={formData.codigo}
							placeholder="Ej: PROJ-2024-001"
							required
						/>
					</div>
					<div class="form-group" class:has-error={getFieldError('estado_id')}>
						<label for="estado">
							Estado <span class="required">*</span>
						</label>
						<select id="estado" bind:value={formData.estado_id} required>
							<option value={undefined}>Seleccionar estado</option>
							{#each estados as estado}
								<option value={estado.id}>{estado.nombre}</option>
							{/each}
						</select>
						{#if getFieldError('estado_id')}
							<span class="error-message">{getFieldError('estado_id')}</span>
						{/if}
					</div>
				</div>

				<div class="form-group full-width" class:has-error={getFieldError('titulo')}>
					<label for="titulo">
						Título del Proyecto <span class="required">*</span>
					</label>
					<input
						id="titulo"
						type="text"
						bind:value={formData.titulo}
						placeholder="Título descriptivo del proyecto"
						required
					/>
				</div>
				<div class="form-group full-width" class:has-error={getFieldError('objetivo')}>
					<label for="objetivo">
						Objetivo del Proyecto <span class="required">*</span>
					</label>
					<textarea
						id="objetivo"
						bind:value={formData.objetivo}
						placeholder="Describe el objetivo principal del proyecto"
						rows="4"
						required
					/>
				</div>
				<div class="form-grid">
					<div class="form-group" class:has-error={getFieldError('fecha_inicio')}>
						<label for="fecha_inicio">
							Fecha de Inicio <span class="required">*</span>
						</label>
						<input
							id="fecha_inicio"
							type="date"
							bind:value={formData.fecha_inicio_planeada}
							on:change={calculateMonths}
							required
						/>
					</div>
					<div class="form-group" class:has-error={getFieldError('fecha_fin')}>
						<label for="fecha_fin">
							Fecha de Fin <span class="required">*</span>
						</label>
						<input
							id="fecha_fin"
							type="date"
							bind:value={formData.fecha_fin_planeada}
							on:change={calculateMonths}
							required
						/>
					</div>
					<div class="form-group">
						<label for="meses">Duración (meses)</label>
						<input id="meses" type="number" bind:value={formData.cantidad_meses} min="1" readonly />
					</div>

					<div class="form-group" class:has-error={getFieldError('monto_presupuesto_total')}>
						<label for="presupuesto">
							Presupuesto Total (USD) <span class="required">*</span>
						</label>
						<input
							id="presupuesto"
							type="number"
							bind:value={formData.monto_presupuesto_total}
							min="0"
							step="0.01"
							placeholder="0.00"
							required
						/>
						{#if getFieldError('monto_presupuesto_total')}
							<span class="error-message">{getFieldError('monto_presupuesto_total')}</span>
						{/if}
					</div>
				</div>

				<div class="form-grid-checkbox">
					<div class="form-checkbox">
						<input id="requiere_aval" type="checkbox" bind:checked={formData.requiere_aval} />
						<label for="requiere_aval">Requiere aval institucional</label>
					</div>

					<div class="form-checkbox">
						<input id="para_siies" type="checkbox" bind:checked={formData.para_siies} />
						<label for="para_siies">Para SIIES</label>
					</div>
				</div>
			</div>
		{/if}

		<!-- Step 2: Clasificación -->
		{#if currentStep === 2}
			<div class="form-section">
				<h2>Clasificación del Proyecto</h2>

				<div class="form-group full-width">
					<label for="instituciones-search"
						>Instituciones Encargadas del Proyecto <span class="required">*</span></label
					>
					<div class="institucion-selector" class:error={getFieldError('instituciones')}>
						<div class="search-box">
							<input
								id="instituciones-search"
								type="text"
								placeholder="🔍 Buscar institución..."
								bind:value={institucionSearch}
							/>
							<button
								type="button"
								class="btn-create-inst"
								on:click={() => (showCreateInstitucionModal = true)}
							>
								<span>+</span>
								Crear Nueva
							</button>
						</div>

						<div class="instituciones-list">
							{#if filteredInstituciones.length === 0}
								<div class="empty-message">
									{institucionSearch
										? 'No se encontraron instituciones'
										: 'Cargando instituciones...'}
								</div>
							{:else}
								{#each filteredInstituciones as institucion}
									<label class="institucion-item">
										<input
											type="checkbox"
											value={institucion.id}
											checked={formData.instituciones_ids?.includes(institucion.id)}
											on:change={(e) => {
												if (e.currentTarget.checked) {
													formData.instituciones_ids = [
														...(formData.instituciones_ids || []),
														institucion.id
													];
												} else {
													formData.instituciones_ids =
														formData.instituciones_ids?.filter((id) => id !== institucion.id) || [];
												}
											}}
										/>
										<div class="institucion-info">
											<strong>{institucion.nombre}</strong>
											{#if institucion.sigla}
												<span class="sigla">({institucion.sigla})</span>
											{/if}
										</div>
									</label>
								{/each}
							{/if}
						</div>
					</div>
				</div>
				<div class="form-group full-width" class:has-error={getFieldError('tipos')}>
					<label for="tipos-search">Tipos de Proyecto <span class="required">*</span></label>
					<div class="institucion-selector" class:error={getFieldError('tipos')}>
						<div class="search-box">
							<input
								id="tipos-search"
								type="text"
								placeholder="🔍 Buscar tipo..."
								bind:value={tipoSearch}
							/>
							<button
								type="button"
								class="btn-create-inst"
								on:click={() => (showCreateTipoModal = true)}
							>
								<span>+</span>
								Crear Nuevo
							</button>
						</div>

						<div class="instituciones-list">
							{#if filteredTipos.length === 0}
								<div class="empty-message">
									{tipoSearch ? 'No se encontraron tipos' : 'Cargando tipos...'}
								</div>
							{:else}
								{#each filteredTipos as tipo}
									<label class="institucion-item">
										<input
											type="checkbox"
											value={tipo.id}
											checked={formData.tipos_ids?.includes(tipo.id)}
											on:change={(e) => {
												if (e.currentTarget.checked) {
													formData.tipos_ids = [...(formData.tipos_ids || []), tipo.id];
												} else {
													formData.tipos_ids =
														formData.tipos_ids?.filter((id) => id !== tipo.id) || [];
												}
											}}
										/>
										<div class="institucion-info">
											<strong>{tipo.nombre}</strong>
										</div>
									</label>
								{/each}
							{/if}
						</div>
					</div>
				</div>

				<div class="form-group full-width" class:has-error={getFieldError('areas')}>
					<label for="areas-search">Áreas de Conocimiento <span class="required">*</span></label>
					<div class="institucion-selector" class:error={getFieldError('areas')}>
						<div class="search-box">
							<input
								id="areas-search"
								type="text"
								placeholder="🔍 Buscar área..."
								bind:value={areaSearch}
							/>
							<button
								type="button"
								class="btn-create-inst"
								on:click={() => (showCreateAreaModal = true)}
							>
								<span>+</span>
								Crear Nueva
							</button>
						</div>

						<div class="instituciones-list">
							{#if filteredAreas.length === 0}
								<div class="empty-message">
									{areaSearch ? 'No se encontraron áreas' : 'Cargando áreas...'}
								</div>
							{:else}
								{#each filteredAreas as area}
									<label class="institucion-item">
										<input
											type="checkbox"
											value={area.id}
											checked={formData.areas_conocimiento_ids?.includes(area.id)}
											on:change={(e) => {
												if (e.currentTarget.checked) {
													formData.areas_conocimiento_ids = [
														...(formData.areas_conocimiento_ids || []),
														area.id
													];
												} else {
													formData.areas_conocimiento_ids =
														formData.areas_conocimiento_ids?.filter((id) => id !== area.id) || [];
												}
											}}
										/>
										<div class="institucion-info">
											<strong>{area.nombre}</strong>
										</div>
									</label>
								{/each}
							{/if}
						</div>
					</div>
				</div>

				<div class="form-group full-width" class:has-error={getFieldError('lineas')}>
					<label for="lineas-search">Líneas de Investigación <span class="required">*</span></label>
					<div class="institucion-selector" class:error={getFieldError('lineas')}>
						<div class="search-box">
							<input
								id="lineas-search"
								type="text"
								placeholder="🔍 Buscar línea..."
								bind:value={lineaSearch}
							/>
							<button
								type="button"
								class="btn-create-inst"
								on:click={() => (showCreateLineaModal = true)}
							>
								<span>+</span>
								Crear Nueva
							</button>
						</div>

						<div class="instituciones-list">
							{#if filteredLineas.length === 0}
								<div class="empty-message">
									{lineaSearch ? 'No se encontraron líneas' : 'Cargando líneas...'}
								</div>
							{:else}
								{#each filteredLineas as linea}
									<label class="institucion-item">
										<input
											type="checkbox"
											value={linea.id}
											checked={formData.lineas_investigacion_ids?.includes(linea.id)}
											on:change={(e) => {
												if (e.currentTarget.checked) {
													formData.lineas_investigacion_ids = [
														...(formData.lineas_investigacion_ids || []),
														linea.id
													];
												} else {
													formData.lineas_investigacion_ids =
														formData.lineas_investigacion_ids?.filter((id) => id !== linea.id) ||
														[];
												}
											}}
										/>
										<div class="institucion-info">
											<strong>{linea.nombre}</strong>
										</div>
									</label>
								{/each}
							{/if}
						</div>
					</div>
				</div>

				<div class="form-group full-width" class:has-error={getFieldError('fuentes')}>
					<label for="fuentes-search"
						>Fuentes de Financiamiento <span class="required">*</span></label
					>
					<div class="institucion-selector" class:error={getFieldError('fuentes')}>
						<div class="search-box">
							<input
								id="fuentes-search"
								type="text"
								placeholder="🔍 Buscar fuente..."
								bind:value={fuenteSearch}
							/>
							<button
								type="button"
								class="btn-create-inst"
								on:click={() => (showCreateFuenteModal = true)}
							>
								<span>+</span>
								Crear Nueva
							</button>
						</div>

						<div class="instituciones-list">
							{#if filteredFuentes.length === 0}
								<div class="empty-message">
									{fuenteSearch ? 'No se encontraron fuentes' : 'Cargando fuentes...'}
								</div>
							{:else}
								{#each filteredFuentes as fuente}
									<label class="institucion-item">
										<input
											type="checkbox"
											value={fuente.id}
											checked={formData.fuentes_financiamiento_ids?.includes(fuente.id)}
											on:change={(e) => {
												if (e.currentTarget.checked) {
													formData.fuentes_financiamiento_ids = [
														...(formData.fuentes_financiamiento_ids || []),
														fuente.id
													];
												} else {
													formData.fuentes_financiamiento_ids =
														formData.fuentes_financiamiento_ids?.filter((id) => id !== fuente.id) ||
														[];
												}
											}}
										/>
										<div class="institucion-info">
											<strong>{fuente.nombre}</strong>
										</div>
									</label>
								{/each}
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Step 3: Impacto -->
		{#if currentStep === 3}
			<div class="form-section">
				<h2>Impacto del Proyecto</h2>

				<div class="form-group full-width" class:has-error={getFieldError('impacto_cientifico')}>
					<label for="impacto_cientifico">
						Impacto Científico <span class="required">*</span>
					</label>
					<textarea
						id="impacto_cientifico"
						bind:value={formData.impacto_cientifico}
						placeholder="Describe el impacto científico esperado"
						rows="4"
						required
					/>
					{#if getFieldError('impacto_cientifico')}
						<span class="error-message">{getFieldError('impacto_cientifico')}</span>
					{/if}
				</div>

				<div class="form-group full-width" class:has-error={getFieldError('impacto_economico')}>
					<label for="impacto_economico">
						Impacto Económico <span class="required">*</span>
					</label>
					<textarea
						id="impacto_economico"
						bind:value={formData.impacto_economico}
						placeholder="Describe el impacto económico esperado"
						rows="4"
						required
					/>
					{#if getFieldError('impacto_economico')}
						<span class="error-message">{getFieldError('impacto_economico')}</span>
					{/if}
				</div>

				<div class="form-group full-width" class:has-error={getFieldError('impacto_social')}>
					<label for="impacto_social">
						Impacto Social <span class="required">*</span>
					</label>
					<textarea
						id="impacto_social"
						bind:value={formData.impacto_social}
						placeholder="Describe el impacto social esperado"
						rows="4"
						required
					/>
					{#if getFieldError('impacto_social')}
						<span class="error-message">{getFieldError('impacto_social')}</span>
					{/if}
				</div>

				<div class="form-group full-width">
					<label for="otros_impactos">Otros Impactos</label>
					<textarea
						id="otros_impactos"
						bind:value={formData.otros_impactos}
						placeholder="Describe otros impactos relevantes"
						rows="3"
					/>
				</div>
			</div>
		{/if}

		<!-- Step 4: Participantes -->
		{#if currentStep === 4}
			<div class="form-section">
				<div class="section-header-inline">
					<h2>Participantes del Proyecto</h2>
					<button type="button" class="btn-add" on:click={addParticipante}>
						<span>+</span>
						Agregar Participante
					</button>
				</div>

				{#if formData.participantes && formData.participantes.length > 0}
					<div class="participantes-list">
						{#each formData.participantes as participante, index}
							<div
								class="participante-item"
								class:has-error={getFieldError(`participante-${index}`) ||
									getFieldError(`cargo-${index}`) ||
									getFieldError(`regimen-${index}`)}
							>
								<div class="participante-header">
									<h4>Participante {index + 1}</h4>
									<button
										type="button"
										class="btn-remove"
										on:click={() => removeParticipante(index)}
									>
										<span>🗑️</span>
										Eliminar
									</button>
								</div>

								<div class="form-grid">
									<div
										class="form-group combobox-wrapper"
										class:has-error={getFieldError(`participante-${index}`)}
									>
										<label for="participante-{index}">Participante *</label>
										<input
											type="text"
											id="participante-{index}"
											bind:value={participanteSearches[index]}
											on:input={() => filterParticipantesForIndex(index)}
											on:focus={() => filterParticipantesForIndex(index)}
											on:blur={() => handleParticipanteBlur(index)}
											placeholder="🔍 Buscar participante..."
											required
										/>
										{#if showParticipanteDropdown[index]}
											<div class="combobox-dropdown" transition:slide={{ duration: 200 }}>
												{#each filteredParticipantesByIndex[index] || [] as p}
													<button
														type="button"
														class="combobox-option"
														on:click={() => selectParticipante(index, p.id)}
													>
														{p.nombre}
													</button>
												{/each}
											</div>
										{/if}
									</div>
									<div
										class="form-group combobox-wrapper"
										class:has-error={getFieldError(`cargo-${index}`)}
									>
										<label for="cargo-{index}">Cargo *</label>
										<input
											type="text"
											id="cargo-{index}"
											bind:value={cargoSearches[index]}
											on:input={() => filterCargosForIndex(index)}
											on:focus={() => filterCargosForIndex(index)}
											on:blur={() => handleCargoBlur(index)}
											placeholder="🔍 Buscar cargo..."
											required
										/>
										{#if showCargoDropdown[index]}
											<div class="combobox-dropdown" transition:slide={{ duration: 200 }}>
												{#each filteredCargosByIndex[index] || [] as cargo}
													<button
														type="button"
														class="combobox-option"
														on:click={() => selectCargo(index, cargo.id)}
													>
														{cargo.nombre}
													</button>
												{/each}
											</div>
										{/if}
									</div>

									<div
										class="form-group combobox-wrapper"
										class:has-error={getFieldError(`regimen-${index}`)}
									>
										<label for="regimen-{index}">Régimen de Dedicación *</label>
										<input
											type="text"
											id="regimen-{index}"
											bind:value={regimenSearches[index]}
											on:input={() => filterRegimenesForIndex(index)}
											on:focus={() => filterRegimenesForIndex(index)}
											on:blur={() => handleRegimenBlur(index)}
											placeholder="🔍 Buscar régimen..."
											required
										/>
										{#if showRegimenDropdown[index]}
											<div class="combobox-dropdown" transition:slide={{ duration: 200 }}>
												{#each filteredRegimenesByIndex[index] || [] as regimen}
													<button
														type="button"
														class="combobox-option"
														on:click={() => selectRegimen(index, regimen.id)}
													>
														{regimen.nombre}
													</button>
												{/each}
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-participantes">
						<p>No hay participantes asignados al proyecto</p>
						{#if participantes.length > 0}
							<p class="info-text">
								💡 Hay {participantes.length} participante{participantes.length !== 1 ? 's' : ''} disponible{participantes.length !==
								1
									? 's'
									: ''} en el sistema
							</p>
						{:else}
							<p class="warning-text">⚠️ No hay participantes registrados en el sistema</p>
						{/if}
						<button
							type="button"
							class="btn-primary"
							on:click={addParticipante}
							disabled={participantes.length === 0}
						>
							<span>+</span>
							Agregar Primer Participante
						</button>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Form Actions -->
		<div class="form-actions">
			<div class="actions-left">
				{#if currentStep > 1}
					<button type="button" class="btn-secondary" on:click={prevStep}>
						<span>←</span>
						Anterior
					</button>
				{/if}
			</div>

			<div class="actions-right">
				{#if currentStep < totalSteps}
					<button type="button" class="btn-primary" on:click={nextStep}>
						Siguiente
						<span>→</span>
					</button>
				{:else}
					<button type="submit" class="btn-success" disabled={loading}>
						{#if loading}
							<div class="spinner-sm" />
						{:else}
							<span>✓</span>
						{/if}
						Crear Proyecto
					</button>
				{/if}
			</div>
		</div>
	</form>
</div>

<!-- Modal: Create Institución -->
{#if showCreateInstitucionModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={() => (showCreateInstitucionModal = false)}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h3>Crear Nueva Institución</h3>
				<button
					type="button"
					class="btn-close"
					on:click={() => (showCreateInstitucionModal = false)}
				>
					✕
				</button>
			</div>

			<div class="modal-body">
				<div class="info-box">
					<div class="info-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="48"
							height="48"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
							<circle cx="12" cy="10" r="3" />
						</svg>
					</div>
					<h4>Ir al Módulo Geoespacial</h4>
					<p>
						Para crear una nueva institución, debes utilizar el módulo geoespacial donde podrás:
					</p>
					<ul>
						<li>📍 Ubicar la institución en el mapa</li>
						<li>📝 Ingresar todos los detalles</li>
						<li>🗺️ Definir coordenadas geográficas</li>
						<li>✅ Guardar y asociar al proyecto</li>
					</ul>
					<p class="note">
						<strong>Nota:</strong> Una vez creada la institución, regresa a esta página para seleccionarla.
					</p>
				</div>
			</div>

			<div class="modal-footer">
				<button
					type="button"
					class="btn-secondary"
					on:click={() => {
						showCreateInstitucionModal = false;
					}}
				>
					Cancelar
				</button>
				<button
					type="button"
					class="btn-primary"
					on:click={() => {
						goto('/admin/geoespacial');
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
						<circle cx="12" cy="10" r="3" />
					</svg>
					Ir al Módulo Geoespacial
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal: Crear Tipo -->
{#if showCreateTipoModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={() => (showCreateTipoModal = false)}>
		<div class="modal-content modal-simple" on:click|stopPropagation>
			<div class="modal-header">
				<h3>Crear Nuevo Tipo</h3>
				<button type="button" class="btn-close" on:click={() => (showCreateTipoModal = false)}>
					✕
				</button>
			</div>

			<div class="modal-body">
				{#if error}
					<div class="error-banner">
						<span>⚠</span>
						<p>{error}</p>
						<button on:click={() => (error = null)}>✕</button>
					</div>
				{/if}

				<div class="form-group">
					<label for="new-tipo-nombre">Nombre del Tipo <span class="required">*</span></label>
					<input
						id="new-tipo-nombre"
						type="text"
						bind:value={newTipo.nombre}
						placeholder="Ej: Investigación Aplicada, Desarrollo Tecnológico..."
						required
					/>
				</div>

				<div class="form-group">
					<label for="new-tipo-descripcion"
						>Descripción <span class="optional">(opcional)</span></label
					>
					<textarea
						id="new-tipo-descripcion"
						bind:value={newTipo.descripcion}
						placeholder="Agrega una descripción breve para ayudar a identificar este tipo de proyecto..."
						rows="3"
					/>
				</div>
			</div>

			<div class="modal-footer">
				<button
					type="button"
					class="btn-secondary"
					on:click={() => {
						showCreateTipoModal = false;
						newTipo = { nombre: '', descripcion: '' };
					}}
				>
					Cancelar
				</button>
				<button
					type="button"
					class="btn-primary"
					on:click={createTipo}
					disabled={loading || !newTipo.nombre}
				>
					{#if loading}
						<div class="spinner-sm" />
					{:else}
						<span>+</span>
					{/if}
					Crear Tipo
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal: Crear Área -->
{#if showCreateAreaModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={() => (showCreateAreaModal = false)}>
		<div class="modal-content modal-simple" on:click|stopPropagation>
			<div class="modal-header">
				<h3>Crear Nueva Área</h3>
				<button type="button" class="btn-close" on:click={() => (showCreateAreaModal = false)}>
					✕
				</button>
			</div>

			<div class="modal-body">
				{#if error}
					<div class="error-banner">
						<span>⚠</span>
						<p>{error}</p>
						<button on:click={() => (error = null)}>✕</button>
					</div>
				{/if}

				<div class="form-group">
					<label for="new-area-nombre">Nombre del Área <span class="required">*</span></label>
					<input
						id="new-area-nombre"
						type="text"
						bind:value={newArea.nombre}
						placeholder="Ej: Ciencias Sociales, Ingeniería..."
						required
					/>
				</div>
				<div class="form-group">
					<label for="new-area-descripcion"
						>Descripción <span class="optional">(opcional)</span></label
					>
					<textarea
						id="new-area-descripcion"
						bind:value={newArea.descripcion}
						placeholder="Agrega una descripción breve para ayudar a identificar esta área de conocimiento..."
						rows="3"
					/>
				</div>
			</div>

			<div class="modal-footer">
				<button
					type="button"
					class="btn-secondary"
					on:click={() => {
						showCreateAreaModal = false;
						newArea = { nombre: '', descripcion: '' };
					}}
				>
					Cancelar
				</button>
				<button
					type="button"
					class="btn-primary"
					on:click={createArea}
					disabled={loading || !newArea.nombre}
				>
					{#if loading}
						<div class="spinner-sm" />
					{:else}
						<span>+</span>
					{/if}
					Crear Área
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal: Crear Línea -->
{#if showCreateLineaModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={() => (showCreateLineaModal = false)}>
		<div class="modal-content modal-simple" on:click|stopPropagation>
			<div class="modal-header">
				<h3>Crear Nueva Línea</h3>
				<button type="button" class="btn-close" on:click={() => (showCreateLineaModal = false)}>
					✕
				</button>
			</div>

			<div class="modal-body">
				{#if error}
					<div class="error-banner">
						<span>⚠</span>
						<p>{error}</p>
						<button on:click={() => (error = null)}>✕</button>
					</div>
				{/if}

				<div class="form-group">
					<label for="new-linea-nombre">Nombre de la Línea <span class="required">*</span></label>
					<input
						id="new-linea-nombre"
						type="text"
						bind:value={newLinea.nombre}
						placeholder="Ej: Desarrollo Sostenible, Biotecnología..."
						required
					/>
				</div>
				<div class="form-group">
					<label for="new-linea-descripcion"
						>Descripción <span class="optional">(opcional)</span></label
					>
					<textarea
						id="new-linea-descripcion"
						bind:value={newLinea.descripcion}
						placeholder="Agrega una descripción breve para ayudar a identificar esta línea de investigación..."
						rows="3"
					/>
				</div>
			</div>

			<div class="modal-footer">
				<button
					type="button"
					class="btn-secondary"
					on:click={() => {
						showCreateLineaModal = false;
						newLinea = { nombre: '', descripcion: '' };
					}}
				>
					Cancelar
				</button>
				<button
					type="button"
					class="btn-primary"
					on:click={createLinea}
					disabled={loading || !newLinea.nombre}
				>
					{#if loading}
						<div class="spinner-sm" />
					{:else}
						<span>+</span>
					{/if}
					Crear Línea
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal: Crear Fuente -->
{#if showCreateFuenteModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={() => (showCreateFuenteModal = false)}>
		<div class="modal-content modal-simple" on:click|stopPropagation>
			<div class="modal-header">
				<h3>Crear Nueva Fuente</h3>
				<button type="button" class="btn-close" on:click={() => (showCreateFuenteModal = false)}>
					✕
				</button>
			</div>

			<div class="modal-body">
				{#if error}
					<div class="error-banner">
						<span>⚠</span>
						<p>{error}</p>
						<button on:click={() => (error = null)}>✕</button>
					</div>
				{/if}

				<div class="form-group">
					<label for="new-fuente-nombre">Nombre de la Fuente <span class="required">*</span></label>
					<input
						id="new-fuente-nombre"
						type="text"
						bind:value={newFuente.nombre}
						placeholder="Ej: Fondos Públicos, Donaciones Internacionales..."
						required
					/>
				</div>
				<div class="form-group">
					<label for="new-fuente-descripcion"
						>Descripción <span class="optional">(opcional)</span></label
					>
					<textarea
						id="new-fuente-descripcion"
						bind:value={newFuente.descripcion}
						placeholder="Agrega una descripción breve para ayudar a identificar esta fuente de financiamiento..."
						rows="3"
					/>
				</div>
			</div>

			<div class="modal-footer">
				<button
					type="button"
					class="btn-secondary"
					on:click={() => {
						showCreateFuenteModal = false;
						newFuente = { nombre: '', descripcion: '' };
					}}
				>
					Cancelar
				</button>
				<button
					type="button"
					class="btn-primary"
					on:click={createFuente}
					disabled={loading || !newFuente.nombre}
				>
					{#if loading}
						<div class="spinner-sm" />
					{:else}
						<span>+</span>
					{/if}
					Crear Fuente
				</button>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.proyecto-form-page {
		padding: 2rem;
		max-width: 1200px;
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

	// ==================== Progress Steps ====================
	.progress-steps {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 3rem;
		padding: 2rem;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;

		.step {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.5rem;

			.step-number {
				width: 40px;
				height: 40px;
				border-radius: 50%;
				background: rgba(var(--color--text-rgb), 0.08);
				color: var(--color--text-shade);
				display: flex;
				align-items: center;
				justify-content: center;
				font-weight: 600;
				transition: all 0.3s ease;
			}

			.step-label {
				font-size: 0.875rem;
				color: var(--color--text-shade);
				text-align: center;
				transition: all 0.3s ease;
			}

			&.active {
				.step-number {
					background: var(--color--primary);
					color: white;
				}

				.step-label {
					color: var(--color--primary);
					font-weight: 500;
				}
			}

			&.completed {
				.step-number {
					background: rgba(var(--color--primary-rgb), 0.2);
					color: var(--color--primary);
				}

				.step-label {
					color: var(--color--text-shade);
				}
			}
		}

		.step-line {
			flex: 1;
			height: 2px;
			background: rgba(var(--color--text-rgb), 0.15);
			margin: 0 1rem;
			max-width: 120px;
			transition: all 0.3s ease;

			&.completed {
				background: var(--color--primary);
			}
		}
	}

	// ==================== Banners ====================
	.success-banner,
	.error-banner {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;

		p {
			flex: 1;
			margin: 0;
			font-size: 0.875rem;
		}
	}

	.success-banner {
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.3);
		color: #10b981;

		span {
			font-size: 1.5rem;
		}
	}

	.error-banner {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;

		button {
			background: none;
			border: none;
			cursor: pointer;
			padding: 4px;
			display: flex;
			align-items: center;
			font-size: 1.25rem;
			color: #ef4444;

			&:hover {
				opacity: 0.8;
			}
		}
	}

	// ==================== Form ====================
	.proyecto-form {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		padding: 2rem;
	}

	.form-section {
		h2 {
			font-size: 1.5rem;
			font-weight: 600;
			color: var(--color--text);
			margin: 0 0 2rem 0;
		}
	}

	.section-header-inline {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;

		h2 {
			margin: 0;
		}
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.form-grid-checkbox {
		display: flex;
		gap: 2rem;
		margin-bottom: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		&.full-width {
			grid-column: 1 / -1;
		}

		&.has-error {
			input,
			textarea,
			select {
				border-color: #ef4444;
			}
		}

		label {
			font-size: 0.875rem;
			font-weight: 500;
			color: var(--color--text-shade);

			.required {
				color: #ef4444;
				margin-left: 0.25rem;
			}
		}

		input,
		textarea,
		select {
			padding: 0.75rem 1rem;
			background: rgba(var(--color--text-rgb), 0.03);
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			border-radius: 6px;
			color: var(--color--text);
			font-size: 0.875rem;
			font-family: inherit;
			transition: all 0.15s ease;

			&:focus {
				outline: none;
				border-color: var(--color--primary);
			}

			&:disabled,
			&:read-only {
				opacity: 0.6;
				cursor: not-allowed;
			}

			&::placeholder {
				color: var(--color--text-shade);
			}
		}

		textarea {
			resize: vertical;
			min-height: 100px;
			line-height: 1.5;
		}

		select {
			cursor: pointer;
		}

		input[type='date'] {
			position: relative;
			color-scheme: light dark;

			&::-webkit-calendar-picker-indicator {
				cursor: pointer;
				filter: invert(0.5);
			}
		}
	}

	.form-checkbox {
		display: flex;
		align-items: center;
		gap: 0.75rem;

		input[type='checkbox'] {
			width: 18px;
			height: 18px;
			cursor: pointer;
			accent-color: var(--color--primary);
		}

		label {
			font-size: 0.875rem;
			color: var(--color--text);
			cursor: pointer;
			margin: 0;
		}
	}

	.error-message {
		font-size: 0.8125rem;
		color: #ef4444;
	}

	// ==================== Instituci\u00f3n Selector ====================
	.institucion-selector {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		&.error {
			.instituciones-list {
				border-color: #ef4444;
				box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
			}
		}

		.search-box {
			display: flex;
			gap: 0.75rem;

			input {
				flex: 1;
				padding: 0.75rem;
				background: rgba(var(--color--text-rgb), 0.03);
				border: 1px solid rgba(var(--color--text-rgb), 0.15);
				border-radius: 6px;
				color: var(--color--text);
				font-size: 0.875rem;

				&::placeholder {
					color: var(--color--text-shade);
				}

				&:focus {
					outline: none;
					border-color: var(--color--primary);
				}
			}

			.btn-create-inst {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				padding: 0.75rem 1rem;
				background: var(--color--primary);
				color: white;
				border: none;
				border-radius: 6px;
				font-weight: 600;
				font-size: 0.875rem;
				cursor: pointer;
				white-space: nowrap;
				transition: all 0.2s ease;

				span {
					font-size: 1.25rem;
					font-weight: bold;
				}

				&:hover {
					background: #059669;
					transform: translateY(-1px);
				}
			}
		}

		.instituciones-list {
			max-height: 300px;
			overflow-y: auto;
			background: rgba(var(--color--text-rgb), 0.03);
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			border-radius: 6px;
			padding: 0.5rem;

			&::-webkit-scrollbar {
				width: 8px;
			}

			&::-webkit-scrollbar-track {
				background: rgba(var(--color--text-rgb), 0.03);
				border-radius: 4px;
			}

			&::-webkit-scrollbar-thumb {
				background: rgba(var(--color--text-rgb), 0.15);
				border-radius: 4px;

				&:hover {
					background: rgba(var(--color--text-rgb), 0.25);
				}
			}

			.empty-message {
				padding: 2rem;
				text-align: center;
				color: var(--color--text-shade);
				font-size: 0.875rem;
			}

			.institucion-item {
				display: flex;
				align-items: center;
				gap: 0.75rem;
				padding: 0.875rem 0.75rem;
				border: 1px solid transparent;
				border-radius: 6px;
				cursor: pointer;
				transition: all 0.2s ease;
				margin-bottom: 0.25rem;

				&:hover {
					background: rgba(var(--color--text-rgb), 0.05);
					border-color: rgba(var(--color--text-rgb), 0.2);
				}

				&:has(input:checked) {
					background: rgba(var(--color--primary-rgb), 0.08);
					border-color: var(--color--primary);
				}

				input[type='checkbox'] {
					width: 20px;
					height: 20px;
					cursor: pointer;
					accent-color: var(--color--primary);
					flex-shrink: 0;
					transition: transform 0.15s ease;

					&:hover {
						transform: scale(1.1);
					}

					&:checked {
						transform: scale(1.05);
					}
				}

				.institucion-info {
					flex: 1;
					display: flex;
					align-items: center;
					gap: 0.5rem;

					strong {
						color: var(--color--text);
						font-size: 0.875rem;
						font-weight: 500;
					}

					.sigla {
						color: var(--color--text-shade);
						font-size: 0.8125rem;
						font-weight: 400;
					}
				}
			}
		}
	}

	// ==================== Participantes ====================
	.participantes-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.participante-item {
		padding: 1.5rem;
		background: rgba(var(--color--text-rgb), 0.03);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		transition: all 0.2s ease;

		&.has-error {
			border-color: #ef4444;
			box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
		}

		.participante-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 1.5rem;

			h4 {
				font-size: 1rem;
				font-weight: 600;
				color: var(--color--primary);
				margin: 0;
			}
		}
	}

	.empty-participantes {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 2rem;
		background: rgba(var(--color--text-rgb), 0.03);
		border: 2px dashed rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		gap: 1rem;

		p {
			color: var(--color--text-shade);
			margin: 0;
			text-align: center;
		}

		.info-text {
			font-size: 0.875rem;
			color: var(--color--primary);
			padding: 0.5rem 1rem;
			background: rgba(var(--color--primary-rgb), 0.1);
			border-radius: 4px;
		}

		.warning-text {
			font-size: 0.875rem;
			color: #f59e0b;
			padding: 0.5rem 1rem;
			background: rgba(245, 158, 11, 0.1);
			border-radius: 4px;
		}
	}

	// ==================== Form Actions ====================
	.form-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.15);

		.actions-left,
		.actions-right {
			display: flex;
			gap: 0.75rem;
		}
	}

	// ==================== Buttons ====================
	.btn-primary,
	.btn-secondary,
	.btn-success,
	.btn-add,
	.btn-remove {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
		text-decoration: none;
		border: none;
		font-family: inherit;

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.btn-primary {
		background: var(--color--primary);
		color: white;

		&:hover:not(:disabled) {
			background: #059669;
			filter: brightness(0.95);
		}
	}

	.btn-secondary {
		background: rgba(var(--color--text-rgb), 0.08);
		color: var(--color--text);

		&:hover:not(:disabled) {
			background: rgba(var(--color--text-rgb), 0.15);
		}
	}

	.btn-success {
		background: var(--color--primary);
		color: white;
		font-weight: 600;

		&:hover:not(:disabled) {
			background: #059669;
			filter: brightness(0.95);
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(var(--color--primary-rgb), 0.3);
		}
	}

	.btn-add {
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid #10b981;
		color: #10b981;

		&:hover {
			background: rgba(16, 185, 129, 0.2);
		}
	}

	.btn-remove {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid #ef4444;
		color: #ef4444;
		padding: 0.5rem 1rem;

		&:hover {
			background: rgba(239, 68, 68, 0.2);
		}
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

	// ==================== Responsive ====================
	@media (max-width: 768px) {
		.proyecto-form-page {
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

		.progress-steps {
			padding: 1rem;

			.step {
				.step-number {
					width: 32px;
					height: 32px;
					font-size: 0.875rem;
				}

				.step-label {
					font-size: 0.75rem;
				}
			}

			.step-line {
				max-width: 60px;
				margin: 0 0.5rem;
			}
		}

		.proyecto-form {
			padding: 1.5rem 1rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.form-grid-checkbox {
			flex-direction: column;
			gap: 1rem;
		}

		.form-actions {
			flex-direction: column;
			gap: 1rem;

			.actions-left,
			.actions-right {
				width: 100%;

				button {
					flex: 1;
				}
			}
		}

		.section-header-inline {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;

			.btn-add {
				justify-content: center;
			}
		}
	}

	// ==================== Modal ====================
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		max-width: 700px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: var(--card-shadow);

		&.modal-simple {
			max-width: 500px;
		}

		&::-webkit-scrollbar {
			width: 8px;
		}

		&::-webkit-scrollbar-track {
			background: rgba(var(--color--text-rgb), 0.03);
		}

		&::-webkit-scrollbar-thumb {
			background: rgba(var(--color--text-rgb), 0.15);
			border-radius: 4px;

			&:hover {
				background: rgba(var(--color--text-rgb), 0.25);
			}
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.15);

		h3 {
			margin: 0;
			font-size: 1.25rem;
			font-weight: 600;
			color: var(--color--text);
		}

		.btn-close {
			background: none;
			border: none;
			color: var(--color--text-shade);
			font-size: 1.5rem;
			cursor: pointer;
			padding: 0.25rem 0.5rem;
			line-height: 1;
			transition: color 0.2s ease;

			&:hover {
				color: var(--color--text);
			}
		}
	}

	.modal-body {
		padding: 1rem;

		.info-box {
			text-align: center;
			padding: 1.25rem;
			background: transparent;
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			border-radius: 8px;

			.info-icon {
				margin: 0 auto 1rem;
				width: 48px;
				height: 48px;
				display: flex;
				align-items: center;
				justify-content: center;
				background: rgba(var(--color--text-rgb), 0.08);
				border-radius: 50%;

				svg {
					color: var(--color--text-shade);
				}
			}

			h4 {
				font-size: 1.125rem;
				font-weight: 600;
				color: var(--color--text);
				margin: 0 0 0.75rem 0;
			}

			p {
				font-size: 0.9rem;
				color: #a0aec0;
				line-height: 1.5;
				margin: 0 0 1rem 0;
			}

			ul {
				text-align: left;
				list-style: none;
				padding: 0;
				margin: 0 0 1rem 0;
				max-width: 400px;
				margin-left: auto;
				margin-right: auto;

				li {
					padding: 0.5rem 0.75rem;
					margin-bottom: 0.375rem;
					background: rgba(var(--color--text-rgb), 0.03);
					border: 1px solid rgba(var(--color--text-rgb), 0.15);
					border-radius: 6px;
					color: var(--color--text);
					font-size: 0.875rem;
					transition: all 0.2s;

					&:hover {
						background: rgba(var(--color--text-rgb), 0.08);
						border-color: rgba(var(--color--text-rgb), 0.25);
					}
				}
			}

			.note {
				background: rgba(251, 191, 36, 0.1);
				border: 1px solid rgba(251, 191, 36, 0.3);
				border-radius: 6px;
				padding: 0.75rem;
				font-size: 0.8125rem;
				color: #fbbf24;
				margin: 0;

				strong {
					color: #fbbf24;
				}
			}
		}
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.15);

		button {
			padding: 0.75rem 1.5rem;
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;

			svg {
				width: 16px;
				height: 16px;
			}
		}
	}

	/* Combobox personalizado */
	.combobox-wrapper {
		position: relative;
	}

	.combobox-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		max-height: 200px;
		overflow-y: auto;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-top: none;
		border-radius: 0 0 6px 6px;
		box-shadow: var(--card-shadow);
		z-index: 1000;
		margin-top: -1px;

		&::-webkit-scrollbar {
			width: 6px;
		}

		&::-webkit-scrollbar-track {
			background: rgba(var(--color--text-rgb), 0.03);
		}

		&::-webkit-scrollbar-thumb {
			background: rgba(var(--color--text-rgb), 0.15);
			border-radius: 3px;

			&:hover {
				background: rgba(var(--color--text-rgb), 0.25);
			}
		}
	}

	.combobox-option {
		width: 100%;
		padding: 0.625rem 0.875rem;
		text-align: left;
		background: none;
		border: none;
		color: var(--color--text);
		font-size: 0.875rem;
		cursor: pointer;
		transition: background-color 0.15s ease;

		&:hover {
			background: rgba(var(--color--text-rgb), 0.08);
		}

		&:active {
			background: rgba(var(--color--text-rgb), 0.15);
		}
	}
</style>
