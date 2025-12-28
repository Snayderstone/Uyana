<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { ParticipanteResponseDTO } from '$lib/models/admin';
	import { icons } from '$lib/components/admin/shared';

	// Avatar helper
	function getInitials(name: string): string {
		const parts = name.trim().split(' ');
		if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
		return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
	}

	// Map gender from DB format to form format
	function mapGenderFromDB(gender: string): string {
		const genderMap: Record<string, string> = {
			m: 'Masculino',
			f: 'Femenino',
			Masculino: 'Masculino',
			Femenino: 'Femenino',

		};
		return genderMap[gender] || gender;
	}

	// Map gender from form format to DB format
	function mapGenderToDB(gender: string): string {
		const genderMap: Record<string, string> = {
			Masculino: 'm',
			Femenino: 'f',
		};
		return genderMap[gender] || gender;
	}

	// Get ID from URL
	$: participanteId = $page.params.id;

	// State
	let participante: ParticipanteResponseDTO | null = null;
	let loading = false;
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
	 * Fetch participant details
	 */
	async function fetchParticipante() {
		if (!browser || !participanteId) return;

		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/admin/participants/${participanteId}`);
			const result = await response.json();

			if (result.success && result.data) {
				participante = result.data;

				console.log('📥 Datos recibidos del API:', {
					participante_foto: participante.foto,
					participante_url_foto: participante.url_foto,
					genero_original: participante.genero
				});

				// Populate form data
				formData = {
					nombre: participante.nombre,
					email: participante.email || '',
					genero: mapGenderFromDB(participante.genero),
					acreditado: participante.acreditado,
					carrera_id: participante.carrera?.id || null,
					facultad_id: participante.carrera?.facultad?.id || null,
					redes_sociales: participante.redes_sociales || '',
					foto: participante.foto || participante.url_foto || ''
				};

				console.log('🔄 Género mapeado:', {
					original: participante.genero,
					mapeado: formData.genero
				});

				// Parse social networks into array
				redesSocialesList = parseRedesSocialesFromString(participante.redes_sociales);

				console.log('📱 Redes sociales cargadas:', redesSocialesList);

				console.log('📝 Form data poblado:', {
					foto: formData.foto
				});

				// Wait for catalogs to load, then filter carreras if facultad is selected
				await new Promise((resolve) => {
					if (carreras.length > 0) {
						resolve(true);
					} else {
						// Wait for catalogs to be loaded
						const checkCatalogs = () => {
							if (carreras.length > 0) {
								resolve(true);
							} else {
								setTimeout(checkCatalogs, 100);
							}
						};
						checkCatalogs();
					}
				});

				// Filter carreras if facultad is selected
				if (formData.facultad_id) {
					filterCarrerasByFacultad(formData.facultad_id);
				} else {
					// Si no hay facultad, mostrar todas las carreras
					filteredCarreras = carreras;
				}

				console.log('✅ Participante cargado:', {
					participante: participante.nombre,
					carrera: participante.carrera?.nombre,
					facultad: participante.carrera?.facultad?.nombre,
					formData: formData
				});
			} else {
				throw new Error(result.message || 'Participante no encontrado');
			}
		} catch (err) {
			console.error('Error fetching participante:', err);
			error = err instanceof Error ? err.message : 'Error al cargar el participante';
		} finally {
			loading = false;
		}
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
			// Prepare update data (remove facultad_id as it's not part of the participant model)
			const updateData = {
				nombre: formData.nombre.trim(),
				email: formData.email.trim() || null,
				genero: mapGenderToDB(formData.genero),
				acreditado: formData.acreditado,
				carrera_id: formData.carrera_id,
				redes_sociales: formData.redes_sociales.trim() || null,
				url_foto: formData.foto.trim() || null
			};

			console.log('📤 Enviando datos para actualización:', {
				participanteId,
				formData: formData.foto,
				updateData: updateData.url_foto
			});

			const response = await fetch(`/api/admin/participants/${participanteId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			const result = await response.json();

			if (result.success) {
				successMessage = `¡Perfecto! Los datos de ${formData.nombre} han sido actualizados correctamente. Redirigiendo...`;

				// Refresh participant data
				participante = result.data;

				// Redirect after 2 seconds
				setTimeout(() => {
					goto(`/admin/participantes/${participanteId}`);
				}, 2000);
			} else {
				throw new Error(result.message || 'Error al actualizar');
			}
		} catch (err) {
			console.error('Error updating participante:', err);
			if (err instanceof Error) {
				error = `Error al guardar: ${err.message}`;
			} else {
				error =
					'Ocurrió un error inesperado al actualizar el participante. Por favor, inténtelo nuevamente.';
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
			goto(`/admin/participantes/${participanteId}`);
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
			// Actualizar ambos campos
			formData.foto = base64Result;
			uploadingPhoto = false;

			// Mostrar mensaje de éxito
			successMessage =
				'Imagen convertida a base64 correctamente. Lista para guardar en BD (campo TEXT).';
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
	 * Detect if URL is base64
	 */
	function isBase64Image(url: string): boolean {
		return url.startsWith('data:image/');
	}

	/**
	 * Get image source - handles both URL and base64
	 */
	function getImageSource(photoUrl: string): string {
		if (!photoUrl) return '';

		// Si es base64, retornarlo directamente
		if (isBase64Image(photoUrl)) {
			return photoUrl;
		}

		// Si es URL, retornarlo directamente
		return photoUrl;
	}

	/**
	 * Handle manual URL change
	 */
	function handlePhotoUrlChange() {
		// Si el usuario pega una URL de base64, también actualizar el preview
		if (formData.foto && isBase64Image(formData.foto)) {
			successMessage = 'URL base64 detectada. La imagen se mostrará en el preview.';
			setTimeout(() => {
				successMessage = null;
			}, 2000);
		}
	}

	onMount(async () => {
		// Cargar catálogos primero
		await fetchCatalogs();
		// Luego cargar el participante
		await fetchParticipante();
	});
</script>

<div class="participante-editar-page">
	<!-- Header -->
	<div class="page-header">
		<div class="header-left">
			<button class="btn-back" on:click={() => goto(`/admin/participantes/${participanteId}`)}>
				{@html icons.arrowLeft}
				<span>Volver a detalles</span>
			</button>
			<div>
				<h1>Editar Participante</h1>
				<p class="page-subtitle">Modifica la información del participante</p>
			</div>
		</div>
	</div>

	<!-- Content -->
	{#if loading}
		<div class="loading-state">
			<div class="spinner" />
			<p>Cargando participante...</p>
		</div>
	{:else if error && !participante}
		<div class="error-state">
			<div class="error-icon">{@html icons.alert}</div>
			<h3>Error al cargar</h3>
			<p>{error}</p>
			<button class="btn-primary" on:click={fetchParticipante}>Reintentar</button>
		</div>
	{:else if participante}
		<form class="edit-form" on:submit|preventDefault={handleSubmit}>
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

			<!-- Form Sections -->
			<div class="form-grid">
				<!-- Basic Information -->
				<div class="form-section">
					<div class="section-header">
						<div class="section-icon">{@html icons.user}</div>
						<h3>Información Básica</h3>
					</div>
					<!-- Photo Upload -->
					<div class="form-group photo-upload-centered">
						<div class="photo-container">
							<div
								class="avatar-upload-area"
								class:uploading={uploadingPhoto}
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
										class="avatar-image"
									/>
									<div class="photo-overlay">
										{@html icons.camera}
										<span>Cambiar foto</span>
									</div>
								{:else}
									<div class="avatar-placeholder-upload">{getInitials(formData.nombre)}</div>
									<div class="photo-overlay">
										{@html icons.camera}
										<span>Subir foto</span>
									</div>
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
							{#if formData.foto}
								<button type="button" class="btn-remove-photo" on:click={removePhoto}>
									{@html icons.delete}
									Eliminar foto
								</button>
							{/if}
						</div>
						<p class="help-text">
							Haz clic en el avatar para subir una foto • Formatos: JPG, PNG, GIF • Máx: 5MB
						</p>
					</div>
					<div class="section-content">
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
								placeholder="Ingrese el nombre completo"
								required
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
							<label for="email" class:error-label={errors.email}>Email</label>
							<input
								type="email"
								id="email"
								bind:value={formData.email}
								class:error={errors.email}
								placeholder="correo@ejemplo.com"
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
								<option value="">Seleccione género</option>
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
						<div class="form-group form-group-checkbox">
							<label class="checkbox-label" for="acreditado">
								<input type="checkbox" id="acreditado" bind:checked={formData.acreditado} />
								<span>Participante Acreditado</span>
							</label>
							<p class="help-text">Marque si el participante está acreditado en el sistema</p>
						</div>
					</div>
				</div>
				<!-- Academic Information -->
				<div class="form-section form-section-full">
					<div class="section-header">
						<div class="section-icon">{@html icons.book}</div>
						<h3>Información Académica</h3>
					</div>
					<div class="section-content">
						<!-- Facultad -->
						<div class="form-group">
							<label for="facultad">Facultad</label>
							<select
								id="facultad"
								bind:value={formData.facultad_id}
								on:change={() => filterCarrerasByFacultad(formData.facultad_id)}
							>
								<option value={null}>Seleccione facultad</option>
								{#each facultades as facultad}
									<option value={facultad.id}>{facultad.nombre}</option>
								{/each}
							</select>
						</div>

						<!-- Carrera -->
						<div class="form-group">
							<label for="carrera">Carrera</label>
							<select
								id="carrera"
								bind:value={formData.carrera_id}
								disabled={!formData.facultad_id}
							>
								<option value={null}>Seleccione carrera</option>
								{#each filteredCarreras as carrera}
									<option value={carrera.id}>{carrera.nombre}</option>
								{/each}
							</select>
							{#if !formData.facultad_id}
								<p class="help-text">Primero seleccione una facultad</p>
							{/if}
						</div>
					</div>
				</div>

				<!-- Additional Information -->
				<div class="form-section form-section-full">
					<div class="section-header">
						<div class="section-icon">{@html icons.link}</div>
						<h3>Información Adicional</h3>
					</div>
					<div class="section-content">
						<!-- Redes Sociales -->
						<div class="form-group" class:has-error={errors.redes_sociales}>
							<span class="form-label" class:error-label={errors.redes_sociales}>Redes Sociales</span>
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
							<p class="help-text">
								Agregue URLs de perfiles en redes sociales (LinkedIn, Twitter, etc.). Puede agregar
								múltiples URLs.
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
				<button type="submit" class="btn-primary" disabled={saving}>
					{#if saving}
						<span class="spinner-sm" />
					{:else}
						{@html icons.save}
					{/if}
					{saving ? 'Guardando...' : 'Guardar Cambios'}
				</button>
			</div>
		</form>
	{/if}
</div>

<style lang="scss">
	.participante-editar-page {
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

		h1 {
			font-size: 2rem;
			font-weight: 700;
			color: var(--color--text);
			margin: 0;
			letter-spacing: -0.025em;
		}
	}

	.page-subtitle {
		font-size: 0.9375rem;
		color: var(--color--text-shade);
		margin: 0;
		font-weight: 400;
	}

	.btn-back {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: transparent;
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 6px;
		color: var(--color--text-shade);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;

		:global(svg) {
			width: 16px;
			height: 16px;
		}

		&:hover {
			background: rgba(var(--color--text-rgb), 0.03);
			border-color: rgba(var(--color--text-rgb), 0.15);
			color: var(--color--text);
		}
	}

	// ==================== Alerts ====================
	.alert {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;

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
			font-size: 0.875rem;
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

	// ==================== Form ====================
	.edit-form {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 12px;
		padding: 2rem;
		overflow: hidden;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 450px), 1fr));
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.form-section {
		min-width: 0;
		overflow: hidden;

		&.form-section-full {
			grid-column: 1 / -1;
		}
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid rgba(var(--color--text-rgb), 0.08);
		margin-bottom: 1.5rem;

		h3 {
			font-size: 1.125rem;
			font-weight: 600;
			color: var(--color--text);
			margin: 0;
		}
	}

	.section-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: rgba(110, 41, 231, 0.1);
		border: 1px solid rgba(110, 41, 231, 0.3);
		border-radius: 8px;
		flex-shrink: 0;
		transition: all 0.2s;

		:global(svg) {
			width: 18px;
			height: 18px;
			color: #8b5cf6;
		}
	}

	.form-section:hover .section-icon {
		background: rgba(110, 41, 231, 0.2);
		border-color: rgba(110, 41, 231, 0.5);
		transform: scale(1.05);
	}

	.section-content {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		min-width: 0;
		padding: 1.5rem 2rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;

		label,
		.form-label {
			font-size: 0.875rem;
			font-weight: 500;
			color: var(--color--text);

			.required {
				color: #fc8181;
			}
		}

		input,
		select {
			padding: 0.75rem 1rem;
			background: var(--color--input-background, rgba(255, 255, 255, 0.05));
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			border-radius: 6px;
			color: var(--color--text);
			font-size: 0.875rem;
			transition: all 0.2s;
			width: 100%;
			max-width: 100%;
			box-sizing: border-box;

			&::placeholder {
				color: var(--color--text-shade);
			}

			&:focus {
				outline: none;
				border-color: #6e29e7;
				box-shadow: 0 0 0 3px rgba(110, 41, 231, 0.1);
			}

			&.error {
				border-color: #fc8181;
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
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

			option {
				padding: 0.5rem;
				white-space: normal;
				word-wrap: break-word;
				background: var(--color--card-background, #1a1f26);
				color: var(--color--text, #ededed);
			}
		}
	}

	.form-group-checkbox {
		.checkbox-label {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			cursor: pointer;

			input[type='checkbox'] {
				width: 20px;
				height: 20px;
				cursor: pointer;
			}

			span {
				font-size: 0.875rem;
				color: var(--color--text);
			}
		}
	}

	.error-message {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: #fc8181;
		font-weight: 500;
		margin-top: 0.25rem;

		:global(svg) {
			width: 14px;
			height: 14px;
			flex-shrink: 0;
		}
	}

	// Estilos para campos con error
	.form-group.has-error {
		.section-content & {
			border-left: 3px solid #fc8181;
			padding-left: 0.75rem;
			margin-left: -0.75rem;
			background: rgba(252, 129, 129, 0.05);
			border-radius: 0 6px 6px 0;
		}
	}

	.error-label {
		color: #fc8181 !important;
		font-weight: 600 !important;

		.required {
			color: #e53e3e !important;
			font-weight: 700;
			text-shadow: 0 0 2px rgba(229, 62, 62, 0.3);
		}
	}

	// Mejorar el estilo del asterisco requerido
	.required {
		color: #fc8181;
		font-weight: 600;
		margin-left: 0.25rem;
		font-size: 1.1em;
	}

	.help-text {
		font-size: 0.75rem;
		color: var(--color--text-shade);
		margin: 0;
	}

	// ==================== Photo Management ====================
	.photo-upload-centered {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
		padding: 1.5rem 2rem;

		.photo-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 1rem;
		}

		.avatar-upload-area {
			position: relative;
			width: 120px;
			height: 120px;
			border-radius: 50%;
			overflow: hidden;
			border: 4px solid rgba(var(--color--text-rgb), 0.15);
			background: rgba(var(--color--text-rgb), 0.05);
			cursor: pointer;
			transition: all 0.2s;

			.avatar-image {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.avatar-placeholder-upload {
				width: 100%;
				height: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				background: linear-gradient(135deg, #6e29e7 0%, #8b5cf6 100%);
				color: white;
				font-size: 2.5rem;
				font-weight: 700;
				text-transform: uppercase;
			}

			.photo-overlay {
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: rgba(0, 0, 0, 0.7);
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				gap: 0.25rem;
				opacity: 0;
				transition: opacity 0.2s;

				span {
					font-size: 0.75rem;
					color: white;
					font-weight: 500;
				}

				:global(svg) {
					width: 20px;
					height: 20px;
					color: white;
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
			}

			&:hover {
				border-color: #6e29e7;
				transform: scale(1.05);

				.photo-overlay {
					opacity: 1;
				}
			}

			&.uploading {
				border-color: #6e29e7;
			}

			&:focus-visible {
				outline: 2px solid #6e29e7;
				outline-offset: 2px;
			}
		}

		.btn-remove-photo {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.5rem 1rem;
			background: rgba(229, 62, 62, 0.1);
			border: 1px solid rgba(229, 62, 62, 0.3);
			border-radius: 6px;
			color: #fc8181;
			font-size: 0.875rem;
			font-weight: 500;
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
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(229, 62, 62, 0.2);
			}
		}

		.help-text {
			text-align: center;
			max-width: 450px;
			font-size: 0.8rem;
			color: var(--color--text-shade);
			line-height: 1.5;
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

	// ==================== Form Actions ====================
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;

		:global(svg) {
			width: 16px;
			height: 16px;
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.btn-primary {
		background: #6e29e7;
		color: white;

		&:hover:not(:disabled) {
			background: #5a1fc7;
		}
	}

	.btn-secondary {
		background: rgba(var(--color--text-rgb), 0.05);
		color: var(--color--text);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);

		&:hover:not(:disabled) {
			background: rgba(var(--color--text-rgb), 0.1);
		}
	}

	// ==================== States ====================
	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid rgba(var(--color--text-rgb), 0.1);
		border-top-color: #6e29e7;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: 1rem;
	}

	.spinner-sm {
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

	.error-icon {
		width: 64px;
		height: 64px;
		color: #e53e3e;
		margin-bottom: 1rem;

		:global(svg) {
			width: 100%;
			height: 100%;
		}
	}

	.error-state {
		h3 {
			font-size: 1.5rem;
			color: #ededed;
			margin: 0 0 0.5rem 0;
		}

		p {
			color: #a0aec0;
			margin: 0 0 1.5rem 0;
		}
	}

	// ==================== Responsive ====================
	@media (max-width: 768px) {
		.page-header {
			.header-left h1 {
				font-size: 1.5rem;
			}
		}



		.edit-form {
			padding: 1.5rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.section-icon {
			width: 28px;
			height: 28px;

			:global(svg) {
				width: 16px;
				height: 16px;
			}
		}

		.form-actions {
			flex-direction: column-reverse;

			button {
				width: 100%;
				justify-content: center;
			}
		}


	}

	// ==================== Animations ====================
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.alert {
		animation: fadeIn 0.3s ease-out;
	}

	.form-section {
		animation: slideUp 0.4s ease-out;
	}

	.form-section:nth-child(2) {
		animation-delay: 0.1s;
	}

	.form-section:nth-child(3) {
		animation-delay: 0.2s;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	// Smooth transitions for form interactions
	.form-group input,
	.form-group select {
		transition: all 0.2s ease;

		&:hover:not(:focus) {
			border-color: #6a7280;
		}
	}

	// Loading states
	.upload-spinner .spinner-sm,
	button .spinner-sm {
		animation: spin 0.8s linear infinite;
	}
</style>
