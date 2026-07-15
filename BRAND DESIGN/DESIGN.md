---
name: "Livestock Manager"
version: "4.9.0"
colors:
  primary: "#CCFF00"      # Verde Lima Neón (Expro - Explotación)
  secondary: "#3b82f6"    # Azul Neón (Comer - Comercialización)
  danger: "#FF4444"       # Rojo Neón (Ganadería)
  warning: "#FFD600"      # Amarillo Neón (Aviso / Identificadores)
  accent: "#7EEFEF"       # Cyan Claro (Genética)
  background: "#0C0C0C"   # Fondo Global OLED
  surface: "#1E1E1E"      # Tarjetas Dark Pro
  text-primary: "#FFFFFF" # Texto Principal
  text-secondary: "#B1B1B1" # Texto Secundario (Gris Acero)
---

# LIVESTOCK MANAGER - Brand & Design Contract (DESIGN.md)

Este es el contrato de diseño oficial de **LIVESTOCK MANAGER (Gestión Ganadera)**, un sistema profesional de automatización, trazabilidad e informes para explotaciones agropecuarias (AgTech).

Este documento especifica el sistema de diseño completo y los estándares de interfaz de usuario (UI/UX) actualizados al **Esquema Tricolor Estricto** y los tonos optimizados para identificadores, etiquetas de soporte y viñetas de estado tomados de la muestra **Numeros, texto y viñetas.jpg**. Debe ser utilizado por diseñadores y desarrolladores para mantener la consistencia de marca y un aspecto visual premium en toda la plataforma.

---

## 1. Brand (Identidad de Marca)

Livestock Manager es una plataforma robusta y de vanguardia diseñada para digitalizar y simplificar el trabajo diario en el campo. Se aleja del software agrícola tradicional, aportando un diseño moderno y estéticamente premium bajo la filosofía visual **"Dark Pro OLED"** (fondo principal `#0C0C0C`, tarjetas en `#1E1E1E` y sub-superficies en `#2A2A2A`).

*   **Personalidad**: Confiable, profesional, eficiente, tecnológicamente avanzada y precisa.
*   **Tono**: Claro, directo, profesional y cercano al ganadero.
*   **Valores**: Bienestar animal, eficiencia operativa, sostenibilidad y trazabilidad industrial.

---

## 2. Color (Paleta de Colores por Áreas y Textos)

La aplicación divide su interfaz y elementos en tres grandes áreas conceptuales definidas por un color neón de alta saturación para facilitar la asociación mental rápida en el campo, junto con una paleta tipográfica específica para datos fijos y metadatos:

### Colores Semánticos del Sistema

| Área / Concepto | Variable CSS | Hex | Origen (Brand Design) | Rutas y Módulos Asociados |
| :--- | :--- | :--- | :--- | :--- |
| **Expro (Explotación)** | `--c-success` | `#CCFF00` | Verde Lima Neón. Pantalla de Inicio / Dashboard (`/`), Zonas y Potreros (`/zonas`, `/zona`), loaders y botones de guardado. |
| **Ganadería** | `--c-danger` | `#FF4444` | Rojo Neón. Fichas de Animales (`/animales`, `/animal`), Cuaderno Digital (`/cuaderno`), Ganadería y Sanidad (`/ganaderia`), Carne (`/carne`), Gastos directos (`/gastos`). |
| **Comer (Comercialización)**| `--c-info` | `#3b82f6` | Azul Neón. Módulo de Leche (`/leche`), Comercialización (`/comercializacion`), Rebaños (`/rebanos`), Compradores (`/compradores`), Proveedores (`/proveedores`), Transportistas (`/transportistas`), Documentos (`/documentos`) y Contratos (`/contrato`). |
| **Aviso / Identificación** | `--c-warning` / `--p-gold` | `#FFD600` / `#FFB300` | Amarillo Neón / Oro. Enlaces de acción (Ficha ➔), identificadores principales en cards (crotales, códigos) y cifras de producción destacadas. |
| **Genética (Acento)** | `--c-accent` | `#7EEFEF` | `Blue.jpg` (variante) | Cyan claro. Acentos de reproducción, celos, inseminaciones e historial genético. |

