<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { mcpLogger, LogLevel } from '$lib/mcp-core/shared/mcpLogger';

	let logs: string[] = [];
	let autoScroll = true;
	let filterLevel: string = '';
	let searchQuery: string = '';
	let intervalId: ReturnType<typeof setInterval>;
	let logContainer: HTMLElement;

	onMount(() => {
		intervalId = setInterval(refreshLogs, 1000);
		refreshLogs();
	});

	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
	});

	function refreshLogs() {
		logs = mcpLogger.getLogs();

		if (filterLevel || searchQuery) {
			logs = logs.filter((log) => {
				let match = true;

				if (filterLevel && filterLevel !== '') {
					if (!log.includes(`[${filterLevel}]`)) {
						match = false;
					}
				}

				if (searchQuery && searchQuery !== '') {
					if (!log.toLowerCase().includes(searchQuery.toLowerCase())) {
						match = false;
					}
				}

				return match;
			});
		}

		if (autoScroll && logContainer) {
			setTimeout(() => {
				logContainer.scrollTop = logContainer.scrollHeight;
			}, 0);
		}
	}

	function clearLogs() {
		if (confirm('¿Estás seguro de que deseas borrar todos los registros?')) {
			mcpLogger.clearLogs();
			refreshLogs();
		}
	}
</script>

<svelte:head>
	<title>Monitor de Registros MCP</title>
</svelte:head>

