<script lang="ts">
	import Tag from '$lib/components/atoms/Tag.svelte';
	import Image from '$lib/components/atoms/Image.svelte';
	import dateformat from 'dateformat';

	export let post: {
		title: string;
		slug: string;
		content: string;
		excerpt: string;
		coverImage: string;
		date: string;
		readingTime: string;
		tags: string[];
		author: {
			name: string;
			avatar?: string;
		};
	};
</script>

<article id="article-content">
	<div class="header">
		<h1>{post.title}</h1>
		<div class="meta-info">
			{#if post.author}
				<div class="author">
					{#if post.author.avatar}
						<img src={post.author.avatar} alt={post.author.name} class="author-avatar" />
					{/if}
					<span class="author-name">{post.author.name}</span>
				</div>
			{/if}
			<div class="note">Publicado el {dateformat(post.date, 'UTC:dd mmmm yyyy')}</div>
			{#if post.readingTime}
				<div class="note">{post.readingTime.replace('min read', 'min de lectura')}</div>
			{/if}
		</div>
		{#if post.tags?.length}
			<div class="tags">
				{#each post.tags as tag}
					<Tag>{tag}</Tag>
				{/each}
			</div>
		{/if}
	</div>
	{#if post.coverImage}
		<div class="cover-image">
			<Image src={post.coverImage} alt={post.title} />
		</div>
	{/if}
	<div class="content">
		{@html post.content}
	</div>
</article>

<style lang="scss">
	@import '$lib/scss/_mixins.scss';

	#article-content {
		--main-column-width: 65ch;
		max-width: var(--main-column-width);
		margin: 0 auto;
		padding: 4rem 2rem;
	}

	.header {
		margin-bottom: 3rem;
	}

	h1 {
		font-family: var(--font--title);
		font-size: 2.5rem;
		line-height: 1.2;
		color: var(--color--text);
		margin: 0 0 1.5rem 0;

		@include for-phone-only {
			font-size: 2rem;
		}
	}

	.meta-info {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1rem;
	}

	.author {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.author-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
	}

	.author-name {
		font-weight: 600;
		color: var(--color--text);
	}

	.note {
		font-size: 0.9rem;
		color: var(--color--text-shade);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.cover-image {
		margin: 2rem 0 3rem;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: var(--image-shadow);

		:global(img) {
			width: 100%;
			height: auto;
			display: block;
		}
	}

	.content {
		font-family: var(--font--default);
		font-size: 1.125rem;
		line-height: 1.8;
		color: var(--color--text);

		:global(h2) {
			font-family: var(--font--title);
			font-size: 2rem;
			margin: 3rem 0 1.5rem;
			color: var(--color--text);
		}

		:global(h3) {
			font-family: var(--font--title);
			font-size: 1.5rem;
			margin: 2.5rem 0 1.25rem;
			color: var(--color--text);
		}

		:global(p) {
			margin: 1.5rem 0;
		}

		:global(a) {
			color: var(--color--primary);
			text-decoration: none;
			border-bottom: 1px solid var(--color--primary);
			transition: opacity 0.2s ease;
		}

		:global(a:hover) {
			opacity: 0.8;
		}

		:global(ul) {
			margin: 1.5rem 0;
			padding-left: 2rem;
		}

		:global(ol) {
			margin: 1.5rem 0;
			padding-left: 2rem;
		}

		:global(li) {
			margin: 0.75rem 0;
		}

		:global(blockquote) {
			margin: 2rem 0;
			padding: 1.5rem 2rem;
			background: rgba(var(--color--text-rgb), 0.05);
			border-left: 4px solid var(--color--primary);
			font-style: italic;
		}

		:global(code) {
			font-family: var(--font--mono);
			background: rgba(var(--color--text-rgb), 0.08);
			padding: 0.2rem 0.4rem;
			border-radius: 4px;
			font-size: 0.9em;
		}

		:global(pre) {
			margin: 2rem 0;
			padding: 1.5rem;
			background: rgba(var(--color--text-rgb), 0.05);
			border-radius: 8px;
			overflow-x: auto;
		}

		:global(pre code) {
			background: none;
			padding: 0;
		}

		:global(img) {
			max-width: 100%;
			height: auto;
			border-radius: 8px;
			margin: 2rem 0;
		}

		@include for-phone-only {
			font-size: 1rem;
			line-height: 1.7;

			:global(h2) {
				font-size: 1.75rem;
			}

			:global(h3) {
				font-size: 1.35rem;
			}
		}
	}

	@include for-phone-only {
		#article-content {
			padding: 2rem 1rem;
		}
	}
</style>
