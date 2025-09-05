<script lang="ts">
	import '../../lib/scss/global.scss';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let sidebarVisible = false;

	// Función para mostrar/ocultar la barra lateral en dispositivos móviles
	function toggleSidebar() {
		sidebarVisible = !sidebarVisible;
	}

	// Cerrar la barra lateral cuando cambia la ruta en dispositivos móviles
	$: if ($page.url.pathname) {
		sidebarVisible = false;
	}

	// Detectar si estamos en un dispositivo móvil
	let isMobile = false;

	onMount(() => {
		// Comprobar si estamos en un dispositivo móvil
		const checkMobile = () => {
			isMobile = window.innerWidth <= 768;
		};

		// Configurar event listener para el resize
		window.addEventListener('resize', checkMobile);

		// Comprobación inicial
		checkMobile();

		// Limpiar event listener al desmontar
		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});
</script>

<div class="admin-layout">
	<aside class="sidebar" class:active={sidebarVisible}>
		<div class="logo">
			<h1>Uyana Admin</h1>
			{#if isMobile}
				<button class="close-sidebar" aria-label="Cerrar menú" on:click={toggleSidebar}>×</button>
			{/if}
		</div>

		<nav>
			<ul>
				<li class:active={$page.url.pathname === '/admin'}>
					<a href="/admin">Dashboard</a>
				</li>
				<li class:active={$page.url.pathname.includes('/admin/mcp-logs')}>
					<a href="/admin/mcp-logs">MCP Logs</a>
				</li>
			</ul>
		</nav>
	</aside>

	<main>
		{#if isMobile}
			<div class="mobile-header">
				<button class="menu-toggle" aria-label="Abrir menú" on:click={toggleSidebar}>
					<span />
					<span />
					<span />
				</button>
				<h1>Uyana Admin</h1>
			</div>
		{/if}

		<slot />
	</main>

	{#if sidebarVisible && isMobile}
		<button class="sidebar-overlay" aria-label="Cerrar menú lateral" on:click={toggleSidebar} />
	{/if}
</div>

<style>
	.admin-layout {
		display: grid;
		grid-template-columns: 250px 1fr;
		height: 100vh;
	}

	.sidebar {
		background-color: #1e1e2d;
		color: #fff;
		overflow-y: auto;
		border-right: 1px solid #2d2d43;
	}

	.logo {
		padding: 1.5rem 1rem;
		border-bottom: 1px solid #2d2d43;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.close-sidebar {
		background: none;
		border: none;
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
	}

	.logo h1 {
		margin: 0;
		font-size: 1.5rem;
		color: #fff;
	}

	nav ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	nav li {
		margin: 0;
	}

	nav li a {
		display: block;
		padding: 0.75rem 1rem;
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		transition: all 0.3s ease;
		border-left: 3px solid transparent;
	}

	nav li a:hover {
		background-color: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	nav li.active a {
		background-color: rgba(255, 255, 255, 0.1);
		color: #fff;
		border-left-color: #00b3ff;
	}

	main {
		height: 100vh;
		overflow-y: auto;
		background-color: #f5f7fa;
	}

	.mobile-header {
		display: none;
		padding: 1rem;
		background-color: #1e1e2d;
		color: #fff;
		position: sticky;
		top: 0;
		z-index: 100;
		align-items: center;
		gap: 1rem;
	}

	.mobile-header h1 {
		margin: 0;
		font-size: 1.2rem;
	}

	.menu-toggle {
		background: none;
		border: none;
		width: 30px;
		height: 24px;
		padding: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		cursor: pointer;
	}

	.menu-toggle span {
		display: block;
		height: 2px;
		width: 100%;
		background-color: white;
		border-radius: 2px;
	}

	.sidebar-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 999;
		border: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		appearance: none;
	}

	@media (max-width: 768px) {
		.admin-layout {
			grid-template-columns: 1fr;
		}

		.sidebar {
			position: fixed;
			top: 0;
			left: 0;
			width: 250px;
			height: 100vh;
			transform: translateX(-100%);
			transition: transform 0.3s ease;
			z-index: 1000;
		}

		.sidebar.active {
			transform: translateX(0);
		}

		.mobile-header {
			display: flex;
		}

		main {
			padding-top: 0;
		}
	}
</style>
