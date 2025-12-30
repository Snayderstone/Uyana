<script lang="ts">
	import { onMount } from 'svelte';

	export let value = '';
	export let placeholder = 'Escribe tu contenido aquí...';
	export let disabled = false;

	let editor: HTMLDivElement;
	let isInitialized = false;

	// Modal para insertar enlaces
	let showLinkModal = false;
	let linkText = '';
	let linkUrl = '';
	let savedSelection: Range | null = null;
	let editingLink: HTMLAnchorElement | null = null; // Para editar enlaces existentes

	onMount(() => {
		if (editor) {
			editor.innerHTML = value;
			isInitialized = true;
		}
	});

	$: if (isInitialized && editor && !disabled) {
		// Sincronizar cambios externos
		if (editor.innerHTML !== value) {
			const selection = saveSelection();
			editor.innerHTML = value;
			if (selection) restoreSelection(selection);
		}
	}

	function handleInput() {
		value = editor.innerHTML;
	}

	function execCommand(command: string, value?: string) {
		if (disabled) return;
		document.execCommand(command, false, value);
		editor.focus();
		handleInput();
	}

	function insertHeading(level: number) {
		execCommand('formatBlock', `h${level}`);
	}

	function formatParagraph() {
		execCommand('formatBlock', 'p');
	}

	function insertList(ordered: boolean) {
		execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
	}

	function openLinkModal() {
		if (disabled) return;

		// Guardar la selección actual
		savedSelection = saveSelection();

		// Obtener texto seleccionado si existe
		const sel = window.getSelection();
		if (sel && sel.toString()) {
			linkText = sel.toString();
		} else {
			linkText = '';
		}

		linkUrl = '';
		editingLink = null;
		showLinkModal = true;
	}

	function editLink(link: HTMLAnchorElement) {
		if (disabled) return;

		editingLink = link;
		linkText = link.textContent || '';
		linkUrl = link.href;
		showLinkModal = true;
	}

	function handleEditorClick(e: MouseEvent) {
		if (disabled) return;

		const target = e.target as HTMLElement;
		// Si se hace clic en un enlace, abrir modal de edición
		if (target.tagName === 'A') {
			e.preventDefault();
			editLink(target as HTMLAnchorElement);
		}
	}

	function insertLinkFromModal() {
		if (!linkUrl.trim()) {
			alert('Por favor ingresa una URL');
			return;
		}

		// Si estamos editando un enlace existente
		if (editingLink) {
			editingLink.href = linkUrl;
			editingLink.textContent = linkText.trim() || linkUrl;
			editingLink.setAttribute('target', '_blank');
			editor.focus();
			handleInput();
			closeLinkModal();
			return;
		}

		// Restaurar la selección
		if (savedSelection) {
			restoreSelection(savedSelection);
		}

		// Si hay texto, usarlo, sino usar la URL
		const displayText = linkText.trim() || linkUrl;

		// Si no hay texto seleccionado, insertar el texto y luego crear el enlace
		const sel = window.getSelection();
		if (!sel || sel.toString() === '') {
			document.execCommand(
				'insertHTML',
				false,
				`<a href="${linkUrl}" target="_blank">${displayText}</a>&nbsp;`
			);
		} else {
			// Si hay texto seleccionado, solo crear el enlace
			document.execCommand('createLink', false, linkUrl);
			// Agregar target="_blank" al enlace creado
			const link = sel.anchorNode?.parentElement;
			if (link && link.tagName === 'A') {
				link.setAttribute('target', '_blank');
			}
		}

		editor.focus();
		handleInput();
		closeLinkModal();
	}

	function closeLinkModal() {
		showLinkModal = false;
		linkText = '';
		linkUrl = '';
		savedSelection = null;
		editingLink = null;
	}

	function removeLink() {
		if (editingLink) {
			// Reemplazar el enlace con su texto
			const text = editingLink.textContent || '';
			const textNode = document.createTextNode(text);
			editingLink.parentNode?.replaceChild(textNode, editingLink);
			editor.focus();
			handleInput();
			closeLinkModal();
		}
	}

	function insertImage() {
		const url = prompt('Ingresa la URL de la imagen:');
		if (url) {
			execCommand('insertImage', url);
		}
	}

	function saveSelection() {
		const sel = window.getSelection();
		if (sel && sel.rangeCount > 0) {
			return sel.getRangeAt(0);
		}
		return null;
	}

	function restoreSelection(range: Range) {
		const sel = window.getSelection();
		if (sel) {
			sel.removeAllRanges();
			sel.addRange(range);
		}
	}

	function clearFormatting() {
		execCommand('removeFormat');
	}
