<script lang="ts">
	import MapaCRUD from '$lib/components/admin/geoespacial/MapaCRUD.svelte';
</script>

<svelte:head>
	<title>Gestión Geoespacial - Admin</title>
</svelte:head>

<div class="geoespacial-container">
	<div class="page-header">
		<h1>Gestión Geoespacial</h1>
		<p class="subtitle">
			Mapa unificado para administrar instituciones, facultades y carreras con sus ubicaciones
			geográficas
		</p>
	</div>

	<MapaCRUD height="calc(100vh - 180px)" />
</div>

<style>
	.geoespacial-container {
		max-width: 100%;
		height: 100vh;
		padding: 1rem;
		display: flex;
		flex-direction: column;
	}

	.page-header {
		margin-bottom: 1rem;
	}

	h1 {
		margin: 0 0 0.5rem 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: #111827;
	}

	.subtitle {
		margin: 0;
		font-size: 0.875rem;
		color: #6b7280;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 1.25rem;
		}

		.subtitle {
			font-size: 0.75rem;
		}
	}
</style>
