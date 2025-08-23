<script lang="ts">
	import ContentSection from '$lib/components/organisms/ContentSection.svelte';
	import InvestigadoresList from '$lib/components/organisms/InvestigadoresList.svelte';
	import SparklingHighlight from '$lib/components/molecules/SparklingHighlight.svelte';
	import type { Investigador } from '$lib/supabase';

	export let data: {
		investigadores: Investigador[];
	};
</script>

<svelte:head>
	<title>Investigadores UCE - Directorio de Investigadores</title>
	<meta
		name="description"
		content="Directorio completo de investigadores de la Universidad Central del Ecuador con sus líneas de investigación, facultad y contacto."
	/>
</svelte:head>

<div class="container">
	<ContentSection title="Investigadores">
		<br />
		<br />
		<div class="card-overlay">
			<div class="header">
				<h2>
					Directorio de <SparklingHighlight color="primary">Investigadores UCE</SparklingHighlight>
				</h2>
				<p>Explora la comunidad académica e investigativa de la Universidad Central del Ecuador</p>
			</div>
			<InvestigadoresList investigadores={data.investigadores} />
		</div>
	</ContentSection>
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.card-overlay {
		position: relative;
		z-index: 10;
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		transform: translateY(-2rem);
		filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.15));

		@include for-tablet-portrait-down {
			transform: translateY(-1rem);
			padding: 0 1rem;
		}

		@include for-phone-only {
			transform: translateY(0);
		}

		animation: float 6s ease-in-out infinite;
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;

		h2 {
			font-family: var(--font--title);
			font-size: 1.8rem;
			margin-bottom: 1rem;
			color: var(--color--text);
		}

		p {
			color: var(--color--text-shade);
			font-size: 1.1rem;
		}
	}

	@keyframes float {
		0% {
			transform: translateY(-2rem);
		}
		50% {
			transform: translateY(-2.5rem);
		}
		100% {
			transform: translateY(-2rem);
		}
	}
</style>
