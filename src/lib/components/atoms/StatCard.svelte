<!-- src/lib/components/atoms/StatCard.svelte -->
<script lang="ts">
	export let title: string = '';
	export let value: string | number = '0';
	export let icon: string = '';
	export let trend: number | null = null;
	export let trendText: string | null = null;
	export let colorVarName: string = '--color--primary';
</script>

<div class="stat-card" style="--accent-color: var({colorVarName}, #6E29E7);">
	<div class="stat-card__icon">
		{#if $$slots.icon}
			<slot name="icon" />
		{:else if icon}
			{@html icon}
		{/if}
	</div>

	<div class="stat-card__content">
		<h3 class="stat-card__title">{title}</h3>
		<p class="stat-card__value" title={typeof value === 'string' && value.length > 20 ? value : ''}>
			{value}
		</p>

		{#if trend !== null || trendText}
			<div
				class="stat-card__trend"
				class:positive={trend !== null && trend > 0}
				class:negative={trend !== null && trend < 0}
			>
				{#if trend !== null}
					<span class="trend-arrow">{trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}</span>
					<span>{Math.abs(trend)}%</span>
				{/if}
				{#if trendText}
					<span>{trendText}</span>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.stat-card {
		background: var(--color--card-background, #ffffff);
		border-radius: 12px;
		box-shadow: var(--card-shadow);
		padding: 1.25rem;
		display: flex;
		gap: 1.25rem;
		align-items: flex-start;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		height: 100%; /* Asegura que todos los cards tengan la misma altura */
		min-height: 130px; /* Establece una altura mínima uniforme */
		width: 100%; /* Asegura que ocupe todo el ancho disponible */

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			height: 4px;
			width: 100%;
			background: var(--accent-color);
			border-radius: 4px 4px 0 0;
		}

		&:hover {
			transform: translateY(-2px);
			box-shadow: var(--card-shadow-hover);
		}
	}

	.stat-card__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: 0.75rem;
		background: color-mix(in srgb, var(--accent-color) 15%, transparent);
		color: var(--accent-color);

		:global(svg) {
			width: 1.5rem;
			height: 1.5rem;
		}
	}

	.stat-card__content {
		flex: 1;
	}

	.stat-card__title {
		font-size: 0.875rem;
		color: var(--color--text-shade);
		margin: 0 0 0.5rem 0;
		font-weight: 600;
	}

	.stat-card__value {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		color: var(--color--text);
		line-height: 1.1;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		display: box;
		-webkit-line-clamp: 2;
		line-clamp: 2; /* Propiedad estándar para compatibilidad */
		-webkit-box-orient: vertical;
		box-orient: vertical;
		max-height: 3.3rem; /* 1.1 line-height * 2 lines + padding */
		word-wrap: break-word;
	}

	.stat-card__trend {
		font-size: 0.875rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		line-height: 1;

		&.positive {
			color: #00c48f;
		}

		&.negative {
			color: #f95256;
		}
	}

	.trend-arrow {
		font-size: 1rem;
	}
</style>
