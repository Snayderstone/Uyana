# Scripts SQL para Preparar la Migración del Blog

## 1. Desactivar RLS en Tablas de Blog y Usuarios

Ejecuta esto en el **SQL Editor** de Supabase:

```sql
-- Desactivar RLS en tablas de blog
ALTER TABLE blog_categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categoria DISABLE ROW LEVEL SECURITY;

-- Desactivar RLS en tabla de usuarios (necesario para crear el admin)
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_rol DISABLE ROW LEVEL SECURITY;
```

## 2. Verificar que las Tablas Existen

```sql
-- Verificar tablas de blog
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('blog_posts', 'blog_categorias', 'blog_post_categoria');

-- Verificar tablas de usuarios
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('usuarios', 'roles', 'usuario_rol');
```

## 3. Crear Usuario Administrador Manualmente (Alternativa)

Si prefieres crear el usuario directamente en SQL en lugar de usar el script:

```sql
-- Insertar usuario administrador
INSERT INTO usuarios (email, nombre, contraseña_hash, creado_en, actualizado_en)
VALUES (
    'admin@uce.edu.ec',
    'Administrador UCE',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', -- hash de 'admin123'
    NOW(),
    NOW()
)
RETURNING id;
```

**⚠️ IMPORTANTE:** Anota el `id` que devuelva esta consulta. Lo necesitarás para el script de migración.

## 4. Crear Rol Admin (Opcional)

```sql
-- Crear rol de administrador
INSERT INTO roles (nombre)
VALUES ('admin')
ON CONFLICT (nombre) DO NOTHING
RETURNING id;

-- Asignar rol al usuario (cambiar IDS según corresponda)
INSERT INTO usuario_rol (usuario_id, rol_id, asignado_en)
VALUES (
    1, -- ID del usuario creado arriba
    (SELECT id FROM roles WHERE nombre = 'admin'),
    NOW()
);
```

## 5. Verificar Usuario Creado

```sql
-- Ver el usuario creado
SELECT id, email, nombre, creado_en
FROM usuarios
WHERE email = 'admin@uce.edu.ec';
```

---

## ✅ Checklist

- [ ] RLS desactivado en tablas de blog
- [ ] RLS desactivado en tabla usuarios
- [ ] Usuario administrador creado
- [ ] ID del usuario anotado
- [ ] Actualizar `AUTOR_ID` en `migrate-blog-to-db.js` con el ID real

---

## 🚀 Siguiente Paso

Una vez completado el checklist, ejecuta:

```bash
node migrate-blog-to-db.js
```
