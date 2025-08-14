<script>
	import SparklingHighlight from '$lib/components/molecules/SparklingHighlight.svelte';
	import Socials from '$lib/components/molecules/Socials.svelte';
	import Image from '../atoms/Image.svelte';
</script>

<section class="hero-image-section">
	<div class="hero-image-container">
		<Image src="/images/sample-image.png" alt="UYANA - Plataforma de investigaciones UCE" />
		<div class="image-caption">
			<h1>UYANA</h1>
			<p>Unión UCE + Dirección de Investigación</p>
		</div>
	</div>
</section>

<section id="about">
	<div class="info">
		<h2>
			Explorando las Investigaciones de la UCE a través de 
			<SparklingHighlight color="secondary">UYANA</SparklingHighlight>
		</h2>
		<p>
			UYANA es una plataforma innovadora que permite visualizar en un mapa interactivo las investigaciones
			desarrolladas por la Universidad Central del Ecuador. Facilitando el acceso y la difusión del
			conocimiento científico producido por nuestra comunidad universitaria.
		</p>
		<div class="socials">
			<span>Síguenos:</span>
			<Socials />
		</div>
	</div>
</section>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.hero-image-section {
		width: 100%;
		padding: 0;
		margin-bottom: 40px;
		position: relative;
		overflow: hidden;
		
		border-radius: 8px;
		
		.hero-image-container {
			position: relative;
			width: 100%;
			max-width: 1000px;
			margin: 0 auto;
			padding: 40px 20px;
			display: flex;
			flex-direction: column;
			align-items: center;
			
			:global(img) {
				max-width: 100%;
				height: auto;
				border-radius: 8px;
				box-shadow: var(--card-shadow);
				transition: transform 0.3s ease;
				
				&:hover {
					transform: scale(1.01);
				}
			}
			
			.image-caption {
				margin-top: 20px;
				text-align: center;
				
				h1 {
					font-size: 2.5rem;
					margin-bottom: 10px;
					background: linear-gradient(
						90deg, 
						rgb(var(--color--primary-rgb)) 0%, 
						rgb(var(--color--secondary-rgb)) 100%
					);
					background-clip: text;
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					font-weight: 900;
				}
				
				p {
					font-size: 1.2rem;
					color: var(--color--text-shade);
					font-weight: 500;
				}
				
				@include for-phone-only {
					h1 {
						font-size: 2rem;
					}
					
					p {
						font-size: 1rem;
					}
				}
			}
		}
	}

	#about {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 30px 20px 50px;
		
		.info {
			display: flex;
			flex-direction: column;
			gap: 20px;
			width: 100%;
			max-width: 800px;
			
			h2 {
				text-align: center;
				font-size: 1.8rem;
				
				@include for-phone-only {
					font-size: 1.5rem;
				}
			}

			p {
				text-align: center;
				font-size: 1.1rem;
				line-height: 1.6;
				
				@include for-phone-only {
					text-align: justify;
					font-size: 1rem;
				}
			}

			@include for-phone-only {
				gap: 20px;
			}
		}

		.socials {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 15px;
			margin-top: 20px;
			
			span {
				font-weight: 600;
				color: var(--color--text-shade);
			}

			@include for-phone-only {
				margin-bottom: 10px;
				span {
					display: none;
				}
			}
		}
	}
</style>
