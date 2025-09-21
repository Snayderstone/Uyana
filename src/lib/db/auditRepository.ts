import { supabase } from '$lib/supabase';

type AuditLog = {
  accion: 'login' | 'logout' | 'insert' | 'update' | 'delete';
  usuario_id: string | null;
  tabla_afectada: string | null;
  registro_id: string | null;
  valores_anteriores?: Record<string, unknown> | null;
  valores_nuevos?: Record<string, unknown> | null;
  ip?: string | null;
  user_agent?: string | null;
};

export const auditRepository = {
  async log(payload: AuditLog) {
    await supabase.from('audit_logs').insert({
      usuario_id: payload.usuario_id,
      accion: payload.accion,
      tabla_afectada: payload.tabla_afectada,
      registro_id: payload.registro_id,
      valores_anteriores: payload.valores_anteriores ?? null,
      valores_nuevos: payload.valores_nuevos ?? null,
      ip: payload.ip ?? null,
      user_agent: payload.user_agent ?? null
    });
  }
};
