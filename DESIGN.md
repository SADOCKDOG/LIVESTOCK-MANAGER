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

| Rol | Color | Hex | Uso |
| :--- | :--- | :--- | :--- |
| **Primario (AgTech Green)** | Grass / Esmeralda | `#10B981` | Acciones principales, éxito, botones de acción rápida, escáner. |
| **Primario Light** | Mint / Menta | `#34D399` | Variación para hover, estados activos sutiles. |
| **Secundario (Terra)** | Earth / Arcilla | `#78350F` | Detalles de marca, acentos de fincas, madera, establos. |
| **Acento (Sun Gold)** | Amber / Ámbar | `#F59E0B` | Estados de reproducción (celo), advertencias sutiles, alertas leves. |
| **Acento (Alert Red)** | Rose / Coral | `#EF4444` | Alertas críticas, tiempos de espera de medicamentos, tratamientos pendientes. |
| **Financiero (Deep Blue)** | Indigo / Royal | `#2563EB` | Módulo de comercialización, ventas, contratos, informes. |
| **Fondo Oscuro (Slate)** | Charcoal | `#0F172A` | Fondo de cabeceras, barra lateral, modo oscuro premium. |
| **Fondo Claro (Soft Gray)**| Snow | `#F9FAFB` | Fondo base de la aplicación (para evitar el blanco deslumbrante). |
| **Texto Principal** | Ink | `#111827` | Texto base con alto contraste para legibilidad en exterior. |

---

## 3. Typography (Tipografía)

- **Fuente Principal**: `Inter` u `Outfit` (sans-serif) para todo el cuerpo del texto, tablas de datos y formularios. Ofrece una legibilidad de pantalla excelente en tamaños pequeños.
- **Fuente de Cabeceras**: `Sora` o `Cabinet Grotesk` (geométrica, moderna, con personalidad) para títulos de páginas, KPIs y nombres de animales.
- **Escala de Tamaños**:
  - `Display (KPIs)`: 36px / Semibold
  - `H1 (Page Titles)`: 24px / Bold
  - `H2 (Section Headers)`: 18px / Semibold
  - `Body (Base)`: 14px / Regular o Medium (adecuado para alta densidad de datos)
  - `Caption (Labels)`: 12px / Medium o Light

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
- **Visual**: Pequeño contenedor ovalado (`border-radius: 9999px`) con texto en mayúsculas pequeñas.
- **Variaciones de Color**:
  - `Activo` / `Éxito`: Fondo verde suave (`#D1FAE5`), texto verde oscuro (`#065F46`).
  - `En Tratamiento` / `Pendiente`: Fondo amarillo suave (`#FEF3C7`), texto ámbar oscuro (`#92400E`).
  - `Crítico` / `Retirada`: Fondo rojo suave (`#FEE2E2`), texto rojo oscuro (`#991B1B`).
  - `Vendido` / `Historial`: Fondo azul suave (`#DBEAFE`), texto azul oscuro (`#1E40AF`).

### 6.4 Floating Scanner Button (Botón Escáner de Crotal)
- **Visual**: Botón flotante redondo (`border-radius: 50%`) de **56px x 56px** en la esquina inferior derecha en pantallas de ganadería. Color verde vibrante (`#10B981`), sombra elevada y un icono claro de cámara/código QR.

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

## 9. Anti-patterns (Lo que se debe evitar)

- **Evitar fondos blancos puros en pantallas de alta exposición solar**: Causan deslumbramiento y fatiga visual rápida al ganadero en el exterior.
- **Evitar botones y controles de entrada pequeños**: No obligar al usuario a hacer zoom o fallar al pulsar sobre un elemento.
- **No ocultar la barra de navegación principal**: Salvo en flujos de asistentes (wizards) que requieren concentración total.
- **Evitar colores grises apagados o "industriales" antiguos**: Queremos que la aplicación se sienta moderna, viva y tecnológicamente avanzada.

---

## 10. Catálogo de Capturas de Pantalla y Vistas Existentes

Para asociar el estado visual de la aplicación con este contrato de diseño, se detallan a continuación las capturas de pantalla reales guardadas en `manual/img/` que corresponden a los flujos y módulos que Open Design puede sincronizar y permitir editar:

### 10.1 Vistas y Módulos de Inicio y Configuración
- **`sc_01_inicio.png` / `cap_01_inicio.png`**: Pantalla de inicio de la aplicación con accesos directos, resúmenes rápidos de ganadería y accesos a asistentes de pesaje o tratamientos.
- **`sc_02_expro.png` / `cap_02_expro.png`**: Vista de la explotación, gestión de fincas, parcelas y asignación de zonas geográficas.
- **`sc_07_ajustes.png` / `sc_test_ajustes_loaded.png`**: Ajustes generales, sincronización con bases de datos gubernamentales, carga de datos de demo (Demo Chamorro) y configuración de dispositivos de lectura RFID.

### 10.2 Gestión de Animales y Rebaños (Módulo de Ganadería)
- **`sc_05_ganaderia.png` / `sc_test_ganaderia_view.png`**: Panel principal de ganadería, listado de rebaños activos, especies (caprino, ovino, vacuno) y distribución por zonas.
- **`sc_06_animales_criticos.png`**: Listado de control de alertas de animales que requieren atención inmediata (en tratamiento sanitario, celos, vacunas pendientes).
- **`sc_test_rebanos_list.png` / `sc_test_rebanos_view.png`**: Listado detallado de rebaños con el censo actual, tipo de explotación (leche, carne) y KPIs globales de animales sanos vs. enfermos.
- **`sc_test_ficha.png` / `sc_test_ficha2.png`**: Ficha individual de un animal (ej. Vaca1), mostrando su crotal oficial, raza, árbol genealógico, historial de partos, pesajes y tratamientos sanitarios.

### 10.3 Flujos de Asistentes Rápidos (Wizards de Acción)
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

### 10.4 Módulos Comerciales y Soporte
- **`sc_03_comer.png`**: Panel de comercialización con KPIs financieros, contratos de compraventa de leche/carne activos e historial de entregas.
- **`sc_04_mas.png`**: Menú lateral expandido con accesos rápidos a proveedores, gestión documental, informes de analítica y manuales.
- **`sc_06_manuales.png` / `sc_test_manuales.png`**: Sección de auto-ayuda integrada donde se visualizan estos manuales HTML interactivos con descripciones y diagramas.
