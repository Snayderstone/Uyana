<script lang="ts">
  // Props mínimas
  export let src: string;
  export let alt: string = '';

  // Opcionales (por si quieres tunear sin tocar el CSS)
  export let amplitude = 6;          // px de desplazamiento vertical
  export let duration = 3500;        // ms del ciclo (sube/baja)
  export let delay = 0;              // ms de retraso inicial
  export let hoverPause = true;      // pausar animación al hover (mejor UX)
  export let hoverScale = 1.02;      // toque sutil de escala al hover
  export let radius = '8px';         // borde redondeado
  export let shadow = 'var(--image-shadow, 0 10px 25px rgba(0,0,0,.15))';
  export let fit: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down' = 'cover';
  export let className = '';         // clases extra para el wrapper
  export let style = '';             // estilos inline extra (p.ej. width/max-width)
  export let sizes: string | undefined;
  export let srcset: string | undefined;
</script>

<div
  class={`floating-image ${hoverPause ? 'pause-on-hover' : ''} ${className}`}
  style={`--amp:${amplitude}px; --dur:${duration}ms; --delay:${delay}ms; --hover-scale:${hoverScale}; --radius:${radius}; --shadow:${shadow}; ${style}`}
  aria-hidden={alt === '' ? 'true' : undefined}
>
  <img
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
    sizes={sizes}
    srcset={srcset}
    style={`object-fit:${fit}`}
  />
</div>

<style>
  .floating-image {
    display: inline-block;
    /* Controla tamaño desde fuera con width/max-width; el img llena el wrapper */
  }

  .floating-image img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    transform: translateY(0);
    animation: float var(--dur) ease-in-out var(--delay) infinite alternate;
    will-change: transform;
  }

  @keyframes float {
    to {
      transform: translateY(calc(var(--amp) * -1));
    }
  }

  /* Pausar animación y dar un toque de escala al pasar el puntero */
  @media (hover: hover) and (pointer: fine) {
    .pause-on-hover:hover img {
      animation-play-state: paused;
      transform: translateY(calc(var(--amp) * -1)) scale(var(--hover-scale));
    }
  }

  /* Respeta usuarios que prefieren menos movimiento */
  @media (prefers-reduced-motion: reduce) {
    .floating-image img {
      animation: none !important;
      transform: none !important;
    }
  }
</style>
