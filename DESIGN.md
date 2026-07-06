# LIVESTOCK MANAGER - Brand & Design Contract

Este es el contrato de diseño oficial de **LIVESTOCK MANAGER (Gestión Ganadera)**, un sistema moderno de automatización, trazabilidad y control para explotaciones agropecuarias (AgTech).

Este documento sirve como especificación de diseño (`DESIGN.md`) para que el agente de Open Design y Codex lo utilicen para la edición, mantenimiento y generación de nuevas interfaces y componentes, asegurando la consistencia de marca y un aspecto visual premium.

---

## 1. Brand (Identidad de Marca)

Livestock Manager es una plataforma robusta y de vanguardia diseñada para digitalizar y simplificar el trabajo diario en el campo. Se aleja del software agrícola tradicional, tosco y gris, aportando un diseño moderno, dinámico y estéticamente premium.

- **Personalidad**: Confiable, profesional, eficiente, conectada con la tierra y tecnológicamente avanzada.
- **Tono**: Claro, directo, optimista y técnico pero muy comprensible para el personal del campo.
- **Valores**: Precisión, sostenibilidad, bienestar animal y eficiencia operativa.

---

## 2. Color (Paleta de Colores)

Nuestra paleta está inspirada en la naturaleza (el pasto, la tierra y el sol), pero con un tratamiento de alta saturación y contraste para ofrecer un aspecto moderno y asegurar la legibilidad bajo la luz directa del sol.

### Colores Principales (Semánticos OLED)

| Rol | Variable CSS | Hex | Uso |
| :--- | :--- | :--- | :--- |
| **Primario (AgTech Green)** | `--c-success` | `#10B981` | Acciones principales, éxito, botones de acción rápida, escáner. |
| **Primario Light** | (variante) | `#34D399` | Variación para hover, estados activos sutiles. |
| **Secundario (Terra)** | `--c-orange` | `#78350F` | Detalles de marca, acentos de fincas, madera, establos. |
| **Acento (Sun Gold)** | `--p-gold` | `#FBBF24` | Estados de reproducción (celo), advertencias sutiles, alertas leves, identificadores primarios. |
| **Acento (Alert Red)** | `--c-danger` | `#EF4444` | Alertas críticas, tiempos de espera de medicamentos, tratamientos pendientes. |
| **Financiero (Deep Blue)** | `--c-info` | `#3B82F6` | Módulo de comercialización, ventas, contratos, informes. |
| **Advertencia** | `--c-warning` | `#F59E0B` | Enlaces de acción (Ficha ➔), estados pendientes. |
| **Acento secundario** | `--c-accent` | `#8B5CF6` | Sanidad, genética. |

### Fondos y Superficies

| Rol | Variable CSS | Hex | Uso |
| :--- | :--- | :--- | :--- |
| **Fondo Oscuro (Slate)** | `--background` | `#0F172A` | Fondo de cabeceras, barra lateral, modo oscuro premium. |
| **Fondo Claro (Soft Gray)** | `--surface` | `#F9FAFB` | Fondo base de la aplicación (para evitar el blanco deslumbrante). |
| **Superficie Intermedia** | `--mixed-black` | `rgba(0,0,0,0.02)` | Fondos ligeramente oscuros para secciones internas. |

### Texto

| Rol | Variable CSS | Hex | Uso |
| :--- | :--- | :--- | :--- |
| **Texto Principal** | `--text-primary` | `#111827` | Texto base con alto contraste para legibilidad en exterior. |
| **Texto Secundario** | `--text-s` | `#94A3B8` | Texto secundario, metá-, placeholders. |

### Bordes y Divisores

| Rol | Variable CSS | Valor | Uso |
| :--- | :--- | :--- | :--- |
| **Borde Primario** | `--border-222` | `rgba(255,255,255,0.13)` | Bordes principales de tarjetas y contenedores. |
| **Borde Secundario** | `--border-444` | `rgba(255,255,255,0.27)` | Bordes secundarios y divisores internos. |

---

## 3. Typography (Tipografía)

- **Fuente Principal**: `Inter` u `Outfit` (sans-serif) para todo el cuerpo del texto, tablas de datos y formularios. Ofrece una legibilidad de pantalla excelente en tamaños pequeños.
- **Fuente de Cabeceras**: `Sora` o `Cabinet Grotesk` (geométrica, moderna, con personalidad) para títulos de páginas, KPIs y nombres de animales.
- **Escala de Tamaños**:
  - `Display (KPIs)`: 36px / Semibold (`--text-display`)
  - `H1 (Page Titles)`: 24px / Bold (`--text-h1`)
  - `H2 (Section Headers)`: 18px / Semibold (`--text-h2`)
  - `Body (Base)`: 14px / Regular o Medium (`--text-body`)
  - `Caption (Labels)`: 12px / Medium o Light (`--text-label`)
  - `Tiny`: 10px / Regular (`--text-tiny`) - Para metadatos mínimos

