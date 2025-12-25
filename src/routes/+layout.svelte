<script>
	import { onMount } from 'svelte';
	import '$lib/scss/global.scss';
	import ChatWidgetConfig from '$lib/components/atoms/ChatWidgetConfig.svelte';
	import ChatWidget from '$lib/components/organisms/ChatWidget.svelte';
	import { verificarAuth } from '$lib/stores/auth.store';

	// Verificar autenticación al cargar la aplicación
	onMount(async () => {
		await verificarAuth();
	});
</script>

<slot />

<!-- Widget de chat global -->
<ChatWidget />
<ChatWidgetConfig
	config={{
		enabled: true,
		position: 'bottom-right',
		showOnPages: [], // Todas las páginas
		hideOnPages: ['/chat', '/admin', '/api'], // Excepto estas
		zIndex: 9999,
		autoShow: false,
		showWelcomeMessage: true
	}}
/>
