<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import jsPDF from 'jspdf';
	import html2canvas from 'html2canvas';

	export let isOpen = false;
	export let availableCharts: Array<{
		id: string;
		name: string;
		title: string;
		category: string;
	}> = [];

	const dispatch = createEventDispatcher();

	let selectedCharts: Set<string> = new Set();
	let isExporting = false;
	let exportProgress = 0;
	let showPreview = false;
	let previewImages: Array<{ id: string; title: string; dataUrl: string }> = [];
	let isGeneratingPreview = false;

	function toggleChart(chartId: string) {
		if (selectedCharts.has(chartId)) {
			selectedCharts.delete(chartId);
		} else {
			selectedCharts.add(chartId);
		}
		selectedCharts = selectedCharts; // Trigger reactivity
	}

	function selectAll() {
		selectedCharts = new Set(availableCharts.map((c) => c.id));
	}

	function deselectAll() {
		selectedCharts = new Set();
	}

	function close() {
		isOpen = false;
		dispatch('close');
	}

	// Función para agregar encabezado con logo en cada página
	function addHeader(pdf: jsPDF, pageNumber: number) {
		const pageWidth = pdf.internal.pageSize.getWidth();
		const margin = 10;

		// Logo UYANA (texto estilizado)
		pdf.setFontSize(20);
		pdf.setFont('helvetica', 'bold');
		pdf.setTextColor(110, 41, 231); // Color primario
		pdf.text('UYANA', margin, margin + 6);

		// Línea decorativa debajo del logo
		pdf.setDrawColor(110, 41, 231);
		pdf.setLineWidth(0.5);
		pdf.line(margin, margin + 8, pageWidth - margin, margin + 8);

		// Título del documento
		pdf.setFontSize(12);
		pdf.setFont('helvetica', 'bold');
		pdf.setTextColor(26, 26, 26);
		pdf.text('Dashboard de Proyectos - Análisis de Gráficos', margin, margin + 14);

		// Número de página
		pdf.setFontSize(8);
		pdf.setFont('helvetica', 'normal');
		pdf.setTextColor(107, 114, 128);
		pdf.text(`Página ${pageNumber}`, pageWidth - margin - 15, margin + 6);

		return margin + 18; // Retorna la posición Y donde termina el encabezado
	}

	// Función para agregar footer en cada página
	function addFooter(pdf: jsPDF) {
		const pageWidth = pdf.internal.pageSize.getWidth();
		const pageHeight = pdf.internal.pageSize.getHeight();
		const margin = 10;

		// Línea superior del footer
		pdf.setDrawColor(110, 41, 231);
		pdf.setLineWidth(0.3);
		pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

		// Texto del footer
		pdf.setFontSize(8);
		pdf.setFont('helvetica', 'normal');
		pdf.setTextColor(107, 114, 128);

		const currentYear = new Date().getFullYear();
		const footerText = `Creado por UYANA © ${currentYear} - Todos los derechos reservados`;
		const textWidth = pdf.getTextWidth(footerText);
		const centerX = (pageWidth - textWidth) / 2;

		pdf.text(footerText, centerX, pageHeight - 8);

		// Fecha de generación
		const dateText = `Generado: ${new Date().toLocaleDateString(
			'es-ES'
		)} ${new Date().toLocaleTimeString('es-ES')}`;
		const dateWidth = pdf.getTextWidth(dateText);
		pdf.text(dateText, pageWidth - margin - dateWidth, pageHeight - 8);
	}

	async function captureChartImage(chartId: string): Promise<string | null> {
		// Buscar el contenedor del gráfico
		const chartContainer = document.getElementById(`chart-container-${chartId}`);
		if (!chartContainer) {
			console.warn(`Chart container not found: chart-container-${chartId}`);
			return null;
		}

		// Caso especial: stats-grid (no tiene canvas, es HTML puro)
		if (chartId === 'stats-grid' || chartId === 'participants-stats-grid') {
			try {
				// Buscar el contenedor interno de stats si existe
				const statsContainer = chartContainer.querySelector('.stats-grid') || chartContainer;

				// Esperar un momento para asegurar renderizado
				await new Promise((resolve) => setTimeout(resolve, 500));

				const canvas = await html2canvas(statsContainer as HTMLElement, {
					scale: 2,
					backgroundColor: '#1a1f26',
					logging: false,
					useCORS: true,
					allowTaint: true
				});

				const imgData = canvas.toDataURL('image/png', 1.0);

				return imgData;
			} catch (error) {
				console.error(`Error capturing stats-grid (${chartId}):`, error);
				return null;
			}
		}

		// Verificar si el gráfico está colapsado y expandirlo temporalmente
		const wasCollapsed = chartContainer.classList.contains('collapsed');
		if (wasCollapsed) {
			chartContainer.classList.remove('collapsed');
			await new Promise((resolve) => setTimeout(resolve, 800));
		}

		// Buscar el chart-body (puede estar visible u oculto)
		// Buscar el chart-body
		const chartBody = chartContainer.querySelector('.chart-body') as HTMLElement;
		// Buscar el canvas dentro del contenedor
		let chartCanvas = chartContainer.querySelector('canvas') as HTMLCanvasElement;

		// Si no hay canvas, esperar a que se renderice
		if (!chartCanvas && chartBody) {
			if (chartBody) {
				await new Promise((resolve) => setTimeout(resolve, 2000));
				chartCanvas = chartContainer.querySelector('canvas') as HTMLCanvasElement;
			}
		}

		if (!chartCanvas) {
			console.warn(`Chart canvas not found for: ${chartId}`);
			if (wasCollapsed) chartContainer.classList.add('collapsed');
			return null;
		}

		// Esperar renderizado completo
		await new Promise((resolve) => setTimeout(resolve, 800));

		// Capturar el chart-body completo para mejor calidad
		const targetElement = chartBody || chartCanvas;

		try {
			const canvas = await html2canvas(targetElement, {
				scale: 2,
				backgroundColor: '#1a1f26',
				logging: false,
				useCORS: true,
				allowTaint: true
			});

			const imgData = canvas.toDataURL('image/png', 1.0);

			// Restaurar estado colapsado
			if (wasCollapsed) chartContainer.classList.add('collapsed');

			return imgData;
		} catch (error) {
			console.error(`Error capturing chart ${chartId}:`, error);
			if (wasCollapsed) chartContainer.classList.add('collapsed');
			return null;
		}
	}

	async function generatePreview() {
		isGeneratingPreview = true;
		previewImages = [];

		try {
			const total = selectedCharts.size;
			let current = 0;

			for (const chartId of selectedCharts) {
				current++;
				exportProgress = Math.round((current / total) * 100);

				const chart = availableCharts.find((c) => c.id === chartId);
				if (!chart) continue;

				const dataUrl = await captureChartImage(chartId);
				if (dataUrl) {
					previewImages.push({
						id: chartId,
						title: chart.title,
						dataUrl
					});
				}
			}

			showPreview = true;
		} catch (error) {
			console.error('Error generating preview:', error);
			alert('❌ Error al generar la vista previa');
		} finally {
			isGeneratingPreview = false;
			exportProgress = 0;
		}
	}

	async function exportToPDF() {
		if (previewImages.length === 0) {
			alert('Por favor, genera primero la vista previa');
			return;
		}

		isExporting = true;
		exportProgress = 0;

		try {
			const pdf = new jsPDF('p', 'mm', 'a4');
			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();
			const margin = 10;
			const headerHeight = 18;
			const footerHeight = 15;
			const chartWidth = pageWidth - 2 * margin;
			const availableHeight = pageHeight - headerHeight - footerHeight - 2 * margin;
			const maxChartHeight = availableHeight / 1.5;

			let pageNumber = 1;
			let yPosition = addHeader(pdf, pageNumber);
			addFooter(pdf);

			const total = previewImages.length;

			for (let i = 0; i < previewImages.length; i++) {
				exportProgress = Math.round(((i + 1) / total) * 100);

				const { title, dataUrl } = previewImages[i];

				// Crear imagen para obtener dimensiones
				const img = new Image();
				img.src = dataUrl;
				await new Promise((resolve) => {
					img.onload = resolve;
				});

				// Calcular dimensiones
				const aspectRatio = img.height / img.width;
				let chartHeight = chartWidth * aspectRatio;

				if (chartHeight > maxChartHeight) {
					chartHeight = maxChartHeight;
				}

				// Verificar si necesitamos nueva página
				if (yPosition + chartHeight > pageHeight - footerHeight - margin) {
					pdf.addPage();
					pageNumber++;
					yPosition = addHeader(pdf, pageNumber);
					addFooter(pdf);
				}

				// Agregar título del gráfico
				pdf.setFontSize(11);
				pdf.setFont('helvetica', 'bold');
				pdf.setTextColor(26, 26, 26);
				pdf.text(title, margin, yPosition);
				yPosition += 6;

				// Agregar gráfico al PDF
				pdf.addImage(dataUrl, 'PNG', margin, yPosition, chartWidth, chartHeight, undefined, 'FAST');

				yPosition += chartHeight + 12;
			}

			// Guardar PDF
			const filename = `uyana-dashboard-proyectos-${new Date().getTime()}.pdf`;
			pdf.save(filename);

			alert('✅ PDF exportado exitosamente');
			close();
		} catch (error) {
			console.error('Error al exportar PDF:', error);
			alert('❌ Error al exportar el PDF. Por favor, intenta nuevamente.');
		} finally {
			isExporting = false;
			exportProgress = 0;
		}
	}

	function backToSelection() {
		showPreview = false;
		previewImages = [];
	}

	// Group charts by category
	$: groupedCharts = availableCharts.reduce((acc, chart) => {
		if (!acc[chart.category]) {
			acc[chart.category] = [];
		}
		acc[chart.category].push(chart);
		return acc;
	}, {} as Record<string, typeof availableCharts>);

	const categoryNames: Record<string, string> = {
		indices: 'Índices Generales',
		basicas: 'Estadísticas Básicas de Proyectos',
		overview: 'Resumen General',
		analytics: 'Análisis Detallado',
		geographic: 'Distribución Geográfica',
		presupuesto: 'Análisis de Presupuesto'
	};