---

## 4. Spacing (Espaciado y Retícula)

- **Base de Espaciado**: Sistema de múltiplos de 4px (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px).
- **Áreas de Toque (Tap Targets)**: Todos los botones interactivos, casillas de verificación e iconos táctiles deben tener un área mínima de **48px x 48px** para facilitar el uso con manos húmedas o guantes en el campo.
- **Márgenes de Contenedor**:
  - Mobile: 16px lateral.
  - Tablet / Desktop: 24px o 32px lateral.
- **Margen de Elementos Internos (Card Padding)**: 16px o 20px para asegurar respiración visual.

---

## 5. Layout (Diseño y Estructura)

- **Mobile-First / Enfoque Híbrido**: La aplicación se ejecuta como web híbrida y app de Android (Capacitor), por lo que el diseño es adaptable.
- **Estructura Principal**:
  - **Barra de Navegación Inferior (Mobile)**: 4 pestañas principales para acceso rápido con iconos limpios y etiquetas:
    1. **Inicio** (`/`): Panel general, alertas rápidas, accesos a asistentes rápidos (wizards).
    2. **Ganadería** (`/ganaderia`): Gestión de animales, rebaños, pesajes, tratamientos.
    3. **Comercialización** (`/comercializacion`): Ventas, contratos, compradores, transportistas.
    4. **Más** (`/mas`): Proveedores, gastos, ajustes, sincronización y manuales.
  - **Barra Lateral de Navegación (Desktop)**: Persistente en el lateral izquierdo con el mismo orden lógico.
- **Módulos con Asistentes (Wizards)**: Los procesos complejos se dividen en flujos paso a paso de pantalla completa con un indicador de progreso superior y botones de navegación ("Atrás" / "Continuar") fijos en la parte inferior.

### 5.5 Patrón de Posicionamiento en Cards de Registro

La Card de Registro sigue un patrón estricto de posicionamiento para mantener jerarquía visual y consistencia:

- **Contenedor Principal**: 
  - `display: flex`
  - `align-items: stretch` (para que la columna derecha ocupe todo el alto)
  - `gap: 10px` (espaciado entre columnas)
  - `--registro-color`: Variable que define el color de acento lateral

- **Lado Izquierdo** (Información Principal - `flex-1 min-w-0`):
  - Contenedor: `flex flex-col justify-center`
  - Contenido:
    - Encabezado: Icono + Título principal (siempre en Oro `--p-gold`)
    - Metadatos: Información secundaria en texto gris `--text-s`, tamaño reducido, UPPERCASE

- **Lado Derecho** (Estado y Acción - `flex flex-col items-end justify-between flex-shrink-0`):
  - **Parte Superior** (Estado): 
    - Alineación: `items-start` (arriba) o `self-start`
    - Contiene el **Status Badge** estándar (ver sección 6.3)
  - **Parte Inferior** (Acción):
    - Alineación: `items-end` (abajo) o `self-end`  
    - Contiene el enlace "FICHA →" con estilo estándar (ver sección 6.5)

### 5.6 Tokens de Diseño (CSS Custom Properties)

#### Espaciado Base (sistema de 4px)
```
--space-px: 1px;
--space-1: 2px;
--space-2: 4px;
--space-3: 6px;
--space-4: 8px;
--space-5: 12px;
--space-6: 16px;
--space-7: 20px;
--space-8: 24px;
--space-9: 32px;
--space-10: 48px;
```

#### Radio de Borde
```
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-pill: 9999px;
```

#### Sombras y Elevación
```
--shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.1);
--shadow-inner: inset 0 2px 4px rgba(0,0,0,0.06);
```

#### Transiciones y Animaciones
```
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
--animation-pulse: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

---

## 6. Components (Componentes Reutilizables)

### 6.1 KPI Card (Tarjeta de Métricas)
- **Visual**: Fondo blanco o de cristal sutil, borde suave de `1px` (`#E5E7EB`), sombra delicada.
- **Estructura**: Icono en un círculo de color sutil de fondo en la esquina superior derecha, número grande en fuente `Sora` y etiqueta descriptiva en la parte inferior con indicador de tendencia (+/-).
- **Ejemplo**: KPI de censo total, animales críticos o ingresos mensuales.

