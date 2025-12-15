<!-- src/lib/components/molecules/MapParticipantsChoropleth.svelte -->
<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type { Map } from 'leaflet';
	import GeoJsonChoropleth from '$lib/components/atoms/GeoJsonChoropleth.svelte';
	import type { MapLevel } from '$lib/models/map.model';
	import type { MapParticipantsRegionAggregation } from '$lib/models/map-participants.model';

	const dispatch = createEventDispatcher();

	export let map: Map | null = null;
	export let mapLevel: MapLevel = 'faculty';
	export let aggregations: MapParticipantsRegionAggregation[] = [];
	export let highlightedRegionKey: string | null = null;
	export let hasActiveFilters: boolean = false;

	// GeoJSON generado desde las agregaciones
	let geoJsonData: any = null;
	// mapa id -> valor (número de participantes) para la coropleta
	let valueById: Record<string, number> = {};
	// referencia al componente GeoJsonChoropleth
	let geoJsonInstance: any;

	// Sólo para debug / evitar warning de prop no usada
	$: console.debug('[MapParticipantsChoropleth] hasActiveFilters =', hasActiveFilters);

	// ----------------------------
	// Normalización de nombres
	// ----------------------------
	function normalizarNombreFacultad(nombre: string): string {
		if (!nombre) return 'No especificada';

		let s = nombre.trim().toLowerCase();
		s = s.replace(/^facultad\s+de\s+/, '');
		s = s.replace(/^facultad\s+/, '');
		s = s.replace(/\s+/g, ' ');

		const title = s
			.split(' ')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');

		return `Facultad De ${title}`;
	}

	function getEntityKey(level: MapLevel, rawName?: string | null): string {
		if (!rawName) return 'No especificado';

		const trimmed = rawName.trim();
		if (level === 'faculty') return normalizarNombreFacultad(trimmed);

		// Para instituciones por ahora sólo recortamos espacios
		return trimmed;
	}

	// ----------------------------
	// Construcción del GeoJSON
	// ----------------------------
	const allowedGeomTypes = [
		'Polygon',
		'MultiPolygon',
		'Point',
		'MultiPoint',
		'LineString',
		'MultiLineString'
	];
	function hasValidCoordinates(geomRaw: any): boolean {
		if (!geomRaw || !geomRaw.type || !geomRaw.coordinates) return false;

		// GeoJSON básico: según tipo, la estructura cambia
		const type = geomRaw.type;

		try {
			if (type === 'Point') {
				const [lng, lat] = geomRaw.coordinates;
				return isFinite(lat) && isFinite(lng);
			}

			if (type === 'MultiPoint' || type === 'LineString') {
				return Array.isArray(geomRaw.coordinates) && geomRaw.coordinates.length > 0;
			}

			if (type === 'MultiLineString' || type === 'Polygon') {
				return (
					Array.isArray(geomRaw.coordinates) &&
					geomRaw.coordinates.length > 0 &&
					Array.isArray(geomRaw.coordinates[0]) &&
					geomRaw.coordinates[0].length > 0
				);
			}

			if (type === 'MultiPolygon') {
				return (
					Array.isArray(geomRaw.coordinates) &&
					geomRaw.coordinates.length > 0 &&
					Array.isArray(geomRaw.coordinates[0]) &&
					geomRaw.coordinates[0].length > 0 &&
					Array.isArray(geomRaw.coordinates[0][0]) &&
					geomRaw.coordinates[0][0].length > 0
				);
			}
		} catch {
			return false;
		}

		return true;
	}
	// Recalcular GeoJSON cuando cambien las agregaciones o el nivel
	$: buildGeoJson();

	function buildGeoJson() {
		console.log('[AGG TEST] Ejemplo aggregated:', aggregations[0]);
		if (!aggregations || aggregations.length === 0) {
			geoJsonData = null;
			valueById = {};
			return;
		}

		const features: any[] = [];
		const newValueById: Record<string, number> = {};

		for (const agg of aggregations) {
			const anyAgg = agg as any;
			if (!anyAgg || !anyAgg.geometry) continue;

			let geomRaw: any = anyAgg.geometry;

			if (!geomRaw) {
				console.warn(
					'[MapParticipantsChoropleth] Institución sin geometry, se ignora:',
					agg.regionName
				);
				continue;
			}

			// Caso 1: viene como string JSON
			if (typeof geomRaw === 'string') {
				try {
					geomRaw = JSON.parse(geomRaw);
				} catch (e) {
					console.error('[MapParticipantsChoropleth] Error parseando geometry string:', e);
					continue;
				}
			}

			// Caso 2: viene como Feature completo (type: 'Feature')
			if (geomRaw.type === 'Feature' && geomRaw.geometry) {
				console.debug(
					'[MapParticipantsChoropleth] Geometry era un Feature → extraída la geometry interna',
					agg.regionName
				);
				geomRaw = geomRaw.geometry;
			}

			// Caso 3: viene envuelto como { geometry: { ... } }
			if (geomRaw.geometry && geomRaw.geometry.type && geomRaw.geometry.coordinates) {
				console.debug(
					'[MapParticipantsChoropleth] Geometry estaba envuelta → desenvuelta',
					agg.regionName
				);
				geomRaw = geomRaw.geometry;
			}

			// Caso 4: ya es geometry pura → verificar que tenga type y coordinates
			if (!geomRaw.type || !geomRaw.coordinates) {
				console.warn(
					'[MapParticipantsChoropleth] Geometry con formato irreconocible después de normalizar:',
					agg.regionName,
					geomRaw
				);
				continue;
			}

			// Normalizar el tipo (Polygon, MultiPolygon, etc.)
			geomRaw.type = geomRaw.type.charAt(0).toUpperCase() + geomRaw.type.slice(1).toLowerCase();

			// Normalizar type a formato estándar GeoJSON
			if (typeof geomRaw.type === 'string') {
				const t = geomRaw.type.toLowerCase();
				if (t === 'polygon') geomRaw.type = 'Polygon';
				else if (t === 'multipolygon') geomRaw.type = 'MultiPolygon';
				else if (t === 'point') geomRaw.type = 'Point';
				else if (t === 'multipoint') geomRaw.type = 'MultiPoint';
				else if (t === 'linestring') geomRaw.type = 'LineString';
				else if (t === 'multilinestring') geomRaw.type = 'MultiLineString';
			}

			if (!allowedGeomTypes.includes(geomRaw.type)) {
				console.warn(
					`[MapParticipantsChoropleth] Geometry con tipo no soportado (${geomRaw.type}), se ignora. region=${agg.regionName}`
				);
				continue;
			}
			// 👉 NUEVO: validar coordenadas
			if (!hasValidCoordinates(geomRaw)) {
				console.warn(
					'[MapParticipantsChoropleth] Geometry con coordenadas inválidas, se ignora. region=',
					agg.regionName,
					geomRaw
				);
				continue;
			}

			const level = agg.level ?? mapLevel;
			const regionKey = getEntityKey(level, agg.regionName);
			const total = agg.totalParticipants ?? 0;

			newValueById[regionKey] = total;

			features.push({
				type: 'Feature',
				geometry: geomRaw,
				properties: {
					id: agg.regionId ?? regionKey,
					regionKey,
					regionName: agg.regionName,
					totalParticipants: total,
					totalMale: agg.totalMale,
					totalFemale: agg.totalFemale,
					totalAccredited: agg.totalAccredited,
					level
				}
			});
		}
		const validFeatures = features.filter((feature) => {
			const geom = feature.geometry;
			if (!geom || !geom.type || !geom.coordinates) return false;

			// Reutiliza tu función existente
			return hasValidCoordinates(geom);
		});
		geoJsonData = {
			type: 'FeatureCollection',
			features: validFeatures // ← solo los válidos
		};
		console.log('[GEOJSON TEST] first feature:', geoJsonData.features[0]);
		valueById = newValueById;

		console.debug('[MapParticipantsChoropleth] GeoJSON generado', {
			features: features.length,
			level: mapLevel
		});
	}

	// ----------------------------
	// Popup
	// ----------------------------
	function formatPopup(props: any, id: string, value: number | null): string {
		const regionName = props?.regionName || props?.facultad || id || 'Región';
		const level: MapLevel = props?.level || mapLevel;
		const total = props?.totalParticipants ?? value ?? 0;

		const icon = level === 'faculty' ? '🎓' : '🏛️';

		// Tomar algunas métricas numéricas extra (distintas de totalParticipants)
		const extraNumericEntries = Object.entries(props || {})
			.filter(([key, val]) => {
				if (typeof val !== 'number') return false;
				if (key === 'totalParticipants') return false;
				if (key === 'projectCount') return false;
				if (key === 'id' || key === 'regionId') return false;
				if (key === 'geometry') return false;
				return true;
			})
			.slice(0, 4);

		const extraStatsHtml =
			extraNumericEntries.length > 0
				? extraNumericEntries
						.map(([key, val]) => {
							const label = key.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
							return `
          <div class="stat">
            <span class="stat-label">${label}</span>
            <span class="stat-value">${val}</span>
          </div>
        `;
						})
						.join('')
				: '';

		const intensityClass = total > 30 ? 'high' : total > 10 ? 'medium' : 'low';

		return `
      <div class="participants-popup">
        <div class="popup-header intensity-${intensityClass}">
          <span class="popup-icon">${icon}</span>
          <h3>${regionName}</h3>
          <span class="popup-count">${total}</span>
        </div>

        <div class="popup-stats">
          <div class="stat">
            <span class="stat-label">Participantes</span>
            <span class="stat-value">${total}</span>
          </div>
          ${extraStatsHtml}
        </div>

        <div class="popup-footer">
          <button class="view-all-btn" onclick="(function() {
            var map = window.__leafletMapInstance;
            if (map && map.closePopup) { map.closePopup(); }
            document.dispatchEvent(new CustomEvent('view-region-participants', { detail: '${regionName}' }));
          })();">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Ver participantes
          </button>
        </div>
      </div>
    `;
	}

	// ----------------------------
	// Colores de la coropleta
	// ----------------------------
	function generateColor(t: number): string {
		const clamped = Math.max(0, Math.min(1, t));
		const enhancedT = Math.pow(clamped, 0.7);

		if (enhancedT < 0.1) {
			return `color-mix(in srgb, var(--color--primary, #6E29E7) 10%, white)`;
		} else if (enhancedT < 0.3) {
			return `color-mix(in srgb, var(--color--primary, #6E29E7) 25%, white)`;
		} else if (enhancedT < 0.5) {
			return `color-mix(in srgb, var(--color--primary, #6E29E7) 40%, white)`;
		} else if (enhancedT < 0.7) {
			return `color-mix(in srgb, var(--color--primary, #6E29E7) 55%, white)`;
		} else if (enhancedT < 0.9) {
			return `color-mix(in srgb, var(--color--primary, #6E29E7) 70%, white)`;
		} else {
			return `color-mix(in srgb, var(--color--primary, #6E29E7) 85%, white)`;
		}
	}

	// ----------------------------
	// Eventos globales / mapa
	// ----------------------------
	function handleMapClick(e: any) {
		dispatch('mapClick', e);
	}

	function handleViewRegionParticipants(e: any) {
		const regionName = e.detail;
		// cerrar popup desde el propio GeoJsonChoropleth si expone método
		if (geoJsonInstance && typeof geoJsonInstance.closePopups === 'function') {
			geoJsonInstance.closePopups();
		}
		dispatch('viewRegionParticipants', regionName);
	}

	onMount(() => {
		// Guardar instancia del mapa de forma global para el onclick inline del botón (truco simple)
		if (map) {
			(window as any).__leafletMapInstance = map;
			map.on('click', handleMapClick);
		}

		document.addEventListener('view-region-participants', handleViewRegionParticipants as any);
	});

	onDestroy(() => {
		if (map) {
			map.off('click', handleMapClick);
		}
		document.removeEventListener('view-region-participants', handleViewRegionParticipants as any);
	});

	// Permitir que el padre pueda forzar limpiar highlights si algún día lo necesitas
	export function resetHighlights() {
		if (geoJsonInstance && typeof geoJsonInstance.clearHighlights === 'function') {
			geoJsonInstance.clearHighlights();
		}
		dispatch('resetHighlights');
	}
