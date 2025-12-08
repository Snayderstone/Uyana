<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import type { Investigador } from '$lib/supabase';

	export let investigadores: Investigador[] = [];
	export let filtrados: Investigador[] = [];

	// Estado de búsqueda y filtros
	let busqueda = '';
	let facultadSeleccionada = '';

	// Obtener lista de facultades únicas
	$: facultades = [...new Set(investigadores.map((inv) => inv.facultad))].sort();

	// Función para filtrar investigadores
	function filtrarInvestigadores() {
		const busquedaLower = busqueda.toLowerCase();

		filtrados = investigadores.filter((inv) => {
			const nombreMatch = inv.nombre?.toLowerCase().includes(busquedaLower);
			const facultadMatch = inv.facultad?.toLowerCase().includes(busquedaLower);
			const lineaMatch = inv.linea_investigacion?.toLowerCase().includes(busquedaLower);
			const emailMatch = inv.email?.toLowerCase().includes(busquedaLower);

			const cumpleBusqueda = !busqueda || nombreMatch || facultadMatch || lineaMatch || emailMatch;
			const cumpleFacultad = !facultadSeleccionada || inv.facultad === facultadSeleccionada;

			return cumpleBusqueda && cumpleFacultad;
		});
	}

	// Ejecutar filtrado inicial y cuando cambien los valores
	$: {
		busqueda;
		facultadSeleccionada;
		filtrarInvestigadores();
	}

	// Resetear filtros
	function resetearFiltros() {
		busqueda = '';
		facultadSeleccionada = '';
	}
</script>

<div class="filter-container">
	<div class="search-row">
		<div class="search-box">
			<div class="search-icon">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="11" cy="11" r="8" />
					<line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
			</div>
			<input
				type="text"
				placeholder="Buscar por nombre, facultad, línea de investigación..."
				bind:value={busqueda}
				aria-label="Buscar investigador"
			/>
		</div>

		<div class="faculty-filter">
			<div class="select-wrapper">
				<select id="facultad" bind:value={facultadSeleccionada}>
					<option value="">Todas las facultades</option>
					{#each facultades as facultad}
						<option value={facultad}>{facultad}</option>
					{/each}
				</select>
				<div class="select-arrow" />
			</div>
		</div>
	</div>

	<div class="filter-controls">
		{#if busqueda || facultadSeleccionada}
			<div class="filter-badges">
				{#if busqueda}
					<div class="filter-badge">
						<span>Búsqueda: "{busqueda}"</span>
						<button class="badge-remove" on:click={() => (busqueda = '')}>
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
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>
				{/if}

				{#if facultadSeleccionada}
					<div class="filter-badge">
						<span>Facultad: {facultadSeleccionada}</span>
						<button class="badge-remove" on:click={() => (facultadSeleccionada = '')}>
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
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>
				{/if}

				<Button style="understated" size="small" on:click={resetearFiltros}>Limpiar todos</Button>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@import '$lib/scss/_breakpoints.scss';

	.filter-container {
		background: linear-gradient(
			145deg,
			var(--color--primary-tint),
			rgba(var(--color--primary-rgb), 0.05)
		);
		padding: 20px;
		border-radius: 16px;
		margin-bottom: 20px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
		backdrop-filter: blur(5px);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.search-row {
		display: flex;
		gap: 15px;

		@include for-phone-only {
			flex-direction: column;
		}
	}

	.search-box {
		position: relative;
		flex: 3;

		.search-icon {
			position: absolute;
			left: 16px;
			top: 50%;
			transform: translateY(-50%);
			color: var(--color--text-shade);
			width: 20px;
			height: 20px;
			pointer-events: none;

			svg {
				width: 100%;
				height: 100%;
			}
		}

		input {
			width: 100%;
			padding: 14px 16px 14px 50px;
			border: 2px solid rgba(var(--color--primary-rgb), 0.2);
			border-radius: 12px;
			font-size: 1rem;
			background-color: var(--color--page-background);
			color: var(--color--text);
			transition: all 0.2s ease;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
			height: 50px;

			&::placeholder {
				color: var(--color--text-shade);
				opacity: 0.6;
			}

			&:focus {
				border-color: var(--color--primary);
				outline: none;
				box-shadow: 0 0 0 4px rgba(var(--color--primary-rgb), 0.15);
			}
		}
	}

	.faculty-filter {
		flex: 2;

		.select-wrapper {
			position: relative;
			width: 100%;
			height: 100%;

			.select-arrow {
				position: absolute;
				right: 15px;
				top: 50%;
				transform: translateY(-50%);
				width: 0;
				height: 0;
				border-left: 6px solid transparent;
				border-right: 6px solid transparent;
				border-top: 8px solid var(--color--primary);
				pointer-events: none;
			}

			select {
				width: 100%;
				height: 50px;
				appearance: none;
				padding: 0 15px;
				border: 2px solid rgba(var(--color--primary-rgb), 0.2);
				border-radius: 12px;
				font-size: 1rem;
				background-color: var(--color--page-background);
				color: var(--color--text);
				transition: all 0.2s ease;
				cursor: pointer;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

				&:focus {
					border-color: var(--color--primary);
					outline: none;
					box-shadow: 0 0 0 4px rgba(var(--color--primary-rgb), 0.15);
				}
			}
		}
	}

	.filter-controls {
		margin-top: 15px;
		min-height: 36px;
	}

	.filter-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;

		.filter-badge {
			display: flex;
			align-items: center;
			gap: 6px;
			background-color: rgba(var(--color--primary-rgb), 0.1);
			border-radius: 20px;
			padding: 6px 12px;
			font-size: 0.9rem;
			color: var(--color--primary);
			border: 1px solid rgba(var(--color--primary-rgb), 0.2);

			.badge-remove {
				display: flex;
				align-items: center;
				justify-content: center;
				background: none;
				border: none;
				color: var(--color--primary);
				cursor: pointer;
				padding: 2px;
				border-radius: 50%;

				&:hover {
					background-color: rgba(var(--color--primary-rgb), 0.2);
				}
			}
		}
	}
</style>
