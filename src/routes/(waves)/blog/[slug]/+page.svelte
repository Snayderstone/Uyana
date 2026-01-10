<script lang="ts">
	export let data: {
		post: {
			titulo: string;
			slug: string;
			contenido: string;
			resumen: string;
			imagen_portada: string;
			fecha_publicacion: string;
			categorias: { id: number; nombre: string; slug: string; color: string }[];
			etiquetas: { id: number; nombre: string; slug: string; color: string }[];
			autor: {
				nombre: string;
				avatar?: string;
			};
		};
	};

	let { post } = data;
</script>

<article class="blog-post">
	<header>
		{#if post.imagen_portada}
			<img src={post.imagen_portada} alt={post.titulo} class="cover-image" />
		{/if}
		<h1>{post.titulo}</h1>

		<div class="meta-section">
			<div class="author-info">
				{#if post.autor.avatar}
					<img src={post.autor.avatar} alt={post.autor.nombre} class="author-avatar" />
				{:else}
					<div class="author-avatar-placeholder">
						{post.autor.nombre.charAt(0).toUpperCase()}
					</div>
				{/if}
				<div class="author-details">
					<span class="author-name">{post.autor.nombre}</span>
					<span class="post-date">
						{(() => {
							const fecha = new Date(post.fecha_publicacion);
							const fechaFormateada = fecha.toLocaleDateString('es-ES', {
								day: 'numeric',
								month: 'long',
								year: 'numeric'
							});
							const horaFormateada = fecha.toLocaleTimeString('es-ES', {
								hour: '2-digit',
								minute: '2-digit'
							});
							return `${fechaFormateada}, ${horaFormateada}`;
						})()}
					</span>
				</div>
			</div>
		</div>

		{#if post.categorias?.length || post.etiquetas?.length}
			<div class="post-tags">
				{#if post.categorias?.length}
					{#each post.categorias as categoria}
						<span class="tag category-tag" style:border-color={categoria.color}>
							<span class="tag-name">{categoria.slug}</span>
							<span class="tag-indicator" style:background-color={categoria.color} />
						</span>
					{/each}
				{/if}

				{#if post.etiquetas?.length}
					{#each post.etiquetas as etiqueta}
						<span class="tag etiqueta-tag" style:border-color={etiqueta.color}>
							<span class="tag-name">{etiqueta.slug}</span>
							<span class="tag-indicator" style:background-color={etiqueta.color} />
						</span>
					{/each}
				{/if}
			</div>
		{/if}
	</header>

	{#if post.resumen}
		<div class="lead-paragraph">
			{@html post.resumen}
		</div>
	{/if}

	<div class="content">
		{@html post.contenido}
	</div>
</article>

<style lang="scss">
	.blog-post {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 2rem;
		color: var(--color--text);
	}

	header {
		margin-bottom: 2rem;
	}

	.cover-image {
		width: 100%;
		height: auto;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	h1 {
		font-family: var(--font--title);
		font-size: 2.5rem;
		margin-bottom: 1.5rem;
		color: var(--color--text);
		line-height: 1.2;
	}

	.meta-section {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid rgba(var(--color--text-rgb), 0.1);
	}

	.author-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.author-avatar {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--color--primary);
		box-shadow: 0 4px 12px rgba(110, 41, 231, 0.2);
	}

	.author-avatar-placeholder {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color--primary) 0%, #8b5cf6 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 700;
		box-shadow: 0 4px 12px rgba(110, 41, 231, 0.2);
	}

	.author-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.author-name {
		font-family: var(--font--default);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color--text);
	}

	.post-date {
		font-family: var(--font--default);
		font-size: 0.9rem;
		color: rgba(var(--color--text-rgb), 0.7);
	}

	.post-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		border-radius: 20px;
		font-size: 0.8125rem;
		font-weight: 500;
		border: 2px solid;
		background: transparent;
		color: var(--color--text);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		font-family: var(--font--default);
	}

	.tag-name {
		line-height: 1;
	}

	.tag-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.lead-paragraph {
		font-family: var(--font--default);
		font-size: 1.25rem;
		line-height: 1.7;
		color: rgba(var(--color--text-rgb), 0.9);
		background: rgba(var(--color--primary-rgb), 0.05);
		border-left: 4px solid var(--color--primary);
		padding: 1.5rem 2rem;
		margin-bottom: 2.5rem;
		border-radius: 0 8px 8px 0;
		font-weight: 400;

		:global(p) {
			margin: 0.75rem 0;

			&:first-child {
				margin-top: 0;
			}

			&:last-child {
				margin-bottom: 0;
			}
		}

		:global(strong),
		:global(b) {
			font-weight: 600;
			color: var(--color--text);
		}

		:global(em),
		:global(i) {
			font-style: italic;
		}

		:global(a) {
			color: var(--color--primary);
			text-decoration: underline;
			transition: color 0.2s;

			&:hover {
				color: var(--color--primary-shade);
			}
		}
	}

	.content {
		font-family: var(--font--default);
		line-height: 1.8;
		color: var(--color--text);
		font-size: 1.0625rem;
		background: var(--color--card-background);
		padding: 2rem;
		border-radius: 12px;
		box-shadow: var(--card-shadow);
	}

	/* Encabezados */
	.content :global(h1) {
		font-family: var(--font--title);
		font-size: 2.25rem;
		margin-top: 2.5rem;
		margin-bottom: 1.25rem;
		color: var(--color--text);
		font-weight: 700;
		line-height: 1.3;
	}

	.content :global(h2) {
		font-family: var(--font--title);
		font-size: 1.875rem;
		margin-top: 2rem;
		margin-bottom: 1rem;
		color: var(--color--text);
		font-weight: 600;
		line-height: 1.3;
	}

	.content :global(h3) {
		font-family: var(--font--title);
		font-size: 1.5rem;
		margin-top: 1.75rem;
		margin-bottom: 0.875rem;
		color: var(--color--text);
		font-weight: 600;
	}

	.content :global(h4) {
		font-family: var(--font--title);
		font-size: 1.25rem;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		color: var(--color--text);
		font-weight: 600;
	}

	.content :global(h5),
	.content :global(h6) {
		font-family: var(--font--title);
		font-size: 1.125rem;
		margin-top: 1.25rem;
		margin-bottom: 0.625rem;
		color: var(--color--text);
		font-weight: 600;
	}

	/* Párrafos */
	.content :global(p) {
		margin-bottom: 1.25rem;
		line-height: 1.8;
	}

	/* Listas */
	.content :global(ul),
	.content :global(ol) {
		margin-bottom: 1.25rem;
		padding-left: 2rem;
	}

	.content :global(li) {
		margin-bottom: 0.5rem;
		line-height: 1.7;
	}

	.content :global(ul) :global(li) {
		list-style-type: disc;
	}

	.content :global(ol) :global(li) {
		list-style-type: decimal;
	}

	/* Enlaces */
	.content :global(a) {
		color: var(--color--primary);
		text-decoration: underline;
		transition: color 0.2s;
	}

	.content :global(a:hover) {
		color: var(--color--primary-shade);
	}

	/* Énfasis */
	.content :global(strong),
	.content :global(b) {
		font-weight: 700;
		color: var(--color--text);
	}

	.content :global(em),
	.content :global(i) {
		font-style: italic;
	}

	/* Código */
	.content :global(code) {
		background: rgba(var(--color--text-rgb), 0.08);
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		font-size: 0.9em;
		color: var(--color--text);
	}

	.content :global(pre) {
		background: rgba(var(--color--text-rgb), 0.05);
		padding: 1.25rem;
		border-radius: 8px;
		overflow-x: auto;
		margin-bottom: 1.25rem;
		border-left: 4px solid var(--color--primary);
	}

	.content :global(pre) :global(code) {
		background: none;
		padding: 0;
		font-size: 0.9rem;
	}

	/* Citas */
	.content :global(blockquote) {
		border-left: 4px solid var(--color--primary);
		padding: 1rem 1.5rem;
		margin: 1.5rem 0;
		background: rgba(var(--color--primary-rgb), 0.05);
		border-radius: 4px;
		font-style: italic;
		color: rgba(var(--color--text-rgb), 0.9);
	}

	/* Imágenes */
	.content :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 8px;
		margin: 1.5rem 0;
		display: block;
	}

	/* Tablas */
	.content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
		overflow-x: auto;
		display: block;
	}

	.content :global(th),
	.content :global(td) {
		padding: 0.75rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		text-align: left;
	}

	.content :global(th) {
		background: rgba(var(--color--primary-rgb), 0.1);
		font-weight: 600;
		color: var(--color--text);
	}

	.content :global(tr:nth-child(even)) {
		background: rgba(var(--color--text-rgb), 0.03);
	}

	/* Separadores */
	.content :global(hr) {
		border: none;
		border-top: 2px solid rgba(var(--color--text-rgb), 0.1);
		margin: 2rem 0;
	}

	/* Video embeds */
	.content :global(iframe) {
		max-width: 100%;
		border-radius: 8px;
		margin: 1.5rem 0;
	}

	/* Primer párrafo especial (lead) */
	.content :global(p:first-of-type) {
		font-size: 1.1875rem;
		line-height: 1.7;
		color: rgba(var(--color--text-rgb), 0.9);
	}

	@media (max-width: 768px) {
		.blog-post {
			padding: 1.5rem 1rem;
		}

		h1 {
			font-size: 2rem;
		}

		.author-avatar,
		.author-avatar-placeholder {
			width: 48px;
			height: 48px;
			font-size: 1.25rem;
		}

		.author-name {
			font-size: 1rem;
		}

		.post-date {
			font-size: 0.85rem;
		}

		.lead-paragraph {
			font-size: 1.125rem;
			padding: 1rem 1.5rem;
		}

		.content {
			padding: 1.5rem;
			font-size: 1rem;
		}

		.content :global(h1) {
			font-size: 1.875rem;
		}

		.content :global(h2) {
			font-size: 1.5rem;
		}

		.content :global(h3) {
			font-size: 1.25rem;
		}

		.content :global(p:first-of-type) {
			font-size: 1.0625rem;
		}
	}
</style>