</script>

{#if map && geoJsonData}
	<div aria-label="Mapa de participantes por región">
		{#if map && geoJsonData}
			{#key mapLevel + JSON.stringify(geoJsonData.features.length)}
				<GeoJsonChoropleth
					{map}
					data={geoJsonData}
					idProperty="regionKey"
					{valueById}
					popupFormatter={formatPopup}
					baseFillOpacity={0.85}
					hoverEnabled={true}
					popupEnabled={true}
					highlightedFacultad={highlightedRegionKey}
					highlightStyle={{
						color: '#ff00ff',
						weight: 4,
						opacity: 1,
						fillOpacity: 0.9,
						dashArray: '5, 10',
						className: 'highlighted-feature'
					}}
					bind:this={geoJsonInstance}
				/>
			{/key}
		{/if}
	</div>
{/if}

<style lang="scss">
	:global(.participants-popup) {
		font-family: var(--font-sans);
		color: var(--color--text);
		max-width: 360px;
		border-radius: 10px;
		width: max-content;
	}

	:global(.participants-popup h3) {
		margin: 0;
		font-weight: 700;
		color: var(--color--primary);
		font-size: 1rem;
		word-break: break-word;
	}

	:global(.popup-header) {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 8px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--color--border);
		position: relative;
	}

	:global(.popup-icon) {
		font-size: 1.5rem;
	}

	:global(.popup-count) {
		position: absolute;
		right: 0;
		top: 0;
		font-weight: bold;
		font-size: 14px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		padding: 2px 8px;
	}

	:global(.intensity-high) {
		background: color-mix(in srgb, var(--color--primary) 35%, transparent);
	}

	:global(.intensity-medium) {
		background: color-mix(in srgb, var(--color--primary) 20%, transparent);
	}

	:global(.intensity-low) {
		background: color-mix(in srgb, var(--color--primary) 10%, transparent);
	}

	:global(.popup-stats) {
		display: grid;
		gap: 4px;
		margin-bottom: 8px;
		border-bottom: 1px solid color-mix(in srgb, var(--color--text) 15%, transparent);
		padding-bottom: 8px;
		background: color-mix(in srgb, var(--color--card-background) 90%, transparent);
		border-radius: 6px;
		padding: 6px 8px;
	}

	:global(.popup-stats .stat) {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
	}

	:global(.popup-stats .stat-label) {
		font-weight: 500;
		color: var(--color--text-shade);
	}

	:global(.popup-stats .stat-value) {
		font-weight: 600;
		color: var(--color--text);
	}

	:global(.popup-footer) {
		margin-top: 6px;
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
		display: inline-flex;
		align-items: center;
		gap: 4px;
		transition: all 0.2s ease;
	}

	:global(.view-all-btn:hover) {
		filter: brightness(1.05);
		transform: translateY(-1px);
	}

	:global(.leaflet-popup-content-wrapper) {
		border-radius: 10px !important;
		box-shadow: var(--card-shadow), 0 8px 20px rgba(0, 0, 0, 0.08) !important;
		padding: 10px !important;
		background: color-mix(in srgb, var(--color--card-background) 80%, transparent) !important;
	}

	:global(.leaflet-popup-content) {
		margin: 5px !important;
		width: auto !important;
		overflow-wrap: break-word !important;
	}

	:global(.leaflet-choropleth-layer path) {
		transition: fill 0.5s ease-out, stroke-width 0.3s ease, filter 0.3s ease;
	}

	:global(.leaflet-interactive:hover) {
		filter: drop-shadow(0 0 5px rgba(var(--color--primary-rgb, 110, 41, 231), 0.5)) brightness(1.05);
		stroke-width: 2px !important;
	}
</style>
