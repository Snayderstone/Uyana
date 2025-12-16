<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import '$lib/scss/global.scss';
	import ThemeToggle from '$lib/components/molecules/ThemeToggle.svelte';
	import Logo from '$lib/components/atoms/Logo.svelte';

	let sidebarVisible = false;
	let showUserMenu = false;
	let isMobile = false;
	let proyectosExpanded = false;

	// Usuario hardcoded (TODO: integrar con auth real)
	let user = {
		nombre: 'Admin UCE',
		email: 'admin@uce.edu.ec',
		avatar: 'https://ui-avatars.com/api/?name=Admin+UCE&background=6E29E7&color=fff&size=128'
	};

	function toggleSidebar() {
		sidebarVisible = !sidebarVisible;
	}

	function toggleUserMenu() {
		showUserMenu = !showUserMenu;
	}

	function handleLogout() {
		showUserMenu = false;
		alert('Cerrando sesión...');
		goto('/');
	}

	function handleSettings() {
		showUserMenu = false;
		goto('/admin/configuracion');
	}

	function toggleProyectosSubmenu() {
		proyectosExpanded = !proyectosExpanded;
	}

	function checkMobile() {
		isMobile = window.innerWidth <= 768;
		if (!isMobile) {
			sidebarVisible = false;
		}
	}

	onMount(() => {
		window.addEventListener('resize', checkMobile);
		checkMobile();

		// Expandir submenu de proyectos si estamos en una ruta de proyectos
		if ($page.url.pathname.includes('/admin/proyectos')) {
			proyectosExpanded = true;
		}

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});
</script>

