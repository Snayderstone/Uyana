<script lang="ts">
	export let etiquetas: Array<{ id: number; nombre: string; slug: string; color?: string }> = [];
	export let seleccionadas: number[] = [];
	export let placeholder = 'Agrega etiquetas...';
	export let disabled = false;
	export let maxTags = 10;
	export let onDelete: ((etiqueta: any) => void) | undefined = undefined;

	let searchTerm = '';
	let showAll = false;
	const INITIAL_DISPLAY_LIMIT = 12;

	function toggleTag(id: number) {
		if (disabled) return;

		if (seleccionadas.includes(id)) {
			seleccionadas = seleccionadas.filter((t) => t !== id);
		} else if (seleccionadas.length < maxTags) {
			seleccionadas = [...seleccionadas, id];
		}
	}

	function removeTag(id: number) {
		if (disabled) return;
		seleccionadas = seleccionadas.filter((t) => t !== id);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && searchTerm.trim()) {
			e.preventDefault();
			// Buscar etiqueta existente
			const existing = etiquetas.find(
				(t) => t.slug.toLowerCase() === searchTerm.trim().toLowerCase()
			);
			if (existing && !seleccionadas.includes(existing.id)) {
				toggleTag(existing.id);
				searchTerm = '';
			}
		}
	}

	$: etiquetasSeleccionadas = etiquetas.filter((e) => seleccionadas.includes(e.id));
	$: etiquetasDisponibles = etiquetas.filter((e) => !seleccionadas.includes(e.id));

	// Filter available tags based on search term
	$: etiquetasFiltradas = searchTerm.trim()
		? etiquetasDisponibles.filter((e) => e.slug.toLowerCase().includes(searchTerm.toLowerCase()))
		: etiquetasDisponibles;

	// Determine how many tags to display
	$: displayLimit = showAll ? etiquetasFiltradas.length : INITIAL_DISPLAY_LIMIT;
	$: etiquetasMostradas = etiquetasFiltradas.slice(0, displayLimit);
	$: remainingCount = etiquetasFiltradas.length - displayLimit;
</script>

