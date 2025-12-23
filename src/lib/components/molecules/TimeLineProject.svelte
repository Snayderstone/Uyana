<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte';
	import type { MapLevel } from '$lib/models/project.model';

	// =========================
	// TIPOS
	// =========================
	type ProyectoFlat = {
		anio_inicio: number | null;
		fecha_inicio?: string | null; // "YYYY-MM-DD" o "DD/MM/YYYY"
		monto_presupuesto_total?: number | null;
	};

	type SeriePoint = {
		key: string; // "2020" o "2020-03"
		label: string; // "2020" o "Mar 2020"
		proyectos: number;
		presupuesto: number;
	};

	export let proyectos: ProyectoFlat[] = [];
	export let mapLevel: MapLevel;

	const dispatch = createEventDispatcher();

	// =========================
	// ESTADO
	// =========================
	let series: SeriePoint[] = [];
	let currentIndex = 0;
	let playing = false;
	let speed = 1;
	let timer: any = null;

	let progress = 0; // 0 → 1 (mismo para ambas líneas)
	let hoverPoint: SeriePoint | null = null;
	let hoverType: 'proyectos' | 'presupuesto' | null = null;

	let maxProjects = 1;
	let maxBudget = 1;

	let hasStarted = false; // ✅ solo true cuando Play o slider
	let periodType: 'year' | 'month' = 'year';
	let selectedYear: string | null = null;
	let availableYears: string[] = [];

	// =========================
	// PARSERS (DOBLE)
	// =========================
	function parseISO(fecha: string): { y: number; m: number } | null {
		// "YYYY-MM-DD"
		const m = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (!m) return null;
		const y = Number(m[1]);
		const mm = Number(m[2]);
		if (!y || !mm) return null;
		return { y, m: mm };
	}

	function parseDMY(fecha: string): { y: number; m: number } | null {
		// "DD/MM/YYYY"
		const parts = fecha.split('/');
		if (parts.length !== 3) return null;
		const dd = Number(parts[0]);
		const mm = Number(parts[1]);
		const yy = Number(parts[2]);
		if (!yy || !mm) return null;
		return { y: yy, m: mm };
	}

	function parseYearMonth(fecha?: string | null): { y: number; m: number } | null {
		if (!fecha) return null;
		return parseISO(fecha) ?? parseDMY(fecha);
	}

	function monthKeyFrom(fecha?: string | null): string | null {
		const ym = parseYearMonth(fecha);
		if (!ym) return null;
		const m = String(ym.m).padStart(2, '0');
		return `${ym.y}-${m}`; // "YYYY-MM"
	}

	function yearKeyFrom(p: ProyectoFlat): string | null {
		// preferimos anio_inicio si existe, si no intentamos fecha_inicio
		if (p.anio_inicio) return String(p.anio_inicio);
		const ym = parseYearMonth(p.fecha_inicio ?? null);
		return ym ? String(ym.y) : null;
	}

	function monthLabel(key: string): string {
		// key "YYYY-MM"
		const [y, m] = key.split('-');
		const mm = Number(m);
		const names = [
			'Ene',
			'Feb',
			'Mar',
			'Abr',
			'May',
			'Jun',
			'Jul',
			'Ago',
			'Sep',
			'Oct',
			'Nov',
			'Dic'
		];
		return `${names[Math.max(1, Math.min(12, mm)) - 1]} ${y}`;
	}
	// =========================
	// AÑOS DISPONIBLES
	// =========================
	$: availableYears = (() => {
		if (!proyectos?.length) return [];

		const years = new Set<string>();

		for (const p of proyectos) {
			const y =
				p.anio_inicio != null
					? String(p.anio_inicio)
					: parseYearMonth(p.fecha_inicio ?? null)?.y?.toString();

			if (y) years.add(y);
		}

		return Array.from(years).sort();
	})();
	$: if (periodType === 'month' && !selectedYear && availableYears.length > 0) {
		selectedYear = availableYears[availableYears.length - 1];
	}

	// =========================
	// SERIES (AÑOS / MESES)
	// =========================
	$: {
		// ✅ estas 3 líneas fuerzan la dependencia reactiva
		proyectos;
		periodType;
		selectedYear;

		buildSeries();
	}

	function buildSeries() {
		if (!proyectos?.length) {
			series = [];
			currentIndex = 0;
			progress = 0;
			return;
		}

		const prevKey = series[currentIndex]?.key ?? null;

		// ✅ aquí decides cuál construir
		const arr =
			periodType === 'year'
				? buildYearSeries()
				: selectedYear
				? buildMonthSeries(selectedYear)
				: [];

		series = arr;

		// índice / progress
		if (prevKey) {
			const idx = series.findIndex((s) => s.key === prevKey);
			currentIndex = idx >= 0 ? idx : 0;
		} else {
			currentIndex = 0;
		}

		progress = series.length > 1 ? currentIndex / (series.length - 1) : 0;
		if (!playing) stop();

		// max
		maxProjects = series.length > 0 ? Math.max(...series.map((s) => s.proyectos), 1) : 1;
		maxBudget = series.length > 0 ? Math.max(...series.map((s) => s.presupuesto), 1) : 1;

		// 🔥 DEBUG QUE NO FALLA:
		console.log('[timeline] periodType:', periodType, 'selectedYear:', selectedYear);
		console.log(
			'[timeline] first keys:',
			series.slice(0, 6).map((s) => s.key)
		);
	}

	function buildYearSeries(): SeriePoint[] {
		const map = new Map<string, SeriePoint>();

		for (const p of proyectos) {
			const key = yearKeyFrom(p);
			if (!key) continue;

			if (!map.has(key)) map.set(key, { key, label: key, proyectos: 0, presupuesto: 0 });

			const item = map.get(key)!;
			item.proyectos += 1;

			const budget = Number((p as any).monto_presupuesto_total);
			item.presupuesto += Number.isFinite(budget) ? budget : 0;
		}

		return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
	}

	function buildMonthSeries(year: string): SeriePoint[] {
		const map = new Map<string, SeriePoint>();

		for (const p of proyectos) {
			const ym = parseYearMonth(p.fecha_inicio ?? null);
			if (!ym) continue;

			// ✅ filtro por año seleccionado
			if (String(ym.y) !== year) continue;

			// ✅ key mensual SIEMPRE "YYYY-MM"
			const key = `${ym.y}-${String(ym.m).padStart(2, '0')}`;
			const label = monthLabel(key);

			if (!map.has(key)) map.set(key, { key, label, proyectos: 0, presupuesto: 0 });

			const item = map.get(key)!;
			item.proyectos += 1;

			const budget = Number((p as any).monto_presupuesto_total);
			item.presupuesto += Number.isFinite(budget) ? budget : 0;
		}

		return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
	}

	// =========================
	// CONTROLES
	// =========================
	function play() {
		if (playing || series.length <= 1) {
			// si solo hay 0/1 punto, igual marcamos started para que se vea el punto/linea
			hasStarted = true;
			return;
		}
		playing = true;
		hasStarted = true;
		run();
	}

	function stop() {
		playing = false;
		clearInterval(timer);
	}

	function restart() {
		currentIndex = 0;
		progress = 0;
		hoverPoint = null;
		hoverType = null;

		stop();

		// ✅ volver al estado “no dibujado”
		hasStarted = false;

		// ✅ avisa al padre para que quite el externalValueById del mapa
		dispatch('reset');
	}

	function run() {
		clearInterval(timer);
		timer = setInterval(() => {
			if (currentIndex < series.length - 1) {
				currentIndex++;
				progress = series.length > 1 ? currentIndex / (series.length - 1) : 0;
				emitChange();
			} else {
				stop();
			}
		}, 1000 / speed);
	}

	function setSpeed(s: number) {
		speed = s;
		if (playing) run();
	}

	function setPeriod(t: 'year' | 'month') {
		console.log('[timeline] setPeriod ->', t);
		periodType = t;

		if (t === 'month') {
			// si no hay año seleccionado, usamos el último disponible
			if (!selectedYear && availableYears.length > 0) {
				selectedYear = availableYears[availableYears.length - 1];
			}
		}

		restart();
	}

	// =========================
	// EMITIR AL PADRE
	// =========================
	function emitChange() {
		const point = series[currentIndex];
		if (!point) return;

		dispatch('change', {
			periodType, // 'year' | 'month'
			key: point.key, // "2020" o "2020-03"
			progress,
			mapLevel
		});
	}

	// =========================
	// SVG HELPERS
	// =========================
	const height = 40;
	const width = 100;

	const pad = 2;

	// dividimos el alto en 2 bandas
	const topMinY = pad; // arriba
	const topMaxY = 18; // fin de banda superior

	const botMinY = 22; // inicio banda inferior
	const botMaxY = height - pad; // abajo

	const x = (i: number): number => (series.length <= 1 ? 0 : (i / (series.length - 1)) * width);

	// proyectos se dibuja en la banda superior
	const yProjects = (v: number): number => {
		const t = maxProjects ? v / maxProjects : 0; // 0..1
		return topMaxY - t * (topMaxY - topMinY); // sube hacia arriba
	};

	// presupuesto se dibuja en la banda inferior
	const yBudget = (v: number): number => {
		const t = maxBudget ? v / maxBudget : 0; // 0..1
		return botMaxY - t * (botMaxY - botMinY);
	};
	onDestroy(() => clearInterval(timer));
