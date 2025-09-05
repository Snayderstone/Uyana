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
	<header>
		<h1>MCP Logs Monitor</h1>

		<div class="filter-bar">
			<div class="filter-group">
				<label for="filter-level">Nivel:</label>
				<select id="filter-level" bind:value={filterLevel} on:change={refreshLogs}>
					<option value="">Todos</option>
					<option value="DEBUG">DEBUG</option>
					<option value="INFO">INFO</option>
					<option value="WARN">WARN</option>
					<option value="ERROR">ERROR</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="filter-source">Fuente:</label>
				<input
					type="text"
					id="filter-source"
					placeholder="Ej: MCP_CLIENT"
					bind:value={filterSource}
					on:input={refreshLogs}
				/>
			</div>

			<div class="filter-group">
				<label for="filter-operation">Operación:</label>
				<input
					type="text"
					id="filter-operation"
					placeholder="Ej: REQUEST_START"
					bind:value={filterOperation}
					on:input={refreshLogs}
				/>
			</div>

			<div class="filter-group">
				<label for="filter-message">Mensaje:</label>
				<input
					type="text"
					id="filter-message"
					placeholder="Buscar texto..."
					bind:value={filterMessage}
					on:input={refreshLogs}
				/>
			</div>
		</div>

		<div class="actions">
			<label class="auto-scroll" for="auto-scroll-checkbox">
				<input id="auto-scroll-checkbox" type="checkbox" bind:checked={autoScroll} />
				Auto-scroll
			</label>

			<div class="log-level-selector">
				<label for="log-level">Nivel de logging:</label>
				<select
					id="log-level"
					on:change={(e) => changeLogLevel(e.currentTarget ? e.currentTarget.value : '1')}
				>
					<option value="0">DEBUG</option>
					<option value="1" selected>INFO</option>
					<option value="2">WARN</option>
					<option value="3">ERROR</option>
				</select>
			</div>

			<button class="clear-logs" on:click={clearLogs}>Limpiar logs</button>
			<button class="refresh-logs" on:click={refreshLogs}>Refrescar</button>
		</div>
	</header>

	<main bind:this={logContainer}>
		{#if logs.length === 0}
			<div class="no-logs">No hay logs disponibles</div>
		{:else}
			<pre class="logs-container">
				{#each logs as log}
					<div
						class="log-entry"
						class:debug-log={log.includes('[DEBUG]')}
						class:info-log={log.includes('[INFO]')}
						class:warn-log={log.includes('[WARN]')}
						class:error-log={log.includes('[ERROR]')}>
						{log}
					</div>
				{/each}
			</pre>
		{/if}
	</main>

	<footer>
		<div class="stats">
			Mostrando {logs.length} logs
		</div>
	</footer>
</div>

<style>
	.mcp-logs-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		padding: 1rem;
		background-color: #f5f5f5;
		color: #333;
		font-family: 'Courier New', monospace;
	}

	header {
		background-color: #333;
		color: white;
		padding: 1rem;
		border-radius: 8px 8px 0 0;
	}

	h1 {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
	}

	.filter-bar {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	input,
	select {
		padding: 0.5rem;
		border: 1px solid #555;
		background-color: #444;
		color: white;
		border-radius: 4px;
	}

	.actions {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}

	button {
		padding: 0.5rem 1rem;
		background-color: #555;
		border: none;
		color: white;
		cursor: pointer;
		border-radius: 4px;
	}

	button:hover {
		background-color: #666;
	}

	.clear-logs {
		background-color: #b71c1c;
	}

	.clear-logs:hover {
		background-color: #d32f2f;
	}

	.refresh-logs {
		background-color: #1976d2;
	}

	.refresh-logs:hover {
		background-color: #2196f3;
	}

	main {
		flex: 1;
		overflow-y: auto;
		background-color: #1e1e1e;
		color: #d4d4d4;
		border-radius: 0 0 8px 8px;
		padding: 1rem;
	}

	.logs-container {
		margin: 0;
		white-space: pre-wrap;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.log-entry {
		padding: 0.25rem 0;
		border-bottom: 1px solid #333;
	}

	.debug-log {
		color: #9cdcfe;
	}

	.info-log {
		color: #6a9955;
	}

	.warn-log {
		color: #dcdcaa;
	}

	.error-log {
		color: #f14c4c;
	}

	footer {
		background-color: #333;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0 0 8px 8px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.no-logs {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		color: #777;
		font-style: italic;
	}

	.auto-scroll {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	@media (max-width: 768px) {
		.filter-bar {
			flex-direction: column;
			gap: 0.5rem;
		}

		.filter-group {
			width: 100%;
		}

		.actions {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
