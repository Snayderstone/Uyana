<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { mcpLogger, LogLevel } from '$lib/mcp-core/shared/mcpLogger';

	let logs: string[] = [];
	let autoScroll = true;
	let filterLevel: string = 'INFO';
	let filterSource: string = '';
	let filterOperation: string = '';
	let filterMessage: string = '';
	let intervalId: ReturnType<typeof setInterval>;
	let logContainer: HTMLElement;

	// Al montar el componente
	onMount(() => {
		// Actualizar logs cada segundo
		intervalId = setInterval(refreshLogs, 1000);

		// Cargar logs iniciales
		refreshLogs();
	});

	// Al destruir el componente
	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
	});

	// Función para refrescar logs
	function refreshLogs() {
		logs = mcpLogger.getLogs();

		// Aplicar filtros
		if (filterLevel || filterSource || filterOperation || filterMessage) {
			logs = logs.filter((log) => {
				let match = true;

				if (filterLevel && filterLevel !== '' && !log.includes(`[${filterLevel}]`)) {
					match = false;
				}

				if (
					filterSource &&
					filterSource !== '' &&
					!log.toLowerCase().includes(filterSource.toLowerCase())
				) {
					match = false;
				}

				if (
					filterOperation &&
					filterOperation !== '' &&
					!log.toLowerCase().includes(filterOperation.toLowerCase())
				) {
					match = false;
				}

				if (
					filterMessage &&
					filterMessage !== '' &&
					!log.toLowerCase().includes(filterMessage.toLowerCase())
				) {
					match = false;
				}

				return match;
			});
		}

		// Auto-scroll si está activado
		if (autoScroll && logContainer) {
			setTimeout(() => {
				logContainer.scrollTop = logContainer.scrollHeight;
			}, 0);
		}
	}

	// Función para limpiar logs
	function clearLogs() {
		mcpLogger.clearLogs();
		refreshLogs();
	}

	// Función para cambiar nivel de log
	function changeLogLevel(level: string) {
		mcpLogger.setLogLevel(Number(level));
		refreshLogs();
	}
</script>

<svelte:head>
	<title>MCP Logs Monitor</title>
</svelte:head>

