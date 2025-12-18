<script lang="ts">
	export let data: Array<{ label: string; value: number; color?: string }> = [];
	export let size: number = 200;
	export let showLegend: boolean = true;
	export let showPercentages: boolean = true;
	export let innerRadius: number = 0; // For donut chart: 0 = pie, >0 = donut

	$: total = data.reduce((sum, d) => sum + d.value, 0);
	$: centerX = size / 2;
	$: centerY = size / 2;
	$: radius = size / 2 - 10;

	function getDefaultColor(index: number): string {
		const colors = [
			'#3b82f6',
			'#10b981',
			'#f59e0b',
			'#ef4444',
			'#8b5cf6',
			'#ec4899',
			'#06b6d4',
			'#84cc16'
		];
		return colors[index % colors.length];
	}

	function calculatePaths(data: Array<{ label: string; value: number; color?: string }>) {
		if (total === 0) return [];

		let cumulativeAngle = -90; // Start from top
		const paths: Array<{
			path: string;
			color: string;
			percentage: number;
			label: string;
			value: number;
		}> = [];

		data.forEach((item, index) => {
			const percentage = (item.value / total) * 100;
			const angle = (item.value / total) * 360;

			const startAngle = (cumulativeAngle * Math.PI) / 180;
			const endAngle = ((cumulativeAngle + angle) * Math.PI) / 180;

			const x1 = centerX + radius * Math.cos(startAngle);
			const y1 = centerY + radius * Math.sin(startAngle);
			const x2 = centerX + radius * Math.cos(endAngle);
			const y2 = centerY + radius * Math.sin(endAngle);

			const largeArcFlag = angle > 180 ? 1 : 0;

			let path: string;
			if (innerRadius > 0) {
				// Donut chart
				const innerX1 = centerX + innerRadius * Math.cos(startAngle);
				const innerY1 = centerY + innerRadius * Math.sin(startAngle);
				const innerX2 = centerX + innerRadius * Math.cos(endAngle);
				const innerY2 = centerY + innerRadius * Math.sin(endAngle);

				path = `
          M ${x1} ${y1}
          A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
          L ${innerX2} ${innerY2}
          A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}
          Z
        `;
			} else {
				// Regular pie chart
				path = `
          M ${centerX} ${centerY}
          L ${x1} ${y1}
          A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
          Z
        `;
			}

			paths.push({
				path: path.trim(),
				color: item.color || getDefaultColor(index),
				percentage,
				label: item.label,
				value: item.value
			});

			cumulativeAngle += angle;
		});

		return paths;
	}

	$: paths = calculatePaths(data);
</script>

<div class="pie-chart-container">
	{#if data.length === 0 || total === 0}
		<div class="empty-chart">
			<p>No hay datos disponibles</p>
		</div>
	{:else}
		<div class="chart-wrapper">
			<svg width={size} height={size} class="pie-chart">
				{#each paths as segment, index (segment.label)}
					<g class="segment-group">
						<path d={segment.path} fill={segment.color} class="pie-segment" />
						<title>{segment.label}: {segment.value} ({segment.percentage.toFixed(1)}%)</title>
					</g>
				{/each}
			</svg>

			{#if innerRadius > 0}
				<div class="center-label" style="width: {innerRadius * 2}px; height: {innerRadius * 2}px;">
					<div class="center-content">
						<span class="center-total">{total}</span>
						<span class="center-text">Total</span>
					</div>
				</div>
			{/if}
		</div>

		{#if showLegend}
			<div class="legend">
				{#each paths as segment (segment.label)}
					<div class="legend-item">
						<div class="legend-color" style="background-color: {segment.color}" />
						<div class="legend-content">
							<span class="legend-label">{segment.label}</span>
							{#if showPercentages}
								<span class="legend-value">{segment.value} ({segment.percentage.toFixed(1)}%)</span>
							{:else}
								<span class="legend-value">{segment.value}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
	.pie-chart-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 1rem;
		width: 100%;
	}

	.empty-chart {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--color--text-shade);
		font-size: 0.95rem;
	}

	.chart-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pie-chart {
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
	}

	.pie-segment {
		cursor: pointer;
		transition: all 0.3s var(--ease-out-3);
		stroke: var(--color--card-background, #fff);
		stroke-width: 2;
	}

	.pie-segment:hover {
		opacity: 0.85;
		filter: brightness(1.1);
		transform: scale(1.02);
		transform-origin: center;
	}

	.center-label {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.center-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.center-total {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color--text);
		font-family: var(--font--default);
	}

	.center-text {
		font-size: 0.75rem;
		color: var(--color--text-shade);
		font-family: var(--font--default);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.legend {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		max-width: 300px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		border-radius: 6px;
		transition: background-color 0.2s;
	}

	.legend-item:hover {
		background-color: rgba(var(--color--text-rgb), 0.03);
	}

	.legend-color {
		width: 16px;
		height: 16px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.legend-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.legend-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color--text);
		font-family: var(--font--default);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.legend-value {
		font-size: 0.75rem;
		color: var(--color--text-shade);
		font-family: var(--font--default);
	}

	@media (max-width: 768px) {
		.legend {
			max-width: 100%;
		}
	}
</style>
