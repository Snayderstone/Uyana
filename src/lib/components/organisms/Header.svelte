<script lang="ts">
	import { page } from '$app/stores';
	import Logo from '$lib/components/atoms/Logo.svelte';
	import ThemeToggle from '$lib/components/molecules/ThemeToggle.svelte';
	import RssLink from '$lib/components/atoms/RssLink.svelte';

	export let showBackground = false;

	// Declaraciones reactivas para cada link
	$: currentPath = $page.url.pathname;
	$: isMapActive = currentPath === '/map' || currentPath.startsWith('/map/');
	$: isInvestigadoresActive =
		currentPath === '/investigadores' || currentPath.startsWith('/investigadores/');
	$: isContactActive = currentPath === '/contact' || currentPath.startsWith('/contact/');
	$: isAboutActive = currentPath === '/about' || currentPath.startsWith('/about/');
	$: isBlogActive = currentPath === '/blog' || currentPath.startsWith('/blog/');
</script>

<header class:has-background={showBackground}>
	<nav class="container">
		<a href="/" class="logo" aria-label="Uyana - Página principal">
			<Logo />
		</a>

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

			<RssLink />
			<ThemeToggle />
		</div>
	</nav>
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
			gap: 30px;

			@include for-phone-only {
				.links {
					a {
						display: none;
					}
				}

				.logo {
					flex: 0;
				}
			}
		}

		.logo {
			height: 44px;
			flex: 1;
			display: flex;
			align-items: center;
			text-decoration: none;
			color: var(--color--text);
			cursor: pointer;
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
	}
</style>
