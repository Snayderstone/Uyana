<script lang="ts">
	import Hero from '$lib/components/organisms/Hero.svelte';
	import About from '$lib/components/organisms/About.svelte';
	import RecentPosts from '$lib/components/organisms/RecentPosts.svelte';
	import Features from '$lib/components/organisms/Features.svelte';
	import type { Feature, BlogPost } from '$lib/utils/types';
	import CircularStatus from '$lib/components/molecules/CircularStatus.svelte';

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
	<About />
	{#if posts && posts.length > 0}
		<RecentPosts {posts} />
	{/if}
	<Features {features} />
</div>
