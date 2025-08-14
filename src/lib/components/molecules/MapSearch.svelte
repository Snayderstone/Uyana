<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';

	const dispatch = createEventDispatcher();

	export let placeholder = 'Buscar en el mapa...';
	let searchQuery = '';

	function handleSearch() {
		dispatch('search', searchQuery);
	}
</script>

<div class="search-container">
	<input
		type="text"
		bind:value={searchQuery}
		{placeholder}
		on:keyup={(e) => e.key === 'Enter' && handleSearch()}
	/>
	<Button color="primary" style="solid" size="small" on:click={handleSearch}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
	</Button>
</div>

<style lang="scss">
	.search-container {
		display: flex;
		gap: 8px;
		width: 100%;
		max-width: 400px;
		align-self: flex-end;
	}

	input {
		flex: 1;
		padding: 10px;
		border: none;
		border-radius: 20px;
		background-color: var(--color--page-background);
		color: var(--color--text);
		font-size: 0.9rem;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);

		&:focus {
			outline: 2px solid rgb(var(--color--primary-rgb));
		}
	}
</style>
