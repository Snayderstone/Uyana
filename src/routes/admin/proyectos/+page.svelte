<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Redirigir a tabla por defecto
	onMount(() => {
		goto('/admin/proyectos/tabla', { replaceState: true });
	});
</script>

<svelte:head>
	<title>Proyectos - Cargando...</title>
</svelte:head>

<div class="redirect-page">
	<div class="spinner" />
	<p>Redirigiendo a proyectos...</p>
</div>

<style>
	.redirect-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		gap: 1rem;
	}

	.redirect-page p {
		color: rgba(var(--color--text-rgb), 0.6);
		font-size: 0.875rem;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(var(--color--text-rgb), 0.1);
		border-top: 3px solid var(--color--primary, #6e29e7);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
