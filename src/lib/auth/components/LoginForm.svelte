<script lang="ts">
  import { authService } from '$lib/auth/services/authService';
  import { authStore } from '$lib/auth/stores/authStore';
  import { get } from 'svelte/store';

  let email = '';
  let password = '';

  async function onSubmit(e: Event) {
    e.preventDefault();
    const { error } = await authService.login(email, password);
    if (!error) {
      // redirige donde quieras
      window.location.href = '/';
    }
  }
</script>

<form on:submit|preventDefault={onSubmit} class="login-form">
  <label>Email</label>
  <input type="email" bind:value={email} required />

  <label>Contraseña</label>
  <input type="password" bind:value={password} required minlength="8" />

  <button type="submit">Ingresar</button>

  {#if $authStore.error}
    <p class="error">{$authStore.error}</p>
  {/if}
</form>

<style lang="scss">
.login-form { display:flex; flex-direction:column; gap:12px; max-width:360px; }
.error { color: var(--color--error); }
</style>
