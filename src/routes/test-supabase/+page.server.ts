import type { PageServerLoad } from './$types';
import { supabase } from '$lib/db/supabase.client';

export const load: PageServerLoad = async () => {
  // PRUEBA 1: Verificación de conexión
  const testPing = await supabase.from('proyectos').select('id').limit(1);

  // PRUEBA 2: Verificar acceso a algunas tablas relacionadas
  const testInstituciones = await supabase.from('instituciones').select('id, nombre').limit(3);

  const testFacultades = await supabase.from('facultades').select('id, nombre').limit(3);

  const testParticipantes = await supabase.from('participantes').select('id, nombre').limit(3);

  const testAreas = await supabase.from('areas_conocimiento').select('id, nombre').limit(3);

  const testTipos = await supabase.from('tipos').select('id, nombre').limit(3);


  return {
    supabaseConfigured: true,
    proyectos: testPing,
    instituciones: testInstituciones,
    facultades: testFacultades,
    participantes: testParticipantes,
    areas: testAreas,
    tipos: testTipos
  };
};
