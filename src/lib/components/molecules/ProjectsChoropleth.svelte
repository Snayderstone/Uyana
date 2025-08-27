<!-- src/lib/components/molecules/ProjectsChoropleth.svelte -->
<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type { Map } from 'leaflet';
	import GeoJsonChoropleth from '$lib/components/atoms/GeoJsonChoropleth.svelte';
	import { obtenerProyectosPorFacultad, type Proyecto } from '$lib/services/proyectosService';

	const dispatch = createEventDispatcher();

	export let map: Map | null = null;
	export const proyectos: Proyecto[] = []; // Convertido a const para evitar advertencia de exportación no utilizada
	export let filteredProyectos: Proyecto[] = [];

	// Datos para la coropleta
	let proyectosPorFacultad: { facultad: string; cantidad: number }[] = [];
	let valueById: Record<string, number> = {};

	// Cargamos los datos al iniciar
	onMount(async () => {
		await cargarDatos();
	});

	// Función para cargar datos de proyectos por facultad
	async function cargarDatos() {
		try {
			proyectosPorFacultad = await obtenerProyectosPorFacultad();

			// Crear el objeto valueById para el componente GeoJsonChoropleth
			valueById = {};
			proyectosPorFacultad.forEach((item) => {
				// Normalizar el nombre de la facultad para que coincida con el GeoJSON
				// (ambos deben usar el mismo formato para hacer match)
				valueById[item.facultad] = item.cantidad;
			});
		} catch (error) {
			console.error('Error al cargar datos de proyectos por facultad:', error);
		}
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
							.map((p) => {
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

								return `
                    <li>
                      <strong>${shortTitle}</strong>
                      <div class="proyecto-meta">
                        <span class="estado-badge ${estadoClass}">${p.estado || 'Sin estado'}</span>
                        <span class="fecha-badge">${p.fecha_inicio || 'N/D'}</span>
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
        </div>
        
        ${proyectosListaHTML}
        
        <div class="popup-footer">
          <button class="view-all-btn" onclick="document.dispatchEvent(new CustomEvent('view-faculty-projects', {detail: '${facultad}'}))">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Ver todos los proyectos
          </button>
        </div>
      </div>
    `;
	}

	// Evento para cuando se hace clic en "Ver todos los proyectos" en el popup
	onMount(() => {
		document.addEventListener('view-faculty-projects', (e: any) => {
			dispatch('viewFacultyProjects', e.detail);
		});
	});

	onDestroy(() => {
		document.removeEventListener('view-faculty-projects', () => {});
	});

	// Actualizar los valores cuando cambien los proyectos filtrados
	$: {
		if (filteredProyectos.length > 0) {
			// Recalcular la cantidad de proyectos por facultad basado en los filtrados
			const facultadCount: Record<string, number> = {};

			filteredProyectos.forEach((proyecto) => {
				const facultad = proyecto.facultad_o_entidad_o_area_responsable || 'No especificado';
				facultadCount[facultad] = (facultadCount[facultad] || 0) + 1;
			});

			// Actualizar el valueById para el mapa coroplético
			valueById = facultadCount;
		} else if (proyectosPorFacultad.length > 0) {
			// Si no hay filtros activos, usar todos los proyectos
			valueById = {};
			proyectosPorFacultad.forEach((item) => {
				valueById[item.facultad] = item.cantidad;
			});
		}
	}
</script>

{#if map}
	<GeoJsonChoropleth
		{map}
		dataUrl="/geo/map_uce_facultades_v5.geojson"
		idProperty="facultad_o_entidad_o_area_responsable"
		{valueById}
		baseFillOpacity={0.7}
		hoverEnabled={true}
		popupEnabled={true}
		popupFormatter={formatPopup}
		colorAt={(t) => {
			// Paleta de colores morada: desde casi blanco con tinte morado a morado intenso
			// usando la variable de color primario (morado) del tema
			const clamped = Math.max(0, Math.min(1, t));
//
			// El color va desde un morado muy claro (casi blanco con tinte) a morado intenso
			if (clamped <= 0.33) {
				// Morado muy claro a claro
				const p = Math.round(clamped * 300); // 0..100
				return `color-mix(in srgb, var(--color--primary, #6E29E7) ${5 + p * 0.15}%, white)`;
			} else if (clamped <= 0.66) {
				// Morado claro a medio
				const p = Math.round((clamped - 0.33) * 300); // 0..100
				return `color-mix(in srgb, var(--color--primary, #6E29E7) ${20 + p * 0.25}%, white)`;
			} else {
				// Morado medio a intenso
				const p = Math.round((clamped - 0.66) * 300); // 0..100
				return `color-mix(in srgb, var(--color--primary, #6E29E7) ${45 + p * 0.55}%, white)`;
			}
		}}
	/>
{/if}

<style>
	/* Estilos personalizados para el popup */
	:global(.faculty-popup) {
		font-family: var(--font-sans);
		color: var(--color--text);
		max-width: 280px;
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
</style>
