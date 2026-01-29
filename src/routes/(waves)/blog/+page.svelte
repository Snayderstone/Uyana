<script lang="ts">
	import BlogPostCard from '$lib/components/molecules/BlogPostCard.svelte';
	import ContentSection from '$lib/components/organisms/ContentSection.svelte';

	export let data: {
		posts: any[];
	};

	let { posts } = data;
</script>
<svelte:head>
	<title>Blog del Sitio</title>
	<meta name="Blog del Sitio" content="Descubre las últimas novedades sobre investigación, innovación y desarrollo científico en la Universidad Central del Ecuador."/>
	
</svelte:head>

<div class="blog-page">
	<div class="page-header">
		<div class="header-content">
			<h1>Blog</h1>
			<p class="description">
				Descubre las últimas novedades sobre investigación, innovación y desarrollo científico en la
				Universidad Central del Ecuador.
			</p>
		</div>
	</div>

	<div class="card-overlay">
		<div class="grid">
			{#each posts as post}
				<BlogPostCard
					title={post.titulo}
					coverImage={post.imagen_portada}
					excerpt={post.resumen}
					readingTime={post.tiempo_lectura}
					slug={post.slug}
					tags={post.etiquetas}
				/>
			{/each}
		</div>
	</div>
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';
	@import '$lib/scss/_mixins.scss';

	.blog-page {
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 20px 40px;
	}

	.page-header {
		margin-bottom: 30px;
		position: relative;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;
		padding-top: 20px;

		.header-content {
			flex: 1;
			min-width: 300px;
			margin: 0 auto;
		}

		h1 {
			font-size: 2.5rem;
			color: var(--color--text);
			margin-bottom: 10px;

			background: linear-gradient(
				90deg,
				rgb(var(--color--primary-rgb)) 0%,
				rgb(var(--color--secondary-rgb)) 100%
			);
			background-clip: text;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			display: inline-block;

			@include for-phone-only {
				font-size: 2rem;
			}
		}

		.description {
			font-size: 1.1rem;
			color: var(--color--text-shade);
			max-width: 800px;
			margin-bottom: 25px;

			@include for-phone-only {
				font-size: 1rem;
			}
		}
	}
	.card-overlay {
		position: relative;

		z-index: 10;
		width: 100%;
		max-width: 1200px;
		margin: 2rem auto 0;
		transform: translateY(0);
		filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.15));

		@include for-tablet-portrait-down {
			margin-top: 1.5rem;
			padding: 0 1rem;
		}

		@include for-phone-only {
			margin-top: 1rem;
		}

		animation: float 6s ease-in-out infinite;
	}

	@keyframes float {
		0% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-0.5rem);
		}
		100% {
			transform: translateY(0);
		}
	}

	.grid {
		width: 100%;
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		grid-gap: 24px;

		@include for-tablet-portrait-down {
			grid-template-columns: 1fr;
		}

		@include for-tablet-landscape-up {
			// Select every 6 elements, starting from position 1
			// And make it take up 6 columns
			> :global(:nth-child(6n + 1)) {
				grid-column: span 6;
			}
			// Select every 6 elements, starting from position 2
			// And make it take up 3 columns
			> :global(:nth-child(6n + 2)) {
				grid-column: span 3;
			}
			// Select every 6 elements, starting from position 3
			// And make it take up 3 columns
			> :global(:nth-child(6n + 3)) {
				grid-column: span 3;
			}
			// Select every 6 elements, starting from position 4, 5 and 6
			// And make it take up 2 columns
			> :global(:nth-child(6n + 4)),
			:global(:nth-child(6n + 5)),
			:global(:nth-child(6n + 6)) {
				grid-column: span 2;
			}
		}
	}
</style>
