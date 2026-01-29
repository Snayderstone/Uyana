<script lang="ts">
	// Esta página ya no muestra el chat - usar ChatWidget (burbuja flotante)
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirigir a la página principal
		goto('/');
	});
</script>

<svelte:head>
	<title>SIGPI Chat - Redirigiendo...</title>
</svelte:head>

<div class="redirect-page">
	<p>Redirigiendo...</p>
</div>

<style lang="scss">
	.redirect-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color--text);
	}
</style>
