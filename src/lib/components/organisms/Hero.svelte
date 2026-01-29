<script>
	import SparklingHighlight from '$lib/components/molecules/SparklingHighlight.svelte';
</script>

<section id="hero">
	<h1 class="hello">
		Sistema Integral de <SparklingHighlight color="primary">Gestión</SparklingHighlight>
		de Proyectos de Investigación.
	</h1>
	<div class="Introduccion">
		<h5>
			Visualiza, analiza y descubre la producción científica de la Universidad Central del Ecuador
			mediante mapas interactivos y dashboards.
		</h5>
	</div>
</section>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	#hero {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 15px;
		position: relative;
		padding-top: 80px;
		padding-bottom: 80px 0;

		@include for-phone-only {
			padding: 40px 0 50px;
		}

		.hello {
			text-align: center;
		}
		.Introduccion {
			max-width: 700px;
			text-align: center;

			h5 {
				font-size: 1 rem;
				font-weight: 400 !important;
				padding-top: 30px;
			}

			@include for-phone-only {
				h5 {
					padding: 30px 0px;
					font-size: 1rem;
				}
			}
		}
	}
</style>
