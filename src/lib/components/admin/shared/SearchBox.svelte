<script lang="ts">
	import { icons } from './Icons';

	export let value = '';
	export let placeholder = 'Buscar...';
	export let onInput: (value: string) => void;

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		onInput(value);
	}
</script>

<div class="search-box">
	<span class="search-icon">{icons.search}</span>
	<input type="text" {placeholder} {value} on:input={handleInput} />
	{#if value}
		<button class="clear-btn" on:click={() => onInput('')}>
			<span class="icon">{icons.close}</span>
		</button>
	{/if}
</div>

<style lang="scss">
	.search-box {
		position: relative;
		flex: 1;
		min-width: 250px;

		.search-icon {
			position: absolute;
			left: 12px;
			top: 50%;
			transform: translateY(-50%);
			font-size: 1.125rem;
			opacity: 0.5;
			pointer-events: none;
		}

		input {
			width: 100%;
			padding: 0.625rem 2.75rem 0.625rem 2.5rem;
			border: 1px solid var(--color--border);
			border-radius: 8px;
			font-size: 0.9375rem;
			background: var(--color--background);
			color: var(--color--text);
			transition: all 0.15s ease;

			&:focus {
				outline: none;
				border-color: var(--color--primary);
				box-shadow: 0 0 0 3px rgba(110, 41, 231, 0.1);
			}

			&::placeholder {
				color: var(--color--text-shade);
				opacity: 0.7;
			}
		}

		.clear-btn {
			position: absolute;
			right: 8px;
			top: 50%;
			transform: translateY(-50%);
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 24px;
			height: 24px;
			padding: 0;
			border: none;
			border-radius: 50%;
			background: transparent;
			color: var(--color--text-shade);
			cursor: pointer;
			transition: all 0.15s ease;

			&:hover {
				background: var(--color--hover);
				color: var(--color--text);
			}

			.icon {
				font-size: 0.875rem;
			}
		}
	}

	@media (max-width: 768px) {
		.search-box {
			min-width: 100%;
		}
	}
</style>
