<script lang="ts">
	import Logo from '$lib/components/atoms/Logo.svelte';
	import ThemeToggle from '$lib/components/molecules/ThemeToggle.svelte';
	import RssLink from '$lib/components/atoms/RssLink.svelte';
	import Button from '../atoms/Button.svelte';
	import { isLoggedIn, authStore } from '$lib/auth/stores/authStore';
	import { authService } from '$lib/auth/services/authService';

	export let showBackground = false;
</script>

<header class:has-background={showBackground}>
	<nav class="container">
		<a class="logo" href="/" aria-label="Uyana - Página principal">
			<Logo />
		</a>

		<div class="links">
			<a href="/map">Mapa</a>
		</div>

		<div class="links">
			<a href="/investigadores">Investigadores</a>
		</div>

		<div class="links">
			<a href="/chat">Chat</a>
		</div>

		<div class="links">
			<a href="/contact">Contacto</a>
		</div>

		<div class="links">
			<a href="/about">Nosotros</a>
		</div>

		<div class="links">
			<a href="/blog">Blog</a>

			<RssLink />
			<ThemeToggle />
		</div>
		<div class="links">
			{#if $isLoggedIn}
				<span>Hola, {$authStore.user?.full_name ?? $authStore.user?.email}</span>
				<Button on:click={() => authService.logout()} variant="secondary" size="small"
					>Logout</Button
				>
			{:else}
				<Button href="/auth" variant="secondary" size="small">Login</Button>
			{/if}
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
		}

		a {
			color: var(--color--text);
		}

		.links {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			gap: 30px;

			a {
				text-decoration: none;

				&:hover {
					color: var(--color--primary);
					filter: drop-shadow(0px 0px 3px var(--color--primary));
				}
			}
		}
	}
</style>
