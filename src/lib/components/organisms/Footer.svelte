<script>
	import FooterWave from '$lib/icons/footer-wave.svelte';
	import Socials from '$lib/components/molecules/Socials.svelte';
	import ThemeToggle from '$lib/components/molecules/ThemeToggle.svelte';
	import RssLink from '$lib/components/atoms/RssLink.svelte';
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
			Impulsado por <a href="https://www.uce.edu.ec/web/fing" target="_blank" rel="noopener noreferrer"
				>Sistemas de Información</a
			>.
		</div>
		<div class="socials">
			<Socials />
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
			gap: 15px;
			font-weight: 600;
			text-align: center;
			
			.copyright {
				font-size: 100%;
				color: var(--color--text);
				margin-bottom: 20px;
			}

			.credits {
				font-weight: 300;
				font-size: 90%;
				color: var(--color--text-shade);
				margin-bottom: 20px;
			}

			.socials {
				display: flex;
				align-items: center;
				gap: 20px;
				margin-bottom: 20px;
			}
		}

		a {
			&:hover {
				filter: drop-shadow(0px 0px 3px var(--color--primary));
			}
		}
		a {
		position: relative;
		text-decoration: none; /* eliminar underline por defecto */
		
		/* subrayado personalizado */
		&::after {
			content: "";
			position: absolute;
			left: 0;
			bottom: -2px; /* ajusta la distancia de la raya */
			width: 100%;
			height: 2px; /* grosor de la raya */
			background-color: rgb(var(--color--text-rgb)); /* color secondary */
			transition: background-color 0.3s ease;
		}

		&:hover {
			filter: drop-shadow(0px 0px 3px var(--color--primary));

			/* si quieres cambiar el color de la raya en hover (opcional): */
			// &::after {
			//     background-color: rgb(var(--color--primary-rgb));
			// }
		}
	}
	}
</style>
