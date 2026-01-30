import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { consentRepository } from '$lib/db/consent.repository';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		const body = await request.json();
		const { sessionToken, usuarioId, termsVersion, privacyVersion, academicUseVersion } = body;

		// Validar que se proporcione un token de sesión
		if (!sessionToken) {
			return json({ success: false, error: 'Token de sesión requerido' }, { status: 400 });
		}

		// Obtener IP real del cliente considerando proxies
		// En producción, los proxies (Cloudflare, Vercel, etc.) envían la IP real en estos headers
		let ipAddress = getClientAddress();
		
		// Intentar obtener IP real de los headers de proxy
		const forwardedFor = request.headers.get('x-forwarded-for');
		const realIp = request.headers.get('x-real-ip');
		const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
		
		if (cfConnectingIp) {
			ipAddress = cfConnectingIp;
		} else if (realIp) {
			ipAddress = realIp;
		} else if (forwardedFor) {
			// x-forwarded-for puede contener múltiples IPs separadas por coma
			// La primera es la IP original del cliente
			ipAddress = forwardedFor.split(',')[0].trim();
		}

		// Obtener User-Agent
		const userAgent = request.headers.get('user-agent');

		// Guardar consentimiento
		const result = await consentRepository.saveConsent({
			sessionToken,
			usuarioId: usuarioId || null,
			ipAddress,
			userAgent,
			termsVersion: termsVersion || '1.0',
			privacyVersion: privacyVersion || '1.0',
			academicUseVersion: academicUseVersion || '1.0'
		});

		if (!result.success) {
			return json(
				{ success: false, error: result.error || 'Error al guardar consentimiento' },
				{ status: 500 }
			);
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error en API de consentimiento:', error);
		return json(
			{ success: false, error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
};