### 6.2 Wizard Container (Contenedor de Asistente)
- **Visual**: Estructura limpia que contiene un header con botón de cancelación ("X") a la izquierda y título del flujo al centro.
- **Barra de Progreso**: Una línea fina de color primario (`#10B981`) que se llena según el paso activo.
- **Área de Acción Inferior**: Panel fijo abajo con fondo difuminado (glassmorphism) que contiene los botones "Atrás" (estilo Outline o Texto) y "Continuar" (botón lleno en verde primario).

### 6.3 Status Badge (Etiquetas de Estado)
- **Visual**: Contenedor con formato de cápsula que indica el estado mediante codificación de color neón consistente con el sistema de diseño.
- **Implementación Estándar** (ver PLANTILLA-CARD-REGISTRO.md):
  - Fondo: 15% de opacidad del color semántico (`colorSemantico15`)
  - Borde: 40% de opacidad del color semántico (`colorSemantico40`)
  - Efecto: `drop-shadow(0 0 4px colorSemantico)` para simular retroiluminación
  - Forma: Cápsula con `border-radius: 6px`
  - Texto: Mayúsculas, peso 900, tamaño 0.6rem, espaciado de letras 0.5px
- **Variaciones de Color Semántico**:
  - `Activo` / `Éxito`: Usa `--c-success` (#10b981)
  - `En Tratamiento` / `Pendiente`: Usa `--c-warning` (#f59e0b)
  - `Crítico` / `Retirada`: Usa `--c-danger` (#ef4444)
  - `Vendido` / `Historial`: Usa `--c-info` (#3b82f6)
  - `En Proceso`: Usa `--c-accent` (#8b5cf6)
- **Notas de Implementación**:
  - Siempre usar la clase CSS correspondiente (`badge-success`, `badge-warning`, etc.)
  - En JavaScript, aplicar mediante: `style="background:var(--c-success)15; color:var(--c-success); border:1px solid var(--c-success)40; filter: drop-shadow(0 0 4px var(--c-success))"`
  - Mantener consistencia con el patrón de posicionamiento: esquina superior derecha dentro de card-registro

### 6.4 Floating Scanner Button (Botón Escáner de Crotal)
- **Visual**: Botón flotante redondo (`border-radius: 50%`) de **56px x 56px** en la esquina inferior derecha en pantallas de ganadería. Color verde vibrante (`#10B981`), sombra elevada y un icono claro de cámara/código QR.

### 6.5 Botones de Acción Hub (.widget-link-btn--neon)
- **Visual**: Botones de formato grande para acciones primarias y navegación rápida.
- **Estructura**: 
  - Contenedor con display: flex, flex-direction: column, align-items: center
  - Icono SVG superior (24x24px)
  - Etiqueta de texto inferior en mayúsculas
  - Espaciado entre icono y texto: 8px
- **Variantes de Color** (usar sufijos en class):
  - `.neon-success` (`--c-success`): Acciones primarias de éxito
  - `.neon-danger` (`--c-danger`): Acciones de eliminación o alerta
  - `.neon-info` (`--c-info`): Acciones informativas
  - `.neon-warning` (`--c-warning`): Acciones de atención
  - `.neon-accent` (`--c-accent`): Acciones secundarias destacadas
- **Estilos Comunes**:
  - Fondo: Transparente o rgba del color correspondiente al 10%
  - Borde: 2px sólido del color correspondiente al 30%
  - Texto: Color correspondiente al 100%, peso 600, tamaño 0.875rem
  - Icono: Color correspondiente al 80%
  - Hover: Fondo al 20% de opacidad, escala 1.05
  - Active/Pressed: Escala 0.95
- **Tamaño Estándar**: Mínimo 48px x 48px (área táctil) con padding interno de 12px
- **Uso Típico**:
  - Botones de creación principal (+)
  - Accesos rápidos en pantalla de inicio
  - Acciones de confirmación en formularios

---

## 7. Motion (Movimientos y Animaciones)

- **Transiciones de Página**: Desplazamiento lateral suave (slide-in) de 250ms con curva de aceleración `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Efectos Hover / Active**: Los botones interactivos y tarjetas reducen sutilmente su escala al presionarlos (`transform: scale(0.98)`) y tienen una transición de color de fondo de 150ms.
- **Escanear Crotal**: El halo del lector de códigos tiene una animación de pulso infinito en verde primario (`#10B981`) con opacidad variable de 0.4 a 0.

---

## 8. Voice & Tone (Voz y Tono de la Interfaz)

- **Vocabulario Ganadero**: Usar siempre terminología adecuada del campo. Preferir "Crotal" a "ID Animal", "Rebaño/Lote" a "Grupo", "Albarán de Leche" a "Factura/Entrega", "Guía de Movimiento" a "Documento de Envío".
- **Mensajes de Confirmación**: Breves e inequívocos. "Pesaje registrado correctamente para 24 animales", "Tratamiento sanitario guardado. Periodo de retirada de leche activo hasta el 15 de julio".
- **Evitar Errores Crípticos**: En lugar de "Error SQL: Constraint foreign_key failed", mostrar: "No se puede eliminar este rebaño porque contiene animales activos. Por favor, traslade los animales antes de eliminar el rebaño".

---

## 9. Sistema de Iconos y Uso

### 9.1 Biblioteca de Iconos
- **Fuente Principal**: `js/icons.js` con sistema de exportación nombrada
- **Ejemplo de Uso**: `Icons.animales()`, `Icons.flechaDerecha()`, `Icons.agregar()`
- **Categorías**:
  - **Funcionales**: Navegación, acciones, estado (deben ser SVG vía `Icons.*`)
  - **Decorativos**: Prefijos en labels, estados en texto, mensajes (pueden ser emojis)

### 9.2 Política de Iconos
- **Migrar a SVG**: Todos los iconos funcionales (pestañas, botones de acción, items de menú, cabeceras de card/sección)
- **Mantener Emojis**: Íconos decorativos (prefijos en labels de KPI, estados en texto simple, mensajes informativos)
- **Prioridad de Migración**: Por impacto visual y frecuencia de uso
- **Consistencia**: Usar siempre el mismo icono para la misma acción en toda la aplicación
- **Tamaños**: 
  - Iconos pequeños: 16-20px (labels, badges)
  - Iconos medios: 24-32px (botones, cabeceras)
  - Iconos grandes: 36-48px (FAB, acciones principales)

---

## 10. Patrones de Interacción Estándar

### 10.1 Filtrado en Tiempo Real
- Los campos de búsqueda deben usar `input[type="search"]` con clase `.search-input`
- El evento `oninput` debe disparar una función `_filtrar(texto)` que actualice el DOM sin recarga
- Mostrar mensaje de "No se encontraron resultados" cuando el filtrado devuelva array vacío
- Mantener estado de filtros en objeto `_filtroActivo` por tipo (especie, sexo, estado, etc.)

### 10.2 Navegación de Ficha
- Todas las tarjetas de datos deben ser completamente clickeables (cursor: pointer)
- Navegación mediante `location.hash='/entity?id=${id}'` 
- Mantener estado de selección visual mediante clases activas cuando corresponda

### 10.3 Sistema de Feedback
- **Toast**: Para notificaciones no bloqueantes (éxito, advertencia breve)
  - Posición: inferior-centro o superior-derecho según contexto
  - Duración: 3000ms para éxito, 5000ms para errores
  - Animación: deslizamiento desde fuera del viewport
- **Confirm**: Modales de sistema para acciones críticas (eliminación, cambios irreversibles)
  - Nunca usar `alert()` o `confirm()` nativos
  - Incluir opciones claras: "Confirmar" y "Cancelar"
  - Usar iconografía semántica (⚠️ para advertencia, ✅ para confirmación)

### 10.4 Estados de Carga y Vacío
- **Carga**: Mostrar esqueleto o spinner animado en centro del contenedor
- **Estado Vacío**: 
  - Icono representativo (24-32px) en color secundario suave
  - Mensaje claro y accionable
  - Botón de acción primaria cuando aplique (ej: "Crear primer registro")

---

## 11. Anti-patterns (Lo que se debe evitar)

- **Evitar fondos blancos puros en pantallas de alta exposición solar**: Causan deslumbramiento y fatiga visual rápida al ganadero en el exterior.
- **Evitar botones y controles de entrada pequeños**: No obligar al usuario a hacer zoom o fallar al pulsar sobre un elemento.
- **No ocultar la barra de navegación principal**: Salvo en flujos de asistentes (wizards) que requieren concentración total.
- **Evitar colores grises apagados o "industriales" antiguos**: Queremos que la aplicación se sienta moderna, viva y tecnológicamente avanzada.

---

## 12. Catálogo de Capturas de Pantalla y Vistas Existentes

Para asociar el estado visual de la aplicación con este contrato de diseño, se detallan a continuación las capturas de pantalla reales guardadas en `manual/img/` que corresponden a los flujos y módulos que Open Design puede sincronizar y permitir editar:

### 12.1 Vistas y Módulos de Inicio y Configuración
- **`sc_01_inicio.png` / `cap_01_inicio.png`**: Pantalla de inicio de la aplicación con accesos directos, resúmenes rápidos de ganadería y accesos a asistentes de pesaje o tratamientos.
- **`sc_02_expro.png` / `cap_02_expro.png`**: Vista de la explotación, gestión de fincas, parcelas y asignación de zonas geográficas.
- **`sc_07_ajustes.png` / `sc_test_ajustes_loaded.png`**: Ajustes generales, sincronización con bases de datos gubernamentales, carga de datos de demo (Demo Chamorro) y configuración de dispositivos de lectura RFID.

### 12.2 Gestión de Animales y Rebaños (Módulo de Ganadería)
- **`sc_05_ganaderia.png` / `sc_test_ganaderia_view.png`**: Panel principal de ganadería, listado de rebaños activos, especies (caprino, ovino, vacuno) y distribución por zonas.
- **`sc_06_animales_criticos.png`**: Listado de control de alertas de animales que requieren atención inmediata (en tratamiento sanitario, celos, vacunas pendientes).
- **`sc_test_rebanos_list.png` / `sc_test_rebanos_view.png`**: Listado detallado de rebaños con el censo actual, tipo de explotación (leche, carne) y KPIs globales de animales sanos vs. enfermos.
- **`sc_test_ficha.png` / `sc_test_ficha2.png`**: Ficha individual de un animal (ej. Vaca1), mostrando su crotal oficial, raza, árbol genealógico, historial de partos, pesajes y tratamientos sanitarios.

### 12.3 Flujos de Asistentes Rápidos (Wizards de Acción)
- **`sc_08_wizard_pesada_individual.png` / `sc_test_individual_wizard.png`**: Asistente de pesaje para un único animal. Captura paso 1 (crotal, báscula automática) y paso 2 (registro del peso, notas corporales).
- **`sc_09_wizard_venta_masiva.png` / `sc_test_venta_wizard_opened.png`**: Asistente paso a paso para la venta de un lote de animales. Vincula animales seleccionados, comprador seleccionado, precio acordado e IVA aplicable.
- **`sc_10_wizard_pesaje_lote.png` / `sc_test_lote_wizard.png`**: Flujo para registrar pesos de forma masiva para un lote o rebaño completo, calculando automáticamente la ganancia media diaria (GMD).
- **`sc_11_wizard_tratamiento.png` / `sc_test_treatment_form.png`**: Registro guiado de tratamientos sanitarios, incluyendo medicamento utilizado, dosis, vía de administración, veterinario prescriptor y cálculo del periodo de retirada de leche/carne.
- **`sc_12_wizard_albaran_leche.png` / `sc_test_albaran_leche_wizard.png`**: Entrada guiada de entregas de leche (albaranes), registrando litros, grasa, proteína, temperatura y comprador.
- **`sc_13_wizard_guia_movimiento.png` / `sc_test_guia_movimiento_form.png`**: Formulario del asistente de guías de movimiento de ganado (REGA, origen, destino, transportista, número de guía).
- **`sc_14_wizard_pedido_crotales.png` / `sc_test_pedido_crotales.png`**: Solicitud guiada de crotales de reposición o nuevos nacimientos ante la autoridad agraria.
- **`sc_15_wizard_censo_oficial.png` / `sc_test_censo_oficial.png`**: Declaración y conciliación anual del censo oficial de animales de la explotación.
- **`sc_16_wizard_gasto.png` / `sc_test_gasto_tap2.png`**: Registro rápido de gastos operativos asociados a un proveedor (pienso, veterinario, maquinaria).
- **`sc_17_wizard_traslado.png` / `sc_test_traslado_wizard_real.png`**: Flujo para mover un grupo de animales entre parcelas, zonas o establos dentro de la misma explotación.

### 12.4 Módulos Comerciales y Soporte
- **`sc_03_comer.png`**: Panel de comercialización con KPIs financieros, contratos de compraventa de leche/carne activos e historial de entregas.
- **`sc_04_mas.png`**: Menú lateral expandido con accesos rápidos a proveedores, gestión documental, informes de analítica y manuales.
- **`sc_06_manuales.png` / `sc_test_manuales.png`**: Sección de auto-ayuda integrada donde se visualizan estos manuales HTML interactivos con descripciones y diagramas.

### 12.5 Componentes Estandarizados de Interfaz
- **sc_status_badge_*.png**: Ejemplos de todos los estados de badge implementados
- **sc_widget_button_*.png**: Variantes de botones de acción hub en todos los colores
- **sc_card_registro_*.json**: Especificaciones de posición y espaciado en diferentes módulos
- **sc_feedback_*.png**: Ejemplos de toast y modales de confirmación