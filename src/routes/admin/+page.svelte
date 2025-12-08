<script lang="ts">
	// Página principal del panel de administración
</script>

<svelte:head>
	<title>Panel de Administración | Uyana</title>
</svelte:head>

<div class="admin-dashboard">
	<h1>Panel de Administración</h1>

	<div class="dashboard-cards">
		<a href="/admin/mcp-logs" class="card">
			<h2>MCP Logs</h2>
			<p>Monitoreo del sistema Model Context Protocol</p>
		</a>

		<!-- Agregar más tarjetas según se vayan implementando más funcionalidades -->
	</div>
</div>

<style>
	.admin-dashboard {
		padding: 2rem;
	}

	h1 {
		margin-bottom: 2rem;
		color: #333;
	}

	.dashboard-cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.card {
		background-color: white;
		border-radius: 8px;
		padding: 1.5rem;
		text-decoration: none;
		color: inherit;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.card:hover {
		transform: translateY(-5px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
	}

	.card h2 {
		margin-top: 0;
		margin-bottom: 0.5rem;
		color: #333;
	}

	.card p {
		margin: 0;
		color: #666;
	}
</style>
