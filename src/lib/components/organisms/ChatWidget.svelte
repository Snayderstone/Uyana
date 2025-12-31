<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut, backOut, backIn, bounceOut } from 'svelte/easing';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';

	// Componentes
	import ChatInterfaceModern from './ChatInterfaceModern.svelte';
	import Button from '$lib/components/atoms/Button.svelte';

	// Stores
	import { useChatStore } from '$lib/stores/chatStore';
	import { useChatWidget } from '$lib/stores/chatWidgetStore';

	// Widget store
	const { config, state, actions } = useChatWidget();

	// Chat store
	const { messages, connectionStatus } = useChatStore();

	// Estado local
	let lastMessageCount = 0;
	let isMounted = false;
	let previousPath = '';
	let showNewChatConfirmation = false;

	// Referencias
	let widgetContainer: HTMLElement;
	let chatContainer: HTMLElement;

	// Función para manejar nuevo chat
	function handleNewChat() {
		// Si hay mensajes, mostrar confirmación
		if ($messages.length > 0) {
			if (
				confirm(
					'¿Estás seguro de que deseas iniciar una nueva conversación? Se perderá el historial actual.'
				)
			) {
				const chatStore = useChatStore();
				chatStore.clearChat();
			}
		} else {
			// Si no hay mensajes, simplemente limpiar
			const chatStore = useChatStore();
			chatStore.clearChat();
		}
	}

	// Variables reactivas para carga de página y transiciones
	$: if (browser && $messages.length > lastMessageCount && !$state.isOpen) {
		actions.setUnreadMessages(true);
		lastMessageCount = $messages.length;
	}

	// Detectar navegación SPA y manejar transiciones
	afterNavigate((navigation) => {
		if (browser) {
			const currentPath = $page.url.pathname;
			// Solo procesar si la ruta ha cambiado realmente
			if (currentPath !== previousPath) {
				handlePageNavigation(currentPath);
			}
		}
	});

	function toggleChat() {
		actions.toggleWidget();
	}

	function closeChat() {
		actions.closeWidget();
	}

	// Función para manejar navegación con carga de página y transiciones
	function handlePageNavigation(currentPath: string) {
		// console.log('🚀 Navegación detectada a:', currentPath);

		// Verificar primero si debe mostrarse en esta página
		const shouldShow = actions.shouldShowOnCurrentPage(currentPath);

		// Si NO debe mostrarse (login, admin, chat), ocultar inmediatamente
		if (!shouldShow) {
			actions.setVisible(false);
			actions.setShowWithTransition(false);
			actions.setPageLoaded(false);
			previousPath = currentPath;
			return;
		}

		// Solo si DEBE mostrarse, continuar con la lógica de transición
		// Resetear estados de transición
		actions.setShowWithTransition(false);
		actions.setPageLoaded(false);

		// console.log('✨ Iniciando secuencia de aparición con transición');
		// Ocultar temporalmente mientras se carga la página
		actions.setVisible(false);

		// Iniciar secuencia de aparición con transición
		actions.showAfterPageLoad();

		previousPath = currentPath;
	}

	// Detectar cuando todo el contenido está cargado
	function detectPageLoaded() {
		if (!browser) return;

		// Verificar si ya está todo cargado
		if (document.readyState === 'complete') {
			actions.setPageLoaded(true);
			return;
		}

		// Escuchar eventos de carga
		const handleLoad = () => {
			console.log('📄 Página completamente cargada');
			actions.setPageLoaded(true);
		};

		const handleDOMContentLoaded = () => {
			console.log('📄 DOM cargado');
			// Esperar un poco más para imágenes y otros recursos
			setTimeout(() => {
				if (document.readyState === 'complete') {
					actions.setPageLoaded(true);
				}
			}, 500);
		};

		window.addEventListener('load', handleLoad);
		document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);

		return () => {
			window.removeEventListener('load', handleLoad);
			document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded);
		};
	}

	// Manejar clics fuera del widget para cerrarlo
	function handleClickOutside(event: MouseEvent) {
		if (!$state.isOpen) return;

		const target = event.target as HTMLElement;
		// No cerrar si el clic es dentro del widget o en cualquier elemento del chat
		if (widgetContainer && widgetContainer.contains(target)) {
			return; // No cerrar si se hace clic dentro del widget
		}

		closeChat();
	}

	// Manejar tecla Escape
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && $state.isOpen) {
			closeChat();
		}
	}

	// Auto-abrir si está configurado
	function handleAutoShow() {
		if ($config.autoShow && !$state.isOpen) {
			// Delay para dar tiempo a que la página se cargue
			setTimeout(() => {
				actions.openWidget();
			}, 1500);
		}
	}

	// Función mejorada para vigilar y corregir el estado del widget
	function watchWidgetState() {
		if (!browser || !isMounted) return;

		const currentPath = window.location.pathname;
		const shouldBeVisible = actions.shouldShowOnCurrentPage(currentPath);

		// Si NO debe ser visible (login, admin, chat) y está visible, ocultarlo inmediatamente
		if (!shouldBeVisible && $state.isVisible) {
			console.log('🔧 Ocultando widget en ruta restringida:', currentPath);
			actions.setVisible(false);
			actions.setShowWithTransition(false);
			if ($state.isOpen) {
				actions.closeWidget();
			}
			return;
		}

		// Si el widget debería ser visible pero no lo está, usar forceShow
		if (shouldBeVisible && !$state.isVisible) {
			console.log('🔧 Corrigiendo visibilidad del widget en:', currentPath);
			actions.forceShow();
		}
	}

	onMount(() => {
		isMounted = true;
		// console.log('🚀 ChatWidget montado con transiciones suaves');

		// Inicializar detección de carga de página
		const cleanupPageDetection = detectPageLoaded();

		// Establecer la ruta inicial
		if (browser && $page.url) {
			previousPath = $page.url.pathname;
			// console.log('📍 Ruta inicial:', previousPath);

			// ✅ Verificar inmediatamente si debe ocultarse
			const shouldShow = actions.shouldShowOnCurrentPage(previousPath);
			if (!shouldShow) {
				// Ocultar inmediatamente sin transiciones
				actions.setVisible(false);
				actions.setShowWithTransition(false);
			} else {
				// Manejar la navegación inicial solo si debe mostrarse
				handlePageNavigation(previousPath);
			}
		}

		handleAutoShow();

		// Vigilancia menos frecuente ya que usamos eventos
		const watchInterval = setInterval(watchWidgetState, 2000);

		if (browser) {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);
		}

		return () => {
			clearInterval(watchInterval);
			if (cleanupPageDetection) cleanupPageDetection();
		};
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		}
	});

	// Variable reactiva para verificar si debe mostrarse en la ruta actual
	$: shouldShowInCurrentPath =
		browser && $page ? actions.shouldShowOnCurrentPage($page.url.pathname) : true;