<div class="tag-selector" class:disabled>
	<!-- Etiquetas seleccionadas -->
	{#if etiquetasSeleccionadas.length > 0}
		<div class="selected-tags">
			{#each etiquetasSeleccionadas as tag (tag.id)}
				<button
					type="button"
					class="tag selected"
					style:background-color={tag.color || '#8b5cf6'}
					on:click={() => removeTag(tag.id)}
					title="Clic para quitar"
					{disabled}
				>
					<span class="tag-name">{tag.slug}</span>
					<span class="tag-remove">×</span>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Input para buscar/agregar -->
	<div class="tag-input-wrapper">
		<input
			type="text"
			bind:value={searchTerm}
			on:keydown={handleKeyDown}
			placeholder={seleccionadas.length === 0 ? placeholder : 'Buscar etiquetas...'}
			class="tag-input"
			disabled={disabled || seleccionadas.length >= maxTags}
		/>
		{#if seleccionadas.length >= maxTags}
			<span class="limit-message">Máximo {maxTags} etiquetas</span>
		{/if}
	</div>

	<!-- Etiquetas sugeridas -->
	{#if etiquetasMostradas.length > 0}
		<div class="available-tags">
			<p class="section-label">
				{#if searchTerm.trim()}
					Resultados: {etiquetasFiltradas.length}
				{:else}
					Etiquetas disponibles
				{/if}
			</p>
			<div class="tag-list">
				{#each etiquetasMostradas as tag (tag.id)}
					<div class="tag-item">
						<button
							type="button"
							class="tag available"
							style:border-color={tag.color || '#8b5cf6'}
							on:click={() => toggleTag(tag.id)}
							disabled={disabled || seleccionadas.length >= maxTags}
							title="Clic para agregar"
						>
							<span class="tag-name">{tag.slug}</span>
							<span class="tag-add">+</span>
						</button>
						{#if onDelete}
							<button
								type="button"
								class="btn-delete-x"
								on:click={() => onDelete && onDelete(tag)}
								{disabled}
								title="Eliminar etiqueta"
							>
								×
							</button>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Show more button -->
			{#if remainingCount > 0 && !showAll}
				<button type="button" class="btn-show-more" on:click={() => (showAll = true)} {disabled}>
					Mostrar más (+{remainingCount})
				</button>
			{:else if showAll && etiquetasFiltradas.length > INITIAL_DISPLAY_LIMIT}
				<button type="button" class="btn-show-more" on:click={() => (showAll = false)} {disabled}>
					Mostrar menos
				</button>
			{/if}
		</div>
	{:else if searchTerm.trim() && etiquetasFiltradas.length === 0}
		<div class="no-results">
			<p>No se encontraron etiquetas con "{searchTerm}"</p>
		</div>
	{/if}
</div>

<style lang="scss">
	.tag-selector {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		&.disabled {
			opacity: 0.6;
			pointer-events: none;
		}
	}

	.selected-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 500;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: var(--font--default);

		&.selected {
			color: white;

			&:hover:not(:disabled) {
				transform: scale(1.05);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
			}

			&:active:not(:disabled) {
				transform: scale(0.98);
			}
		}

		&.available {
			background: var(--color--page-background);
			color: var(--color--text);
			border-width: 2px;
			border-style: solid;

			&:hover:not(:disabled) {
				background: rgba(var(--color--primary-rgb), 0.1);
				transform: translateY(-2px);
			}

			&:active:not(:disabled) {
				transform: translateY(0);
			}
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.tag-name {
		line-height: 1;
	}

	.tag-remove,
	.tag-add {
		font-size: 1.125rem;
		font-weight: 700;
		line-height: 1;
		opacity: 0.8;
		transition: opacity 0.2s;

		.tag:hover:not(:disabled) & {
			opacity: 1;
		}
	}

	.tag-input-wrapper {
		position: relative;
	}

	.tag-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		font-size: 1rem;
		font-family: var(--font--default);
		background: var(--color--page-background);
		color: var(--color--text);
		transition: border-color 0.2s ease;

		&:focus {
			outline: none;
			border-color: var(--color--primary);
			box-shadow: 0 0 0 3px rgba(var(--color--primary-rgb), 0.1);
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		&::placeholder {
			color: var(--color--text-shade);
			opacity: 0.6;
		}
	}

	.limit-message {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.75rem;
		color: var(--color--callout-warning-color);
		background: var(--color--callout-warning-background);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-weight: 500;
	}

	.available-tags {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-label {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color--text-shade);
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag-item {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.375rem;

		&:hover .btn-delete-x {
			opacity: 1;
		}
	}

	.btn-delete-x {
		width: 24px;
		height: 24px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 5px;
		color: rgba(var(--color--text-rgb), 0.35);
		font-size: 20px;
		line-height: 1;
		font-weight: 400;
		cursor: pointer;
		opacity: 0;
		transition: all 0.2s ease;

		&:hover:not(:disabled) {
			opacity: 1 !important;
			background: rgba(var(--color--danger-rgb), 0.1);
			border-color: rgba(var(--color--danger-rgb), 0.2);
			color: var(--color--danger);
			transform: scale(1.1);
		}

		&:active:not(:disabled) {
			transform: scale(0.95);
		}

		&:disabled {
			opacity: 0.2;
			cursor: not-allowed;
		}
	}

	.btn-show-more {
		width: 100%;
		padding: 0.625rem 1rem;
		background: rgba(var(--color--primary-rgb), 0.08);
		border: 1.5px solid rgba(var(--color--primary-rgb), 0.2);
		border-radius: 8px;
		color: var(--color--primary);
		font-size: 0.875rem;
		font-weight: 600;
		font-family: var(--font--default);
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover:not(:disabled) {
			background: rgba(var(--color--primary-rgb), 0.12);
			border-color: rgba(var(--color--primary-rgb), 0.3);
			transform: translateY(-1px);
		}

		&:active:not(:disabled) {
			transform: translateY(0);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.no-results {
		padding: 1.5rem;
		text-align: center;
		color: var(--color--text-shade);
		font-size: 0.875rem;
		background: rgba(var(--color--text-rgb), 0.05);
		border-radius: 8px;

		p {
			margin: 0;
		}
	}

	@media (max-width: 768px) {
		.tag {
			font-size: 0.8125rem;
			padding: 0.3125rem 0.625rem;
		}

		.tag-list {
			gap: 0.375rem;
		}
	}
</style>