<div class="admin-layout">
	<!-- Sidebar -->
	<aside class="sidebar" class:active={sidebarVisible}>
		<div class="sidebar-header">
			<div class="logo-section">
				<Logo />
				<span class="admin-badge">Admin</span>
			</div>
			{#if isMobile}
				<button class="close-sidebar" aria-label="Cerrar menú" on:click={toggleSidebar}>×</button>
			{/if}
		</div>

		<nav class="sidebar-nav">
			<ul>
				<li class:active={$page.url.pathname === '/admin'}>
					<a href="/admin">
						<span class="icon">📊</span>
						<span class="nav-text">Resumen</span>
					</a>
				</li>

				<li class="nav-section-title">Gestión Principal</li>

				<li
					class:active={$page.url.pathname.includes('/admin/proyectos')}
					class:expanded={proyectosExpanded}
				>
					<button type="button" class="nav-button" on:click={toggleProyectosSubmenu}>
						<span class="icon">🔬</span>
						<span class="nav-text">Proyectos</span>
						<span class="submenu-arrow" class:rotated={proyectosExpanded}>▼</span>
					</button>
					<ul class="submenu" class:show={proyectosExpanded}>
						<li
							class:active={$page.url.pathname === '/admin/proyectos' ||
								$page.url.pathname === '/admin/proyectos/dashboard'}
						>
							<a href="/admin/proyectos/dashboard">
								<span class="icon">📊</span>
								<span class="nav-text">Dashboard</span>
							</a>
						</li>
						<li class:active={$page.url.pathname === '/admin/proyectos/tabla'}>
							<a href="/admin/proyectos/tabla">
								<span class="icon">📋</span>
								<span class="nav-text">Tabla</span>
							</a>
						</li>
						<li class:active={$page.url.pathname === '/admin/proyectos/nuevo'}>
							<a href="/admin/proyectos/nuevo">
								<span class="icon">➕</span>
								<span class="nav-text">Nuevo Proyecto</span>
							</a>
						</li>
					</ul>
				</li>
				<li class:active={$page.url.pathname.includes('/admin/participantes')}>
					<a href="/admin/participantes">
						<span class="icon">👥</span>
						<span class="nav-text">Participantes</span>
					</a>
				</li>
				<li class:active={$page.url.pathname.includes('/admin/blog')}>
					<a href="/admin/blog">
						<span class="icon">📝</span>
						<span class="nav-text">Blog</span>
					</a>
				</li>

				<li class="nav-section-title">Catálogos</li>

				<li class:active={$page.url.pathname.includes('/admin/instituciones')}>
					<a href="/admin/instituciones">
						<span class="icon">🏛️</span>
						<span class="nav-text">Instituciones</span>
					</a>
				</li>
				<li class:active={$page.url.pathname.includes('/admin/facultades')}>
					<a href="/admin/facultades">
						<span class="icon">🎓</span>
						<span class="nav-text">Facultades</span>
					</a>
				</li>

				<li class="nav-section-title">Geoespacial</li>

				<li class:active={$page.url.pathname.includes('/admin/geoespacial')}>
					<a href="/admin/geoespacial">
						<span class="icon">🗺️</span>
						<span class="nav-text">Mapa</span>
					</a>
				</li>

				<li class="nav-section-title">Sistema</li>

				<li class:active={$page.url.pathname.includes('/admin/database-status')}>
					<a href="/admin/database-status">
						<span class="icon">🗄️</span>
						<span class="nav-text">Estado de BD</span>
					</a>
				</li>
				<li class:active={$page.url.pathname.includes('/admin/mcp-logs')}>
					<a href="/admin/mcp-logs">
						<span class="icon">📋</span>
						<span class="nav-text">MCP Logs</span>
					</a>
				</li>
			</ul>
		</nav>
	</aside>

	<!-- Main Content -->
	<div class="main-content">
		<!-- Top Header -->
		<header class="top-header">
			<div class="header-left">
				{#if isMobile}
					<button class="menu-toggle" aria-label="Abrir menú" on:click={toggleSidebar}>
						<span />
						<span />
						<span />
					</button>
				{/if}
			</div>

			<div class="header-right">
				<ThemeToggle />

				<div class="user-profile">
					<button class="user-avatar-btn" on:click={toggleUserMenu} aria-label="Menú de usuario">
						<img src={user.avatar} alt={user.nombre} class="avatar" />
					</button>

					{#if showUserMenu}
						<div class="user-menu">
							<div class="user-info">
								<div class="user-name">{user.nombre}</div>
								<div class="user-email">{user.email}</div>
							</div>
							<button class="user-menu-item" on:click={handleSettings}>
								<span class="icon">⚙️</span>
								Configuración
							</button>
							<button class="user-menu-item logout" on:click={handleLogout}>
								<span class="icon">🚪</span>
								Cerrar sesión
							</button>
						</div>
					{/if}
				</div>
			</div>
		</header>

		<!-- Main Body -->
		<main class="main-body" class:no-padding={$page.url.pathname === '/admin/geoespacial'}>
			<slot />
		</main>
	</div>

	{#if sidebarVisible && isMobile}
		<button
			class="sidebar-overlay"
			aria-label="Cerrar menú lateral"
			on:click={toggleSidebar}
			on:keydown={(e) => e.key === 'Escape' && toggleSidebar()}
		/>
	{/if}
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.admin-layout {
		display: grid;
		grid-template-columns: 280px 1fr;
		min-height: 100vh;
		background: var(--color--page-background);
	}

	/* ========== SIDEBAR ========== */
	.sidebar {
		background: var(--color--card-background);
		border-right: 1px solid rgba(var(--color--text-rgb), 0.08);
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		position: sticky;
		top: 0;
		height: 100vh;
	}

	.sidebar::-webkit-scrollbar {
		width: 6px;
	}

	.sidebar::-webkit-scrollbar-track {
		background: transparent;
	}

	.sidebar::-webkit-scrollbar-thumb {
		background: rgba(var(--color--text-rgb), 0.2);
		border-radius: 3px;
	}

	.sidebar-header {
		padding: 1.5rem 1.25rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.admin-badge {
		background: var(--color--primary);
		color: var(--color--text-inverse);
		font-family: var(--font--default);
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.close-sidebar {
		background: none;
		border: none;
		color: var(--color--text);
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		opacity: 0.7;
		transition: opacity 0.2s var(--ease-out-3);
	}

	.close-sidebar:hover {
		opacity: 1;
	}

	/* ========== NAVIGATION ========== */
	.sidebar-nav {
		padding: 1rem 0;
		flex: 1;
	}

	.sidebar-nav ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.sidebar-nav li {
		margin: 0;
	}

	.nav-section-title {
		padding: 1.5rem 1rem 0.5rem;
		font-size: 0.75rem;
		font-family: var(--font--default);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--color--text-shade);
	}

	.sidebar-nav li a,
	.sidebar-nav li button.nav-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem;
		color: var(--color--text);
		font-family: var(--font--default);
		text-decoration: none;
		transition: all 0.3s var(--ease-out-3);
		border-left: 3px solid transparent;
		position: relative;
		width: 100%;
		text-align: left;
		background: transparent;
		border: none;
		border-left: 3px solid transparent;
		cursor: pointer;
	}

	.sidebar-nav li a .icon {
		font-size: 1.25rem;
		width: 24px;
		text-align: center;
	}

	.sidebar-nav li a .nav-text {
		font-size: 0.95rem;
		font-weight: 500;
	}

	.sidebar-nav li a:hover,
	.sidebar-nav li button.nav-button:hover {
		background: var(--color--primary-tint);
		color: var(--color--primary);
		padding-left: 1.5rem;
	}

	.sidebar-nav li.active a {
		background: var(--color--primary-tint);
		color: var(--color--primary);
		border-left-color: var(--color--primary);
		font-weight: 600;
	}

	.sidebar-nav li.active a .icon {
		filter: drop-shadow(0 0 8px var(--color--primary));
	}

	/* ========== SUBMENU ========== */
	.submenu {
		background: rgba(var(--color--text-rgb), 0.03);
		border-left: 2px solid rgba(110, 41, 231, 0.2);
		margin-left: 1.25rem;
		max-height: 0;
		overflow: hidden;
		opacity: 0;
		transition: max-height 0.3s ease-out, opacity 0.3s ease-out, margin 0.3s ease-out;
		margin-top: 0;
		margin-bottom: 0;
	}

	.submenu.show {
		max-height: 500px;
		opacity: 1;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.submenu li a {
		padding: 0.6rem 1rem 0.6rem 2rem;
		font-size: 0.875rem;
	}

	.submenu li a .icon {
		font-size: 1rem;
		width: 20px;
	}

	.submenu li a:hover {
		padding-left: 2.25rem;
	}

	.submenu li.active a {
		background: rgba(110, 41, 231, 0.15);
		border-left-color: var(--color--primary);
	}

	.submenu-arrow {
		font-size: 0.7rem;
		margin-left: auto;
		transition: transform 0.3s ease;
		display: inline-block;
	}

	.submenu-arrow.rotated {
		transform: rotate(180deg);
	}

	.sidebar-nav li.expanded > button.nav-button {
		background: rgba(var(--color--text-rgb), 0.06);
	}

	/* ========== MAIN CONTENT ========== */
	.main-content {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		overflow: hidden;
	}

	/* ========== TOP HEADER ========== */
	.top-header {
		background: var(--color--card-background);
		padding: 1rem 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		position: sticky;
		top: 0;
		z-index: 100;
		box-shadow: var(--card-shadow);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	/* ========== USER PROFILE ========== */
	.user-profile {
		position: relative;
	}

	.user-avatar-btn {
		background: none;
		border: 2px solid var(--color--primary);
		padding: 0;
		cursor: pointer;
		border-radius: 50%;
		transition: all 0.2s var(--ease-out-3);
	}

	.user-avatar-btn:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(var(--color--primary-rgb), 0.3);
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: block;
	}

	.user-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		background: var(--color--card-background);
		border-radius: 12px;
		box-shadow: var(--card-shadow-hover);
		min-width: 220px;
		overflow: hidden;
		z-index: 1000;
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
	}

	.user-info {
		padding: 1rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);
	}

	.user-name {
		font-weight: 600;
		font-family: var(--font--default);
		color: var(--color--text);
		margin-bottom: 0.25rem;
	}

	.user-email {
		font-size: 0.875rem;
		font-family: var(--font--default);
		color: var(--color--text-shade);
	}

	.user-menu-item {
		width: 100%;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		transition: background 0.2s var(--ease-out-3);
		color: var(--color--text);
		font-family: var(--font--default);
		font-size: 0.95rem;
		text-align: left;
	}

	.user-menu-item:hover {
		background: var(--color--primary-tint);
	}

	.user-menu-item.logout {
		color: var(--color--secondary);
	}

	.user-menu-item.logout:hover {
		background: var(--color--secondary-tint);
	}

	/* ========== MAIN BODY ========== */
	.main-body {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;

		@include for-phone-only {
			padding: 1rem;
		}

		&.no-padding {
			padding: 0;
			overflow: hidden;
		}
	}

	.main-body::-webkit-scrollbar {
		width: 8px;
	}

	.main-body::-webkit-scrollbar-track {
		background: var(--color--page-background);
	}

	.main-body::-webkit-scrollbar-thumb {
		background: rgba(var(--color--text-rgb), 0.2);
		border-radius: 4px;
	}

	.main-body::-webkit-scrollbar-thumb:hover {
		background: rgba(var(--color--text-rgb), 0.3);
	}

	/* ========== MOBILE ========== */
	.menu-toggle {
		background: none;
		border: none;
		width: 30px;
		height: 24px;
		padding: 0;
		display: none;
		flex-direction: column;
		justify-content: space-between;
		cursor: pointer;
	}

	.menu-toggle span {
		display: block;
		height: 3px;
		width: 100%;
		background-color: var(--color--primary);
		border-radius: 2px;
		transition: all 0.3s var(--ease-out-3);
	}

	.sidebar-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.6);
		z-index: 999;
		border: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		appearance: none;
		backdrop-filter: blur(2px);
	}

	/* ========== RESPONSIVE ========== */
	@media (max-width: 768px) {
		.admin-layout {
			grid-template-columns: 1fr;
		}

		.sidebar {
			position: fixed;
			top: 0;
			left: 0;
			width: 280px;
			height: 100vh;
			transform: translateX(-100%);
			transition: transform 0.3s var(--ease-out-3);
			z-index: 1000;
		}

		.sidebar.active {
			transform: translateX(0);
		}

		.menu-toggle {
			display: flex;
		}

		.top-header {
			padding: 0.75rem 1rem;
		}

		.avatar {
			width: 36px;
			height: 36px;
		}
	}
</style>
