<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { ProyectoResponseDTO, CreateProyectoDTO } from '$lib/models/admin';
	import Toast from '$lib/components/admin/projects/Toast.svelte';

	const projectId = $page.params.id;
	const isEdit = projectId && projectId !== 'new';

	let loading = true;
	let saving = false;
	let showToast = false;
	let toastMessage = '';
	let toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

	// Catálogos
	let estados: any[] = [];
	let tipos: any[] = [];
	let instituciones: any[] = [];
	let areasConocimiento: any[] = [];
	let lineasInvestigacion: any[] = [];

	// Formulario
	let formData = {
		codigo: '',
		titulo: '',
		objetivo: '',
		para_siies: false,
		porcentaje_avance: 0,
		cantidad_meses: 0,
		fecha_inicio_planeada: '',
		fecha_fin_planeada: '',
		fecha_fin_real: '',
		monto_presupuesto_total: 0,
		impacto_cientifico: '',
		impacto_economico: '',
		impacto_social: '',
		otros_impactos: '',
		requiere_aval: false,
		estado_id: null as number | null,
		instituciones_ids: [] as number[],
		tipos_ids: [] as number[],
		areas_conocimiento_ids: [] as number[],
		lineas_investigacion_ids: [] as number[],
		fuentes_financiamiento_ids: [] as number[],
		participantes: [] as Array<{
			participante_id: number | null;
			cargo_id: number | null;
			regimen_dedicacion_id: number | null;
		}>
	};

	let errors: Record<string, string> = {};

	onMount(async () => {
		await loadCatalogos();
		if (isEdit) {
			await loadProject();
		}
		loading = false;
	});

	async function loadCatalogos() {
		try {
			const [estadosRes, tiposRes, institucionesRes, areasRes, lineasRes] = await Promise.all([
				fetch('/api/admin/proyectos/catalogos/estados'),
				fetch('/api/admin/proyectos/catalogos/tipos'),
				fetch('/api/admin/proyectos/catalogos/instituciones'),
				fetch('/api/admin/proyectos/catalogos/areas-conocimiento'),
				fetch('/api/admin/proyectos/catalogos/lineas-investigacion')
			]);

			estados = await estadosRes.json();
			tipos = await tiposRes.json();
			instituciones = await institucionesRes.json();
			areasConocimiento = await areasRes.json();
			lineasInvestigacion = await lineasRes.json();
		} catch (error) {
			showToast = true;
			toastMessage = '❌ Error al cargar catálogos';
			toastType = 'error';
		}
	}

	async function loadProject() {
		try {
			const response = await fetch(`/api/admin/proyectos/${projectId}`);
			if (!response.ok) throw new Error('Error al cargar proyecto');

			const project: ProyectoResponseDTO = await response.json();

			formData = {
				codigo: project.codigo,
				titulo: project.titulo,
				objetivo: project.objetivo || '',
				para_siies: project.para_siies,
				porcentaje_avance: project.porcentaje_avance,
				cantidad_meses: project.cantidad_meses,
				fecha_inicio_planeada: project.fecha_inicio_planeada.split('T')[0],
				fecha_fin_planeada: project.fecha_fin_planeada.split('T')[0],
				fecha_fin_real: project.fecha_fin_real ? project.fecha_fin_real.split('T')[0] : '',
				monto_presupuesto_total: project.monto_presupuesto_total,
				impacto_cientifico: project.impacto_cientifico || '',
				impacto_economico: project.impacto_economico || '',
				impacto_social: project.impacto_social || '',
				otros_impactos: project.otros_impactos || '',
				requiere_aval: project.requiere_aval,
				estado_id: project.estado.id,
				instituciones_ids: project.instituciones.map((i) => i.id),
				tipos_ids: project.tipos.map((t) => t.id),
				areas_conocimiento_ids: project.areas_conocimiento.map((a) => a.id),
				lineas_investigacion_ids: project.lineas_investigacion.map((l) => l.id),
				fuentes_financiamiento_ids: project.fuentes_financiamiento.map((f) => f.id),
				participantes: project.participantes.map((p) => ({
					participante_id: p.id,
					cargo_id: null,
					regimen_dedicacion_id: null
				}))
			};
		} catch (error) {
			showToast = true;
			toastMessage = '❌ Error al cargar el proyecto';
			toastType = 'error';
			setTimeout(() => goto('/admin/proyectos'), 2000);
		}
	}

	function validateForm(): boolean {
		errors = {};

		if (!formData.codigo.trim()) errors.codigo = 'El código es requerido';
		if (!formData.titulo.trim()) errors.titulo = 'El título es requerido';
		if (!formData.objetivo.trim()) errors.objetivo = 'El objetivo es requerido';
		if (!formData.estado_id) errors.estado_id = 'El estado es requerido';
		if (formData.instituciones_ids.length === 0)
			errors.instituciones_ids = 'Selecciona al menos una institución';
		if (formData.tipos_ids.length === 0) errors.tipos_ids = 'Selecciona al menos un tipo';
		if (!formData.fecha_inicio_planeada)
			errors.fecha_inicio_planeada = 'La fecha de inicio es requerida';
		if (!formData.fecha_fin_planeada)
			errors.fecha_fin_planeada = 'La fecha de finalización es requerida';
		if (formData.monto_presupuesto_total < 0)
			errors.monto_presupuesto_total = 'El presupuesto no puede ser negativo';
		if (formData.porcentaje_avance < 0 || formData.porcentaje_avance > 100) {
			errors.porcentaje_avance = 'El avance debe estar entre 0 y 100';
		}
		if (formData.cantidad_meses < 0)
			errors.cantidad_meses = 'La cantidad de meses no puede ser negativa';

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validateForm()) {
			showToast = true;
			toastMessage = '❌ Por favor corrige los errores del formulario';
			toastType = 'error';
			return;
		}

		saving = true;

		try {
			const url = isEdit ? `/api/admin/proyectos/${projectId}` : '/api/admin/proyectos';
			const method = isEdit ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al guardar');
			}

			showToast = true;
			toastMessage = `✅ Proyecto ${isEdit ? 'actualizado' : 'creado'} correctamente`;
			toastType = 'success';

			setTimeout(() => goto('/admin/proyectos'), 1500);
		} catch (error) {
			showToast = true;
			toastMessage = `❌ Error al ${isEdit ? 'actualizar' : 'crear'} el proyecto: ${error.message}`;
			toastType = 'error';
		} finally {
			saving = false;
		}
	}

	// Funciones de gestión de participantes simplificadas
	// Los participantes se seleccionan del catálogo existente

	// Fuentes de financiamiento se seleccionan de catálogo

	function toggleSelection(array: number[], value: number) {
		if (array.includes(value)) {
			return array.filter((v) => v !== value);
		} else {
			return [...array, value];
		}
	}
