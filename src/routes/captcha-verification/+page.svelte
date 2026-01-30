<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { consentStore } from '$lib/stores/consent.store';

	let loading = false;
	let error = '';
	let hcaptchaContainer: HTMLDivElement;
	let widgetId: string | null = null;

	// Variable de entorno pública de hCaptcha
	const HCAPTCHA_SITE_KEY = import.meta.env.PUBLIC_HCAPTCHA_SITE_KEY || '';

	onMount(() => {
		// Verificar si ya pasó el CAPTCHA
		const consent = consentStore;
		if (consent && typeof consent.subscribe === 'function') {
			consent.subscribe((state) => {
				if (state.captchaVerified) {
					// Ya verificado, redirigir al inicio
					goto('/');
				}
			});
		}

		// Definir callback global para onload de hCaptcha
		(window as any).hcaptchaOnLoad = () => {
			renderCaptcha();
		};

		// Cargar script de hCaptcha con render=explicit y onload callback
		if (!(window as any).hcaptcha) {
			const script = document.createElement('script');
			script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&onload=hcaptchaOnLoad';
			script.async = true;
			script.defer = true;

			document.head.appendChild(script);
		} else {
			renderCaptcha();
		}
	});

	function renderCaptcha() {
		if (!(window as any).hcaptcha || !hcaptchaContainer) return;

		widgetId = (window as any).hcaptcha.render(hcaptchaContainer, {
			sitekey: HCAPTCHA_SITE_KEY,
			theme: 'dark',
			callback: handleVerify,
			'error-callback': handleError,
			'expired-callback': handleExpired
		});
	}

	async function handleVerify(token: string) {
		error = '';
		loading = true;

		try {
			const response = await fetch('/api/verify-captcha', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});

			const result = await response.json();

			if (result.success) {
				// Guardar que pasó el CAPTCHA
				consentStore.setCaptchaVerified(true, token);

				// Pequeña pausa para feedback visual
				await new Promise((resolve) => setTimeout(resolve, 500));

				// Redirigir al inicio donde se mostrará el modal
				goto('/');
			} else {
				error = 'Error al verificar CAPTCHA. Por favor intente nuevamente.';
				loading = false;
			}
		} catch (err) {
			console.error('Error verificando CAPTCHA:', err);
			error = 'Error de conexión. Por favor intente nuevamente.';
			loading = false;
		}
	}

	function handleError(err: string) {
		error = 'Error al cargar CAPTCHA. Por favor recargue la página.';
		console.error('Error de hCaptcha:', err);
		loading = false;
	}

	function handleExpired() {
		error = 'CAPTCHA expirado. Por favor verifique nuevamente.';
		loading = false;
	}
</script>

