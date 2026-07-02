# Reglas de Proyecto y Branding Global: CORK MANAGER y LIVESTOCK MANAGER

Este documento define el Estándar Corporativo y el Sistema de Diseño (UI/UX) único. Su propósito es consolidar ambas aplicaciones bajo un mismo branding, garantizando consistencia en formatos, colores y plantillas estructurales para cada tipo de contenido.

## 1. Identidad Visual y Paleta de Colores
- **Fondo Global (Dark Pro)**: Fondo principal `#000000` o `#121212`. Superficies de tarjetas en `#1E1E1E` y sub-superficies en `#1A1A1A` o `#2A2A2A`. Bordes sutiles en `#27272a` a `#333333`.
- **Colores Semánticos Neón (Mapeo estricto)**:
  - **Success / Zonas / Híbrido**: `#CCFF00` (Verde Lima Neón).
  - **Warning / Alertas**: `#FFD600` (Amarillo Neón).
  - **Danger / Carne**: `#FF4444` (Rojo Neón).
  - **Info / Leche / Listas**: `#3b82f6` (Azul Neón).
- **Textos**: Principal `#FFFFFF` (Blanco puro). Textos secundarios y etiquetas (ej. "cab.", "kg") en Gris Acero (`#94A3B8`) sin resplandor para dar protagonismo a los datos.

## 2. Componentes y Botones (El Efecto Neón)
- **Botones Selector (Módulos/Modos)**: Los textos y SVGs de los botones principales SIEMPRE heredan su color corporativo asignado, nunca blanco por defecto.
- **Estados Hover/Active/Focus**: Al hacer click o enfocar un botón o pestaña (`.active`), **EL INTERIOR NO SE RELLENA**. El fondo se mantiene oscuro/transparente. El estado activo se representa con un borde neón sólido y un doble resplandor (glow exterior e interior usando `box-shadow` e `inset`) usando el valor RGBA del color semántico.
- **Feedback Táctil**: Todos los botones interactivos deben tener `transition: all 0.2s;` y reducirse ligeramente al presionarlos (`:active { transform: scale(0.95); }`).

## 3. Patrones de Layout y Vistas (Templates Estructurales)
Toda nueva pantalla debe ensamblarse utilizando estas plantillas:

### A. Dashboards y KPIs (Bento Grid)
- Uso de cuadrículas modulares (CSS Grid).
- **Tarjetas de Datos y Bordes (REGLA ESTRICTA)**: Las tarjetas (cards) **NUNCA** llevan borde superior iluminado. Las tarjetas de datos calculados globales, resúmenes o accesos rápidos **NO** llevan ninguna línea de color (usan el fondo base `#1E1E1E`). La línea gruesa de color se aplica **ÚNICAMENTE EN EL LATERAL IZQUIERDO** (`border-left` de 3px a 5px) y está reservada exclusivamente para las tarjetas que exponen **registros generados mediante acción o alertas** (ej. Fichas de animales, Alertas Sanitarias, PAC, etc.).
- **Glassmorphism Neón**: El fondo de las celdas numéricas o KPIs debe estar difuminado con el mismo color del borde al 10% de opacidad (ej. `rgba(204, 255, 0, 0.1)`).

### B. Vistas de Listas (Animales, Rebaños, Fincas)
- Formato **Fichas (Cards)** en lugar de tablas clásicas.
- Cada ficha (`.card-animal`, `.entity-card`) es un rectángulo horizontal con fondo `#1E1E1E`.
- **Indicador lateral**: Llevan una franja vertical a la izquierda (`border-left: 4px solid var(--color)`) para indicar el estado o módulo.
- Alineación: Información principal a la izquierda, acciones o KPIs clave a la derecha.

### C. Formularios, Inputs y Wizards
- **Inputs**: Fondos ultra cristalinos (`rgba(255,255,255,0.03)`) con `backdrop-filter: blur(8px)`. Sin bordes de color por defecto. Al recibir foco, el contorno se ilumina intensamente con el color neón del módulo y el fondo se oscurece ligeramente para máximo contraste.
- **Wizards (Asistentes paso a paso)**: Se presentan en modales oscuros a pantalla completa o centrados con fondo oscurecido (`rgba(0,0,0,0.85)`). Los pasos se indican con puntos luminosos (`.tour-dot.active`) que **siempre** heredan el color neón del módulo y emiten resplandor semántico.

### D. Cabeceras, Navegación y Marco Galáctico
- **Header**: Píldora de navegación central con ícono identificativo.
- **Marco Principal (formato Cork Manager)**: La cabecera se remata con una **línea neón fina y nítida** (`border-bottom: 1px solid var(--header-neon-color)`) más un **haz de luz difuso hacia abajo** (`box-shadow: 0 5px 16px -3px` con el color del módulo al ~55%). El contenido (`#app-content`) NO lleva halos laterales ni túneles de luz difusos.
- **Retroiluminación configurable**: El usuario puede desactivar el haz del marco y la retroiluminación de botones desde Ajustes → Preferencias (clases `body.glow-marco-off` y `body.glow-botones-off`); todo glow nuevo de marco/botones debe respetar estas clases.
- **Menús Desplegables**: Formato lista vertical estilizada (`max-height: 70vh`, `overflow-y: auto`), alineación a la izquierda, fondo `#1E1E1E`. Cada ítem tiene su SVG coloreado según su semántica.
- **Titulares de Sección**: Uso de separadores visuales (pipes) coloreados. Ej: `<span style="color: var(--neon);">|</span> TÍTULO`. Tipografía gruesa (`font-weight: 900`), uppercase y tracking amplio.

## 4. Estilos Especializados
- **Tablas de Datos Densos**: Si es obligatorio usar tablas (ej. Informes), usar diseño minimalista: `border-bottom: 1px solid #27272a`, `padding: 10px`, y fondos alternos `rgba(255,255,255,0.02)` en filas.
- **Loaders**: Spinners circulares con el borde superior en el color neón activo (`border-top-color: var(--neon)`).

## 5. Excepciones y Botones Específicos
- **Botones Primarios de Guardar (Formularios)**: EXCEPCIÓN a la regla de botones huecos. Estos botones (ej. "Guardar", "Aceptar") llevan fondo de **color neón sólido** (heredado del módulo) y texto oscuro para destacar masivamente la acción principal.
- **Botones de Acción Secundaria**: Botones auxiliares con fondo "Glassmorphism" suave (`color-mix` al 15% del neón) y borde fino del mismo color al 40%.
- **Pastillas Semánticas de Datos (Pills)**: Para desgloses de métricas, los valores numéricos deben ir encapsulados en recuadros sólidos del color semántico.

## 6. Procedimiento de Trabajo (TQM)
- **Auditoría Semántica Previa**: ANTES de modificar o crear componentes, DEBO analizar semánticamente los datos involucrados. Sólo después de este análisis aplicaré las plantillas correspondientes para evitar fallos de concepto.
