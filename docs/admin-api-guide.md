# API de Administración - Módulo UYANA

## Descripción General

Esta API proporciona endpoints RESTful para la administración completa del sistema UYANA, incluyendo gestión de proyectos de investigación, participantes, blog y catálogos.

## Arquitectura

La implementación sigue una arquitectura en capas:

- **Presentation/UI**: Endpoints API (`/routes/api/admin/`)
- **Application/Services**: Lógica de negocio (`/lib/services/admin/`)
- **Infrastructure/Repositories**: Acceso a datos (`/lib/db/admin/`)
- **Models**: Entidades y DTOs (`/lib/models/admin/`)

## Endpoints Disponibles

### 📋 Proyectos

#### Listar proyectos

```http
GET /api/admin/projects?page=1&limit=10&codigo=&titulo=&estado_id=
```

#### Crear proyecto

```http
POST /api/admin/projects
Content-Type: application/json

{
  "codigo": "PROJ-2025-001",
  "titulo": "Investigación en IA",
  "objetivo": "Desarrollar algoritmos de ML",
  "estado_id": 1,
  "fecha_inicio_planeada": "2025-01-01",
  "fecha_fin_planeada": "2025-12-31",
  "cantidad_meses": 12,
  "porcentaje_avance": 0,
  "monto_presupuesto_total": 50000,
  "impacto_cientifico": "Alto impacto...",
  "impacto_economico": "Generación de empleo...",
  "impacto_social": "Mejora de servicios...",
  "otros_impactos": "N/A",
  "instituciones_ids": [1],
  "tipos_ids": [1],
  "areas_conocimiento_ids": [1],
  "lineas_investigacion_ids": [1],
  "fuentes_financiamiento_ids": [1],
  "participantes": [
    {
      "participante_id": 1,
      "cargo_id": 1,
      "regimen_dedicacion_id": 1
    }
  ]
}
```

#### Obtener proyecto

```http
GET /api/admin/projects/1
```

#### Actualizar proyecto

```http
PUT /api/admin/projects/1
Content-Type: application/json

{
  "titulo": "Nuevo título",
  "porcentaje_avance": 50
}
```

#### Eliminar proyecto

```http
DELETE /api/admin/projects/1
```

---

### 👥 Participantes/Investigadores

#### Listar participantes

```http
GET /api/admin/participants?page=1&limit=10&acreditado=true
```

#### Crear participante

```http
POST /api/admin/participants
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan.perez@example.com",
  "genero": "M",
  "carrera_id": 1,
  "acreditado": true,
  "url_foto": "https://...",
  "redes_sociales": "linkedin.com/in/..."
}
```

#### Obtener participante

```http
GET /api/admin/participants/1
```

#### Actualizar participante

```http
PUT /api/admin/participants/1
Content-Type: application/json

{
  "acreditado": false
}
```

#### Eliminar participante

```http
DELETE /api/admin/participants/1
```

---

### 📝 Blog

#### Listar posts

```http
GET /api/admin/blog?page=1&limit=10&publicado=true
```

#### Crear post

```http
POST /api/admin/blog
Content-Type: application/json

{
  "titulo": "Nuevo artículo",
  "contenido": "Contenido del artículo...",
  "slug": "nuevo-articulo",
  "imagen_portada": "https://...",
  "publicado": true,
  "categorias_ids": [1, 2]
}
```

#### Obtener post

```http
GET /api/admin/blog/1
```

#### Actualizar post

```http
PUT /api/admin/blog/1
Content-Type: application/json

{
  "publicado": false
}
```

#### Eliminar post

```http
DELETE /api/admin/blog/1
```

---

### 📚 Catálogos

Tipos disponibles: `estados`, `tipos`, `areas`, `lineas`, `fuentes`, `cargos`, `regimenes`, `instituciones`, `facultades`, `carreras`

#### Obtener catálogo

```http
GET /api/admin/catalogs/estados
```

#### Crear elemento

```http
POST /api/admin/catalogs/estados
Content-Type: application/json

{
  "nombre": "Nuevo estado",
  "descripcion": "Descripción opcional"
}
```

#### Actualizar elemento

```http
PUT /api/admin/catalogs/estados?id=1
Content-Type: application/json

{
  "nombre": "Estado actualizado"
}
```

#### Eliminar elemento

```http
DELETE /api/admin/catalogs/estados?id=1
```

---

### 📤 Importación

#### Importar proyectos desde CSV/Excel

