-- Tablas adicionales para el blog
-- Estas tablas no están en el esquema original, por lo que deben crearse

CREATE TABLE IF NOT EXISTS blog_posts (
    id BIGSERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    contenido TEXT NOT NULL,
    autor_id BIGINT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    imagen_portada TEXT,
    publicado BOOLEAN DEFAULT false,
    fecha_publicacion TIMESTAMP,
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_categorias (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS blog_post_categoria (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    categoria_id BIGINT NOT NULL,
    UNIQUE(post_id, categoria_id)
);

-- Foreign keys para blog
ALTER TABLE blog_posts
    ADD CONSTRAINT fk_blog_posts_autor
        FOREIGN KEY (autor_id) REFERENCES usuarios(id)
        ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE blog_post_categoria
    ADD CONSTRAINT fk_blog_post_categoria_post
        FOREIGN KEY (post_id) REFERENCES blog_posts(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT fk_blog_post_categoria_categoria
        FOREIGN KEY (categoria_id) REFERENCES blog_categorias(id)
        ON DELETE CASCADE ON UPDATE CASCADE;

-- Índices para mejorar rendimiento
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_publicado ON blog_posts(publicado);
CREATE INDEX idx_blog_posts_autor ON blog_posts(autor_id);
