<script lang="ts">
	import { page } from '$app/stores';
	import Logo from '$lib/components/atoms/Logo.svelte';
	import ThemeToggle from '$lib/components/molecules/ThemeToggle.svelte';
	import { browser } from '$app/environment';

	export let showBackground = false;

	let isMenuOpen = false;

	// Declaraciones reactivas para cada link
	$: currentPath = $page.url.pathname;
	$: isMapActive = currentPath === '/map' || currentPath.startsWith('/map/');
	$: isInvestigadoresActive =
		currentPath === '/investigadores' || currentPath.startsWith('/investigadores/');
	$: isContactActive = currentPath === '/contact' || currentPath.startsWith('/contact/');
	$: isAboutActive = currentPath === '/about' || currentPath.startsWith('/about/');
	$: isBlogActive = currentPath === '/blog' || currentPath.startsWith('/blog/');

	// Ocultar/mostrar el chat widget cuando el menú esté abierto
	$: if (browser) {
		const chatWidget = document.querySelector('.chat-widget');
		if (chatWidget) {
			if (isMenuOpen) {
				chatWidget.classList.add('hidden-mobile-menu');
			} else {
				chatWidget.classList.remove('hidden-mobile-menu');
			}
		}
	}

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}
</script>

<header class:has-background={showBackground}>
	<nav class="container">
		<a href="/" class="logo" aria-label="SIGPI - Página principal">
			<Logo />
		</a>

		<!-- Menú desktop -->
		<div class="desktop-links">
			<div class="links">
				<a href="/map" class:active={isMapActive}>Proyectos</a>
			</div>

			<div class="links">
				<a href="/investigadores" class:active={isInvestigadoresActive}>Investigadores</a>
			</div>

			<div class="links">
				<a href="/contact" class:active={isContactActive}>Contacto</a>
			</div>

			<div class="links">
				<a href="/about" class:active={isAboutActive}>Nosotros</a>
			</div>

			<div class="links">
				<a href="/blog" class:active={isBlogActive}>Blog</a>

				<ThemeToggle />
			</div>
		</div>

		<!-- Botón hamburguesa para móvil -->
		<button class="hamburger" class:open={isMenuOpen} on:click={toggleMenu} aria-label="Menú">
			{#if !isMenuOpen}
				<!-- Icono de menú hamburguesa -->
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M3 12H21M3 6H21M3 18H21"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{:else}
				<!-- Icono de cerrar (X) -->
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M18 6L6 18M6 6L18 18"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{/if}
		</button>
	</nav>

	<!-- Menú móvil -->
	<div class="mobile-menu" class:open={isMenuOpen}>
		<a href="/map" class:active={isMapActive} on:click={closeMenu}>Proyectos</a>
		<a href="/investigadores" class:active={isInvestigadoresActive} on:click={closeMenu}
			>Investigadores</a
		>
		<a href="/contact" class:active={isContactActive} on:click={closeMenu}>Contacto</a>
		<a href="/about" class:active={isAboutActive} on:click={closeMenu}>Nosotros</a>
		<a href="/blog" class:active={isBlogActive} on:click={closeMenu}>Blog</a>

		<div class="mobile-menu-actions">
			<ThemeToggle />
		</div>
	</div>
</header>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	header {
		position: relative;
		padding: 30px 0;

		@include for-phone-only {
			padding: 20px 0;
		}

		&.has-background {
			background: linear-gradient(
				60deg,
				var(--color--waves-start) 0%,
				var(--color--waves-end) 100%
			);
		}

		.container {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 30px;
		}

		.logo {
			height: 44px;
			display: flex;
			align-items: center;
			text-decoration: none;
			color: var(--color--text);
			cursor: pointer;
			z-index: 1001;

			@include for-phone-only {
				flex: 1;
			}
		}

		.desktop-links {
			display: flex;
			align-items: center;
			gap: 30px;
			flex: 1;
			justify-content: flex-end;

			@include for-phone-only {
				display: none;
			}
		}

		.links {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			gap: 30px;

			a {
				text-decoration: none;
				transition: all 0.2s ease;
				color: var(--color--text);
				font-weight: 400;

				&:hover {
					color: var(--color--primary);
					filter: drop-shadow(0px 0px 3px var(--color--primary));
				}

				&.active {
					font-weight: 700 !important;
				}
			}
		}

		/* Botón hamburguesa */
		.hamburger {
			display: none;
			align-items: center;
			justify-content: center;
			width: 40px;
			height: 40px;
			background: transparent;
			border: none;
			cursor: pointer;
			padding: 0;
			z-index: 1001;
			border-radius: 8px;
			transition: all 0.3s ease;

			@include for-phone-only {
				display: flex;
			}

			svg {
				width: 24px;
				height: 24px;
				color: var(--color--text);
				transition: all 0.3s ease;
			}

			&:hover {
				background: rgba(var(--color--primary-rgb), 0.1);

				svg {
					color: var(--color--primary);
					transform: scale(1.1);
				}
			}

			&:active {
				transform: scale(0.95);
			}
		}

		/* Menú móvil */
		.mobile-menu {
			display: none;
			position: fixed;
			top: 84px;
			left: 0;
			right: 0;
			bottom: 0;
			width: 100%;
			height: calc(100vh - 84px);
			background: var(--color--card-background);
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
			padding: 2rem;
			flex-direction: column;
			gap: 1.5rem;
			transform: translateY(-100%);
			opacity: 0;
			transition: all 0.3s ease;
			z-index: 1000;
			overflow-y: auto;

			@include for-phone-only {
				display: flex;
			}

			&.open {
				transform: translateY(0);
				opacity: 1;
			}

			a {
				text-decoration: none;
				color: var(--color--text);
				font-size: 1.2rem;
				font-weight: 400;
				padding: 0.75rem 1rem;
				border-radius: 8px;
				transition: all 0.2s ease;

				&:hover {
					background: rgba(var(--color--primary-rgb), 0.1);
					color: var(--color--primary);
				}

				&.active {
					font-weight: 700;
					background: rgba(var(--color--primary-rgb), 0.15);
					color: var(--color--primary);
				}
			}

			.mobile-menu-actions {
				display: flex;
				gap: 1rem;
				padding: 1rem;
				border-top: 1px solid rgba(var(--color--text-rgb), 0.1);
				margin-top: 1rem;
				justify-content: center;
				align-items: center;
			}
		}
	}

	/* Ocultar chat widget cuando el menú móvil está abierto */
	:global(.chat-widget.hidden-mobile-menu) {
		display: none !important;
		opacity: 0 !important;
		pointer-events: none !important;
		visibility: hidden !important;
	}
</style>
