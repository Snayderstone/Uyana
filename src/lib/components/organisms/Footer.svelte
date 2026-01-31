<script>
	import FooterWave from '$lib/icons/footer-wave.svelte';
	import Socials from '$lib/components/molecules/Socials.svelte';
	import { beforeNavigate } from '$app/navigation';

	// Scroll al inicio cuando se navega a términos o privacidad
	beforeNavigate(({ to }) => {
		if (to?.route?.id?.includes('/terminos') || to?.route?.id?.includes('/privacidad')) {
			setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
		}
	});
</script>

<footer>
	<div class="wave">
		<FooterWave />
	</div>
	<div class="content">
		<div class="copyright">
			© 2025 Universidad Central del Ecuador <a
				href="https://www.uce.edu.ec/web/di"
				target="_blank"
				rel="noopener noreferrer">- Dirección de Investigación</a
			>.
		</div>

		<div class="credits">
			Impulsado por <a
				href="https://www.uce.edu.ec/web/fing"
				target="_blank"
				rel="noopener noreferrer">Sistemas de Información</a
			>.
		</div>

		<div class="socials">
			<Socials />
		</div>

		<div class="legal-links">
			<span class="separator">•</span>
			<a href="/terminos">Términos y Condiciones</a>
			<span class="separator">•</span>
			<a href="/privacidad">Política de Privacidad</a>
		</div>
	</div>
</footer>

<style lang="scss">
	footer {
		height: 340px;
		width: 100%;
		background: linear-gradient(60deg, var(--color--waves-start) 0%, var(--color--waves-end) 100%);
		display: grid;
		grid-template-rows: 120px 1fr;

		.content {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 10px;
			font-weight: 600;
			text-align: center;

			.legal-links {
				display: flex;
				align-items: center;
				gap: 12px;
				font-size: 90%;
				margin-bottom: 10px;

				.separator {
					color: var(--color--text-shade);
					opacity: 0.6;
				}

				a {
					font-weight: 700;
					transition: opacity 0.3s ease;

					&:hover {
						opacity: 0.8;
					}
				}
			}

			.copyright {
				font-size: 100%;
				color: var(--color--text);
				margin-bottom: 20px;
			}

			.credits {
				font-weight: 300;
				font-size: 90%;
				margin-bottom: 20px;

				a {
					font-weight: 700;
				}
			}

			.socials {
				display: flex;
				align-items: center;
				gap: 20px;
				margin-bottom: 20px;
			}
		}

		a {
			position: relative;
			text-decoration: none;

			&::after {
				content: '';
				position: absolute;
				left: 0;
				bottom: -2px;
				width: 100%;
				height: 2px;
				background-color: rgb(var(--color--text-rgb));
				transition: background-color 0.3s ease;
			}

			&:hover {
				filter: drop-shadow(0px 0px 3px var(--color--primary));
			}
		}
	}
</style>
