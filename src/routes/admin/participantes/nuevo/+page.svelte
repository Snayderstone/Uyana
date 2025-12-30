<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { icons } from '$lib/components/admin/shared';

	// Avatar helper
	function getInitials(name: string): string {
		const parts = name.trim().split(' ');
		if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
		return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
	}

	// Map gender from form format to DB format
	function mapGenderToDB(gender: string): string {
		const genderMap: Record<string, string> = {
			Masculino: 'm',
			Femenino: 'f'
		};
		return genderMap[gender] || gender;
	}

	// State
	let saving = false;
	let error: string | null = null;
	let successMessage: string | null = null;

	// Form data
	let formData = {
		nombre: '',
		email: '',
		genero: '',
		acreditado: false,
		carrera_id: null as number | null,
		facultad_id: null as number | null,
		redes_sociales: '',
		foto: ''
	};

	// Photo upload state
	let photoFile: File | null = null;
	let photoInput: HTMLInputElement;
	let uploadingPhoto = false;

	// Social networks state
	let redesSocialesList: string[] = [''];

	// Validation
	let errors: Record<string, string> = {};

	// Catalogs
	let generos = ['Masculino', 'Femenino'];
	let facultades: Array<{ id: number; nombre: string }> = [];
	let carreras: Array<{ id: number; nombre: string; facultad_id: number }> = [];
	let filteredCarreras: Array<{ id: number; nombre: string }> = [];

	/**
	 * Social networks management
	 */
	function addRedSocial() {
		redesSocialesList = [...redesSocialesList, ''];
	}

	function removeRedSocial(index: number) {
		if (redesSocialesList.length > 1) {
			redesSocialesList = redesSocialesList.filter((_, i) => i !== index);
		} else {
			redesSocialesList = [''];
		}
		updateRedesSocialesString();
	}

	function updateRedesSocialesString() {
		formData.redes_sociales = redesSocialesList.filter((url) => url.trim()).join(' | ');
	}

	function parseRedesSocialesFromString(str: string | null): string[] {
		if (!str) return [''];
		const urls = str
			.split('|')
			.map((url) => url.trim())
			.filter((url) => url);
		return urls.length > 0 ? urls : [''];
	}

	/**
	 * Fetch catalogs
	 */
	async function fetchCatalogs() {
		if (!browser) return;

		try {
			console.log('📚 Cargando catálogos...');

			// Fetch facultades
			const facultadesRes = await fetch('/api/admin/catalogs/facultades');
			const facultadesData = await facultadesRes.json();
			if (facultadesData.success) {
				facultades = facultadesData.data;
				console.log('✅ Facultades cargadas:', facultades.length);
			}

			// Fetch carreras
			const carrerasRes = await fetch('/api/admin/catalogs/carreras');
			const carrerasData = await carrerasRes.json();
			if (carrerasData.success) {
				carreras = carrerasData.data;
				filteredCarreras = carreras;
				console.log('✅ Carreras cargadas:', carreras.length);
			}
		} catch (err) {
			console.error('Error fetching catalogs:', err);
		}
	}

	/**
	 * Filter carreras by facultad
	 */
	function filterCarrerasByFacultad(facultadId: number | null) {
		if (!facultadId) {
			filteredCarreras = carreras;
			formData.carrera_id = null;
		} else {
			filteredCarreras = carreras.filter((c) => c.facultad_id === facultadId);

			// Reset carrera if it doesn't belong to selected facultad
			if (formData.carrera_id) {
				const carreraExists = filteredCarreras.find((c) => c.id === formData.carrera_id);
				if (!carreraExists) {
					formData.carrera_id = null;
				}
			}
		}
	}

	/**
	 * Validate form
	 */
	function validateForm(): boolean {
		errors = {};

		// Validar nombre
		if (!formData.nombre.trim()) {
			errors.nombre = 'El nombre completo es obligatorio';
		} else if (formData.nombre.trim().length < 2) {
			errors.nombre = 'El nombre debe tener al menos 2 caracteres';
		} else if (formData.nombre.trim().length > 100) {
			errors.nombre = 'El nombre no puede exceder 100 caracteres';
		}

		// Validar email
		if (formData.email && formData.email.trim()) {
			if (!isValidEmail(formData.email.trim())) {
				errors.email = 'Ingrese un email válido (ej: usuario@dominio.com)';
			}
		}

		// Validar género
		if (!formData.genero) {
			errors.genero = 'Seleccione un género de la lista';
		}

		// Validar redes sociales (si se proporciona)
		if (formData.redes_sociales && formData.redes_sociales.trim()) {
			try {
				new URL(formData.redes_sociales.trim());
			} catch {
				errors.redes_sociales = 'Ingrese una URL válida que comience con http:// o https://';
			}
		}

		// Validar foto (si se proporciona)
		if (formData.foto && formData.foto.trim()) {
			const fotoValue = formData.foto.trim();
			if (isBase64Image(fotoValue)) {
				// Validar que el base64 sea válido
				if (fotoValue.length < 100) {
					errors.foto = 'Los datos base64 parecen estar incompletos';
				}
			} else {
				// Validar que sea una URL válida
				try {
					new URL(fotoValue);
				} catch {
					errors.foto = 'Ingrese una URL válida o datos base64 válidos (data:image/...)';
				}
			}
		}

		return Object.keys(errors).length === 0;
	}

	/**
	 * Validate email format
	 */
	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	/**
	 * Check if string is base64 image
	 */
	function isBase64Image(url: string): boolean {
		return url.startsWith('data:image/');
	}

	/**
	 * Get image source - handles both URL and base64
	 */
	function getImageSource(photoUrl: string): string {
		if (!photoUrl) return '';
		return photoUrl; // Works for both base64 and URLs
	}

	/**
	 * Handle form submit
	 */
	async function handleSubmit() {
		error = null;
		successMessage = null;

		if (!validateForm()) {
			return;
		}

		saving = true;

		try {
			// Prepare create data
			const createData = {
				nombre: formData.nombre.trim(),
				email: formData.email.trim() || null,
				genero: mapGenderToDB(formData.genero),
				acreditado: formData.acreditado,
				carrera_id: formData.carrera_id,
				redes_sociales: formData.redes_sociales.trim() || null,
				url_foto: formData.foto.trim() || null
			};

			console.log('📤 Creando participante:', createData);

			const response = await fetch('/api/admin/participants', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(createData)
			});

			const result = await response.json();

			if (result.success) {
				successMessage = `¡Perfecto! El participante "${formData.nombre}" ha sido creado correctamente. Redirigiendo...`;

				// Redirect after 2 seconds
				setTimeout(() => {
					if (result.data?.id) {
						goto(`/admin/participantes/${result.data.id}`);
					} else {
						goto('/admin/participantes/tabla');
					}
				}, 2000);
			} else {
				throw new Error(result.message || 'Error al crear');
			}
		} catch (err) {
			console.error('Error creating participante:', err);
			if (err instanceof Error) {
				error = `Error al guardar: ${err.message}`;
			} else {
				error =
					'Ocurrió un error inesperado al crear el participante. Por favor, inténtelo nuevamente.';
			}
		} finally {
			saving = false;
		}
	}

	/**
	 * Handle cancel
	 */
	function handleCancel() {
		if (confirm('¿Estás seguro? Los cambios no guardados se perderán.')) {
			goto('/admin/participantes/tabla');
		}
	}

	/**
	 * Handle photo file selection
	 */
	function handlePhotoSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				error = 'La imagen debe ser menor a 5MB';
				return;
			}

			if (!file.type.startsWith('image/')) {
				error = 'Solo se permiten archivos de imagen';
				return;
			}

			photoFile = file;
			convertFileToBase64(file);
		}
	}

	/**
	 * Convert file to base64
	 */
	function convertFileToBase64(file: File) {
		uploadingPhoto = true;
		error = null;

		const reader = new FileReader();
		reader.onload = () => {
			const base64Result = reader.result as string;
			formData.foto = base64Result;
			uploadingPhoto = false;

			// Show success message
			successMessage = 'Imagen convertida a base64 correctamente. Lista para guardar.';
			setTimeout(() => {
				successMessage = null;
			}, 3000);
		};
		reader.onerror = () => {
			error = 'Error al procesar la imagen';
			uploadingPhoto = false;
		};
		reader.readAsDataURL(file);
	}

	/**
	 * Trigger photo upload
	 */
	function triggerPhotoUpload() {
		photoInput?.click();
	}

	/**
	 * Remove photo
	 */
	function removePhoto() {
		formData.foto = '';
		photoFile = null;
		if (photoInput) photoInput.value = '';

		successMessage = 'Imagen eliminada correctamente.';
		setTimeout(() => {
			successMessage = null;
		}, 2000);
	}

	/**
	 * Real-time validation on input change
	 */
	$: if (formData.nombre || formData.email || formData.genero) {
		validateForm();
	}

	/**
	 * Update filtered carreras when facultad changes
	 */
	$: if (formData.facultad_id !== null) {
		filterCarrerasByFacultad(formData.facultad_id);
	}

	onMount(async () => {
		await fetchCatalogs();
	});
