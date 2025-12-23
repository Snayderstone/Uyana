<!-- src/lib/components/atoms/GeoJsonChoropleth.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Map } from 'leaflet';

	// === Props principales =====================================================
	export let map: Map | null = null; // instancia Leaflet ya creada
	export let dataUrl: string | null = null; // URL del GeoJSON (opción A)
	export let data: any | null = null; // objeto GeoJSON ya cargado (opción B)

	// Cómo obtener el ID de cada feature para cruzar valores (por defecto 'facultad')
	export let idProperty: string = 'facultad';

	// Valores dinámicos: { [id]: number } (0..1, 0..100, o el rango que tú mandes)
	export let valueById: Record<string, number> = {};

	// Si se especifican, anulan el auto-cálculo
	export let min: number | null = null;
	export let max: number | null = null;

	// Estilo base
	export let lineColor = 'color-mix(in srgb, var(--color--text, #1c1e26) 40%, transparent)';
	export let lineWeight = 1;
	export let baseFillOpacity = 0.65;

	// Hover
	export let hoverEnabled = true;
	export let hoverLineColor = 'var(--color--primary, #6E29E7)';
	// Etiqueta de unidad para hover/popup (evita que institution => "participantes")
	export let unitLabel: string = 'proyectos';

	// Propiedad opcional dentro del GeoJSON a usar como fallback si valueById no tiene valor
	export let valueProperty: string | null = null;

	// Guardar los centroides calculados por facultad
	let centroides: Record<string, [number, number]> = {};
	// Callback opcional para manejar cada feature
	export let onEachFeature: ((feature: any, layer: any) => void) | null = null;

	// Popup
	export let popupEnabled = true;
	// Función para renderizar el cuerpo del popup (HTML string)
	export let popupFormatter: (props: any, id: string, value: number | null) => string = (
		p,
		id,
		value
	) => {
		const vtxt = value == null ? '–' : String(value);
		const rows = Object.entries(p || {})
			.map(([k, v]) => `<div><b>${k}:</b> ${v}</div>`)
			.join('');
		return `<div class="uce-popup">
      <div style="font-weight:700; margin-bottom:.25rem;">${p?.facultad ?? id ?? 'Detalle'}</div>
      ${rows}
      <div style="margin-top:.35rem; opacity:.8;">Valor: ${vtxt}</div>
    </div>`;
	};

	// Paleta tipo “calor”: rojo → amarillo → blanco con variables globales.
	// Usamos color-mix en runtime (soporta var(...) y es ligero).
	export let colorAt: (t: number) => string = (t: number) => {
		const clamped = Math.max(0, Math.min(1, t));
		if (clamped <= 0.5) {
			const p = Math.round(clamped * 200); // 0..100
			return `color-mix(in srgb, var(--color--callout-accent--warning, #ffd60a) ${p}%, var(--color--callout-accent--error, #ff3b30))`;
		} else {
			const p = Math.round((clamped - 0.5) * 200); // 0..100
			return `color-mix(in srgb, var(--color--card-background, #ffffff) ${p}%, var(--color--callout-accent--warning, #ffd60a))`;
		}
	};
	// Normalizador de valores → [0,1]
	function to01(v: number, lo: number, hi: number) {
		// Asegurar que span no sea 0 para evitar divisiones por cero
		const span = Math.max(0.1, hi - lo);
		// Normalizar y limitar a [0,1]
		return Math.max(0, Math.min(1, (v - lo) / span));
	}

	let L: typeof import('leaflet') | null = null;
	let geoLayer: any = null;
	let loadedData: any = null;
	let isDestroyed = false;
	// Facultad destacada actualmente
	export let highlightedFacultad: string | null = null;

	// Estilos para la entidad destacada
	export let highlightStyle = {
		color: '#ff00ff', // Color fluorescente para el borde
		weight: 4,
		opacity: 1,
		fillOpacity: baseFillOpacity + 0.2,
		dashArray: '5, 10', // Línea punteada
		className: 'highlighted-feature' // Clase CSS para animaciones
	};

	// Recalcula min/max si no vienen dados
	function computeDomain(values: number[]): { lo: number; hi: number } {
		// Si no hay valores, devolvemos un rango predeterminado
		if (!values.length) return { lo: 0, hi: 1 };

		// Usamos valores proporcionados o los calculamos de los datos
		let lo = min !== null ? min : Math.min(...values);
		let hi = max !== null ? max : Math.max(...values);

		// Evitar span = 0 y asegurar un margen mínimo entre lo y hi
		if (lo === hi) hi = lo + 1;

		// Asegurar que valores extremos (como el máximo) sean tratados adecuadamente
		// reduciendo ligeramente lo para que los valores altos destaquen más
		lo = Math.max(0, lo * 0.9);
		/*
		console.log(
			`Dominio calculado: [${lo}, ${hi}] de valores: [${Math.min(...values)}, ${Math.max(
				...values
			)}]`
		);
		*/
		return { lo, hi };
	}

	async function ensureLeaflet() {
		if (!L) L = await import('leaflet');
	}

	async function loadDataIfNeeded() {
		if (data) {
			loadedData = data;
			return;
		}
		if (dataUrl) {
			const res = await fetch(dataUrl);
			loadedData = await res.json();
		}
	}
	function resolveValue(props: any, regionId: string | null): number | null {
		if (!regionId) return null;

		// 1) Prioridad: valueById (refleja filtros dinámicos)
		const fromMap = valueById?.[regionId];
		if (typeof fromMap === 'number') return fromMap;

		// 2) Fallback: alguna propiedad del feature (ej: projectCount)
		if (valueProperty && props && typeof props[valueProperty] === 'number') {
			return props[valueProperty];
		}

		// 3) Default
		return 0;
	}

	function styleForFeature(f: any) {
		const id = f?.properties?.[idProperty];
		const v = id != null ? valueById[id] : undefined;
		// Filtramos los valores y calculamos el dominio
		const filteredValues = Object.values(valueById).filter((x) => typeof x === 'number');
		const domain = computeDomain(filteredValues);

		// Normalizar valor entre 0 y 1
		const t = typeof v === 'number' ? to01(v, domain.lo, domain.hi) : 0;
		/*
		// Depurar valores para identificar posibles problemas
		if (id === 'Facultad De Ciencias Agrícolas') {
			console.log(
				`Depuración Facultad De Ciencias Agrícolas: valor=${v}, t=${t}, dominio=[${domain.lo}, ${domain.hi}]`
			);
		}
		*/
		// Obtener color de relleno según el valor normalizado
		const fill = colorAt(t);
		return {
			color: lineColor,
			weight: lineWeight,
			fillColor: fill,
			fillOpacity: baseFillOpacity
		};
	}

	function bindEvents(feature: any, layer: any) {
		if (!hoverEnabled && !popupEnabled) return;
		layer.on('mouseover', (e: any) => {
			if (!hoverEnabled) return;

			// Estilo hover (sin cambios)
			e.target.setStyle({
				color: hoverLineColor,
				weight: Math.max(2, lineWeight + 1),
				fillOpacity: Math.min(1, baseFillOpacity + 0.1)
			});

			const path: SVGPathElement | null = (e.target as any)?._path ?? null;
			if (path) {
				path.style.filter =
					'drop-shadow(0 0 6px rgba(110,41,231,.55)) drop-shadow(0 0 14px rgba(110,41,231,.28))';
			}
			e.target.bringToFront?.();

			// === TOOLTOP HOVER CORREGIDO ===
			if (L) {
				// Usamos directamente las propiedades del feature asociado al layer
				const props = e.target.feature?.properties;
				if (props) {
					const regionId = props[idProperty]; // ej: regionKey
					//const value = regionId != null ? valueById[regionId] : null;
					// ⭐⭐⭐ CORRECCIÓN AQUÍ: usar el valor del feature, no valueById en tiempo de evento
					const value = resolveValue(props, regionId ?? null);

					const tooltipContent = hoverCardHTML(
						props,
						regionId || 'Desconocido',
						typeof value === 'number' ? value : null
					);

					e.target
						.bindTooltip(tooltipContent, {
							permanent: false,
							direction: 'bottom',
							offset: [0, cardOffsetY],
							className: 'faculty-card-tooltip',
							sticky: true,
							interactive: false
						})
						.openTooltip();
				}
			}
		});

		layer.on('mouseout', (e: any) => {
			if (!geoLayer || !L) return;
			geoLayer.resetStyle(e.target);
			const path: SVGPathElement | null = (e.target as any)?._path ?? null;
			if (path) path.style.filter = '';
			e.target.closeTooltip?.();
		});

		if (popupEnabled) {
			const props = feature.properties;
			const regionId = props?.[idProperty];
			//const value = regionId != null ? valueById[regionId] : null;
			// ⭐⭐⭐ CORRECCIÓN AQUÍ: usar el valor del feature, no valueById
			const value = resolveValue(props, regionId ?? null);
			const html = popupFormatter(
				props ?? {},
				regionId || '',
				typeof value === 'number' ? value : null
			);
			layer.bindPopup(html);
		}
	}

	async function buildLayer() {
		if (!map || !loadedData || !L) return;

		// Por si buildLayer se dispara varias veces seguidas
		destroyLayer();

		try {
			geoLayer = L.geoJSON(loadedData, {
				style: styleForFeature,
				onEachFeature: (feature, layer) => {
					bindEvents(feature, layer);

					const id = feature?.properties?.[idProperty];
					if (id && (layer as any).getBounds) {
						const center = (layer as L.Polygon).getBounds().getCenter();
						centroides[id] = [center.lat, center.lng];
					}

					if (onEachFeature) {
						onEachFeature(feature, layer);
					}
				}
			});

			geoLayer.addTo(map);
		} catch (error) {
			console.error('[GeoJsonChoropleth] Error al agregar capa GeoJSON al mapa:', error, {
				hasMap: !!map,
				hasData: !!loadedData
			});
			geoLayer = null;
		}
	}

	function restyleLayer() {
		if (!geoLayer) return;
		/*
		geoLayer.eachLayer((layer: any) => {
			geoLayer.resetStyle(layer); // resetea al estilo base antes de aplicar el nuevo
		});
		*/
		geoLayer.setStyle(styleForFeature);

		// Si hay una facultad destacada, aplicar estilo especial
		if (highlightedFacultad) {
			highlightFeatureById(highlightedFacultad);
		}
	}
	$: if (geoLayer && valueById) {
		restyleLayer();
	}
	function destroyLayer() {
		if (!geoLayer || !map) return;

		try {
			map.removeLayer(geoLayer);
		} catch (error) {
			console.warn('[GeoJsonChoropleth] Error al quitar capa GeoJSON:', error);
		} finally {
			geoLayer = null;
		}
	}

	// Método para destacar una feature por su ID (nombre de facultad)
	export function highlightFeatureById(id: string) {
		if (!geoLayer || !id) return false;

		let found = false;

		geoLayer.eachLayer((layer: any) => {
			const featureId = layer?.feature?.properties?.[idProperty];

			if (featureId === id) {
				// Aplicar estilo destacado
				layer.setStyle(highlightStyle);

				// Aplicar efecto de sombra directo en el SVG
				const path = layer._path;
				if (path) {
					path.style.filter = 'drop-shadow(0 0 5px #ff00ff)';
				}

				// Traer al frente
				layer.bringToFront();
				found = true;
			} else {
				// Restaurar estilo normal
				geoLayer.resetStyle(layer);

				// Quitar efectos CSS
				const path = layer._path;
				if (path) {
					path.style.filter = '';
				}
			}
		});

		return found;
	}

	// Método para centrar y hacer zoom en una facultad
	export function zoomToFeatureById(id: string) {
		if (!geoLayer || !map || !id) return false;

		let found = false;

		geoLayer.eachLayer((layer: any) => {
			const featureId = layer?.feature?.properties?.[idProperty];

			if (featureId === id) {
				// Obtener bounds de la feature
				const bounds = layer.getBounds();

				// Calcular el nivel de zoom óptimo
				// Determinamos qué tan grande es la facultad para calcular el zoom ideal
				const areaSize =
					Math.abs(bounds.getNorth() - bounds.getSouth()) *
					Math.abs(bounds.getEast() - bounds.getWest());

				// Ajustamos el padding según el tamaño para evitar zoom excesivo en facultades pequeñas
				const paddingSize = areaSize < 0.0001 ? 200 : 50;
				// Factor de ajuste horizontal (positivo = más espacio a la derecha, negativo = más a la izquierda)
				const horizontalShift = 300;
				// Ajustar el mapa a estos límites con animación mejorada
				map.flyToBounds(bounds, {
					paddingTopLeft: [paddingSize + horizontalShift, paddingSize],
					paddingBottomRight: [paddingSize - horizontalShift, paddingSize],
					//padding: [paddingSize, paddingSize],
					duration: 1.2,
					easeLinearity: 0.5,
					animate: true
				});

				// Mostrar notificación flotante con nombre de la facultad
				if (L && layer?.feature?.properties?.facultad) {
					const facultadName = layer.feature.properties.facultad;
					const center = bounds.getCenter();

					// Crear un marcador temporal con un tooltip persistente
					setTimeout(() => {
						// Esperar a que termine la animación
						if (map && L) {
							// Verificar que L no sea null dentro del setTimeout
							// Crear marcador invisible en el centro de la facultad
							const marker = L.marker(center, {
								opacity: 0,
								interactive: false
							}).addTo(map);

							// Mostrar tooltip estático sin animación
							marker
								.bindTooltip(`<strong>${facultadName}</strong>`, {
									permanent: true,
									direction: 'top',
									className: 'faculty-highlight-tooltip',
									offset: [0, -20]
								})
								.openTooltip();

							// Eliminar después de unos segundos
							setTimeout(() => {
								marker.remove();
							}, 3000);
						}
					}, 1200);
				}

				found = true;
			}
		});

		return found;
	}

	onMount(async () => {
		await ensureLeaflet();
		await loadDataIfNeeded();
		await buildLayer();
	});

	onDestroy(() => {
		isDestroyed = true;
		destroyLayer();
	});

	// Si cambia el mapa, data, url o los valores: reconstuye o re-estiliza
	$: (async () => {
		if (!map || isDestroyed) return;
		if (data || dataUrl) {
			await ensureLeaflet();
			await loadDataIfNeeded();
			await buildLayer();
		}
	})();

	//$: restyleLayer(); // se ejecuta cuando cambian reactivos usados en styleForFeature

	// Método para limpiar todos los resaltados
	export function clearHighlights() {
		if (!geoLayer) return;

		// Restaurar todos los estilos
		geoLayer.eachLayer((layer: any) => {
			geoLayer.resetStyle(layer);
			const path = layer._path;
			if (path) {
				path.style.filter = '';
			}
		});
	}

	// Método para cerrar los popups abiertos
	export function closePopups() {
		if (map) {
			map.closePopup();
		}
	} // Reaccionar cuando cambia la facultad destacada
	$: {
		if (geoLayer && highlightedFacultad) {
			highlightFeatureById(highlightedFacultad);
			zoomToFeatureById(highlightedFacultad);
		} else if (geoLayer) {
			// Restaurar todos los estilos si no hay facultad destacada
			clearHighlights();
		}
	}
	export { centroides };

	// SVG por defecto (cámbialo por tu laurel/ánfora/columna). Es inline y liviano.
	const DEFAULT_CARD_SVG = `
<svg viewBox="0 0 270.125 270.125"
     xmlns="http://www.w3.org/2000/svg"
     aria-hidden="true"
     width="1em" height="1em"
     fill="currentColor">
  <path d="M33.892,70.088
	c-19.537,1.555-35.578,18.669-33.75,38.771c1.569,17.255,16.823,31.414,34.676,29.519c14.97-1.588,27.251-14.994,25.264-30.604
	c-1.615-12.681-13.199-23.104-26.578-20.975c-10.387,1.653-18.976,11.473-16.606,22.643c0.859,4.047,3.183,7.559,6.492,9.941
	c3.309,2.382,7.922,3.55,12.416,2.119c2.944-0.937,5.294-2.818,6.887-5.521c1.593-2.704,2.11-6.917-0.02-10.262
	c-1.717-2.698-3.293-3.232-5.766-3.648c-1.236-0.208-2.965-0.285-4.805,0.912c-1.84,1.197-2.815,3.672-2.815,5.422
	c-0.017,1.336,0.5,2.623,1.438,3.574c-0.491-0.141-0.978-0.339-1.494-0.711c-1.205-0.868-2.243-2.443-2.553-3.902
	c-1.059-4.992,3.23-9.867,8.395-10.69c7.348-1.17,14.144,4.951,15.088,12.359c1.231,9.671-6.743,18.372-16.4,19.396
	c-11.975,1.271-22.577-8.57-23.66-20.48C8.803,93.684,20.517,81.184,34.685,80.057c0.126-0.01,0.253-0.016,0.379-0.023h200
	c0.126,0.01,0.252,0.014,0.377,0.023c14.168,1.127,25.882,13.627,24.584,27.896c-1.083,11.911-11.685,21.751-23.66,20.48
	c-9.658-1.025-17.632-9.726-16.4-19.396c0.943-7.409,7.739-13.529,15.088-12.359c5.165,0.822,9.454,5.697,8.394,10.69
	c-0.31,1.459-1.348,3.035-2.553,3.902c-0.516,0.371-1,0.57-1.49,0.711c0.936-0.952,1.452-2.239,1.434-3.574
	c0-1.75-0.973-4.225-2.812-5.422c-1.84-1.197-3.568-1.12-4.805-0.912c-2.473,0.416-4.05,0.951-5.768,3.648
	c-2.129,3.344-1.611,7.558-0.018,10.262c1.593,2.704,3.943,4.585,6.887,5.521c4.494,1.43,9.105,0.263,12.414-2.119
	s5.633-5.894,6.492-9.941c2.37-11.169-6.219-20.989-16.605-22.643c-13.379-2.129-24.964,8.294-26.578,20.975
	c-1.988,15.61,10.296,29.015,25.266,30.604c17.852,1.894,33.105-12.264,34.674-29.52c1.828-20.102-14.213-37.217-33.75-38.771
	c-0.406-0.062-0.781-0.037-1.17-0.045h-200c-0.389-0.024-0.8,0.021-1.172,0.047L33.892,70.088z M15.063,20.063c-2.761,0-5,2.239-5,5
	v10c0,1.326,0.527,2.598,1.465,3.535l20,20c0.938,0.938,2.209,1.465,3.535,1.465h200c1.326,0,2.598-0.527,3.535-1.465l20-20
	c0.938-0.938,1.465-2.209,1.465-3.535v-10c0-2.761-2.239-5-5-5C255.063,20.063,15.063,20.063,15.063,20.063z M20.063,30.063h230
	v2.928l-17.072,17.072H37.133l-17.07-17.072V30.063z M75.063,100.063c-2.761,0-5,2.239-5,5v140c0.001,2.762,2.24,5,5.002,4.999
	c0.987,0,1.951-0.292,2.772-0.839l28.441-18.963c1.366-0.91,2.198-2.433,2.227-4.074l1.557-91.039c0-0.028,0-0.056,0-0.084
	c0-3.28,10.058-3.373,10-0.09c0,0.03,0,0.06,0,0.09v80c0.001,2.762,2.24,5,5.002,4.999c0.987,0,1.951-0.292,2.772-0.839l30-20
	c1.391-0.927,2.226-2.488,2.227-4.16v-60c0-3.339,10-3.339,10,0v50c0.001,2.762,2.241,5,5.003,4.998c0.775,0,1.54-0.181,2.234-0.528
	l20-10c1.693-0.847,2.763-2.577,2.764-4.471v-70c0-2.761-2.239-5-5-5h-120H75.063z M80.063,110.063h110v61.908l-10,5v-41.908
	c0-16.668-30-16.668-30,0v57.324l-20,13.334v-70.658v0.088c0.297-16.724-29.998-16.815-29.998-0.088v-0.086l-1.512,88.418
	l-18.488,12.326V110.063L80.063,110.063z"/>
</svg>`;

	// Permite reemplazar el SVG desde afuera si quieres
	export let cardSVG: string = DEFAULT_CARD_SVG;

	// (Opcional) separación vertical hacia abajo
	export let cardOffsetY: number = 16;

	function hoverCardHTML(props: any, id: string, value: number | null) {
		const name = props?.regionName || props?.facultad || id || 'Región';
		//const valTxt = value == null ? '–' : String(value);
		const valTxt = value != null ? String(value) : '0';
		const unidad = unitLabel;

		return `
    <div class="fac-card">
      <div class="fac-card__row">
        <span class="fac-card__icon">${cardSVG}</span>
        <div class="fac-card__col">
          <div class="fac-card__title">${name}</div>
          <div class="fac-card__meta"><b>${valTxt}</b> ${unidad}</div>
        </div>
      </div>
    </div>
  `;
	}
