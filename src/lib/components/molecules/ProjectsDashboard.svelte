<!-- src/lib/components/molecules/ProjectsDashboard.svelte -->
<script lang="ts">
	import type { Proyecto } from '$lib/services/proyectosService';
	import CircularStatus from '../molecules/CircularStatus.svelte';
	import DonutChart from './DonutChart.svelte';
	import TubeBarChart from './TubeBarChart.svelte';

	export let proyectos: Proyecto[] = []; // los filtrados
	export let totalGeneral: number; // quemado por ahora
	export let proyectosTotales: Proyecto[] = [];

	// ================== Helpers ==================
	function contarPorCampo<T extends string>(
		lista: Proyecto[],
		key: keyof Proyecto,
		format?: (v: any) => string
	): { label: string; value: number }[] {
		const counts: Record<string, number> = {};
		for (const p of lista) {
			let v: any = p[key] ?? 'No especificado';
			if (format) v = format(v);
			counts[v] = (counts[v] || 0) + 1;
		}
		return Object.entries(counts).map(([label, value]) => ({ label, value }));
	}

	function parseYear(dateStr: any) {
		if (!dateStr) return 'No especificado';

		const s = String(dateStr).trim();

		// yyyy-mm-dd o yyyy-mm-ddTHH:mm:ss
		const isoMatch = s.match(/^(\d{4})-\d{2}-\d{2}/);
		if (isoMatch) {
			return isoMatch[1];
		}

		// dd/mm/yyyy
		const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
		if (slashMatch) {
			return slashMatch[3];
		}

		// Último intento: Date()
		const d = new Date(s);
		if (!Number.isNaN(d.getTime())) {
			return String(d.getFullYear());
		}

		return 'No especificado';
	}

	function calcularDuracionMeses(inicio: string, fin: string) {
		if (!inicio || !fin) return null;
		const i = inicio.split('/');
		const f = fin.split('/');
		if (i.length !== 3 || f.length !== 3) return null;
		const start = new Date(+i[2], +i[1] - 1, +i[0]);
		const end = new Date(+f[2], +f[1] - 1, +f[0]);
		return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
	}
	// ================== NUEVOS BLOQUES ==================

	// Helper: contar elementos cuando el campo es array (lineas/paises)
	function contarPorArrayField(
		lista: Proyecto[],
		key: keyof Proyecto,
		normalizar?: (v: string) => string
	): { label: string; value: number }[] {
		const counts: Record<string, number> = {};
		for (const p of lista) {
			const arr = p[key] as any as string[] | undefined;
			const values = Array.isArray(arr) ? arr : [];
			for (const raw of values) {
				const v0 = (raw ?? '').toString().trim();
				if (!v0) continue;
				const v = normalizar ? normalizar(v0) : v0;
				counts[v] = (counts[v] || 0) + 1;
			}
		}
		return Object.entries(counts).map(([label, value]) => ({ label, value }));
	}

	function toNumberSafe(v: any): number | null {
		if (v === null || v === undefined) return null;
		if (typeof v === 'number' && !Number.isNaN(v)) return v;
		const n = Number(v);
		return Number.isNaN(n) ? null : n;
	}

	function avg(nums: number[]) {
		if (!nums.length) return 0;
		return nums.reduce((a, b) => a + b, 0) / nums.length;
	}

	// -------- A) Líneas de investigación Top 10 --------
	function normalizarTexto(t: string) {
		return t.trim().toLowerCase();
	}

	$: dataLineasTop10 = contarPorArrayField(proyectos, 'lineas_investigacion', normalizarTexto)
		.sort((a, b) => b.value - a.value)
		.slice(0, 10)
		// mostramos bonito (Primera letra mayúscula)
		.map((x) => ({ ...x, label: x.label.charAt(0).toUpperCase() + x.label.slice(1) }));

	// -------- B) Con vs Sin acreditados (dona + %) --------
	$: acreditadosCounts = (() => {
		const con = proyectos.filter((p) => !!p.tiene_investigadores_acreditados).length;
		const sin = proyectos.length - con;
		const pct = proyectos.length ? Math.round((con / proyectos.length) * 100) : 0;
		return { con, sin, pct };
	})();

	$: dataAcreditadosDona = [
		{ label: 'Con acreditados', value: acreditadosCounts.con },
		{ label: 'Sin acreditados', value: acreditadosCounts.sin }
	];

	// -------- C) Países Top 10 --------
	$: dataPaisesTop10 = contarPorArrayField(proyectos, 'paises_instituciones', (x) => x.trim())
		.sort((a, b) => b.value - a.value)
		.slice(0, 10);

	// -------- D) Avance Bajo/Medio/Alto + promedio --------
	function bucketAvance(v: number) {
		// asumiendo porcentaje 0..100
		if (v < 34) return 'Bajo (0–33)';
		if (v < 67) return 'Medio (34–66)';
		return 'Alto (67–100)';
	}

	$: avanceStats = (() => {
		const vals = proyectos
			.map((p) => toNumberSafe(p.porcentaje_avance))
			.filter((n): n is number => n !== null);

		const counts: Record<string, number> = {
			'Bajo (0–33)': 0,
			'Medio (34–66)': 0,
			'Alto (67–100)': 0
		};

		for (const v of vals) counts[bucketAvance(v)]++;

		return {
			promedio: vals.length ? Math.round(avg(vals) * 10) / 10 : 0,
			data: Object.entries(counts).map(([label, value]) => ({ label, value }))
		};
	})();

	// -------- E) Presupuesto Bajo/Medio/Alto + total --------
	function bucketPresupuesto(v: number) {
		// umbrales simples (ajústalos si quieres)
		if (v < 10000) return 'Bajo (<10k)';
		if (v < 50000) return 'Medio (10k–50k)';
		return 'Alto (>50k)';
	}

	function calcularPresupuestoTotal(lista: Proyecto[]) {
		return lista
			.map((p) => toNumberSafe(p.monto_presupuesto_total))
			.filter((n): n is number => n !== null)
			.reduce((a, b) => a + b, 0);
	}

	$: presupuestoTotalFiltrado = calcularPresupuestoTotal(proyectos);
	$: presupuestoTotalGeneral = calcularPresupuestoTotal(proyectosTotales);
	$: presupuestoDistribucion = (() => {
		const vals = proyectos
			.map((p) => toNumberSafe(p.monto_presupuesto_total))
			.filter((n): n is number => n !== null);

		const counts = {
			'Bajo (<10k)': 0,
			'Medio (10k–50k)': 0,
			'Alto (>50k)': 0
		};

		for (const v of vals) counts[bucketPresupuesto(v)]++;

		return Object.entries(counts).map(([label, value]) => ({ label, value }));
	})();

	// ================== Datasets ==================
	// 1. General (filtrados vs total)
	$: dataGeneral = [
		{ label: 'Filtrados', value: proyectos.length },
		{ label: 'Total general', value: totalGeneral }
	];

	// 2. Por facultad
	$: dataFacultad = contarPorCampo(proyectos, 'facultad_o_entidad_o_area_responsable');

	// 3. Por tipo de proyecto
	$: dataTipo = contarPorCampo(proyectos, 'tipo_proyecto');

	// 4. Por campo amplio
	$: dataCampo = contarPorCampo(proyectos, 'campo_amplio');

	// 5. Por estado
	$: dataEstado = contarPorCampo(proyectos, 'estado');

	// 6. Por financiamiento
	function formatFinanciamiento(f: string) {
		switch (f) {
			case 'FONDOS_CONCURSABLES_INTERNO_IES':
				return 'Fondos Concursables';
			case 'ASIGNACION_REGULAR_IES':
				return 'Asignación Regular';
			default:
				return f || 'No especificado';
		}
	}
	$: dataFinanciamiento = contarPorCampo(proyectos, 'fuente_financiamiento', formatFinanciamiento);

	// 7. Iniciados por año
	$: dataInicioYear = contarPorCampo(proyectos, 'fecha_inicio', parseYear);

	// 8. Finalizados por año
	$: dataFinYear = contarPorCampo(proyectos, 'fecha_fin_planeado', parseYear);

	// 9. Duración proyectos
	$: dataDuracion = proyectos
		.map((p) => calcularDuracionMeses(p.fecha_inicio, p.fecha_fin_planeado))
		.filter((v) => v !== null) as number[];
	// 10. Top 10 coordinadores
	$: dataCoordinadores = contarPorCampo(proyectos, 'coordinador_director')
		.sort((a, b) => b.value - a.value) // ordenamos de mayor a menor
		.slice(0, 10); // tomamos solo los 10 primeros

	// ================= Colorear datasets ==================
	function asignarColores(data: { label: string; value: number }[]) {
		if (!data || data.length === 0) return [];

		const maxVal = Math.max(...data.map((d) => d.value));
		const minVal = Math.min(...data.map((d) => d.value));

		return data.map((item) => {
			const ratio = item.value / maxVal; // valor relativo al máximo (0–1)

			let colorVarName = '--color--secondary'; // por defecto (medio)
			if (ratio >= 0.75) {
				colorVarName = '--color--callout-accent--success'; // valores grandes
			} else if (ratio >= 0.5) {
				colorVarName = '--color--primary'; // valores medio-altos
			} else if (ratio >= 0.25) {
				colorVarName = '--color--callout-accent--warning'; // valores bajos
			} else {
				colorVarName = '--color--callout-accent--error'; // valores muy bajos
			}

			return { ...item, colorVarName };
		});
	}
	// ===== DEBUG PRESUPUESTO =====
	$: console.log('[Budget] proyectos (filtrados) len =', proyectos?.length ?? 0);
	$: console.log('[Budget] proyectosTotales len =', proyectosTotales?.length ?? 0);

	$: console.log('[Budget] presupuestoTotalFiltrado =', presupuestoTotalFiltrado);
	$: console.log('[Budget] presupuestoTotalGeneral =', presupuestoTotalGeneral);

	// Muestras para detectar formato del monto
	$: console.log(
		'[Budget] sample monto filtrado =',
		proyectos?.find((p) => p.monto_presupuesto_total != null)?.monto_presupuesto_total
	);

	$: console.log(
		'[Budget] sample monto total =',
		proyectosTotales?.find((p) => p.monto_presupuesto_total != null)?.monto_presupuesto_total
	);

	// Conteo de "montos válidos" vs NaN
	$: (() => {
		const vals = (proyectosTotales ?? []).map((p) => toNumberSafe(p.monto_presupuesto_total));
		const valid = vals.filter((v) => v !== null).length;
		const invalid = vals.filter((v) => v === null).length;
		console.log('[Budget] parse totalGeneral valid=', valid, 'invalid=', invalid);
	})();
