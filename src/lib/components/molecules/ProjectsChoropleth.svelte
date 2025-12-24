<!-- src/lib/components/molecules/ProjectsChoropleth.svelte -->
<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type { Map, LatLng } from 'leaflet';
	import GeoJsonChoropleth from '$lib/components/atoms/GeoJsonChoropleth.svelte';
	// Solo usamos el tipo Proyecto para los proyectos filtrados
	import type { Proyecto } from '$lib/services/proyectosService';
	// NUEVO: usamos tu servicio nuevo
	import { ProjectService } from '$lib/services/project.service';
	import type { MapLevel, ProjectMapModel } from '$lib/models/map.model';
	import PopupDashboard from '$lib/components/atoms/PopupDashboard.svelte';
	import FacultadRankingLayer from '$lib/components/atoms/FacultadRankingLayer.svelte';

	const dispatch = createEventDispatcher();

	export let map: Map | null = null;
	//export const proyectos: Proyecto[] = []; // Convertido a const para evitar advertencia de exportación no utilizada
	export let proyectos: Proyecto[] = [];
	export let filteredProyectos: Proyecto[] = [];
	export let highlightedFacultad: string | null = null; // Facultad que debe ser destacada

	// Nivel actual del mapa (por ahora siempre facultad)
	export let mapLevel: MapLevel = 'faculty';
	// Indica si el padre tiene filtros activos (filteredProyectos != todos)
	export let hasActiveFilters: boolean = false;
	export let externalValueById: Record<string, number> | null = null;

	// Mapa de centroides de facultades
	let centroides: Record<string, [number, number]> = {};
	let rankingData: { facultad: string; cantidad: number; center: [number, number] }[] = [];

	// Referencia al componente GeoJsonChoropleth para acceder a sus métodos
	let geoJsonInstance: any;
	// Datos para la coropleta
	let proyectosPorFacultad: { facultad: string; cantidad: number }[] = [];
	let valueById: Record<string, number> = {};
	let dashboards: { facultad: string; tipo: string; side: 'left' | 'right' }[] = [];
	//GeoJSON que viene desde la base de datos (vía ProjectService)
	let geoJsonData: any = null;

	// Sistema de memoización para evitar recálculos innecesarios
	let memoizedFilteredProyectos = {
		key: '',
		data: {} as Record<string, number>
	};
	centroides = {};
	rankingData = [];

	$: {
		rankingData = Object.entries(valueById)
			.map(([facultad, cantidad]) => {
				const center = centroides[facultad];
				if (!center) return null; // si no hay centro, no dibujamos marcador
				return { facultad, cantidad, center };
			})
			.filter(
				(d): d is { facultad: string; cantidad: number; center: [number, number] } => d !== null
			);
	}

	// Cargamos los datos al iniciar
	onMount(async () => {
		await cargarDatos(mapLevel);
	});

	// Cuando cambie el nivel del mapa (faculty ↔ institution), recargamos datos
	let lastLevel: MapLevel | null = null;
	$: if (mapLevel && mapLevel !== lastLevel) {
		lastLevel = mapLevel;
		cargarDatos(mapLevel);
	}

	// Función para normalizar nombres de facultades para que coincidan con los del GeoJSON
	// Función para normalizar nombres de facultades para que coincidan con los del GeoJSON
	function normalizarNombreFacultad(nombre: string): string {
		if (!nombre) return 'No especificada';

		// Pasamos todo a minúsculas para normalizar
		let s = nombre.trim().toLowerCase();

		// Quitamos prefijos "facultad de" o "facultad"
		s = s.replace(/^facultad\s+de\s+/, '');
		s = s.replace(/^facultad\s+/, '');

		// Normalizamos espacios
		s = s.replace(/\s+/g, ' ');

		// Capitalizamos cada palabra ("ciencias agrícolas" → "Ciencias Agrícolas")
		const title = s
			.split(' ')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');

		// Formato final que debe coincidir con el GeoJSON:
		// "Facultad De Ciencias Agrícolas"
		return `Facultad De ${title}`;
	}
	// 🔹 Helper genérico: devuelve la clave que se usa tanto para el GeoJSON
	// como para el valueById, dependiendo del nivel del mapa
	function getEntityKey(level: MapLevel, rawName?: string | null): string {
		if (!rawName) return 'No especificado';

		const trimmed = rawName.trim();

		if (level === 'faculty') {
			// Facultades -> usamos la normalización que ya tenías
			return normalizarNombreFacultad(trimmed);
		}

		// Instituciones -> por ahora solo recortamos espacios
		return trimmed;
	}

	// Función para cargar datos de proyectos por facultad
	async function cargarDatos(level: MapLevel) {
		try {
			// 1) Traemos los datos agregados para el nivel actual
			const filas = await ProjectService.getProjectsForMap(level);

			// 2) Adaptamos al formato interno que ya usabas
			proyectosPorFacultad = filas.map((row) => ({
				facultad: row.titulo, // nombre de la facultad o institución
				cantidad: row.projectCount // número de proyectos
			}));
			// Usamos el helper genérico para obtener la clave según el nivel
			const getKey = (rowTitle: string): string => getEntityKey(level, rowTitle);

			// 3) valueById → se usa para colorear el mapa
			valueById = {};
			proyectosPorFacultad.forEach((item) => {
				const key = getKey(item.facultad);
				valueById[key] = item.cantidad;
			});

			// 4) Construimos el GeoJSON dinámico desde `filas`
			const allowedGeomTypes = [
				'Polygon',
				'MultiPolygon',
				'Point',
				'MultiPoint',
				'LineString',
				'MultiLineString'
			];

			const features = filas
				.filter((row) => !!row.geometry)
				.map((row) => {
					let geomRaw: any = row.geometry;

					// Si viene como string, intentamos parsear
					if (typeof geomRaw === 'string') {
						try {
							geomRaw = JSON.parse(geomRaw);
						} catch (e) {
							console.error('No se pudo parsear geometry JSON:', geomRaw, e);
							return null;
						}
					}

					// Asegurarnos de tener un objeto GeoJSON válido
					if (geomRaw.type && geomRaw.coordinates) {
						// ok
					} else if (geomRaw.geometry && geomRaw.geometry.type && geomRaw.geometry.coordinates) {
						geomRaw = geomRaw.geometry;
					} else {
						console.warn('Geometry con formato no esperado, se ignora:', geomRaw);
						return null;
					}
					// ⚠️ Normalizar type a formato estándar GeoJSON (mayúscula inicial)
					if (typeof geomRaw.type === 'string') {
						const t = geomRaw.type.toLowerCase();

						if (t === 'polygon') geomRaw.type = 'Polygon';
						else if (t === 'multipolygon') geomRaw.type = 'MultiPolygon';
						else if (t === 'point') geomRaw.type = 'Point';
						else if (t === 'multipoint') geomRaw.type = 'MultiPoint';
						else if (t === 'linestring') geomRaw.type = 'LineString';
						else if (t === 'multilinestring') geomRaw.type = 'MultiLineString';
					}

					// ⚠️ Validación extra: tipo soportado por Leaflet
					if (!allowedGeomTypes.includes(geomRaw.type)) {
						console.warn(
							`Geometry con tipo no soportado (${geomRaw.type}), se ignora. row.id=${row.id}, level=${level}`
						);
						return null;
					}

					const key = getKey(row.titulo);

					return {
						type: 'Feature',
						geometry: geomRaw,
						properties: {
							id: row.id,
							facultad_o_entidad_o_area_responsable: key,
							projectCount: row.projectCount ?? 0,
							level: row.level ?? level
						}
					};
				})
				.filter((f) => f !== null);

			geoJsonData = {
				type: 'FeatureCollection',
				features
			};

			console.log('GeoJSON generado para mapa', level, geoJsonData);
			if (level === 'institution') {
				// Log más detallado para depuración
				try {
					console.log(
						'Ejemplo geometry institución:',
						JSON.stringify(geoJsonData.features[0]?.geometry, null, 2)
					);
				} catch (e) {
					console.error('No se pudo inspeccionar geometry de institution:', e);
				}
			}

			// === estadísticas (tu lógica de antes) ===
			if (proyectosPorFacultad.length > 0) {
				const cantidades = proyectosPorFacultad.map((p) => p.cantidad);
				const minProyectos = Math.min(...cantidades);
				const maxProyectos = Math.max(...cantidades);
				const avgProyectos = cantidades.reduce((a, b) => a + b, 0) / cantidades.length;
				const facultadMax =
					proyectosPorFacultad.find((p) => p.cantidad === maxProyectos)?.facultad || 'Desconocida';

				console.info(
					`Estadísticas: Min=${minProyectos}, Max=${maxProyectos} (${facultadMax}), Promedio=${avgProyectos.toFixed(
						1
					)}`
				);
				console.info(
					`Total entidades: ${proyectosPorFacultad.length}, Total proyectos: ${cantidades.reduce(
						(a, b) => a + b,
						0
					)}`
				);
			}
		} catch (error) {
			console.error('Error al cargar datos de proyectos para el mapa:', error);
			dispatch('dataError', {
				message: 'No se pudieron cargar los datos de proyectos',
				error: error instanceof Error ? error.message : 'Error desconocido'
			});
		}
	}

	// Función para calcular el promedio de duración de proyectos en meses
	function calcularPromedioDuracion(proyectos: Proyecto[]): string {
		if (!proyectos.length) return 'N/A';

		let duracionTotal = 0;
		let proyectosConDuracion = 0;

		proyectos.forEach((p) => {
			if (p.fecha_inicio && p.fecha_fin_planeado) {
				// Convertir fechas (suponiendo formato DD/MM/YYYY)
				const [diaInicio, mesInicio, anioInicio] = p.fecha_inicio.split('/').map(Number);
				const [diaFin, mesFin, anioFin] = p.fecha_fin_planeado.split('/').map(Number);

				if (
					!isNaN(diaInicio) &&
					!isNaN(mesInicio) &&
					!isNaN(anioInicio) &&
					!isNaN(diaFin) &&
					!isNaN(mesFin) &&
					!isNaN(anioFin)
				) {
					const fechaInicio = new Date(anioInicio, mesInicio - 1, diaInicio);
					const fechaFin = new Date(anioFin, mesFin - 1, diaFin);

					// Calcular diferencia en meses
					const diffMeses =
						(fechaFin.getFullYear() - fechaInicio.getFullYear()) * 12 +
						(fechaFin.getMonth() - fechaInicio.getMonth());

					if (diffMeses > 0) {
						duracionTotal += diffMeses;
						proyectosConDuracion++;
					}
				}
			}
		});

		return proyectosConDuracion > 0 ? (duracionTotal / proyectosConDuracion).toFixed(1) : 'N/A';
	}

	// Función personalizada para el popup
	function formatPopup(props: any, id: string, value: number | null): string {
		const facultad = props?.facultad_o_entidad_o_area_responsable || id || 'Entidad';
		const icono = props?.icono || '🎓';
		const cantidad = value ?? 0;
		const level: MapLevel = props?.level || mapLevel;
		// 🔹 Elegimos la lista base:
		//    - si hay proyectos filtrados → usamos esos
		//    - si no → usamos TODOS los proyectos que recibe el componente
		const listaBase: Proyecto[] = filteredProyectos.length > 0 ? filteredProyectos : proyectos;
		// 🔹 Proyectos asociados a esta entidad (facultad o institución)
		let proyectosEntidad: Proyecto[] = [];
		if (listaBase.length > 0) {
			if (level === 'faculty') {
				const keyPopup = getEntityKey('faculty', facultad);
				proyectosEntidad = listaBase.filter((p) => {
					const raw = p.facultad_o_entidad_o_area_responsable || '';
					return getEntityKey('faculty', raw) === keyPopup;
				});
			} else {
				const keyPopup = getEntityKey('institution', facultad);
				proyectosEntidad = listaBase.filter((p: any) => {
					const nombres: string[] =
						Array.isArray(p.instituciones_relacionadas) && p.instituciones_relacionadas.length > 0
							? p.instituciones_relacionadas
							: [p.institucion || ''];

					return nombres.some((nombre) => getEntityKey('institution', nombre) === keyPopup);
				});
			}
		}

		// Datos estadísticos adicionales
		const proyectosActivos = proyectosEntidad.filter((p) => p.estado === 'En ejecución').length;
		const proyectosCierre = proyectosEntidad.filter((p) => p.estado === 'En cierre').length;
		const proyectosCerrados = proyectosEntidad.filter(
			(p) => p.estado !== 'En ejecución' && p.estado !== 'En cierre'
		).length;

		// Determinamos el color según el número de proyectos
		const colorClass = cantidad > 15 ? 'high' : cantidad > 7 ? 'medium' : 'low';

		// Mostrar los proyectos más recientes primero (ordenados por fecha)
		const proyectosOrdenados = [...proyectosEntidad].sort((a, b) => {
			const fechaA = a.fecha_inicio ? a.fecha_inicio.split('/').reverse().join('') : '';
			const fechaB = b.fecha_inicio ? b.fecha_inicio.split('/').reverse().join('') : '';
			return fechaB.localeCompare(fechaA);
		});

		// Determinar el número óptimo de proyectos a mostrar (adaptativo)
		const maxProyectos = cantidad > 10 ? 2 : 3;

		// 🔹 Comparación institucional (Esta entidad vs promedio general)
		const promedioUCE =
			proyectos.length > 0 ? proyectos.length / (proyectosPorFacultad.length || 1) : 0;

		// Evitar división por cero
		const ratio = promedioUCE > 0 ? cantidad / promedioUCE : 0;

		// Porcentaje vs promedio (ej: +100%)
		const porcentaje = promedioUCE > 0 ? Math.round((cantidad / promedioUCE - 1) * 100) : 0;

		// Texto y flecha
		const flecha = porcentaje > 0 ? '↑' : porcentaje < 0 ? '↓' : '→';
		const textoComparacion =
			porcentaje > 0
				? `${flecha} +${porcentaje}% sobre el promedio`
				: porcentaje < 0
				? `${flecha} ${porcentaje}% bajo el promedio`
				: `${flecha} Igual al promedio`;

		// Barras proporcionales (máximo = la mayor de las dos)
		const maxBarBase = Math.max(cantidad, promedioUCE, 1);
		const barFacultad = Math.round((cantidad / maxBarBase) * 100);
		const barPromedio = Math.round((promedioUCE / maxBarBase) * 100);

		const comparacionHTML = `
  <div class="comparacion-block">
    <h4>Comparación institucional</h4>

    <div class="comparacion-row">
      <span class="comparacion-label">Esta entidad</span>
      <div class="comparacion-bar">
        <div class="comparacion-fill facultad" style="width: ${barFacultad}%"></div>
      </div>
      <span class="comparacion-value">${cantidad}</span>
    </div>

    <div class="comparacion-row">
      <span class="comparacion-label">Promedio UCE</span>
      <div class="comparacion-bar">
        <div class="comparacion-fill promedio" style="width: ${barPromedio}%"></div>
      </div>
      <span class="comparacion-value">${promedioUCE.toFixed(1)}</span>
    </div>

    <div class="comparacion-footer">${textoComparacion}</div>
  </div>
`;

		// Gráfico simple de distribución de estados
		const distribucionEstados =
			proyectosEntidad.length > 0
				? `
		<div class="distribucion-wrapper" aria-label="Distribución de proyectos por estado">
			<div class="distribucion-chart">
				<div class="barra barra-activo" style="width: ${
					proyectosEntidad.length > 0 ? (proyectosActivos / proyectosEntidad.length) * 100 : 0
				}%" title="En ejecución: ${proyectosActivos}"></div>
				<div class="barra barra-cierre" style="width: ${
					proyectosEntidad.length > 0 ? (proyectosCierre / proyectosEntidad.length) * 100 : 0
				}%" title="En cierre: ${proyectosCierre}"></div>
				<div class="barra barra-cerrado" style="width: ${
					proyectosEntidad.length > 0 ? (proyectosCerrados / proyectosEntidad.length) * 100 : 0
				}%" title="Cerrados: ${proyectosCerrados}"></div>
			</div>
			<div class="distribucion-legend">
				<span class="legend-item"><span class="color-dot activo"></span> Ejecución (${proyectosActivos})</span>
				<span class="legend-item"><span class="color-dot cierre"></span> Cierre (${proyectosCierre})</span>
				<span class="legend-item"><span class="color-dot cerrado"></span> Cerrados (${proyectosCerrados})</span>
			</div>
		</div>
		`
				: '';

		return `
  <div class="faculty-popup">
    <div class="faculty-header facultad-${colorClass}">
      <span class="faculty-icon">${icono}</span>
      <h3>${facultad}</h3>
      <span class="faculty-count stat-highlight-${colorClass}">${cantidad}</span>
    </div>
    
    ${proyectosEntidad.length > 0 ? distribucionEstados : ''}
    ${comparacionHTML}
    
    <div class="popup-footer">
      <button class="view-all-btn" onclick="(function() {
        var map = document.querySelector('.leaflet-map-pane')?.__vue__?._map;
        if (map && map.closePopup) {
          map.closePopup();
        }
        document.dispatchEvent(new CustomEvent('view-faculty-projects', {detail: '${facultad}'}));
      })();">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
        Ver todos los proyectos
      </button>
    </div>

    <!-- Botones laterales -->
    <div class="popup-side-buttons">
      <button 
        class="side-btn left" 
        onclick="document.dispatchEvent(new CustomEvent('open-dashboard', { detail: { facultad: '${facultad}', tipo: 'participacion' } }))"><
      </button>
      <button 
        class="side-btn right" 
        onclick="document.dispatchEvent(new CustomEvent('open-dashboard', { detail: { facultad: '${facultad}', tipo: 'estados' } }))">>
      </button>
    </div>
	<div class="popup-dashboards"></div>
  </div>
`;
	}

	// Evento para cuando se hace clic en "Ver todos los proyectos" en el popup
	onMount(() => {
		document.addEventListener('view-faculty-projects', (e: any) => {
			// Cerrar el popup activo si existe usando el método del componente GeoJson
			if (geoJsonInstance && typeof geoJsonInstance.closePopups === 'function') {
				geoJsonInstance.closePopups();
			}
			// Enviar evento al componente padre
			dispatch('viewFacultyProjects', e.detail);
		});

		// Escuchar evento de restablecimiento global
		document.addEventListener('reset-highlights', () => {
			resetHighlights();
		});

		// Añadir manejador de evento para clic en el mapa
		if (map) {
			map.on('click', handleMapClick);
		}
		document.addEventListener('open-dashboard', handleOpenDashboard as any);
	});

	onDestroy(() => {
		document.removeEventListener('view-faculty-projects', () => {});
		document.removeEventListener('reset-highlights', () => {});

		// Limpiar el manejador de eventos al destruir el componente
		if (map) {
			map.off('click', handleMapClick);
		}
		document.removeEventListener('open-dashboard', handleOpenDashboard as any);
	});

	// Escuchar evento de restablecimiento desde el componente padre
	export function resetHighlights() {
		if (geoJsonInstance && typeof geoJsonInstance.clearHighlights === 'function') {
			geoJsonInstance.clearHighlights();
		}
		highlightedFacultad = null;
	}

	// Función para manejar el clic en el mapa
	function handleMapClick(e: any) {
		// Emitir un evento cuando se haga clic en el mapa (fuera de un popup)
		dispatch('mapClick', e);
	}
	function handleOpenDashboard(e: CustomEvent) {
		const { facultad, tipo } = e.detail;

		// Buscar el popup actual (donde está la facultad activa)
		const popupEl = document.querySelector('.faculty-popup');
		if (!popupEl) return;

		// Buscar el contenedor reservado para dashboards dentro del popup
		const container = popupEl.querySelector('.popup-dashboards') as HTMLElement;
		if (!container) return;

		// Limpiar lo que hubiera antes
		container.innerHTML = '';

		// Crear un nuevo contenedor donde montaremos el carrusel
		const mountEl = document.createElement('div');
		container.appendChild(mountEl);

		// Montar el componente Svelte PopupDashboard directamente
		const dashboard = new PopupDashboard({
			target: mountEl,
			props: {
				facultad,
				tipo
			}
		});

		// escuchar evento close correctamente
		dashboard.$on('close', () => {
			container.innerHTML = ''; // destruye el contenido del dashboard
		});

		// Añadir clases para posicionarlo a izquierda/derecha
		container.className = 'popup-dashboards ' + (tipo === 'participacion' ? 'left' : 'right');
	}

	// Función para generar color basado en el valor normalizado
	function generateColor(t: number): string {
		// Paleta de colores mejorada: escala no lineal para destacar mejor los valores altos
		const clamped = Math.max(0, Math.min(1, t));

		// Aplicamos una función potencial para enfatizar mejor los valores altos
		// t^0.7 da más énfasis a valores altos (más contraste)
		const enhancedT = Math.pow(clamped, 0.7);

		// Escala de colores más distintiva con 6 niveles
		if (enhancedT < 0.1) {
			// Valor muy bajo - casi blanco con tinte ligero
			return `color-mix(in srgb, var(--color--primary, #6E29E7) 10%, white)`;
		} else if (enhancedT < 0.3) {
			// Valor bajo
			return `color-mix(in srgb, var(--color--primary, #6E29E7) 25%, white)`;
		} else if (enhancedT < 0.5) {
			// Valor medio-bajo
			return `color-mix(in srgb, var(--color--primary, #6E29E7) 40%, white)`;
		} else if (enhancedT < 0.7) {
			// Valor medio-alto
			return `color-mix(in srgb, var(--color--primary, #6E29E7) 55%, white)`;
		} else if (enhancedT < 0.9) {
			// Valor alto
			return `color-mix(in srgb, var(--color--primary, #6E29E7) 70%, white)`;
		} else {
			// Valor máximo o casi máximo - color muy distintivo
			return `color-mix(in srgb, var(--color--primary, #6E29E7) 85%, white)`;
		}
	}

	// Función para exportar datos de la visualización
	export function exportarDatosVisualizacion() {
		const fecha = new Date().toISOString();
		const datos = {
			fecha,
			proyectosPorFacultad,
			filtradosActivos: filteredProyectos.length,
			datosVisualizacion: valueById
		};

		return datos;
	}
	// Actualizar los valores cuando cambien los proyectos filtrados
	$: {
		// ✅ 0) Si viene un valueById externo (timeline), se usa y listo
		if (externalValueById) {
			valueById = externalValueById;
			memoizedFilteredProyectos.key = `external-${mapLevel}`;
			memoizedFilteredProyectos.data = externalValueById;
		}

		// ✅ 1) Si NO viene externo, usa TU lógica actual intacta
		else {
			// 🔹 Si hay filtros activos, usamos SIEMPRE los proyectos filtrados
			if (hasActiveFilters && filteredProyectos.length > 0) {
				const key = `${mapLevel}-${JSON.stringify(
					filteredProyectos.map((p) => p.id || p.titulo).sort()
				)}`;

				if (memoizedFilteredProyectos.key !== key) {
					console.info(
						`Recalculando valores del mapa (nivel=${mapLevel}) - cambio en proyectos filtrados`
					);

					const counts: Record<string, number> = {};

					filteredProyectos.forEach((proyecto: any) => {
						if (mapLevel === 'faculty') {
							const rawName = proyecto.facultad_o_entidad_o_area_responsable;
							const entityKey = getEntityKey('faculty', rawName || 'No especificado');
							counts[entityKey] = (counts[entityKey] || 0) + 1;
						} else {
							// 🔹 A nivel institución: contar TODAS las instituciones relacionadas
							const nombres: string[] =
								Array.isArray(proyecto.instituciones_relacionadas) &&
								proyecto.instituciones_relacionadas.length > 0
									? proyecto.instituciones_relacionadas
									: [proyecto.institucion];

							nombres.filter(Boolean).forEach((nombre: string) => {
								const entityKey = getEntityKey('institution', nombre);
								counts[entityKey] = (counts[entityKey] || 0) + 1;
							});
						}
					});

					memoizedFilteredProyectos.key = key;
					memoizedFilteredProyectos.data = counts;
					valueById = counts;
				}
			} else if (proyectosPorFacultad.length > 0) {
				// 🔹 Sin filtros activos → usamos los datos agregados devueltos por ProjectService
				const key = `all-${mapLevel}`;
				if (memoizedFilteredProyectos.key !== key) {
					console.info(`Usando datos completos de proyectos para nivel=${mapLevel}`);

					const counts: Record<string, number> = {};
					proyectosPorFacultad.forEach((item) => {
						const entityKey = getEntityKey(mapLevel, item.facultad);
						counts[entityKey] = item.cantidad;
					});

					memoizedFilteredProyectos.key = key;
					memoizedFilteredProyectos.data = counts;
					valueById = counts;
				}
			}
		}
	}
