<script lang="ts">
	export let href: string;
	export let label: string;
</script>

<a {href} class="quick-action">
	{label}
</a>

<style>
	.quick-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.625rem 1rem;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 6px;
		color: var(--color--text);
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.2s ease;
		box-shadow: var(--card-shadow);
	}

	.quick-action:hover {
		border-color: var(--color--primary);
		color: var(--color--primary);
		background: var(--color--primary-tint);
		box-shadow: 0 2px 8px rgba(var(--color--primary-rgb), 0.1);
		transform: translateY(-1px);
	}
</style>