</script>

<div class="rich-editor" class:disabled>
	<div class="toolbar">
		<div class="toolbar-group">
			<button
				type="button"
				class="toolbar-btn"
				on:click={formatParagraph}
				title="Texto normal"
				{disabled}
			>
				<span class="icon">N</span>
			</button>
			<button
				type="button"
				class="toolbar-btn"
				on:click={() => insertHeading(1)}
				title="Título 1"
				{disabled}
			>
				<span class="icon">H1</span>
			</button>
			<button
				type="button"
				class="toolbar-btn"
				on:click={() => insertHeading(2)}
				title="Título 2"
				{disabled}
			>
				<span class="icon">H2</span>
			</button>
			<button
				type="button"
				class="toolbar-btn"
				on:click={() => insertHeading(3)}
				title="Título 3"
				{disabled}
			>
				<span class="icon">H3</span>
			</button>
		</div>

		<div class="toolbar-separator" />

		<div class="toolbar-group">
			<button
				type="button"
				class="toolbar-btn"
				on:click={() => execCommand('bold')}
				title="Negrita (Ctrl+B)"
				{disabled}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
					<path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
				</svg>
			</button>
			<button
				type="button"
				class="toolbar-btn"
				on:click={() => execCommand('italic')}
				title="Cursiva (Ctrl+I)"
				{disabled}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<line x1="19" y1="4" x2="10" y2="4" />
					<line x1="14" y1="20" x2="5" y2="20" />
					<line x1="15" y1="4" x2="9" y2="20" />
				</svg>
			</button>
			<button
				type="button"
				class="toolbar-btn"
				on:click={() => execCommand('underline')}
				title="Subrayado (Ctrl+U)"
				{disabled}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
					<line x1="4" y1="21" x2="20" y2="21" />
				</svg>
			</button>
		</div>

		<div class="toolbar-separator" />

		<div class="toolbar-group">
			<button
				type="button"
				class="toolbar-btn"
				on:click={() => insertList(false)}
				title="Lista con viñetas"
				{disabled}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<line x1="8" y1="6" x2="21" y2="6" />
					<line x1="8" y1="12" x2="21" y2="12" />
					<line x1="8" y1="18" x2="21" y2="18" />
					<line x1="3" y1="6" x2="3.01" y2="6" />
					<line x1="3" y1="12" x2="3.01" y2="12" />
					<line x1="3" y1="18" x2="3.01" y2="18" />
				</svg>
			</button>
			<button
				type="button"
				class="toolbar-btn"
				on:click={() => insertList(true)}
				title="Lista numerada"
				{disabled}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<line x1="10" y1="6" x2="21" y2="6" />
					<line x1="10" y1="12" x2="21" y2="12" />
					<line x1="10" y1="18" x2="21" y2="18" />
					<path d="M4 6h1v4" />
					<path d="M4 10h2" />
					<path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
				</svg>
			</button>
		</div>

		<div class="toolbar-separator" />

		<div class="toolbar-group">
			<button
				type="button"
				class="toolbar-btn"
				on:click={openLinkModal}
				title="Insertar enlace"
				{disabled}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
					<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
				</svg>
			</button>
			<button
				type="button"
				class="toolbar-btn"
				on:click={insertImage}
				title="Insertar imagen"
				{disabled}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
					<circle cx="8.5" cy="8.5" r="1.5" />
					<polyline points="21 15 16 10 5 21" />
				</svg>
			</button>
		</div>

		<div class="toolbar-separator" />

		<div class="toolbar-group">
			<button
				type="button"
				class="toolbar-btn"
				on:click={clearFormatting}
				title="Limpiar formato"
				{disabled}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<polyline points="4 7 4 4 20 4 20 7" />
					<line x1="9" y1="20" x2="15" y2="20" />
					<line x1="12" y1="4" x2="12" y2="20" />
				</svg>
			</button>
		</div>
	</div>

	<div
		bind:this={editor}
		class="editor-content"
		contenteditable={!disabled}
		on:input={handleInput}
		on:click={handleEditorClick}
		on:keydown={(e) => {
			// Manejador de teclado para accesibilidad
			// @ts-ignore
			if (e.key === 'Enter' && e.target?.tagName === 'A') {
				e.preventDefault();
				// @ts-ignore
				editLink(e.target);
			}
		}}
		on:paste={(e) => {
			// Pegar como texto plano
			e.preventDefault();
			const text = e.clipboardData?.getData('text/plain');
			if (text) {
				document.execCommand('insertText', false, text);
			}
		}}
		data-placeholder={placeholder}
		role="textbox"
		aria-multiline="true"
		aria-label="Editor de contenido"
		tabindex="0"
	/>
