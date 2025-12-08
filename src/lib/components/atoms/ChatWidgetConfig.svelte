<script lang="ts">
	import { useChatWidget, chatWidgetPresets } from '$lib/stores/chatWidgetStore';
	import type { ChatWidgetConfig } from '$lib/stores/chatWidgetStore';

	// Props
	export let preset: keyof typeof chatWidgetPresets | null = null;
	export let config: Partial<ChatWidgetConfig> | null = null;
	export let autoApply = true;

	const { actions } = useChatWidget();

	// Aplicar configuración al montar si autoApply está habilitado
	$: if (autoApply && (preset || config)) {
		applyConfiguration();
	}

	function applyConfiguration() {
		if (preset && chatWidgetPresets[preset]) {
			// Los presets que no requieren parámetros se llaman sin argumentos
			if (
				preset === 'blogOnly' ||
				preset === 'publicPages' ||
				preset === 'minimal' ||
				preset === 'autoOpen'
			) {
				actions.updateConfig(chatWidgetPresets[preset]());
			}
		}

		if (config) {
			actions.updateConfig(config);
		}
	}

	// Funciones de utilidad exportadas
	export function enable() {
		actions.setEnabled(true);
	}

	export function disable() {
		actions.setEnabled(false);
	}

	export function setPosition(position: 'bottom-right' | 'bottom-left') {
		actions.setPosition(position);
	}

	export function showOnlyOn(pages: string[]) {
		actions.updateConfig({ showOnPages: pages, hideOnPages: [] });
	}

	export function hideOn(pages: string[]) {
		actions.updateConfig({ hideOnPages: pages, showOnPages: [] });
	}

	export function openWidget() {
		actions.openWidget();
	}

	export function closeWidget() {
		actions.closeWidget();
	}

	export function applyPreset(presetName: keyof typeof chatWidgetPresets) {
		if (chatWidgetPresets[presetName]) {
			// Los presets que no requieren parámetros se llaman sin argumentos
			if (
				presetName === 'blogOnly' ||
				presetName === 'publicPages' ||
				presetName === 'minimal' ||
				presetName === 'autoOpen'
			) {
				actions.updateConfig(chatWidgetPresets[presetName]());
			}
		}
	}
</script>

<!-- Este componente no renderiza nada visible, solo maneja configuración -->
{#if !autoApply}
	<button on:click={applyConfiguration} style="display: none;"> Aplicar configuración </button>
{/if}
