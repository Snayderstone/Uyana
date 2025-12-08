# Guía de la Herramienta MCP de Proyectos UCE

## Resumen

La herramienta MCP de Proyectos UCE (`proyectos-uce`) permite realizar consultas inteligentes sobre la base de datos de proyectos de investigación de la Universidad Central del Ecuador. Esta herramienta ha sido mejorada para manejar consultas específicas por facultad/entidad y soportar nuevas instituciones.

## Características Principales

### 🔍 Consultas Inteligentes

- **Estadísticas generales**: Total de proyectos, proyectos activos, cerrados, etc.
- **Consultas por facultad**: Búsqueda específica por nombre de facultad o entidad
- **Análisis comparativo**: Comparación entre facultades y ranking
- **Búsqueda por temas**: Proyectos relacionados con palabras clave específicas
- **Información de investigadores**: Estadísticas sobre el equipo investigador
- **Ranking de investigadores**: Identificar los investigadores más productivos
- **Búsqueda de investigadores específicos**: Información detallada por investigador
- **Tendencias**: Análisis de patrones en la investigación

### 🏛️ Soporte Multi-Institucional

- Universidad Central del Ecuador (UCE)
- Universidad de Loja
- Otras entidades responsables que se agreguen en el futuro

## Ejemplos de Uso

### Consultas Básicas

```typescript
// Consulta general sobre el total de proyectos
'¿Cuántos proyectos de investigación hay registrados?';

// Respuesta:
// "Actualmente hay **X proyectos** registrados en total, de los cuales **Y están activos**
// (en ejecución o en cierre) y **Z están cerrados o finalizados**..."
```

### Consultas por Facultad Específica

```typescript
// Consulta sobre una facultad de la UCE
'¿Cuántos proyectos tiene la Facultad de Ingeniería en Ciencias Aplicadas?';

// Consulta sobre una universidad externa
'¿Cuántos proyectos tiene la Universidad de Loja?';

// Respuesta:
// "La **Facultad de Ingeniería en Ciencias Aplicadas** tiene **X proyectos** registrados.
//
// **Detalle por estado:**
// - En ejecución: Y
// - En cierre: Z
// - Cerrados/Finalizados: W
//
// Esto representa el **X.X%** del total de proyectos registrados."
```

### Consultas Comparativas

```typescript
// Ranking de facultades
'Muéstrame el top 5 de facultades con más proyectos';

// Comparación entre entidades
'Comparar entre las principales facultades';

// Respuesta:
// "**Comparación entre las principales facultades/entidades:**
//
// 1. **Ciencias Sociales Y Humanas**: 45 proyectos (25.2%)
// 2. **Ingeniería en Ciencias Aplicadas**: 32 proyectos (17.9%)
// ..."
```

### Búsqueda Temática

```typescript
// Búsqueda por palabras clave
'¿Hay proyectos sobre desarrollo sostenible?';
'Proyectos sobre inteligencia artificial';
'Investigaciones de salud pública';

// Respuesta:
// "Encontré **X proyectos** relacionados con tu búsqueda. Algunos de ellos son:
//
// 1. **[Título del proyecto]**
//    - Facultad: [Nombre]
//    - Estado: [Estado]
//    - Objetivo: [Resumen]..."
```

### Consultas sobre Investigadores

```typescript
// Investigador que más proyectos ha dirigido
'¿Cuál es el investigador que más proyectos ha dirigido?';
'¿Quién es el coordinador que más proyectos tiene?';

// Respuesta:
// "🏆 Investigador/Coordinador que más proyectos ha dirigido:
//
// **[Nombre del investigador]** - **X proyectos**
//
// 📊 Top 5 investigadores:
//
// 1. **[Nombre]**
//    📁 X proyectos (Y activos)
// ..."

// Ranking de investigadores
'Top 10 investigadores con más proyectos';
'Ranking de coordinadores por productividad';

// Búsqueda de investigador específico
'información del investigador López Rivera';
'coordinador César Carranza';

// Respuesta para investigador específico:
// "👨‍🔬 Información sobre [Nombre]:
//
// 📊 Total de proyectos dirigidos: X
//
// 📈 Por estado:
// - En ejecución: Y proyectos
// - En cierre: Z proyectos
// ..."
```

### Análisis de Tendencias