```http
POST /api/admin/import
Content-Type: application/json

{
  "data": [
    {
      "codigo_proyecto": "PROJ-001",
      "titulo_proyecto": "Título",
      "tipo_proyecto": "Tipo",
      "area_conocimiento": "Área",
      "linea_investigacion": "Línea",
      "objetivo": "Objetivo...",
      "impacto_cientifico": "...",
      "impacto_economico": "...",
      "impacto_social": "...",
      "otros_impactos": "...",
      "estado": "En curso",
      "fecha_inicio": "2025-01-01",
      "meses": 12,
      "fecha_fin": "2025-12-31",
      "nombre_participante": "Juan Pérez",
      "correo_electronico_participante": "juan@example.com",
      "genero_participante": "M",
      "cargo_dentro_del_proyecto": "Director",
      "tiempo_dedicacion_en_el_proyecto": "Tiempo completo",
      "institucion_encargada_del_proyecto": "Universidad Central",
      "facultad_participante": "Ingeniería",
      "carrera_participante": "Sistemas",
      "tipo_presupuesto": "Propios",
      "presupuesto": 50000,
      "avance": 50
    }
  ]
}
```

**Respuesta:**

```json
{
	"success": true,
	"data": {
		"success": true,
		"imported_count": 1,
		"failed_count": 0,
		"errors": [],
		"warnings": []
	},
	"message": "Se importaron 1 proyectos exitosamente"
}
```

---

### 📥 Exportación

#### Exportar proyectos

```http
GET /api/admin/export
GET /api/admin/export?ids=1,2,3
```

**Respuesta:** Array de objetos con datos planos listos para convertir a CSV/Excel.

---

### 📊 Informes

#### Generar informe

```http
POST /api/admin/reports
Content-Type: application/json

{
  "format": "json",
  "projectIds": [1, 2, 3]
}
```

**Formatos disponibles:** `json`, `pdf` (en desarrollo), `doc` (en desarrollo)

---

## Formato de Respuesta

Todas las respuestas siguen el formato:

```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

### Respuesta exitosa

```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

### Respuesta con error

```json
{
	"success": false,
	"message": "Error al procesar la solicitud",
	"errors": [
		{
			"field": "codigo",
			"message": "El código es obligatorio"
		}
	]
}
```

---

## Códigos de Estado HTTP

- `200` - OK
- `201` - Created
- `207` - Multi-Status (importación parcial)
- `400` - Bad Request (validación)
- `404` - Not Found
- `409` - Conflict (duplicado)
- `500` - Internal Server Error

---

## Validaciones

### Proyectos

- ✅ Código único y obligatorio
- ✅ Título obligatorio
- ✅ Fechas válidas
- ✅ Porcentaje entre 0-100
- ✅ Presupuesto no negativo

### Participantes

- ✅ Email único y formato válido
- ✅ Nombre obligatorio
- ✅ Género obligatorio
- ✅ Carrera obligatoria

### Blog

- ✅ Slug único y formato válido (kebab-case)
- ✅ Título obligatorio
- ✅ Contenido obligatorio

---

## Próximos Pasos

### Para desarrollo frontend:

1. Implementar interfaz de administración usando estos endpoints
2. Agregar formularios para CRUD de proyectos
3. Implementar vista de importación con carga de archivos Excel/CSV
4. Crear vista de exportación con descarga de archivos
5. Implementar generación de informes PDF/DOC desde el cliente

### Para backend:

1. Implementar autenticación y autorización
2. Agregar middleware de seguridad
3. Implementar rate limiting
4. Agregar logs de auditoría
5. Implementar generación real de PDF/DOC en el servidor

---

## Dependencias Adicionales Recomendadas

Para completar las funcionalidades de importación/exportación e informes:

```bash
# Para parsear CSV/Excel en el cliente
npm install papaparse xlsx

# Para generar PDF (opcional, desde servidor)
npm install pdfkit jspdf

# Para generar DOC (opcional, desde servidor)
npm install docx
```

---

## Testing

Puedes probar los endpoints usando:

- **curl**
- **Postman**
- **Thunder Client** (extensión VS Code)
- **REST Client** (extensión VS Code)

Ejemplo con curl:

```bash
# Listar proyectos
curl http://localhost:5173/api/admin/projects

# Crear proyecto
curl -X POST http://localhost:5173/api/admin/projects \
  -H "Content-Type: application/json" \
  -d '{"codigo":"TEST-001","titulo":"Test",...}'
```

---

## Estructura de Archivos Creada

```
src/
├── lib/
│   ├── models/admin/
│   │   ├── entities.ts          # Entidades de BD
│   │   └── dtos.ts               # DTOs para API
│   ├── db/admin/
│   │   ├── projects.repository.ts
│   │   ├── participants.repository.ts
│   │   ├── catalogs.repository.ts
│   │   └── blog.repository.ts
│   └── services/admin/
│       ├── projects.service.ts
│       ├── participants.service.ts
│       ├── blog.service.ts
│       └── import-export.service.ts
└── routes/api/admin/
    ├── projects/
    │   ├── +server.ts
    │   └── [id]/+server.ts
    ├── participants/
    │   ├── +server.ts
    │   └── [id]/+server.ts
    ├── blog/
    │   ├── +server.ts
    │   └── [id]/+server.ts
    ├── catalogs/
    │   └── [type]/+server.ts
    ├── import/
    │   └── +server.ts
    ├── export/
    │   └── +server.ts
    └── reports/
        └── +server.ts
```
