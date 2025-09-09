<!-- src/lib/components/molecules/ProjectsChoropleth.svelte -->
<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type { Map } from 'leaflet';
	import GeoJsonChoropleth from '$lib/components/atoms/GeoJsonChoropleth.svelte';
	import { obtenerProyectosPorFacultad, type Proyecto } from '$lib/services/proyectosService';
	import PopupDashboard from '$lib/components/atoms/PopupDashboard.svelte';

	const dispatch = createEventDispatcher();

	export let map: Map | null = null;
	//export const proyectos: Proyecto[] = []; // Convertido a const para evitar advertencia de exportación no utilizada
	export const proyectos: Proyecto[] = [];
	export let filteredProyectos: Proyecto[] = [];
	export let highlightedFacultad: string | null = null; // Facultad que debe ser destacada

	// Referencia al componente GeoJsonChoropleth para acceder a sus métodos
	let geoJsonInstance: any;

	// Datos para la coropleta
	let proyectosPorFacultad: { facultad: string; cantidad: number }[] = [];
	let valueById: Record<string, number> = {};
	let dashboards: { facultad: string; tipo: string; side: 'left' | 'right' }[] = [];

	// Sistema de memoización para evitar recálculos innecesarios
	let memoizedFilteredProyectos = {
		key: '',
		data: {} as Record<string, number>
	};

	// Cargamos los datos al iniciar
	onMount(async () => {
		await cargarDatos();
	});

	// Función para normalizar nombres de facultades para que coincidan con los del GeoJSON
	function normalizarNombreFacultad(nombre: string): string {
		if (!nombre) return 'No especificada';

		// Limpieza básica de texto para normalización estándar
		const nombreLimpio = nombre
			.trim()
			.replace(/\s+/g, ' ') // Eliminar espacios múltiples
			.replace(/^facultad\s+de\s+/i, '') // Eliminar "Facultad de" inicial si existe
			.replace(/^facultad\s+/i, ''); // O simplemente "Facultad" si existe

		// Mapeo explícito de nombres de facultades para asegurar consistencia
		const mapeoNombres: Record<string, string> = {
			'Ciencias Agrícolas': 'Facultad De Ciencias Agrícolas',
			'Facultad Ciencias Agrícolas': 'Facultad De Ciencias Agrícolas',
			'Facultad de Ciencias Agrícolas': 'Facultad De Ciencias Agrícolas',
			// Agregar más mapeos si se descubren otras discrepancias
			[nombreLimpio]: `Facultad De ${nombreLimpio.charAt(0).toUpperCase()}${nombreLimpio.slice(1)}`
		};

		// Si existe un mapeo explícito, usarlo
		if (mapeoNombres[nombre]) {
			return mapeoNombres[nombre];
		}

		// Si el nombre ya incluye "Facultad De", probablemente ya está en el formato correcto
		if (nombre.startsWith('Facultad De ')) {
			return nombre;
		}

		// Si ninguna de las condiciones anteriores aplica, aplicar formato estándar
		if (!nombre.toLowerCase().includes('facultad')) {
			return `Facultad De ${nombreLimpio.charAt(0).toUpperCase()}${nombreLimpio.slice(1)}`;
		}

		// Como último recurso, devolver el nombre original
		return nombre;
	}

	// Función para cargar datos de proyectos por facultad
	async function cargarDatos() {
		try {
			proyectosPorFacultad = await obtenerProyectosPorFacultad();

			// Crear el objeto valueById para el componente GeoJsonChoropleth
			valueById = {};
			proyectosPorFacultad.forEach((item) => {
				// Normalizar el nombre de la facultad para que coincida con el GeoJSON
				const facultadKey = normalizarNombreFacultad(item.facultad);
				valueById[facultadKey] = item.cantidad;
			});

			// Cálculo de estadísticas básicas para mejor visualización y diagnóstico
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
					`Total facultades: ${proyectosPorFacultad.length}, Total proyectos: ${cantidades.reduce(
						(a, b) => a + b,
						0
					)}`
				);
			}
		} catch (error) {
			console.error('Error al cargar datos de proyectos por facultad:', error);
			// Proporcionar datos de respaldo o mostrar mensaje de error al usuario
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
		const facultad = props?.facultad_o_entidad_o_area_responsable || id || 'Facultad';
		const icono = props?.icono || '🎓';
		const cantidad = value ?? 0;
		const decano = props?.decano || '';
		const subdecano = props?.subdecano || '';

		// Simplificamos las carreras si son demasiadas
		let carreras = props?.carreras || '';
		if (carreras.length > 60) {
			carreras = carreras.substring(0, 57) + '...';
		}

		// Encontrar proyectos de esta facultad
		const proyectosFacultad = filteredProyectos.filter(
			(p) => p.facultad_o_entidad_o_area_responsable === facultad
		);

		// Datos estadísticos adicionales
		const proyectosActivos = proyectosFacultad.filter((p) => p.estado === 'En ejecución').length;
		const proyectosCierre = proyectosFacultad.filter((p) => p.estado === 'En cierre').length;
		const proyectosCerrados = proyectosFacultad.filter(
			(p) => p.estado !== 'En ejecución' && p.estado !== 'En cierre'
		).length;
		const promedioDuracion = calcularPromedioDuracion(proyectosFacultad);

		// Determinamos el color según el número de proyectos
		const colorClass = cantidad > 15 ? 'high' : cantidad > 7 ? 'medium' : 'low';

		// Mostrar los proyectos más recientes primero (ordenados por fecha)
		const proyectosOrdenados = [...proyectosFacultad].sort((a, b) => {
			const fechaA = a.fecha_inicio ? a.fecha_inicio.split('/').reverse().join('') : '';
			const fechaB = b.fecha_inicio ? b.fecha_inicio.split('/').reverse().join('') : '';
			return fechaB.localeCompare(fechaA);
		});

		// Determinar el número óptimo de proyectos a mostrar (adaptativo)
		const maxProyectos = cantidad > 10 ? 2 : 3;

		// Lista de proyectos adaptativa
		const proyectosListaHTML =
			proyectosFacultad.length > 0
				? `<div class="proyecto-lista">
          <h4>Proyectos recientes (${proyectosFacultad.length}):</h4>
          <ul>
            ${proyectosOrdenados
							.slice(0, maxProyectos)
							.map((p, idx) => {
								// Determinar el color del estado
								const estadoClass =
									p.estado === 'En ejecución'
										? 'estado-activo'
										: p.estado === 'En cierre'
										? 'estado-cierre'
										: 'estado-cerrado';

								// Acortar título para que sea más compacto
								const maxTitleLength = 35;
								const shortTitle =
									p.titulo.length > maxTitleLength
										? p.titulo.substring(0, maxTitleLength) + '...'
										: p.titulo;

								// Añadimos animación escalonada y mejoras visuales
								return `
                    <li style="--item-index: ${idx}" class="proyecto-item">
                      <strong>${shortTitle}</strong>
                      <div class="proyecto-meta">
                        <span class="estado-badge ${estadoClass}">${p.estado || 'Sin estado'}</span>
                        <span class="fecha-badge" title="Fecha inicio">${
													p.fecha_inicio || 'N/D'
												}</span>
                      </div>
                    </li>
                  `;
							})
							.join('')}
            ${
							proyectosFacultad.length > maxProyectos
								? `<li class="ver-mas"><em>Y ${
										proyectosFacultad.length - maxProyectos
								  } más...</em></li>`
								: ''
						}
          </ul>
        </div>`
				: '<div class="no-proyectos">No hay proyectos registrados en esta facultad</div>';

		// Gráfico simple de distribución de estados
		const distribucionEstados =
			proyectosFacultad.length > 0
				? `
		<div class="distribucion-wrapper" aria-label="Distribución de proyectos por estado">
			<div class="distribucion-chart">
				<div class="barra barra-activo" style="width: ${
					proyectosFacultad.length > 0 ? (proyectosActivos / proyectosFacultad.length) * 100 : 0
				}%" title="En ejecución: ${proyectosActivos}"></div>
				<div class="barra barra-cierre" style="width: ${
					proyectosFacultad.length > 0 ? (proyectosCierre / proyectosFacultad.length) * 100 : 0
				}%" title="En cierre: ${proyectosCierre}"></div>
				<div class="barra barra-cerrado" style="width: ${
					proyectosFacultad.length > 0 ? (proyectosCerrados / proyectosFacultad.length) * 100 : 0
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
    
    <div class="faculty-stats">
      ${
				decano
					? `
            <div class="stat">
              <span class="stat-label">Decano:</span>
              <span class="stat-value">${decano}</span>
            </div>
          `
					: ''
			}
      ${
				subdecano && !carreras
					? `
            <div class="stat">
              <span class="stat-label">Subdecano:</span>
              <span class="stat-value">${subdecano}</span>
            </div>
          `
					: ''
			}
      ${
				carreras
					? `
            <div class="stat">
              <span class="stat-label">Carreras:</span>
              <span class="stat-value">${carreras}</span>
            </div>
          `
					: ''
			}
      ${
				proyectosFacultad.length > 0
					? `
            <div class="stat">
              <span class="stat-label">Promedio duración:</span>
              <span class="stat-value">${promedioDuracion} meses</span>
            </div>
          `
					: ''
			}
    </div>
    
    ${proyectosFacultad.length > 0 ? distribucionEstados : ''}
    ${proyectosListaHTML}
    
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
		if (filteredProyectos.length > 0) {
			// Crear una clave única basada en los IDs de los proyectos filtrados
			const key = JSON.stringify(filteredProyectos.map((p) => p.id || p.titulo).sort());

			// Solo recalcular si han cambiado los proyectos filtrados
			if (memoizedFilteredProyectos.key !== key) {
				console.info('Recalculando valores del mapa - cambio en proyectos filtrados');

				// Recalcular la cantidad de proyectos por facultad basado en los filtrados
				const facultadCount: Record<string, number> = {};

				filteredProyectos.forEach((proyecto) => {
					let facultad = proyecto.facultad_o_entidad_o_area_responsable || 'No especificado';
					// Normalizar el nombre de la facultad para asegurar consistencia con el GeoJSON
					facultad = normalizarNombreFacultad(facultad);
					facultadCount[facultad] = (facultadCount[facultad] || 0) + 1;
				});

				// Guardar en la caché de memoización
				memoizedFilteredProyectos.key = key;
				memoizedFilteredProyectos.data = facultadCount;

				// Actualizar el valueById para el mapa coroplético
				valueById = facultadCount;
			}
		} else if (proyectosPorFacultad.length > 0) {
			// Si no hay filtros activos, usar todos los proyectos
			if (memoizedFilteredProyectos.key !== 'all') {
				console.info('Usando datos completos de proyectos por facultad');

				valueById = {};
				proyectosPorFacultad.forEach((item) => {
					// Normalizar el nombre de la facultad para que coincida con el GeoJSON
					const facultadKey = normalizarNombreFacultad(item.facultad);
					valueById[facultadKey] = item.cantidad;
				});

				// Actualizar la memoización
				memoizedFilteredProyectos.key = 'all';
				memoizedFilteredProyectos.data = { ...valueById };
			}
		}
	}
</script>

{#if map}
	<div aria-label="Mapa de proyectos por facultad de la UCE">
		<GeoJsonChoropleth
			{map}
			dataUrl="/geo/map_uce_facultades_v5.geojson"
			idProperty="facultad_o_entidad_o_area_responsable"
			{valueById}
			{highlightedFacultad}
			baseFillOpacity={0.85}
			hoverEnabled={true}
			popupEnabled={true}
			popupFormatter={formatPopup}
			colorAt={generateColor}
			highlightStyle={{
				color: '#ff00ff', // Color fluorescente para el borde
				weight: 4,
				opacity: 1,
				fillOpacity: 0.9,
				dashArray: '5, 10', // Línea punteada
				className: 'highlighted-feature' // Clase CSS para el resaltado (sin animaciones)
			}}
			bind:this={geoJsonInstance}
		/>
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
</style>
