<main class="blog-layout">
	<slot />
</main>

<style lang="scss">
	.blog-layout {
		min-height: 100vh;
		background: var(--color--page-background);
		padding-top: 2rem;
		padding-bottom: 2rem;
	}

	:global(.blog-layout) {
		/* Asegurar que el contenido del blog tenga el contexto correcto */
		position: relative;
		z-index: 1;
	}
</style>
