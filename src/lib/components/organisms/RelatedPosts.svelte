<script lang="ts">
  import type { BlogPost } from '$lib/utils/types';
  import BlogPostCard from '$lib/components/molecules/BlogPostCard.svelte';
  import ContentSection from '$lib/components/organisms/ContentSection.svelte';

  export let posts: BlogPost[];
</script>

<ContentSection
  id="related-posts"
  title="Related Posts"
>
  <!-- Agregamos "related-shelf" para encapsular la variable de color -->
  <div class="simple-grid related-shelf">
    {#each posts as post}
      <!--
        Wrapper para aplicar el hover sin tocar BlogPostCard.
        No depende de que BlogPostCard tenga imagen.
      -->
      <div class="related-card">
        <BlogPostCard
          slug={post.slug}
          title={post.title}
          excerpt={post.excerpt}
          tags={post.tags}
          readingTime={post.readingTime}
          showImage={false} 
        />
      </div>
    {/each}
  </div>
</ContentSection>

<style lang="scss">
  @import '$lib/scss/breakpoints.scss';

  .simple-grid {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 20px;

    @media (max-width: 1070px) {
      grid-template-columns: 1fr 1fr;
    }

    @include for-tablet-portrait-down {
      grid-template-columns: 1fr;
    }
  }

  /* ==========================================================
     HOVER: borde + brillo con el color secundario (sin imágenes)
     ----------------------------------------------------------
     - No mueve el layout (usa ::after)
     - Funciona aunque BlogPostCard tenga su propio layout interno
     - Si tu variable se llama --color--secundary, cámbiala abajo
     ========================================================== */

  /* Encapsulamos la variable del color a usar para el glow */
  .related-shelf {
    --hover-color: var(--color--secondary);
    /* Si tu tema usa --color--secundary (con "u"), usa:
       --hover-color: var(--color--secundary); */
  }

  /* El wrapper que rodea a cada tarjeta */
  .related-card {
    position: relative;
    border-radius: 10px; /* ajusta al radio que uses en tus cards */
    /* No ponemos borde aquí para no alterar el layout base */
  }

  /* Capa de borde + halo, no interactúa con el mouse y no desplaza nada */
  .related-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    opacity: 0;

    /* Halo suave (moderno). Si no quieres color-mix, ver fallback más abajo */
    --glow: color-mix(in oklab, var(--hover-color) 70%, transparent);

    box-shadow:
      inset 0 0 0 20px transparent,  /* borde interno */
      0 0 0 0 transparent,          /* anillo externo */
      0 0 0 50px transparent;          /* halo */
    transition: box-shadow 220ms ease, opacity 220ms ease;
  }

  /* Mejora progresiva: sólo en dispositivos con puntero fino */
  @media (hover: hover) and (pointer: fine) {
    .related-card:hover::after {
      opacity: 1;
      box-shadow:
        inset 0 0 0 2px var(--hover-color),  /* borde interno */
        0 0 0 2px var(--hover-color),        /* anillo justo afuera */
        0 0 108px 6px var(--glow);            /* halo/brillo */
    }
  }

  /* Fallback si no quieres usar color-mix (requiere una var *_rgb opcional):
  .related-card:hover::after {
    box-shadow:
      inset 0 0 0 2px var(--hover-color),
      0 0 0 2px var(--hover-color),
      0 0 18px 6px rgba(var(--color--secondary-rgb), 0.55);
  }
  */

  /* Accesibilidad: sin animaciones si el usuario lo pide */
  @media (prefers-reduced-motion: reduce) {
    .related-card::after {
      transition: none;
    }
  }
</style>