</script>

{#if isOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={close}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h2>
					{#if showPreview}
						Vista Previa de PDF
					{:else}
						Exportar Gráficos a PDF
					{/if}
				</h2>
				<button class="close-btn" on:click={close} disabled={isExporting || isGeneratingPreview}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<div class="modal-body">
				{#if isGeneratingPreview || isExporting}
					<div class="export-progress">
						<div class="progress-spinner" />
						<p class="progress-text">
							{#if isGeneratingPreview}
								Generando vista previa...
							{:else}
								Exportando PDF...
							{/if}
						</p>
						<div class="progress-bar">
							<div class="progress-fill" style="width: {exportProgress}%" />
						</div>
						<p class="progress-percent">{exportProgress}%</p>
					</div>
				{:else if showPreview}
					<div class="preview-section">
						<div class="preview-info">
							<p>
								Se incluirán {previewImages.length} gráfico{previewImages.length !== 1 ? 's' : ''} en
								el PDF
							</p>
						</div>
						<div class="preview-grid">
							{#each previewImages as { id, title, dataUrl }}
								<div class="preview-item">
									<img src={dataUrl} alt={title} />
									<p class="preview-title">{title}</p>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<div class="selection-controls">
						<button class="control-btn" on:click={selectAll}> Seleccionar Todos </button>
						<button class="control-btn" on:click={deselectAll}> Deseleccionar Todos </button>
						<span class="selection-count"
							>{selectedCharts.size} de {availableCharts.length} seleccionados</span
						>
					</div>

					<div class="charts-list">
						{#each Object.entries(groupedCharts) as [category, charts]}
							<div class="category-group">
								<h3 class="category-title">{categoryNames[category] || category}</h3>
								<div class="chart-items">
									{#each charts as chart}
										<label class="chart-item">
											<input
												type="checkbox"
												checked={selectedCharts.has(chart.id)}
												on:change={() => toggleChart(chart.id)}
											/>
											<span class="chart-name">{chart.title}</span>
										</label>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				{#if showPreview}
					<button class="cancel-btn" on:click={backToSelection} disabled={isExporting}>
						Volver
					</button>
					<button class="export-btn" on:click={exportToPDF} disabled={isExporting}>
						{#if isExporting}
							Descargando...
						{:else}
							Descargar PDF
						{/if}
					</button>
				{:else}
					<button class="cancel-btn" on:click={close} disabled={isGeneratingPreview}>
						Cancelar
					</button>
					<button
						class="export-btn"
						on:click={generatePreview}
						disabled={isGeneratingPreview || selectedCharts.size === 0}
					>
						{#if isGeneratingPreview}
							Generando...
						{:else}
							Vista Previa
						{/if}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(15, 20, 25, 0.85);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fadeInModal 0.2s ease-out;
	}

	@keyframes fadeInModal {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background: #1a1f26;
		border: 1px solid #2d3748;
		border-radius: 12px;
		max-width: 900px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(30px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #2d3748;
		background: #151a1f;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #ededed;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: transparent;
		border: 1px solid #374151;
		border-radius: 6px;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.close-btn:hover:not(:disabled) {
		background: #2d3748;
		border-color: #4b5563;
		color: #ededed;
	}

	.close-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.modal-body {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
		background: #1a1f26;
	}

	.modal-body::-webkit-scrollbar {
		width: 8px;
	}

	.modal-body::-webkit-scrollbar-track {
		background: #151a1f;
	}

	.modal-body::-webkit-scrollbar-thumb {
		background: #374151;
		border-radius: 3px;
	}

	.selection-controls {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		padding-bottom: 1rem;
		border-bottom: 1px solid #2d3748;
	}

	.control-btn {
		padding: 0.5rem 1rem;
		background: #2d3748;
		border: 1px solid #374151;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		color: #ededed;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.control-btn:hover {
		background: #374151;
		border-color: #4b5563;
		color: #fff;
	}

	.selection-count {
		font-size: 0.875rem;
		color: #9ca3af;
		margin-left: auto;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
		font-weight: 500;
	}

	.charts-list {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.category-group {
		border: 1px solid #2d3748;
		border-radius: 8px;
		padding: 1rem;
		background: #151a1f;
	}

	.category-title {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #10b981;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.chart-items {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.chart-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 1px solid transparent;
	}

	.chart-item:hover {
		background: #1f2937;
		border-color: #374151;
	}

	.chart-item input[type='checkbox'] {
		width: 16px;
		height: 16px;
		cursor: pointer;
		accent-color: #10b981;
	}

	.chart-name {
		font-size: 0.875rem;
		color: #ededed;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 400;
	}

	.preview-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.preview-info {
		padding: 0.75rem 1rem;
		background: #151a1f;
		border: 1px solid #2d3748;
		border-radius: 8px;
		text-align: center;
	}

	.preview-info p {
		margin: 0;
		font-size: 0.875rem;
		color: #9ca3af;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.preview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
		max-height: 500px;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.preview-grid::-webkit-scrollbar {
		width: 8px;
	}

	.preview-grid::-webkit-scrollbar-track {
		background: #151a1f;
	}

	.preview-grid::-webkit-scrollbar-thumb {
		background: #374151;
		border-radius: 4px;
	}

	.preview-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background: #151a1f;
		border: 1px solid #2d3748;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.preview-item:hover {
		border-color: #10b981;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
	}

	.preview-item img {
		width: 100%;
		height: auto;
		border-radius: 6px;
		background: white;
		border: 1px solid #2d3748;
	}

	.preview-title {
		margin: 0;
		font-size: 0.75rem;
		color: #9ca3af;
		text-align: center;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 500;
	}

	.export-progress {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		gap: 1rem;
	}

	.progress-spinner {
		width: 48px;
		height: 48px;
		border: 4px solid #2d3748;
		border-top-color: #10b981;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.progress-text {
		font-size: 1rem;
		font-weight: 500;
		color: #ededed;
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.progress-bar {
		width: 100%;
		max-width: 300px;
		height: 8px;
		background: #2d3748;
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #10b981, #059669);
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.progress-percent {
		font-size: 1.5rem;
		font-weight: 700;
		color: #10b981;
		margin: 0;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.25rem 1.5rem;
		border-top: 1px solid #2d3748;
		background: #151a1f;
	}

	.cancel-btn,
	.export-btn {
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.cancel-btn {
		background: #2d3748;
		color: #ededed;
		border: 1px solid #374151;
	}

	.cancel-btn:hover:not(:disabled) {
		background: #374151;
		border-color: #4b5563;
	}

	.export-btn {
		background: #10b981;
		color: white;
		border: 1px solid #10b981;
	}

	.export-btn:hover:not(:disabled) {
		background: #059669;
		border-color: #059669;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}

	.cancel-btn:disabled,
	.export-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.modal-content {
			max-width: 95vw;
			max-height: 95vh;
		}

		.preview-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
