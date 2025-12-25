<script lang="ts">
	/**
	 * Componente para mostrar contenido condicionalmente según autenticación
	 *
	 * Uso:
	 * <AuthGuard>
	 *   <div slot="authenticated">Contenido para usuarios autenticados</div>
	 *   <div slot="unauthenticated">Contenido para usuarios no autenticados</div>
	 * </AuthGuard>
	 *
	 * Con rol específico:
	 * <AuthGuard requiredRole="Administrador">
	 *   <div slot="authorized">Solo para admins</div>
	 *   <div slot="unauthorized">No tienes permisos</div>
	 * </AuthGuard>
	 */

	import { usuarioStore } from '$lib/stores/auth.store';

	export let requiredRole: string | undefined = undefined;

	$: isAuthenticated = $usuarioStore !== null;
	$: hasRole = requiredRole ? $usuarioStore?.roles.includes(requiredRole) ?? false : true;
	$: isAuthorized = isAuthenticated && hasRole;
</script>

{#if requiredRole}
	<!-- Mode: Role-based -->
	{#if isAuthorized}
		<slot name="authorized" />
	{:else if isAuthenticated}
		<slot name="unauthorized">
			<div class="auth-message unauthorized">
				<p>⚠️ No tienes permisos para ver este contenido</p>
			</div>
		</slot>
	{:else}
		<slot name="unauthenticated">
			<div class="auth-message unauthenticated">
				<p>🔒 Debes iniciar sesión para ver este contenido</p>
				<a href="/login">Iniciar Sesión</a>
			</div>
		</slot>
	{/if}
{:else}
	<!-- Mode: Authentication only -->
	{#if isAuthenticated}
		<slot name="authenticated" />
	{:else}
		<slot name="unauthenticated">
			<div class="auth-message unauthenticated">
				<p>🔒 Debes iniciar sesión para ver este contenido</p>
				<a href="/login">Iniciar Sesión</a>
			</div>
		</slot>
	{/if}
{/if}

<style lang="scss">
	.auth-message {
		padding: 2rem;
		text-align: center;
		border-radius: 0.5rem;
		margin: 1rem 0;

		p {
			margin-bottom: 1rem;
			font-weight: 500;
		}

		a {
			display: inline-block;
			padding: 0.5rem 1.5rem;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			text-decoration: none;
			border-radius: 0.375rem;
			font-weight: 600;
			transition: transform 0.2s;

			&:hover {
				transform: translateY(-2px);
			}
		}

		&.unauthenticated {
			background: #f3f4f6;
			border: 2px dashed #d1d5db;
		}

		&.unauthorized {
			background: #fef2f2;
			border: 2px solid #fecaca;
			color: #dc2626;
		}
	}
</style>