</script>

<div class="timeline">
	<div class="header">
		<strong>{periodType === 'year' ? 'Año:' : 'Mes:'}</strong>
		<span class="year">{series[currentIndex]?.label ?? '—'}</span>
	</div>

	<!-- Toggle Año / Mes -->
	<div class="period-toggle">
		{#if periodType === 'month'}
			<div class="year-selector">
				<label>Año:</label>
				<select bind:value={selectedYear} on:change={() => restart()}>
					{#each availableYears as y}
						<option value={y}>{y}</option>
					{/each}
				</select>
			</div>
		{/if}
		<button class:active={periodType === 'year'} on:click={() => setPeriod('year')}>Años</button>
		<button class:active={periodType === 'month'} on:click={() => setPeriod('month')}>Meses</button>
	</div>

	<input
		type="range"
		min="0"
		max={Math.max(0, series.length - 1)}
		bind:value={currentIndex}
		on:input={() => {
			hasStarted = true;
			progress = series.length > 1 ? currentIndex / (series.length - 1) : 0;
			emitChange();
		}}
	/>

	<div class="controls">
		<button on:click={playing ? stop : play}>
			{playing ? '⏸ Pausa' : '▶ Play'}
		</button>

		<button on:click={restart}>⟲ Reiniciar</button>

		<div class="speed">
			{#each [1, 2, 3, 4] as s}
				<button class:active={speed === s} on:click={() => setSpeed(s)}>
					x{s}
				</button>
			{/each}
		</div>
	</div>

	{#if series.length > 0}
		<svg
			class="chart"
			viewBox="0 0 100 40"
			preserveAspectRatio="none"
			on:mouseleave={() => {
				hoverPoint = null;
				hoverType = null;
			}}
		>
			<!-- GRID -->
			<g>
				{#each [0.25, 0.5, 0.75] as g}
					<line
						x1="0"
						x2="100"
						y1={height * (1 - g)}
						y2={height * (1 - g)}
						stroke="rgba(255,255,255,0.1)"
					/>
				{/each}
			</g>
			<line x1="0" x2="100" y1="20" y2="20" stroke="rgba(255,255,255,0.08)" />
			<!-- ✅ Solo dibuja cuando el usuario empezó -->
			{#if hasStarted}
				<!-- PROYECTOS -->
				<polyline
					pathLength="100"
					fill="none"
					stroke="var(--color--primary)"
					stroke-width="1.5"
					points={series.map((p, i) => `${x(i)},${yProjects(p.proyectos)}`).join(' ')}
					stroke-dasharray="100"
					stroke-dashoffset={100 - progress * 100}
					on:mousemove={() => (hoverType = 'proyectos')}
				/>

				<!-- PRESUPUESTO -->
				<polyline
					pathLength="100"
					fill="none"
					stroke="var(--color--secondary)"
					stroke-width="1.5"
					points={series.map((p, i) => `${x(i)},${yBudget(p.presupuesto)}`).join(' ')}
					stroke-dasharray="100"
					stroke-dashoffset={100 - progress * 100}
					on:mousemove={() => (hoverType = 'presupuesto')}
				/>

				<!-- NODOS PROYECTOS -->
				<g>
					{#each series.slice(0, currentIndex + 1) as p, i}
						<circle
							cx={x(i)}
							cy={yProjects(p.proyectos)}
							r="2.2"
							fill="white"
							on:mouseenter={() => {
								hoverPoint = p;
								hoverType = 'proyectos';
							}}
							on:mouseleave={() => (hoverPoint = null)}
						/>
						<!-- hit area (invisible) para hover más fácil -->
						<circle
							cx={x(i)}
							cy={yProjects(p.proyectos)}
							r="6"
							fill="transparent"
							pointer-events="all"
							on:mouseenter={() => {
								hoverPoint = p;
								hoverType = 'proyectos';
							}}
							on:mouseleave={() => (hoverPoint = null)}
						/>
					{/each}
				</g>

				<!-- NODOS PRESUPUESTO -->
				<g>
					{#each series.slice(0, currentIndex + 1) as p, i}
						<circle
							cx={x(i)}
							cy={yBudget(p.presupuesto)}
							r="2.2"
							fill="white"
							on:mouseenter={() => {
								hoverPoint = p;
								hoverType = 'presupuesto';
							}}
							on:mouseleave={() => (hoverPoint = null)}
						/>
						<!-- hit area invisible -->
						<circle
							cx={x(i)}
							cy={yBudget(p.presupuesto)}
							r="6"
							fill="transparent"
							pointer-events="all"
							on:mouseenter={() => {
								hoverPoint = p;
								hoverType = 'presupuesto';
							}}
							on:mouseleave={() => (hoverPoint = null)}
						/>
					{/each}
				</g>
			{/if}
		</svg>
	{/if}

	{#if hoverPoint && hoverType}
		<div class="tooltip">
			<strong>{hoverPoint.label}</strong><br />
			{#if hoverType === 'proyectos'}
				Proyectos: {hoverPoint.proyectos}
			{:else}
				Presupuesto: {hoverPoint.presupuesto.toLocaleString()}
			{/if}
		</div>
	{/if}
</div>

<style>
	.timeline {
		background: var(--color--card-background);
		border-radius: 14px;
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		box-shadow: var(--card-shadow);
		position: relative;
	}

	.header {
		display: flex;
		gap: 6px;
		align-items: center;
	}

	.year {
		font-weight: 700;
		color: var(--color--primary);
	}

	.period-toggle {
		display: flex;
		gap: 8px;
	}

	.period-toggle button {
		flex: 1;
		border: none;
		padding: 6px 10px;
		border-radius: 10px;
		cursor: pointer;
		font-weight: 700;
		background: color-mix(in srgb, var(--color--primary) 15%, transparent);
	}

	.period-toggle button.active {
		background: var(--color--primary);
		color: white;
	}

	input[type='range'] {
		width: 100%;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}

	button {
		border: none;
		padding: 6px 10px;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		background: color-mix(in srgb, var(--color--primary) 25%, transparent);
	}

	.speed {
		display: flex;
		gap: 6px;
	}

	.speed button.active {
		background: var(--color--primary);
		color: white;
	}

	.chart {
		width: 100%;
		height: 100%; /* prueba 110–160 */
		display: block;
	}

	.tooltip {
		position: absolute;
		background: var(--color--card-background);
		padding: 6px 8px;
		border-radius: 6px;
		font-size: 0.75rem;
		box-shadow: var(--card-shadow);
		pointer-events: none;
		right: 14px;
		bottom: 14px;
	}
	.year-selector {
		display: flex;
		gap: 8px;
		align-items: center;
		font-weight: 700;
	}

	.year-selector select {
		padding: 4px 8px;
		border-radius: 8px;
		border: none;
		font-weight: 700;
		background: var(--color--card-background);
	}
</style>
