import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface ConsentState {
	captchaVerified: boolean;
	consentAccepted: boolean;
	sessionToken: string | null;
	consentSaved: boolean;
}

// Clave para localStorage
const CONSENT_STORAGE_KEY = 'uyana_public_consent';

// Estado inicial
function getInitialState(): ConsentState {
	if (browser) {
		const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
		if (stored) {
			try {
				return JSON.parse(stored);
			} catch {
				return {
					captchaVerified: false,
					consentAccepted: false,
					sessionToken: null,
					consentSaved: false
				};
			}
		}
	}

	return {
		captchaVerified: false,
		consentAccepted: false,
		sessionToken: null,
		consentSaved: false
	};
}

// Crear el store
function createConsentStore() {
	const { subscribe, set, update } = writable<ConsentState>(getInitialState());

	return {
		subscribe,
		
		// Marcar CAPTCHA como verificado
		setCaptchaVerified: (verified: boolean, token?: string) => {
			update(state => {
				const newState = {
					...state,
					captchaVerified: verified,
					sessionToken: token || state.sessionToken
				};
				if (browser) {
					localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newState));
				}
				return newState;
			});
		},

		// Marcar consentimiento como aceptado
		setConsentAccepted: (accepted: boolean) => {
			update(state => {
				const newState = {
					...state,
					consentAccepted: accepted
				};
				if (browser) {
					localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newState));
				}
				return newState;
			});
		},

		// Marcar consentimiento como guardado en BD
		setConsentSaved: (saved: boolean) => {
			update(state => {
				const newState = {
					...state,
					consentSaved: saved
				};
				if (browser) {
					localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newState));
				}
				return newState;
			});
		},

		// Establecer token de sesión
		setSessionToken: (token: string) => {
			update(state => {
				const newState = {
					...state,
					sessionToken: token
				};
				if (browser) {
					localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newState));
				}
				return newState;
			});
		},

		// Resetear todo el estado
		reset: () => {
			const newState = {
				captchaVerified: false,
				consentAccepted: false,
				sessionToken: null,
				consentSaved: false
			};
			if (browser) {
				localStorage.removeItem(CONSENT_STORAGE_KEY);
			}
			set(newState);
		},

		// Verificar si el usuario tiene acceso completo
		hasFullAccess: (): boolean => {
			const state = getInitialState();
			return state.captchaVerified && state.consentAccepted && state.consentSaved;
		}
	};
}

export const consentStore = createConsentStore();
