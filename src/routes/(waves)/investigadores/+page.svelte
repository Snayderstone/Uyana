<script lang="ts">
	import ResearcherDirectory from '$lib/components/organisms/ResearcherDirectory.svelte';
	import ParticipantsDashboard from '$lib/components/organisms/ParticipantsDashboard.svelte';
	import type { Investigador } from '$lib/models/investigator.model';
	import { fade } from 'svelte/transition';

	export let data: { investigadores: Investigador[] };

	let activeTab: 'directorio' | 'dashboard' = 'directorio';

	function setTab(tab: 'directorio' | 'dashboard') {
		activeTab = tab;
	}
</script>

<svelte:head>
	<title>Directorio de Investigadores - Universidad Central del Ecuador</title>
	<meta
		name="description"
		content="Directorio completo de investigadores acreditados de la Universidad Central del Ecuador con sus líneas de investigación, facultad y carrera."
	/>
</svelte:head>

<div class="investigadores-page">
	<div class="page-header">
		<div class="header-content">
			<h1>Investigadores</h1>
			<p class="description">
				Explora la comunidad académica e investigativa de la Universidad Central del Ecuador.
				Descubre investigadores acreditados y consulta estadísticas detalladas de participación.
			</p>
		</div>

		<div class="tab-selector">
			<button
				class="tab-button"
				class:active={activeTab === 'directorio'}
				on:click={() => setTab('directorio')}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
					<circle cx="9" cy="7" r="4" />
					<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
					<path d="M16 3.13a4 4 0 0 1 0 7.75" />
				</svg>
				Directorio
			</button>
			<button
				class="tab-button"
				class:active={activeTab === 'dashboard'}
				on:click={() => setTab('dashboard')}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
					<line x1="3" y1="9" x2="21" y2="9" />
					<line x1="9" y1="21" x2="9" y2="9" />
				</svg>
				Dashboard
			</button>
		</div>
	</div>

	{#if activeTab === 'directorio'}
		<div class="content-container" in:fade={{ duration: 300 }}>
			<ResearcherDirectory investigadores={data.investigadores} />
		</div>
	{:else if activeTab === 'dashboard'}
		<div class="content-container" in:fade={{ duration: 300 }}>
			<ParticipantsDashboard />
		</div>
	{/if}
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.investigadores-page {
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 20px 40px;
	}

	.page-header {
		margin-bottom: 30px;
		position: relative;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;
		padding-top: 20px;

		.header-content {
			flex: 1;
			min-width: 300px;
		}

		h1 {
			font-size: 2.5rem;
			color: var(--color--text);
			margin-bottom: 10px;

			background: linear-gradient(
				90deg,
				rgb(var(--color--primary-rgb)) 0%,
				rgb(var(--color--secondary-rgb)) 100%
			);
			background-clip: text;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			display: inline-block;

			@include for-phone-only {
				font-size: 2rem;
			}
		}

		.description {
			font-size: 1.1rem;
			color: var(--color--text-shade);
			max-width: 800px;
			margin-bottom: 10px;

			@include for-phone-only {
				font-size: 1rem;
			}
		}
	}

	.tab-selector {
		display: flex;
		gap: 10px;
		margin-top: 10px;

		@include for-phone-only {
			width: 100%;
			justify-content: space-between;
		}
	}

	.tab-button {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		border: 2px solid var(--color--primary);
		background: transparent;
		color: var(--color--primary);
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 1rem;

		svg {
			transition: transform 0.3s ease;
		}

		&:hover {
			background: color-mix(in srgb, var(--color--primary) 10%, transparent);

			svg {
				transform: scale(1.1);
			}
		}

		&.active {
			background: var(--color--primary);
			color: white;
		}

		@include for-phone-only {
			padding: 8px 12px;
			font-size: 0.9rem;
		}
	}

	.content-container {
		width: 100%;
		min-height: 400px;
	}

	@include for-phone-only {
		.investigadores-page {
			padding: 0 10px 20px;
		}
	}
</style>
