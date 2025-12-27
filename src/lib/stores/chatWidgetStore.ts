import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface ChatWidgetConfig {
	enabled: boolean;
	position: 'bottom-right' | 'bottom-left';
	showOnPages: string[];
	hideOnPages: string[];
	zIndex: number;
	autoShow: boolean;
	showWelcomeMessage: boolean;
	delayAfterPageLoad: number; // Delay en ms después de que la página se carga
	enableSmoothTransitions: boolean; // Habilitar transiciones suaves
}

const defaultConfig: ChatWidgetConfig = {
	enabled: true,
	position: 'bottom-right',
	showOnPages: [], // Si está vacío, se muestra en todas las páginas
	hideOnPages: ['/chat', '/login', '/admin'], // No mostrar en chat, login ni administración
	zIndex: 9999,
	autoShow: false, // Si se abre automáticamente al cargar la página
	showWelcomeMessage: true,
	delayAfterPageLoad: 1500, // 1.5 segundos después de cargar la página
	enableSmoothTransitions: true // Transiciones suaves habilitadas
};

// Store para la configuración del widget
export const chatWidgetConfig = writable<ChatWidgetConfig>(defaultConfig);

// Store para el estado del widget
export const chatWidgetState = writable({
	isOpen: false,
	isVisible: true,
	hasUnreadMessages: false,
	lastInteraction: 0,
	pageLoaded: false, // Estado de carga de la página
	showWithTransition: false // Control para mostrar con transición
});

/**
 * Acciones para controlar el widget de chat
 */
export const chatWidgetActions = {
	/**
	 * Actualiza la configuración del widget
	 */
	updateConfig(updates: Partial<ChatWidgetConfig>): void {
		chatWidgetConfig.update((config) => ({
			...config,
			...updates
		}));
	},

	/**
	 * Habilita o deshabilita el widget
	 */
	setEnabled(enabled: boolean): void {
		chatWidgetConfig.update((config) => ({
			...config,
			enabled
		}));
	},

	/**
	 * Cambia la posición del widget
	 */
	setPosition(position: 'bottom-right' | 'bottom-left'): void {
		chatWidgetConfig.update((config) => ({
			...config,
			position
		}));
	},

	/**
	 * Añade páginas donde mostrar el widget
	 */
	addShowPages(pages: string[]): void {
		chatWidgetConfig.update((config) => ({
			...config,
			showOnPages: [...new Set([...config.showOnPages, ...pages])]
		}));
	},

	/**
	 * Añade páginas donde ocultar el widget
	 */
	addHidePages(pages: string[]): void {
		chatWidgetConfig.update((config) => ({
			...config,
			hideOnPages: [...new Set([...config.hideOnPages, ...pages])]
		}));
	},

	/**
	 * Elimina páginas de la lista de mostrar
	 */
	removeShowPages(pages: string[]): void {
		chatWidgetConfig.update((config) => ({
			...config,
			showOnPages: config.showOnPages.filter((page) => !pages.includes(page))
		}));
	},

	/**
	 * Elimina páginas de la lista de ocultar
	 */
	removeHidePages(pages: string[]): void {
		chatWidgetConfig.update((config) => ({
			...config,
			hideOnPages: config.hideOnPages.filter((page) => !pages.includes(page))
		}));
	},

	/**
	 * Abre el widget de chat
	 */
	openWidget(): void {
		chatWidgetState.update((state) => ({
			...state,
			isOpen: true,
			hasUnreadMessages: false,
			lastInteraction: Date.now()
		}));
	},

	/**
	 * Cierra el widget de chat
	 */
	closeWidget(): void {
		chatWidgetState.update((state) => ({
			...state,
			isOpen: false,
			lastInteraction: Date.now()
		}));
	},

	/**
	 * Alterna el estado del widget
	 */
	toggleWidget(): void {
		chatWidgetState.update((state) => ({
			...state,
			isOpen: !state.isOpen,
			hasUnreadMessages: state.isOpen ? state.hasUnreadMessages : false,
			lastInteraction: Date.now()
		}));
	},

	/**
	 * Establece la visibilidad del widget
	 */
	setVisible(visible: boolean): void {
		// console.log('👁️ Estableciendo visibilidad:', visible);
		chatWidgetState.update((state) => ({
			...state,
			isVisible: visible
		}));
	},

	/**
	 * Marca que hay mensajes no leídos
	 */
	setUnreadMessages(hasUnread: boolean): void {
		chatWidgetState.update((state) => ({
			...state,
			hasUnreadMessages: hasUnread
		}));
	},

	/**
	 * Verifica si el widget debe mostrarse en la página actual
	 */
	shouldShowOnCurrentPage(currentPath?: string): boolean {
		if (!browser && !currentPath) return false;

		const path = currentPath || window.location.pathname;

		// Función para evaluar la configuración
		let shouldShow = false;
		const unsubscribe = chatWidgetConfig.subscribe((config) => {
			// Si está deshabilitado, no mostrar
			if (!config.enabled) {
				shouldShow = false;
				return;
			}

			// Si hay páginas específicas donde mostrar
			if (config.showOnPages.length > 0) {
				shouldShow = config.showOnPages.some((page) => path.includes(page));
				return;
			}

			// Si hay páginas donde ocultar
			if (config.hideOnPages.length > 0) {
				shouldShow = !config.hideOnPages.some((page) => path.includes(page));
				return;
			}

			// Por defecto, mostrar en todas las páginas
			shouldShow = true;
		});

		unsubscribe();
		return shouldShow;
	},

	/**
	 * Reinicia el estado del widget completamente
	 */
	resetState(): void {
		console.log('🔄 Reiniciando estado del widget');
		chatWidgetState.set({
			isOpen: false,
			isVisible: true,
			hasUnreadMessages: false,
			lastInteraction: 0,
			pageLoaded: false,
			showWithTransition: false
		});
	},

	/**
	 * Marca que la página se ha cargado completamente
	 */
	setPageLoaded(loaded: boolean): void {
		// console.log('📄 Página cargada:', loaded);
		chatWidgetState.update((state) => ({
			...state,
			pageLoaded: loaded
		}));
	},

	/**
	 * Controla la transición de aparición del widget
	 */
	setShowWithTransition(show: boolean): void {
		// console.log('✨ Mostrar con transición:', show);
		chatWidgetState.update((state) => ({
			...state,
			showWithTransition: show
		}));
	},

	/**
	 * Muestra el widget con transición suave después de la carga
	 */
	showAfterPageLoad(): void {
		chatWidgetConfig.subscribe((config) => {
			if (!config.enabled || !config.enableSmoothTransitions) return;

			console.log('⏳ Esperando carga completa de página...');

			// Esperar a que la página esté cargada
			setTimeout(() => {
				chatWidgetState.update((state) => ({
					...state,
					pageLoaded: true
				}));

				// Después del delay configurado, mostrar con transición
				setTimeout(() => {
					this.setVisible(true);
					this.setShowWithTransition(true);
				}, config.delayAfterPageLoad);
			}, 100); // Pequeño buffer para asegurar DOM ready
		})();
	},
	forceShow(): void {
		console.log('💪 Forzando mostrar widget');
		this.resetState();
		setTimeout(() => this.setVisible(true), 50);
		setTimeout(() => this.setVisible(true), 150);
		setTimeout(() => this.setVisible(true), 300);
	},

	/**
	 * Actualiza la visibilidad basada en la página actual
	 */
	updateVisibilityForPage(currentPath: string): void {
		const shouldShow = this.shouldShowOnCurrentPage(currentPath);

		console.log('🔄 Actualizando visibilidad para:', currentPath, '| Debe mostrar:', shouldShow);

		this.setVisible(shouldShow);

		// Si el widget debe mostrarse, asegurar múltiples intentos
		if (shouldShow) {
			setTimeout(() => {
				console.log('🔄 Segundo intento de visibilidad');
				this.setVisible(true);
			}, 100);

			setTimeout(() => {
				console.log('🔄 Tercer intento de visibilidad');
				this.setVisible(true);
			}, 300);
		}
	}
};

