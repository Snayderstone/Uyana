<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import Button from '$lib/components/atoms/Button.svelte';
    import Sparkles from '$lib/components/atoms/Sparkles.svelte';
    import SendMessage from '$lib/icons/send-message.svelte';
    import Calendar from '$lib/icons/calendar.svelte';
    import EmailIcon from '$lib/icons/email.svelte';
    import PhoneIcon from '$lib/icons/phone.svelte';
    import MapIcon from '$lib/icons/map.svelte';
    import YoutubeIcon from '$lib/icons/youtube.svelte';
  
    let formData = {
      nombre: '',
      email: '',
      asunto: '',
      mensaje: ''
    };
  
    let enviado = false;
    let error = false;
  
    const handleSubmit = () => {
      // Aquí iría la lógica de envío del formulario
      enviado = true;
      formData = {
        nombre: '',
        email: '',
        asunto: '',
        mensaje: ''
      };
    };
  </script>
  
  <div class="contact-container" in:fade>
    <div class="contact-info" in:fly={{ y: 20, duration: 600 }}>
      <h2>Contácto</h2>
      <p>
        Si tienes alguna pregunta o inquietud, no dudes en ponerte en contacto con nosotros a través del siguiente formulario.
        Estaremos encantados de ayudarte.
      </p>
      
      <div class="info-details">
        <div class="info-item">
          <span class="icon"><MapIcon /></span>
          <div>
            <h3>Ubicación</h3>
            <p>Ciudadela Universitaria, en la calle Jerónimo Leyton y Gatto Sobral, dentro del Edificio Azul, detrás del Hospital del Día</p>
            <p>Ciudadela Universitaria, Quito - Ecuador</p>
          </div>
        </div>
        <div class="info-item">
          <span class="icon"><EmailIcon /></span>
          <div>
            <h3>Email</h3>
            <p>investigacion@uce.edu.ec.</p>
          </div>
        </div>

        <div class="info-item">
          <span class="icon"><PhoneIcon /></span>
          <div>
            <h3>Telefono</h3>
            <p>022904796</p>
          </div>
        </div>

        <div class="info-item">
          <span class="icon"><Calendar /></span>
          <div>
            <h3>Horarios de Atención</h3>
            <p>Administrativo: 8h00-16h00</p>
          </div>

        </div>
          <div class="info-item">
          <span class="icon"><YoutubeIcon /></span>
          <div>
            <h3>Noticiero</h3>
            <p><a href="https://www.youtube.com/@lacentralec" target="_blank" rel="noopener noreferrer">UCE Informa</a></p>
          </div>
        </div>

      </div>
    </div>
  
    <form 
      class="contact-form" 
      on:submit|preventDefault={handleSubmit}
      in:fly={{ y: 20, duration: 600, delay: 200 }}
    >
      <div class="form-group">
        <label for="nombre">Nombre:</label>
        <input 
          type="text" 
          id="nombre"
          bind:value={formData.nombre}
          required
        />
      </div>
  
      <div class="form-group">
        <label for="email">Email:</label>
        <input 
          type="email" 
          id="email"
          bind:value={formData.email}
          required
        />
      </div>
  
      <div class="form-group">
        <label for="asunto">Asunto:</label>
        <input 
          type="text" 
          id="asunto"
          bind:value={formData.asunto}
          required
        />
      </div>
  
      <div class="form-group">
        <label for="mensaje">Mensaje:</label>
        <textarea 
          id="mensaje"
          bind:value={formData.mensaje}
          rows="5"
          required
        />
      </div>
  
      <div class="button-group">
        <Sparkles>
          <Button type="submit" color="primary">
              <span slot="icon"><SendMessage /></span>
            Enviar Mensaje
          </Button>
        </Sparkles>
      </div>
  
      {#if enviado}
        <div class="message success" transition:fade>
          ¡Mensaje enviado con éxito!
        </div>
      {/if}
  
      {#if error}
        <div class="message error" transition:fade>
          Hubo un error al enviar el mensaje. Por favor, intenta nuevamente.
        </div>
      {/if}
    </form>
  </div>
  
  <style lang="scss">
    @import '$lib/scss/breakpoints.scss';
  
    .contact-container {
      display: grid;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
  
      @include for-tablet-landscape-up {
        grid-template-columns: 1fr 1fr;
      }
    }
  
    .contact-info {
      h2 {
        font-family: var(--font--title);
        font-size: 2rem;
        margin-bottom: 1.5rem;
        color: var(--color--text);
      }
  
      p {
        color: var(--color--text-shade);
        line-height: 1.6;
        margin-bottom: 2rem;
      }
    }
  
    .info-details {
      display: grid;
      gap: 1.5rem;
    }
  
    .info-item {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
  
      .icon {
        flex-shrink: 0;
        font-size: 1.5rem;
        background: var(--color--background);
        padding: 0.5rem;
        border-radius: 10px;
        border: 1px solid var(--color--border);
        color: var(--color--text);
      }
  
      h3 {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
        color: var(--color--text);
      }
  
      p {
        margin-bottom: 0.25rem;
        font-size: 0.95rem;
      }
    }
  
    .contact-form {
      background: var(--color--card-background);
      padding: 2rem;
      border-radius: 10px;
      border: 2px solid var(--color--text);
      box-shadow: var(--card-shadow);
    }
  
    .form-group {
      margin-bottom: 1.5rem;
  
      label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--color--text);
      }
  
      input,
      textarea {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid var(--color--text);
        border-radius: 10px;
        background: var(--color--background);
        color: var(--color--text);
        font-size: 1rem;
        transition: all 0.3s ease;
  
        &:focus {
          outline: none;
          border-color: var(--color--primary, #6200ea);
          box-shadow: 0 0 0 4px var(--color--primary-transparent, rgba(98, 0, 234, 0.5));
        }
      }
    }
  
.button-group {
  width: 100%;
}
.button-group :global(*) {
  width: 100%;
}
.button-group :global(.button) {
  width: 100%;
}
  
    .message {
      margin-top: 1rem;
      padding: 0.75rem;
      border-radius: 10px;
      text-align: center;
  
      &.success {
        background: var(--callout-background--success);
        color: var(--callout-accent--success);
      }
  
      &.error {
        background: var(--callout-background--error);
        color: var(--callout-accent--error);
      }
    }
  
    @include for-phone-only {
      .contact-container {
        padding: 1rem;
      }
  
      .contact-form {
        padding: 1.5rem;
      }
    }

  </style>
