# 🔄 Guía de Migración: Blog Estático → Blog Dinámico

## 📋 Descripción

Esta guía te ayudará a convertir tu blog estático basado en archivos Markdown a un blog dinámico administrable desde la base de datos Supabase.

---

## ✅ Pasos Previos (Requisitos)

### 1. Configurar Permisos en Supabase

Antes de ejecutar la migración, debes configurar los permisos de las tablas de blog en Supabase:

**Opción A: Desactivar RLS (Recomendado para desarrollo)**

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Ejecuta este script:

```sql
-- Desactivar Row Level Security para las tablas de blog
ALTER TABLE blog_categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categoria DISABLE ROW LEVEL SECURITY;
```

**Opción B: Crear Políticas Permisivas (Para producción)**

```sql
-- Habilitar RLS
ALTER TABLE blog_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categoria ENABLE ROW LEVEL SECURITY;

-- Crear políticas que permitan todas las operaciones
CREATE POLICY "Permitir todo en blog_categorias"
  ON blog_categorias FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir todo en blog_posts"
  ON blog_posts FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir todo en blog_post_categoria"
  ON blog_post_categoria FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 2. Crear Usuario Administrador (Si no existe)

Los posts necesitan un `autor_id`. Verifica que exista una tabla `usuarios` con al menos un registro:

```sql
-- Verificar si existe la tabla usuarios
SELECT * FROM usuarios LIMIT 1;

-- Si NO existe, crear tabla básica (ajustar según tu esquema)
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    rol TEXT DEFAULT 'editor',
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Crear usuario administrador de ejemplo
INSERT INTO usuarios (nombre, email, rol)
VALUES ('Administrador UCE', 'admin@uce.edu.ec', 'admin')
RETURNING id;
```

**Importante:** Anota el `id` del usuario que usarás como autor. Por defecto el script usa `autor_id = 1`.

---

## 🚀 Ejecutar Migración

### Paso 1: Preparar el Script

El script de migración está en: `/migrate-blog-to-db.js`

Asegúrate de que tu archivo `.env` tenga las variables de Supabase:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
```

### Paso 2: Ajustar ID de Autor (Opcional)

Abre `migrate-blog-to-db.js` y modifica la línea 155 si tu usuario administrador tiene un ID diferente a 1:

```javascript
// Línea 155
const AUTOR_ID = 1; // Cambiar por el ID real de tu usuario administrador
```

### Paso 3: Ejecutar el Script

```bash
# Desde la raíz del proyecto
node migrate-blog-to-db.js
```

### Paso 4: Verificar Resultados

El script mostrará un resumen como:

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     📦 MIGRACIÓN: BLOG ESTÁTICO → BLOG DINÁMICO              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

📂 Buscando archivos Markdown en: src/routes/(blog-article)/blog-posts
📄 Encontrados 12 archivos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Procesando: Revista07/+page.md
  Título: INVESTIGA UCE Revista N° 07...
  Slug: investiga-uce-revista-n-07...
  ✓ Post creado (ID: 1)
  Procesando 7 categorías...
  ✓ Categoría creada: Revista
  ✓ Categoría creada: COVID-19
✅ Migración exitosa

...

═══════════════════════════════════════════════════════════════
║  📊 RESUMEN DE MIGRACIÓN
═══════════════════════════════════════════════════════════════

Total archivos: 12
✅ Migrados exitosamente: 12
⚠️  Omitidos (ya existían): 0
❌ Fallidos: 0

📈 Tasa de éxito: 100.00%

🎉 ¡Migración completada!
```

---

## 🔍 Verificar Migración

### Opción 1: Usar el Script de Prueba

```bash
node test-read-endpoints.js
```

Busca en la sección de Blog:

```
═══════════════════════════════════════════════════════════════
║  📝 BLOG
═══════════════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 GET /api/admin/blog
📝 Listar todos los posts de blog
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Success (200)
📊 Total registros: 12  ← Tus posts migrados
```

### Opción 2: Consultar Directamente

```bash
# Ver total de posts
curl -s http://localhost:5173/api/admin/blog | jq '.data.pagination.total'

# Ver primer post
curl -s http://localhost:5173/api/admin/blog?limit=1 | jq '.data.data[0].titulo'

