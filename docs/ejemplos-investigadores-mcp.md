# Ejemplos de Consultas sobre Investigadores - MCP Proyectos UCE

## 🏆 Consultas sobre el Investigador Más Productivo

### Preguntas que funcionan:

- "¿Cuál es el investigador que más proyectos ha dirigido?"
- "¿Quién es el coordinador que más proyectos tiene?"
- "¿Cuál es el investigador líder en productividad?"
- "¿Quién ha dirigido más proyectos?"

### Respuesta esperada:

```
🏆 Investigador/Coordinador que más proyectos ha dirigido:

**López Rivera Eduardo** - **3 proyectos**

📊 Top 5 investigadores:

1. **López Rivera Eduardo**
   📁 3 proyectos (1 activos)

2. **Carranza Barona César Vinicio**
   📁 2 proyectos (2 activos)

💡 El líder tiene **1 proyectos más** que el segundo lugar.
```

## 📊 Ranking de Investigadores

### Preguntas que funcionan:

- "Top 10 investigadores con más proyectos"
- "Ranking de coordinadores por productividad"
- "Muéstrame los 5 investigadores más productivos"
- "Top investigadores UCE"

### Respuesta esperada:

```
🏆 Investigador/Coordinador que más proyectos ha dirigido:

**López Rivera Eduardo** - **3 proyectos**

📊 Top 10 investigadores:
[Lista detallada con proyectos activos y totales]
```

## 🔍 Búsqueda de Investigador Específico

### Preguntas que funcionan:

- "información del investigador López Rivera"
- "coordinador César Carranza"
- "investigador Eduardo López"
- "¿Cuántos proyectos tiene López Rivera Eduardo?"

### Respuesta esperada:

```
👨‍🔬 Información sobre López Rivera Eduardo:

📊 Total de proyectos dirigidos: 3

📈 Por estado:
- En cierre: 1 proyectos
- En ejecución: 2 proyectos

🏛️ Por facultad:
- Ciencias Sociales Y Humanas: 3 proyectos

✅ Proyectos acreditados SENESCYT: 3 de 3
```

## 📈 Estadísticas Generales sobre Investigadores

### Preguntas que funcionan:

- "¿Cuántos investigadores hay?"
- "información sobre investigadores"
- "estadísticas del equipo investigador"
- "¿Cuántos coordinadores únicos hay?"

### Respuesta esperada:

```
👥 Información sobre el equipo investigador:

🔬 Coordinadores/Directores únicos: 45

✅ Proyectos con investigadores acreditados SENESCYT: 67 de 89 (75.3%)

📧 Proyectos con contacto disponible: 89

🏆 Investigador más productivo: López Rivera Eduardo (3 proyectos)

💡 Pregunta "¿quién es el investigador que más proyectos ha dirigido?" para más detalles.
```

## 🎯 Casos de Uso Específicos

### 1. Comparar Investigadores

```
Usuario: "¿Cuál es la diferencia entre el investigador más productivo y el segundo?"
```

### 2. Buscar por Apellido

```
Usuario: "investigadores López"
Usuario: "coordinadores Carranza"
```

### 3. Información Detallada

```
Usuario: "perfil completo del investigador más productivo"
Usuario: "detalles del coordinador César Carranza"
```

### 4. Análisis por Facultad

```
Usuario: "¿Quién es el investigador más productivo de Ciencias Sociales?"
Usuario: "coordinadores de la Facultad de Ingeniería"
```

## 💡 Tips para Mejores Resultados

1. **Sé específico con los nombres**: Usa al menos el apellido completo
2. **Usa sinónimos**: "investigador", "coordinador", "director" funcionan igual
3. **Combina consultas**: Puedes preguntar por ranking y luego detalles específicos
4. **Usa números**: "Top 5", "Top 10" para rankings específicos

## 🔄 Flujo de Conversación Recomendado

1. **Inicio**: "¿Quién es el investigador que más proyectos ha dirigido?"
2. **Profundizar**: "Información detallada del investigador [nombre]"
3. **Comparar**: "Top 10 investigadores con más proyectos"
4. **Analizar**: "¿Cuántos proyectos activos tiene [nombre]?"

## ⚠️ Limitaciones

- Los nombres deben coincidir con los registrados en la base de datos
- La búsqueda es sensible a variaciones en la escritura
- Solo se muestran investigadores con al menos un proyecto registrado
- La información depende de la calidad de los datos en la tabla `proyectos_siies_uce`
