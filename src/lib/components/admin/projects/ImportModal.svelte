<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let isOpen = false;

	const dispatch = createEventDispatcher();

	let fileInput: HTMLInputElement;
	let selectedFile: File | null = null;
	let isDragging = false;
	let isUploading = false;
	let uploadProgress = 0;
	let uploadResult: {
		success: boolean;
		message: string;
		imported?: number;
		errors?: Array<{ row: number; errors: string[] }>;
	} | null = null;

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			selectedFile = target.files[0];
			validateFile();
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;

		if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
			selectedFile = event.dataTransfer.files[0];
			validateFile();
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function validateFile() {
		if (!selectedFile) return;

		const validTypes = [
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
			'application/vnd.ms-excel', // .xls
			'text/csv',
			'application/json'
		];

		if (!validTypes.includes(selectedFile.type)) {
			uploadResult = {
				success: false,
				message: 'Tipo de archivo no válido. Use Excel (.xlsx, .xls), CSV o JSON.'
			};
			selectedFile = null;
		}
	}

	async function handleUpload() {
		if (!selectedFile) return;

		isUploading = true;
		uploadProgress = 0;
		uploadResult = null;

		try {
			const formData = new FormData();
			formData.append('file', selectedFile);

			// Simulate progress
			const progressInterval = setInterval(() => {
				if (uploadProgress < 90) {
					uploadProgress += 10;
				}
			}, 200);

			const response = await fetch('/api/admin/import', {
				method: 'POST',
				body: formData
			});

			clearInterval(progressInterval);
			uploadProgress = 100;

			const result = await response.json();

			if (response.ok) {
				uploadResult = {
					success: true,
					message: `✅ ${result.imported || 0} proyectos importados correctamente`,
					imported: result.imported,
					errors: result.errors
				};

				// Notify parent component
				dispatch('importSuccess', {
					imported: result.imported,
					errors: result.errors
				});

				// Auto-close after success
				setTimeout(() => {
					if (uploadResult?.success && (!uploadResult.errors || uploadResult.errors.length === 0)) {
						handleClose();
					}
				}, 2000);
			} else {
				uploadResult = {
					success: false,
					message: result.message || 'Error al importar proyectos',
					errors: result.errors
				};
			}
		} catch (error) {
			uploadResult = {
				success: false,
				message: '❌ Error de conexión al importar proyectos'
			};
		} finally {
			isUploading = false;
		}
	}

	function handleClose() {
		if (!isUploading) {
			isOpen = false;
			selectedFile = null;
			uploadProgress = 0;
			uploadResult = null;
			dispatch('close');
		}
	}

	function openFileDialog() {
		fileInput?.click();
	}

	function removeFile() {
		selectedFile = null;
		uploadResult = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function downloadTemplate() {
		window.open('/ejemplo_importacion_proyectos.csv', '_blank');
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}
</script>

{#if isOpen}
	<div
		class="modal-backdrop"
		on:click={handleClose}
		on:keydown={(e) => e.key === 'Escape' && handleClose()}
		role="button"
		tabindex="0"
	>
		<div class="modal-content" on:click|stopPropagation on:keydown|stopPropagation role="dialog">
			<!-- Header -->
			<div class="modal-header">
				<h2>📥 Importar Proyectos</h2>
				<button class="close-btn" on:click={handleClose} disabled={isUploading}> ✕ </button>
			</div>

			<!-- Body -->
			<div class="modal-body">
				<!-- Instructions -->
				<div class="instructions">
					<p>
						<strong>📋 Formatos aceptados:</strong> Excel (.xlsx, .xls), CSV (.csv), JSON (.json)
					</p>
					<p>
						<strong>📌 Importante:</strong> El archivo debe contener las columnas requeridas según el
						formato.
					</p>
					<button class="btn-link" on:click={downloadTemplate}>
						📄 Descargar plantilla de ejemplo
					</button>
				</div>

				<!-- Upload Area -->
				{#if !selectedFile && !uploadResult}
					<div
						class="upload-area"
						class:dragging={isDragging}
						on:drop={handleDrop}
						on:dragover={handleDragOver}
						on:dragleave={handleDragLeave}
						on:click={openFileDialog}
						on:keydown={(e) => e.key === 'Enter' && openFileDialog()}
						role="button"
						tabindex="0"
					>
						<div class="upload-icon">📁</div>
						<p class="upload-text">
							Arrastra un archivo aquí o <strong>haz clic para seleccionar</strong>
						</p>
						<p class="upload-hint">Excel, CSV o JSON (máximo 10MB)</p>
					</div>

					<input
						type="file"
						bind:this={fileInput}
						on:change={handleFileSelect}
						accept=".xlsx,.xls,.csv,.json"
						style="display: none;"
					/>
				{/if}

				<!-- Selected File -->
				{#if selectedFile && !uploadResult}
					<div class="selected-file">
						<div class="file-info">
							<div class="file-icon">📄</div>
							<div class="file-details">
								<p class="file-name">{selectedFile.name}</p>
								<p class="file-size">{formatFileSize(selectedFile.size)}</p>
							</div>
						</div>
						<button class="remove-btn" on:click={removeFile} disabled={isUploading}> 🗑️ </button>
					</div>

					<!-- Upload Progress -->
					{#if isUploading}
						<div class="progress-container">
							<div class="progress-bar">
								<div class="progress-fill" style="width: {uploadProgress}%" />
							</div>
							<p class="progress-text">Importando... {uploadProgress}%</p>
						</div>
					{/if}
				{/if}

				<!-- Upload Result -->
				{#if uploadResult}
					<div
						class="result-container"
						class:success={uploadResult.success}
						class:error={!uploadResult.success}
					>
						<div class="result-icon">
							{uploadResult.success ? '✅' : '❌'}
						</div>
						<p class="result-message">{uploadResult.message}</p>

						<!-- Errors Detail -->
						{#if uploadResult.errors && uploadResult.errors.length > 0}
							<div class="errors-detail">
								<p class="errors-title">
									⚠️ Errores encontrados ({uploadResult.errors.length} filas):
								</p>
								<div class="errors-list">
									{#each uploadResult.errors as error}
										<div class="error-item">
											<strong>Fila {error.row}:</strong>
											<ul>
												{#each error.errors as msg}
													<li>{msg}</li>
												{/each}
											</ul>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="modal-footer">
				<button class="btn-secondary" on:click={handleClose} disabled={isUploading}>
					{uploadResult ? 'Cerrar' : 'Cancelar'}
				</button>
				{#if selectedFile && !uploadResult}
					<button class="btn-primary" on:click={handleUpload} disabled={isUploading}>
						{#if isUploading}
							⏳ Importando...
						{:else}
							📤 Importar Proyectos
						{/if}
					</button>
				{/if}
				{#if uploadResult && !uploadResult.success}
					<button class="btn-primary" on:click={removeFile}> 🔄 Intentar de Nuevo </button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 16px;
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: modalSlideIn 0.3s ease-out;
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--color--text-primary, #1a1a1a);
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #666;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.close-btn:hover:not(:disabled) {
		background: #f5f5f5;
		color: #000;
	}

	.close-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.instructions {
		background: #f0f7ff;
		border-left: 4px solid #2196f3;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.instructions p {
		margin: 0.5rem 0;
		font-size: 0.9rem;
		color: #333;
	}

	.btn-link {
		background: none;
		border: none;
		color: #6e29e7;
		font-weight: 600;
		cursor: pointer;
		padding: 0.5rem 0;
		margin-top: 0.5rem;
		text-decoration: underline;
		font-size: 0.9rem;
	}

	.btn-link:hover {
		color: #5a1fc7;
	}

	.upload-area {
		border: 2px dashed #ddd;
		border-radius: 12px;
		padding: 3rem 2rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.3s;
		background: #fafafa;
	}

	.upload-area:hover,
	.upload-area.dragging {
		border-color: #6e29e7;
		background: #f5f0ff;
	}

	.upload-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.upload-text {
		font-size: 1rem;
		color: #333;
		margin-bottom: 0.5rem;
	}

	.upload-hint {
		font-size: 0.85rem;
		color: #666;
	}

	.selected-file {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 12px;
		margin-bottom: 1rem;
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}

	.file-icon {
		font-size: 2rem;
	}

	.file-details {
		flex: 1;
	}

	.file-name {
		font-weight: 600;
		color: var(--color--text-primary, #1a1a1a);
		margin: 0 0 0.25rem 0;
	}

	.file-size {
		font-size: 0.85rem;
		color: #666;
		margin: 0;
	}

	.remove-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.remove-btn:hover:not(:disabled) {
		background: rgba(244, 67, 54, 0.1);
	}

	.progress-container {
		margin: 1.5rem 0;
	}

	.progress-bar {
		height: 8px;
		background: #e0e0e0;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #6e29e7, #9b59ff);
		transition: width 0.3s;
	}

	.progress-text {
		text-align: center;
		font-size: 0.9rem;
		color: #666;
		font-weight: 600;
	}

	.result-container {
		padding: 1.5rem;
		border-radius: 12px;
		text-align: center;
	}

	.result-container.success {
		background: #e8f5e9;
		border: 1px solid #4caf50;
	}

	.result-container.error {
		background: #ffebee;
		border: 1px solid #f44336;
	}

	.result-icon {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.result-message {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
	}

	.result-container.success .result-message {
		color: #2e7d32;
	}

	.result-container.error .result-message {
		color: #c62828;
	}

	.errors-detail {
		margin-top: 1.5rem;
		text-align: left;
		background: white;
		padding: 1rem;
		border-radius: 8px;
		max-height: 300px;
		overflow-y: auto;
	}

	.errors-title {
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: #d32f2f;
	}

	.errors-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.error-item {
		font-size: 0.85rem;
		padding: 0.75rem;
		background: #fff3cd;
		border-left: 3px solid #ff9800;
		border-radius: 4px;
	}

	.error-item strong {
		color: #e65100;
	}

	.error-item ul {
		margin: 0.5rem 0 0 1.5rem;
		padding: 0;
	}

	.error-item li {
		margin: 0.25rem 0;
		color: #666;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 1.5rem;
		border-top: 1px solid #e0e0e0;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: #6e29e7;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #5a1fc7;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(110, 41, 231, 0.3);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.btn-secondary {
		background: white;
		color: #666;
		border: 1px solid #ddd;
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
		.modal-content {
			max-width: 100%;
			max-height: 100vh;
			border-radius: 0;
		}

		.upload-area {
			padding: 2rem 1rem;
		}

		.modal-footer {
			flex-direction: column-reverse;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
		}
	}
</style>
