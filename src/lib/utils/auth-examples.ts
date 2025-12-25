/**
 * Ejemplos de cómo proteger APIs existentes
 */

// ============================================
// Ejemplo 1: Proteger GET simple
// ============================================
/*
// Antes (sin protección):
export async function GET() {
  const data = await obtenerDatos();
  return json({ data });
}

// Después (con protección):
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

export async function GET(event) {
  try {
    await requireAdmin(event);
    const data = await obtenerDatos();
    return json({ data });
  } catch {
    return jsonError('No autorizado', 401);
  }
}
*/

// ============================================
// Ejemplo 2: Proteger POST con validación
// ============================================
/*
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

export async function POST(event) {
  try {
    const usuario = await requireAdmin(event);
    
    const body = await event.request.json();
    
    // Validar datos
    if (!body.titulo || !body.descripcion) {
      return jsonError('Datos incompletos', 400);
    }
    
    // Crear recurso
    const resultado = await crearRecurso(body);
    
    // Log de auditoría (opcional)
    console.log(`Usuario ${usuario.email} creó recurso:`, resultado.id);
    
    return json({ success: true, data: resultado });
  } catch (error) {
    if (error.message === 'No autenticado') {
      return jsonError('No autorizado', 401);
    }
    return jsonError('Error interno', 500);
  }
}
*/

// ============================================
// Ejemplo 3: Proteger DELETE
// ============================================
/*
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

export async function DELETE(event) {
  try {
    await requireAdmin(event);
    
    const id = event.url.searchParams.get('id');
    
    if (!id) {
      return jsonError('ID requerido', 400);
    }
    
    await eliminarRecurso(Number(id));
    
    return json({ success: true, mensaje: 'Eliminado exitosamente' });
  } catch {
    return jsonError('No autorizado', 401);
  }
}
*/

// ============================================
// Ejemplo 4: Verificar rol específico
// ============================================
/*
import { requireRole, jsonError } from '$lib/utils/auth.utils';

export async function POST(event) {
  try {
    // Solo usuarios con rol "Editor" o superior
    await requireRole(event, 'Editor');
    
    // Tu lógica aquí...
    
    return json({ success: true });
  } catch {
    return jsonError('Permisos insuficientes', 403);
  }
}
*/

// ============================================
// Ejemplo 5: Información del usuario en la respuesta
// ============================================
/*
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

export async function GET(event) {
  try {
    const usuario = await requireAdmin(event);
    
    const data = await obtenerDatosPersonalizados(usuario.id);
    
    return json({
      success: true,
      data,
      usuario: {
        nombre: usuario.nombre,
        email: usuario.email
      }
    });
  } catch {
    return jsonError('No autorizado', 401);
  }
}
*/

// ============================================
// Ejemplo 6: Proteger solo ciertos métodos
// ============================================
/*
import { verifyAuth, jsonError } from '$lib/utils/auth.utils';

// GET público
export async function GET() {
  const data = await obtenerDatosPublicos();
  return json({ data });
}

// POST protegido
export async function POST(event) {
  const usuario = await verifyAuth(event);
  
  if (!usuario) {
    return jsonError('No autorizado', 401);
  }
  
  // Tu lógica aquí...
  return json({ success: true });
}
*/

// ============================================
// Ejemplo 7: Verificar sin lanzar error
// ============================================
/*
import { verifyAuth } from '$lib/utils/auth.utils';

export async function GET(event) {
  const usuario = await verifyAuth(event);
  
  // Datos diferentes según autenticación
  if (usuario) {
    const datosCompletos = await obtenerDatosCompletos();
    return json({ data: datosCompletos, authenticated: true });
  } else {
    const datosBasicos = await obtenerDatosBasicos();
    return json({ data: datosBasicos, authenticated: false });
  }
}
*/

// ============================================
// Ejemplo 8: Middleware reutilizable
// ============================================
/*
// Crear una función helper personalizada
import { verifyAuth } from '$lib/utils/auth.utils';

async function requirePermission(event, permission) {
  const usuario = await verifyAuth(event);
  
  if (!usuario) {
    throw new Error('No autenticado');
  }
  
  // Lógica personalizada de permisos
  if (!usuario.roles.includes('Administrador') && !hasPermission(usuario, permission)) {
    throw new Error('Sin permisos');
  }
  
  return usuario;
}

// Usar en endpoints
export async function POST(event) {
  try {
    const usuario = await requirePermission(event, 'CREATE_PROJECT');
    // Tu lógica...
  } catch (error) {
    return jsonError(error.message, 403);
  }
}
*/

export {}; // Para que sea un módulo válido
