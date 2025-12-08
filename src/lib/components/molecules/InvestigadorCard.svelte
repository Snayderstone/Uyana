<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import type { Investigador } from '$lib/supabase';
	import ExternalLink from '$lib/icons/external-link.svelte';

	export let investigador: Investigador;
</script>

<Card additionalClass="investigador-card">
	<div slot="content" class="card-content">
		<div class="glow-effect" />
		<div class="profile-section">
			<div class="photo-container">
				<img
					src={investigador.foto}
					alt={`Foto de ${investigador.nombre}`}
					loading="lazy"
					class="profile-photo"
				/>
			</div>
			<div class="name-info">
				<h3>{investigador.nombre}</h3>
				<div class="faculty">
					<span class="faculty-name">{investigador.facultad}</span>
				</div>
				{#if investigador.email}
					<div class="email">
						<a href={`mailto:${investigador.email}`}>{investigador.email}</a>
					</div>
				{/if}
			</div>
		</div>

		<div class="details-section">
			{#if investigador.linea_investigacion}
				<div class="research-line">
					<h4><span class="icon">📚</span> Líneas de Investigación</h4>
					<p>{investigador.linea_investigacion}</p>
				</div>
			{/if}

			{#if investigador.redesArray && investigador.redesArray.length > 0}
				<div class="social-networks">
					<h4><span class="icon">🔗</span> Redes</h4>
					<div class="links">
						{#each investigador.redesArray as red}
							<a href={red.url} target="_blank" rel="noopener noreferrer" class="social-link">
								<span>{red.nombre}</span>
								<ExternalLink />
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</Card>

<style lang="scss">
	@import '$lib/scss/_breakpoints.scss';

	:global(.investigador-card) {
		height: 100%;
		overflow: hidden;
		border-radius: 12px !important;
		box-shadow: var(--card-shadow);
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		background: rgba(var(--color--card-background-rgb), 0.85) !important;
		backdrop-filter: blur(10px) !important;
		border: 1px solid rgba(255, 255, 255, 0.1) !important;

		&:hover {
			transform: translateY(-3px);
			box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
			background: rgba(var(--color--card-background-rgb), 0.95) !important;
		}
	}

	.card-content {
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
		z-index: 1;
		overflow: hidden;
	}

	.glow-effect {
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(
			circle,
			rgba(var(--color--primary-rgb), 0.1) 0%,
			rgba(var(--color--secondary-rgb), 0.05) 25%,
			transparent 70%
		);
		opacity: 0;
		z-index: -1;
		transition: opacity 0.3s ease;
		transform: rotate(30deg);
		pointer-events: none;
	}

	:global(.investigador-card:hover) .glow-effect {
		opacity: 1;
		animation: pulse 3s infinite alternate;
	}

	@keyframes pulse {
		0% {
			transform: rotate(30deg) scale(1);
		}
		100% {
			transform: rotate(30deg) scale(1.05);
		}
	}

	.profile-section {
		display: flex;
		align-items: center;
		padding-bottom: 16px;
		margin-bottom: 16px;
		border-bottom: 1px solid rgba(var(--color--primary-rgb), 0.15);
	}

	.photo-container {
		flex-shrink: 0;
		width: 90px;
		height: 90px;
		margin-right: 20px;
		border-radius: 50%;
		overflow: hidden;
		position: relative;
		padding: 3px;
		background: linear-gradient(135deg, var(--color--primary), var(--color--secondary));
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

		&::before {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: 50%;
			padding: 3px;
			background: linear-gradient(45deg, var(--color--primary), var(--color--secondary));
			-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
			mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
			-webkit-mask-composite: xor;
			mask-composite: exclude;
			opacity: 0.7;
		}

		.profile-photo {
			width: 100%;
			height: 100%;
			object-fit: cover;
			border-radius: 50%;
		}
	}

	.name-info {
		flex: 1;
		min-width: 0; // Ensures text wrapping

		h3 {
			margin: 0 0 6px;
			font-size: 1.2rem;
			font-weight: 700;
			color: var(--color--primary);
			line-height: 1.3;
			overflow: hidden;
			text-overflow: ellipsis;
			display: -webkit-box;
			display: box;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			-webkit-box-orient: vertical;
			box-orient: vertical;
		}
	}

	.faculty-name {
		display: block;
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--color--text-shade);
		margin-bottom: 5px;
	}

	.email a {
		color: var(--color--primary);
		font-weight: 500;
		font-size: 0.85rem;
		text-decoration: none;
		transition: color 0.2s ease;
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		&:hover {
			color: var(--color--secondary);
			text-decoration: underline;
		}
	}

	.details-section {
		flex: 1;
	}

	h4 {
		display: flex;
		align-items: center;
		margin: 12px 0 8px 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color--text);
		position: relative;

		.icon {
			margin-right: 8px;
			font-size: 1rem;
		}
	}

	.research-line {
		p {
			margin: 0;
			padding: 0;
			font-size: 0.9rem;
			line-height: 1.4;
			color: var(--color--text-shade);
			display: -webkit-box;
			display: box;
			-webkit-line-clamp: 4;
			line-clamp: 4;
			-webkit-box-orient: vertical;
			box-orient: vertical;
			overflow: hidden;
		}
	}

	.social-networks {
		margin-top: 15px;

		.links {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;

			.social-link {
				display: inline-flex;
				align-items: center;
				gap: 4px;
				font-size: 0.8rem;
				font-weight: 500;
				padding: 4px 10px;
				background-color: var(--color--primary-tint);
				border-radius: 6px;
				color: var(--color--primary);
				text-decoration: none;
				transition: all 0.2s ease-in-out;
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

				:global(svg) {
					width: 12px;
					height: 12px;
				}

				&:hover {
					background-color: var(--color--primary);
					color: var(--color--primary-contrast);
				}
			}
		}
	}
</style>
