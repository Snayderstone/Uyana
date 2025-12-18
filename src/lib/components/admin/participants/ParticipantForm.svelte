<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let participant: any = null;
	export let carreras: any[] = [];

	const dispatch = createEventDispatcher();

	// Estado del formulario
	let formData = {
		nombre: '',
		email: '',
		genero: '',
		carrera_id: '',
		url_foto: '',
		acreditado: false,
		redes_sociales: ''
	};

	let errors: Record<string, string> = {};
	let loading = false;
	let isEditing = false;

	// Inicializar formulario con datos del participante si existe
	$: if (participant) {
		isEditing = true;
		formData = {
			nombre: participant.nombre || '',
			email: participant.email || '',
			genero: participant.genero || '',
			carrera_id: participant.carrera_id?.toString() || '',
			url_foto: participant.url_foto || '',
			acreditado: participant.acreditado || false,
			redes_sociales: participant.redes_sociales || ''
		};
	}

	function validateForm(): boolean {
		errors = {};

		if (!formData.nombre.trim()) {
			errors.nombre = 'El nombre es obligatorio';
		}

		if (!formData.email.trim()) {
			errors.email = 'El email es obligatorio';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			errors.email = 'El email no es válido';
		}

		if (!formData.genero) {
			errors.genero = 'El género es obligatorio';
		}

		if (!formData.carrera_id) {
			errors.carrera_id = 'La carrera es obligatoria';
		}

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validateForm()) return;

		loading = true;
		try {
			const url = isEditing
				? `/api/admin/participants/${participant.id}`
				: '/api/admin/participants';

			const method = isEditing ? 'PUT' : 'POST';

			const payload = {
				...formData,
				carrera_id: parseInt(formData.carrera_id)
			};

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (response.ok) {
				dispatch('save');
			} else {
				const errorData = await response.json();
				if (errorData.errors) {
					errorData.errors.forEach((err: any) => {
						errors[err.field] = err.message;
					});
				} else {
					errors.general = errorData.error || 'Error al guardar el participante';
				}
			}
		} catch (error) {
			console.error('Error submitting form:', error);
			errors.general = 'Error al guardar el participante';
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		dispatch('cancel');
	}
</script>

