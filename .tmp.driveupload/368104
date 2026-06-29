---
name: ui-ux-pro-max
description: Inteligencia de diseño UI/UX. 50 estilos, 21 paletas, 50 combinaciones de fuentes, 20 gráficos, 9 stacks.
---
# ui-ux-pro-max

Guía de diseño integral para aplicaciones web y móviles. Contiene 67 estilos, 96 paletas de colores, 57 combinaciones de fuentes, 99 directrices de UX y 25 tipos de gráficos a través de 13 stacks tecnológicos. Base de datos consultable con recomendaciones basadas en prioridades.

## Requisitos Previos

Comprobar si Python está instalado:

```bash
python3 --version || python --version
```

Si Python no está instalado, instalarlo según el SO del usuario:

**Windows:**
```powershell
winget install Python.Python.3.12
```

---

## Cómo usar esta Skill

Cuando el usuario solicite trabajo de UI/UX (diseñar, construir, crear, implementar, revisar, arreglar, mejorar), sigue este flujo de trabajo:

### Paso 1: Analizar los requisitos del usuario

Extraer información clave de la solicitud del usuario:
- **Tipo de producto**: SaaS, e-commerce, portafolio, dashboard, landing page, etc.
- **Palabras clave de estilo**: minimalista, divertido, profesional, elegante, modo oscuro, etc.
- **Industria**: salud, fintech, gaming, educación, etc.
- **Stack**: React, Vue, Next.js, o por defecto `html-tailwind`.

### Paso 2: Generar el Sistema de Diseño (OBLIGATORIO)

**Comienza siempre con `--design-system`** para obtener recomendaciones completas con razonamiento:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<tipo_producto> <industria> <palabras_clave>" --design-system [-p "Nombre del Proyecto"]
```

Este comando:
1. Busca en 5 dominios en paralelo (producto, estilo, color, landing, tipografía).
2. Aplica reglas de razonamiento de `ui-reasoning.csv` para seleccionar las mejores coincidencias.
3. Devuelve el sistema de diseño completo: patrón, estilo, colores, tipografía, efectos.
4. Incluye anti-patrones a evitar.

### Paso 2b: Persistir el Sistema de Diseño (Patrón Maestro + Overrides)

Para guardar el sistema de diseño para su recuperación jerárquica entre sesiones, añade `--persist`:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<consulta>" --design-system --persist -p "Nombre del Proyecto"
```

Esto crea:
- `design-system/MASTER.md` — Fuente Global de Verdad con todas las reglas de diseño.
- `design-system/pages/` — Carpeta para excepciones específicas por página.

### Paso 3: Complementar con búsquedas detalladas (según sea necesario)

Después de obtener el sistema de diseño, usa búsquedas de dominio para obtener detalles adicionales:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<palabra_clave>" --domain <dominio> [-n <max_resultados>]
```

| Necesidad | Dominio | Ejemplo |
|------|--------|---------|
| Más opciones de estilo | `style` | `--domain style "glassmorphism dark"` |
| Recomendaciones de gráficos | `chart` | `--domain chart "real-time dashboard"` |
| Mejores prácticas de UX | `ux` | `--domain ux "animation accessibility"` |

---

## Reglas Comunes para una UI Profesional

Estos son problemas que se pasan por alto con frecuencia y que hacen que la UI parezca poco profesional:

### Iconos y Elementos Visuales

| Regla | Hacer | No Hacer |
|------|----|----- |
| **Sin iconos emoji** | Usar iconos SVG (Heroicons, Lucide, Icons.js) | Usar emojis como 🎨 🚀 ⚙️ como iconos de UI |
| **Logos de marca correctos** | Investigar el SVG oficial en Simple Icons | Adivinar o usar rutas de logo incorrectas |
| **Tamaño de icono consistente** | Usar un viewBox fijo (24x24) con w-6 h-6 | Mezclar diferentes tamaños de iconos al azar |

### Interacción y Cursor

| Regla | Hacer | No Hacer |
|------|----|----- |
| **Cursor pointer** | Añadir `cursor-pointer` a todos los elementos clicables | Dejar el cursor por defecto en elementos interactivos |
| **Feedback de hover** | Proporcionar feedback visual (color, sombra, borde) | Sin indicación de que el elemento es interactivo |

---

## Estándares Premium OLED de Livestock Manager (v4.8.5)

Reglas de referencia para mantener la consistencia visual en este proyecto específico.

### 1. Cabecera y Navegación
- **Banner Hub Centrado**: Usar `.header-banner-frame` para el título de la vista. El icono debe ser un SVG de 17px con resplandor dorado `#facc15`.
- **Línea Neón Dinámica**: La parte inferior de la cabecera debe usar `var(--header-neon-color)` para coincidir con el modo activo.
- **Hub CoMer**: Usar la etiqueta "CoMer" para Comercialización en la navegación inferior. Enlazar dinámicamente a `#/comercializacion?tab=leche` por defecto.

### 2. Layouts de Hub (Ganadería, ExPro, CoMer)
- **Selector de Modo Superior**: Usar `.comer-mode-switch` o equivalente en la parte superior. Prioridad por defecto a **Lácteo** (#3b82f6).
- **Alineación de KPIs**: Todas las tarjetas de KPI deben tener una altura fija de **90px**.
- **Regla 2+1**: Al mostrar 3 tarjetas de KPI, usar `flex-wrap` y `justify-content: center` para que la 3ª tarjeta quede centrada debajo de las dos primeras.
- **Encabezados de Sección**: Usar `.section-header-neon` o `.section-header-theme` **sin borde superior**. Las etiquetas deben ser blancas, peso 800 y centradas.

### 3. Botones de Acción
- **Botones Neón**: Usar siempre `.widget-link-btn--neon`.
- **Etiquetas**: Deben ser blancas (`#ffffff !important`), en mayúsculas (uppercase), peso 800, tamaño 0.8rem y perfectamente centradas.
- **Sin Redundancia**: Evitar el prefijo "Registrar". Usar sustantivos cortos y claros: `Peso (kg)`, `Control (L)`, `Tratamiento`.

### 4. Tarjetas de Datos (Registros)
- **Ancho Completo**: Las tarjetas deben ocupar el 100% del ancho disponible.
- **Solo SVG**: Nada de emojis funcionales. Usar `Icons.*` con resplandor.
- **Jerarquía Visual**: Información principal arriba (título izquierda, valor derecha); metadatos abajo (SVG + texto izquierda, indicador "VER" derecha).
- **Info de Animales**: Mostrar icono de género (♀/♂) y edad calculada. Incluir enlace al Lote/Rebaño con su icono SVG.
