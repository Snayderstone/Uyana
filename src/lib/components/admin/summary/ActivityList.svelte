<script lang="ts">
	export let activities: Array<{
		label: string;
		time: string;
		href?: string;
	}> = [];
</script>

<div class="activity-list">
	{#if activities.length === 0}
		<div class="empty-state">Sin actividad reciente</div>
	{:else}
		{#each activities as activity}
			{#if activity.href}
				<a href={activity.href} class="activity-item">
					<span class="activity-label">{activity.label}</span>
					<span class="activity-time">{activity.time}</span>
				</a>
			{:else}
				<div class="activity-item">
					<span class="activity-label">{activity.label}</span>
					<span class="activity-time">{activity.time}</span>
				</div>
			{/if}
		{/each}
	{/if}
</div>

<style>
	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.activity-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.875rem;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 6px;
		text-decoration: none;
		transition: all 0.2s ease;
		box-shadow: var(--card-shadow);
	}

	a.activity-item:hover {
		border-color: var(--color--primary);
		background: var(--color--primary-tint);
		transform: translateX(4px);
		box-shadow: 0 2px 8px rgba(var(--color--primary-rgb), 0.1);
	}

	.activity-label {
		font-size: 0.875rem;
		color: var(--color--text);
		font-weight: 500;
	}

	.activity-time {
		font-size: 0.75rem;
		color: var(--color--text-secondary);
		white-space: nowrap;
		margin-left: 1rem;
	}

	.empty-state {
		padding: 2.5rem;
		text-align: center;
		color: var(--color--text-secondary);
		font-size: 0.875rem;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 6px;
	}
</style>
