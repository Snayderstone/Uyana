<script lang="ts">
	import { createEventDispatcher } from "svelte";

	export let selectedNetworkType;
	export let mapLevel;

	const dispatch = createEventDispatcher();
</script>

<div class="panel-header">
	<h2>Opciones de Red</h2>
</div>

<div class="panel-content network-panel">
	<h3>Tipo de relación</h3>

	<label>
		<input type="radio" name="nettype" bind:group={selectedNetworkType} value="projects" />
		Co-participación en proyectos
	</label>

	<label>
		<input type="radio" name="nettype" bind:group={selectedNetworkType} value="participants" />
		Co-autoría por participantes
	</label>

	{#if mapLevel === 'institution'}
		<label>
			<input
				type="radio"
				name="nettype"
				bind:group={selectedNetworkType}
				value="international"
			/>
			Colaboración internacional (por país)
		</label>
	{/if}

	<label>
		<input type="radio" name="nettype" bind:group={selectedNetworkType} value="area" />
		Redes temáticas (área)
	</label>

	<button
		class="apply-btn"
		on:click={() => {
			dispatch("applyNetwork", {
				type: selectedNetworkType,
				level: mapLevel
			});
		}}
	>
		Aplicar red
	</button>
</div>
