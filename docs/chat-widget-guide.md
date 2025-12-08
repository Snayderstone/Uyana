# Chat Widget - Guía de Uso

El chat widget es un asistente inteligente flotante que aparece en todas las páginas del sitio web, permitiendo a los usuarios interactuar con Chasky desde cualquier lugar.

## Características

- **Widget flotante**: Aparece como una burbuja en la esquina de la pantalla
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Configurable**: Control completo sobre dónde y cómo aparece
- **Accesible**: Cumple con estándares de accesibilidad
- **Integrado**: Usa el mismo sistema de chat que la página dedicada

## Configuración Básica

### Usando el layout principal

El widget se incluye automáticamente en todas las páginas a través del layout principal (`+layout.svelte`).

### Configuración personalizada

Usa el componente `ChatWidgetConfig` para personalizar el comportamiento:

```svelte
<script>
	import ChatWidgetConfig from '$lib/components/atoms/ChatWidgetConfig.svelte';
</script>

<!-- Configuración usando preset -->
<ChatWidgetConfig preset="blogOnly" />

<!-- Configuración personalizada -->
<ChatWidgetConfig
	config={{
		position: 'bottom-left',
		hideOnPages: ['/admin', '/login'],
		autoShow: true
	}}
/>
```

## Presets Disponibles

### `blogOnly`

Muestra el widget solo en páginas del blog:

```svelte
<ChatWidgetConfig preset="blogOnly" />
```

### `publicPages`

Muestra en todas las páginas excepto admin y chat:

```svelte
<ChatWidgetConfig preset="publicPages" />
```

### `minimal`

Configuración minimalista sin auto-apertura:

```svelte
<ChatWidgetConfig preset="minimal" />
```

### `autoOpen`

Se abre automáticamente después de cargar la página:

```svelte
<ChatWidgetConfig preset="autoOpen" />
```

## Configuración Manual

### Opciones de configuración

```typescript
interface ChatWidgetConfig {
	enabled: boolean; // Habilitar/deshabilitar el widget
	position: 'bottom-right' | 'bottom-left'; // Posición en pantalla
	showOnPages: string[]; // Páginas donde mostrar (vacío = todas)
	hideOnPages: string[]; // Páginas donde ocultar
	zIndex: number; // Z-index del widget
	autoShow: boolean; // Auto-abrir al cargar la página
	showWelcomeMessage: boolean; // Mostrar mensaje de bienvenida
}
```

### Ejemplo de configuración completa

```svelte
<script>
	import ChatWidgetConfig from '$lib/components/atoms/ChatWidgetConfig.svelte';

	const customConfig = {
		enabled: true,
		position: 'bottom-right',
		showOnPages: [], // Todas las páginas
		hideOnPages: ['/chat', '/admin'], // Excepto estas
		zIndex: 9999,
		autoShow: false,
		showWelcomeMessage: true
	};
</script>

<ChatWidgetConfig config={customConfig} />
```

## Control Programático

### Usando el store directamente

```svelte
<script>
	import { useChatWidget } from '$lib/stores/chatWidgetStore';

	const { config, state, actions } = useChatWidget();

	// Abrir el widget
	function openChat() {
		actions.openWidget();
	}

	// Cerrar el widget
	function closeChat() {
		actions.closeWidget();
	}

	// Cambiar posición
	function moveToLeft() {
		actions.setPosition('bottom-left');
	}

	// Deshabilitar en página específica
	function disableOnThisPage() {
		actions.addHidePages(['/current-page']);
	}
</script>

<button on:click={openChat}>Abrir Chat</button>
<button on:click={moveToLeft}>Mover a la izquierda</button>
```

### Usando el componente de configuración

```svelte
<script>
	import ChatWidgetConfig from '$lib/components/atoms/ChatWidgetConfig.svelte';

	let widgetConfig;

	function enableWidget() {
		widgetConfig.enable();
	}

	function disableWidget() {
		widgetConfig.disable();
	}

	function openWidget() {
		widgetConfig.openWidget();
	}
</script>

<ChatWidgetConfig bind:this={widgetConfig} autoApply={false} />

<button on:click={enableWidget}>Habilitar</button>
<button on:click={disableWidget}>Deshabilitar</button>
<button on:click={openWidget}>Abrir Chat</button>
```

## Ejemplos de Uso por Página

### Página de Blog

```svelte
<!-- Solo mostrar en artículos de blog -->
<ChatWidgetConfig
	config={{
		showOnPages: ['/blog/'],
		position: 'bottom-right',
		autoShow: false
	}}
/>
```

### Página de Investigadores

```svelte
<!-- Auto-abrir para ayudar a los visitantes -->
<ChatWidgetConfig
	config={{
		showOnPages: ['/investigadores'],
		autoShow: true,
		showWelcomeMessage: true
	}}
/>
```

### Páginas de Admin

```svelte
<!-- Deshabilitar completamente en admin -->
<ChatWidgetConfig
	config={{
		enabled: false
	}}
/>
```

## Personalización de Estilos

El widget usa las variables CSS del sistema de diseño. Para personalizar:

```scss
.chat-widget {
	// Cambiar posición
	&--bottom-right {
		bottom: 3rem;
		right: 3rem;
	}
}

.chat-bubble {
	// Personalizar colores
	background: linear-gradient(135deg, #custom-color-1, #custom-color-2);

	// Cambiar tamaño
	width: 70px;
	height: 70px;
}

.chat-expanded {
	// Personalizar dimensiones del chat expandido
	width: 450px;
	height: 650px;

	// Personalizar colores
	background: var(--custom-background);
}
```

## Eventos y Hooks

### Escuchar cambios de estado

```svelte
<script>
	import { useChatWidget } from '$lib/stores/chatWidgetStore';

	const { state } = useChatWidget();

	// Reaccionar a cambios de estado
	$: if ($state.isOpen) {
		console.log('Chat abierto');
	} else {
		console.log('Chat cerrado');
	}

	$: if ($state.hasUnreadMessages) {
		console.log('Hay mensajes no leídos');
	}
</script>
```

## Accesibilidad

El widget incluye características de accesibilidad:

- **Navegación por teclado**: Escape para cerrar, Tab para navegar
- **Etiquetas ARIA**: Descripciones claras para lectores de pantalla
- **Contraste**: Cumple con WCAG 2.1 AA
- **Responsive**: Funciona en todos los dispositivos
- **Reduced motion**: Respeta las preferencias del usuario

## Troubleshooting

### El widget no aparece

1. Verifica que esté habilitado: `config.enabled = true`
2. Revisa las páginas de configuración: `showOnPages` y `hideOnPages`
3. Confirma que no esté en la página `/chat`

### El widget interfiere con otros elementos

1. Ajusta el `zIndex` si es necesario
2. Cambia la posición: `bottom-left` vs `bottom-right`
3. Personaliza los estilos CSS

### Problemas de rendimiento en móviles

1. Deshabilita `autoShow` en móviles
2. Reduce las animaciones con `prefers-reduced-motion`
3. Considera mostrar solo en páginas específicas

## Integración con Analytics

```svelte
<script>
	import { useChatWidget } from '$lib/stores/chatWidgetStore';

	const { state } = useChatWidget();

	// Tracking de eventos
	$: if ($state.isOpen) {
		// Enviar evento a analytics
		gtag('event', 'chat_opened', {
			event_category: 'engagement',
			event_label: 'chat_widget'
		});
	}
</script>
```

Este sistema de chat widget proporciona una experiencia de usuario fluida y accesible, permitiendo que los visitantes accedan al asistente Chasky desde cualquier página del sitio web de manera intuitiva y eficiente.
