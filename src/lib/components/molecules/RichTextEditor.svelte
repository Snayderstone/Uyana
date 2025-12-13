<script lang="ts">
	import { onMount } from 'svelte';

	export let value = '';
	export let placeholder = 'Escribe tu contenido aquí...';
	export let disabled = false;

	let editor: HTMLDivElement;
	let isInitialized = false;

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

	function insertList(ordered: boolean) {
		execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
	}

	function insertLink() {
		const url = prompt('Ingresa la URL:');
		if (url) {
			execCommand('createLink', url);
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
				on:click={insertLink}
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
	/>
</div>

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
</style>
