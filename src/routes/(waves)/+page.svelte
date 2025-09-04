<script lang="ts">
	import Hero from '$lib/components/organisms/Hero.svelte';
	import About from '$lib/components/organisms/About.svelte';
	import RecentPosts from '$lib/components/organisms/RecentPosts.svelte';
	import Features from '$lib/components/organisms/Features.svelte';
	import type { Feature, BlogPost } from '$lib/utils/types';
	import CircularStatus from '$lib/components/molecules/CircularStatus.svelte';
	import TubeBarChart from '$lib/components/molecules/TubeBarChart.svelte';
	import PulseLampButton from '$lib/components/organisms/PulseLampButton.svelte';

	export let data: {
		features: Feature[];
		posts: BlogPost[];
	};

	let { features, posts } = data;
	const tituloComponenteCircular = 'Combustible del Desarrollador';
	const processedFiles = 78;
	const totalFiles = 100;
	const statusColorComponenteCircular = 'primary';
	const unitMetricaComponenteCircular = 'codex';
	const tamanioComponenteCircular = 'md';
	const opacityComponenteCircular = 0.3;
	const datos = [
		{ label: 'Svelte', value: 70, colorVarName: '--color--primary' },
		{ label: 'Type Script', value: 40, colorVarName: '--color--secondary' },
		{ label: 'SQL', value: 60, colorVarName: '--color--callout-accent--success' },
		{ label: 'Análisis de Datos', value: 85, colorVarName: '--color--callout-accent--info' },
		{ label: 'Belleza', value: 20, colorVarName: '--color--callout-accent--error' },
		{ label: 'Infidelidad', value: 85, colorVarName: '--color--secondary' },
		{ label: 'Conocimiento en Chicas', value: 20, colorVarName: '--color--callout-accent--warning' },
	];
</script>

<div class="container">
	<Hero />
	<PulseLampButton label="Empezar Ahora!" href="/map" width={280} height={64} speed={1.2} />
	<About />
	{#if posts && posts.length > 0}
		<RecentPosts {posts} />
	{/if}
	<Features {features} />
	<CircularStatus
		title={tituloComponenteCircular}
		value={processedFiles}
		total={totalFiles}
		unit={unitMetricaComponenteCircular}
		status={statusColorComponenteCircular}
		size={tamanioComponenteCircular}
		opacity={opacityComponenteCircular}
		showValueInside={true}
		showDetailsBelow={true}
	/>
	<TubeBarChart
		data={datos}
		unit="$"
		title="Inventario de conocimiento"
		width={1220}
		height={420}
		axisYWidth={0}
		axisXHeight={50}
		marginTop={20}
		marginRight={20}
		yMin={0}
		yMax={100}
		yTickCount={10}
		xRotate={0}
		xLabel="Conocimiento"
		yLabel="Cantidad"
		showGrid={true}
		tubeGapRatio={0.9}
		tubeCornerRatio={0.9}
		glassOpacity={0.85}
		waveHeight={8}
		waveSpeed={2.5}
		bubbles={80}
	/>
</div>