/**
 * Hook para usar el widget de chat
 */
export function useChatWidget() {
	return {
		config: chatWidgetConfig,
		state: chatWidgetState,
		actions: chatWidgetActions
	};
}

// Funciones de conveniencia exportadas
export const updateConfig = chatWidgetActions.updateConfig;
export const openWidget = chatWidgetActions.openWidget;
export const closeWidget = chatWidgetActions.closeWidget;
export const toggleWidget = chatWidgetActions.toggleWidget;
export const setVisible = chatWidgetActions.setVisible;
export const updateVisibilityForPage = chatWidgetActions.updateVisibilityForPage;
export const resetState = chatWidgetActions.resetState;
export const forceShow = chatWidgetActions.forceShow;
export const setPageLoaded = chatWidgetActions.setPageLoaded;
export const setShowWithTransition = chatWidgetActions.setShowWithTransition;
export const showAfterPageLoad = chatWidgetActions.showAfterPageLoad;

// Función para aplicar presets fácilmente
export function applyPreset(presetName: keyof typeof chatWidgetPresets, ...args: string[]) {
	const preset = chatWidgetPresets[presetName];
	if (preset && typeof preset === 'function') {
		const config = (preset as any)(...args);
		chatWidgetActions.updateConfig(config);
	}
}

// Configuraciones predefinidas
export const chatWidgetPresets = {
	/**
	 * Solo en páginas específicas
	 */
	specificPages: (pages: string[]): Partial<ChatWidgetConfig> => ({
		showOnPages: pages,
		hideOnPages: []
	}),

	/**
	 * En todas las páginas excepto algunas
	 */
	excludePages: (pages: string[]): Partial<ChatWidgetConfig> => ({
		showOnPages: [],
		hideOnPages: pages
	}),

	/**
	 * Solo en el blog
	 */
	blogOnly: (): Partial<ChatWidgetConfig> => ({
		showOnPages: ['/blog'],
		hideOnPages: []
	}),

	/**
	 * Todas las páginas excepto admin y chat
	 */
	publicPages: (): Partial<ChatWidgetConfig> => ({
		showOnPages: [],
		hideOnPages: ['/admin', '/chat', '/api']
	}),

	/**
	 * Configuración minimalista
	 */
	minimal: (): Partial<ChatWidgetConfig> => ({
		autoShow: false,
		showWelcomeMessage: false,
		position: 'bottom-right'
	}),

	/**
	 * Configuración completa con auto-apertura
	 */
	autoOpen: (): Partial<ChatWidgetConfig> => ({
		autoShow: true,
		showWelcomeMessage: true,
		position: 'bottom-right'
	})
};