</script>

<div class="dashboard">
	<!-- 1. Circular filtrados vs total -->
	<CircularStatus
		title="Proyectos filtrados"
		value={proyectos.length}
		total={totalGeneral}
		unit="Proyectos"
		status="primary"
		size="md"
	/>

	<!-- 2. Facultades -->
	<TubeBarChart
		title="Proyectos por Facultad"
		data={asignarColores(dataFacultad)}
		yLabel="Proyectos"
		height={300}
		xRotate={-45}
		performanceMode="low"
	/>

	<!-- 3. Tipos -->
	<DonutChart title="Proyectos por Tipo" data={dataTipo} width={300} height={300} />

	<!-- 4. Campos amplios -->
	<TubeBarChart
		title="Proyectos por Campo Amplio"
		data={asignarColores(dataCampo)}
		yLabel="Proyectos"
		height={300}
		performanceMode="low"
	/>

	<!-- 5. Estados -->
	<DonutChart title="Proyectos por Estado" data={dataEstado} width={300} height={300} />

	<!-- 6. Financiamiento -->
	<TubeBarChart
		title="Proyectos por Financiamiento"
		data={asignarColores(dataFinanciamiento)}
		yLabel="Proyectos"
		height={300}
		performanceMode="low"
	/>

	<!-- 7. Iniciados por año -->
	<TubeBarChart
		title="Proyectos iniciados por año"
		data={asignarColores(dataInicioYear)}
		yLabel="Proyectos"
		height={300}
		performanceMode="low"
	/>

	<!-- 8. Finalizados por año -->
	<TubeBarChart
		title="Proyectos finalizados por año"
		data={asignarColores(dataFinYear)}
		yLabel="Proyectos"
		height={300}
		performanceMode="low"
	/>

	<!-- 9. Duración (como histograma simple por intervalos) -->
	<TubeBarChart
		title="Duración de proyectos (meses)"
		data={[
			{
				label: '0-6',
				value: dataDuracion.filter((d) => d <= 6).length,
				colorVarName: '--color--primary'
			},
			{
				label: '7-12',
				value: dataDuracion.filter((d) => d > 6 && d <= 12).length,
				colorVarName: '--color--secondary'
			},
			{
				label: '13-18',
				value: dataDuracion.filter((d) => d > 12 && d <= 18).length,
				colorVarName: '--color--primary'
			},
			{
				label: '19-24',
				value: dataDuracion.filter((d) => d > 18 && d <= 24).length,
				colorVarName: '--color--callout-accent--success'
			},
			{
				label: '25+',
				value: dataDuracion.filter((d) => d > 24).length,
				colorVarName: '--color--callout-accent--error'
			}
		]}
		yLabel="Proyectos"
		height={300}
	/>
	<!-- 10. Top 10 Coordinadores -->
	<TubeBarChart
		title="Top 10 Coordinadores con más proyectos"
		data={asignarColores(dataCoordinadores)}
		yLabel="Proyectos"
		height={400}
	/>
	<!-- 11. Líneas de investigación (Top 10) -->
	<TubeBarChart
		title="Top 10 Líneas de investigación"
		data={asignarColores(dataLineasTop10)}
		yLabel="Proyectos"
		height={400}
		performanceMode="low"
	/>

	<!-- 12. Con vs Sin acreditados (Dona) -->
	<DonutChart
		title={`Acreditados (Con: ${acreditadosCounts.pct}%)`}
		data={dataAcreditadosDona}
		width={300}
		height={300}
	/>

	<!-- 13. Países (Top 10) -->
	<TubeBarChart
		title="Top 10 Países vinculados"
		data={asignarColores(dataPaisesTop10)}
		yLabel="Proyectos"
		height={400}
		performanceMode="low"
	/>

	<!-- 14. Avance Bajo/Medio/Alto + promedio -->
	<CircularStatus
		title="Avance promedio"
		value={avanceStats.promedio}
		total={100}
		unit="%"
		status="primary"
		size="md"
	/>

	<DonutChart title="Distribución de avance" data={avanceStats.data} width={300} height={300} />

	<!-- 15. Presupuesto Bajo/Medio/Alto + total -->
	<CircularStatus
		title="Presupuesto (filtrado / total)"
		value={presupuestoTotalFiltrado}
		total={presupuestoTotalGeneral || 1}
		unit="$"
		status="secondary"
		size="md"
	/>

	<DonutChart
		title="Distribución de presupuesto"
		data={presupuestoDistribucion}
		width={300}
		height={300}
	/>
</div>

<style lang="scss">
	.dashboard {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.5rem;
		padding: 1rem;
	}
</style>
