/**
 * Investigator Service
 * --------------------
 * Construye InvestigatorModel desde múltiples tablas relacionadas.
 */
// src/lib/services/investigator.service.ts

import { supabase } from '$lib/db/supabase.client';
import type { Investigador } from '$lib/models/investigator.model';

// ⚙️ Sólo lógica de negocio / transformación, sin crear cliente Supabase aquí.

/**
 * Procesa el string de redes y lo convierte en un array usable por la UI.
 */
export function procesarRedes(redesString: string): Array<{ nombre: string; url: string }> {
  if (!redesString) return [];

  const redes = redesString
    .split('|')
    .map((red) => red.trim())
    .filter((red) => red.length > 0);

  return redes
    .map((red) => {
      let cleanUrl = red;

      if (
        !cleanUrl.startsWith('http://') &&
        !cleanUrl.startsWith('https://') &&
        !cleanUrl.startsWith('mailto:')
      ) {
        if (cleanUrl.toUpperCase().startsWith('HTTPS://')) {
          cleanUrl = cleanUrl.replace(/^HTTPS:\/\//i, 'https://');
        } else if (cleanUrl.includes('@') && !cleanUrl.includes('.')) {
          cleanUrl = `mailto:${cleanUrl}`;
        } else {
          cleanUrl = `https://${cleanUrl}`;
        }
      }

      if (cleanUrl.includes('orcid.org')) {
        return { nombre: 'ORCID', url: cleanUrl };
      } else if (cleanUrl.includes('researchgate.net')) {
        return { nombre: 'ResearchGate', url: cleanUrl };
      } else if (cleanUrl.includes('academia.edu')) {
        return { nombre: 'Academia.edu', url: cleanUrl };
      } else if (cleanUrl.includes('facebook.com')) {
        return { nombre: 'Facebook', url: cleanUrl };
      } else if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
        return { nombre: 'Twitter', url: cleanUrl };
      } else if (cleanUrl.startsWith('mailto:')) {
        return { nombre: 'Email', url: cleanUrl };
      } else {
        try {
          const url = new URL(cleanUrl);
          const domain = url.hostname.replace('www.', '').split('.')[0];
          return { nombre: domain.charAt(0).toUpperCase() + domain.slice(1), url: cleanUrl };
        } catch {
          return null;
        }
      }
    })
    .filter((red) => red !== null) as Array<{ nombre: string; url: string }>;
}

/**
 * Obtiene todos los investigadores desde la BD nueva.
 * OJO: aquí debes asegurarte de apuntar a la tabla correcta.
 */
export async function obtenerInvestigadores(): Promise<Investigador[]> {
  const { data, error } = await supabase.from('investigadores_uce_def').select('*');

  if (error) {
    console.error('Error al obtener investigadores:', error);
    return [];
  }

  return data.map((investigador: Investigador) => ({
    ...investigador,
    redesArray: procesarRedes(investigador.redes)
  }));
}
