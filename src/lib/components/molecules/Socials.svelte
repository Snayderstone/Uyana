<script>
	import TelegramIcon from '$lib/icons/socials/telegram.svelte';
	import GitHubIcon from '$lib/icons/socials/github.svelte';
	import LinkedInIcon from '$lib/icons/socials/linkedin.svelte';
	import EmailIcon from '$lib/icons/socials/email.svelte';
	import RssIcon from '$lib/icons/rss.svelte';
	import MastodonIcon from '$lib/icons/socials/mastodon.svelte';

	// Props for configurable social links
	export let telegramUrl = 'https://t.me/yourusername';
	export let mastodonUrl = 'https://mastodon.social/@yourusername';
	export let githubUrl = 'https://github.com/yourusername';
	export let linkedinUrl = 'https://linkedin.com/in/yourusername';
	export let emailUrl = 'mailto:your.email@example.com';
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
		href={mastodonUrl}
		target="_blank"
		rel="me noreferrer"
		title="Say Hi on Mastodon"
		aria-label="Mastodon Profile"
	>
		<MastodonIcon />
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
