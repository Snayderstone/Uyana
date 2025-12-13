<script lang="ts">
	import Hero from '$lib/components/organisms/Hero.svelte';
	import About from '$lib/components/organisms/About.svelte';
	import RecentPosts from '$lib/components/organisms/RecentPosts.svelte';
	import Features from '$lib/components/organisms/Features.svelte';
	import type { Feature } from '$lib/utils/types';
	import Button from '$lib/components/atoms/Button.svelte';
	import Sparkles from '$lib/components/atoms/Sparkles.svelte';

	export let data: {
		features: Feature[];
		posts: any[];
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
		{ label: 'Conocimiento en Chicas', value: 20, colorVarName: '--color--callout-accent--warning' }
	];
</script>

<div class="container">
	<Hero />
	<div class="container">
		<div class="buttons-wrapper">
			<Sparkles>
				<Button
					href="/map"
					color="primary"
					size="medium"
					style="solid"
					additionalClass="btn-personalizado1"
				>
					!Empezar Ahora!
				</Button>
			</Sparkles>
			<Sparkles>
				<Button
					href="/map"
					color="primary"
					style="understated"
					size="medium"
					additionalClass="btn-personalizado2"
				>
					Explorar Características
				</Button>
			</Sparkles>
		</div>
		<About />
		{#if posts && posts.length > 0}
			<RecentPosts {posts} />
		{/if}
		<Features {features} />
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
		text-align: center; /* ← centra texto e inline-blocks */
	}
	:global(.btn-personalizado2) {
		border-radius: 10px !important;
		border: 1px solid rgb(var(--color--primary-rgb)) !important;
		font-weight: 300 !important;
	}
	:global(.btn-personalizado1) {
		border-radius: 10px !important;
	}
	.buttons-wrapper {
		display: flex;
		flex-direction: column; /* móvil */
		align-items: center;
		gap: 16px; /* espacio entre botones */
		margin: 20px 0;
	}
	/* Pantallas medianas y grandes */
	@media (min-width: 768px) {
		.buttons-wrapper {
			flex-direction: row; /* uno al lado del otro */
			justify-content: center;
			gap: 50px; /* un poco más de espacio */
		}
	}
</style>
