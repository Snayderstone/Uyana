<script lang="ts">
	import { logout, usuarioStore } from '$lib/stores/auth.store';
	import { goto } from '$app/navigation';

	let showUserMenu = false;

	async function handleLogout() {
		await logout();
		goto('/login');
	}

	function toggleUserMenu() {
		showUserMenu = !showUserMenu;
	}

	// Cerrar menú al hacer click fuera
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.user-menu-container')) {
			showUserMenu = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<nav class="admin-navbar">
	<div class="navbar-container">
		<div class="navbar-brand">
			<a href="/admin">
				<span class="brand-icon">🔬</span>
				<span class="brand-text">Uyana Admin</span>
			</a>
		</div>

		<div class="navbar-links">
			<a href="/admin" class="nav-link">Dashboard</a>
			<a href="/admin/proyectos" class="nav-link">Proyectos</a>
			<a href="/admin/usuarios" class="nav-link">Usuarios</a>
		</div>

		<div class="user-menu-container">
			<button class="user-menu-button" on:click|stopPropagation={toggleUserMenu}>
				<div class="user-avatar">
					{$usuarioStore?.nombre?.charAt(0).toUpperCase() || 'A'}
				</div>
				<span class="user-name">{$usuarioStore?.nombre || 'Admin'}</span>
				<svg
					class="chevron"
					class:rotated={showUserMenu}
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
				>
					<path
						d="M4 6L8 10L12 6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>

			{#if showUserMenu}
				<div class="user-dropdown">
					<div class="dropdown-header">
						<div class="dropdown-user-info">
							<p class="dropdown-name">{$usuarioStore?.nombre}</p>
							<p class="dropdown-email">{$usuarioStore?.email}</p>
						</div>
					</div>
					<div class="dropdown-divider" />
					<button class="dropdown-item" on:click={handleLogout}>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
							<path
								d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
							/>
							<path
								d="M11 11L14 8M14 8L11 5M14 8H6"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						Cerrar Sesión
					</button>
				</div>
			{/if}
		</div>
	</div>
</nav>

<style lang="scss">
	.admin-navbar {
		background: white;
		border-bottom: 1px solid #e5e7eb;
		padding: 0 1.5rem;
		position: sticky;
		top: 0;
		z-index: 100;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.navbar-container {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 4rem;
	}

	.navbar-brand {
		a {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			text-decoration: none;
			font-weight: 700;
			font-size: 1.25rem;
			color: #1f2937;
			transition: color 0.2s;

			&:hover {
				color: #667eea;
			}
		}

		.brand-icon {
			font-size: 1.5rem;
		}
	}

	.navbar-links {
		display: flex;
		gap: 1rem;
		flex: 1;
		justify-content: center;

		@media (max-width: 768px) {
			display: none;
		}
	}

	.nav-link {
		padding: 0.5rem 1rem;
		text-decoration: none;
		color: #6b7280;
		font-weight: 500;
		border-radius: 0.375rem;
		transition: all 0.2s;

		&:hover {
			background-color: #f3f4f6;
			color: #667eea;
		}
	}

	.user-menu-container {
		position: relative;
	}

	.user-menu-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1rem;
		border: none;
		background: #f9fafb;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			background: #f3f4f6;
		}
	}

	.user-avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.user-name {
		color: #1f2937;
		font-weight: 500;

		@media (max-width: 640px) {
			display: none;
		}
	}

	.chevron {
		color: #6b7280;
		transition: transform 0.2s;

		&.rotated {
			transform: rotate(180deg);
		}
	}

	.user-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		min-width: 240px;
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-header {
		padding: 1rem;
	}

	.dropdown-user-info {
		.dropdown-name {
			font-weight: 600;
			color: #1f2937;
			margin-bottom: 0.25rem;
		}

		.dropdown-email {
			font-size: 0.875rem;
			color: #6b7280;
		}
	}

	.dropdown-divider {
		height: 1px;
		background: #e5e7eb;
		margin: 0.5rem 0;
	}

	.dropdown-item {
		width: 100%;
		padding: 0.75rem 1rem;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: #dc2626;
		font-weight: 500;
		transition: background-color 0.2s;

		svg {
			flex-shrink: 0;
		}

		&:hover {
			background-color: #fef2f2;
		}

		&:first-of-type {
			border-radius: 0 0 0.5rem 0.5rem;
		}
	}
</style>
