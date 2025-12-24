<script lang="ts">
	export let label: string;
	export let value: string | number;
	export let subtitle: string = '';
	export let href: string = '';
</script>

{#if href}
	<a {href} class="stat-card">
		<div class="stat-label">{label}</div>
		<div class="stat-value">{value}</div>
		{#if subtitle}
			<div class="stat-subtitle">{subtitle}</div>
		{/if}
	</a>
{:else}
	<div class="stat-card">
		<div class="stat-label">{label}</div>
		<div class="stat-value">{value}</div>
		{#if subtitle}
			<div class="stat-subtitle">{subtitle}</div>
		{/if}
	</div>
{/if}

<style>
	.stat-card {
		display: block;
		padding: 1.25rem;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 8px;
		transition: all 0.2s ease;
		text-decoration: none;
		box-shadow: var(--card-shadow);
	}

	a.stat-card:hover {
		border-color: var(--color--primary);
		box-shadow: 0 2px 8px rgba(var(--color--primary-rgb), 0.1);
		transform: translateY(-1px);
	}

	.stat-label {
		font-size: 0.8125rem;
		color: var(--color--text-secondary);
		font-weight: 500;
		margin-bottom: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--color--text);
		line-height: 1.2;
		font-family: var(--font--title);
	}

	.stat-subtitle {
		font-size: 0.8125rem;
		color: var(--color--text-secondary);
		margin-top: 0.5rem;
	}
</style>
