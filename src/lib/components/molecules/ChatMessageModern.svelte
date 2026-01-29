<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import type { ChatMessage } from '$lib/stores/chatStore';
	import Sparkles from '$lib/components/atoms/Sparkles.svelte';
	import TypingText from '$lib/components/atoms/TypingText.svelte';

	export let message: ChatMessage;
	export let showTimestamp = false;
	export let showAvatar = true;
	export let enableTyping = true; // Habilitar efecto de escritura
	export let isLastAssistantMessage = false; // Indica si es el último mensaje del asistente

	let isVisible = false;
	let shouldShowTyping = false;
	let hasTyped = false; // Para evitar que se repita el efecto

	// Determinar si debe mostrar el efecto de escritura
	// Solo se activa en el último mensaje del asistente y solo una vez
	// NO se activa en mensajes cargados desde localStorage (alreadyRendered)
	$: shouldShowTyping =
		enableTyping &&
		isLastAssistantMessage &&
		message.role === 'assistant' &&
		!message.pending &&
		!message.error &&
		!hasTyped &&
		!message.metadata?.alreadyRendered; // No aplicar efecto a mensajes guardados

	// Marcar como ya escrito cuando termina el efecto
	function handleTypingComplete() {
		hasTyped = true;
	}

	const roleConfig = {
		user: {
			avatar: {
				bg: 'linear-gradient(135deg, #9C27B0, #673AB7)',
				icon: '👤'
			},
			bubble: {
				bg: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15), rgba(103, 58, 183, 0.08))',
				border: '1px solid rgba(156, 39, 176, 0.4)',
				radius: '20px 20px 6px 20px'
			}
		},
		assistant: {
			avatar: {
				bg: 'linear-gradient(135deg, #FF6347, #FF4500)',
				icon: '🤖'
			},
			bubble: {
				bg: 'linear-gradient(135deg, rgba(255, 99, 71, 0.12), rgba(255, 69, 0, 0.06))',
				border: '1px solid rgba(255, 99, 71, 0.3)',
				radius: '20px 20px 20px 6px'
			}
		},
		tool: {
			avatar: { bg: 'linear-gradient(135deg, #9C27B0, #673AB7)', icon: '🔧' },
			bubble: {
				bg: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05), rgba(103, 58, 183, 0.05))',
				border: '1px solid rgba(156, 39, 176, 0.2)',
				radius: '20px 20px 20px 6px'
			}
		},
		system: {
			avatar: { bg: 'linear-gradient(135deg, #607D8B, #455A64)', icon: '⚙️' },
			bubble: {
				bg: 'linear-gradient(135deg, rgba(96, 125, 139, 0.05), rgba(69, 90, 100, 0.05))',
				border: '1px solid rgba(96, 125, 139, 0.2)',
				radius: '20px 20px 20px 6px'
			}
		}
	};

	$: config = roleConfig[message.role] || roleConfig.assistant;
	$: formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit'
	});
	$: formattedContent = formatMessage(message.content);

	onMount(() => {
		setTimeout(() => (isVisible = true), 100);
	});

	function formatMessage(content: string): string {
		let formatted = content;
		const backtick = String.fromCharCode(96); // backtick character

		// 1. Procesar bloques de código
		const tripleBacktick = backtick + backtick + backtick;
		const codeBlockPattern = tripleBacktick + '([a-z]*)\\n([\\s\\S]*?)' + tripleBacktick;
		const codeBlockRegex = new RegExp(codeBlockPattern, 'gi');
		const codeBlocks: Array<{ placeholder: string; html: string }> = [];
		let blockIndex = 0;

		formatted = formatted.replace(codeBlockRegex, (match, lang, code) => {
			const language = lang || 'text';
			const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			const placeholder = '__CODEBLOCK_' + blockIndex + '__';
			const openDiv = '<div class="code-block">';
			const header = '<div class="code-header">' + language + '<' + '/div>';
			const pre = '<pre><code>' + escapedCode + '<' + '/code><' + '/pre>';
			const closeDiv = '<' + '/div>';
			const html = openDiv + header + pre + closeDiv;
			codeBlocks.push({ placeholder, html });
			blockIndex++;
			return placeholder;
		});

		// 2. Procesar tablas (antes de listas para evitar conflictos)
		formatted = formatTables(formatted);

		// 3. Procesar listas ordenadas y no ordenadas
		formatted = formatLists(formatted);

		// 4. Procesar código inline
		const inlineCodeRegex = new RegExp(backtick + '([^' + backtick + ']+)' + backtick, 'g');
		formatted = formatted.replace(inlineCodeRegex, '<code class="inline-code">$1</code>');

		// 5. Convertir **texto** a <strong>texto</strong> (negrita)
		const boldRegex = new RegExp('\\*\\*(.+?)\\*\\*', 'g');
		formatted = formatted.replace(boldRegex, '<strong>$1</strong>');

		// 6. Convertir *texto* a <em>texto</em> (cursiva)
		const italicRegex = new RegExp('\\*([^*]+)\\*', 'g');
		formatted = formatted.replace(italicRegex, '<em>$1</em>');

		// 7. Convertir saltos de línea
		const newLineRegex = new RegExp('\\n', 'g');
		formatted = formatted.replace(newLineRegex, '<br>');

		// 8. Restaurar bloques de código
		for (let i = 0; i < codeBlocks.length; i++) {
			formatted = formatted.replace(codeBlocks[i].placeholder, codeBlocks[i].html);
		}

		return formatted;
	}

	function formatTables(text: string): string {
		const lines = text.split('\n');
		let result = '';
		let inTable = false;
		let tableRows: string[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();

			// Detectar línea de tabla (| col1 | col2 |)
			if (line.startsWith('|') && line.endsWith('|')) {
				if (!inTable) {
					inTable = true;
					tableRows = [];
				}
				tableRows.push(line);
			} else {
				// Fin de tabla
				if (inTable && tableRows.length > 0) {
					result += buildTableHTML(tableRows) + '\n';
					tableRows = [];
					inTable = false;
				}
				result += lines[i] + '\n';
			}
		}

		// Tabla al final
		if (inTable && tableRows.length > 0) {
			result += buildTableHTML(tableRows);
		}

		return result;
	}

	function buildTableHTML(rows: string[]): string {
		let html = '<table class="markdown-table">';

		for (let i = 0; i < rows.length; i++) {
			// Saltar línea separadora (|---|---|)
			if (rows[i].includes('---')) continue;

			const cells = rows[i].split('|').filter((cell) => cell.trim());
			const isHeader = i === 0;
			const tag = isHeader ? 'th' : 'td';

			html += '<tr>';
			for (const cell of cells) {
				html += '<' + tag + '>' + cell.trim() + '<' + '/' + tag + '>';
			}
			html += '<' + '/tr>';
		}

		return html + '<' + '/table>';
	}

	function formatLists(text: string): string {
		const lines = text.split('\n');
		let result = '';
		let inOrderedList = false;
		let inUnorderedList = false;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const trimmed = line.trim();

			// Lista ordenada (1. item)
			const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
			if (orderedMatch) {
				if (inUnorderedList) {
					result += '<' + '/ul>\n';
					inUnorderedList = false;
				}
				if (!inOrderedList) {
					result += '<ol class="markdown-list">';
					inOrderedList = true;
				}
				result += '<li>' + orderedMatch[2] + '<' + '/li>';
				continue;
			}

			// Lista no ordenada (- item o * item)
			const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
			if (unorderedMatch) {
				if (inOrderedList) {
					result += '<' + '/ol>\n';
					inOrderedList = false;
				}
				if (!inUnorderedList) {
					result += '<ul class="markdown-list">';
					inUnorderedList = true;
				}
				result += '<li>' + unorderedMatch[1] + '<' + '/li>';
				continue;
			}

			// No es item de lista
			if (inOrderedList) {
				result += '<' + '/ol>\n';
				inOrderedList = false;
			}
			if (inUnorderedList) {
				result += '<' + '/ul>\n';
				inUnorderedList = false;
			}

			result += line + '\n';
		}

		// Cerrar listas abiertas
		if (inOrderedList) result += '<' + '/ol>\n';
		if (inUnorderedList) result += '<' + '/ul>\n';

		return result;
	}