<div class="form-container">
	<div class="form-header">
		<h2 class="form-title">
			<span class="form-icon">{isEditing ? '✏️' : '➕'}</span>
			{isEditing ? 'Editar Participante' : 'Nuevo Participante'}
		</h2>
		<p class="form-subtitle">
			{isEditing
				? 'Actualiza la información del participante'
				: 'Complete el formulario para agregar un nuevo participante'}
		</p>
	</div>

	<form on:submit|preventDefault={handleSubmit} class="participant-form">
		{#if errors.general}
			<div class="alert alert-error">
				<span class="alert-icon">⚠️</span>
				{errors.general}
			</div>
		{/if}

		<div class="form-grid">
			<!-- Nombre -->
			<div class="form-group full-width">
				<label for="nombre" class="form-label">
					Nombre Completo <span class="required">*</span>
				</label>
				<input
					id="nombre"
					type="text"
					class="form-input"
					class:error={errors.nombre}
					bind:value={formData.nombre}
					placeholder="Ej: Juan Pérez García"
					disabled={loading}
				/>
				{#if errors.nombre}
					<span class="error-message">{errors.nombre}</span>
				{/if}
			</div>

			<!-- Email -->
			<div class="form-group">
				<label for="email" class="form-label">
					Email <span class="required">*</span>
				</label>
				<input
					id="email"
					type="email"
					class="form-input"
					class:error={errors.email}
					bind:value={formData.email}
					placeholder="ejemplo@uce.edu.ec"
					disabled={loading}
				/>
				{#if errors.email}
					<span class="error-message">{errors.email}</span>
				{/if}
			</div>

			<!-- Género -->
			<div class="form-group">
				<label for="genero" class="form-label">
					Género <span class="required">*</span>
				</label>
				<select
					id="genero"
					class="form-select"
					class:error={errors.genero}
					bind:value={formData.genero}
					disabled={loading}
				>
					<option value="">Seleccionar género</option>
					<option value="Masculino">Masculino</option>
					<option value="Femenino">Femenino</option>
					<option value="Otro">Otro</option>
				</select>
				{#if errors.genero}
					<span class="error-message">{errors.genero}</span>
				{/if}
			</div>

			<!-- Carrera -->
			<div class="form-group">
				<label for="carrera" class="form-label">
					Carrera <span class="required">*</span>
				</label>
				<select
					id="carrera"
					class="form-select"
					class:error={errors.carrera_id}
					bind:value={formData.carrera_id}
					disabled={loading}
				>
					<option value="">Seleccionar carrera</option>
					{#each carreras as carrera}
						<option value={carrera.id}>{carrera.nombre}</option>
					{/each}
				</select>
				{#if errors.carrera_id}
					<span class="error-message">{errors.carrera_id}</span>
				{/if}
			</div>

			<!-- URL Foto -->
			<div class="form-group">
				<label for="url_foto" class="form-label">
					URL de Foto <span class="optional">(opcional)</span>
				</label>
				<input
					id="url_foto"
					type="url"
					class="form-input"
					bind:value={formData.url_foto}
					placeholder="https://ejemplo.com/foto.jpg"
					disabled={loading}
				/>
				<span class="help-text">URL pública de la foto del participante</span>
			</div>

			<!-- Redes Sociales -->
			<div class="form-group">
				<label for="redes_sociales" class="form-label">
					Redes Sociales <span class="optional">(opcional)</span>
				</label>
				<textarea
					id="redes_sociales"
					class="form-textarea"
					class:error={errors.redes_sociales}
					bind:value={formData.redes_sociales}
					placeholder="LinkedIn, Twitter, etc."
					rows="3"
					disabled={loading}
				/>
				{#if errors.redes_sociales}
					<span class="error-message">{errors.redes_sociales}</span>
				{/if}
				<span class="help-text">Enlaces o información de redes sociales</span>
			</div>

			<!-- Acreditado -->
			<div class="form-group checkbox-group">
				<label class="checkbox-label">
					<input
						type="checkbox"
						class="form-checkbox"
						bind:checked={formData.acreditado}
						disabled={loading}
					/>
					<span class="checkbox-text">
						<span class="checkbox-title">Acreditado</span>
						<span class="checkbox-description"
							>Marcar si el participante ha sido acreditado en el sistema</span
						>
					</span>
				</label>
			</div>
		</div>

		<!-- Preview de foto -->
		{#if formData.url_foto}
			<div class="photo-preview">
				<span class="preview-label">Vista previa de foto:</span>
				<img src={formData.url_foto} alt="Preview" on:error={() => (formData.url_foto = '')} />
			</div>
		{/if}

		<!-- Botones -->
		<div class="form-actions">
			<button type="button" class="btn btn-secondary" on:click={handleCancel} disabled={loading}>
				<span class="btn-icon">✕</span>
				Cancelar
			</button>
			<button type="submit" class="btn btn-primary" disabled={loading}>
				{#if loading}
					<span class="spinner-small" />
					Guardando...
				{:else}
					<span class="btn-icon">{isEditing ? '💾' : '➕'}</span>
					{isEditing ? 'Actualizar' : 'Crear'} Participante
				{/if}
			</button>
		</div>
	</form>
</div>

<style lang="scss">
	.form-container {
		background: var(--color-background);
		border-radius: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		animation: slideIn 0.3s ease;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.form-header {
		padding: 2rem;
		background: var(--color-background-elevated);
		border-bottom: 2px solid var(--color-border);

		.form-title {
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--color-text);
			margin: 0 0 0.5rem 0;
			display: flex;
			align-items: center;
			gap: 0.75rem;

			.form-icon {
				font-size: 1.75rem;
			}
		}

		.form-subtitle {
			margin: 0;
			color: var(--color-text-secondary);
			font-size: 0.875rem;
		}
	}

	.participant-form {
		padding: 2rem;
	}

	.alert {
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-weight: 500;

		&.alert-error {
			background: rgba(239, 68, 68, 0.1);
			color: #dc2626;
			border: 1px solid rgba(239, 68, 68, 0.2);
		}

		.alert-icon {
			font-size: 1.25rem;
		}
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		&.full-width {
			grid-column: 1 / -1;
		}

		&.checkbox-group {
			grid-column: 1 / -1;
		}
	}

	.form-label {
		font-weight: 600;
		color: var(--color-text);
		font-size: 0.875rem;

		.required {
			color: #ef4444;
			margin-left: 0.25rem;
		}

		.optional {
			color: var(--color-text-secondary);
			font-weight: 400;
			font-size: 0.75rem;
			margin-left: 0.25rem;
		}
	}

	.form-input,
	.form-select,
	.form-textarea {
		padding: 0.75rem 1rem;
		border: 2px solid var(--color-border);
		border-radius: 8px;
		background: var(--color-background);
		color: var(--color-text);
		font-size: 0.875rem;
		transition: all 0.2s ease;
		font-family: inherit;

		&:focus {
			outline: none;
			border-color: var(--color-primary);
			box-shadow: 0 0 0 3px rgba(110, 41, 231, 0.1);
		}

		&.error {
			border-color: #ef4444;

			&:focus {
				box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
			}
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}

	.form-textarea {
		resize: vertical;
		min-height: 80px;
	}

	.error-message {
		color: #ef4444;
		font-size: 0.75rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.25rem;

		&::before {
			content: '⚠️';
			font-size: 0.875rem;
		}
	}

	.help-text {
		color: var(--color-text-secondary);
		font-size: 0.75rem;
		font-style: italic;
	}

	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
		padding: 1rem;
		background: var(--color-background-elevated);
		border-radius: 8px;
		border: 2px solid var(--color-border);
		transition: all 0.2s ease;

		&:hover {
			border-color: var(--color-primary);
			background: var(--color-background-hover);
		}
	}

	.form-checkbox {
		width: 20px;
		height: 20px;
		cursor: pointer;
		margin-top: 0.125rem;
		accent-color: var(--color-primary);
	}

	.checkbox-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;

		.checkbox-title {
			font-weight: 600;
			color: var(--color-text);
		}

		.checkbox-description {
			font-size: 0.75rem;
			color: var(--color-text-secondary);
		}
	}

	.photo-preview {
		margin-bottom: 2rem;
		padding: 1rem;
		background: var(--color-background-elevated);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 1rem;

		.preview-label {
			font-weight: 600;
			color: var(--color-text);
			font-size: 0.875rem;
		}

		img {
			width: 120px;
			height: 120px;
			object-fit: cover;
			border-radius: 50%;
			border: 3px solid var(--color-primary);
		}
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1.5rem;
		border-top: 2px solid var(--color-border);
	}

	.btn {
		padding: 0.875rem 1.75rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
		min-width: 140px;
		justify-content: center;

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		.btn-icon {
			font-size: 1rem;
		}

		&.btn-primary {
			background: var(--color-primary);
			color: white;

			&:hover:not(:disabled) {
				background: var(--color-primary-dark);
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(110, 41, 231, 0.3);
			}
		}

		&.btn-secondary {
			background: var(--color-background-elevated);
			color: var(--color-text);
			border: 2px solid var(--color-border);

			&:hover:not(:disabled) {
				background: var(--color-background-hover);
				border-color: var(--color-text-secondary);
			}
		}
	}

	.spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.form-container {
			border-radius: 0;
		}

		.form-header {
			padding: 1.5rem;

			.form-title {
				font-size: 1.25rem;
			}
		}

		.participant-form {
			padding: 1.5rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.form-actions {
			flex-direction: column-reverse;

			.btn {
				width: 100%;
			}
		}
	}
</style>