</script>

<div class="geo-json-choropleth-wrapper">
	<!-- Componente no tiene contenido directo, renderiza en el mapa -->
</div>

<style>
	.geo-json-choropleth-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
	}

	/* Estilos para la entidad destacada, sin animaciones pulsantes */
	:global(.faculty-highlight-tooltip) {
		background-color: var(--color--primary) !important;
		color: white !important;
		border: none !important;
		box-shadow: 0 0 15px rgba(var(--color--primary-rgb), 0.6) !important;
		font-weight: bold !important;
		padding: 8px 12px !important;
		border-radius: 20px !important;
		font-size: 14px !important;
		opacity: 0.9 !important;
	}

	:global(.faculty-highlight-tooltip::before) {
		border-top-color: var(--color--primary) !important;
	}
	/* === HOVER: Tooltip al pasar el puntero === */ /* ADD */
	:global(.faculty-hover-tooltip-container) {
		background: var(--color--background-tooltip, #000000) !important; /* fondo negro configurable */
		color: var(--color--text-tooltip, #ffffff) !important; /* texto blanco */
		border: 2px solid var(--color--secondary, #00bcd4) !important; /* borde usando color secondary */
		box-shadow: 0 0 12px rgba(var(--color--secondary-rgb, 0, 188, 212), 0.7) !important; /* efecto glow */
		padding: 6px 10px !important;
		border-radius: 8px !important;
		font-size: 13px !important;
		font-weight: 600 !important;
		pointer-events: none !important; /* no bloquear interacciones */
	}
	:global(.faculty-rank-icon div) {
		background: var(--color--secondary);
		color: white;
		font-weight: bold;
		border-radius: 50%;
		width: 26px;
		height: 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
	}
	/* Contenedor del tooltip Leaflet (sin fondo/borde por defecto) */
	:global(.faculty-card-tooltip) {
		background: transparent !important;
		border: 0 !important;
		box-shadow: none !important;
		padding: 0 !important;
		pointer-events: none !important; /* no bloquea interacciones */
	}

	/* El “card” que aparece y se despliega hacia abajo */
	:global(.faculty-card-tooltip .fac-card) {
		--bg: var(--color--background, #121212);
		--fg: var(--color--text, #ffffff);
		--bd: color-mix(in srgb, var(--color--secondary, #00bcd4) 65%, #000);
		--shadow: 0 8px 20px rgba(0, 0, 0, 0.27), 0 2px 6px rgba(0, 0, 0, 0.484);
		background: var(--bg);
		color: var(--fg);
		border: 1px solid var(--bd);
		border-radius: 12px;
		padding: 8px 10px;
		box-shadow: var(--shadow);

		/* Animación: abrir hacia abajo */
		transform-origin: top center;
		animation: fac-dropdown 0.42s ease-out both;
	}

	/* Layout interno */
	:global(.faculty-card-tooltip .fac-card__row) {
		display: flex;
		flex-direction: column; /* pila vertical */
		align-items: center; /* centrado horizontal */
		grid-template-columns: 18px auto;
		gap: 8px;
		align-items: center;
		text-align: center; /* centra los textos */
	}

	:global(.faculty-card-tooltip .fac-card__icon) {
		order: 3;
		font-size: 36px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--color--secondary, #00bcd4);
		animation: fac-float 3s ease-in-out infinite;
	}
	/* --- 3) Brillo + “flotando” del SVG --- */
	:global(.faculty-card-tooltip .fac-card__icon svg) {
		/* brillo del color secundario + sombra inferior para sensación de flotar */
		filter: drop-shadow(0 0 6px rgba(var(--color--secondary-rgb, 0, 188, 212), 0.7))
			drop-shadow(0 0 14px rgba(var(--color--secondary-rgb, 0, 188, 212), 0.4))
			drop-shadow(0 6px 10px rgba(0, 0, 0, 0.35)); /* sombra hacia abajo */
		transform: translateZ(0);
		will-change: filter, transform;
	}

	:global(.faculty-card-tooltip .fac-card__title) {
		color: var(--color--secondary); 
		order: 1;
		font-weight: 800;
		letter-spacing: 0.2px;
		line-height: 1.1;
	}

	:global(.faculty-card-tooltip .fac-card__meta) {
		color: var(--color--secondary); 
		order: 2;
		font-size: 12px;
		opacity: 0.9;
		margin-top: 2px;
	}

	/* Keyframes del despliegue hacia abajo */
	@keyframes fac-dropdown {
		from {
			opacity: 0;
			transform: translateY(-6px) scaleY(0.85);
			clip-path: inset(0 0 100% 0);
		}
		to {
			opacity: 0.9;
			transform: translateY(0) scaleY(1);
			clip-path: inset(0 0 0 0);
		}
	}

	@keyframes fac-float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}
</style>
