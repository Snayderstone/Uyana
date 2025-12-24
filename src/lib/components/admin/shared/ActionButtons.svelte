<script lang="ts">
	import { icons } from './Icons';

	export let onView: (() => void) | null = null;
	export let onEdit: (() => void) | null = null;
	export let onDelete: (() => void) | null = null;
	export let viewLabel = 'Ver detalles';
	export let editLabel = 'Editar';
	export let deleteLabel = 'Eliminar';
</script>

<div class="action-buttons">
	{#if onView}
		<button class="btn-icon" title={viewLabel} on:click={onView}>
			{@html icons.eye}
		</button>
	{/if}
	{#if onEdit}
		<button class="btn-icon" title={editLabel} on:click={onEdit}>
			{@html icons.edit}
		</button>
	{/if}
	{#if onDelete}
		<button class="btn-icon btn-danger" title={deleteLabel} on:click={onDelete}>
			{@html icons.delete}
		</button>
	{/if}
</div>

<style lang="scss">
	.action-buttons {
		display: flex;
		justify-content: center;
		gap: 0.5rem;

		.btn-icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
			padding: 0;
			border: 1px solid var(--color--border);
			border-radius: 6px;
			background: var(--color--background);
			color: var(--color--text);
			cursor: pointer;
			transition: all 0.15s ease;

			&:hover {
				background: var(--color--primary);
				border-color: var(--color--primary);
				color: white;
			}

			&.btn-danger:hover {
				background: #ef4444;
				border-color: #ef4444;
			}

			:global(svg) {
				display: block;
			}
		}
	}
</style>
