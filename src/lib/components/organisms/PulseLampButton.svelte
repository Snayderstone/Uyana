<script lang="ts">
  import { goto } from '$app/navigation';

  // Texto y navegación
  export let label: string = 'Explorar ahora';
  export let href: string = '/';
  export let newTab: boolean = false;

  // Tamaño y ritmo del pulso
  export let width: number = 240;   // px
  export let height: number = 56;   // px
  export let speed: number = 2.6;   // s

  // Tokens de color
  export let primary = 'var(--color--secondary)';
  export let textColor = 'var(--color--on-primary, #ffffff)';

  // Accesibilidad
  export let ariaLabel = label;

  function onClick(e: MouseEvent) {
    if (newTab || !href) return;
    e.preventDefault();
    goto(href);
  }
</script>

<!-- 📌 Contenedor que SIEMPRE centra el botón -->
<div class="center-wrap">
  <a
    class="cta"
    href={href}
    on:click={onClick}
    target={newTab ? '_blank' : undefined}
    rel={newTab ? 'noopener noreferrer' : undefined}
    sveltekit:prefetch
    style={`
      --w:${width}px;
      --h:${height}px;
      --primary:${primary};
      --text:${textColor};
      --speed:${speed}s;
    `}
    aria-label={ariaLabel}
  >
    <span class="label">{label}</span>
  </a>
</div>

<style>
  /* Centra el contenido del componente en cualquier layout padre */
  .center-wrap {
    display: grid;
    place-items: center;     /* centra horizontal y verticalmente */
    width: 100%;
  }

  .cta {
    /* layout del botón */
    display: grid;           /* <- antes era inline-grid (no centraba) */
    place-items: center;
    inline-size: var(--w);
    block-size: var(--h);
    border-radius: calc(var(--h) / 2);
    text-decoration: none;
    position: relative;
    isolation: isolate;
    cursor: pointer;

    /* colores / efectos */
    color: var(--text);
    background:
      radial-gradient(120% 220% at 30% 30%,
        color-mix(in srgb, var(--primary) 32%, #0000) 0%,
        color-mix(in srgb, var(--primary) 24%, #0000) 50%,
        color-mix(in srgb, var(--primary) 18%,  #0000) 100%);
    border: 1px solid color-mix(in srgb, var(--primary) 55%, transparent);
    box-shadow:
      0 1px 0 color-mix(in srgb, #fff 90%, transparent) inset,
      0 6px 18px color-mix(in srgb, var(--primary) 15%, #0000);

    animation: bgBreath var(--speed) ease-in-out infinite;
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  }

  .cta::before,
  .cta::after {
    content: "";
    position: absolute;
    inset: -14%;
    border-radius: inherit;
    pointer-events: none;
    z-index: -1;
  }
  .cta::before {
    background: radial-gradient(120% 120% at 50% 50%,
      color-mix(in srgb, var(--primary) 58%, #0000) 0%,
      color-mix(in srgb, var(--primary) 28%, #0000) 40%,
      transparent 70%);
    filter: blur(18px);
    opacity: .45;
    animation: lampPulse var(--speed) ease-in-out infinite;
  }
  .cta::after {
    background: radial-gradient(100% 100% at 50% 50%,
      color-mix(in srgb, var(--primary) 40%, #0000) 0%,
      transparent 70%);
    filter: blur(10px);
    opacity: .15;
    animation: flicker calc(var(--speed) * 0.9) steps(8, end) infinite;
  }

  .label {
    font: 800 1rem/1.1 system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif;
    letter-spacing: .02em;
    text-shadow:
      0 1px 0 rgba(0,0,0,.15),
      0 0 8px color-mix(in srgb, var(--primary) 35%, transparent);
    animation: textGlow calc(var(--speed) * 1.2) ease-in-out infinite;
    white-space: nowrap;
    padding-inline: .5rem;
  }

  .cta:hover,
  .cta:focus-visible {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--primary) 75%, transparent);
    box-shadow:
      0 2px 0 color-mix(in srgb, #fff 40%, transparent) inset,
      0 10px 26px color-mix(in srgb, var(--primary) 42%, #0000);
  }
  .cta:hover::before { opacity: .65; filter: blur(20px); }
  .cta:hover::after  { opacity: .22; }

  @keyframes bgBreath {
    0%, 100% { background-position: 0% 0%; }
    50%      { background-position: 8% 12%; }
  }
  @keyframes lampPulse {
    0%, 100% { opacity: .42; transform: scale(1); }
    50%      { opacity: .62; transform: scale(1.03); }
  }
  @keyframes flicker {
    0%   { opacity:.10; }
    20%  { opacity:.20; }
    40%  { opacity:.12; }
    60%  { opacity:.24; }
    80%  { opacity:.16; }
    100% { opacity:.10; }
  }
  @keyframes textGlow {
    0%, 100% { text-shadow: 0 1px 0 rgba(0,0,0,.15), 0 0 6px color-mix(in srgb, var(--primary) 28%, transparent); }
    50%      { text-shadow: 0 1px 0 rgba(0,0,0,.15), 0 0 12px color-mix(in srgb, var(--primary) 45%, transparent); }
  }

  @media (prefers-reduced-motion: reduce) {
    .cta, .cta::before, .cta::after, .label { animation: none; }
  }
</style>
