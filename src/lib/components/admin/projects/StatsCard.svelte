<script lang="ts">
	export let label: string;
	export let value: string | number;
	export let icon:
		| 'projects'
		| 'budget'
		| 'completed'
		| 'progress'
		| 'average'
		| 'active'
		| 'success-rate'
		| 'pending';
	export let tooltip: string = '';
	export let isBudget: boolean = false;

	// Icon SVG paths
	const icons = {
		projects: {
			viewBox: '0 0 24 24',
			paths: [
				'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z',
				'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'
			]
		},
		budget: {
			viewBox: '0 0 24 24',
			paths: ['M12 1 L12 23', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6']
		},
		average: {
			viewBox: '0 0 24 24',
			paths: ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6']
		},
		completed: {
			viewBox: '0 0 24 24',
			paths: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4 L12 14.01 L9 11.01']
		},
		progress: {
			viewBox: '0 0 24 24',
			paths: ['M22 12 L18 12 L15 21 L9 3 L6 12 L2 12']
		},
		active: {
			viewBox: '0 0 24 24',
			paths: ['M12 2 A10 10 0 1 1 12 22 A10 10 0 1 1 12 2', 'M12 6 L12 12 L16 14']
		},
		'success-rate': {
			viewBox: '0 0 24 24',
			paths: ['M22 12h-4l-3 9L9 3l-3 9H2']
		},
		pending: {
			viewBox: '0 0 24 24',
			paths: ['M12 2 A10 10 0 1 1 12 22 A10 10 0 1 1 12 2', 'M8 12 L12 16 L16 12', 'M12 8 L12 16']
		}
	};

	$: selectedIcon = icons[icon];
</script>

<div class="stat-card">
	<div class="stat-icon {icon}">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox={selectedIcon.viewBox}
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			{#each selectedIcon.paths as path}
				{#if path.includes('M')}
					<path d={path} />
				{:else if path.includes('L')}
					<polyline points={path.replace(/[ML]/g, '')} />
				{:else}
					<line
						x1={path.split(' ')[0]}
						y1={path.split(' ')[1]}
						x2={path.split(' ')[2]}
						y2={path.split(' ')[3]}
					/>
				{/if}
			{/each}
		</svg>
	</div>
	<div class="stat-content">
		<p class="stat-label">{label}</p>
		{#if tooltip}
			<div class="stat-value-wrapper" title={tooltip}>
				<p class="stat-value" class:budget-value={isBudget}>{value}</p>
			</div>
		{:else}
			<p class="stat-value" class:budget-value={isBudget}>{value}</p>
		{/if}
	</div>
</div>

<style lang="scss">
	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		transition: all 0.3s ease;
	}

	.stat-card:hover {
		background: rgba(255, 255, 255, 0.08);
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 12px;
		flex-shrink: 0;
	}

	.stat-icon.projects {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.stat-icon.budget,
	.stat-icon.average {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}

	.stat-icon.completed {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	}

	.stat-icon.progress {
		background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
	}

	.stat-icon.active {
		background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
	}

	.stat-icon.success-rate {
		background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
	}

	.stat-icon.pending {
		background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
	}

	.stat-content {
		flex: 1;
		min-width: 0;
	}

	.stat-value-wrapper {
		cursor: help;
	}

	.stat-value-wrapper:hover .stat-value {
		color: #a78bfa;
	}

	.stat-label {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.7);
		margin: 0 0 0.5rem 0;
		font-weight: 500;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: #ffffff;
		margin: 0;
		transition: color 0.2s ease;
	}

	.stat-value.budget-value {
		font-size: 1.5rem;
	}

	@media (max-width: 768px) {
		.stat-card {
			padding: 1rem;
		}

		.stat-icon {
			width: 40px;
			height: 40px;
		}

		.stat-value {
			font-size: 1.5rem;
		}

		.stat-value.budget-value {
			font-size: 1.25rem;
		}
	}
</style>
