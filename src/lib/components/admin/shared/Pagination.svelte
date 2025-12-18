<script lang="ts">
	import { icons } from './Icons';

	export let currentPage: number;
	export let totalPages: number;
	export let totalItems: number;
	export let itemsPerPage: number;
	export let onPageChange: (page: number) => void;
	export let onItemsPerPageChange: (items: number) => void;

	const itemsPerPageOptions = [10, 15, 25, 50, 100];

	function goToPage(page: number) {
		if (page < 1 || page > totalPages) return;
		onPageChange(page);
	}

	function changeItemsPerPage(event: Event) {
		const newValue = parseInt((event.target as HTMLSelectElement).value);
		onItemsPerPageChange(newValue);
	}

	$: startItem = (currentPage - 1) * itemsPerPage + 1;
	$: endItem = Math.min(currentPage * itemsPerPage, totalItems);
	$: visiblePages = getVisiblePages(currentPage, totalPages);

	function getVisiblePages(current: number, total: number): number[] {
		const maxVisible = 5;
		const halfVisible = Math.floor(maxVisible / 2);
		let start = Math.max(1, current - halfVisible);
		let end = Math.min(total, start + maxVisible - 1);

		// Adjust start if we're near the end
		if (end - start < maxVisible - 1) {
			start = Math.max(1, end - maxVisible + 1);
		}

		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	}
</script>

<div class="pagination">
	<div class="pagination-info">
		Mostrando {startItem} - {endItem} de {totalItems}
		{totalItems === 1 ? 'registro' : 'registros'}
	</div>

	<div class="pagination-controls">
		<button class="btn btn-secondary" disabled={currentPage === 1} on:click={() => goToPage(1)}>
			Primera
		</button>
		<button
			class="btn btn-secondary"
			disabled={currentPage === 1}
			on:click={() => goToPage(currentPage - 1)}
		>
			<span class="icon">{icons.chevronLeft}</span>
			Anterior
		</button>

		<div class="page-numbers">
			{#each visiblePages as page}
				<button
					class="btn btn-page"
					class:active={page === currentPage}
					on:click={() => goToPage(page)}
				>
					{page}
				</button>
			{/each}
		</div>

		<button
			class="btn btn-secondary"
			disabled={currentPage === totalPages}
			on:click={() => goToPage(currentPage + 1)}
		>
			Siguiente
			<span class="icon">{icons.chevronRight}</span>
		</button>
		<button
			class="btn btn-secondary"
			disabled={currentPage === totalPages}
			on:click={() => goToPage(totalPages)}
		>
			Última
		</button>
	</div>

	<div class="items-per-page">
		<label for="items-per-page">Por página:</label>
		<select id="items-per-page" value={itemsPerPage} on:change={changeItemsPerPage}>
			{#each itemsPerPageOptions as option}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</div>
</div>

<style lang="scss">
	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--color--card-background);
		border: 1px solid var(--color--border);
		border-radius: 12px;
		gap: 1rem;
		flex-wrap: wrap;

		.pagination-info {
			font-size: 0.875rem;
			color: var(--color--text-shade);
		}

		.pagination-controls {
			display: flex;
			align-items: center;
			gap: 0.5rem;

			.page-numbers {
				display: flex;
				gap: 0.25rem;

				.btn-page {
					min-width: 40px;
					padding: 0.5rem;
					border: 1px solid var(--color--border);
					border-radius: 6px;
					background: var(--color--background);
					color: var(--color--text);
					font-size: 0.875rem;
					cursor: pointer;
					transition: all 0.15s ease;

					&:hover:not(.active) {
						background: var(--color--hover);
					}

					&.active {
						background: var(--color--primary);
						border-color: var(--color--primary);
						color: white;
					}

					&:disabled {
						opacity: 0.5;
						cursor: not-allowed;
					}
				}
			}
		}

		.items-per-page {
			display: flex;
			align-items: center;
			gap: 0.5rem;

			label {
				font-size: 0.875rem;
				color: var(--color--text-shade);
			}

			select {
				padding: 0.5rem 0.75rem;
				border: 1px solid var(--color--border);
				border-radius: 6px;
				font-size: 0.875rem;
				background: var(--color--background);
				color: var(--color--text);
				cursor: pointer;

				&:focus {
					outline: none;
					border-color: var(--color--primary);
				}
			}
		}
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 1px solid transparent;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;

		&.btn-secondary {
			background: var(--color--background);
			border-color: var(--color--border);
			color: var(--color--text);

			&:hover:not(:disabled) {
				background: var(--color--hover);
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		}

		.icon {
			font-size: 1rem;
		}
	}

	@media (max-width: 768px) {
		.pagination {
			flex-direction: column;
			align-items: stretch;

			.pagination-controls {
				justify-content: center;
			}
		}
	}
</style>