<div class="mcp-logs-page">
	<div class="page-header">
		<div class="header-content">
			<div class="title-section">
				<svg
					class="title-icon"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
					/>
				</svg>
				<div>
					<h1>Registro de Actividad del Sistema</h1>
					<p class="subtitle">Visualiza el historial de operaciones y eventos</p>
				</div>
			</div>

			<div class="header-actions">
				<button class="btn-refresh" on:click={refreshLogs} title="Actualizar registros">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
						/>
					</svg>
					Actualizar
				</button>
				<button class="btn-clear" on:click={clearLogs}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
						/>
					</svg>
					Limpiar Todo
				</button>
			</div>
		</div>
	</div>

	<div class="filters-bar">
		<div class="search-box">
			<svg
				class="search-icon"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
				/>
			</svg>
			<input
				type="text"
				placeholder="Buscar en los registros..."
				bind:value={searchQuery}
				on:input={refreshLogs}
			/>
			{#if searchQuery}
				<button
					class="clear-search"
					on:click={() => {
						searchQuery = '';
						refreshLogs();
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
		</div>

		<div class="filter-group">
			<label for="filter-level">Tipo de mensaje:</label>
			<select id="filter-level" bind:value={filterLevel} on:change={refreshLogs}>
				<option value="">Mostrar todos</option>
				<option value="INFO">✓ Información</option>
				<option value="WARN">⚠ Advertencias</option>
				<option value="ERROR">✕ Errores</option>
			</select>
		</div>

		<label class="auto-scroll-checkbox">
			<input type="checkbox" bind:checked={autoScroll} />
			<span>Desplazamiento automático</span>
		</label>
	</div>

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
				<p>No hay registros disponibles</p>
				<span>Los registros aparecerán aquí cuando se ejecuten operaciones MCP</span>
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

	<div class="status-bar">
		<div class="status-info">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
				/>
			</svg>
			<span>{logs.length} {logs.length === 1 ? 'registro' : 'registros'} mostrados</span>
		</div>
	</div>
</div>

<style lang="scss">
	.mcp-logs-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--color--background);
		color: var(--color--text);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
	}

	.page-header {
		background: var(--color--card-background);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.15);
		padding: 1.5rem 2rem;
		flex-shrink: 0;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.title-section {
		display: flex;
		align-items: center;
		gap: 1rem;

		.title-icon {
			width: 2.5rem;
			height: 2.5rem;
			color: #10b981;
			flex-shrink: 0;
		}

		h1 {
			margin: 0;
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--color--text);
			line-height: 1.2;
		}

		.subtitle {
			margin: 0.25rem 0 0 0;
			font-size: 0.875rem;
			color: var(--color--text-shade);
			font-weight: 400;
		}
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.btn-refresh,
	.btn-clear {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;

		svg {
			width: 1.125rem;
			height: 1.125rem;
		}
	}

	.btn-refresh {
		background: #10b981;
		color: white;

		&:hover {
			background: #059669;
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
		}

		&:active {
			transform: translateY(0);
		}
	}

	.btn-clear {
		background: rgba(var(--color--text-rgb), 0.05);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.2);

		&:hover {
			background: rgba(239, 68, 68, 0.1);
			border-color: #ef4444;
			transform: translateY(-1px);
		}

		&:active {
			transform: translateY(0);
		}
	}

	.filters-bar {
		background: var(--color--card-background);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.15);
		padding: 1.25rem 2rem;
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		align-items: center;
		flex-shrink: 0;
	}

	.search-box {
		flex: 1;
		min-width: 250px;
		position: relative;

		.search-icon {
			position: absolute;
			left: 1rem;
			top: 50%;
			transform: translateY(-50%);
			width: 1.125rem;
			height: 1.125rem;
			color: var(--color--text-shade);
			pointer-events: none;
		}

		input {
			width: 100%;
			padding: 0.75rem 2.75rem 0.75rem 3rem;
			background: rgba(var(--color--text-rgb), 0.03);
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			border-radius: 8px;
			color: var(--color--text);
			font-size: 0.9375rem;
			transition: all 0.2s;

			&:focus {
				outline: none;
				border-color: #10b981;
				box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
				background: var(--color--card-background);
			}

			&::placeholder {
				color: var(--color--text-shade);
			}
		}

		.clear-search {
			position: absolute;
			right: 0.5rem;
			top: 50%;
			transform: translateY(-50%);
			background: transparent;
			border: none;
			color: var(--color--text-shade);
			cursor: pointer;
			padding: 0.375rem;
			display: flex;
			align-items: center;
			border-radius: 4px;
			transition: all 0.15s;

			svg {
				width: 1rem;
				height: 1rem;
			}

			&:hover {
				background: rgba(var(--color--text-rgb), 0.1);
				color: var(--color--text);
			}
		}
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;

		label {
			font-size: 0.875rem;
			font-weight: 500;
			color: var(--color--text);
			white-space: nowrap;
		}

		select {
			padding: 0.625rem 2.5rem 0.625rem 0.875rem;
			background: rgba(var(--color--text-rgb), 0.03);
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			border-radius: 8px;
			color: var(--color--text);
			font-size: 0.875rem;
			cursor: pointer;
			transition: all 0.2s;
			min-width: 160px;

			&:focus {
				outline: none;
				border-color: #10b981;
				box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
			}

			&:hover {
				border-color: rgba(var(--color--text-rgb), 0.25);
			}
		}
	}

	.auto-scroll-checkbox {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 0.875rem;
		color: var(--color--text);
		cursor: pointer;
		user-select: none;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		transition: background 0.15s;

		&:hover {
			background: rgba(var(--color--text-rgb), 0.03);
		}

		input[type='checkbox'] {
			appearance: none;
			-webkit-appearance: none;
			-moz-appearance: none;
			width: 1.125rem;
			height: 1.125rem;
			border: 2px solid rgba(var(--color--text-rgb), 0.3);
			border-radius: 4px;
			background: var(--color--card-background);
			cursor: pointer;
			position: relative;
			transition: all 0.2s ease;
			flex-shrink: 0;

			&:hover {
				border-color: #10b981;
			}

			&:checked {
				background: #10b981;
				border-color: #10b981;

				&::after {
					content: '';
					position: absolute;
					left: 50%;
					top: 50%;
					transform: translate(-50%, -50%) rotate(45deg);
					width: 5px;
					height: 9px;
					border: solid white;
					border-width: 0 2.5px 2.5px 0;
				}
			}
		}
	}

	.logs-wrapper {
		flex: 1;
		overflow-y: auto;
		background: var(--color--background);
		position: relative;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 1.25rem;
		padding: 3rem;

		svg {
			width: 4rem;
			height: 4rem;
			color: var(--color--text-shade);
			opacity: 0.5;
		}

		p {
			margin: 0;
			font-size: 1.125rem;
			font-weight: 600;
			color: var(--color--text);
		}

		span {
			font-size: 0.9375rem;
			color: var(--color--text-shade);
			text-align: center;
			max-width: 400px;
		}
	}

	.logs-content {
		padding: 1.5rem 2rem;
	}

	.log-line {
		padding: 0.75rem 1rem;
		margin: 0.5rem 0;
		border-radius: 8px;
		white-space: pre-wrap;
		word-break: break-word;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		border-left: 3px solid transparent;
		transition: all 0.15s;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace;
		font-size: 0.8125rem;
		line-height: 1.6;
		color: var(--color--text);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

		&:hover {
			border-color: rgba(var(--color--text-rgb), 0.2);
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
		}

		&.debug {
			border-left-color: #3b82f6;
			background: rgba(59, 130, 246, 0.05);

			&:hover {
				background: rgba(59, 130, 246, 0.08);
			}
		}

		&.info {
			border-left-color: #10b981;
			background: rgba(16, 185, 129, 0.05);

			&:hover {
				background: rgba(16, 185, 129, 0.08);
			}
		}

		&.warn {
			border-left-color: #f59e0b;
			background: rgba(245, 158, 11, 0.05);

			&:hover {
				background: rgba(245, 158, 11, 0.08);
			}
		}

		&.error {
			border-left-color: #dc2626;
			background: rgba(239, 68, 68, 0.08);
			border-color: rgba(239, 68, 68, 0.2);

			&:hover {
				background: rgba(239, 68, 68, 0.12);
			}
		}
	}

	.status-bar {
		background: var(--color--card-background);
		border-top: 1px solid rgba(var(--color--text-rgb), 0.15);
		padding: 1rem 2rem;
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.status-info {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 0.875rem;
		color: var(--color--text);

		svg {
			width: 1.125rem;
			height: 1.125rem;
			color: #10b981;
		}

		span {
			font-weight: 500;
		}
	}

	.logs-wrapper::-webkit-scrollbar {
		width: 8px;
	}

	.logs-wrapper::-webkit-scrollbar-track {
		background: var(--color--background);
	}

	.logs-wrapper::-webkit-scrollbar-thumb {
		background: rgba(var(--color--text-rgb), 0.2);
		border-radius: 4px;

		&:hover {
			background: rgba(var(--color--text-rgb), 0.3);
		}
	}

	@media (max-width: 768px) {
		.page-header {
			padding: 1.25rem 1rem;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
		}

		.title-section {
			.title-icon {
				width: 2rem;
				height: 2rem;
			}

			h1 {
				font-size: 1.25rem;
			}
		}

		.header-actions {
			width: 100%;

			button {
				flex: 1;
				justify-content: center;
			}
		}

		.filters-bar {
			padding: 1rem;
			flex-direction: column;
			align-items: stretch;
		}

		.search-box {
			min-width: 100%;
		}

		.filter-group {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;

			select {
				width: 100%;
			}
		}

		.logs-content {
			padding: 1rem;
		}

		.log-line {
			font-size: 0.75rem;
			padding: 0.625rem 0.75rem;
		}

		.status-bar {
			padding: 0.875rem 1rem;
		}
	}
</style>
