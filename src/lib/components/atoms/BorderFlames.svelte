<script lang="ts">
  // Encendido / apagado
  export let active = false;

  // Qué tanto “entran” las flamas hacia el centro (0..0.5)
  export let lengthRatio = 0.35;

  // Intensidad global (opacidad base 0..1)
  export let intensity = 0.9;

  // Apariencia (suavizado y flicker)
  export let blur = 6;            // px (0 = sin blur)
  export let pulseMin = 1.1;      // s
  export let pulseMax = 2.2;      // s

  // Colores (usa tus variables globales, con fallback seguro)
  export let colorRedVar    = 'var(--color--callout-accent--error, #ff3b30)';
  export let colorYellowVar = 'var(--color--callout-accent--warning, #ffd60a)';
  export let colorWhiteVar  = 'var(--color--card-background, #ffffff)';

  // Radio del contenedor (para calzar esquinas)
  export let borderRadius: string = 'var(--map-radius, 10px)';

  // COMPAT (no usados aquí, pero los dejo para no romper llamadas antiguas)
  export const holeRatio: number = 0.0;
  export const holeFeather: number = 0;

  // Derivados
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  $: depthPct = `${clamp01(lengthRatio) * 100}%`;         // alcance hacia el centro
  $: opBase   = clamp01(intensity);
  $: blurPx   = `${Math.max(0, blur)}px`;

  // Semillas aleatorias para que cada borde pulse distinto (barato)
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  $: durTop    = `${rand(pulseMin, pulseMax).toFixed(2)}s`;
  $: durRight  = `${rand(pulseMin, pulseMax).toFixed(2)}s`;
  $: durBottom = `${rand(pulseMin, pulseMax).toFixed(2)}s`;
  $: durLeft   = `${rand(pulseMin, pulseMax).toFixed(2)}s`;
  $: delTop    = `${rand(0, 0.6).toFixed(2)}s`;
  $: delRight  = `${rand(0, 0.6).toFixed(2)}s`;
  $: delBottom = `${rand(0, 0.6).toFixed(2)}s`;
  $: delLeft   = `${rand(0, 0.6).toFixed(2)}s`;

  // Variables CSS empaquetadas (evita strings multilinea largos en el markup)
  $: baseVars = [
    `--radius:${borderRadius}`,
    `--depth:${depthPct}`,
    `--op:${opBase}`,
    `--blur:${blurPx}`,
    `--c-red:${colorRedVar}`,
    `--c-yellow:${colorYellowVar}`,
    `--c-white:${colorWhiteVar}`
  ].join(';') + ';';
</script>

<div
  class="border-flames"
  class:active={active}
  style={baseVars}
  aria-hidden="true"
>
  <!-- Cada borde: degradado fijo hacia el centro + “hotline” junto al borde + flicker -->
  <div class="edge top"    style={`--dur:${durTop}; --delay:${delTop};`}></div>
  <div class="edge right"  style={`--dur:${durRight}; --delay:${delRight};`}></div>
  <div class="edge bottom" style={`--dur:${durBottom}; --delay:${delBottom};`}></div>
  <div class="edge left"   style={`--dur:${durLeft}; --delay:${delLeft};`}></div>
</div>

<style>
  .border-flames {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: var(--radius);
    overflow: hidden;
    opacity: 0;
    transition: opacity .18s ease;
    mix-blend-mode: screen;
  }
  .border-flames.active { opacity: 1; }

  .edge {
    position: absolute;
    filter: blur(var(--blur));
    opacity: var(--op);
    mix-blend-mode: screen;
    animation: pulse var(--dur) ease-in-out infinite;
    animation-delay: var(--delay);
  }

  /* Degradado principal: blanco -> amarillo -> rojo -> transparente
     (apunta hacia el centro, sin mover nada) */
  .edge.top {
    left: 0; right: 0; top: 0; height: var(--depth);
    background:
      linear-gradient(to bottom,
        color-mix(in srgb, var(--c-white) 32%, transparent) 0%,
        color-mix(in srgb, var(--c-yellow) 28%, transparent) 16%,
        color-mix(in srgb, var(--c-red)   22%, transparent) 42%,
        transparent 100%
      );
  }
  .edge.bottom {
    left: 0; right: 0; bottom: 0; height: var(--depth);
    background:
      linear-gradient(to top,
        color-mix(in srgb, var(--c-white) 32%, transparent) 0%,
        color-mix(in srgb, var(--c-yellow) 28%, transparent) 16%,
        color-mix(in srgb, var(--c-red)   22%, transparent) 42%,
        transparent 100%
      );
  }
  .edge.left {
    top: 0; bottom: 0; left: 0; width: var(--depth);
    background:
      linear-gradient(to right,
        color-mix(in srgb, var(--c-white) 32%, transparent) 0%,
        color-mix(in srgb, var(--c-yellow) 28%, transparent) 16%,
        color-mix(in srgb, var(--c-red)   22%, transparent) 42%,
        transparent 100%
      );
  }
  .edge.right {
    top: 0; bottom: 0; right: 0; width: var(--depth);
    background:
      linear-gradient(to left,
        color-mix(in srgb, var(--c-white) 32%, transparent) 0%,
        color-mix(in srgb, var(--c-yellow) 28%, transparent) 16%,
        color-mix(in srgb, var(--c-red)   22%, transparent) 42%,
        transparent 100%
      );
  }

  /* Hotline cerca del borde (fina, da más “chispa”) */
  .edge::before {
    content: "";
    position: absolute;
    pointer-events: none;
    mix-blend-mode: screen;
    opacity: calc(var(--op) * .8);
    filter: blur(calc(var(--blur) * .65));
    background:
      linear-gradient(to right,
        color-mix(in srgb, var(--c-white) 65%, transparent),
        transparent 60%
      );
  }
  .edge.top::before,
  .edge.bottom::before { left: 0; right: 0; height: 8px; }
  .edge.left::before,
  .edge.right::before  { top: 0; bottom: 0; width: 8px; }

  .edge.top::before    { top: 0;    background: linear-gradient(to bottom, color-mix(in srgb, var(--c-white) 65%, transparent), transparent 70%); }
  .edge.bottom::before { bottom: 0; background: linear-gradient(to top,    color-mix(in srgb, var(--c-white) 65%, transparent), transparent 70%); }
  .edge.left::before   { left: 0;   background: linear-gradient(to right,  color-mix(in srgb, var(--c-white) 65%, transparent), transparent 70%); }
  .edge.right::before  { right: 0;  background: linear-gradient(to left,   color-mix(in srgb, var(--c-white) 65%, transparent), transparent 70%); }

  /* Flicker (solo opacidad, súper barato) */
  @keyframes pulse {
    0%   { opacity: calc(var(--op) * .55); }
    22%  { opacity: calc(var(--op) * .95); }
    28%  { opacity: calc(var(--op) * .45); }
    60%  { opacity: calc(var(--op) * 1.00); }
    78%  { opacity: calc(var(--op) * .60); }
    100% { opacity: calc(var(--op) * .80); }
  }

  @media (prefers-reduced-motion: reduce) {
    .edge { animation: none; }
  }
</style>
