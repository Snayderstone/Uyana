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
		| 'pending'
		| 'primary'
		| 'success'
		| 'info'
		| 'warning' = 'primary';
	export let percentage: string | undefined = undefined;
	export let tooltip: string | undefined = undefined;
	export let variant: 'default' | 'compact' = 'default';
</script>

<div class="stat-card {variant}" class:has-tooltip={tooltip}>
	<div class="stat-icon {icon}">
		<slot name="icon">
			{#if icon === 'projects'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
					<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
				</svg>
			{:else if icon === 'budget'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<line x1="12" y1="1" x2="12" y2="23" />
					<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
				</svg>
			{:else if icon === 'completed'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
					<polyline points="22 4 12 14.01 9 11.01" />
				</svg>
			{:else if icon === 'progress'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
				</svg>
			{:else if icon === 'average'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
				</svg>
			{:else if icon === 'active'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10" />
					<polyline points="12 6 12 12 16 14" />
				</svg>
			{:else if icon === 'success-rate'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M22 12h-4l-3 9L9 3l-3 9H2" />
				</svg>
			{:else if icon === 'pending'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10" />
					<polyline points="8 12 12 16 16 12" />
					<line x1="12" y1="8" x2="12" y2="16" />
				</svg>
			{:else if icon === 'primary'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
					<circle cx="9" cy="7" r="4" />
					<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
					<path d="M16 3.13a4 4 0 0 1 0 7.75" />
				</svg>
			{:else if icon === 'success'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<polyline points="20 6 9 17 4 12" />
				</svg>
			{:else if icon === 'info'}
				<text x="50%" y="60%" text-anchor="middle" font-size="32">👨</text>
			{:else if icon === 'warning'}
				<text x="50%" y="60%" text-anchor="middle" font-size="32">👩</text>
			{/if}
		</slot>
	</div>

	<div class="stat-content">
		<p class="stat-label">{label}</p>
		<div class="stat-value-wrapper" title={tooltip}>
			<p class="stat-value" class:has-percentage={percentage}>{value}</p>
		</div>
		{#if percentage}
			<p class="stat-percentage">{percentage}</p>
		{/if}
	</div>
</div>

<style lang="scss">
	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: var(--color--card-background, white);
		border: 1px solid rgba(var(--color--text-rgb, 0, 0, 0), 0.08);
		border-radius: 12px;
		transition: all 0.3s var(--ease-out-3, ease);

		&:hover {
			border-color: var(--color--primary, #3b82f6);
			box-shadow: 0 4px 12px rgba(110, 41, 231, 0.1);
			transform: translateY(-2px);
		}

		&.compact {
			padding: 1rem;
			gap: 0.75rem;
		}

		&.primary {
			.stat-icon {
				background: linear-gradient(135deg, rgba(110, 41, 231, 0.1), rgba(110, 41, 231, 0.05));
				color: #6e29e7;
			}
		}

		&.success {
			.stat-icon {
				background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
				color: #10b981;
			}
		}

		&.info {
			.stat-icon {
				background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
				color: #3b82f6;
			}
		}

		&.warning {
			.stat-icon {
				background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.05));
				color: #ec4899;
			}
		}
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		border-radius: 12px;
		flex-shrink: 0;

		&.projects {
			background: #dbeafe;
			color: #3b82f6;
		}

		&.budget {
			background: #dcfce7;
			color: #16a34a;
		}

		&.completed {
			background: #f0fdf4;
			color: #059669;
		}

		&.progress {
			background: #fef3c7;
			color: #f59e0b;
		}

		&.average {
			background: #e0e7ff;
			color: #6366f1;
		}

		&.active {
			background: #fce7f3;
			color: #ec4899;
		}

		&.success-rate {
			background: #d1fae5;
			color: #10b981;
		}

		&.pending {
			background: #fef9c3;
			color: #eab308;
		}

		&.primary {
			background: linear-gradient(135deg, rgba(110, 41, 231, 0.1), rgba(110, 41, 231, 0.05));
			color: #6e29e7;
		}

		&.success {
			background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
			color: #10b981;
		}

		&.info {
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
			color: #3b82f6;
		}

		&.warning {
			background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.05));
			color: #ec4899;
		}
	}

	.stat-content {
		flex: 1;
		min-width: 0;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--color--text-shade, #6b7280);
		margin: 0 0 0.25rem 0;
		font-family: var(--font--default);
		font-weight: 500;
	}

	.stat-value-wrapper {
		cursor: default;

		&:hover .stat-value {
			color: var(--color--primary);
		}
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color--text, #1a1a1a);
		margin: 0;
		font-family: var(--font--default);
		word-break: break-word;
		line-height: 1.2;
		transition: color 0.2s ease;

		&.has-percentage {
			margin-bottom: 0.25rem;
		}
	}

	.stat-percentage {
		font-size: 0.875rem;
		color: var(--color--primary, #6e29e7);
		font-weight: 600;
		margin: 0.25rem 0 0 0;
		font-family: var(--font--default);
	}
</style>