### Paleta Tipográfica y Contraste de Datos

Para asegurar que las cifras destaquen sin contaminar la interfaz:
*   **Texto Principal**: `#FFFFFF` (Blanco puro) para títulos principales y datos críticos de texto.
*   **Identificadores y Números (Oro)**: `#FFFC55` (Amarillo Oro brillante) con peso `950` para destacar números de crotales, kg, litros e importes de albaranes.
*   **Textos Secundarios y Etiquetas (Gris Acero)**: `#B1B1B1` (Gris acero de la imagen) para etiquetas secundarias (`cab.`, `kg`, `nif`, etc.) y marcadores de posición sin resplandor.

> [!IMPORTANT]
> El sistema de diseño se estructura estrictamente en base a estas tres áreas cromáticas (**Expro**, **Ganadería**, **Comer**). Las antiguas variables de módulo se mapean para compatibilidad legacy:
> *   `--c-orange` ➔ Mapea a Naranja Neón (`#F97316`) - Animales / Cuaderno.
> *   `--c-purple` ➔ Mapea a Violeta Neón (`#A855F7`) - Proveedores / Manuales.
> *   `--c-pink` ➔ Mapea a Rosa Neón (`#EC4899`) - Transportistas / Logística.

---

## 3. Typography (Tipografía)

*   **Fuente Principal**: `Inter` (sans-serif) para el cuerpo de texto, tablas de datos, formularios y descripciones. Ofrece una legibilidad excelente en tamaños pequeños.
*   **Fuente de Cabeceras**: `Archivo Expanded` o `Archivo` (geométrica, bold y con personalidad) para títulos de páginas, KPIs y nombres de animales.
*   **Fuente Monoespaciada**: `IBM Plex Mono` para códigos de identificación (REGA, crotales, números de albarán y cifras de pesaje/económicas).
*   **Escala de Tamaños**:
    *   `Display (KPIs/Cifras)`: 1.6rem / Peso 950 (`--fs-display`)
    *   `H1 (Títulos de Card)`: 1.25rem / Bold (`--fs-h1`)
    *   `H2 (Subtítulos)`: 1.05rem / Semibold (`--fs-h2`)
    *   `Body (Cuerpo e Inputs)`: 0.95rem / Regular (`--fs-body`)
    *   `Caption (Labels en UPPERCASE)`: 0.75rem / Medium (`--fs-label`)
    *   `Tiny (Metadatos mínimos)`: 0.65rem / Regular (`--fs-tiny`)

---

## 4. Spacing (Espaciado y Retícula)

*   **Base de Espaciado**: Sistema de múltiplos de 4px:
    *   `--sp-1`: 4px
    *   `--sp-2`: 8px
    *   `--sp-3`: 12px
    *   `--sp-4`: 16px (Margen de card padding estándar)
    *   `--sp-5`: 20px
    *   `--sp-6`: 24px
*   **Áreas de Toque (Tap Targets)**: Todos los botones interactivos, casillas de verificación e iconos táctiles deben tener un área mínima de **50px x 50px** (`--touch-min`) para facilitar el uso con manos húmedas o guantes.
*   **Radios de Borde (Border Radius)**:
    *   `--r-sm` (8px): Chips, badges y etiquetas de estado.
    *   `--r-md` (14px): Inputs y botones secundarios.
    *   `--r-lg` (16px): Tarjetas (cards) de información y registro.
    *   `--r-pill` (28px): Botón principal flotante (FAB) o botones de acción en wizards.

---

## 5. Layout (Diseño y Estructura)

*   **Enfoque Híbrido Mobile-First**: La aplicación se ejecuta como web app y en Android (Capacitor), adaptándose suavemente a tablets y ordenadores.
*   **Marco Principal (Marco Galáctico)**:
    1.  **Cabecera (Header)**: Transparente (`rgba(18,18,18,0.4)` + `backdrop-filter: blur(12px)`) con línea inferior fina de neón (`1px` con `--header-neon-color`) y haz de luz difuso hacia abajo. Presenta el logotipo, píldora de ruta y viñeta REGA en amarillo neón (`.rega-badge-container`).
    2.  **Líneas Laterales**: Bordes laterales fijos de `1px` con haz de luz interior que unen el header y el bottom-nav (`body::after`).
    3.  **Barra Inferior (Bottom-Nav)**: Transparente con línea superior de `1px` y haz de luz difuso hacia arriba.
