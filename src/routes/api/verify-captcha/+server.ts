import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verify } from 'hcaptcha';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { token } = await request.json();

		if (!token) {
			return json({ success: false, error: 'Token de hCaptcha requerido' }, { status: 400 });
		}

		// Verificar el token con hCaptcha usando la librería
		const secret = process.env.HCAPTCHA_SECRET_KEY;
		
		if (!secret) {
			console.error('HCAPTCHA_SECRET_KEY no está configurada');
			return json({ success: false, error: 'Error de configuración del servidor' }, { status: 500 });
		}

		// Usar la librería hcaptcha para verificar
		const verifyData = await verify(secret, token);

		if (verifyData.success === true) {
			return json({ success: true });
		} else {
			return json({ 
				success: false, 
				error: 'Verificación de CAPTCHA fallida',
				'error-codes': verifyData['error-codes'] || []
			}, { status: 400 });
		}
	} catch (error) {
		console.error('Error verificando hCaptcha:', error);
		return json(
			{ success: false, error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
};
