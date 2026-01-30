<script lang="ts">
	import Waves from '$lib/components/organisms/Waves.svelte';
	import Header from '$lib/components/organisms/Header.svelte';
	import Footer from '$lib/components/organisms/Footer.svelte';
	import ConsentModal from '$lib/components/auth/ConsentModal.svelte';
	import { goto } from '$app/navigation';

	import { description, image, keywords, title, siteBaseUrl } from '$lib/data/meta';
	import { consentStore } from '$lib/stores/consent.store';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Estado del consentimiento
	let showConsentModal = false;
	let consentError = '';
	let loading = false;

	// Suscribirse al store de consentimiento
	let consent = $consentStore;

	onMount(() => {
		const state = $consentStore;

		// Si NO ha pasado el CAPTCHA, redirigir a la página de verificación
		if (!state.captchaVerified) {
			goto('/captcha-verification');
			return;
		}

		// Si pasó el CAPTCHA pero NO ha aceptado términos, mostrar modal
		if (state.captchaVerified && (!state.consentAccepted || !state.consentSaved)) {
			// Generar token de sesión si no existe
			if (!state.sessionToken) {
				const sessionToken = generateSessionToken();
				consentStore.setSessionToken(sessionToken);
			}
			showConsentModal = true;
		}
	});

	function generateSessionToken(): string {
		// Generar token corto: "sess_" + timestamp + "_" + random (max 50 caracteres)
		const timestamp = Date.now().toString(36); // Base36 más corto
		const random = Math.random().toString(36).substring(2, 10); // 8 caracteres aleatorios
		return `sess_${timestamp}_${random}`;
	}

	async function handleConsentAccept() {
		consentError = '';
		loading = true;

		try {
			const state = $consentStore;
			const response = await fetch('/api/consent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionToken: state.sessionToken,
					termsVersion: '1.0',
					privacyVersion: '1.0',
					academicUseVersion: '1.0'
				})
			});

			const result = await response.json();

			if (result.success) {
				consentStore.setConsentAccepted(true);
				consentStore.setConsentSaved(true);
				showConsentModal = false;
			} else {
				consentError = 'Error al guardar el consentimiento. Por favor intente nuevamente.';
			}
		} catch (error) {
			console.error('Error guardando consentimiento:', error);
			consentError = 'Error de conexión al guardar el consentimiento.';
		} finally {
			loading = false;
		}
	}

	function handleConsentCancel() {
		// Si cancela, limpiar todo y redirigir a verificación
		consentStore.reset();
		goto('/captcha-verification');
	}

	// Reactive: actualizar estado local cuando cambia el store
	$: consent = $consentStore;
	$: hasAccess = consent.captchaVerified && consent.consentAccepted && consent.consentSaved;
</script>

<svelte:head>
	<link rel="“canonical”" href={siteBaseUrl} />
	<meta name="keywords" content={keywords.join(', ')} />

	<meta name="description" content={description} />
	<meta property="og:description" content={description} />
	<meta name="twitter:description" content={description} />

	<title>{title}</title>
	<meta property="og:title" content={title} />
	<meta name="twitter:title" content={title} />

	<meta property="og:image" content={image} />
	<meta name="twitter:image" content={image} />

	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<Waves />

<Header />

<main>
	{#if hasAccess}
		<!-- Usuario ha completado CAPTCHA y aceptado términos -->
		<slot />
	{:else}
		<!-- Esperando verificación... -->
		<div class="verification-pending">
			<div class="spinner-large"></div>
			<p>Verificando acceso...</p>
		</div>
	{/if}
</main>

<Footer />

{#if showConsentModal}
	<ConsentModal
		error={consentError}
		{loading}
		on:accept={handleConsentAccept}
		on:cancel={handleConsentCancel}
	/>
{/if}

<style lang="scss">
	main {
		position: relative;
		z-index: 1;
	}

	.verification-pending {
		min-height: 60vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1.5rem;

		p {
			color: #6b7280;
			font-weight: 500;
			font-size: 1.1rem;
		}
	}

	.spinner-large {
		width: 60px;
		height: 60px;
		border: 5px solid #e5e7eb;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.verification-pending {
			min-height: 50vh;

			p {
				font-size: 1rem;
			}
		}
	}
</style>