*   **Retroiluminación Configurable**: Respeta las clases de configuración visual guardadas en el store:
    *   `body.glow-marco-off`: Apaga el haz del marco (header + bottom-nav).
    *   `body.glow-laterales-off`: Apaga el haz de las líneas laterales.
    *   `body.glow-botones-off`: Apaga el resplandor de los botones y del FAB.

### Patrón de Posicionamiento en Cards de Registro (`.card-registro`)

Toda lista de registros se compone de fichas horizontales estructuradas en 2 columnas principales con alineación `stretch`:

1.  **Lado Izquierdo (Información de Registro)**:
    *   Identificador principal resaltado en color oro (`var(--p-gold)`) con peso `950` y fuente `IBM Plex Mono`.
    *   Metadatos secundarios alineados debajo, en gris acero (`var(--text-s)`), tamaño reducido, en mayúsculas.
    *   Franja vertical a la izquierda (`border-left: 4px solid var(--registro-color)`) para denotar el módulo o la especie de animal.
2.  **Lado Derecho (Rail de Control)**:
    *   **Parte Superior**: Badge de estado con viñeta iluminada (fondo al 15%, borde neón al 40% y drop-shadow de color semántico).
    *   **Parte Inferior**: Enlace de acción rápido `"FICHA ➔"` en color de aviso (`var(--c-warning)`).

---

## 6. Components (Componentes Reutilizables)

### 6.1 Status Badge (Etiquetas de Estado)
*   **Visual**: Formato píldora con fondo del color semántico al 15%, borde del color semántico al 40% y `drop-shadow(0 0 4px colorSemantico)`.
*   **Clases**:
    *   `.badge-success`: Verde Lima (`#C5FA50`)
    *   `.badge-warning`: Amarillo (`#FFFC55`)
    *   `.badge-red`: Rojo Coral (`#E8555F`)
    *   `.badge-blue`: Azul/Cyan (`#4FADF5`)

### 6.2 Botones de Guardar (Formularios)
*   **Visual**: Botón primario de color sólido (hereda el neón del módulo activo) con texto oscuro en contraste alto (`color: #000; font-weight: bold;`). Es la única excepción a la regla de botones huecos.

### 6.3 Botones de Acción Hub / Secundaria
*   **Visual**: Botón hueco (transparente) con un contorno fino del color del módulo al 40% y fondo del color semántico al 15% (glassmorphism). El texto e iconos SVG del botón heredan el color neón corporativo correspondiente.

### 6.4 Floating Action Button (FAB)
*   **Visual**: Botón redondo (`56px x 56px`) situado en la esquina inferior derecha. Su color varía dinámicamente según el módulo cargado y emite un resplandor neón difuso (configurable a través de la interfaz de usuario).

---

## 7. Motion (Movimientos y Animaciones)

*   **Feedback Táctil**: Todos los botones y tarjetas interactivos reducen ligeramente su escala (`transform: scale(0.95)`) y tienen una transición suave (`transition: all 0.2s;`).
*   **Crotal Scanner**: Halo interactivo del escáner que genera un pulso animado infinito (`pulse 2s infinite`) utilizando el color de acento del módulo activo.
*   **Transiciones**: Carga de vistas e historiales con efecto "fade-in" sutil de 250ms.

---

## 8. Icons (Iconografía Estricta)

Queda **estrictamente prohibido** el uso de emojis unicode en cualquier parte visible de la aplicación o en exportaciones impresas (PDF/print). 

*   Todo icono se renderiza obligatoriamente mediante la librería SVG `Icons.*` definida en `js/icons.js`.
*   Los iconos heredan `currentColor` y se redimensionan dinámicamente con la clase `.icon`.
*   Se permiten símbolos tipográficos simples como (✓, ✕, ✗, ♀, ♂, ➔, ←, ·).
