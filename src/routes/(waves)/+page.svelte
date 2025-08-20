<script lang="ts">
	import Hero from '$lib/components/organisms/Hero.svelte';
	import About from '$lib/components/organisms/About.svelte';
	import RecentPosts from '$lib/components/organisms/RecentPosts.svelte';
	import Features from '$lib/components/organisms/Features.svelte';
	import type { Feature, BlogPost } from '$lib/utils/types';
	import CircularStatus from '$lib/components/molecules/CircularStatus.svelte';
	import TubeBarChart from '$lib/components/molecules/TubeBarChart.svelte';

	export let data: {
		features: Feature[];
		posts: BlogPost[];
	};

	let { features, posts } = data;
	const tituloComponenteCircular = 'Archivos procesados';
	const processedFiles = 90;
	const totalFiles = 100;
	const statusColorComponenteCircular = 'primary';
	const unitMetricaComponenteCircular = 'archivos';
	const tamanioComponenteCircular = 'md';
	const opacityComponenteCircular = 0.3;
	const datos = [
		{ label: 'Manzanas', value: 42, colorVarName: '--color--primary' },
		{ label: 'Banana', value: 68, colorVarName: '--color--secondary' },
		{ label: 'Uva', value: 30, colorVarName: '--color--callout-accent--success' },
		{ label: 'Mango', value: 85, colorVarName: '--color--primary' },
	];
</script>

<div class="container">
	<Hero />
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
		title="Inventario por fruta"
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
		xLabel="Frutas"
		yLabel="Cantidad"
		showGrid={true}
		tubeGapRatio={0.9}
		tubeCornerRatio={0.9}
		glassOpacity={0.85}
		waveHeight={8}
		waveSpeed={2.5}
		bubbles={80}
	/>
	<About />
	{#if posts && posts.length > 0}
		<RecentPosts {posts} />
	{/if}
	<Features {features} />
</div>
