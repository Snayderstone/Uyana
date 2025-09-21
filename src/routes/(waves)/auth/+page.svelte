<script lang="ts">
  import LoginForm from '$lib/auth/components/LoginForm.svelte';
</script>

<div class="container">
  <div class="card-overlay">
    <div class="header">
      <h1>Acceder</h1>
      <p>Inicia sesión con tu correo institucional para continuar</p>
    </div>
    <LoginForm />
  </div>
</div>

<style lang="scss">
  @import '$lib/scss/breakpoints.scss';

  .card-overlay {
    position: relative;
    z-index: 10; // 👈 esto hace que no quede debajo del header
    width: 100%;
    max-width: 400px;
    margin: 4rem auto; // 👈 baja el formulario para que no quede pegado al header
    padding: 2rem;
    background: var(--color--background);
    border-radius: 12px;
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1));

    @include for-phone-only {
      margin: 2rem 1rem;
      padding: 1.5rem;
    }
  }

  .header {
    text-align: center;
    margin-bottom: 1.5rem;

    h1 {
      font-size: 1.6rem;
      margin-bottom: 0.5rem;
      color: var(--color--text);
    }

    p {
      color: var(--color--text-shade);
      font-size: 0.95rem;
    }
  }
</style>
