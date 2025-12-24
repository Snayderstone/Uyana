<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { CatalogoItemDTO } from '$lib/models/admin';

	export let isOpen = false;
	export let mode: 'create' | 'edit' = 'create';
	export let item: CatalogoItemDTO | null = null;
	export let catalogLabel = 'Catálogo';

	const dispatch = createEventDispatcher<{
		save: { nombre: string; descripcion?: string };
		cancel: void;
	}>();

	let nombre = '';
	let descripcion = '';
	let errors: { nombre?: string } = {};
	let lastItemId: number | null = null; // Para evitar bucles infinitos

	// Cargar datos cuando el modal se abre
	$: if (isOpen) {
		// Solo actualizar si es un item diferente o es modo create
		const currentItemId = item?.id ?? null;
		if (mode === 'edit' && item && currentItemId !== lastItemId) {
			nombre = item.nombre;
			descripcion = item.descripcion || '';
			errors = {};
			lastItemId = currentItemId;
		} else if (mode === 'create' && lastItemId !== null) {
			nombre = '';
			descripcion = '';
			errors = {};
			lastItemId = null;
		}
	}

	function validate() {
		errors = {};

		if (!nombre.trim()) {
			errors.nombre = 'El nombre es obligatorio';
		}

		return Object.keys(errors).length === 0;
	}

	function handleSubmit() {
		if (validate()) {
			dispatch('save', {
				nombre: nombre.trim(),
				descripcion: descripcion.trim() || undefined
			});
			close();
		}
	}

	function close() {
		dispatch('cancel');
		nombre = '';
		descripcion = '';
		errors = {};
		lastItemId = null; // Resetear el ID al cerrar
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			close();
		}
	}
</script>

{#if isOpen}
	<div class="modal-backdrop" on:click={handleBackdropClick} on:keydown={handleKeydown}>
		<div class="modal">
			<div class="modal-header">
				<h2>
					{mode === 'create' ? '➕ Agregar' : '✏️ Editar'}
					{catalogLabel}
				</h2>
				<button class="close-btn" on:click={close} aria-label="Cerrar">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>
			<form on:submit|preventDefault={handleSubmit} class="modal-body">
				<div class="form-group">
					<label for="nombre">
						Nombre <span class="required">*</span>
					</label>
					<input
						id="nombre"
						type="text"
						bind:value={nombre}
						class:error={errors.nombre}
						placeholder="Ej: Activo, En Proceso, Finalizado..."
						autocomplete="off"
					/>
					{#if errors.nombre}
						<span class="error-message">⚠️ {errors.nombre}</span>
					{/if}
				</div>

				<div class="form-group">
					<label for="descripcion">
						Descripción <span class="optional">(opcional)</span>
					</label>
					<textarea
						id="descripcion"
						bind:value={descripcion}
						placeholder="Agrega una descripción breve para ayudar a identificar este elemento..."
						rows="4"
					/>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" on:click={close}>
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
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
						Cancelar
					</button>
					<button type="submit" class="btn btn-primary">
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
							<polyline points="20 6 9 17 4 12" />
						</svg>
						{mode === 'create' ? 'Agregar elemento' : 'Guardar cambios'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style lang="scss">
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(2px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fadeIn 0.2s var(--ease-out-3);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal {
		background: var(--color--card-background);
		border-radius: 8px;
		max-width: 500px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		border: 1px solid rgba(var(--color--text-rgb), 0.12);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: slideUp 0.3s var(--ease-out-3);
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);

		h2 {
			margin: 0;
			font-size: 1.125rem;
			font-weight: 600;
			color: var(--color--text);
			font-family: var(--font--default);
			letter-spacing: -0.3px;
		}
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		color: var(--color--text-shade);
		cursor: pointer;
		padding: 0;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.15s var(--ease-out-3);

		&:hover {
			background: rgba(var(--color--text-rgb), 0.08);
			color: var(--color--text);
		}
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		max-height: calc(90vh - 160px);
	}

	.form-group {
		margin-bottom: 1.25rem;

		&:last-of-type {
			margin-bottom: 0;
		}

		label {
			display: block;
			margin-bottom: 0.5rem;
			font-weight: 500;
			font-size: 0.8125rem;
			color: var(--color--text);
			font-family: var(--font--default);

			.required {
				color: #ef4444;
			}

			.optional {
				color: var(--color--text-shade);
				font-weight: 400;
				font-size: 0.75rem;
			}
		}

		input {
			width: 100%;
			padding: 0.625rem 0.75rem;
			border: 1px solid rgba(var(--color--text-rgb), 0.12);
			border-radius: 6px;
			font-size: 0.875rem;
			font-family: var(--font--default);
			background: var(--color--page-background);
			color: var(--color--text);
			transition: all 0.15s var(--ease-out-3);

			&:focus {
				outline: none;
				border-color: var(--color--primary);
				box-shadow: 0 0 0 3px rgba(var(--color--primary-rgb), 0.1);
				background: var(--color--card-background);
			}

			&.error {
				border-color: #ef4444;
			}

			&::placeholder {
				color: var(--color--text-shade);
			}
		}

		textarea {
			width: 100%;
			padding: 0.625rem 0.75rem;
			border: 1px solid rgba(var(--color--text-rgb), 0.12);
			border-radius: 6px;
			font-size: 0.875rem;
			font-family: var(--font--default);
			background: var(--color--page-background);
			color: var(--color--text);
			transition: all 0.15s var(--ease-out-3);
			resize: vertical;
			min-height: 100px;
			line-height: 1.5;

			&:focus {
				outline: none;
				border-color: var(--color--primary);
				box-shadow: 0 0 0 3px rgba(var(--color--primary-rgb), 0.1);
				background: var(--color--card-background);
			}

			&::placeholder {
				color: var(--color--text-shade);
			}
		}
	}

	.error-message {
		display: block;
		margin-top: 0.375rem;
		color: #ef4444;
		font-size: 0.75rem;
		font-family: var(--font--default);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		border: 1px solid transparent;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		font-family: var(--font--default);
		cursor: pointer;
		transition: all 0.15s var(--ease-out-3);

		svg {
			flex-shrink: 0;
		}

		&:active {
			transform: scale(0.98);
		}
	}

	.btn-secondary {
		background: transparent;
		color: var(--color--text-shade);
		border-color: rgba(var(--color--text-rgb), 0.12);

		&:hover {
			background: rgba(var(--color--text-rgb), 0.06);
			color: var(--color--text);
			border-color: rgba(var(--color--text-rgb), 0.2);
		}
	}

	.btn-primary {
		background: var(--color--primary);
		color: var(--color--text-inverse);
		border-color: var(--color--primary);

		&:hover {
			background: var(--color--primary-shade);
			border-color: var(--color--primary-shade);
			box-shadow: 0 2px 8px rgba(var(--color--primary-rgb), 0.3);
		}
	}

	@media (max-width: 576px) {
		.modal {
			max-width: 100%;
			margin: 0;
			border-radius: 8px 8px 0 0;
		}

		.modal-header {
			padding: 1rem 1.25rem;
		}

		.modal-body {
			padding: 1.25rem;
		}

		.modal-footer {
			flex-direction: column-reverse;

			.btn {
				width: 100%;
			}
		}
	}
</style>