</script>

<div class="participante-nuevo-page">
	<!-- Header -->
	<div class="page-header">
		<div class="header-left">
			<button class="btn-back" on:click={() => goto('/admin/participantes/tabla')}>
				{@html icons.arrowLeft}
				<span>Volver a la lista</span>
			</button>
			<div class="header-info">
				<h1>Agregar Nuevo Participante</h1>
				<p class="page-subtitle">
					Complete la información para registrar un nuevo participante en el sistema
				</p>
			</div>
		</div>
	</div>

	<!-- Success/Error Messages -->
	{#if successMessage}
		<div class="alert alert-success">
			<div class="alert-icon">{@html icons.check}</div>
			<p>{successMessage}</p>
		</div>
	{/if}

	{#if error}
		<div class="alert alert-error">
			<div class="alert-icon">{@html icons.alert}</div>
			<p>{error}</p>
		</div>
	{/if}

	<!-- Main Form -->
	<form class="edit-form" on:submit|preventDefault={handleSubmit}>
		<!-- Información Básica -->
		<div class="form-section">
			<div class="section-header">
				<div class="section-icon step-1">{@html icons.user}</div>
				<div class="section-title">
					<h2>Información Básica</h2>
					<p>Datos personales del participante</p>
				</div>
			</div>
			<div class="section-content">
				<!-- Photo Upload -->
				<div class="photo-section">
					<span class="photo-label">Foto de Perfil</span>
					<div class="photo-upload-container">
						<div class="photo-preview">
							{#if uploadingPhoto}
								<div class="upload-spinner">
									<div class="spinner-sm" />
								</div>
							{:else if formData.foto}
								<img
									src={getImageSource(formData.foto)}
									alt="Foto del participante"
									on:error={() => (formData.foto = '')}
								/>
							{:else}
								<div class="avatar-placeholder">
									{@html icons.user}
								</div>
							{/if}
						</div>
						<div class="photo-actions">
							<button type="button" class="btn-upload" on:click={triggerPhotoUpload}>
								{@html icons.upload}
								{formData.foto ? 'Cambiar foto' : 'Subir foto'}
							</button>
							{#if formData.foto}
								<button type="button" class="btn-remove" on:click={removePhoto}>
									{@html icons.delete}
									Eliminar
								</button>
							{/if}
							<input
								bind:this={photoInput}
								type="file"
								accept="image/*"
								on:change={handlePhotoSelect}
								style="display: none;"
							/>
						</div>
					</div>
					<p class="photo-help">Formatos: JPG, PNG, GIF. Tamaño máximo: 5 MB</p>
				</div>

				<div class="form-grid">
					<!-- Nombre -->
					<div class="form-group full-width" class:has-error={errors.nombre}>
						<label for="nombre" class:error-label={errors.nombre}>
							Nombre Completo <span class="required">*</span>
						</label>
						<input
							type="text"
							id="nombre"
							bind:value={formData.nombre}
							class:error={errors.nombre}
							placeholder="Ejemplo: Juan Carlos Pérez"
							required
							autocomplete="name"
						/>
						{#if errors.nombre}
							<span class="error-message">
								{@html icons.alert}
								{errors.nombre}
							</span>
						{/if}
					</div>

					<!-- Email -->
					<div class="form-group" class:has-error={errors.email}>
						<label for="email" class:error-label={errors.email}>Correo Electrónico</label>
						<input
							type="email"
							id="email"
							bind:value={formData.email}
							class:error={errors.email}
							placeholder="ejemplo@universidad.edu"
							autocomplete="email"
						/>
						{#if errors.email}
							<span class="error-message">
								{@html icons.alert}
								{errors.email}
							</span>
						{/if}
					</div>

					<!-- Género -->
					<div class="form-group" class:has-error={errors.genero}>
						<label for="genero" class:error-label={errors.genero}>
							Género <span class="required">*</span>
						</label>
						<select id="genero" bind:value={formData.genero} class:error={errors.genero} required>
							<option value="">-- Seleccione --</option>
							{#each generos as genero}
								<option value={genero}>{genero}</option>
							{/each}
						</select>
						{#if errors.genero}
							<span class="error-message">
								{@html icons.alert}
								{errors.genero}
							</span>
						{/if}
					</div>

					<!-- Acreditado -->
					<div class="form-group full-width">
						<div class="checkbox-container">
							<label class="checkbox-label" for="acreditado">
								<input type="checkbox" id="acreditado" bind:checked={formData.acreditado} />
								<span class="checkbox-custom" />
								<div class="checkbox-content">
									<span class="checkbox-text">Participante Acreditado</span>
									<span class="checkbox-help"
										>Marque si el participante ha sido acreditado oficialmente</span
									>
								</div>
							</label>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Información Académica -->
		<div class="form-section">
			<div class="section-header">
				<div class="section-icon step-2">{@html icons.book}</div>
				<div class="section-title">
					<h2>Información Académica</h2>
					<p>Facultad y carrera del participante</p>
				</div>
			</div>
			<div class="section-content">
				<div class="form-grid full-width-grid">
					<!-- Facultad -->
					<div class="form-group">
						<label for="facultad">Facultad</label>
						<select
							id="facultad"
							bind:value={formData.facultad_id}
							on:change={() => filterCarrerasByFacultad(formData.facultad_id)}
						>
							<option value={null}>-- Seleccione --</option>
							{#each facultades as facultad}
								<option value={facultad.id}>{facultad.nombre}</option>
							{/each}
						</select>
					</div>

					<!-- Carrera -->
					<div class="form-group">
						<label for="carrera">Carrera</label>
						<select id="carrera" bind:value={formData.carrera_id} disabled={!formData.facultad_id}>
							<option value={null}>-- Seleccione --</option>
							{#each filteredCarreras as carrera}
								<option value={carrera.id}>{carrera.nombre}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		</div>

		<!-- Información Adicional -->
		<div class="form-section">
			<div class="section-header">
				<div class="section-icon step-3">{@html icons.link}</div>
				<div class="section-title">
					<h2>Información Adicional</h2>
					<p>Redes sociales y perfiles académicos</p>
				</div>
			</div>
			<div class="section-content">
				<!-- Redes Sociales -->
				<div class="form-group full-width" class:has-error={errors.redes_sociales}>
					<span class="form-label" class:error-label={errors.redes_sociales}>
						Perfiles Académicos y Redes Sociales
					</span>
					<div class="redes-sociales-list">
						{#each redesSocialesList as redSocial, index}
							<div class="red-social-item">
								<input
									type="url"
									bind:value={redesSocialesList[index]}
									on:input={updateRedesSocialesString}
									placeholder="https://linkedin.com/in/usuario"
									class="red-social-input"
								/>
								{#if redesSocialesList.length > 1}
									<button
										type="button"
										class="btn-remove-red"
										on:click={() => removeRedSocial(index)}
										title="Eliminar esta red social"
									>
										{@html icons.close}
									</button>
								{/if}
							</div>
						{/each}
					</div>
					<button type="button" class="btn-add-red" on:click={addRedSocial}>
						{@html icons.plus}
						Agregar otra red social
					</button>
					{#if errors.redes_sociales}
						<span class="error-message">
							{@html icons.alert}
							{errors.redes_sociales}
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Form Actions -->
		<div class="form-actions">
			<button type="button" class="btn-secondary" on:click={handleCancel} disabled={saving}>
				Cancelar
			</button>
			<button type="submit" class="btn-primary" disabled={saving}>
				{#if saving}
					<span class="spinner-sm" />
				{:else}
					{@html icons.check}
				{/if}
				{saving ? 'Creando...' : 'Crear Participante'}
			</button>
		</div>
	</form>
</div>

<style lang="scss">
	.participante-nuevo-page {
		max-width: 1000px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	// ==================== Header ====================
	.page-header {
		margin-bottom: 2rem;
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.header-info {
		h1 {
			font-size: 2.25rem;
			font-weight: 700;
			color: var(--color--text, #ededed);
			margin: 0;
			letter-spacing: -0.025em;
			background: linear-gradient(135deg, #6e29e7 0%, #8b5cf6 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
	}

	.page-subtitle {
		font-size: 1rem;
		color: var(--color--text-shade, #a0aec0);
		margin: 0.5rem 0 0 0;
		line-height: 1.5;
		font-weight: 400;
	}

	.btn-back {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: transparent;
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 8px;
		color: var(--color--text-shade, #a0aec0);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;

		:global(svg) {
			width: 18px;
			height: 18px;
		}

		&:hover {
			background: rgba(var(--color--text-rgb), 0.03);
			border-color: #6e29e7;
			color: var(--color--text, #ededed);
			transform: translateX(-2px);
		}
	}

	// ==================== Alerts ====================
	.alert {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-radius: 10px;
		margin-bottom: 2rem;
		font-size: 0.9rem;
		line-height: 1.5;

		&.alert-success {
			background: rgba(72, 187, 120, 0.1);
			border: 1px solid rgba(72, 187, 120, 0.3);
			color: #48bb78;
		}

		&.alert-error {
			background: rgba(229, 62, 62, 0.1);
			border: 1px solid rgba(229, 62, 62, 0.3);
			color: #fc8181;
		}

		p {
			margin: 0;
			flex: 1;
		}
	}

	.alert-icon {
		display: flex;
		flex-shrink: 0;

		:global(svg) {
			width: 20px;
			height: 20px;
		}
	}

	// ==================== Edit Form ====================
	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.form-section {
		background: var(--color--card-background, #1a1f26);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 16px;
		overflow: hidden;
		transition: all 0.3s;

		&:hover {
			border-color: rgba(var(--color--text-rgb), 0.15);
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		}
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem 2rem;
		background: rgba(var(--color--text-rgb), 0.02);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.section-icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.3s;

		&.step-1 {
			background: rgba(110, 41, 231, 0.15);
			color: #8b5cf6;
		}

		&.step-2 {
			background: rgba(66, 153, 225, 0.15);
			color: #4299e1;
		}

		&.step-3 {
			background: rgba(72, 187, 120, 0.15);
			color: #48bb78;
		}

		:global(svg) {
			width: 24px;
			height: 24px;
		}
	}

	.section-title {
		flex: 1;

		h2 {
			font-size: 1.25rem;
			font-weight: 600;
			color: var(--color--text, #ededed);
			margin: 0 0 0.25rem 0;
		}

		p {
			font-size: 0.875rem;
			color: var(--color--text-shade, #a0aec0);
			margin: 0;
			line-height: 1.4;
		}
	}

	.section-content {
		padding: 2rem;
	}

	// ==================== Form Grid ====================
	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-bottom: 2rem;

		&:last-child {
			margin-bottom: 0;
		}

		&.full-width-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;

		&.full-width {
			grid-column: 1 / -1;
		}

		&.has-error {
			.section-content & {
				background: rgba(252, 129, 129, 0.03);
				border: 1px solid rgba(252, 129, 129, 0.1);
				border-radius: 8px;
				padding: 1rem;
				margin: -1rem;
			}
		}
	}

	label {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color--text, #e2e8f0);

		&:not(.checkbox-label) {
			display: block;
		}

		.required {
			color: #fc8181;
			margin-left: 0.25rem;
		}
	}

	.error-label {
		color: #fc8181 !important;

		.required {
			color: #e53e3e !important;
		}
	}

	input[type='text'],
	input[type='email'],
	select {
		padding: 1rem;
		background: var(--color--input-background, rgba(255, 255, 255, 0.05));
		border: 2px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		color: var(--color--text, #ededed);
		font-size: 0.9rem;
		transition: all 0.2s;
		font-family: inherit;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;

		&:focus {
			outline: none;
			border-color: #6e29e7;
			box-shadow: 0 0 0 3px rgba(110, 41, 231, 0.1);
		}

		&::placeholder {
			color: var(--color--text-shade, #718096);
		}

		&.error {
			border-color: #fc8181;
			box-shadow: 0 0 0 3px rgba(252, 129, 129, 0.1);
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
			background: rgba(var(--color--text-rgb), 0.03);
		}
	}

	select {
		cursor: pointer;
		text-overflow: ellipsis;
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a0aec0' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		padding-right: 2.5rem;
		white-space: nowrap;
		overflow: hidden;

		option {
			padding: 0.5rem;
			white-space: normal;
			word-wrap: break-word;
			background: var(--color--card-background, #1a1f26);
			color: var(--color--text, #ededed);
		}
	}

	.error-message {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		color: #fc8181;
		font-weight: 500;

		:global(svg) {
			width: 16px;
			height: 16px;
			flex-shrink: 0;
		}
	}

	// ==================== Photo Section ====================
	.photo-section {
		background: rgba(139, 92, 246, 0.05);
		border: 1px solid rgba(139, 92, 246, 0.1);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.photo-label {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color--text, #e2e8f0);
		margin-bottom: 1rem;
		display: block;
	}

	.photo-upload-container {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.photo-preview {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		overflow: hidden;
		background: rgba(var(--color--text-rgb), 0.05);
		border: 3px solid rgba(110, 41, 231, 0.3);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.upload-spinner {
			position: absolute;
			inset: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(0, 0, 0, 0.7);
		}

		.avatar-placeholder {
			display: flex;
			align-items: center;
			justify-content: center;
			color: var(--color--text-shade, #a0aec0);

			:global(svg) {
				width: 50px;
				height: 50px;
			}
		}
	}

	.photo-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.btn-upload {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: rgba(110, 41, 231, 0.1);
		border: 2px solid rgba(110, 41, 231, 0.3);
		border-radius: 8px;
		color: #8b5cf6;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;

		:global(svg) {
			width: 18px;
			height: 18px;
		}

		&:hover:not(:disabled) {
			background: rgba(110, 41, 231, 0.2);
			border-color: #6e29e7;
			transform: translateY(-2px);
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}

	.btn-remove {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: rgba(229, 62, 62, 0.1);
		border: 2px solid rgba(229, 62, 62, 0.3);
		border-radius: 8px;
		color: #fc8181;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;

		:global(svg) {
			width: 18px;
			height: 18px;
		}

		&:hover {
			background: rgba(229, 62, 62, 0.2);
			border-color: #e53e3e;
			transform: translateY(-2px);
		}
	}

	.photo-help {
		font-size: 0.8rem;
		color: var(--color--text-shade, #a0aec0);
		margin-top: 0.75rem;
		margin-bottom: 0;
	}

	// ==================== Checkbox ====================
	.checkbox-container {
		background: rgba(110, 41, 231, 0.05);
		border: 1px solid rgba(110, 41, 231, 0.1);
		border-radius: 8px;
		padding: 1rem;
	}

	.checkbox-label {
		display: flex !important;
		align-items: flex-start;
		gap: 1rem;
		cursor: pointer;

		input[type='checkbox'] {
			display: none;
		}
	}

	.checkbox-custom {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(var(--color--text-rgb), 0.3);
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		flex-shrink: 0;
		margin-top: 0.125rem;

		&::after {
			content: '✓';
			color: #6e29e7;
			font-weight: bold;
			font-size: 0.875rem;
			opacity: 0;
			transition: opacity 0.2s;
		}
	}

	input[type='checkbox']:checked + .checkbox-custom {
		border-color: #6e29e7;
		background: rgba(110, 41, 231, 0.1);

		&::after {
			opacity: 1;
		}
	}

	.checkbox-content {
		flex: 1;

		.checkbox-text {
			font-size: 0.9rem;
			color: var(--color--text, #e2e8f0);
			font-weight: 600;
			display: block;
			margin-bottom: 0.25rem;
		}

		.checkbox-help {
			font-size: 0.8rem;
			color: var(--color--text-shade, #a0aec0);
			line-height: 1.4;
		}
	}

	// ==================== Social Networks ====================
	.redes-sociales-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.red-social-item {
		display: flex;
		gap: 0.5rem;
		align-items: center;

		.red-social-input {
			flex: 1;
			padding: 0.75rem;
			background: var(--color--input-background, rgba(255, 255, 255, 0.05));
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			border-radius: 6px;
			color: var(--color--text);
			font-size: 0.875rem;
			transition: all 0.2s;
			width: 100%;
			box-sizing: border-box;

			&::placeholder {
				color: var(--color--text-shade);
			}

			&:focus {
				outline: none;
				border-color: #6e29e7;
				background: rgba(110, 41, 231, 0.05);
			}
		}

		.btn-remove-red {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 36px;
			height: 36px;
			min-width: 36px;
			padding: 0;
			background: rgba(229, 62, 62, 0.1);
			border: 1px solid rgba(229, 62, 62, 0.3);
			border-radius: 6px;
			color: #fc8181;
			cursor: pointer;
			transition: all 0.2s;

			:global(svg) {
				width: 16px;
				height: 16px;
			}

			&:hover {
				background: rgba(229, 62, 62, 0.2);
				border-color: rgba(229, 62, 62, 0.5);
				color: #e53e3e;
				transform: scale(1.05);
			}
		}
	}

	.btn-add-red {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: rgba(110, 41, 231, 0.1);
		border: 1px solid rgba(110, 41, 231, 0.3);
		border-radius: 6px;
		color: #8b5cf6;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		align-self: flex-start;

		:global(svg) {
			width: 16px;
			height: 16px;
		}

		&:hover {
			background: rgba(110, 41, 231, 0.2);
			border-color: rgba(110, 41, 231, 0.5);
			transform: translateY(-1px);
			box-shadow: 0 2px 8px rgba(110, 41, 231, 0.2);
		}
	}

	.form-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color--text, #e2e8f0);
		display: block;
		margin-bottom: 0.5rem;
	}

	// ==================== Form Actions ====================
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 2rem 0;
		margin-top: 2rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		text-transform: none;

		:global(svg) {
			width: 18px;
			height: 18px;
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
			transform: none !important;
		}
	}

	.btn-primary {
		background: linear-gradient(135deg, #6e29e7 0%, #8b5cf6 100%);
		color: white;
		border: 2px solid transparent;

		&:hover:not(:disabled) {
			transform: translateY(-2px);
			box-shadow: 0 8px 25px rgba(110, 41, 231, 0.3);
		}
	}

	.btn-secondary {
		background: rgba(var(--color--text-rgb), 0.05);
		color: var(--color--text, #e2e8f0);
		border: 2px solid rgba(var(--color--text-rgb), 0.15);

		&:hover:not(:disabled) {
			background: rgba(var(--color--text-rgb), 0.1);
			border-color: rgba(var(--color--text-rgb), 0.25);
			transform: translateY(-1px);
		}
	}

	// ==================== Spinners ====================
	.spinner-sm {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	// ==================== Responsive ====================
	@media (max-width: 768px) {
		.participante-nuevo-page {
			padding: 0 0.5rem;
		}

		.header-info h1 {
			font-size: 1.75rem;
		}

		.form-grid {
			grid-template-columns: 1fr;

			&.full-width-grid {
				grid-template-columns: 1fr;
			}
		}

		.section-header {
			padding: 1rem 1.5rem;
		}

		.section-content {
			padding: 1.5rem;
		}

		.photo-upload-container {
			flex-direction: column;
			align-items: flex-start;
		}

		.form-actions {
			flex-direction: column-reverse;
		}
	}
</style>
