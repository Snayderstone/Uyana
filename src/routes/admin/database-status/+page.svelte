<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { invalidate } from '$app/navigation';

	export let data: any;

	let autoRefresh = true;
	let refreshInterval: ReturnType<typeof setInterval> | null = null;
	let countdown = 10;

	$: statusColor = data.connected ? 'success' : 'error';
	$: statusText = data.connected ? 'Conectado' : 'Desconectado';
	$: statusIcon = data.connected ? '✅' : '❌';

	function formatDate(dateString: string | null) {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return date.toLocaleString('es-EC', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	function formatLatency(ms: number) {
		if (ms < 100) return { value: ms, label: 'Excelente', color: 'success' };
		if (ms < 300) return { value: ms, label: 'Bueno', color: 'warning' };
		return { value: ms, label: 'Lento', color: 'error' };
	}

	async function refreshData() {
		countdown = 10;
		await invalidate('app:database-status');
	}

	function toggleAutoRefresh() {
		autoRefresh = !autoRefresh;
		if (autoRefresh) {
			startAutoRefresh();
		} else {
			stopAutoRefresh();
		}
	}

	function startAutoRefresh() {
		countdown = 10;
		refreshInterval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				refreshData();
			}
		}, 1000);
	}

	function stopAutoRefresh() {
		if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}
	}

	onMount(() => {
		if (autoRefresh) {
			startAutoRefresh();
		}
	});

	onDestroy(() => {
		stopAutoRefresh();
	});

	const icons = {
		database: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
		</svg>`,
		refresh: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
		</svg>`,
		clock: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>`,
		lightning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
		</svg>`,
		table: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
		</svg>`
	};
</script>

<svelte:head>
	<title>Estado de Base de Datos - Admin UCE</title>
</svelte:head>

<div class="database-status-page">
	<!-- Top Bar -->
	<div class="top-bar">
		<div class="breadcrumb">
			<span class="muted">Sistema</span>
			<span class="separator">/</span>
			<span>Database Status</span>
		</div>
		<div class="top-actions">
			<button class="btn-icon" on:click={refreshData} disabled={!data.connected} title="Refresh">
				{@html icons.refresh}
			</button>
			<button class="btn-auto" class:active={autoRefresh} on:click={toggleAutoRefresh}>
				<span class="indicator" class:active={autoRefresh} />
				{autoRefresh ? `Auto-refresh ${countdown}s` : 'Auto-refresh off'}
			</button>
		</div>
	</div>

	<!-- Connection Status -->
	<div class="status-banner" class:connected={data.connected} class:error={!data.connected}>
		<div class="status-dot" />
		<div class="status-content">
			<div class="status-text">
				<span class="status-label">Database Status:</span>
				<span class="status-value">{statusText}</span>
			</div>
			<span class="status-time">{formatDate(data.timestamp)}</span>
		</div>
		{#if !data.connected && data.error}
			<div class="error-detail">{data.error}</div>
		{/if}
	</div>

	{#if data.connected && data.metrics}
		{@const latency = formatLatency(data.metrics.performance.pingLatency)}

		<!-- Performance Metrics -->
		<div class="metrics-section">
			<h2 class="section-header">Performance</h2>
			<div class="metrics-row">
				<div class="metric-box">
					<div class="metric-label">Ping Latency</div>
					<div class="metric-value {latency.color}">
						{latency.value}ms
					</div>
					<div class="metric-status">{latency.label}</div>
				</div>
				<div class="metric-box">
					<div class="metric-label">Total Query Time</div>
					<div class="metric-value">
						{data.metrics.performance.totalQueryTime}ms
					</div>
					<div class="metric-status">8 queries</div>
				</div>
				<div class="metric-box">
					<div class="metric-label">Avg Query Time</div>
					<div class="metric-value">
						{data.metrics.performance.avgQueryTime}ms
					</div>
					<div class="metric-status">per query</div>
				</div>
			</div>
		</div>

		<!-- Database Tables -->
		<div class="data-section">
			<h2 class="section-header">Tables</h2>
			<div class="table-list">
				<div class="table-header">
					<div class="col-name">Table Name</div>
					<div class="col-count">Rows</div>
				</div>
				{#each Object.entries(data.metrics.tables) as [tableName, count]}
					<div class="table-row">
						<div class="col-name">
							<span class="table-icon">{@html icons.table}</span>
							<code>{tableName}</code>
						</div>
						<div class="col-count">
							<span class="count-badge">{count.toLocaleString()}</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Last Updates & Config -->
		<div class="info-grid">
			<div class="info-section">
				<h2 class="section-header">Last Updates</h2>
				<div class="info-content">
					<div class="info-row">
						<span class="info-label">Projects</span>
						<code class="info-value">{formatDate(data.metrics.lastUpdates.projects)}</code>
					</div>
					<div class="info-row">
						<span class="info-label">Blog</span>
						<code class="info-value">{formatDate(data.metrics.lastUpdates.blog)}</code>
					</div>
				</div>
			</div>

			<div class="info-section">
				<h2 class="section-header">Configuration</h2>
				<div class="info-content">
					<div class="info-row">
						<span class="info-label">Supabase URL</span>
						<code class="info-value mono">{data.environment.supabaseUrl}</code>
					</div>
					<div class="info-row">
						<span class="info-label">Anon Key</span>
						<span class="info-value status-{data.environment.hasAnonKey ? 'ok' : 'error'}">
							{data.environment.hasAnonKey ? '✓ Configured' : '✗ Missing'}
						</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.database-status-page {
		background: var(--color--background, #ffffff);
		min-height: 100vh;
		color: var(--color--text, #1f2937);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
		padding: 0;
	}

	.top-bar {
		background: var(--color--card-background, #f9fafb);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color--text, #1f2937);

		.muted {
			color: var(--color--text-shade, #6b7280);
		}

		.separator {
			color: var(--color--text-shade, #4b5563);
		}
	}

	.top-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.btn-icon {
		background: transparent;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		color: var(--color--text-shade, #9ca3af);
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s;

		:global(svg) {
			width: 1rem;
			height: 1rem;
		}

		&:hover:not(:disabled) {
			border-color: #10b981;
			color: #10b981;
		}

		&:disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}
	}

	.btn-auto {
		background: transparent;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		color: var(--color--text-shade, #9ca3af);
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.8125rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.15s;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;

		&.active {
			border-color: #10b981;
			color: #10b981;
		}

		&:hover {
			border-color: rgba(var(--color--text-rgb), 0.25);
		}
	}

	.indicator {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgba(var(--color--text-rgb), 0.2);

		&.active {
			background: #10b981;
			animation: pulse 2s infinite;
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.status-banner {
		margin: 2rem;
		padding: 1rem 1.25rem;
		background: var(--color--card-background, #f9fafb);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		display: flex;
		align-items: center;
		gap: 1rem;

		&.connected {
			border-color: #10b981;
			background: var(--color--card-background, #f9fafb);
			box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.2);
		}

		&.error {
			border-color: #ef4444;
			background: var(--color--card-background, #f9fafb);
			box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.2);
		}
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color--text-shade, #6b7280);
		flex-shrink: 0;
	}

	.status-banner.connected .status-dot {
		background: #10b981;
		box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
	}

	.status-banner.error .status-dot {
		background: #ef4444;
	}

	.status-content {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.status-text {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
		font-size: 0.875rem;
	}

	.status-label {
		color: var(--color--text-shade, #6b7280);
	}

	.status-value {
		color: var(--color--text, #1f2937);
		font-weight: 600;
	}

	.status-time {
		color: var(--color--text-shade, #6b7280);
		font-size: 0.8125rem;
		font-family: 'SF Mono', Monaco, monospace;
	}

	.error-detail {
		color: #ef4444;
		font-size: 0.8125rem;
		font-family: 'SF Mono', Monaco, monospace;
	}

	.metrics-section,
	.data-section,
	.info-grid {
		margin: 2rem;
	}

	.section-header {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color--text-shade, #6b7280);
		margin-bottom: 1rem;
	}

	.metrics-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.metric-box {
		background: var(--color--card-background, #f9fafb);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 8px;
		padding: 1.25rem;
		transition: border-color 0.15s;

		&:hover {
			border-color: rgba(var(--color--text-rgb), 0.15);
		}
	}

	.metric-label {
		font-size: 0.8125rem;
		color: var(--color--text-shade, #6b7280);
		margin-bottom: 0.75rem;
		font-family: 'SF Mono', Monaco, monospace;
	}

	.metric-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color--text, #1f2937);
		line-height: 1;
		margin-bottom: 0.5rem;
		font-family: 'SF Mono', Monaco, monospace;

		&.success {
			color: #10b981;
		}

		&.warning {
			color: #fbbf24;
		}

		&.error {
			color: #ef4444;
		}
	}

	.metric-status {
		font-size: 0.75rem;
		color: var(--color--text-shade, #6b7280);
	}

	.table-list {
		background: var(--color--card-background, #f9fafb);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 8px;
		overflow: hidden;
	}

	.table-header,
	.table-row {
		display: grid;
		grid-template-columns: 1fr auto;
		padding: 0.875rem 1.25rem;
		gap: 1rem;
		align-items: center;
	}

	.table-header {
		background: rgba(var(--color--text-rgb), 0.02);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color--text-shade, #6b7280);
	}

	.table-row {
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		transition: background 0.15s;

		&:last-child {
			border-bottom: none;
		}

		&:hover {
			background: rgba(var(--color--text-rgb), 0.02);
		}
	}

	.col-name {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-family: 'SF Mono', Monaco, monospace;
		font-size: 0.875rem;
		color: var(--color--text, #1f2937);
	}

	.table-icon {
		display: flex;
		align-items: center;
		color: var(--color--text-shade, #6b7280);

		:global(svg) {
			width: 1rem;
			height: 1rem;
		}
	}

	code {
		background: transparent;
		color: var(--color--text, #1f2937);
		font-family: 'SF Mono', Monaco, monospace;
		font-size: 0.875rem;
	}

	.col-count {
		display: flex;
		justify-content: flex-end;
	}

	.count-badge {
		background: rgba(var(--color--text-rgb), 0.1);
		color: var(--color--text-shade, #9ca3af);
		padding: 0.25rem 0.75rem;
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 600;
		font-family: 'SF Mono', Monaco, monospace;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.info-section {
		background: var(--color--card-background, #f9fafb);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 8px;
		padding: 1.25rem;
	}

	.info-content {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.info-label {
		font-size: 0.8125rem;
		color: var(--color--text-shade, #6b7280);
		font-family: 'SF Mono', Monaco, monospace;
	}

	.info-value {
		font-size: 0.8125rem;
		color: var(--color--text, #1f2937);
		font-family: 'SF Mono', Monaco, monospace;
		text-align: right;

		&.mono {
			font-size: 0.75rem;
			color: var(--color--text-shade, #9ca3af);
			word-break: break-all;
		}

		&.status-ok {
			color: #10b981;
			font-weight: 600;
		}

		&.status-error {
			color: #ef4444;
			font-weight: 600;
		}
	}

	@media (max-width: 768px) {
		.database-status-page {
			padding: 1rem;
		}

		.metrics-section,
		.data-section,
		.info-grid {
			margin: 1rem;
		}

		.metrics-row {
			grid-template-columns: 1fr;
		}

		.table-list {
			font-size: 0.75rem;
		}

		.info-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