```typescript
// Tendencias generales
'¿Cuál es la tendencia en investigación de la UCE?';

// Información sobre investigadores
'¿Cuántos investigadores acreditados hay?';

// Respuesta:
// "**Análisis de tendencias en investigación:**
//
// 🏆 **Facultad líder:** [Nombre] (X proyectos)
// 📊 **Tipo principal:** [Tipo] (Y proyectos)
// 📈 **Proyectos activos:** Z de W total
// 🎓 **Con acreditación SENESCYT:** X proyectos..."
```

## Implementación Técnica

### Estructura de la Herramienta

```typescript
// Esquema de validación
const proyectosToolSchema = z.object({
	consulta: z.string().describe('Consulta sobre proyectos de investigación'),
	limite: z.number().optional().default(10),
	filtro: z
		.object({
			campo: z.string().optional(),
			valor: z.string().optional()
		})
		.optional()
});
```

### Funciones Principales

1. **`normalizarNombreFacultad()`**: Normaliza nombres para búsqueda flexible
2. **`buscarFacultadOEntidad()`**: Busca coincidencias de facultades/entidades
3. **`extraerNombreFacultad()`**: Extrae nombres de facultad de la consulta
4. **`procesarConsulta()`**: Procesa y enruta las diferentes tipos de consultas

### Nuevas Funciones para Investigadores

5. **`obtenerRankingInvestigadores()`**: Obtiene el ranking de investigadores por productividad
6. **`obtenerEstadisticasInvestigador()`**: Estadísticas detalladas de un investigador específico
7. **`buscarInvestigadores()`**: Busca investigadores que coincidan con un término

### Integración con Base de Datos

La herramienta utiliza el servicio `proyectosService.ts` que se conecta a Supabase:

```typescript
// Funciones del servicio utilizadas
-obtenerProyectos() -
	obtenerProyectosPorFacultad() -
	obtenerEstadisticasGenerales() -
	obtenerEstadisticasPorFacultad() -
	obtenerProyectosPorEstado() -
	obtenerProyectosPorTipo() -
	obtenerRankingInvestigadores() -
	obtenerEstadisticasInvestigador() -
	buscarInvestigadores();
// ... y más
```

## Casos de Uso Avanzados

### 1. Consulta Multi-Entidad

```
Usuario: "¿Cuántos proyectos tiene la Universidad de Loja comparado con la UCE?"
```

### 2. Análisis Específico por Estado

```
Usuario: "¿Cuáles son los proyectos en ejecución de la Facultad de Medicina?"
```

### 3. Búsqueda Temática Específica

```
Usuario: "Muéstrame proyectos sobre COVID-19 en la Facultad de Ciencias Químicas"
```

### 4. Consultas sobre Investigadores Productivos

```
Usuario: "¿Quién es el investigador que más proyectos ha dirigido?"
Usuario: "Top 10 coordinadores con más proyectos"
```

### 5. Búsqueda de Investigador Específico

```
Usuario: "Información del investigador López Rivera Eduardo"
Usuario: "¿Cuántos proyectos tiene el coordinador César Carranza?"
```

### 6. Análisis Comparativo de Investigadores

```
Usuario: "¿Cuál es la diferencia entre el investigador más productivo y el segundo?"
```

### 4. Estadísticas Institucionales

```
Usuario: "¿Qué porcentaje de proyectos tienen investigadores acreditados por SENESCYT?"
```

## Beneficios

- **🎯 Consultas Naturales**: Los usuarios pueden hacer preguntas en lenguaje natural
- **📊 Respuestas Estructuradas**: Información organizada y fácil de entender
- **🔄 Escalabilidad**: Fácil agregar nuevas entidades responsables
- **📈 Análisis Inteligente**: Comparaciones automáticas y estadísticas avanzadas
- **🎓 Contexto Académico**: Respuestas adaptadas al ámbito universitario

## Configuración

La herramienta está automáticamente registrada en el servidor MCP y disponible para el sistema de chat. No requiere configuración adicional.

## Limitaciones

- La información depende de los datos disponibles en la tabla `proyectos_siies_uce`
- Las consultas de texto libre pueden no devolver todos los resultados relevantes
- Los datos están limitados a los campos disponibles en la base de datos

## Soporte

Para reportar problemas o solicitar nuevas funcionalidades, contacta al equipo de desarrollo de UYANA.