</div>

<!-- Modal para insertar enlace -->
{#if showLinkModal}
	<div
		class="modal-overlay"
		on:click={closeLinkModal}
		on:keydown={(e) => {
			if (e.key === 'Escape') closeLinkModal();
		}}
		role="button"
		tabindex="0"
		aria-label="Cerrar modal"
	>
		<div
			class="modal-content"
			on:click|stopPropagation
			on:keydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
		>
			<div class="modal-header">
				<h3>{editingLink ? 'Editar Enlace' : 'Insertar Enlace'}</h3>
				<button type="button" class="modal-close" on:click={closeLinkModal} aria-label="Cerrar">
					<svg
						width="20"
						height="20"
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
				<div class="form-group">
					<label for="link-text">Texto a mostrar</label>
					<input
						type="text"
						id="link-text"
						bind:value={linkText}
						placeholder="Ej: Visita nuestro sitio web"
						class="modal-input"
						autocomplete="off"
					/>
					<small class="help-text"
						>El texto que verán los usuarios (opcional, si está vacío se usa la URL)</small
					>
				</div>

				<div class="form-group">
					<label for="link-url">URL <span class="required">*</span></label>
					<input
						type="url"
						id="link-url"
						bind:value={linkUrl}
						placeholder="https://ejemplo.com"
						class="modal-input"
						required
						autocomplete="off"
					/>
					<small class="help-text">La dirección web del enlace</small>
				</div>
			</div>

			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" on:click={closeLinkModal}>
					Cancelar
				</button>
				{#if editingLink}
					<button type="button" class="btn btn-danger" on:click={removeLink}>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
							<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
						Eliminar Enlace
					</button>
				{/if}
				<button type="button" class="btn btn-primary" on:click={insertLinkFromModal}>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						{#if editingLink}
							<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
						{:else}
							<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
							<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
						{/if}
					</svg>
					{editingLink ? 'Actualizar Enlace' : 'Insertar Enlace'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.rich-editor {
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		background: var(--color--page-background);
		overflow: hidden;
		transition: border-color 0.2s ease;

		&:focus-within {
			border-color: var(--color--primary);
			box-shadow: 0 0 0 3px rgba(var(--color--primary-rgb), 0.1);
		}

		&.disabled {
			opacity: 0.6;
			pointer-events: none;
		}
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		background: rgba(var(--color--text-rgb), 0.03);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);
		flex-wrap: wrap;
	}

	.toolbar-group {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.toolbar-separator {
		width: 1px;
		height: 24px;
		background: rgba(var(--color--text-rgb), 0.15);
		margin: 0 0.25rem;
	}

	.toolbar-btn {
		background: transparent;
		border: none;
		color: var(--color--text);
		padding: 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
		min-width: 32px;
		height: 32px;

		&:hover:not(:disabled) {
			background: rgba(var(--color--text-rgb), 0.1);
		}

		&:active:not(:disabled) {
			transform: scale(0.95);
			background: rgba(var(--color--text-rgb), 0.15);
		}

		&:disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}

		.icon {
			font-size: 0.875rem;
			font-weight: 700;
			font-family: var(--font--title);
		}

		svg {
			width: 16px;
			height: 16px;
		}
	}

	.editor-content {
		padding: 1rem;
		min-height: 300px;
		max-height: 500px;
		overflow-y: auto;
		font-family: var(--font--default);
		font-size: 1rem;
		line-height: 1.6;
		color: var(--color--text);
		outline: none;

		&:empty::before {
			content: attr(data-placeholder);
			color: var(--color--text-shade);
			opacity: 0.6;
		}

		/* Estilos del contenido */
		:global(h1) {
			font-size: 2rem;
			font-weight: 700;
			margin: 1rem 0 0.5rem;
			font-family: var(--font--title);
			color: var(--color--text);
		}

		:global(h2) {
			font-size: 1.5rem;
			font-weight: 600;
			margin: 1rem 0 0.5rem;
			font-family: var(--font--title);
			color: var(--color--text);
		}

		:global(h3) {
			font-size: 1.25rem;
			font-weight: 600;
			margin: 0.75rem 0 0.5rem;
			font-family: var(--font--title);
			color: var(--color--text);
		}

		:global(p) {
			margin: 0.5rem 0;
		}

		:global(ul),
		:global(ol) {
			margin: 0.5rem 0;
			padding-left: 2rem;
		}

		:global(li) {
			margin: 0.25rem 0;
		}

		:global(a) {
			color: var(--color--primary);
			text-decoration: underline;
			cursor: pointer;
			transition: all 0.2s ease;
			padding: 0 2px;
			border-radius: 2px;

			&:hover {
				background: rgba(var(--color--primary-rgb), 0.1);
				text-decoration-color: var(--color--primary);
			}
		}

		:global(img) {
			max-width: 100%;
			height: auto;
			border-radius: 4px;
			margin: 1rem 0;
		}

		:global(strong) {
			font-weight: 700;
		}

		:global(em) {
			font-style: italic;
		}

		/* Scrollbar */
		&::-webkit-scrollbar {
			width: 8px;
		}

		&::-webkit-scrollbar-track {
			background: rgba(var(--color--text-rgb), 0.05);
		}

		&::-webkit-scrollbar-thumb {
			background: rgba(var(--color--text-rgb), 0.2);
			border-radius: 4px;

			&:hover {
				background: rgba(var(--color--text-rgb), 0.3);
			}
		}
	}

	@media (max-width: 768px) {
		.toolbar {
			gap: 0.125rem;
		}

		.toolbar-btn {
			min-width: 28px;
			height: 28px;
			padding: 0.375rem;
		}
	}

	/* Modal de enlace */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		padding: 1rem;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background: var(--color--card-background);
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		animation: slideUp 0.3s ease;
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
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);

		h3 {
			margin: 0;
			font-size: 1.25rem;
			font-weight: 600;
			color: var(--color--text);
			font-family: var(--font--title);
		}
	}

	.modal-close {
		background: transparent;
		border: none;
		color: var(--color--text-shade);
		cursor: pointer;
		padding: 0.375rem;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;

		&:hover {
			background: rgba(var(--color--text-rgb), 0.1);
			color: var(--color--text);
		}
	}

	.modal-body {
		padding: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.25rem;

		&:last-child {
			margin-bottom: 0;
		}

		label {
			display: block;
			font-weight: 600;
			color: var(--color--text);
			margin-bottom: 0.5rem;
			font-size: 0.9375rem;

			.required {
				color: #ef4444;
				margin-left: 0.25rem;
			}
		}
	}

	.modal-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		font-size: 1rem;
		font-family: var(--font--default);
		background: var(--color--page-background);
		color: var(--color--text);
		transition: border-color 0.2s ease;
		box-sizing: border-box;

		&:focus {
			outline: none;
			border-color: var(--color--primary);
			box-shadow: 0 0 0 3px rgba(var(--color--primary-rgb), 0.1);
		}

		&::placeholder {
			color: var(--color--text-shade);
			opacity: 0.6;
		}
	}

	.help-text {
		display: block;
		margin-top: 0.375rem;
		font-size: 0.8125rem;
		color: var(--color--text-shade);
		line-height: 1.4;
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.1);
	}

	.btn {
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font--default);

		&.btn-primary {
			background: var(--color--primary);
			color: white;

			&:hover {
				background: var(--color--primary-shade);
				transform: translateY(-1px);
				box-shadow: 0 4px 12px rgba(var(--color--primary-rgb), 0.3);
			}

			&:active {
				transform: translateY(0);
			}
		}

		&.btn-secondary {
			background: rgba(var(--color--text-rgb), 0.1);
			color: var(--color--text);

			&:hover {
				background: rgba(var(--color--text-rgb), 0.15);
			}
		}

		&.btn-danger {
			background: rgba(239, 68, 68, 0.1);
			color: rgb(239, 68, 68);
			border: 1px solid rgba(239, 68, 68, 0.3);

			&:hover {
				background: rgba(239, 68, 68, 0.15);
				border-color: rgba(239, 68, 68, 0.5);
				transform: translateY(-1px);
			}

			&:active {
				transform: translateY(0);
			}
		}

		svg {
			width: 16px;
			height: 16px;
		}
	}

	@media (max-width: 640px) {
		.modal-content {
			max-width: 100%;
			margin: 0;
			border-radius: 12px 12px 0 0;
			max-height: 85vh;
		}

		.modal-overlay {
			padding: 0;
			align-items: flex-end;
		}
	}
</style>
