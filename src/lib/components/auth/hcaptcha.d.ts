/// <reference types="svelte" />

declare global {
	interface Window {
		hcaptcha: {
			render: (
				container: HTMLElement,
				params: {
					sitekey: string;
					theme?: 'light' | 'dark';
					callback?: (token: string) => void;
					'error-callback'?: (error: string) => void;
					'expired-callback'?: () => void;
				}
			) => string;
			reset: (widgetId: string) => void;
			remove: (widgetId: string) => void;
		};
	}
}

export {};