</script>

{#if browser && isMounted && $config.enabled && shouldShowInCurrentPath && ($state.isVisible || ($config.enableSmoothTransitions && $state.showWithTransition))}
	<div
		class="chat-widget"
		class:chat-widget--open={$state.isOpen}
		class:chat-widget--bottom-right={$config.position === 'bottom-right'}
		class:chat-widget--bottom-left={$config.position === 'bottom-left'}
		style="z-index: {$config.zIndex}"
		bind:this={widgetContainer}
		role="region"
		aria-label="Chat asistente"
		in:scale={{
			duration: $config.enableSmoothTransitions ? 600 : 0,
			start: 0.5,
			easing: backOut
		}}
		out:scale={{
			duration: $config.enableSmoothTransitions ? 400 : 0,
			start: 0.5,
			easing: backIn
		}}
	>
		<!-- Chat expandido -->
		{#if $state.isOpen}
			<div
				class="chat-expanded"
				bind:this={chatContainer}
				transition:fly={{
					y: 300,
					duration: 400,
					easing: backOut
				}}
			>
				<!-- Header del chat expandido -->
				<div class="chat-expanded__header">
					<Button
						variant="ghost"
						size="small"
						on:click={closeChat}
						aria-label="Cerrar chat"
						additionalClass="btn-close-circular"
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
							<path
								d="M18 6L6 18M6 6L18 18"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</Button>

					<div class="chat-expanded__info">
						<h3>Chasky</h3>
						<p class="connection-status" class:connected={$connectionStatus === 'connected'}>
							{$connectionStatus === 'connected' ? 'En línea' : 'Conectando...'}
						</p>
					</div>

					<Button
						variant="ghost"
						size="small"
						on:click={handleNewChat}
						aria-label="Nueva conversación"
						title="Nueva conversación"
						additionalClass="btn-new-chat-rounded"
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
							<path
								d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.60573 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M12 11V15M12 11H14M12 11H10"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</Button>
				</div>

				<!-- Contenido del chat -->
				<div class="chat-expanded__content">
					<ChatInterfaceModern isPublic={true} />
				</div>
			</div>
		{/if}

		<!-- Botón flotante -->
		<button
			class="chat-bubble"
			class:chat-bubble--has-unread={$state.hasUnreadMessages}
			on:click={toggleChat}
			aria-label={$state.isOpen ? 'Cerrar chat' : 'Abrir chat'}
			transition:scale={{
				duration: 300,
				easing: elasticOut
			}}
		>
			{#if !$state.isOpen}
				<!-- Icono de chat -->
				<div class="chat-bubble__icon" transition:scale={{ duration: 200 }}>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
						<path
							d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.60573 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
			{:else}
				<!-- Icono de cerrar cuando está abierto -->
				<div class="chat-bubble__icon" transition:scale={{ duration: 200 }}>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
						<path
							d="M18 6L6 18M6 6L18 18"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
			{/if}

			<!-- Indicador de mensajes no leídos -->
			{#if $state.hasUnreadMessages && !$state.isOpen}
				<div
					class="chat-bubble__notification"
					transition:scale={{ duration: 200, easing: elasticOut }}
				>
					<span class="sr-only">Nuevos mensajes</span>
				</div>
			{/if}
		</button>
	</div>
{/if}

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';
	@import '$lib/scss/mixins.scss';

	.chat-widget {
		position: fixed;
		display: flex;
		flex-direction: column;
		pointer-events: all;

		&--bottom-right {
			bottom: 2rem;
			right: 2rem;
			align-items: flex-end;
		}

		&--bottom-left {
			bottom: 2rem;
			left: 2rem;
			align-items: flex-start;
		}

		@include for-tablet-portrait-down {
			&--bottom-right {
				bottom: 1.5rem;
				right: 1.5rem;
			}

			&--bottom-left {
				bottom: 1.5rem;
				left: 1.5rem;
			}
		}

		@include for-phone-only {
			&--bottom-right {
				bottom: 1rem;
				right: 1rem;
			}

			&--bottom-left {
				bottom: 1rem;
				left: 1rem;
			}
		}
	}

	.chat-expanded {
		width: 360px;
		height: 520px;
		background: var(--color--card-background);
		border-radius: 14px;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12), 0 2px 12px rgba(0, 0, 0, 0.08);
		backdrop-filter: blur(20px);
		margin-bottom: 0.625rem;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		border: 1px solid rgba(var(--color--border-rgb), 0.08);

		&__header {
			display: flex;
			align-items: center;
			gap: 0.625rem;
			padding: 0.625rem 0.875rem;
			border-bottom: 1px solid rgba(var(--color--border-rgb), 0.06);
			background: linear-gradient(
				180deg,
				rgba(var(--color--card-background), 0.98) 0%,
				rgba(var(--color--card-background), 0.95) 100%
			);
			backdrop-filter: blur(10px);
			justify-content: space-between;
		}

		&__info {
			flex: 1;

			h3 {
				margin: 0;
				font-size: 0.875rem;
				font-weight: 600;
				color: var(--color--text);
				letter-spacing: -0.01em;
			}

			.connection-status {
				margin: 0;
				font-size: 0.65rem;
				color: var(--color--text-shade);
				font-weight: 500;
				opacity: 0.8;

				&.connected {
					color: var(--color--callout-accent--success);
					opacity: 1;
				}
			}
		}

		&__content {
			flex: 1;
			overflow: hidden;

			:global(.modern-chat-interface) {
				height: 100%;
				border-radius: 0;

				:global(.chat-header) {
					display: none;
				}
			}
		}

		@include for-tablet-portrait-down {
			width: calc(100vw - 3rem);
			max-width: 380px;
			height: 550px;
		}

		@include for-phone-only {
			width: calc(100vw - 2rem);
			max-width: 100%;
			height: calc(100vh - 140px);
			margin-bottom: 0.75rem;
			border-radius: 16px;

			&__header {
				padding: 1rem 1.25rem;
			}
		}
	}

	.chat-bubble {
		width: 52px;
		height: 52px;
		background: linear-gradient(135deg, var(--color--primary), var(--color--secondary));
		border: none;
		border-radius: 50%;
		box-shadow: 0 6px 18px rgba(var(--color--primary-rgb), 0.28), 0 3px 10px rgba(0, 0, 0, 0.12);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		position: relative;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		overflow: hidden;

		&:hover {
			transform: scale(1.08) translateY(-2px);
			box-shadow: 0 10px 26px rgba(var(--color--primary-rgb), 0.35), 0 5px 14px rgba(0, 0, 0, 0.18);
		}

		&:active {
			transform: scale(0.95);
		}

		&--has-unread {
			animation: pulse 2s infinite;
		}

		&__icon {
			transition: all 0.2s ease;
		}

		&__notification {
			position: absolute;
			top: 8px;
			right: 8px;
			width: 16px;
			height: 16px;
			background: var(--color--callout-accent--error);
			border-radius: 50%;
			border: 2px solid white;
			box-shadow: 0 2px 8px rgba(var(--color--callout-accent--error), 0.4);
		}

		@include for-phone-only {
			width: 56px;
			height: 56px;
		}
	}

	@keyframes pulse {
		0%,
		100% {
			box-shadow: 0 8px 24px rgba(var(--color--primary-rgb), 0.3), 0 4px 12px rgba(0, 0, 0, 0.15);
		}
		50% {
			box-shadow: 0 8px 24px rgba(var(--color--primary-rgb), 0.5), 0 4px 12px rgba(0, 0, 0, 0.2),
				0 0 0 8px rgba(var(--color--primary-rgb), 0.1);
		}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	// Estilos personalizados para botones del header
	:global(.btn-close-circular) {
		border-radius: 50% !important;
		width: 32px;
		height: 32px;
		min-width: 32px;
		padding: 0 !important;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.btn-new-chat-rounded) {
		border-radius: 10px !important;
		padding: 0.5rem !important;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
