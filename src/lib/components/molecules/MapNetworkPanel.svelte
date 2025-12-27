<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { MapLevel } from '$lib/models/map.model';
	import ButtonSvelte from '$lib/components/atoms/Button.svelte';
	import Sparkles from '$lib/components/atoms/Sparkles.svelte';

	export let selectedNetworkType: 'projects' | 'participants' | 'international' | 'area';
	export let mapLevel: MapLevel;

	export let facultyOptions: string[] = [];
	export let institutionOptions: string[] = [];

	let focusMode: 'one' | 'all' = 'one';
	let focusId: string = '';

	let targetLevel: 'faculty' | 'institution' | 'country' = 'faculty';
	let targetMode: 'one' | 'all' = 'all';
	let targetId: string = '';

	//const dispatch = createEventDispatcher();
	const dispatch = createEventDispatcher<{ 
	applyNetwork: any;
	clearNetwork: void;
	close: void;
}>();


	let lastMapLevel: MapLevel | null = null;

	$: if (mapLevel !== lastMapLevel) {
		lastMapLevel = mapLevel;

		focusMode = 'one';
		focusId = mapLevel === 'faculty' ? facultyOptions?.[0] ?? '' : institutionOptions?.[0] ?? '';

		targetLevel = mapLevel === 'faculty' ? 'faculty' : 'institution';
		targetMode = 'all';
		targetId = '';
	}

	$: if (focusMode === 'one') {
		const list = mapLevel === 'faculty' ? facultyOptions : institutionOptions;
		if (!focusId || (list.length > 0 && !list.includes(focusId))) {
			focusId = list?.[0] ?? '';
		}
	}

	$: if (targetMode === 'one') {
		const list =
			targetLevel === 'faculty'
				? facultyOptions
				: targetLevel === 'institution'
				? institutionOptions
				: [];

		if (targetLevel !== 'country') {
			if (!targetId || (list.length > 0 && !list.includes(targetId))) {
				targetId = list?.[0] ?? '';
			}
		}
	}
</script>

<div class="panel-header">
	<h2>Opciones de Red</h2>
	<button
		class="close-btn"
		type="button"
		aria-label="Cerrar panel"
		title="Cerrar"
		on:click={() => dispatch('close')}
	>
		✕
	</button>
</div>

