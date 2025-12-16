<script lang="ts">
	import MapaCRUD from '$lib/components/admin/geoespacial/MapaCRUD.svelte';
</script>

<svelte:head>
	<title>Gestión Geoespacial - Admin UCE</title>
	<meta
		name="description"
		content="Gestión de ubicaciones geoespaciales de instituciones, facultades y carreras"
	/>
</svelte:head>

<div class="geoespacial-page">
	<MapaCRUD height="100%" />
</div>

<style lang="scss">
	.geoespacial-page {
		width: 100%;
		height: calc(100vh - 73px); /* Resta la altura del header (73px) */
		display: flex;
		flex-direction: column;
		overflow: visible;

		:global(.mapa-crud) {
			height: 100%;
			border-radius: 0;
		}
	}
</style>
