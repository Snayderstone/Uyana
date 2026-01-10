<script lang="ts">
	import { login } from '$lib/stores/auth.store';
	import { goto } from '$app/navigation';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';

	async function handleSubmit() {
		// Limpiar error anterior
		error = '';

		// Validar campos
		if (!email || !password) {
			error = 'Por favor complete todos los campos';
			return;
		}

		// Validar email
		if (!email.includes('@')) {
			error = 'Email inválido';
			return;
		}

		loading = true;

		try {
			const result = await login(email, password);

			if (result.success) {
				// Redirigir al dashboard admin usando navegación completa
				// para asegurar que la cookie httpOnly esté presente en la siguiente petición
				location.assign('/admin/resumen');
			} else {
				// Verificar si hay código de error específico
				const errorData = result as any;

				if (errorData.codigo === 'ACCOUNT_LOCKED') {
					// Error de cuenta bloqueada
					error = errorData.error;
				} else if (errorData.intentos_restantes !== undefined) {
					// Mostrar intentos restantes
					error = errorData.error;
				} else {
					// Error genérico
					error = result.error || 'Error al iniciar sesión';
				}
			}
		} catch (e) {
			error = 'Error de conexión. Por favor intente nuevamente.';
		} finally {
			loading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSubmit();
		}
	}
</script>

<div class="login-form">
	<div class="login-card">
		<div class="login-header">
			<h1>Iniciar Sesión</h1>
			<p>Sistema de Administración de Proyectos</p>
		</div>

		<form on:submit|preventDefault={handleSubmit}>
			<div class="form-group">
				<label for="email">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					on:keypress={handleKeyPress}
					placeholder="admin@ejemplo.com"
					disabled={loading}
					required
				/>
			</div>

			<div class="form-group">
				<label for="password">Contraseña</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					on:keypress={handleKeyPress}
					placeholder="••••••••"
					disabled={loading}
					required
				/>
			</div>

			{#if error}
				<div class="error-message">
					{error}
				</div>
			{/if}

			<button type="submit" class="btn-login" disabled={loading}>
				{#if loading}
					<span class="spinner" />
					Iniciando sesión...
				{:else}
					Iniciar Sesión
				{/if}
			</button>
		</form>
	</div>
</div>

<style lang="scss">
	.login-form {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 1rem;
	}

	.login-card {
		background: white;
		border-radius: 10px;
		padding: 2.5rem;
		max-width: 420px;
		width: 100%;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
	}

	.login-header {
		text-align: center;
		margin-bottom: 2rem;

		h1 {
			font-size: 35px;
			font-weight: 700;
			color: #1c1e26;
			margin-bottom: 0.5rem;
		}

		p {
			color: #9095a1;
			font-size: 16px;
		}
	}

	.form-group {
		margin-bottom: 1.5rem;

		label {
			display: block;
			font-size: 16px;
			font-weight: 600;
			color: #1c1e26;
			margin-bottom: 0.5rem;
		}

		input {
			width: 100%;
			padding: 0.75rem 1rem;
			border: 2px solid #1c1e26;
			border-radius: 10px;
			font-size: 1rem;
			transition: all 0.2s;
			background: white !important;
			color: #1c1e26;

			&:focus {
				outline: none;
				border-color: #667eea;
				box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
				background: white !important;
			}

			&:disabled {
				background-color: #f9fafb;
				cursor: not-allowed;
			}

			&::placeholder {
				color: #9095a1;
			}

			// Eliminar color de fondo del autocompletado del navegador
			&:-webkit-autofill,
			&:-webkit-autofill:hover,
			&:-webkit-autofill:focus,
			&:-webkit-autofill:active {
				-webkit-box-shadow: 0 0 0 30px white inset !important;
				-webkit-text-fill-color: #1c1e26 !important;
				transition: background-color 5000s ease-in-out 0s;
			}
		}
	}

	.error-message {
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 10px;
		font-size: 0.875rem;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;

		&::before {
			content: '⚠';
			font-size: 1.25rem;
		}
	}

	.btn-login {
		width: 100%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 0.875rem;
		border-radius: 10px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;

		&:hover:not(:disabled) {
			transform: translateY(-1px);
			box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
		}

		&:active:not(:disabled) {
			transform: translateY(0);
		}

		&:disabled {
			opacity: 0.7;
			cursor: not-allowed;
		}
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 480px) {
		.login-card {
			padding: 2rem 1.5rem;
		}

		.login-header h1 {
			font-size: 1.5rem;
		}
	}
</style>
