-- === ROLES BÁSICOS ===
create table if not exists public.roles (
  id serial primary key,
  name text unique not null check (length(name) > 0),
  description text default ''
);

insert into public.roles (name, description)
  values ('admin','Administrador con control total'),
         ('investigador','Puede insertar registros')
on conflict (name) do nothing;

-- === PERFIL DE USUARIO (enlazado a auth.users) ===
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text default '',
  created_at timestamptz not null default now()
);

-- === RELACIÓN USUARIO-ROL (N:N) ===
create table if not exists public.user_roles (
  user_id uuid references public.profiles(user_id) on delete cascade,
  role_id int references public.roles(id) on delete restrict,
  primary key (user_id, role_id)
);

-- Helpers para roles
create or replace function public.has_role(role_name text)
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = role_name
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable
as $$ select public.has_role('admin'); $$;

-- === AUDITORÍA ===
create table if not exists public.audit_logs (
  id bigserial primary key,
  usuario_id uuid,
  accion text not null,                       -- 'login','logout','insert','update','delete'
  tabla_afectada text,
  registro_id text,
  valores_anteriores jsonb,
  valores_nuevos jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_usuario on public.audit_logs(usuario_id);

-- === FUNCIÓN Y TRIGGER DE AUDITORÍA GENÉRICA POR TABLA ===
-- Esta función sirve para cualquier tabla que quieras auditar.
create or replace function public.fn_audit_trigger()
returns trigger
language plpgsql
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_id  text;
begin
  if (TG_OP = 'INSERT') then
    v_new := to_jsonb(NEW);
    v_id := (NEW.*)::jsonb->> 'id';
    insert into public.audit_logs(usuario_id, accion, tabla_afectada, registro_id, valores_nuevos)
      values (auth.uid(), 'insert', TG_TABLE_NAME, v_id, v_new);
    return NEW;

  elsif (TG_OP = 'UPDATE') then
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_id := coalesce((NEW.*)::jsonb->> 'id', (OLD.*)::jsonb->> 'id');
    insert into public.audit_logs(usuario_id, accion, tabla_afectada, registro_id, valores_anteriores, valores_nuevos)
      values (auth.uid(), 'update', TG_TABLE_NAME, v_id, v_old, v_new);
    return NEW;

  elsif (TG_OP = 'DELETE') then
    v_old := to_jsonb(OLD);
    v_id := (OLD.*)::jsonb->> 'id';
    insert into public.audit_logs(usuario_id, accion, tabla_afectada, registro_id, valores_anteriores)
      values (auth.uid(), 'delete', TG_TABLE_NAME, v_id, v_old);
    return OLD;
  end if;
  return null;
end;
$$;

-- Ejemplo: si tu tabla de investigaciones es public.investigaciones, añade:
-- drop trigger if exists trg_audit_investigaciones on public.investigaciones;
-- create trigger trg_audit_investigaciones
-- after insert or update or delete on public.investigaciones
-- for each row execute function public.fn_audit_trigger();

-- === RLS ===
alter table public.profiles    enable row level security;
alter table public.user_roles  enable row level security;
alter table public.audit_logs  enable row level security;

-- PROFILES: cada quien ve su perfil; admin ve todos.
drop policy if exists p_profiles_self_select on public.profiles;
create policy p_profiles_self_select on public.profiles
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists p_profiles_self_update on public.profiles;
create policy p_profiles_self_update on public.profiles
  for update using (auth.uid() = user_id or public.is_admin());

-- USER_ROLES: admin gestiona; cada quien puede ver sus roles
drop policy if exists p_user_roles_select on public.user_roles;
create policy p_user_roles_select on public.user_roles
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists p_user_roles_admin_ins on public.user_roles;
create policy p_user_roles_admin_ins on public.user_roles
  for insert with check (public.is_admin());

drop policy if exists p_user_roles_admin_del on public.user_roles;
create policy p_user_roles_admin_del on public.user_roles
  for delete using (public.is_admin());

-- AUDIT_LOGS: cualquiera puede insertar su log; admin puede leer todo; usuario puede leer sus propios logs.
drop policy if exists p_audit_insert on public.audit_logs;
create policy p_audit_insert on public.audit_logs
  for insert with check (auth.role() = 'authenticated');  -- cualquiera autenticado inserta

drop policy if exists p_audit_select_admin on public.audit_logs;
create policy p_audit_select_admin on public.audit_logs
  for select using (public.is_admin());

drop policy if exists p_audit_select_self on public.audit_logs;
create policy p_audit_select_self on public.audit_logs
  for select using (usuario_id = auth.uid());

-- (Opcional) si tienes "investigaciones" y quieres que:
--   - admin: CRUD
--   - investigador: INSERT solo
--   - todos leen (o ajusta)
-- Recuerda: ENABLE RLS también en tu tabla de dominio.
-- alter table public.investigaciones enable row level security;
-- create policy inv_select_all on public.investigaciones for select using (true);
-- create policy inv_insert_investigador on public.investigaciones for insert
--   with check (public.has_role('investigador') or public.is_admin());
-- create policy inv_update_admin on public.investigaciones for update using (public.is_admin());
-- create policy inv_delete_admin on public.investigaciones for delete using (public.is_admin());

-- === INSTRUCCIONES DE USO ========================================================================
--Cómo auditar tus tablas de dominio
--1. Activa RLS y las políticas como mostré.
--2. Crea el trigger para cada tabla que quieras auditar:
-- ejemplo para public.investigaciones
drop trigger if exists trg_audit_investigaciones on public.investigaciones;
create trigger trg_audit_investigaciones
after insert or update or delete on public.investigaciones
for each row execute function public.fn_audit_trigger();
--3. Cada login/logout ya queda registrado por el auditRepository.log que llamamos en authService.
-- === FIN ===