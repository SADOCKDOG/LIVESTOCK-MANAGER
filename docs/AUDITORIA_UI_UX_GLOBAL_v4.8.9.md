# Auditoría Global UI/UX (Premium OLED v4.8.9)

Esta auditoría cruza el estado actual del código de la aplicación **LIVESTOCK-MANAGER** frente a las estrictas normativas corporativas (`AGENTS.md` y `AUDITORIA-UI-UX.md`), apoyada por la reciente ejecución estática de los Linters (`Stylelint` y `ESLint`).

---

## 1. Módulos y Pantallas (Views)

### ❌ Inyección de Estilos en Runtime
La normativa prohíbe inyectar código CSS a través de JavaScript, ya que rompe la centralización de estilos.
- **Hallazgo:** El archivo `js/views/informes-view.js` sigue inyectando etiquetas `<style>` dinámicamente en el DOM (función `_inyectarEstilosTabs()`).
- **Acción requerida:** Extraer este bloque CSS y moverlo a `css/styles.css` usando las clases semánticas adecuadas.

### ⚠️ Encabezados (Titles) Legacy
El sistema de diseño manda usar contenedores `.page-title-bar` u homólogos, evitando etiquetas crudas.
- **Hallazgo:** Hay **14 archivos JS** (entre ellos `compradores-view.js`, `cuaderno-view.js`, `zonas-view.js` y el propio `app.js`) que siguen renderizando etiquetas `<h2>` directas, a menudo arrastrando estilos desalineados del layout OLED central.
- **Acción requerida:** Migrar todos los `<h2>` al componente canónico de cabecera.

---

## 2. Wizards (Asistentes Paso a Paso)

### ❌ Duplicidad de Motores
El estándar corporativo establece a `WizardManager` como la única fuente de la verdad para modales multi-paso.
- **Hallazgo:** El módulo de fincas usa un motor aislado y antiguo en `js/formulario-finca.js` que levanta sus propios modales (`.formulario-finca-botones`), con dimensiones, paddings y comportamientos que no casan con el diseño Neón Glassmorphism moderno.
- **Acción requerida:** Refactorizar `formulario-finca.js` para que sea un flujo más instanciado a través de `WizardManager`.

---

## 3. Cards y Componentes (Listas de Datos)

### ✅ Estandarización de Estructura Lograda
- Las Fichas (Cards) de registro ya utilizan `border-left` dinámicos que se nutren del módulo activo (ej. Naranja para Animales, Violeta para Proveedores).
- Se ha eliminado por completo el bloque legacy de `.card-left-*` en el CSS.

### ⚠️ Estilos Inline Ocultos en los Templates
- **Hallazgo:** El linter JS reportó **20 fragmentos** donde las Cards u otros contenedores aún usan `style="display:flex;..."`.
- **Estado:** 🚧 *El subagente `ui-ux-cleaner` se encuentra actualmente limpiando este código en segundo plano.*

### ❌ Desvío Masivo de Design Tokens (Hex vs Var)
- **Hallazgo:** Existen exactamente **916 violaciones** en `styles.css` donde se están declarando literales hexadecimales (ej. `#ef4444`) en fondos y textos, ignorando el ecosistema de variables (`var(--c-danger)`).
- **Acción requerida:** Reemplazo manual y contextual de estos colores. La arquitectura actual está al 80% estandarizada pero le falta esta capa final de cohesión.

---

## 4. Iconografía y Feedback (El mayor reto pendiente)

### ❌ Emojis como Iconos
La directriz más restrictiva (del 03/07/2026) declara "PROHIBIDO el uso de emoticonos/pictogramas Unicode en cualquier string visible".
- **Hallazgo:** Tras analizar el proyecto, la librería `js/icons.js` existe, pero los desarrollos pasados esparcieron más de mil emojis a lo largo de los templates. Los emojis en Android ignoran el `color: var(--p-gold)`, rompiendo la estética Neón.
- **Acción requerida:** Una purga monumental pero obligatoria: sustituir cada emoji por una invocación a `${Icons.nombre_del_icono()}`.

---

### Siguientes Pasos (Priorización)
Si queremos dominar la identidad corporativa de manera ágil, sugiero este orden de ataque:

1.  **Dejar que el subagente termine** con los `style="..."` (En progreso).
2.  **Migrar la inyección CSS** de `informes-view.js` al `styles.css`.
3.  **Abordar la purga de Emojis** (Podemos programar un script o subagente masivo que mapee emojis a llamadas SVG de `Icons.js`).
4.  **Refactorizar `formulario-finca.js`** hacia el `WizardManager`.
