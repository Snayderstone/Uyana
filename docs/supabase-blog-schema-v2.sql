-- ========================================
-- ESQUEMA DE BASE DE DATOS MEJORADO - BLOG PROFESIONAL
-- ========================================

-- 1. TABLA DE POSTS (mejorada)
DROP TABLE IF EXISTS blog_post_categoria CASCADE;
DROP TABLE IF EXISTS blog_post_etiqueta CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS blog_categorias CASCADE;
DROP TABLE IF EXISTS blog_etiquetas CASCADE;

CREATE TABLE blog_posts (
    id BIGSERIAL PRIMARY KEY,
    
    -- Contenido principal
    titulo TEXT NOT NULL,
    contenido TEXT NOT NULL, -- HTML del editor WYSIWYG
    resumen TEXT, -- Auto-generado o manual
    imagen_portada TEXT,
    
    -- Metadata
    autor_id BIGINT NOT NULL,
    autor_nombre TEXT, -- Desnormalizado para rendimiento
    
    -- Publicación
    publicado BOOLEAN DEFAULT false,
    fecha_publicacion TIMESTAMP DEFAULT NOW(),
    
    -- SEO (para futuro)
    slug TEXT UNIQUE, -- Auto-generado desde título
    meta_descripcion TEXT,
    meta_keywords TEXT,
    
    -- Estadísticas
    vistas INTEGER DEFAULT 0,
    tiempo_lectura_min INTEGER, -- Calculado automáticamente
    
    -- Auditoría
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

-- 2. TABLA DE CATEGORÍAS (mejorada)
CREATE TABLE blog_categorias (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    color TEXT DEFAULT '#6366f1', -- Color para UI
    icono TEXT, -- Emoji o código de icono
    orden INTEGER DEFAULT 0, -- Para ordenar en UI
    creado_en TIMESTAMP DEFAULT NOW()
);

-- 3. NUEVA TABLA DE ETIQUETAS/TAGS
CREATE TABLE blog_etiquetas (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#8b5cf6', -- Color diferente de categorías
    uso_count INTEGER DEFAULT 0, -- Contador de uso
    creado_en TIMESTAMP DEFAULT NOW()
);

-- 4. RELACIÓN POST-CATEGORÍA (un post puede tener múltiples categorías)
CREATE TABLE blog_post_categoria (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    categoria_id BIGINT NOT NULL REFERENCES blog_categorias(id) ON DELETE CASCADE,
    UNIQUE(post_id, categoria_id)
);

-- 5. RELACIÓN POST-ETIQUETA (un post puede tener múltiples etiquetas)
CREATE TABLE blog_post_etiqueta (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    etiqueta_id BIGINT NOT NULL REFERENCES blog_etiquetas(id) ON DELETE CASCADE,
    UNIQUE(post_id, etiqueta_id)
);

-- ========================================
-- ÍNDICES PARA RENDIMIENTO
-- ========================================

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_publicado ON blog_posts(publicado);
CREATE INDEX idx_blog_posts_fecha_publicacion ON blog_posts(fecha_publicacion DESC);
CREATE INDEX idx_blog_posts_autor ON blog_posts(autor_id);
CREATE INDEX idx_blog_posts_vistas ON blog_posts(vistas DESC);

CREATE INDEX idx_blog_post_categoria_post ON blog_post_categoria(post_id);
CREATE INDEX idx_blog_post_categoria_categoria ON blog_post_categoria(categoria_id);

CREATE INDEX idx_blog_post_etiqueta_post ON blog_post_etiqueta(post_id);
CREATE INDEX idx_blog_post_etiqueta_etiqueta ON blog_post_etiqueta(etiqueta_id);

-- ========================================
-- FUNCIONES AUTOMÁTICAS
-- ========================================

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar_timestamp en blog_posts
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para generar slug único desde título
CREATE OR REPLACE FUNCTION generate_unique_slug(titulo_input TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convertir título a slug base
    base_slug := lower(trim(titulo_input));
    base_slug := regexp_replace(base_slug, '[áàäâã]', 'a', 'g');
    base_slug := regexp_replace(base_slug, '[éèëê]', 'e', 'g');
    base_slug := regexp_replace(base_slug, '[íìïî]', 'i', 'g');
    base_slug := regexp_replace(base_slug, '[óòöôõ]', 'o', 'g');
    base_slug := regexp_replace(base_slug, '[úùüû]', 'u', 'g');
    base_slug := regexp_replace(base_slug, '[ñ]', 'n', 'g');
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
    
    final_slug := base_slug;
    
    -- Verificar si existe y agregar número si es necesario
    WHILE EXISTS (SELECT 1 FROM blog_posts WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- DATOS INICIALES - CATEGORÍAS
-- ========================================

INSERT INTO blog_categorias (nombre, slug, descripcion, color, icono, orden) VALUES
('Investigación', 'investigacion', 'Proyectos y resultados de investigación científica', '#3b82f6', '🔬', 1),
('Tecnología', 'tecnologia', 'Innovación y desarrollo tecnológico', '#8b5cf6', '💻', 2),
('Educación', 'educacion', 'Formación y desarrollo académico', '#10b981', '📚', 3),
('Ciencia', 'ciencia', 'Descubrimientos y avances científicos', '#f59e0b', '🧪', 4),
('Innovación', 'innovacion', 'Proyectos innovadores y emprendimiento', '#ef4444', '💡', 5),
('Publicaciones', 'publicaciones', 'Artículos y papers académicos', '#6366f1', '📄', 6),
('Eventos', 'eventos', 'Conferencias, seminarios y actividades', '#ec4899', '🎯', 7),
('Noticias', 'noticias', 'Novedades y comunicados de la UCE', '#06b6d4', '📰', 8)
ON CONFLICT (nombre) DO NOTHING;

-- ========================================
-- DATOS INICIALES - ETIQUETAS COMUNES
-- ========================================

INSERT INTO blog_etiquetas (nombre, slug, color) VALUES
('UCE', 'uce', '#1e40af'),
('Investigación Científica', 'investigacion-cientifica', '#7c3aed'),
('Desarrollo', 'desarrollo', '#059669'),
('Publicación', 'publicacion', '#d97706'),
('Proyecto', 'proyecto', '#dc2626'),
('Estudiantes', 'estudiantes', '#4f46e5'),
('Docentes', 'docentes', '#be185d'),
('Colaboración', 'colaboracion', '#0891b2')
ON CONFLICT (nombre) DO NOTHING;

-- ========================================
-- MIGRAR DATOS EXISTENTES (si hay)
-- ========================================

-- Actualizar posts existentes con slug si no lo tienen
UPDATE blog_posts
SET slug = generate_unique_slug(titulo)
WHERE slug IS NULL OR slug = '';

-- ========================================
-- PERMISOS (para desarrollo - ajustar en producción)
-- ========================================

-- Comentar estas líneas en producción y usar RLS apropiadamente
GRANT ALL ON blog_posts TO service_role;
GRANT ALL ON blog_categorias TO service_role;
GRANT ALL ON blog_etiquetas TO service_role;
GRANT ALL ON blog_post_categoria TO service_role;
GRANT ALL ON blog_post_etiqueta TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ========================================
-- VISTAS ÚTILES
-- ========================================

-- Vista de posts con toda la información relacionada
CREATE OR REPLACE VIEW blog_posts_completos AS
SELECT 
    p.*,
    -- Categorías como array
    COALESCE(
        (SELECT json_agg(json_build_object('id', c.id, 'nombre', c.nombre, 'slug', c.slug, 'color', c.color))
         FROM blog_categorias c
         INNER JOIN blog_post_categoria pc ON pc.categoria_id = c.id
         WHERE pc.post_id = p.id),
        '[]'::json
    ) as categorias,
    -- Etiquetas como array
    COALESCE(
        (SELECT json_agg(json_build_object('id', e.id, 'nombre', e.nombre, 'slug', e.slug, 'color', e.color))
         FROM blog_etiquetas e
         INNER JOIN blog_post_etiqueta pe ON pe.etiqueta_id = e.id
         WHERE pe.post_id = p.id),
        '[]'::json
    ) as etiquetas
FROM blog_posts p;

COMMENT ON VIEW blog_posts_completos IS 'Vista completa de posts con categorías y etiquetas';

-- ========================================
-- FIN DEL ESQUEMA
-- ========================================
