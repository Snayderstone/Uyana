<script lang="ts">
	import LoginForm from '$lib/components/admin/LoginForm.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { usuarioStore } from '$lib/stores/auth.store';

	// Si ya está autenticado, redirigir al dashboard
	onMount(() => {
		const unsubscribe = usuarioStore.subscribe((usuario) => {
			if (usuario) {
				goto('/admin/resumen');
			}
		});

		return unsubscribe;
	});
</script>

<svelte:head>
	<title>Login - Administración Uyana</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<LoginForm />
