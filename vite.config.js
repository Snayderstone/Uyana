import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$routes: path.resolve('./src/routes')
		}
	},
	// Define variables de entorno públicas que pueden ser utilizadas en el código del cliente
	define: {
		'import.meta.env.PUBLIC_SUPABASE_URL': JSON.stringify(process.env.PUBLIC_SUPABASE_URL),
		'import.meta.env.PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(process.env.PUBLIC_SUPABASE_ANON_KEY),
		'import.meta.env.PUBLIC_HCAPTCHA_SITE_KEY': JSON.stringify(process.env.PUBLIC_HCAPTCHA_SITE_KEY)
		// No exponemos la API key de DeepSeek ni HCAPTCHA_SECRET_KEY como variables públicas por seguridad
	}
};

export default config;
