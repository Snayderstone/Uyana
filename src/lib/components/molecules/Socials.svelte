<script>
	import TelegramIcon from '$lib/icons/socials/telegram.svelte';
	import GitHubIcon from '$lib/icons/socials/github.svelte';
	import LinkedInIcon from '$lib/icons/socials/linkedin.svelte';
	import EmailIcon from '$lib/icons/socials/email.svelte';
	import RssIcon from '$lib/icons/rss.svelte';
	import FacebookIcon from '$lib/icons/socials/facebook.svelte';
	import YoutubeIcon from '$lib/icons/socials/youtube.svelte';
	import XIcon from '$lib/icons/socials/x.svelte';


	// Props for configurable social links
	export let telegramUrl = 'https://t.me/yourusername';
	export let githubUrl = 'https://github.com/Snayderstone/Uyana';
	export let linkedinUrl = 'https://www.linkedin.com/school/tungabhadra-b.ed-college-kottur---583134/about/';
	export let emailUrl = 'mailto:your.email@example.com';
	export let facebookUrl = 'https://www.facebook.com/InvestigaUCE';
	export let youtubeUrl = 'https://www.uce.edu.ec/web/investigadores/home';
	export let xUrl = 'https://x.com/InvestigaUCE';
</script>

<div class="socials">
	<a
		href={telegramUrl}
		target="_blank"
		rel="noopener noreferrer"
		title="Say Hi on Telegram"
		aria-label="Telegram Profile"
	>
		<TelegramIcon />
	</a>
	<a
		href={githubUrl}
		target="_blank"
		rel="noopener noreferrer"
		title="See my GitHub profile"
		aria-label="GitHub Profile"
	>
		<GitHubIcon />
	</a>
	<a
		href={linkedinUrl}
		target="_blank"
		rel="noopener noreferrer"
		title="Connect on LinkedIn"
		aria-label="LinkedIn Profile"
	>
		<LinkedInIcon />
	</a>
	<a
		href={emailUrl}
		target="_blank"
		rel="noopener noreferrer"
		title="Send an email"
		aria-label="Send Email"
	>
		<EmailIcon />
	</a>
	<a
		href={facebookUrl}
		target="_blank"
		rel="noopener noreferrer"
		title="Send an email"
		aria-label="Send Email"
	>
		<FacebookIcon />
	</a>
	<a
		href={youtubeUrl}
		target="_blank"
		rel="noopener noreferrer"
		title="Send an email"
		aria-label="Send Email"
	>
		<YoutubeIcon />
	</a>
	<a
		href={xUrl}
		target="_blank"
		rel="noopener noreferrer"
		title="Send an email"
		aria-label="Send Email"
	>
		<XIcon />
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