# Ver categorías creadas
curl -s http://localhost:5173/api/admin/blog/categorias | jq '.data[] | .nombre'
```

### Opción 3: Consultar en Supabase Dashboard

1. Ve a **Table Editor** en Supabase
2. Selecciona la tabla `blog_posts`
3. Deberías ver todos tus posts migrados

---

## 🎨 Actualizar el Frontend

Ahora que los posts están en la base de datos, necesitas actualizar tu aplicación para consumirlos desde la API:

### Archivo a Modificar: `src/routes/blog/+page.server.ts`

```typescript
// Antes (lectura desde archivos)
import { filteredPosts } from '$lib/data/blog-posts';

export async function load() {
	return {
		posts: filteredPosts
	};
}
```

```typescript
// Después (lectura desde API)
export async function load({ fetch }) {
	const response = await fetch('/api/admin/blog?publicado=true');
	const result = await response.json();

	return {
		posts: result.data.data || []
	};
}
```

### Actualizar Componentes de Visualización

Si usas componentes como `BlogPostCard.svelte`, asegúrate de que mapeen correctamente los campos:

**Antes (Markdown):**

- `post.title` → **Después:** `post.titulo`
- `post.date` → **Después:** `post.fecha_publicacion`
- `post.excerpt` → **Después:** `post.contenido.substring(0, 200)`
- `post.coverImage` → **Después:** `post.imagen_portada`
- `post.tags` → **Después:** `post.categorias`

---

## 🗑️ Limpieza (Opcional)

Una vez verificada la migración exitosa, puedes:

### 1. Mantener Archivos Markdown como Respaldo

Recomendado: Mueve los archivos a una carpeta de respaldo:

```bash
mkdir -p backups/blog-markdown
mv src/routes/\(blog-article\)/blog-posts/* backups/blog-markdown/
```

### 2. Eliminar Sistema Estático (Si estás seguro)

```bash
# Eliminar rutas estáticas
rm -rf src/routes/\(blog-article\)/blog-posts/

# Eliminar utilidades de Markdown (opcional)
rm -rf src/lib/data/blog-posts/
```

**⚠️ Advertencia:** Solo elimina después de confirmar que todo funciona correctamente.

---

## 🐛 Solución de Problemas

### Error: "permission denied for table blog_posts"

**Causa:** RLS (Row Level Security) está activo y bloqueando operaciones.

**Solución:** Ejecuta el script SQL del Paso Previo #1.

### Error: "Cannot coerce the result to a single JSON object"

**Causa:** No existe un usuario con el ID especificado en `AUTOR_ID`.

**Solución:**

1. Verifica que exista un usuario: `SELECT * FROM usuarios;`
2. Ajusta `AUTOR_ID` en el script con el ID correcto.

### Posts no aparecen en el frontend

**Causa:** El frontend aún está leyendo desde archivos Markdown.

**Solución:** Actualiza `+page.server.ts` como se indica en la sección "Actualizar el Frontend".

### Categorías duplicadas

**Causa:** El script crea categorías basadas en tags, algunos pueden tener nombres similares.

**Solución:**

```sql
-- Ver categorías duplicadas
SELECT nombre, COUNT(*) as total
FROM blog_categorias
GROUP BY nombre
HAVING COUNT(*) > 1;

-- Fusionar manualmente si es necesario
```

---

## 📞 Soporte

Si encuentras algún problema durante la migración:

1. Revisa los logs del script para ver el error exacto
2. Verifica que Supabase esté accesible: `curl $PUBLIC_SUPABASE_URL`
3. Consulta la documentación de Supabase sobre RLS
4. Verifica que tu archivo `.env` tenga las credenciales correctas

---

## ✅ Checklist de Migración

- [ ] Tablas de blog creadas en Supabase
- [ ] Permisos RLS configurados
- [ ] Usuario administrador creado
- [ ] Variables de entorno verificadas
- [ ] Script de migración ejecutado exitosamente
- [ ] Posts verificados en base de datos
- [ ] Frontend actualizado para usar API
- [ ] Archivos Markdown respaldados (opcional)
- [ ] Pruebas de lectura exitosas
- [ ] Panel de administración probado

---

**¡Felicidades! Tu blog ahora es dinámico y completamente administrable desde la base de datos.** 🎉
