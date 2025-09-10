<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';

	// Props para controlar la animación
	export let animationDelay = 0;

	// Datos estructurados para las tarjetas
	const cards = [
		{
			title: 'Nuestra Misión',
			icon: '🎯',
			description:
				'Difundir y acercar la investigación de la UCE a la comunidad, usando tecnología abierta e innovadora que fortalezca la cultura científica y el desarrollo del país.'
		},
		{
			title: 'Nuestra Visión',
			icon: '🔭',
			description:
				'Ser la plataforma de referencia en Ecuador y la región andina para la divulgación y representación de la investigación universitaria.'
		}
	];
</script>

<div class="cards-section" in:fly={{ y: 30, duration: 800, delay: animationDelay }}>
	<div class="cards-container">
		{#each cards as card, i}
			<div class="flip-card" in:fly={{ y: 30, duration: 700, delay: animationDelay + i * 250 }}>
				<div class="flip-card-inner">
					<div class="flip-card-front">
						<div class="icon" in:scale={{ delay: animationDelay + i * 250, duration: 500 }}>
							{card.icon}
						</div>
						<h2>{card.title}</h2>
					</div>
					<div class="flip-card-back">
						<p>{card.description}</p>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style lang="scss">
	.cards-section {
		width: 100%;
		padding: 1rem 0;
	}

	.cards-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 2.5rem;
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
	}

	.flip-card {
		background-color: transparent;
		height: 300px;
		perspective: 1000px;

		&:hover .flip-card-inner {
			transform: rotateY(180deg);
		}

		// Añadimos animación al hover
		&:hover .icon {
			transform: scale(1.1);
		}
	}

	.flip-card-inner {
		position: relative;
		width: 100%;
		height: 100%;
		text-align: center;
		transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
		transform-style: preserve-3d;
	}

	.flip-card-front,
	.flip-card-back {
		position: absolute;
		width: 100%;
		height: 100%;
		backface-visibility: hidden;
		border-radius: 1rem;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background: var(--color--card-background);
		border: 1px solid var(--color--border);
		box-shadow: var(--card-shadow);

		// Añadimos transición suave al hover
		transition: all 0.3s ease;

		&:hover {
			box-shadow: var(--card-shadow-hover, 0 8px 30px rgba(0, 0, 0, 0.12));
		}
	}

	.flip-card-front {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		.icon {
			font-size: 4.5rem;
			margin: 0.5rem 0 1.5rem;
			transition: transform 0.3s ease, opacity 0.3s ease;
			position: relative;

			&::after {
				content: '';
				position: absolute;
				width: 100%;
				height: 20px;
				background: radial-gradient(
					ellipse at center,
					rgba(var(--color--primary-rgb), 0.2) 0%,
					rgba(var(--color--primary-rgb), 0) 70%
				);
				bottom: -20px;
				left: 0;
				border-radius: 50%;
				opacity: 0.6;
				transition: transform 0.3s ease, opacity 0.3s ease;
			}
		}
	}

	.flip-card-back {
		transform: rotateY(180deg);
		background: linear-gradient(
			135deg,
			var(--color--primary),
			var(--color--primary-dark, var(--color--primary))
		);
		color: var(--color--primary-contrast, white);

		p {
			line-height: 1.8;
			font-size: 1.15rem;
			max-width: 90%;
			margin: 0 auto;
			font-weight: 400;
			position: relative;

			&::before {
				content: '"';
				font-size: 3rem;
				position: absolute;
				top: -1.5rem;
				left: -0.5rem;
				opacity: 0.2;
				font-family: Georgia, serif;
			}

			&::after {
				content: '"';
				font-size: 3rem;
				position: absolute;
				bottom: -2.5rem;
				right: -0.5rem;
				opacity: 0.2;
				font-family: Georgia, serif;
			}
		}
	}

	h2 {
		font-family: var(--font--title);
		font-size: 1.8rem;
		text-align: center;
		margin-bottom: 1rem;
		color: var(--color--text);
		font-weight: 700;
		letter-spacing: -0.5px;
		position: relative;
		display: inline-block;

		&::after {
			content: '';
			position: absolute;
			width: 40%;
			height: 3px;
			background: var(--color--primary);
			bottom: -0.5rem;
			left: 30%;
			border-radius: 2px;
		}
	}

	// Media queries para mejor responsividad
	@media (max-width: 992px) {
		.cards-container {
			gap: 2rem;
		}

		.flip-card {
			height: 280px;
		}
	}

	@media (max-width: 768px) {
		.cards-container {
			gap: 1.5rem;
		}

		.flip-card {
			height: 260px;
		}

		h2 {
			font-size: 1.5rem;
		}

		.flip-card-front .icon {
			font-size: 3.5rem;
		}

		.flip-card-back p {
			font-size: 1rem;
			line-height: 1.6;
		}
	}

	@media (max-width: 480px) {
		.cards-container {
			grid-template-columns: 1fr;
			max-width: 90%;
		}

		.flip-card {
			height: 230px;
		}

		h2 {
			font-size: 1.4rem;
		}

		.flip-card-front .icon {
			font-size: 3rem;
		}
	}
</style>
