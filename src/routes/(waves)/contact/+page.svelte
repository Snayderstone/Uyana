<script lang="ts">
	import ContactForm from '$lib/contact/ContactForm.svelte';
</script>

<div class="contacto-page">
	<div class="page-header">
		<div class="header-content">
			<h1>Contáctanos</h1>
			<p class="description">
			Comunícate con la Dirección de Investigación de la Universidad Central del Ecuador.
			Tu opinión y tus consultas son fundamentales para fortalecer la visibilidad y mejora continua de la producción científica institucional.
			</p>
		</div>
		<div class="card-overlay">
			<ContactForm />
		</div>
	</div>
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';
	.contacto-page {
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
			margin: 0 auto
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
			margin-bottom: 10px;

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
