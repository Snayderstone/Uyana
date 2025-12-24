<script lang="ts">
	export let label: string;
	export let value: string | number;
	export let icon:
		| 'participants'
		| 'male'
		| 'female'
		| 'acredited'
		| 'faculty'
		| 'career'
		| 'role'
		| 'projects'
		| 'director'
		| 'researcher';
	export let tooltip: string = '';

	// Icon SVG paths
	const icons = {
		participants: {
			viewBox: '0 0 24 24',
			paths: [
				'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
				'M9 3 A4 4 0 1 1 9 11 A4 4 0 1 1 9 3',
				'M23 21v-2a4 4 0 0 0-3-3.87',
				'M16 3.13a4 4 0 0 1 0 7.75'
			]
		},
		male: {
			viewBox: '0 0 24 24',
			paths: ['M12 2 A5 5 0 1 1 12 12 A5 5 0 1 1 12 2', 'M12 12 L12 22', 'M8 18 L16 18']
		},
		female: {
			viewBox: '0 0 24 24',
			paths: ['M12 2 A5 5 0 1 1 12 12 A5 5 0 1 1 12 2', 'M12 12 L12 22', 'M8 18 L16 18']
		},
		acredited: {
			viewBox: '0 0 24 24',
			paths: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4 L12 14.01 L9 11.01']
		},
		faculty: {
			viewBox: '0 0 24 24',
			paths: [
				'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z',
				'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'
			]
		},
		career: {
			viewBox: '0 0 24 24',
			paths: ['M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z']
		},
		role: {
			viewBox: '0 0 24 24',
			paths: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 3 A4 4 0 1 1 12 11 A4 4 0 1 1 12 3']
		},
		projects: {
			viewBox: '0 0 24 24',
			paths: [
				'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z',
				'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'
			]
		},
		director: {
			viewBox: '0 0 24 24',
			paths: [
				'M12 2 A4 4 0 1 1 12 10 A4 4 0 1 1 12 2',
				'M16 21v-2a4 4 0 0 0-4-4h-0.5',
				'M16 11 L22 11',
				'M19 8 L22 11 L19 14'
			]
		},
		researcher: {
			viewBox: '0 0 24 24',
			paths: [
				'M12 2 A4 4 0 1 1 12 10 A4 4 0 1 1 12 2',
				'M16 21v-2a4 4 0 0 0-4-4h-0.5',
				'M17 12 L17 18',
				'M14 15 L20 15'
			]
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
				{#if path.includes('M') && path.includes('A')}
					<path d={path} />
				{:else if path.includes('M')}
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
				<p class="stat-value">{value}</p>
			</div>
		{:else}
			<p class="stat-value">{value}</p>
		{/if}
	</div>
</div>

<style lang="scss">
	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 12px;
		transition: all 0.3s ease;
	}

	.stat-card:hover {
		background: rgba(255, 255, 255, 0.05);
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 10px;
		flex-shrink: 0;
	}

	.stat-icon.participants {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	}

	.stat-icon.male {
		background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
	}

	.stat-icon.female {
		background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
	}

	.stat-icon.acredited {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	}

	.stat-icon.faculty {
		background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
	}

	.stat-icon.career {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
	}

	.stat-icon.role {
		background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
	}

	.stat-icon.projects {
		background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
	}

	.stat-icon.director {
		background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
	}

	.stat-icon.researcher {
		background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
	}

	.stat-icon svg {
		color: #ffffff;
	}

	.stat-content {
		flex: 1;
		min-width: 0;
	}

	.stat-label {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.7);
		margin: 0 0 0.25rem 0;
		font-weight: 500;
	}

	.stat-value-wrapper {
		cursor: help;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #ffffff;
		margin: 0;
		line-height: 1.2;
	}

	@media (max-width: 768px) {
		.stat-card {
			padding: 1rem;
		}

		.stat-icon {
			width: 40px;
			height: 40px;
		}

		.stat-icon svg {
			width: 20px;
			height: 20px;
		}

		.stat-value {
			font-size: 1.25rem;
		}
	}
</style>