<div class="network-panel">
	<div class="panel-scroll">
		<h3>Tipo de relación</h3>

		<label class="pill">
			<input type="radio" name="nettype" bind:group={selectedNetworkType} value="projects" />
			<span>Co-participación en proyectos</span>
		</label>

		<label class="pill">
			<input type="radio" name="nettype" bind:group={selectedNetworkType} value="participants" />
			<span>Co-autoría por participantes (real)</span>
		</label>

		{#if mapLevel === 'institution'}
			<label class="pill">
				<input type="radio" name="nettype" bind:group={selectedNetworkType} value="international" />
				<span>Colaboración internacional (por país) (base)</span>
			</label>
		{/if}

		<label class="pill">
			<input type="radio" name="nettype" bind:group={selectedNetworkType} value="area" />
			<span>Red temática (usa proyectos filtrados)</span>
		</label>

		<hr />

		<h3>Foco</h3>

		<label class="pill">
			<input type="radio" name="focusmode" bind:group={focusMode} value="one" />
			<span>Una {mapLevel === 'faculty' ? 'facultad' : 'institución'}</span>
		</label>

		<label class="pill">
			<input type="radio" name="focusmode" bind:group={focusMode} value="all" />
			<span>Todas ({mapLevel === 'faculty' ? 'facultades' : 'instituciones'})</span>
		</label>

		{#if focusMode === 'one'}
			{#key mapLevel}
				{#if mapLevel === 'faculty'}
					<select bind:value={focusId}>
						{#each facultyOptions as f}
							<option value={f}>{f}</option>
						{/each}
					</select>
				{:else}
					<select bind:value={focusId}>
						{#each institutionOptions as i}
							<option value={i}>{i}</option>
						{/each}
					</select>
				{/if}
			{/key}
		{/if}

		<hr />

		<h3>Relacionar con</h3>

		<label class="pill">
			<input type="radio" name="targetlvl" bind:group={targetLevel} value="faculty" />
			<span>Facultades</span>
		</label>

		<label class="pill">
			<input type="radio" name="targetlvl" bind:group={targetLevel} value="institution" />
			<span>Instituciones</span>
		</label>

		{#if mapLevel === 'institution'}
			<label class="pill">
				<input type="radio" name="targetlvl" bind:group={targetLevel} value="country" />
				<span>País (luego ponemos coordenadas)</span>
			</label>
		{/if}

		<label class="pill">
			<input type="radio" name="targetmode" bind:group={targetMode} value="all" />
			<span>Todos</span>
		</label>

		<label class="pill">
			<input type="radio" name="targetmode" bind:group={targetMode} value="one" />
			<span>Uno específico</span>
		</label>

		{#if targetMode === 'one'}
			{#key `${targetLevel}-${targetMode}`}
				{#if targetLevel === 'faculty'}
					<select bind:value={targetId}>
						{#each facultyOptions as f}
							<option value={f}>{f}</option>
						{/each}
					</select>
				{:else if targetLevel === 'institution'}
					<select bind:value={targetId}>
						{#each institutionOptions as i}
							<option value={i}>{i}</option>
						{/each}
					</select>
				{:else}
					<input class="text-input" placeholder="País (ej: Bélgica)" bind:value={targetId} />
				{/if}
			{/key}
		{/if}

		<!-- un poquito de espacio para que el último input no quede tapado por el footer -->
		<div class="bottom-spacer" />
	</div>

	<div class="panel-footer">
		<Sparkles></Sparkles>
		<ButtonSvelte
			on:click={() => {
				dispatch('applyNetwork', {
					type: selectedNetworkType,
					focusLevel: mapLevel,
					focusMode,
					focusId: focusMode === 'one' ? focusId : null,
					targetLevel,
					targetMode,
					targetId: targetMode === 'one' ? targetId : null
				});
			}}
		>
			Aplicar red
		</ButtonSvelte>
		<ButtonSvelte color="secondary" style="understated"
			on:click={() => dispatch('clearNetwork')}
		>
			Limpiar / ocultar red
		</ButtonSvelte>
	</div>
</div>

<style lang="scss">
	/* Contenedor general */
	.network-panel {
		width: 100%;
		background: var(--color--card-background) transparent;
		border-radius: 12px;
		padding: 14px;
		box-shadow: var(--card-shadow), 0 5px 15px rgba(0, 0, 0, 0.05);
		color: var(--color--text);
		position: relative;

		/* clave: layout con scroll interno y footer fijo */
		display: flex;
		flex-direction: column;

		/* ajusta a tu panel lateral */
		max-height: 70vh;
		overflow: hidden;
	}

	@media (max-width: 600px) {
		.network-panel {
			max-height: 65vh;
			padding: 12px;
		}
	}

	.panel-header {
		padding-bottom: 10px;

		h2 {
			margin: 10px;
			font-size: 1.05rem;
			font-weight: 800;
			letter-spacing: 0.2px;
			color: var(--color--text);
		}
	}

	/* Scroll area */
	.panel-scroll {
		flex: 1;
		overflow-y: auto;
		padding-right: 8px;
		padding-bottom: 2px;
	}

	/* Footer fijo dentro del panel */
	.panel-footer {
		flex-shrink: 0;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px dashed color-mix(in srgb, var(--color--text) 12%, transparent);
		display: flex;
		flex-direction: column;
		gap: 10px;
		background: var(--color--card-background) transparent;
	}

	/* títulos/secciones */
	.panel-scroll h3 {
		margin: 0 0 8px 0;
		font-size: 0.9rem;
		font-weight: 800;
		color: var(--color--text-shade);
		letter-spacing: 0.15px;
	}

	.panel-scroll hr {
		border: none;
		height: 1px;
		background: color-mix(in srgb, var(--color--text) 10%, transparent);
		margin: 12px 0;
	}

	/* pills */
	.pill {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;

		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--color--text) 22%, transparent);
		background: color-mix(in srgb, var(--color--card-background) 92%, transparent var(--color--text) 8%);

		cursor: pointer;
		user-select: none;
		transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);

		span {
			line-height: 1.15;
		}

		&:hover {
			transform: translateY(-1px);
			border-color: color-mix(in srgb, var(--color--primary) 65%, transparent);
			background: color-mix(in srgb, var(--color--primary) 10%, var(--color--card-background));
		}

		input[type='radio'] {
			accent-color: var(--color--primary);
			transform: translateY(1px);
		}
	}

	.pill + .pill {
		margin-top: 8px;
	}

	/* inputs */
	.panel-scroll select,
	.panel-scroll input:not([type='radio']):not([type='checkbox']) {
		width: 100%;
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--color--text) 20%, transparent);
		background: var(--color--card-background);
		color: var(--color--text);
		font-size: 0.95rem;
		outline: none;
		transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
		margin-top: 8px;
	}

	.panel-scroll select:focus,
	.panel-scroll input:focus {
		border-color: var(--color--primary);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color--primary) 20%, transparent),
			0 3px 8px rgba(0, 0, 0, 0.08);
		transform: translateY(-1px);
	}

	/* botones */

	

	/* pequeño espacio para que el scroll no tape el final */
	.bottom-spacer {
		height: 6px;
	}

	/* (opcional) scrollbar */
	.panel-scroll::-webkit-scrollbar {
		width: 6px;
	}

	.panel-scroll::-webkit-scrollbar-thumb {
		background: color-mix(in srgb, var(--color--primary) 40%, transparent);
		border-radius: 6px;
	}

	.panel-scroll::-webkit-scrollbar-track {
		background: transparent;
	}
	.panel-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;

	h2 {
		margin: 10px;
		font-size: 1.05rem;
		font-weight: 800;
		letter-spacing: 0.2px;
		color: var(--color--text);
	}
}

.close-btn {
	width: 34px;
	height: 34px;
	border-radius: 50px;
	border: 1px solid color-mix(in srgb, var(--color--text) 12%, transparent);
	background: color-mix(in srgb, var(--color--card-background) 85%, transparent);
	color: var(--color--text);
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 18px;
	line-height: 1;
	transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;

	&:hover {
		transform: translateY(-1px);
		border-color: color-mix(in srgb, var(--color--primary) 55%, transparent);
		background: color-mix(in srgb, var(--color--primary) 10%, var(--color--card-background));
	}

	&:active {
		transform: translateY(0);
	}
}

</style>
