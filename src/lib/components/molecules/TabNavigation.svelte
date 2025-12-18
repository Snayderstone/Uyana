<script lang="ts">
	export let tabs: Array<{
		id: string;
		label: string;
		icon?: any; // Componente Svelte o string
	}>;
	export let activeTab: string;
	export let onChange: (tabId: string) => void;
</script>

<div class="tabs-navigation">
	{#each tabs as tab}
		<button class="tab-btn" class:active={activeTab === tab.id} on:click={() => onChange(tab.id)}>
			{#if tab.icon}
				{#if typeof tab.icon === 'string'}
					<span class="tab-icon-text">{tab.icon}</span>
				{:else}
					<span class="tab-icon">
						<svelte:component this={tab.icon} size={18} />
					</span>
				{/if}
			{/if}
			<span class="tab-label">{tab.label}</span>
		</button>
	{/each}
</div>

<style lang="scss">
	.tabs-navigation {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid rgba(var(--color--text-rgb, 0, 0, 0), 0.08);
		overflow-x: auto;
		scrollbar-width: thin;

		&::-webkit-scrollbar {
			height: 4px;
		}

		&::-webkit-scrollbar-track {
			background: rgba(var(--color--text-rgb, 0, 0, 0), 0.05);
		}

		&::-webkit-scrollbar-thumb {
			background: rgba(var(--color--text-rgb, 0, 0, 0), 0.2);
			border-radius: 2px;

			&:hover {
				background: rgba(var(--color--text-rgb, 0, 0, 0), 0.3);
			}
		}
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: transparent;
		border: none;
		border-bottom: 3px solid transparent;
		color: var(--color--text-shade, #6b7280);
		font-size: 0.95rem;
		font-weight: 600;
		font-family: var(--font--default);
		cursor: pointer;
		transition: all 0.3s var(--ease-out-3, ease);
		white-space: nowrap;
		margin-bottom: -2px;

		&:hover {
			color: var(--color--primary, #6e29e7);
			background: rgba(var(--color--primary-rgb, 110, 41, 231), 0.05);
		}

		&.active {
			color: var(--color--primary, #6e29e7);
			border-bottom-color: var(--color--primary, #6e29e7);
			background: rgba(var(--color--primary-rgb, 110, 41, 231), 0.05);
		}

		&:focus {
			outline: none;
			box-shadow: 0 0 0 2px rgba(var(--color--primary-rgb, 110, 41, 231), 0.2);
		}
	}

	.tab-icon,
	.tab-icon-text {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.tab-icon-text {
		font-size: 1.125rem;
	}

	.tab-label {
		user-select: none;
	}

	@media (max-width: 768px) {
		.tabs-navigation {
			gap: 0.25rem;
		}

		.tab-btn {
			padding: 0.625rem 1rem;
			font-size: 0.875rem;

			.tab-label {
				display: none;
			}

			&.active .tab-label {
				display: inline;
			}
		}
	}
</style>