</script>

{#if map}
	<div aria-label="Mapa de proyectos por facultad de la UCE">
		{#if geoJsonData}
			<GeoJsonChoropleth
				{map}
				data={geoJsonData}
				idProperty="facultad_o_entidad_o_area_responsable"
				{valueById}
				{highlightedFacultad}
				baseFillOpacity={0.85}
				hoverEnabled={true}
				popupEnabled={true}
				popupFormatter={formatPopup}
				unitLabel="proyectos"
				valueProperty="projectCount"
				colorAt={generateColor}
				highlightStyle={{
					color: '#ff00ff',
					weight: 4,
					opacity: 1,
					fillOpacity: 0.9,
					dashArray: '5, 10',
					className: 'highlighted-feature'
				}}
				onEachFeature={(feature, layer) => {
					if (feature?.properties?.facultad_o_entidad_o_area_responsable) {
						const facultad = feature.properties.facultad_o_entidad_o_area_responsable;
						const center = layer.getBounds().getCenter();
						centroides[facultad] = [center.lat, center.lng];
						// Cuando tengas los centroides listos:
						dispatch('centroidesReady', { centroides, level: mapLevel });
					}
				}}
			/>
		{/if}

		<FacultadRankingLayer {map} data={rankingData} />

		{#each dashboards as dash}
			<div class="popup-dashboard-container {dash.side}">
				<PopupDashboard facultad={dash.facultad} tipo={dash.tipo} />
			</div>
		{/each}
	</div>
{/if}

<style lang="scss">
	/* Estilos personalizados para el popup */
	:global(.faculty-popup) {
		position: relative; /* clave para posicionar los dashboards */
		font-family: var(--font-sans);
		color: var(--color--text);
		max-width: 400px;
		//background: color-mix(in srgb, var(--color--primary) 10%, transparent);
		border-radius: 10px;
		width: max-content;
		animation: fadeIn 0.3s ease-out;

		@media (max-width: 640px) {
			max-width: 240px;
		}

		@media (max-width: 480px) {
			max-width: 200px;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.faculty-header) {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 8px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--color--border);
		color: var(--color--text);
		position: relative;
	}

	:global(.faculty-count) {
		position: absolute;
		right: 0;
		top: 0;
		font-weight: bold;
		font-size: 14px;
		background: rgba(var(--color--primary-tint-rgb), 0.1);
		border-radius: 12px;
		padding: 2px 8px;
	}
	:global(.facultad-high) {
		background: color-mix(in srgb, var(--color--primary) 35%, transparent) !important;
	}

	:global(.facultad-medium) {
		background: color-mix(in srgb, var(--color--primary) 20%, transparent) !important;
	}

	:global(.facultad-low) {
		background: color-mix(in srgb, var(--color--primary) 10%, transparent) !important;
	}

	:global(.faculty-icon) {
		font-size: 1.5rem;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));

		@media (max-width: 480px) {
			font-size: 1.3rem;
		}
	}

	:global(.faculty-popup h3) {
		margin: 0;
		font-weight: 700;
		color: var(--color--primary);
		font-size: 1rem;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		word-break: break-word;

		@media (max-width: 480px) {
			font-size: 0.9rem;
		}
	}

	:global(.faculty-popup h4) {
		margin: 5px 0;
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--color--text);
		border-bottom: 1px solid color-mix(in srgb, var(--color--text) 10%, transparent);
		padding-bottom: 5px;
	}

	:global(.faculty-stats) {
		display: grid;
		gap: 4px;
		margin-bottom: 8px;
		border-bottom: 1px solid color-mix(in srgb, var(--color--text) 15%, transparent);
		padding-bottom: 8px;
		background: color-mix(in srgb, var(--color--card-background) 90%, transparent);
		border-radius: 6px;
		padding: 6px 8px;
	}

	:global(.stat) {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
		transition: all 0.2s ease;
	}

	:global(.stat:hover) {
		background: color-mix(in srgb, var(--color--text) 5%, transparent);
		border-radius: 4px;
		padding-left: 4px;
		padding-right: 4px;
	}

	:global(.stat-label) {
		font-weight: 500;
		color: var(--color--text-shade);
	}

	:global(.stat-value) {
		font-weight: 600;
		color: var(--color--text);
	}

	:global(.stat-highlight-high) {
		color: var(--color--primary) !important;
		font-weight: 700 !important;
	}

	:global(.stat-highlight-medium) {
		color: var(--color--primary) !important;
		opacity: 0.85 !important;
		font-weight: 700 !important;
	}

	:global(.stat-highlight-low) {
		color: var(--color--primary) !important;
		opacity: 0.7 !important;
		font-weight: 700 !important;
	}

	:global(.proyecto-lista) {
		margin-top: 6px;
	}

	:global(.proyecto-lista ul) {
		list-style: none;
		padding-left: 0;
		margin: 6px 0;
	}

	:global(.proyecto-lista li) {
		padding: 6px 8px;
		border-radius: 6px;
		background: color-mix(in srgb, var(--color--card-background) 70%, transparent);
		margin-bottom: 6px;
		font-size: 0.8rem;
		border-left: 2px solid var(--color--primary);
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

		@media (max-width: 480px) {
			font-size: 0.75rem;
			padding: 5px 6px;
		}
	}

	:global(.proyecto-lista li:hover) {
		transform: translateX(2px);
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
	}

	:global(.proyecto-lista li.ver-mas) {
		background: transparent;
		border-left: none;
		text-align: center;
		box-shadow: none;
		padding: 5px;
	}

	:global(.proyecto-lista li.ver-mas:hover) {
		transform: none;
	}

	:global(.proyecto-meta) {
		display: flex;
		justify-content: space-between;
		margin-top: 4px;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px;
	}

	:global(.estado-badge) {
		font-size: 0.65rem;
		padding: 2px 5px;
		border-radius: 8px;
		font-weight: 600;

		@media (max-width: 480px) {
			font-size: 0.6rem;
			padding: 1px 4px;
		}
	}

	:global(.estado-activo) {
		background: color-mix(in srgb, var(--color--primary) 30%, transparent);
		color: var(--color--primary);
	}

	:global(.estado-cierre) {
		background: color-mix(in srgb, var(--color--primary) 20%, transparent);
		color: var(--color--primary);
		opacity: 0.85;
	}

	:global(.estado-cerrado) {
		background: color-mix(in srgb, var(--color--text-shade) 30%, transparent);
		color: var(--color--text-shade);
	}

	:global(.fecha-badge) {
		font-size: 0.7rem;
		color: var(--color--text-shade);
		background: color-mix(in srgb, var(--color--text-shade) 10%, transparent);
		padding: 2px 6px;
		border-radius: 10px;
	}

	:global(.no-proyectos) {
		font-style: italic;
		color: var(--color--text-shade);
		text-align: center;
		padding: 15px;
		font-size: 0.9rem;
		background: color-mix(in srgb, var(--color--text) 5%, transparent);
		border-radius: 8px;
	}

	:global(.popup-footer) {
		margin-top: 8px;
		text-align: center;
	}

	:global(.view-all-btn) {
		background: var(--color--primary);
		color: white;
		border: none;
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

		@media (max-width: 480px) {
			padding: 5px 10px;
			font-size: 0.75rem;
		}
	}

	:global(.view-all-btn:hover) {
		filter: brightness(1.1);
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	:global(.view-all-btn svg) {
		transition: transform 0.3s ease;
	}

	:global(.view-all-btn:hover svg) {
		transform: translateX(2px);
	}

	:global(.leaflet-popup-content-wrapper) {
		border-radius: 10px !important;
		box-shadow: var(--card-shadow), 0 8px 20px rgba(0, 0, 0, 0.08) !important;
		padding: 10px !important;
		width: auto !important;
		min-width: 200px !important;
		//background: transparent !important;
		background: color-mix(in srgb, var(--color--card-background) 80%, transparent) !important;
	}

	:global(.leaflet-popup-content) {
		margin: 5px !important;
		width: auto !important;
		overflow-wrap: break-word !important;
	}

	:global(.leaflet-popup-close-button) {
		font-size: 16px !important;
		color: var(--color--primary) !important;
		padding: 4px !important;
		width: 22px !important;
		height: 22px !important;
		top: 5px !important;
		right: 5px !important;
	}

	:global(.leaflet-popup-tip) {
		background-color: var(--color--card-background) !important;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
		width: 10px !important;
		height: 10px !important;
	}

	/* Estilos para el gráfico de distribución */
	:global(.distribucion-wrapper) {
		margin: 8px 0;
		border-radius: 6px;
		overflow: hidden;
	}

	:global(.distribucion-chart) {
		display: flex;
		height: 12px;
		width: 100%;
		border-radius: 6px;
		overflow: hidden;
	}

	:global(.barra) {
		height: 100%;
		transition: width 0.5s ease-out;
	}

	:global(.barra-activo) {
		background: var(--color--primary);
	}

	:global(.barra-cierre) {
		background: color-mix(in srgb, var(--color--primary) 60%, white);
	}

	:global(.barra-cerrado) {
		background: color-mix(in srgb, var(--color--text-shade) 60%, white);
	}

	:global(.distribucion-legend) {
		display: flex;
		justify-content: space-between;
		font-size: 0.65rem;
		margin-top: 4px;
		flex-wrap: wrap;
	}

	:global(.legend-item) {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	:global(.color-dot) {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
	}

	:global(.color-dot.activo) {
		background: var(--color--primary);
	}

	:global(.color-dot.cierre) {
		background: color-mix(in srgb, var(--color--primary) 60%, white);
	}

	:global(.color-dot.cerrado) {
		background: color-mix(in srgb, var(--color--text-shade) 60%, white);
	}

	/* Mejorar la animación de entrada para elementos de la lista */
	:global(.proyecto-lista li) {
		animation: fadeSlideIn 0.3s ease forwards;
		animation-delay: calc(var(--item-index, 0) * 0.05s);
		opacity: 0;
		transform: translateX(-5px);
	}

	@keyframes fadeSlideIn {
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Mejora de interactividad para elementos Leaflet */
	:global(.leaflet-choropleth-layer path) {
		transition: fill 0.5s ease-out, stroke-width 0.3s ease, filter 0.3s ease;
	}

	:global(.leaflet-interactive:hover) {
		filter: drop-shadow(0 0 5px rgba(var(--color--primary-rgb), 0.5)) brightness(1.05);
		stroke-width: 2px !important;
	}

	/* Mejora para accesibilidad en los badges */
	:global(.estado-badge) {
		text-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
		font-weight: 700;
	}
	:global(.popup-side-buttons) {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		transform: translateY(-50%);
		display: flex;
		justify-content: space-between;
		pointer-events: none; /* deja pasar clics al mapa salvo en los botones */
	}

	:global(.popup-side-buttons .side-btn) {
		pointer-events: auto;
		width: 28px;
		height: 100%;
		border-radius: 7px;
		border: 2px solid var(--color--code-background, #00bcd4);
		background: var(--color--callout-accent--info, #00bcd4);
		color: var(--color--code-background);
		font-weight: bold;
		box-shadow: 0 0 10px var(--color--callout-accent--info, #00bcd4);
		cursor: pointer;
	}

	:global(.popup-side-buttons .side-btn.left) {
		position: relative;
		left: -50px; /* distancia hacia afuera */
	}

	:global(.popup-side-buttons .side-btn.right) {
		position: relative;
		right: -50px; /* distancia hacia afuera */
	}

	:global(.popup-dashboards) {
		position: absolute;
		top: 0;
		height: 100%;
		display: flex;
		align-items: center;
		//pointer-events: none; /* deja pasar clics salvo en el contenido */
	}

	:global(.popup-dashboards.left) {
		right: 100%; /* a la izquierda */
		margin-right: 10px;
	}

	:global(.popup-dashboards.right) {
		left: 100%; /* a la derecha */
		margin-left: 10px;
	}

	:global(.popup-dashboards .dashboard-content) {
		border: 2px solid var(--color--primary, #00bcd4);
		box-shadow: 0 0 10px var(--color--primary, #00bcd4);
		border-radius: 8px;
		color: rgb(255, 255, 255);
		padding: 8px;
		min-width: 180px;
		pointer-events: auto;
	}
	:global(.popup-dashboard-container) {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 1000;
	}

	:global(.popup-dashboard-container.left) {
		right: 100%; /* pegado a la izquierda */
		margin-right: 10px;
	}

	:global(.popup-dashboard-container.right) {
		left: 100%; /* pegado a la derecha */
		margin-left: 10px;
	}
	:global(.comparacion-block) {
		margin-top: 8px;
	}

	:global(.comparacion-block h4) {
		margin: 5px 0 8px;
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--color--text);
		border-bottom: 1px solid color-mix(in srgb, var(--color--text) 10%, transparent);
		padding-bottom: 5px;
	}

	:global(.comparacion-row) {
		display: grid;
		grid-template-columns: 90px 1fr 45px;
		align-items: center;
		gap: 8px;
		margin: 6px 0;
		font-size: 0.8rem;
	}

	:global(.comparacion-label) {
		color: var(--color--text-shade);
		font-weight: 600;
	}

	:global(.comparacion-value) {
		text-align: right;
		font-weight: 700;
		color: var(--color--text);
	}

	:global(.comparacion-bar) {
		height: 10px;
		border-radius: 6px;
		overflow: hidden;
		background: color-mix(in srgb, var(--color--text) 8%, transparent);
	}

	:global(.comparacion-fill) {
		height: 100%;
		border-radius: 6px;
	}

	:global(.comparacion-fill.facultad) {
		background: var(--color--primary);
	}

	:global(.comparacion-fill.promedio) {
		background: color-mix(in srgb, var(--color--text-shade) 60%, white);
	}

	:global(.comparacion-footer) {
		margin-top: 6px;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color--primary);
		text-align: center;
	}
</style>