</script>

<div class="message-container {message.role}" in:fly={{ y: 20, duration: 300, delay: 100 }}>
	{#if showAvatar}
		<div class="avatar" style="background: {config.avatar.bg};">
			{#if message.role === 'assistant'}
				<div class="assistant-avatar">
					<span class="avatar-icon">✨</span>
					<Sparkles color="primary">
						<span class="sparkle-overlay" />
					</Sparkles>
				</div>
			{:else}
				<span class="avatar-icon">{config.avatar.icon}</span>
			{/if}
		</div>
	{/if}

	<div class="message-content">
		<div
			class="message-bubble"
			style="
			background: {config.bubble.bg};
			border: {config.bubble.border};
			border-radius: {config.bubble.radius};
		"
		>
			<div class="content" class:visible={isVisible}>
				{#if shouldShowTyping}
					<TypingText text={message.content} speed={20} on:complete={handleTypingComplete} />
				{:else}
					{@html formattedContent}
				{/if}
			</div>
		</div>

		{#if showTimestamp}
			<div class="timestamp">{formattedTime}</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.message-container {
		display: flex;
		gap: 0.625rem;
		margin-bottom: 0.75rem;
		align-items: flex-start;
		opacity: 0;
		animation: fadeInUp 0.3s ease-out forwards;

		&.user {
			flex-direction: row-reverse;
			.message-bubble {
				margin-left: auto;
			}
		}
	}

	.avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
		transition: transform 0.2s ease;
		position: relative;

		&:hover {
			transform: scale(1.05);
		}

		.avatar-icon {
			font-size: 12px;
			color: white;
			z-index: 2;
			position: relative;
		}

		.assistant-avatar {
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;

			.avatar-icon {
				font-size: 12px;
				color: white;
				z-index: 3;
				position: relative;
			}

			.sparkle-overlay {
				position: absolute;
				width: 100%;
				height: 100%;
				z-index: 1;
			}
		}
	}

	.message-content {
		max-width: calc(100% - 38px);
		flex: 1;
		min-width: 0;
	}

	.message-bubble {
		padding: 0.625rem 0.875rem;
		position: relative;
		backdrop-filter: blur(10px);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow:
			0 1px 4px rgba(0, 0, 0, 0.05),
			0 1px 2px rgba(0, 0, 0, 0.03);

		&:hover {
			transform: translateY(-1px);
			box-shadow:
				0 4px 12px rgba(0, 0, 0, 0.08),
				0 2px 6px rgba(0, 0, 0, 0.05);
		}
	}

	/* Estilos específicos para mensajes de usuario */
	.message-container.user {
		.message-bubble {
			box-shadow:
				0 2px 8px rgba(156, 39, 176, 0.15),
				0 1px 3px rgba(103, 58, 183, 0.1);

			&:hover {
				box-shadow:
					0 8px 24px rgba(156, 39, 176, 0.2),
					0 4px 16px rgba(103, 58, 183, 0.15);
			}
		}
	}

	/* Estilos específicos para mensajes del asistente */
	.message-container.assistant {
		.message-bubble {
			box-shadow:
				0 2px 8px rgba(255, 99, 71, 0.12),
				0 1px 3px rgba(255, 69, 0, 0.08);

			&:hover {
				box-shadow:
					0 8px 24px rgba(255, 99, 71, 0.18),
					0 4px 16px rgba(255, 69, 0, 0.12);
			}
		}
	}

	.content {
		font-size: 12px;
		line-height: 1.5;
		opacity: 0;
		transform: translateY(10px);
		transition: all 0.3s ease;
		color: var(--color--text);

		&.visible {
			opacity: 1;
			transform: translateY(0);
		}

		:global(h1) {
			font-size: 12px;
			font-weight: 600;
			margin: 0 0 12px 0;
			color: var(--color--primary);
		}
		:global(h2) {
			font-size: 12px;
			font-weight: 600;
			margin: 14px 0 7px 0;
			color: var(--color--primary);
		}
		:global(h3) {
			font-size: 12px;
			font-weight: 600;
			margin: 10px 0 5px 0;
			color: var(--color--primary);
		}
		:global(strong) {
			font-weight: 600;
			color: var(--color--text-primary);
		}
		:global(em) {
			font-style: italic;
			color: var(--color--text-secondary);
		}

		/* Código inline */
		:global(.inline-code) {
			background: rgba(var(--color--primary-rgb), 0.1);
			color: var(--color--primary);
			padding: 2px 6px;
			border-radius: 4px;
			font-family: 'SF Mono', 'Monaco', 'Consolas', 'Courier New', monospace;
			font-size: 11px;
			font-weight: 500;
			border: 1px solid rgba(var(--color--primary-rgb), 0.2);
		}

		/* Bloques de código */
		:global(.code-block) {
			background: rgba(var(--color--primary-rgb), 0.05);
			border: 1px solid rgba(var(--color--border-rgb), 0.2);
			border-radius: 8px;
			margin: 10px 0;
			overflow: hidden;

			:global(.code-header) {
				background: rgba(var(--color--primary-rgb), 0.08);
				padding: 6px 12px;
				font-size: 10px;
				font-weight: 600;
				color: var(--color--primary);
				border-bottom: 1px solid rgba(var(--color--border-rgb), 0.15);
				text-transform: uppercase;
				letter-spacing: 0.5px;
			}

			:global(pre) {
				margin: 0;
				padding: 12px;
				overflow-x: auto;
				background: transparent;

				:global(code) {
					font-family: 'SF Mono', 'Monaco', 'Consolas', 'Courier New', monospace;
					font-size: 11px;
					line-height: 1.6;
					color: var(--color--text);
					white-space: pre;
					word-wrap: normal;
				}
			}
		}

		/* Tablas */
		:global(.markdown-table) {
			width: 100%;
			border-collapse: collapse;
			margin: 10px 0;
			border: 1px solid rgba(var(--color--border-rgb), 0.2);
			border-radius: 6px;
			overflow: hidden;
			font-size: 11px;

			:global(th) {
				background: rgba(var(--color--primary-rgb), 0.1);
				color: var(--color--primary);
				padding: 8px 10px;
				text-align: left;
				font-weight: 600;
				border-bottom: 2px solid rgba(var(--color--border-rgb), 0.3);
			}

			:global(td) {
				padding: 8px 10px;
				border-bottom: 1px solid rgba(var(--color--border-rgb), 0.1);
				color: var(--color--text);
			}

			:global(tr:last-child td) {
				border-bottom: none;
			}

			:global(tr:hover td) {
				background: rgba(var(--color--primary-rgb), 0.03);
			}
		}

		/* Listas */
		:global(.markdown-list) {
			margin: 8px 0;
			padding-left: 24px;

			:global(li) {
				margin: 4px 0;
				line-height: 1.6;
				color: var(--color--text);
			}
		}

		:global(ul.markdown-list) {
			list-style-type: disc;

			:global(li) {
				list-style-type: disc;
			}
		}

		:global(ol.markdown-list) {
			list-style-type: decimal;

			:global(li) {
				list-style-type: decimal;
			}
		}
	}

	/* Estilo específico del contenido para mensajes de usuario */
	.message-container.user .content {
		color: var(--color--text);

		:global(strong) {
			color: #7b1fa2;
		}

		:global(.inline-code) {
			background: rgba(156, 39, 176, 0.12);
			color: #7b1fa2;
			border: 1px solid rgba(156, 39, 176, 0.25);
		}

		:global(.code-block) {
			background: rgba(156, 39, 176, 0.05);
			border-color: rgba(156, 39, 176, 0.2);

			:global(.code-header) {
				background: rgba(156, 39, 176, 0.1);
				color: #7b1fa2;
			}
		}

		:global(.markdown-table) {
			border-color: rgba(156, 39, 176, 0.2);

			:global(th) {
				background: rgba(156, 39, 176, 0.12);
				color: #7b1fa2;
			}

			:global(tr:hover td) {
				background: rgba(156, 39, 176, 0.05);
			}
		}
	}

	.timestamp {
		font-size: 12px;
		color: var(--color--text-tertiary);
		margin-top: 6px;
		text-align: right;
	}

	.user .timestamp {
		text-align: left;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 768px) {
		.message-container {
			gap: 8px;
			margin-bottom: 12px;
		}
		.avatar {
			width: 32px;
			height: 32px;
			.avatar-icon {
				font-size: 12px;
			}
		}
		.message-content {
			max-width: calc(100% - 40px);
		}
		.message-bubble {
			padding: 12px 16px;
		}
	}
</style>
