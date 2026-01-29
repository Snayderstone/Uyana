<script>
	import GitHubIcon from '$lib/icons/socials/github.svelte';
	import EmailIcon from '$lib/icons/socials/email.svelte';
	import FacebookIcon from '$lib/icons/socials/facebook.svelte';
	import XIcon from '$lib/icons/socials/x.svelte';

	// Props for configurable social links
	export let githubUrl = 'https://github.com/Snayderstone/SIGPI';
	export let emailUrl = 'mailto:investigacion@uce.edu.ec';
	export let facebookUrl = 'https://www.facebook.com/InvestigaUCE';
	export let xUrl = 'https://x.com/InvestigaUCE';
</script>

<div class="socials">
	<a
		href={facebookUrl}
		target="_blank"
		rel="noopener noreferrer"
		title="Visita nuestra página de Facebook"
		aria-label="Visita nuestra página de Facebook"
	>
		<FacebookIcon />
	</a>

	<a
		href={xUrl}
		target="_blank"
		rel="noopener noreferrer"
		title="Visita nuestra página de X"
		aria-label="Visita nuestra página de X"
	>
		<XIcon />
	</a>

	<a
		href={emailUrl}
		target="_blank"
		rel="noopener noreferrer"
		title="Envía un correo electrónico"
		aria-label="Envía un correo electrónico"
	>
		<EmailIcon />
	</a>

	<a
		href={githubUrl}
		target="_blank"
		rel="noopener noreferrer"
		title="Visita mi perfil de GitHub"
		aria-label="Perfil de GitHub"
	>
		<GitHubIcon />
	</a>
</div>

<style lang="scss">
	@import '../../scss/breakpoints.scss';
	.socials {
		display: flex;
		align-items: center;
		gap: 20px;

		a {
			transition: all 0.2s ease-in-out;
			width: 24px;
			color: var(--color--text);
			fill: var(--color--text);

			&:hover {
				color: var(--color--primary);
				fill: var(--color--primary);
				filter: drop-shadow(0px 0px 3px var(--color--primary));
			}
		}
	}
</style>