<div class="mcp-logs-page">
	<!-- Top Bar -->
	<div class="top-bar">
		<div class="breadcrumb">
			<span class="muted">Sistema</span>
			<span class="separator">/</span>
			<span>MCP Logs</span>
		</div>
		<div class="top-actions">
			<label class="auto-scroll-toggle">
				<input type="checkbox" bind:checked={autoScroll} />
				<span class="toggle-label">Auto-scroll</span>
			</label>
			<button class="btn-icon" on:click={refreshLogs} title="Refresh">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
					/>
				</svg>
			</button>
			<button class="btn-clear" on:click={clearLogs}>Clear logs</button>
		</div>
	</div>

	<!-- Filters Bar -->
	<div class="filters-bar">
		<div class="filter-item">
			<label for="filter-level">Level</label>
			<select id="filter-level" bind:value={filterLevel} on:change={refreshLogs}>
				<option value="">All</option>
				<option value="DEBUG">DEBUG</option>
				<option value="INFO">INFO</option>
				<option value="WARN">WARN</option>
				<option value="ERROR">ERROR</option>
			</select>
		</div>

		<div class="filter-item">
			<label for="filter-source">Source</label>
			<input
				id="filter-source"
				type="text"
				placeholder="Filter by source..."
				bind:value={filterSource}
				on:input={refreshLogs}
			/>
		</div>

		<div class="filter-item">
			<label for="filter-operation">Operation</label>
			<input
				id="filter-operation"
				type="text"
				placeholder="Filter by operation..."
				bind:value={filterOperation}
				on:input={refreshLogs}
			/>
		</div>

		<div class="filter-item">
			<label for="filter-message">Message</label>
			<input
				id="filter-message"
				type="text"
				placeholder="Search message..."
				bind:value={filterMessage}
				on:input={refreshLogs}
			/>
		</div>

		<div class="filter-item">
			<label for="log-level-select">Log Level</label>
			<select
				id="log-level-select"
				on:change={(e) => changeLogLevel(e.currentTarget?.value || '1')}
			>
				<option value="0">DEBUG</option>
				<option value="1" selected>INFO</option>
				<option value="2">WARN</option>
				<option value="3">ERROR</option>
			</select>
		</div>
	</div>

	<!-- Logs Container -->
	<div class="logs-wrapper" bind:this={logContainer}>
		{#if logs.length === 0}
			<div class="empty-state">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
					/>
				</svg>
				<p>No logs available</p>
				<span>Logs will appear here when MCP operations are executed</span>
			</div>
		{:else}
			<div class="logs-content">
				{#each logs as log}
					<div
						class="log-line"
						class:debug={log.includes('[DEBUG]')}
						class:info={log.includes('[INFO]')}
						class:warn={log.includes('[WARN]')}
						class:error={log.includes('[ERROR]')}
					>
						{log}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Status Bar -->
	<div class="status-bar">
		<div class="status-item">
			<span class="status-label">Total:</span>
			<span class="status-value">{logs.length} logs</span>
		</div>
		<div class="status-item">
			<span class="status-label">Filtered:</span>
			<span class="status-value">{logs.length} shown</span>
		</div>
	</div>
</div>

<style lang="scss">
	.mcp-logs-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--color--background, #ffffff);
		color: var(--color--text, #1f2937);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
	}

	.top-bar {
		background: var(--color--card-background, #f9fafb);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color--text, #1f2937);

		.muted {
			color: #6b7280;
		}

		.separator {
			color: #4b5563;
		}
	}

	.top-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.auto-scroll-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: #9ca3af;
		cursor: pointer;
		user-select: none;

		input[type='checkbox'] {
			width: 1rem;
			height: 1rem;
			cursor: pointer;
			accent-color: #10b981;
		}

		.toggle-label {
			font-family: 'SF Mono', Monaco, monospace;
		}
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

		svg {
			width: 1rem;
			height: 1rem;
		}

		&:hover {
			border-color: #10b981;
			color: #10b981;
		}
	}

	.btn-clear {
		background: transparent;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		color: #ef4444;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.8125rem;
		font-family: 'SF Mono', Monaco, monospace;
		transition: all 0.15s;

		&:hover {
			border-color: #ef4444;
			background: rgba(239, 68, 68, 0.1);
		}
	}

	.filters-bar {
		background: var(--color--card-background, #f9fafb);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		padding: 1rem 2rem;
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		align-items: flex-end;
		flex-shrink: 0;
	}

	.filter-item {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		min-width: 140px;

		label {
			font-size: 0.6875rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: #6b7280;
		}

		input,
		select {
			background: var(--color--input-background, rgba(255, 255, 255, 0.05));
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			color: var(--color--text, #1f2937);
			padding: 0.5rem 0.75rem;
			border-radius: 6px;
			font-size: 0.8125rem;
			font-family: 'SF Mono', Monaco, monospace;
			transition: all 0.15s;

			&:focus {
				outline: none;
				border-color: #10b981;
			}

			&::placeholder {
				color: var(--color--text-shade, #9ca3af);
			}
		}

		select {
			cursor: pointer;
		}
	}

	.logs-wrapper {
		flex: 1;
		overflow-y: auto;
		background: var(--color--background, #ffffff);
		position: relative;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 1rem;
		color: #6b7280;

		svg {
			width: 3rem;
			height: 3rem;
			color: #4b5563;
		}

		p {
			margin: 0;
			font-size: 1rem;
			font-weight: 600;
			color: #9ca3af;
		}

		span {
			font-size: 0.875rem;
			color: #6b7280;
		}
	}

	.logs-content {
		font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace;
		font-size: 0.8125rem;
		line-height: 1.6;
		padding: 1rem;
	}

	.log-line {
		padding: 0.375rem 0.75rem;
		margin: 0.125rem 0;
		border-radius: 4px;
		white-space: pre-wrap;
		word-break: break-all;
		background: rgba(255, 255, 255, 0.02);
		border-left: 2px solid transparent;
		transition: all 0.1s;

		&:hover {
			background: rgba(255, 255, 255, 0.04);
		}

		&.debug {
			color: #60a5fa;
			border-left-color: #3b82f6;
		}

		&.info {
			color: #10b981;
			border-left-color: #10b981;
		}

		&.warn {
			color: #fbbf24;
			border-left-color: #f59e0b;
		}

		&.error {
			color: #ef4444;
			border-left-color: #dc2626;
			background: rgba(239, 68, 68, 0.05);
		}
	}

	.status-bar {
		background: var(--color--card-background, #f9fafb);
		border-top: 1px solid rgba(var(--color--text-rgb), 0.08);
		padding: 0.75rem 2rem;
		display: flex;
		gap: 2rem;
		align-items: center;
		flex-shrink: 0;
	}

	.status-item {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.8125rem;
		font-family: 'SF Mono', Monaco, monospace;

		.status-label {
			color: #6b7280;
		}

		.status-value {
			color: var(--color--text, #1f2937);
			font-weight: 600;
		}
	}

	/* Custom Scrollbar */
	.logs-wrapper::-webkit-scrollbar {
		width: 8px;
	}

	.logs-wrapper::-webkit-scrollbar-track {
		background: var(--color--background, #ffffff);
	}

	.logs-wrapper::-webkit-scrollbar-thumb {
		background: rgba(var(--color--text-rgb), 0.2);
		border-radius: 4px;

		&:hover {
			background: rgba(var(--color--text-rgb), 0.3);
		}
	}

	@media (max-width: 768px) {
		.top-bar,
		.filters-bar,
		.status-bar {
			padding: 1rem;
		}

		.filters-bar {
			flex-direction: column;
			align-items: stretch;
		}

		.filter-item {
			min-width: 100%;
		}

		.status-bar {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style>
