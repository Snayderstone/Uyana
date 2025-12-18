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

	// State variables
	let facultades: Array<{ id: number; nombre: string }> = [];
	let carreras: Array<{ id: number; nombre: string; facultad_id: number }> = [];
	let filteredCarreras: Array<{ id: number; nombre: string }> = [];
	let loadingCatalogs = false;
	let saving = false;
	let error: string | null = null;
	let successMessage: string | null = null;

	// Form data with better structure
	let formData = {
		nombre: '',
		email: '',
		genero: '',
		facultad_id: null as number | null,
		carrera_id: null as number | null,
		acreditado: false,
		redes_sociales: '',
		foto: ''
	};

	// Photo upload state
	let photoFile: File | null = null;
	let photoInput: HTMLInputElement;
	let uploadingPhoto = false;

	// Validation with real-time feedback
	let errors: Record<string, string> = {};
	let isFormValid = false;

	// Available options
	let generos = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'];

	// Progress tracking for better UX
	let currentStep = 'basic'; // basic, academic, additional
	let completedSteps: string[] = [];

	/**
	 * Fetch catalogs (facultades and carreras)
	 */
	async function fetchCatalogs() {
		if (!browser) return;

		loadingCatalogs = true;
		error = null;

		try {
			// Fetch facultades
			const facultadesRes = await fetch('/api/admin/catalogs/facultades');
			const facultadesData = await facultadesRes.json();
			if (facultadesData.success) {
				facultades = facultadesData.data;
			}

			// Fetch carreras
			const carrerasRes = await fetch('/api/admin/catalogs/carreras');
			const carrerasData = await carrerasRes.json();
			if (carrerasData.success) {
				carreras = carrerasData.data;
				filteredCarreras = carreras; // Initially show all
			}
		} catch (err) {
			console.error('Error fetching catalogs:', err);
			error = 'Error al cargar la información académica. Podrá continuar sin seleccionar carrera.';
			// Don't block the form, just show warning
			setTimeout(() => {
				error = null;
			}, 5000);
		} finally {
			loadingCatalogs = false;
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
	 * Validate form with detailed feedback
	 */
	function validateForm(): boolean {
		errors = {};

		// Validar nombre (obligatorio)
		if (!formData.nombre.trim()) {
			errors.nombre = 'Por favor, ingrese el nombre completo del participante';
		} else if (formData.nombre.trim().length < 2) {
			errors.nombre = 'El nombre debe tener al menos 2 caracteres';
		} else if (formData.nombre.trim().length > 100) {
			errors.nombre = 'El nombre no puede exceder 100 caracteres';
		}

		// Validar email (opcional pero si se proporciona debe ser válido)
		if (formData.email && formData.email.trim()) {
			if (!isValidEmail(formData.email.trim())) {
				errors.email = 'Ingrese un email válido (ejemplo: usuario@dominio.com)';
			}
		}

		// Validar género (obligatorio)
		if (!formData.genero) {
			errors.genero = 'Por favor, seleccione el género del participante';
		}

		// Validar redes sociales (opcional pero si se proporciona debe ser válida)
		if (formData.redes_sociales && formData.redes_sociales.trim()) {
			const urls = formData.redes_sociales
				.trim()
				.split('|')
				.map((url) => url.trim());
			for (const url of urls) {
				if (url && !isValidUrl(url)) {
					errors.redes_sociales = `URL no válida: ${url}. Debe comenzar con https://`;
					break;
				}
			}
		}

		// Validar foto si se proporciona
		if (formData.foto && formData.foto.trim()) {
			const fotoValue = formData.foto.trim();
			if (!isBase64Image(fotoValue) && !isValidUrl(fotoValue)) {
				errors.foto = 'La foto debe ser una URL válida o datos base64';
			}
		}

		isFormValid = Object.keys(errors).length === 0;
		return isFormValid;
	}

	/**
	 * Validate email format
	 */
	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	/**
	 * Validate URL format
	 */
	function isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return url.startsWith('http://') || url.startsWith('https://');
		} catch {
			return false;
		}
	}

	/**
	 * Check if value is base64 image
	 */
	function isBase64Image(value: string): boolean {
		return value.startsWith('data:image/');
	}

	/**
	 * Handle form submit
	 */
	async function handleSubmit() {
		error = null;
		successMessage = null;

		if (!validateForm()) {
			error = 'Por favor, complete todos los campos requeridos correctamente.';
			return;
		}

		saving = true;

		try {
			// Prepare create data
			const createData = {
				nombre: formData.nombre.trim(),
				email: formData.email.trim() || null,
				genero: formData.genero,
				carrera_id: formData.carrera_id,
				acreditado: formData.acreditado,
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
				successMessage = `¡Excelente! El participante "${formData.nombre}" ha sido creado exitosamente. Redirigiendo...`;

				// Redirect after showing success message
				setTimeout(() => {
					if (result.data?.id) {
						goto(`/admin/participantes/${result.data.id}`);
					} else {
						goto('/admin/participantes/tabla');
					}
				}, 2000);
			} else {
				throw new Error(result.message || 'Error al crear el participante');
			}
		} catch (err) {
			console.error('Error creating participante:', err);
			if (err instanceof Error) {
				error = `Error al crear el participante: ${err.message}`;
			} else {
				error =
					'Ocurrió un error inesperado al crear el participante. Por favor, inténtelo nuevamente.';
			}
		} finally {
			saving = false;
		}
	}

	/**
	 * Reset form
	 */
	function handleReset() {
		if (confirm('¿Está seguro? Se perderán todos los datos ingresados.')) {
			formData = {
				nombre: '',
				email: '',
				genero: '',
				facultad_id: null,
				carrera_id: null,
				acreditado: false,
				redes_sociales: '',
				foto: ''
			};
			errors = {};
			photoFile = null;
			if (photoInput) photoInput.value = '';
			successMessage = null;
			error = null;
		}
	}

	/**
	 * Cancel creation
	 */
	function handleCancel() {
		const hasData =
			formData.nombre ||
			formData.email ||
			formData.genero ||
			formData.redes_sociales ||
			formData.foto;

		if (hasData) {
			if (confirm('¿Está seguro? Se perderán todos los datos ingresados.')) {
				goto('/admin/participantes/tabla');
			}
		} else {
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
	 * Get image source - handles both URL and base64
	 */
	function getImageSource(photoUrl: string): string {
		if (!photoUrl) return '';
		return photoUrl; // Works for both base64 and URLs
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
					Complete la información básica para registrar un participante en el sistema
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

	<!-- Progress Indicator -->
	<div class="progress-indicator">
		<div class="progress-step">
			<div
				class="step-number {formData.nombre && formData.genero
					? 'completed'
					: formData.nombre || formData.genero
					? 'current'
					: 'pending'}"
			>
				1
			</div>
			<span class="step-label">Información Básica</span>
		</div>
		<div class="step-divider" />
		<div class="progress-step">
			<div
				class="step-number {formData.facultad_id || formData.carrera_id ? 'current' : 'pending'}"
			>
				2
			</div>
			<span class="step-label">Información Académica</span>
		</div>
		<div class="step-divider" />
		<div class="progress-step">
			<div class="step-number {formData.redes_sociales || formData.foto ? 'current' : 'pending'}">
				3
			</div>
			<span class="step-label">Información Adicional</span>
		</div>
	</div>

	<!-- Preview Card -->
	{#if formData.nombre}
		<div class="preview-card">
			<div class="preview-header">
				<div class="preview-icon">{@html icons.eye}</div>
				<h3>Vista Previa del Participante</h3>
				<p class="preview-help">Así se verá la información del participante</p>
			</div>
			<div class="preview-content">
				<div class="profile-preview">
					<div
						class="profile-avatar-placeholder"
						class:has-photo={formData.foto}
						on:click={triggerPhotoUpload}
						on:keydown={(e) => e.key === 'Enter' && triggerPhotoUpload()}
						tabindex="0"
						role="button"
					>
						{#if uploadingPhoto}
							<div class="upload-spinner">
								<div class="spinner-sm" />
							</div>
						{:else if formData.foto}
							<img
								src={getImageSource(formData.foto)}
								alt={formData.nombre}
								on:error={() => (formData.foto = '')}
							/>
						{:else}
							{getInitials(formData.nombre)}
						{/if}
					</div>
					<!-- Hidden file input -->
					<input
						bind:this={photoInput}
						type="file"
						accept="image/*"
						on:change={handlePhotoSelect}
						style="display: none;"
					/>
					<div class="profile-info">
						<h4>{formData.nombre}</h4>
						<p class="profile-email">{formData.email || 'Sin email especificado'}</p>
						<div class="profile-badges">
							<span class="badge badge-genero">{formData.genero || 'Género no seleccionado'}</span>
							<span class="badge {formData.acreditado ? 'badge-success' : 'badge-warning'}">
								{formData.acreditado ? 'Acreditado' : 'No Acreditado'}
							</span>
							{#if formData.carrera_id}
								{@const carrera = carreras.find((c) => c.id === formData.carrera_id)}
								{#if carrera}
									<span class="badge badge-carrera">{carrera.nombre}</span>
								{/if}
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Form -->
	<form class="main-form" on:submit|preventDefault={handleSubmit}>
		<!-- Step 1: Información Básica -->
		<div class="form-section">
			<div class="section-header">
				<div class="section-icon step-1">{@html icons.user}</div>
				<div class="section-title">
					<h2>Paso 1: Información Básica</h2>
					<p>
						Datos principales del participante <span class="required-note"
							>*</span
						>
					</p>
				</div>
			</div>
			<div class="section-content">
				<div class="form-grid">
					<!-- Nombre -->
					<div class="form-group" class:has-error={errors.nombre}>
						<label for="nombre" class:error-label={errors.nombre}>
							Nombre Completo <span class="required">*</span>
						</label>
						<input
							type="text"
							id="nombre"
							bind:value={formData.nombre}
							class:error={errors.nombre}
							placeholder="Ejemplo: Juan Carlos Pérez López"
							required
							autocomplete="name"
						/>
						{#if errors.nombre}
							<span class="error-message">
								{@html icons.alert}
								{errors.nombre}
							</span>
						{/if}
						<span class="form-help"
							>Ingrese el nombre completo tal como aparece en documentos oficiales</span
						>
					</div>

					<!-- Email -->
					<div class="form-group" class:has-error={errors.email}>
						<label for="email" class:error-label={errors.email}>Correo Electrónico</label>
						<input
							type="email"
							id="email"
							bind:value={formData.email}
							class:error={errors.email}
							placeholder="ejemplo@universidad.edu.ec"
							autocomplete="email"
						/>
						{#if errors.email}
							<span class="error-message">
								{@html icons.alert}
								{errors.email}
							</span>
						{/if}
						<span class="form-help"
							>Opcional. Se utilizará para comunicaciones y notificaciones</span
						>
					</div>
				</div>

				<div class="form-grid">
					<!-- Género -->
					<div class="form-group" class:has-error={errors.genero}>
						<label for="genero" class:error-label={errors.genero}>
							Género <span class="required">*</span>
						</label>
						<select id="genero" bind:value={formData.genero} class:error={errors.genero} required>
							<option value="">-- Seleccione una opción --</option>
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

					<!-- Estado de Acreditación -->
					<div class="form-group">
						<div class="checkbox-container">
							<label class="checkbox-label" for="acreditado">
								<input type="checkbox" id="acreditado" bind:checked={formData.acreditado} />
								<span class="checkbox-custom" />
								<div class="checkbox-content">
									<span class="checkbox-text">Participante Acreditado</span>
									<span class="checkbox-help"
										>Marque si el participante cuenta con acreditación oficial</span
									>
								</div>
							</label>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Step 2: Información Académica -->
		<div class="form-section">
			<div class="section-header">
				<div class="section-icon step-2">{@html icons.book}</div>
				<div class="section-title">
					<h2>Paso 2: Información Académica</h2>
					<p>Datos de la institución y programa académico (opcional)</p>
				</div>
			</div>
			<div class="section-content">
				{#if loadingCatalogs}
					<div class="loading-catalogs">
						<div class="spinner-sm" />
						<p>Cargando información académica...</p>
					</div>
				{:else}
					<div class="form-grid">
						<!-- Facultad -->
						<div class="form-group">
							<label for="facultad">Facultad</label>
							<select
								id="facultad"
								bind:value={formData.facultad_id}
								on:change={() => filterCarrerasByFacultad(formData.facultad_id)}
							>
								<option value={null}>-- Sin facultad --</option>
								{#each facultades as facultad}
									<option value={facultad.id}>{facultad.nombre}</option>
								{/each}
							</select>
							<span class="form-help"
								>Primero seleccione la facultad para filtrar las carreras disponibles</span
							>
						</div>

						<!-- Carrera -->
						<div class="form-group">
							<label for="carrera">Carrera o Programa Académico</label>
							<select
								id="carrera"
								bind:value={formData.carrera_id}
								disabled={!formData.facultad_id}
							>
								<option value={null}>-- Sin carrera --</option>
								{#each filteredCarreras as carrera}
									<option value={carrera.id}>{carrera.nombre}</option>
								{/each}
							</select>
							{#if !formData.facultad_id}
								<span class="form-help"
									>Seleccione primero una facultad para ver las carreras disponibles</span
								>
							{:else}
								<span class="form-help"
									>Seleccione la carrera o programa académico del participante</span
								>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Step 3: Información Adicional -->
		<div class="form-section">
			<div class="section-header">
				<div class="section-icon step-3">{@html icons.link}</div>
				<div class="section-title">
					<h2>Paso 3: Información Adicional</h2>
					<p>Redes sociales, perfiles académicos y foto (opcional)</p>
				</div>
			</div>
			<div class="section-content">
				<!-- Photo Upload -->
				<div class="form-group photo-management">
					<label class="photo-label">Foto de Perfil</label>
					<div class="photo-actions">
						<button
							type="button"
							class="btn-photo"
							on:click={triggerPhotoUpload}
							disabled={uploadingPhoto}
						>
							{#if uploadingPhoto}
								<span class="spinner-sm" />
							{:else}
								{@html icons.upload}
							{/if}
							{uploadingPhoto ? 'Procesando...' : 'Subir Imagen'}
						</button>
						{#if formData.foto}
							<button
								type="button"
								class="btn-photo-remove"
								on:click={removePhoto}
								title="Eliminar foto"
							>
								{@html icons.delete}
							</button>
						{/if}
					</div>
					<div class="photo-info">
						<p class="help-text">📁 Formatos permitidos: JPG, PNG, GIF • Tamaño máximo: 5MB</p>
						<p class="help-text">💾 Las imágenes se guardan automáticamente en formato base64</p>
					</div>
				</div>

				<!-- Redes Sociales -->
				<div class="form-group" class:has-error={errors.redes_sociales}>
					<label for="redes_sociales" class:error-label={errors.redes_sociales}>
						Perfiles Académicos y Redes Sociales
					</label>
					<textarea
						id="redes_sociales"
						bind:value={formData.redes_sociales}
						placeholder="https://orcid.org/0000-0000-0000-0000 (ORCID)&#10;https://scholar.google.com/citations?user=... (Google Scholar)&#10;https://www.researchgate.net/profile/... (ResearchGate)"
						rows="4"
						class:error={errors.redes_sociales}
					/>
					{#if errors.redes_sociales}
						<span class="error-message">
							{@html icons.alert}
							{errors.redes_sociales}
						</span>
					{/if}
					<div class="social-help">
						<p class="help-text"><strong>Plataformas académicas recomendadas:</strong></p>
						<div class="platform-examples">
							<div class="platform-item">
								<strong>ORCID:</strong> <code>https://orcid.org/0000-0000-0000-0000</code>
							</div>
							<div class="platform-item">
								<strong>Google Scholar:</strong>
								<code>https://scholar.google.com/citations?user=...</code>
							</div>
							<div class="platform-item">
								<strong>ResearchGate:</strong> <code>https://www.researchgate.net/profile/...</code>
							</div>
							<div class="platform-item">
								<strong>LinkedIn:</strong> <code>https://www.linkedin.com/in/...</code>
							</div>
						</div>
						<p class="help-text">
							<strong>💡 Consejo:</strong> Agregue una URL por línea para mejor organización
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Form Actions -->
		<div class="form-actions">
			<button type="button" class="btn-secondary" on:click={handleCancel} disabled={saving}>
				Cancelar
			</button>
			<button type="button" class="btn-secondary" on:click={handleReset} disabled={saving}>
				{@html icons.refresh}
				Limpiar Formulario
			</button>
			<button type="submit" class="btn-primary" disabled={saving || !isFormValid}>
				{#if saving}
					<span class="spinner-sm" />
				{:else}
					{@html icons.check}
				{/if}
				{saving ? 'Creando Participante...' : 'Crear Participante'}
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
			color: #ededed;
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
		color: #a0aec0;
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
		border: 1px solid #2d3748;
		border-radius: 8px;
		color: #a0aec0;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;

		:global(svg) {
			width: 18px;
			height: 18px;
		}

		&:hover {
			background: #1a1f26;
			border-color: #6e29e7;
			color: #ededed;
			transform: translateX(-2px);
		}
	}

	// ==================== Progress Indicator ====================
	.progress-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 2.5rem;
		padding: 1.5rem;
		background: #1a1f26;
		border: 1px solid #2d3748;
		border-radius: 12px;
	}

	.progress-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		min-width: 120px;
	}

	.step-number {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1rem;
		transition: all 0.3s;

		&.completed {
			background: #48bb78;
			color: white;
		}

		&.current {
			background: #6e29e7;
			color: white;
			box-shadow: 0 0 0 3px rgba(110, 41, 231, 0.2);
		}

		&.pending {
			background: #2d3748;
			color: #718096;
			border: 2px solid #4a5568;
		}
	}

	.step-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: #a0aec0;
		text-align: center;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.step-divider {
		width: 60px;
		height: 2px;
		background: #2d3748;
		margin: 0 1rem;
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

	// ==================== Preview Card ====================
	.preview-card {
		background: linear-gradient(135deg, #1a1f26 0%, #212830 100%);
		border: 1px solid #2d3748;
		border-radius: 16px;
		margin-bottom: 2rem;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	}

	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		background: rgba(110, 41, 231, 0.05);
		border-bottom: 1px solid #2d3748;

		h3 {
			font-size: 1.125rem;
			font-weight: 600;
			color: #ededed;
			margin: 0;
		}

		.preview-help {
			font-size: 0.8rem;
			color: #a0aec0;
			margin: 0;
			font-style: italic;
		}
	}

	.preview-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: rgba(110, 41, 231, 0.2);
		border-radius: 8px;
		color: #8b5cf6;

		:global(svg) {
			width: 18px;
			height: 18px;
		}
	}

	.preview-content {
		padding: 2rem 1.5rem;
	}

	.profile-preview {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.profile-avatar-placeholder {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 2.5rem;
		color: white;
		flex-shrink: 0;
		position: relative;
		cursor: pointer;
		transition: all 0.3s;

		&:not(.has-photo) {
			background: linear-gradient(135deg, #6e29e7 0%, #8b5cf6 100%);
		}

		&.has-photo {
			overflow: hidden;
			border: 3px solid #6e29e7;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		&:hover {
			transform: scale(1.05);
		}
	}

	.upload-spinner {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.7);
		border-radius: 50%;
	}

	.profile-info {
		flex: 1;

		h4 {
			font-size: 1.5rem;
			font-weight: 600;
			color: #ededed;
			margin: 0 0 0.5rem 0;
		}
	}

	.profile-email {
		font-size: 1rem;
		color: #a0aec0;
		margin: 0 0 1rem 0;
	}

	.profile-badges {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: capitalize;

		&.badge-success {
			background: rgba(72, 187, 120, 0.15);
			color: #48bb78;
			border: 1px solid rgba(72, 187, 120, 0.3);
		}

		&.badge-warning {
			background: rgba(237, 137, 54, 0.15);
			color: #ed8936;
			border: 1px solid rgba(237, 137, 54, 0.3);
		}

		&.badge-genero {
			background: rgba(66, 153, 225, 0.15);
			color: #4299e1;
			border: 1px solid rgba(66, 153, 225, 0.3);
		}

		&.badge-carrera {
			background: rgba(139, 92, 246, 0.15);
			color: #8b5cf6;
			border: 1px solid rgba(139, 92, 246, 0.3);
		}
	}

	// ==================== Main Form ====================
	.main-form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.form-section {
		background: #1a1f26;
		border: 1px solid #2d3748;
		border-radius: 16px;
		overflow: hidden;
		transition: all 0.3s;

		&:hover {
			border-color: #4a5568;
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		}
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem 2rem;
		background: #212830;
		border-bottom: 1px solid #2d3748;
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
			color: #ededed;
			margin: 0 0 0.25rem 0;
		}

		p {
			font-size: 0.875rem;
			color: #a0aec0;
			margin: 0;
			line-height: 1.4;
		}
	}

	.required-note {
		color: #fc8181;
		font-weight: 500;
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
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;

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
		color: #e2e8f0;

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
	select,
	textarea {
		padding: 1rem;
		background: #0f1419;
		border: 2px solid #2d3748;
		border-radius: 8px;
		color: #ededed;
		font-size: 0.9rem;
		transition: all 0.2s;
		font-family: inherit;

		&:focus {
			outline: none;
			border-color: #6e29e7;
			box-shadow: 0 0 0 3px rgba(110, 41, 231, 0.1);
		}

		&::placeholder {
			color: #718096;
		}

		&.error {
			border-color: #fc8181;
			box-shadow: 0 0 0 3px rgba(252, 129, 129, 0.1);
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
			background: #1a202c;
		}
	}

	select {
		cursor: pointer;
	}

	textarea {
		min-height: 120px;
		resize: vertical;
		line-height: 1.5;
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

	.form-help,
	.help-text {
		font-size: 0.8rem;
		color: #a0aec0;
		line-height: 1.4;
		margin: 0;
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
		border: 2px solid #4a5568;
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
			color: #e2e8f0;
			font-weight: 600;
			display: block;
			margin-bottom: 0.25rem;
		}

		.checkbox-help {
			font-size: 0.8rem;
			color: #a0aec0;
			line-height: 1.4;
		}
	}

	// ==================== Photo Management ====================
	.photo-management {
		background: rgba(139, 92, 246, 0.05);
		border: 1px solid rgba(139, 92, 246, 0.1);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1rem;
	}

	.photo-label {
		font-size: 1rem;
		font-weight: 600;
		color: #e2e8f0;
		margin-bottom: 1rem;
		display: block;
	}

	.photo-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.btn-photo {
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

	.btn-photo-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: rgba(229, 62, 62, 0.1);
		border: 2px solid rgba(229, 62, 62, 0.3);
		border-radius: 8px;
		color: #fc8181;
		cursor: pointer;
		transition: all 0.2s;

		:global(svg) {
			width: 18px;
			height: 18px;
		}

		&:hover {
			background: rgba(229, 62, 62, 0.2);
			border-color: #e53e3e;
		}
	}

	.photo-info {
		.help-text {
			margin: 0.25rem 0;
		}
	}

	// ==================== Social Media Help ====================
	.social-help {
		margin-top: 0.75rem;
	}

	.platform-examples {
		margin: 0.75rem 0;
		padding: 1rem;
		background: rgba(66, 153, 225, 0.05);
		border: 1px solid rgba(66, 153, 225, 0.1);
		border-radius: 8px;
	}

	.platform-item {
		margin: 0.5rem 0;
		font-size: 0.8rem;
		color: #cbd5e0;

		strong {
			color: #4299e1;
		}

		code {
			font-family: 'Monaco', 'Menlo', monospace;
			color: #a0aec0;
			background: rgba(0, 0, 0, 0.3);
			padding: 0.25rem 0.5rem;
			border-radius: 4px;
			margin-left: 0.5rem;
		}
	}

	// ==================== Loading States ====================
	.loading-catalogs {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
		text-align: center;
		color: #a0aec0;
	}

	// ==================== Form Actions ====================
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 2rem 0;
		margin-top: 2rem;
		border-top: 1px solid #2d3748;
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
		background: #2d3748;
		color: #e2e8f0;
		border: 2px solid #4a5568;

		&:hover:not(:disabled) {
			background: #374151;
			border-color: #6b7280;
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

		.progress-indicator {
			flex-direction: column;
			gap: 1rem;
		}

		.step-divider {
			width: 2px;
			height: 30px;
			margin: 0;
		}

		.profile-preview {
			flex-direction: column;
			text-align: center;
			gap: 1rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.section-header {
			padding: 1rem 1.5rem;
		}

		.section-content {
			padding: 1.5rem;
		}

		.form-actions {
			flex-direction: column-reverse;
		}
	}
</style>
