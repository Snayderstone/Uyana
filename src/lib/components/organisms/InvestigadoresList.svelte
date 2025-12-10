<script lang="ts">
	import InvestigadorCard from '$lib/components/molecules/InvestigadorCard.svelte';
	import InvestigadorFilter from '$lib/components/molecules/InvestigadorFilter.svelte';
	import InvestigadoresChart from '$lib/components/organisms/InvestigadoresChart.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import type { Investigador } from '$lib/models/investigator.model';

	export let investigadores: Investigador[] = [];

	// Investigadores filtrados (inicialmente todos)
	let investigadoresFiltrados = [...investigadores];

	// Vista (grid o list)
	let viewMode: 'grid' | 'list' = 'grid';

	// Vista de contenido (lista o gráfico)
	let contentView: 'list' | 'chart' = 'list';
</script>

<section class="investigadores-container">
	<InvestigadorFilter {investigadores} bind:filtrados={investigadoresFiltrados} />

	<div class="view-controls">
		<div class="tabs">
			<button
				class="tab-button {contentView === 'list' ? 'active' : ''}"
				on:click={() => (contentView = 'list')}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
				</svg>
				Lista de Investigadores
			</button>
			<button
				class="tab-button {contentView === 'chart' ? 'active' : ''}"
				on:click={() => (contentView = 'chart')}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M3 3v18h18" />
					<path d="M18 17V9" />
					<path d="M13 17V5" />
					<path d="M8 17v-3" />
				</svg>
				Distribución por Facultades
			</button>
		</div>

		{#if contentView === 'list'}
			<div class="view-toggle">
				<button
					class="view-button {viewMode === 'grid' ? 'active' : ''}"
					on:click={() => (viewMode = 'grid')}
					aria-label="Ver en cuadrícula"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="3" width="7" height="7" />
						<rect x="14" y="3" width="7" height="7" />
						<rect x="3" y="14" width="7" height="7" />
						<rect x="14" y="14" width="7" height="7" />
					</svg>
				</button>
				<button
					class="view-button {viewMode === 'list' ? 'active' : ''}"
					on:click={() => (viewMode = 'list')}
					aria-label="Ver en lista"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="8" y1="6" x2="21" y2="6" />
						<line x1="8" y1="12" x2="21" y2="12" />
						<line x1="8" y1="18" x2="21" y2="18" />
						<line x1="3" y1="6" x2="3.01" y2="6" />
						<line x1="3" y1="12" x2="3.01" y2="12" />
						<line x1="3" y1="18" x2="3.01" y2="18" />
					</svg>
				</button>
			</div>
		{/if}
	</div>

	{#if contentView === 'list'}
		{#if investigadoresFiltrados.length === 0}
			<div class="no-results">
				<div class="no-results-icon">🔍</div>
				<h3>No se encontraron resultados</h3>
				<p>No se encontraron investigadores con los criterios de búsqueda.</p>
				<p>Intenta con diferentes términos o quita los filtros.</p>
			</div>
		{:else}
			<div class="content-info">
				<p class="results-count">
					Mostrando <span class="highlight">{investigadoresFiltrados.length}</span> de
					<span class="highlight">{investigadores.length}</span> investigadores
				</p>
			</div>
			<div class="investigadores-container-view {viewMode === 'list' ? 'list-view' : 'grid-view'}">
				{#each investigadoresFiltrados as investigador (investigador.id)}
					<div class="investigador-item">
						<InvestigadorCard {investigador} />
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="chart-section">
			<InvestigadoresChart investigadores={investigadoresFiltrados} />
		</div>
	{/if}
</section>

<style lang="scss">
	@import '$lib/scss/_breakpoints.scss';
	@import '$lib/scss/_mixins.scss';

	.investigadores-container {
		background-color: var(--color--card-background);
		border-radius: 16px;
		padding: 30px;
		box-shadow: var(--card-shadow);
		overflow: hidden;
	}

	.view-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 20px 0 25px;
		flex-wrap: wrap;
		position: relative;

		@include for-phone-only {
			flex-direction: column;
			gap: 15px;
		}

		.tabs {
			display: flex;
			gap: 10px;

			@include for-phone-only {
				width: 100%;
			}

			.tab-button {
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 10px 15px;
				border-radius: 10px;
				background: none;
				border: none;
				font-weight: 600;
				font-size: 1rem;
				color: var(--color--text-shade);
				cursor: pointer;
				transition: all 0.2s ease;
				position: relative;

				&:hover {
					background-color: rgba(var(--color--primary-rgb), 0.05);
					color: var(--color--primary);
				}

				&.active {
					background-color: rgba(var(--color--primary-rgb), 0.1);
					color: var(--color--primary);

					&::after {
						content: '';
						position: absolute;
						bottom: -5px;
						left: 50%;
						transform: translateX(-50%);
						width: 30px;
						height: 3px;
						background-color: var(--color--primary);
						border-radius: 3px;
					}
				}

				@include for-phone-only {
					flex: 1;
					justify-content: center;
					padding: 12px;
					font-size: 0.9rem;
				}
			}
		}

		.view-toggle {
			display: flex;
			gap: 10px;

			@include for-phone-only {
				margin: 0 auto;
			}

			.view-button {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 40px;
				height: 40px;
				border-radius: 8px;
				background-color: var(--color--card-background);
				border: 1px solid rgba(var(--color--primary-rgb), 0.2);
				color: var(--color--text-shade);
				cursor: pointer;
				transition: all 0.2s ease;

				&:hover {
					background-color: var(--color--primary-tint);
					color: var(--color--primary);
				}

				&.active {
					background-color: var(--color--primary);
					color: var(--color--primary-contrast);
					border-color: var(--color--primary);
					box-shadow: 0 2px 8px rgba(var(--color--primary-rgb), 0.4);
				}
			}
		}
	}

	.content-info {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 15px;

		.results-count {
			font-size: 0.9rem;
			color: var(--color--text-shade);

			.highlight {
				font-weight: 700;
				color: var(--color--primary);
			}
		}
	}

	.investigadores-container-view {
		transition: all 0.3s ease;

		&.grid-view {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 20px;

			@media (max-width: 480px) {
				grid-template-columns: 1fr;
				gap: 16px;
			}

			@include for-tablet-landscape-up {
				grid-template-columns: repeat(2, 1fr);
				gap: 24px;
			}

			@include for-desktop-up {
				grid-template-columns: repeat(2, 1fr);
				gap: 30px;
			}

			.investigador-item {
				display: flex;
				height: 100%;
			}
		}

		&.list-view {
			display: flex;
			flex-direction: column;
			gap: 15px;

			.investigador-item {
				display: flex;
				height: auto;
				width: 100%;
			}
		}
	}

	.no-results {
		text-align: center;
		padding: 40px 20px;
		background-color: rgba(var(--color--primary-rgb), 0.05);
		border-radius: 10px;
		border: 1px dashed rgba(var(--color--primary-rgb), 0.2);
		margin: 20px 0;

		.no-results-icon {
			font-size: 3rem;
			margin-bottom: 15px;
		}

		h3 {
			font-size: 1.4rem;
			color: var(--color--primary);
			margin: 0 0 10px;
		}

		p {
			font-size: 1rem;
			color: var(--color--text-shade);
			margin: 0 0 8px;
		}
	}

	.chart-section {
		padding: 10px 5px;
		margin-top: 10px;
		animation: fadeIn 0.5s ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
