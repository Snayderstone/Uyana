<script lang="ts">
	import type { Investigador } from '$lib/models/investigator.model';
	import { fade, scale } from 'svelte/transition';
	import { onMount } from 'svelte';

	export let investigadores: Investigador[] = [];

	let searchTerm = '';
	let selectedFacultad = '';
	let selectedCarrera = '';
	let filteredInvestigadores: Investigador[] = [];
	let loading = false;

	// Obtener listas únicas de facultades y carreras
	$: facultades = [...new Set(investigadores.map((inv) => inv.facultad))].sort();
	$: carreras = [...new Set(investigadores.map((inv) => inv.carrera))].sort();

	// Filtrar investigadores localmente
	$: {
		let result = investigadores;

		// Filtrar por facultad
		if (selectedFacultad) {
			result = result.filter((inv) => inv.facultad === selectedFacultad);
		}

		// Filtrar por carrera
		if (selectedCarrera) {
			result = result.filter((inv) => inv.carrera === selectedCarrera);
		}

		// Filtrar por búsqueda
		if (searchTerm.trim() !== '') {
			const term = searchTerm.toLowerCase().trim();
			result = result.filter((inv) => {
				return (
					inv.nombre.toLowerCase().includes(term) ||
					inv.carrera.toLowerCase().includes(term) ||
					inv.linea_investigacion.toLowerCase().includes(term) ||
					inv.facultad.toLowerCase().includes(term)
				);
			});
		}

		filteredInvestigadores = result;
	}

	onMount(() => {
		filteredInvestigadores = investigadores;
	});

	function parseRedesSociales(redes: string): Array<{ nombre: string; url: string }> {
		if (!redes || redes.trim() === '') return [];
		try {
			const parsed = JSON.parse(redes);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
</script>

<div class="researcher-directory">
	<!-- Search and Filters -->
	<div class="search-filter-container">
		<!-- Search Box Principal -->
		<div class="search-box-wrapper">
			<div class="search-box">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="search-icon"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.3-4.3" />
				</svg>
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Buscar investigadores por nombre, carrera o línea de investigación..."
					class="search-input"
				/>
				{#if searchTerm}
					<button class="clear-button" on:click={() => (searchTerm = '')} transition:scale>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				{/if}
			</div>
		</div>

		<!-- Filters Section -->
		<div class="filters-section">
			<!-- Filtrar por Label -->
			<div class="filter-label">
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
					<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
				</svg>
				<span>Filtrar por:</span>
			</div>

			<!-- Select Facultad -->
			<select
				id="facultad-filter"
				bind:value={selectedFacultad}
				class="filter-select"
				aria-label="Filtrar por facultad"
			>
				<option value="">Todas las facultades</option>
				{#each facultades as facultad}
					<option value={facultad}>{facultad}</option>
				{/each}
			</select>

			<!-- Select Carrera -->
			<select
				id="carrera-filter"
				bind:value={selectedCarrera}
				class="filter-select"
				aria-label="Filtrar por carrera"
			>
				<option value="">Todas las carreras</option>
				{#each carreras as carrera}
					<option value={carrera}>{carrera}</option>
				{/each}
			</select>

			<!-- Clear Filters Button -->
			{#if selectedFacultad || selectedCarrera}
				<button
					class="clear-filters-btn"
					on:click={() => {
						selectedFacultad = '';
						selectedCarrera = '';
					}}
					transition:fade
					aria-label="Limpiar filtros"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
					Limpiar filtros
				</button>
			{/if}
		</div>

		<!-- Results Count -->
		<div class="results-wrapper">
			{#if searchTerm || selectedFacultad || selectedCarrera}
				<div in:fade class="results-badge filtered">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
						<circle cx="12" cy="10" r="3" />
					</svg>
					{filteredInvestigadores.length} resultado{filteredInvestigadores.length !== 1 ? 's' : ''}
				</div>
			{:else}
				<div class="results-badge total">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
						<path d="M16 3.13a4 4 0 0 1 0 7.75" />
					</svg>
					{investigadores.length} investigador{investigadores.length !== 1 ? 'es' : ''}
				</div>
			{/if}
		</div>
	</div>

	<!-- Researchers Grid -->
	{#if loading}
		<div class="loading-state">
			<div class="loader" />
			<p>Cargando investigadores...</p>
		</div>
	{:else if filteredInvestigadores.length === 0}
		<div class="empty-state" in:fade>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="11" cy="11" r="8" />
				<path d="m21 21-4.3-4.3" />
			</svg>
			<h3>No se encontraron investigadores</h3>
			<p>Intenta con otros términos de búsqueda o filtros</p>
		</div>
	{:else}
		<div class="researchers-grid" in:fade={{ duration: 200 }}>
			{#each filteredInvestigadores as investigador (investigador.id)}
				<div class="researcher-card" in:fade={{ duration: 200 }}>
					<div class="card-header">
						<div class="avatar-container">
							<img src={investigador.foto} alt={investigador.nombre} class="avatar" />
						</div>
						<div class="header-info">
							<h3 class="researcher-name">{investigador.nombre}</h3>
							{#if investigador.email}
								<a href="mailto:{investigador.email}" class="email-link">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<rect width="20" height="16" x="2" y="4" rx="2" />
										<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
									</svg>
									{investigador.email}
								</a>
							{/if}
						</div>
					</div>

					<div class="card-body">
						<div class="info-row">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="info-icon"
							>
								<path d="M12 12h.01" />
								<path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
								<path d="M22 13a18.15 18.15 0 0 1-20 0" />
								<rect width="20" height="14" x="2" y="6" rx="2" />
							</svg>
							<div class="info-content">
								<span class="info-label">Línea de Investigación:</span>
								<span class="info-value">{investigador.linea_investigacion}</span>
							</div>
						</div>

						<div class="info-row">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="info-icon"
							>
								<path d="M22 10v6M2 10l10-5 10 5-10 5z" />
								<path d="M6 12v5c3 3 9 3 12 0v-5" />
							</svg>
							<div class="info-content">
								<span class="info-label">Facultad:</span>
								<span class="info-value">{investigador.facultad}</span>
							</div>
						</div>

						<div class="info-row">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="info-icon"
							>
								<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
							</svg>
							<div class="info-content">
								<span class="info-label">Carrera:</span>
								<span class="info-value">{investigador.carrera}</span>
							</div>
						</div>

						{#if investigador.redes}
							{@const redesArray = parseRedesSociales(investigador.redes)}
							{#if redesArray.length > 0}
								<div class="social-links">
									{#each redesArray as red}
										<a href={red.url} target="_blank" rel="noopener noreferrer" class="social-link">
											{red.nombre}
										</a>
									{/each}
								</div>
							{/if}
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.researcher-directory {
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem 0;

		// Optimizar renderizado de colores durante cambio de tema
		* {
			// Prevenir FOUC (Flash of Unstyled Content) en cambio de tema
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
		}
	}

	.search-filter-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		margin-bottom: 2.5rem;
	}

	// Search Box Principal
	.search-box-wrapper {
		width: 100%;
	}

	.search-box {
		position: relative;
		width: 100%;

		.search-icon {
			position: absolute;
			left: 1.25rem;
			top: 50%;
			transform: translateY(-50%);
			color: var(--color--primary);
			pointer-events: none;
			opacity: 0.7;
		}

		.search-input {
			width: 100%;
			padding: 1rem 3.5rem 1rem 3.5rem;
			font-size: 1.0625rem;
			border: 1.5px solid rgba(138, 43, 226, 0.3);
			border-radius: 10px;
			background: var(--color--card-background);
			color: var(--color--text);
			transition:
				border-color 0.2s ease,
				box-shadow 0.2s ease,
				transform 0.2s ease;
			font-family: inherit;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

			&:focus {
				outline: none;
				border-color: var(--color--primary);
				box-shadow: 0 4px 16px rgba(var(--color--primary-rgb), 0.15);
				transform: translateY(-1px);
			}

			&::placeholder {
				color: var(--color--text-shade);
				opacity: 0.65;
			}
		}

		.clear-button {
			position: absolute;
			right: 1.25rem;
			top: 50%;
			transform: translateY(-50%);
			background: rgba(var(--color--text-rgb), 0.08);
			border: none;
			border-radius: 50%;
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			color: var(--color--text-shade);
			transition: transform 0.15s ease;

			&:hover {
				background: rgba(var(--color--primary-rgb), 0.15);
				color: var(--color--primary);
			}

			&:active {
				transform: translateY(-50%) scale(0.95);
			}
		}
	}

	// Filters Section (contenedor unificado)
	.filters-section {
		width: 100%;
		padding: 1.25rem;
		background: var(--color--card-background);
		border: 1.5px solid rgba(138, 43, 226, 0.3);
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.filter-label {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color--text);

		svg {
			color: var(--color--primary);
			opacity: 0.8;
		}
	}

	.filter-select {
		width: 100%;
		padding: 0.875rem 1rem;
		font-size: 0.9375rem;
		border: 1.5px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		background: var(--color--page-background);
		color: var(--color--text);
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			transform 0.15s ease;
		font-family: inherit;
		max-height: 300px;
		overflow-y: auto;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
		font-weight: 500;

		&:focus {
			outline: none;
			border-color: var(--color--primary);
			box-shadow: 0 0 0 3px rgba(var(--color--primary-rgb), 0.08);
		}

		&:hover {
			border-color: var(--color--primary-shade);
			background: var(--color--card-background);
		}

		option {
			background: var(--color--card-background);
			color: var(--color--text);
			padding: 0.5rem;
			max-height: 40px;
		}
	}

	.clear-filters-btn {
		width: 100%;
		padding: 1rem 1.25rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color--text-inverse);
		background: var(--color--primary);
		border: 1.5px solid var(--color--primary);
		border-radius: 10px;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			background-color 0.15s ease;
		font-family: inherit;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		box-shadow: 0 2px 6px rgba(var(--color--primary-rgb), 0.25);

		&:hover {
			background: var(--color--primary-shade);
			border-color: var(--color--primary-shade);
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(var(--color--primary-rgb), 0.35);
		}

		&:active {
			transform: translateY(0);
		}
	}

	// Results Wrapper
	.results-wrapper {
		width: 100%;
		padding: 1rem 1.25rem;
		background: var(--color--card-background);
		border: 1.5px solid rgba(138, 43, 226, 0.3);
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.results-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.625rem;
		font-size: 0.9375rem;
		font-weight: 600;
		white-space: nowrap;
		transition: transform 0.15s ease;

		svg {
			flex-shrink: 0;
		}

		&.total {
			color: var(--color--text);
		}

		&.filtered {
			color: var(--color--primary);
			animation: pulse 0.3s ease-in-out;
		}
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
		100% {
			transform: scale(1);
		}
	}

	.researchers-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;

		@include for-phone-only {
			grid-template-columns: 1fr;
		}
	}

	.researcher-card {
		background: var(--color--card-background);
		border: 1.5px solid rgba(138, 43, 226, 0.3);
		border-radius: 10px;
		overflow: hidden;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			border-color 0.2s ease;
		box-shadow: var(--card-shadow);

		&:hover {
			transform: translateY(-4px);
			box-shadow: var(--card-shadow-hover);
			border-color: var(--color--primary);
		}
	}

	.card-header {
		padding: 1.5rem;
		background: linear-gradient(
			135deg,
			rgba(var(--color--primary-rgb), 0.08) 0%,
			rgba(var(--color--primary-rgb), 0.03) 100%
		);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.avatar-container {
		flex-shrink: 0;

		.avatar {
			width: 64px;
			height: 64px;
			border-radius: 50%;
			object-fit: cover;
			border: 3px solid var(--color--card-background);
			box-shadow: var(--image-shadow);
		}
	}

	.header-info {
		flex: 1;
		min-width: 0;
	}

	.researcher-name {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color--text);
		margin: 0 0 0.25rem;
		line-height: 1.3;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.email-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		color: var(--color--primary);
		text-decoration: none;
		transition: filter 0.15s ease;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;

		svg {
			flex-shrink: 0;
		}

		&:hover {
			color: var(--color--primary-shade);
			filter: drop-shadow(0px 0px 3px var(--color--primary));
		}
	}

	.card-body {
		padding: 1.5rem;
	}

	.info-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin-bottom: 1rem;

		&:last-of-type {
			margin-bottom: 0;
		}

		.info-icon {
			flex-shrink: 0;
			color: var(--color--primary);
			margin-top: 2px;
			opacity: 0.8;
		}

		.info-content {
			flex: 1;
			min-width: 0;
		}

		.info-label {
			display: block;
			font-size: 0.7rem;
			font-weight: 700;
			color: var(--color--text-shade);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 0.25rem;
			opacity: 0.8;
		}

		.info-value {
			display: block;
			font-size: 0.875rem;
			color: var(--color--text);
			line-height: 1.5;
			word-wrap: break-word;
		}
	}

	.social-links {
		margin-top: 1.25rem;
		padding-top: 1.25rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.1);
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.social-link {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.875rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color--primary);
		background: rgba(var(--color--primary-rgb), 0.1);
		border-radius: 10px;
		text-decoration: none;
		transition: transform 0.15s ease;
		border: 1px solid transparent;

		&:hover {
			background: var(--color--primary);
			color: var(--color--text-inverse);
			border-color: var(--color--primary);
			transform: translateY(-2px);
		}

		&:active {
			transform: translateY(0);
		}
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: var(--color--text-shade);

		p {
			margin: 0;
			font-size: 0.875rem;
			opacity: 0.8;
		}
	}

	.empty-state {
		svg {
			margin-bottom: 1rem;
			color: var(--color--text-shade);
			opacity: 0.5;
		}

		h3 {
			font-size: 1.25rem;
			font-weight: 600;
			color: var(--color--text);
			margin: 0 0 0.5rem;
		}
	}

	.loader {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(var(--color--text-rgb), 0.1);
		border-top-color: var(--color--primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	// Optimización para rendimiento - reducir animaciones en dispositivos de bajo rendimiento
	@media (prefers-reduced-motion: reduce) {
		* {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