<svelte:head>
	<title>Verificación de Seguridad - SIGPI UCE</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="captcha-page">
	<div class="captcha-container">
		<div class="brand">
			<div class="logo-wrapper">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="logo-icon"
				>
					<path d="M12 2L2 7l10 5 10-5-10-5z" />
					<path d="M2 17l10 5 10-5" />
					<path d="M2 12l10 5 10-5" />
				</svg>
			</div>
			<h1>SIGPI</h1>
			<p class="subtitle">Sistema de Gestión de Proyectos de Investigación</p>
		</div>

		<div class="verification-card">
			<div class="card-header">
				<div class="security-badge">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
					</svg>
				</div>
				<h2>Verificación de Seguridad</h2>
				<p class="description">
					Para proteger los datos de investigación de la Universidad Central del Ecuador, por favor
					complete la verificación a continuación.
				</p>
			</div>

			<div class="captcha-wrapper">
				{#if HCAPTCHA_SITE_KEY}
					<div bind:this={hcaptchaContainer} class="hcaptcha-box"></div>
				{:else}
					<div class="error-box">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="12" />
							<line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
						<p>Error de configuración: HCAPTCHA_SITE_KEY no está definida.</p>
					</div>
				{/if}

				{#if error}
					<div class="error-message" role="alert">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="15" y1="9" x2="9" y2="15" />
							<line x1="9" y1="9" x2="15" y2="15" />
						</svg>
						<span>{error}</span>
					</div>
				{/if}

				{#if loading}
					<div class="loading-indicator">
						<div class="spinner"></div>
						<p>Verificando...</p>
					</div>
				{/if}
			</div>

			<div class="info-section">
				<div class="info-item">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
						<path d="M12 6v6l4 2" />
					</svg>
					<span>La verificación toma solo unos segundos</span>
				</div>
				<div class="info-item">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
						<path d="M7 11V7a5 5 0 0 1 10 0v4" />
					</svg>
					<span>Sus datos están protegidos y encriptados</span>
				</div>
			</div>
		</div>

		<div class="footer-info">
			<p>© 2026 Universidad Central del Ecuador</p>
			<p class="legal-links">
				<a href="/terminos" target="_blank">Términos</a>
				<span>·</span>
				<a href="/privacidad" target="_blank">Privacidad</a>
			</p>
		</div>
	</div>
</div>

<style lang="scss">
	.captcha-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		position: relative;
		overflow: hidden;

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
				radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%);
			pointer-events: none;
		}
	}

	.captcha-container {
		max-width: 550px;
		width: 100%;
		position: relative;
		z-index: 1;
	}

	.brand {
		text-align: center;
		margin-bottom: 3rem;
		animation: fadeInDown 0.8s ease-out;

		.logo-wrapper {
			display: inline-block;
			margin-bottom: 1rem;

			.logo-icon {
				width: 60px;
				height: 60px;
				color: #667eea;
				filter: drop-shadow(0 4px 20px rgba(102, 126, 234, 0.5));
			}
		}

		h1 {
			font-size: 2.5rem;
			font-weight: 800;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			margin: 0 0 0.5rem;
			letter-spacing: 2px;
		}

		.subtitle {
			color: #a0a0a0;
			font-size: 0.95rem;
			margin: 0;
		}
	}

	.verification-card {
		background: rgba(30, 30, 30, 0.95);
		backdrop-filter: blur(20px);
		border-radius: 20px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 3rem 2.5rem;
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		animation: fadeInUp 0.8s ease-out 0.2s both;
	}

	.card-header {
		text-align: center;
		margin-bottom: 2.5rem;

		.security-badge {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 70px;
			height: 70px;
			background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
			border-radius: 50%;
			margin-bottom: 1.5rem;
			border: 2px solid rgba(102, 126, 234, 0.3);

			svg {
				width: 35px;
				height: 35px;
				color: #667eea;
			}
		}

		h2 {
			color: #ffffff;
			font-size: 1.75rem;
			font-weight: 700;
			margin: 0 0 1rem;
		}

		.description {
			color: #a0a0a0;
			line-height: 1.6;
			font-size: 0.95rem;
			margin: 0;
		}
	}

	.captcha-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		margin: 2rem 0;

		.hcaptcha-box {
			display: flex;
			justify-content: center;
		}
	}

	.error-box {
		background: rgba(220, 38, 38, 0.1);
		border: 1px solid rgba(220, 38, 38, 0.3);
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		color: #fca5a5;

		svg {
			width: 24px;
			height: 24px;
			flex-shrink: 0;
		}

		p {
			margin: 0;
			font-size: 0.9rem;
		}
	}

	.error-message {
		background: rgba(220, 38, 38, 0.15);
		border: 1px solid rgba(220, 38, 38, 0.4);
		border-radius: 12px;
		padding: 1rem 1.25rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: #fca5a5;
		animation: shake 0.5s ease-in-out;

		svg {
			width: 20px;
			height: 20px;
			flex-shrink: 0;
		}

		span {
			font-size: 0.9rem;
		}
	}

	.loading-indicator {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: #667eea;
		font-size: 0.95rem;

		.spinner {
			width: 24px;
			height: 24px;
			border: 3px solid rgba(102, 126, 234, 0.2);
			border-top-color: #667eea;
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
		}
	}

	.info-section {
		margin-top: 2.5rem;
		padding-top: 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		gap: 1rem;

		.info-item {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			color: #a0a0a0;
			font-size: 0.9rem;

			svg {
				width: 18px;
				height: 18px;
				color: #667eea;
				flex-shrink: 0;
			}
		}
	}

	.footer-info {
		text-align: center;
		margin-top: 2rem;
		color: #666;
		font-size: 0.85rem;
		animation: fadeIn 0.8s ease-out 0.4s both;

		p {
			margin: 0.5rem 0;
		}

		.legal-links {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.75rem;

			a {
				color: #667eea;
				text-decoration: none;
				transition: color 0.2s;

				&:hover {
					color: #764ba2;
				}
			}

			span {
				color: #444;
			}
		}
	}

	@keyframes fadeInDown {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-10px);
		}
		75% {
			transform: translateX(10px);
		}
	}

	@media (max-width: 640px) {
		.captcha-page {
			padding: 1rem;
		}

		.brand {
			margin-bottom: 2rem;

			.logo-icon {
				width: 50px;
				height: 50px;
			}

			h1 {
				font-size: 2rem;
			}

			.subtitle {
				font-size: 0.85rem;
			}
		}

		.verification-card {
			padding: 2rem 1.5rem;
		}

		.card-header {
			.security-badge {
				width: 60px;
				height: 60px;

				svg {
					width: 30px;
					height: 30px;
				}
			}

			h2 {
				font-size: 1.5rem;
			}

			.description {
				font-size: 0.9rem;
			}
		}
	}
</style>