</script>

<svelte:head>
	<title>{isEdit ? 'Editar' : 'Nuevo'} Proyecto - Admin</title>
</svelte:head>

<Toast bind:visible={showToast} message={toastMessage} type={toastType} />

<div class="page-container">
	<!-- Header -->
	<div class="page-header">
		<h1>{isEdit ? '✏️ Editar' : '➕ Nuevo'} Proyecto</h1>
		<button class="back-btn" on:click={() => goto('/admin/proyectos')}> ← Volver </button>
	</div>

	{#if loading}
		<div class="loading-container">
			<div class="spinner" />
			<p>Cargando...</p>
		</div>
	{:else}
		<form on:submit|preventDefault={handleSubmit}>
			<!-- Información Básica -->
			<div class="form-section">
				<h2>📋 Información Básica</h2>

				<div class="form-row">
					<div class="form-group">
						<label for="codigo">Código <span class="required">*</span></label>
						<input
							id="codigo"
							type="text"
							bind:value={formData.codigo}
							class:error={errors.codigo}
							placeholder="Ej: PRY-2024-001"
						/>
						{#if errors.codigo}<span class="error-message">{errors.codigo}</span>{/if}
					</div>

					<div class="form-group">
						<label for="estado">Estado <span class="required">*</span></label>
						<select id="estado" bind:value={formData.estado_id} class:error={errors.estado_id}>
							<option value={null}>Selecciona un estado</option>
							{#each estados as estado}
								<option value={estado.id}>{estado.nombre}</option>
							{/each}
						</select>
						{#if errors.estado_id}<span class="error-message">{errors.estado_id}</span>{/if}
					</div>
				</div>

				<div class="form-group">
					<label for="titulo">Título <span class="required">*</span></label>
					<input
						id="titulo"
						type="text"
						bind:value={formData.titulo}
						class:error={errors.titulo}
						placeholder="Título del proyecto de investigación"
					/>
					{#if errors.titulo}<span class="error-message">{errors.titulo}</span>{/if}
				</div>

				<div class="form-group">
					<label for="objetivo">Objetivo <span class="required">*</span></label>
					<textarea
						id="objetivo"
						bind:value={formData.objetivo}
						class:error={errors.objetivo}
						rows="5"
						placeholder="Objetivo detallado del proyecto..."
					/>
					{#if errors.objetivo}<span class="error-message">{errors.objetivo}</span>{/if}
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="avance">Porcentaje de Avance (%)</label>
						<input
							id="avance"
							type="number"
							min="0"
							max="100"
							bind:value={formData.porcentaje_avance}
							class:error={errors.porcentaje_avance}
						/>
						{#if errors.porcentaje_avance}<span class="error-message"
								>{errors.porcentaje_avance}</span
							>{/if}
					</div>

					<div class="form-group">
						<label for="meses">Cantidad de Meses</label>
						<input
							id="meses"
							type="number"
							min="0"
							bind:value={formData.cantidad_meses}
							class:error={errors.cantidad_meses}
						/>
						{#if errors.cantidad_meses}<span class="error-message">{errors.cantidad_meses}</span
							>{/if}
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="checkbox-label">
							<input type="checkbox" bind:checked={formData.para_siies} />
							<span>Para SIIES</span>
						</label>
					</div>

					<div class="form-group">
						<label class="checkbox-label">
							<input type="checkbox" bind:checked={formData.requiere_aval} />
							<span>Requiere Aval</span>
						</label>
					</div>
				</div>
			</div>

			<!-- Fechas -->
			<div class="form-section">
				<h2>📅 Fechas</h2>

				<div class="form-row">
					<div class="form-group">
						<label for="fecha-inicio">Fecha Inicio Planeada <span class="required">*</span></label>
						<input
							id="fecha-inicio"
							type="date"
							bind:value={formData.fecha_inicio_planeada}
							class:error={errors.fecha_inicio_planeada}
						/>
						{#if errors.fecha_inicio_planeada}<span class="error-message"
								>{errors.fecha_inicio_planeada}</span
							>{/if}
					</div>

					<div class="form-group">
						<label for="fecha-fin"
							>Fecha Finalización Planeada <span class="required">*</span></label
						>
						<input
							id="fecha-fin"
							type="date"
							bind:value={formData.fecha_fin_planeada}
							class:error={errors.fecha_fin_planeada}
						/>
						{#if errors.fecha_fin_planeada}<span class="error-message"
								>{errors.fecha_fin_planeada}</span
							>{/if}
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="fecha-fin-real">Fecha Finalización Real</label>
						<input id="fecha-fin-real" type="date" bind:value={formData.fecha_fin_real} />
					</div>
				</div>
			</div>

			<!-- Presupuesto -->
			<div class="form-section">
				<h2>💰 Presupuesto</h2>

				<div class="form-row">
					<div class="form-group">
						<label for="presupuesto-total">Presupuesto Total (USD)</label>
						<input
							id="presupuesto-total"
							type="number"
							min="0"
							step="0.01"
							bind:value={formData.monto_presupuesto_total}
							class:error={errors.monto_presupuesto_total}
						/>
						{#if errors.monto_presupuesto_total}<span class="error-message"
								>{errors.monto_presupuesto_total}</span
							>{/if}
					</div>
				</div>
			</div>

			<!-- Clasificación -->
			<div class="form-section">
				<h2>🏷️ Clasificación</h2>

				<div class="form-group">
					<div class="field-label">Instituciones <span class="required">*</span></div>
					<div class="checkbox-grid">
						{#each instituciones as institucion}
							<label class="checkbox-item">
								<input
									type="checkbox"
									checked={formData.instituciones_ids.includes(institucion.id)}
									on:change={() =>
										(formData.instituciones_ids = toggleSelection(
											formData.instituciones_ids,
											institucion.id
										))}
								/>
								<span>{institucion.nombre}</span>
							</label>
						{/each}
					</div>
					{#if errors.instituciones_ids}<span class="error-message">{errors.instituciones_ids}</span
						>{/if}
				</div>

				<div class="form-group">
					<div class="field-label">Tipos <span class="required">*</span></div>
					<div class="checkbox-grid">
						{#each tipos as tipo}
							<label class="checkbox-item">
								<input
									type="checkbox"
									checked={formData.tipos_ids.includes(tipo.id)}
									on:change={() =>
										(formData.tipos_ids = toggleSelection(formData.tipos_ids, tipo.id))}
								/>
								<span>{tipo.nombre}</span>
							</label>
						{/each}
					</div>
					{#if errors.tipos_ids}<span class="error-message">{errors.tipos_ids}</span>{/if}
				</div>

				<div class="form-group">
					<div class="field-label">Áreas de Conocimiento</div>
					<div class="checkbox-grid">
						{#each areasConocimiento as area}
							<label class="checkbox-item">
								<input
									type="checkbox"
									checked={formData.areas_conocimiento_ids.includes(area.id)}
									on:change={() =>
										(formData.areas_conocimiento_ids = toggleSelection(
											formData.areas_conocimiento_ids,
											area.id
										))}
								/>
								<span>{area.nombre}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="form-group">
					<div class="field-label">Líneas de Investigación</div>
					<div class="checkbox-grid">
						{#each lineasInvestigacion as linea}
							<label class="checkbox-item">
								<input
									type="checkbox"
									checked={formData.lineas_investigacion_ids.includes(linea.id)}
									on:change={() =>
										(formData.lineas_investigacion_ids = toggleSelection(
											formData.lineas_investigacion_ids,
											linea.id
										))}
								/>
								<span>{linea.nombre}</span>
							</label>
						{/each}
					</div>
				</div>
			</div>

			<!-- Nota: Participantes -->
			<div class="form-section">
				<h2>👥 Participantes</h2>
				<div class="info-note">
					<p>
						ℹ️ <strong>Nota:</strong> La gestión de participantes del proyecto se debe configurar desde
						el módulo de Participantes. Los participantes con sus roles, cargos y regímenes de dedicación
						se asignarán al proyecto mediante las relaciones definidas en la base de datos.
					</p>
				</div>
			</div>

			<!-- Fuentes de Financiamiento -->
			<div class="form-section">
				<h2>💵 Fuentes de Financiamiento</h2>
				<div class="info-note">
					<p>
						ℹ️ <strong>Nota:</strong> Las fuentes de financiamiento se gestionan desde el catálogo de
						Fuentes de Financiamiento. Selecciona las fuentes aplicables a este proyecto desde el módulo
						correspondiente.
					</p>
				</div>
			</div>

			<!-- Form Actions -->
			<div class="form-actions">
				<button
					type="button"
					class="btn-secondary"
					on:click={() => goto('/admin/proyectos')}
					disabled={saving}
				>
					Cancelar
				</button>
				<button type="submit" class="btn-primary" disabled={saving}>
					{#if saving}
						⏳ Guardando...
					{:else}
						💾 {isEdit ? 'Actualizar' : 'Crear'} Proyecto
					{/if}
				</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.page-container {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 2rem;
		color: var(--color--text-primary, #1a1a1a);
	}

	.back-btn {
		padding: 0.75rem 1.5rem;
		border: 1px solid #ddd;
		background: white;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.back-btn:hover {
		background: #f5f5f5;
		border-color: #6e29e7;
		color: #6e29e7;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 4rem 2rem;
	}

	.spinner {
		width: 60px;
		height: 60px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #6e29e7;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.form-section {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.form-section h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		color: var(--color--text-primary, #1a1a1a);
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label,
	.field-label {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--color--text-primary, #1a1a1a);
	}

	.required {
		color: #f44336;
	}

	input[type='text'],
	input[type='number'],
	input[type='date'],
	select,
	textarea {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		font-size: 0.95rem;
		transition: all 0.2s;
	}

	input:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: #6e29e7;
		box-shadow: 0 0 0 3px rgba(110, 41, 231, 0.1);
	}

	input.error,
	select.error {
		border-color: #f44336;
	}

	.error-message {
		color: #f44336;
		font-size: 0.85rem;
		font-weight: 500;
	}

	textarea {
		resize: vertical;
		font-family: inherit;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		padding: 0.75rem;
	}

	.checkbox-label input[type='checkbox'] {
		width: 20px;
		height: 20px;
		cursor: pointer;
	}

	.checkbox-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.checkbox-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		transition: background 0.2s;
	}

	.checkbox-item:hover {
		background: white;
	}

	.checkbox-item input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.info-note {
		padding: 1.5rem;
		background: #e3f2fd;
		border-left: 4px solid #2196f3;
		border-radius: 8px;
	}

	.info-note p {
		margin: 0;
		line-height: 1.6;
		color: #1565c0;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 2rem 0;
	}

	.btn-primary,
	.btn-secondary {
		padding: 1rem 2rem;
		border: none;
		border-radius: 8px;
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: #6e29e7;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #5a1fc7;
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(110, 41, 231, 0.4);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.btn-secondary {
		background: white;
		color: #666;
		border: 2px solid #ddd;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #f5f5f5;
		border-color: #999;
	}

	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}

		.page-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.page-header h1 {
			font-size: 1.5rem;
		}

		.back-btn {
			width: 100%;
		}

		.form-section {
			padding: 1.5rem;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.checkbox-grid {
			grid-template-columns: 1fr;
		}
		.form-actions {
			flex-direction: column-reverse;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
		}
	}
</style>
