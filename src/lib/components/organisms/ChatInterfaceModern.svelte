<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { spring } from 'svelte/motion';

	// Componentes mejorados
	import ChatInputEnhanced from '$lib/components/atoms/ChatInputEnhanced.svelte';
	import ChatMessageList from '$lib/components/molecules/ChatMessageList.svelte';
	import ChatWelcomeScreen from '$lib/components/molecules/ChatWelcomeScreen.svelte';
	import ChatStatusIndicator from '$lib/components/atoms/ChatStatusIndicator.svelte';
	import ChatTypingIndicator from '$lib/components/atoms/ChatTypingIndicator.svelte';
	import ToolsPanel from '$lib/components/molecules/ToolsPanel.svelte';
	import QuickActions from '$lib/components/molecules/QuickActions.svelte';
	import Button from '$lib/components/atoms/Button.svelte';

	import { useChatStore } from '$lib/stores/chatStore';
	import { mcpClientManager } from '$lib/mcp-core/client/mcpClient';
	import { aiClient } from '$lib/ai/aiClient';

	// Estado de la interfaz
	let selectedModel = 'deepseek';
	let showErrorDialog = false;
	let errorMessage = '';
	let showTyping = false;
	let connectionError: string | null = null;
	let retryCount = 0;
	let isInitializing = true;
	let isToolsPanelOpen = false;
	let isQuickActionsOpen = false;
	let availableTools: any[] = [];

	// Animaciones con spring
	let headerOpacity = spring(0);
	let contentScale = spring(0.95);

	// Usar el store de chat mejorado
	const {
		messages,
		isLoading,
		error: chatError,
		connectionStatus,
		activeTools,
		addUserMessage,
		addAssistantMessage,
		addToolMessage,
		updateMessage,
		removeMessage,
		clearChat,
		setConnectionStatus,
		setError,
		setLoading,
		getChatHistory,
		toggleTool
	} = useChatStore();

	// Debug reactivo para monitorear mensajes
	$: {
		console.log('📊 Store mensajes reactivo:', {
			length: $messages.length,
			messages: $messages.map((m) => ({
				id: m.id,
				role: m.role,
				content: m.content.substring(0, 50) + '...'
			}))
		});
	}

	// Sugerencias para el estado vacío
	const welcomeSuggestions = [
		'¿Qué es UYANA y qué servicios ofrece?',
		'Explícame sobre datos geoespaciales',
		'¿Qué tipos de investigación realizan?',
		'Cómo puedo acceder a los mapas interactivos?'
	];

	// Inicialización al montar
	onMount(async () => {
		await initializeInterface();
		await loadAvailableTools();

		// Listener global para atajos de teclado
		function handleGlobalKeydown(event: KeyboardEvent) {
			// Accesos rápidos con Ctrl+K o Cmd+K - solo si no está abierto el panel
			if (event.key === 'k' && (event.ctrlKey || event.metaKey) && !isQuickActionsOpen) {
				event.preventDefault();
				handleQuickActions();
			}
		}

		window.addEventListener('keydown', handleGlobalKeydown);

		return () => {
			window.removeEventListener('keydown', handleGlobalKeydown);
		};
	});

	/**
	 * Inicializa la interfaz con animaciones suaves
	 */
	async function initializeInterface(): Promise<void> {
		try {
			// Animar entrada
			headerOpacity.set(1);
			contentScale.set(1);

			// Inicializar servicios
			await initializeServices();
		} catch (error) {
			console.error('Error inicializando interfaz:', error);
		} finally {
			isInitializing = false;
		}
	}

	/**
	 * Inicializa servicios con manejo de errores robusto
	 */
	async function initializeServices(): Promise<void> {
		try {
			setConnectionStatus('connecting');
			setError(null);
			connectionError = null;

			// Intentar inicializar MCP con timeout
			const mcpPromise = mcpClientManager.ensureInitialized();
			const timeoutPromise = new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Timeout de conexión MCP')), 10000)
			);

			await Promise.race([mcpPromise, timeoutPromise]);

			// Verificar IA con fallback
			try {
				const healthCheck = await aiClient.healthCheck();
				if (healthCheck.healthy) {
					console.log('✅ Servicio de IA disponible');
				}
			} catch (aiError) {
				console.warn('⚠️ Servicio de IA no disponible, usando modo degradado');
			}

			setConnectionStatus('connected');
			retryCount = 0;
		} catch (error) {
			console.error('❌ Error inicializando servicios:', error);
			setConnectionStatus('error');
			connectionError = error instanceof Error ? error.message : 'Error de conexión';
			setError('Error al conectar con el servidor. Reintentando...');

			// Auto-retry con backoff exponencial
			if (retryCount < 3) {
				const delay = Math.pow(2, retryCount) * 2000;
				setTimeout(() => {
					retryCount++;
					initializeServices();
				}, delay);
			}
		}
	}

	/**
	 * Carga las herramientas disponibles del servidor MCP
	 */
	async function loadAvailableTools(): Promise<void> {
		try {
			const client = mcpClientManager.getClient();
			availableTools = await client.listTools();
			console.log('🔧 Herramientas disponibles:', availableTools);
		} catch (error) {
			console.warn('⚠️ No se pudieron cargar las herramientas:', error);
			availableTools = [];
		}
	}

	/**
	 * Maneja el envío de mensajes con UX mejorada
	 */
	async function handleSendMessage(event: CustomEvent<{ message: string }>): Promise<void> {
		const { message } = event.detail;
		console.log('📤 Enviando mensaje:', message);

		if (!message.trim() || $isLoading) {
			console.log('❌ Mensaje vacío o loading activo');
			return;
		}

		// Agregar mensaje del usuario con animación
		console.log('➕ Agregando mensaje del usuario');
		const userMessageId = addUserMessage(message);
		console.log('💬 Messages después de agregar usuario:', $messages.length);

		// Agregar mensaje de carga del asistente
		const assistantMessageId = addAssistantMessage('Pensando...', { pending: true });

		// Mostrar indicador de escritura
		showTyping = true;
		setLoading(true);

		try {
			// Simular delay natural de procesamiento
			await new Promise((resolve) => setTimeout(resolve, 800));

			// Verificar si alguna herramienta activa puede manejar el mensaje
			let toolResponse = null;
			if ($activeTools.size > 0) {
				toolResponse = await tryActiveTools(message);
			}

			// Ocultar indicador de escritura antes de mostrar respuesta
			showTyping = false;
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Si una herramienta manejó el mensaje, no crear respuesta del asistente
			if (toolResponse && toolResponse !== 'TOOL_HANDLED') {
				updateMessage(assistantMessageId, {
					content: toolResponse,
					pending: false,
					metadata: {
						source: 'mcp-tool'
					}
				});
				return;
			} else if (toolResponse === 'TOOL_HANDLED') {
				// La herramienta ya agregó su respuesta al historial,
				// remover el mensaje pendiente del asistente
				removeMessage(assistantMessageId);
				return;
			}

			// De lo contrario, usar el modelo de IA
			const aiResponse = await generateAIResponse(message);

			// Mostrar respuesta
			updateMessage(assistantMessageId, {
				content: aiResponse.content,
				pending: false,
				metadata: {
					model: aiResponse.model || selectedModel,
					usage: aiResponse.usage,
					source: 'ai'
				}
			});
		} catch (error) {
			showTyping = false;
			console.error('Error procesando mensaje:', error);
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

			updateMessage(assistantMessageId, {
				content: `Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, intenta de nuevo.\n\n**Error:** ${errorMessage}`,
				pending: false,
				error: true
			});

			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	}

	/**
	 * Maneja comandos con funcionalidades extendidas
	 */
	function handleCommand(event: CustomEvent<{ command: string; args: string[] }>): void {
		const { command, args } = event.detail;

		switch (command) {
			case 'clear':
				clearChat();
				break;

			case 'help':
				addAssistantMessage(
					'# 🤖 Comandos Disponibles\n\n' +
						'- `/clear` - Limpiar el historial de chat\n' +
						'- `/help` - Mostrar esta ayuda\n' +
						'- `/status` - Ver estado de conexión\n' +
						'- `/model [nombre]` - Cambiar modelo de IA\n\n' +
						'**Accesos rápidos:** Usa `⌘K` (Ctrl+K) para ver opciones rápidas.'
				);
				break;

			case 'status':
				const stats = getChatStats();
				addAssistantMessage(
					`# 📊 Estado del Sistema\n\n` +
						`**Conexión:** ${$connectionStatus}\n` +
						`**Modelo:** ${selectedModel}\n` +
						`**Mensajes:** ${stats.totalMessages}\n` +
						`**Tokens usados:** ${stats.totalTokens}`
				);
				break;

			case 'model':
				if (args.length > 0) {
					selectedModel = args[0];
					addAssistantMessage(`Modelo cambiado a: **${selectedModel}**`);
				} else {
					addAssistantMessage(
						`Modelo actual: **${selectedModel}**\n\nModelos disponibles: deepseek, gpt-4, claude-3`
					);
				}
				break;
		}
	}

	/**
	 * Maneja la apertura de accesos rápidos
	 */
	function handleQuickActions(): void {
		isQuickActionsOpen = true;
	}

	/**
	 * Maneja las acciones de accesos rápidos
	 */
	function handleQuickAction(event: CustomEvent<{ command: string; label: string }>): void {
		const { command } = event.detail;

		// Extraer el comando sin el slash inicial y parsear argumentos
		const cleanCommand = command.startsWith('/') ? command.slice(1) : command;
		const [mainCommand, ...args] = cleanCommand.split(' ');

		// Ejecutar el comando usando la lógica existente
		handleCommand(
			new CustomEvent('command', {
				detail: { command: mainCommand, args }
			})
		);

		isQuickActionsOpen = false;
	}

	/**
	 * Maneja sugerencias del estado vacío
	 */
	function handleSuggestion(event: CustomEvent<{ message: string }>): void {
		const { message } = event.detail;
		handleSendMessage(new CustomEvent('send', { detail: { message } }));
	}

	/**
	 * Intenta usar herramientas activas para procesar el mensaje
	 */
	async function tryActiveTools(message: string): Promise<string | null> {
		const client = mcpClientManager.getClient();

		// Detectar si el mensaje puede ser manejado por herramientas activas
		for (const toolName of $activeTools) {
			try {
				const detectedArgs = await detectToolUsage(message, toolName);
				if (detectedArgs) {
					console.log(`🔧 Usando herramienta ${toolName} con args:`, detectedArgs);

					const toolResponse = await client.callTool(toolName, detectedArgs);

					// Agregar mensaje de herramienta al historial
					addToolMessage(formatToolResponse(toolResponse), toolName, detectedArgs);

					// Retornar una marca especial indicando que la herramienta ya procesó el mensaje
					return 'TOOL_HANDLED';
				}
			} catch (error) {
				console.warn(`⚠️ Error usando herramienta ${toolName}:`, error);
			}
		}

		return null;
	}

	/**
	 * Detecta si un mensaje puede usar una herramienta específica
	 */
	async function detectToolUsage(
		message: string,
		toolName: string
	): Promise<Record<string, any> | null> {
		// Detección simple basada en patrones
		switch (toolName) {
			case 'weather':
				return detectWeatherQuery(message);
			case 'search':
				return detectSearchQuery(message);
			case 'time':
				return detectTimeQuery(message);
			default:
				// Para herramientas personalizadas, usar detección genérica
				return detectGenericQuery(message, toolName);
		}
	}

	/**
	 * Detecta consultas de clima
	 */
	function detectWeatherQuery(message: string): Record<string, any> | null {
		const lowerMessage = message.toLowerCase();

		// Patrones para detectar consultas de clima
		const weatherPatterns = [
			/(?:clima|tiempo|temperatura|pronóstico).+(?:en|de)\s+([a-zA-Z\s]+)/i,
			/(?:cómo está el clima en|qué tiempo hace en)\s+([a-zA-Z\s]+)/i,
			/(?:weather in|climate in)\s+([a-zA-Z\s]+)/i
		];

		for (const pattern of weatherPatterns) {
			const match = message.match(pattern);
			if (match && match[1]) {
				const city = match[1].trim();
				return { city };
			}
		}

		return null;
	}

	/**
	 * Detecta consultas de búsqueda
	 */
	function detectSearchQuery(message: string): Record<string, any> | null {
		const lowerMessage = message.toLowerCase();
		if (
			lowerMessage.includes('buscar') ||
			lowerMessage.includes('search') ||
			lowerMessage.includes('encontrar')
		) {
			return { query: message };
		}
		return null;
	}

	/**
	 * Detecta consultas de tiempo
	 */
	function detectTimeQuery(message: string): Record<string, any> | null {
		const lowerMessage = message.toLowerCase();
		if (
			lowerMessage.includes('hora') ||
			lowerMessage.includes('time') ||
			lowerMessage.includes('fecha')
		) {
			return {};
		}
		return null;
	}

	/**
	 * Detección genérica para herramientas personalizadas
	 */
	function detectGenericQuery(message: string, toolName: string): Record<string, any> | null {
		// Para herramientas genéricas, siempre intentar si están activas
		return { input: message };
	}

	/**
	 * Formatea la respuesta de una herramienta
	 */
	function formatToolResponse(response: any): string {
		if (response.content && Array.isArray(response.content)) {
			return response.content
				.filter((item: any) => item.type === 'text')
				.map((item: any) => item.text)
				.join('\n\n');
		}

		return response.content || 'Respuesta de herramienta vacía';
	}

	/**
	 * Maneja la activación/desactivación de herramientas
	 */
	function handleToggleTool(event: CustomEvent<{ toolName: string }>): void {
		const { toolName } = event.detail;
		toggleTool(toolName);
	}

	/**
	 * Genera respuesta de IA con contexto mejorado
	 */
	async function generateAIResponse(message: string): Promise<any> {
		const chatHistory = getChatHistory();

		const messages: import('$lib/ai/aiManager').AIMessage[] = [
			{
				role: 'system',
				content: `Eres UYANA, un asistente de IA especializado en investigación, geografía y datos geoespaciales de la Universidad Central del Ecuador.

**Tu personalidad:**
- Eres amigable, profesional y conocedor
- Respondes de manera clara y estructurada
- Usas emojis apropiados para hacer las respuestas más amigables
- Proporcionas información precisa sobre investigación geoespacial

**Capacidades principales:**
- Información sobre investigación geográfica y geoespacial
- Datos cartográficos y SIG
- Análisis espacial y geodatos
- Investigaciones de la UCE
- Mapas interactivos y visualización de datos

Responde de manera útil y concisa, manteniendo un tono profesional pero accesible.`
			},
			...chatHistory,
			{
				role: 'user',
				content: message
			}
		];

		return await aiClient.generateResponse(messages, { model: selectedModel });
	}

	/**
	 * Maneja cancelación de escritura
	 */
	function handleCancelTyping(): void {
		showTyping = false;
		setLoading(false);
	}

	/**
	 * Maneja retry de conexión
	 */
	function handleRetryConnection(): void {
		retryCount = 0;
		initializeServices();
	}

	/**
	 * Obtiene estadísticas del chat
	 */
	function getChatStats() {
		return {
			totalMessages: $messages.length,
			userMessages: $messages.filter((m) => m.role === 'user').length,
			assistantMessages: $messages.filter((m) => m.role === 'assistant').length,
			totalTokens: $messages.reduce((total, m) => total + (m.metadata?.usage?.totalTokens || 0), 0)
		};
	}

	// Limpieza al desmontar
	onDestroy(async () => {
		await mcpClientManager.terminate();
	});
</script>

<div class="modern-chat-interface" class:initializing={isInitializing}>
	<!-- Header moderno con animación -->
	<header
		class="chat-header"
		style="opacity: {$headerOpacity}"
		transition:fly={{ y: -20, duration: 600, delay: 200 }}
	>
		<div class="header-content">
			<div class="brand-section">
				<div class="brand-icon">
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none">
						<circle cx="12" cy="12" r="10" stroke="url(#gradient)" stroke-width="2" />
						<path
							d="M8 12L11 15L16 9"
							stroke="url(#gradient)"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<defs>
							<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" style="stop-color:var(--color--primary)" />
								<stop offset="100%" style="stop-color:var(--color--secondary)" />
							</linearGradient>
						</defs>
					</svg>
				</div>
				<div class="brand-text">
					<h1>UYANA Chat</h1>
					<p>Asistente Inteligente de Investigación</p>
				</div>
			</div>

			<div class="header-controls">
				<ChatStatusIndicator status={$connectionStatus} on:retry={handleRetryConnection} />

				<div class="control-buttons">
					<Button
						variant="outline"
						size="small"
						on:click={clearChat}
						disabled={$messages.length === 0}
						title="Limpiar chat"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
							<path
								d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.4477 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</Button>
				</div>
			</div>
		</div>
	</header>

	<!-- Área de contenido principal -->
	<main
		class="chat-content"
		style="transform: scale({$contentScale})"
		transition:fade={{ duration: 400, delay: 400 }}
	>
		{#if $messages.length === 0}
			<ChatWelcomeScreen
				title="¡Hola! Soy UYANA 👋"
				subtitle="Tu asistente especializado en investigación geoespacial. ¿En qué puedo ayudarte hoy?"
				suggestions={welcomeSuggestions}
				on:suggestion={handleSuggestion}
			/>
		{:else}
			<ChatMessageList
				messages={$messages}
				showTimestamps={false}
				groupSimilarMessages={true}
				on:suggestion={handleSuggestion}
			/>
		{/if}

		<!-- Indicador de escritura -->
		{#if showTyping}
			<ChatTypingIndicator isTyping={true} on:cancel={handleCancelTyping} />
		{/if}
	</main>

	<!-- Input area mejorada -->
	<footer class="chat-footer">
		{#if $chatError}
			<div class="error-banner" transition:fly={{ y: 10, duration: 300 }}>
				<div class="error-content">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
						<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
						<path
							d="M15 9L9 15M9 9L15 15"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<span>{$chatError}</span>
				</div>
				<button
					class="error-dismiss"
					on:click={() => setError(null)}
					transition:scale={{ duration: 150 }}
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
						<path
							d="M18 6L6 18M6 6L18 18"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			</div>
		{/if}

		<ChatInputEnhanced
			disabled={$isLoading || $connectionStatus !== 'connected'}
			placeholder={$connectionStatus === 'connected' ? 'Escribe tu mensaje...' : 'Conectando...'}
			showToolsButton={true}
			{availableTools}
			activeTools={$activeTools}
			on:send={handleSendMessage}
			on:command={handleCommand}
			on:tools-toggle={() => (isToolsPanelOpen = !isToolsPanelOpen)}
			on:toggle-tool={handleToggleTool}
			on:quick-actions={handleQuickActions}
		/>
	</footer>
</div>

<!-- Panel de herramientas -->
<ToolsPanel
	isOpen={isToolsPanelOpen}
	tools={availableTools}
	activeTools={$activeTools}
	on:close={() => (isToolsPanelOpen = false)}
	on:toggleTool={handleToggleTool}
/>

<!-- Accesos rápidos -->
<QuickActions
	isOpen={isQuickActionsOpen}
	on:close={() => (isQuickActionsOpen = false)}
	on:action={handleQuickAction}
/>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.modern-chat-interface {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: transparent;
		position: relative;
		overflow: hidden;
		border-radius: inherit;

		&.initializing {
			&::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: linear-gradient(
					135deg,
					rgba(var(--color--primary-rgb), 0.02),
					rgba(var(--color--secondary-rgb), 0.02)
				);
				border-radius: inherit;
				z-index: -1;
			}
		}
	}

	.chat-header {
		background: var(--color--card-background);
		border-bottom: 1px solid rgba(var(--color--border-rgb), 0.08);
		backdrop-filter: blur(20px);
		position: sticky;
		top: 0;
		z-index: 100;
		border-radius: 16px 16px 0 0;

		.header-content {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 1rem 1.5rem;
		}
	}

	.brand-section {
		display: flex;
		align-items: center;
		gap: 1rem;

		.brand-icon {
			width: 48px;
			height: 48px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: linear-gradient(
				135deg,
				rgba(var(--color--primary-rgb), 0.1),
				rgba(var(--color--secondary-rgb), 0.1)
			);
			border-radius: 12px;
			border: 1px solid rgba(var(--color--primary-rgb), 0.2);
		}

		.brand-text {
			h1 {
				font-size: 1.5rem;
				font-weight: 700;
				margin: 0;
				background: linear-gradient(135deg, var(--color--primary), var(--color--secondary));
				background-clip: text;
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}

			p {
				font-size: 0.8rem;
				color: var(--color--text-shade);
				margin: 0;
				font-weight: 500;
			}
		}
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.control-buttons {
		display: flex;
		align-items: center;
		gap: 0.75rem;

		:global(.active) {
			background-color: rgba(var(--color--primary-rgb), 0.1);
			border-color: var(--color--primary);
			color: var(--color--primary);
		}
	}

	.chat-content {
		flex: 1;
		overflow: hidden;
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.chat-footer {
		background: var(--color--card-background);
		border-top: 1px solid rgba(var(--color--border-rgb), 0.08);
		position: relative;
		border-radius: 0 0 16px 16px;
	}

	.error-banner {
		background: linear-gradient(
			135deg,
			rgba(var(--color--callout-accent--error), 0.1),
			rgba(var(--color--callout-accent--error), 0.05)
		);
		border: 1px solid rgba(var(--color--callout-accent--error), 0.2);
		border-radius: 12px;
		margin: 1rem 1.5rem 0;
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;

		.error-content {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			color: var(--color--callout-accent--error);
			font-size: 0.9rem;
			font-weight: 500;
		}

		.error-dismiss {
			background: none;
			border: none;
			color: var(--color--callout-accent--error);
			cursor: pointer;
			padding: 0.25rem;
			border-radius: 6px;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s ease;
			opacity: 0.7;

			&:hover {
				opacity: 1;
				background: rgba(var(--color--callout-accent--error), 0.1);
			}
		}
	}

	@include for-tablet-portrait-down {
		.chat-header .header-content {
			padding: 1rem;
		}

		.brand-section {
			gap: 0.75rem;

			.brand-icon {
				width: 40px;
				height: 40px;
			}

			.brand-text h1 {
				font-size: 1.3rem;
			}
		}

		.header-controls {
			gap: 1rem;
		}

		.control-buttons {
			gap: 0.5rem;
		}
	}

	@include for-phone-only {
		.chat-header .header-content {
			padding: 0.75rem;
			flex-direction: column;
			gap: 1rem;
		}

		.brand-section {
			justify-content: center;
		}

		.header-controls {
			width: 100%;
			justify-content: space-between;
		}

		.error-banner {
			margin: 0.75rem;
			padding: 0.75rem;

			.error-content {
				font-size: 0.85rem;
			}
		}

		// Ajustes específicos para el card en móviles
		.chat-header {
			border-radius: 12px 12px 0 0;

			.header-content {
				padding: 0.75rem 1rem;
			}
		}

		.chat-footer {
			border-radius: 0 0 12px 12px;
		}
	}

	@media (max-width: 480px) {
		.chat-header {
			border-radius: 8px 8px 0 0;

			.header-content {
				padding: 0.5rem 0.75rem;
			}

			.brand-section {
				.brand-icon {
					width: 40px;
					height: 40px;
				}

				.brand-text h1 {
					font-size: 1.25rem;
				}

				.brand-text p {
					font-size: 0.75rem;
				}
			}
		}

		.chat-footer {
			border-radius: 0 0 8px 8px;
		}
	}
</style>
