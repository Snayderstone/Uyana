<script>
	import '$lib/scss/global.scss';
	import ChatWidgetConfig from '$lib/components/atoms/ChatWidgetConfig.svelte';
	import ChatWidget from '$lib/components/organisms/ChatWidget.svelte';

	import { onMount } from 'svelte';
	import { sessionService } from '$lib/auth/services/sessionService';

	onMount(() => {
		sessionService.init();
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
