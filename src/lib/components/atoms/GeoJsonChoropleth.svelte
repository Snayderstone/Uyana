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

		console.log(
			`Dominio calculado: [${lo}, ${hi}] de valores: [${Math.min(...values)}, ${Math.max(
				...values
			)}]`
		);

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

	function styleForFeature(f: any) {
		const id = f?.properties?.[idProperty];
		const v = id != null ? valueById[id] : undefined;
		// Filtramos los valores y calculamos el dominio
		const filteredValues = Object.values(valueById).filter((x) => typeof x === 'number');
		const domain = computeDomain(filteredValues);

		// Normalizar valor entre 0 y 1
		const t = typeof v === 'number' ? to01(v, domain.lo, domain.hi) : 0;

		// Depurar valores para identificar posibles problemas
		if (id === 'Facultad De Ciencias Agrícolas') {
			console.log(
				`Depuración Facultad De Ciencias Agrícolas: valor=${v}, t=${t}, dominio=[${domain.lo}, ${domain.hi}]`
			);
		}

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
			// === Estilo de borde y glow existente ===
			e.target.setStyle({
				color: hoverLineColor,
				weight: Math.max(2, lineWeight + 1),
				fillOpacity: Math.min(1, baseFillOpacity + 0.1)
			});
			// leve glow en el SVG path
			const path: SVGPathElement | null = (e.target as any)?._path ?? null;
			if (path)
				path.style.filter =
					'drop-shadow(0 0 6px rgba(110,41,231,.55)) drop-shadow(0 0 14px rgba(110,41,231,.28))';
			e.target.bringToFront?.();
			// === HOVER: tooltip al pasar el puntero === // ADD
			const id = feature?.properties?.[idProperty];
			if (id && L) {
				layer
					.bindTooltip(`<div class="faculty-hover-tooltip">${id}</div>`, {
						permanent: false, // se cierra solo
						direction: 'center', // aparece dentro del polígono
						className: 'faculty-hover-tooltip-container', // clase personalizada
						sticky: true, // sigue el puntero
						interactive: false // no bloquea clics
					})
					.openTooltip();
			}
		});

		layer.on('mouseout', (e: any) => {
			if (!geoLayer || !L) return;
			geoLayer.resetStyle(e.target);
			const path: SVGPathElement | null = (e.target as any)?._path ?? null;
			if (path) path.style.filter = '';
			// === HOVER: cerrar tooltip cuando salga el puntero === // ADD
			if (layer.closeTooltip) {
				layer.closeTooltip();
			}
		});

		if (popupEnabled) {
			const id = feature?.properties?.[idProperty];
			const v = id != null ? valueById[id] : null;
			const html = popupFormatter(feature?.properties ?? {}, id, typeof v === 'number' ? v : null);
			layer.bindPopup(html);
		}
	}

	async function buildLayer() {
		if (!map || !loadedData || !L) return;
		destroyLayer();

		geoLayer = L!.geoJSON(loadedData, {
			style: styleForFeature,
			onEachFeature: bindEvents
		});
		geoLayer.addTo(map);
	}

	function restyleLayer() {
		if (!geoLayer) return;
		geoLayer.setStyle(styleForFeature);

		// Si hay una facultad destacada, aplicar estilo especial
		if (highlightedFacultad) {
			highlightFeatureById(highlightedFacultad);
		}
	}

	function destroyLayer() {
		if (geoLayer && map) {
			map.removeLayer(geoLayer);
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

				// Ajustar el mapa a estos límites con animación mejorada
				map.flyToBounds(bounds, {
					padding: [paddingSize, paddingSize],
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
		destroyLayer();
	});

	// Si cambia el mapa, data, url o los valores: reconstuye o re-estiliza
	$: (async () => {
		if (!map) return;
		if (data || dataUrl) {
			await ensureLeaflet();
			await loadDataIfNeeded();
			await buildLayer();
		}
	})();

	$: restyleLayer(); // se ejecuta cuando cambian reactivos usados en styleForFeature

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
</style>
