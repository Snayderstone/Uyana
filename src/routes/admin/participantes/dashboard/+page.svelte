<script lang="ts">
	import ParticipantsAdvancedDashboard from '$lib/components/admin/participants/ParticipantsAdvancedDashboard.svelte';
</script>

<svelte:head>
	<title>Dashboard de Participantes</title>
</svelte:head>

<div class="dashboard-container">
	<ParticipantsAdvancedDashboard />
</div>

<style lang="scss">
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dashboard-container {
		padding: 2rem;
		max-width: 1600px;
		margin: 0 auto;
		min-height: 100vh;
		background: var(--color-background);
		animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@media (max-width: 768px) {
		.dashboard-container {
			padding: 1.5rem;
		}
	}

	@media (max-width: 480px) {
		.dashboard-container {
			padding: 1rem;
		}
	}
</style>
