import { redirect } from '@sveltejs/kit';

export async function GET() {
	// Redireccionar solicitudes incorrectas del favicon a la ubicación correcta
	throw redirect(301, '/favicons/favicon.ico');
}
