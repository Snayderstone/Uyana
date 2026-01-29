<script>
	import SparklingHighlight from '$lib/components/molecules/SparklingHighlight.svelte';
	import Socials from '$lib/components/molecules/Socials.svelte';
	import Image from '../atoms/Image.svelte';
</script>

<section class="hero-image-section">
	<div class="hero-image-container">
		<Image src="/images/sample-image.png" alt="SIGPI - Plataforma de Gestión de Proyectos de Investigación" />
		<div class="image-caption">
			<h1>SIGPI</h1>
						<p>Unión UCE + Dirección de Investigación = SIGPI</p>

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
					margin-bottom: 40px;
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
					font-size: 32px;
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

	
		
	
</style>
