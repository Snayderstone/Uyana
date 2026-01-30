<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';

	export let siteKey: string;
	export let theme: 'light' | 'dark' = 'light';

	const dispatch = createEventDispatcher<{
		verify: { token: string };
		error: { error: string };
		expired: void;
	}>();

	let hcaptchaContainer: HTMLDivElement;
	let widgetId: string | null = null;

	onMount(() => {
		// Cargar script de hCaptcha
		const script = document.createElement('script');
		script.src = 'https://js.hcaptcha.com/1/api.js';
		script.async = true;
		script.defer = true;

		script.onload = () => {
			renderCaptcha();
		};

		document.head.appendChild(script);

		return () => {
			// Cleanup: remover el widget si existe
			if (widgetId && window.hcaptcha) {
				window.hcaptcha.remove(widgetId);
			}
		};
	});

	function renderCaptcha() {
		if (!window.hcaptcha || !hcaptchaContainer) return;

		widgetId = window.hcaptcha.render(hcaptchaContainer, {
			sitekey: siteKey,
			theme: theme,
			callback: (token: string) => {
				dispatch('verify', { token });
			},
			'error-callback': (error: string) => {
				dispatch('error', { error });
			},
			'expired-callback': () => {
				dispatch('expired');
			}
		});
	}

	export function reset() {
		if (widgetId && window.hcaptcha) {
			window.hcaptcha.reset(widgetId);
		}
	}
</script>

<svelte:head>
	<script>
		// Declarar el tipo global para TypeScript
		window.hcaptcha = window.hcaptcha || {};
	</script>
</svelte:head>

<div class="hcaptcha-wrapper">
	<div bind:this={hcaptchaContainer}></div>
</div>

<style lang="scss">
	.hcaptcha-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 1rem 0;
	}
</style>
