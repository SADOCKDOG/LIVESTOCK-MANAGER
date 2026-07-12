# Reporte Técnico de UI/UX y Layout: Estética "Industrial Premium"
**Proyecto:** Livestock Manager (Gestión Ganadera de Vanguardia)  
**Entorno de Trabajo:** Mobile Single Page Application (SPA) / Capacitor Híbrido  
**Tema Visual:** Industrial Premium (Modo Oscuro de Alto Contraste optimizado para OLED)

---

## 1. Fundamentos del Concepto "Industrial Premium"

El tema **Industrial Premium** redefine la forma en que los operarios, veterinarios y gerentes ganaderos interactúan con el software de campo. En lugar de adoptar la típica estética de "oficina corporativa" basada en fondos blancos deslumbrantes y azules planos, este diseño se inspira en el hardware industrial de alta precisión, la instrumentación de aviación y los displays militares de visión nocturna.

### Pilares del Diseño:
*   **Optimización Energética (OLED Black)**: El uso predominante del color grafito profundo y negro absoluto minimiza el consumo de batería en smartphones de campo con paneles OLED y evita el deslumbramiento en jornadas nocturnas o de madrugada.
*   **Contraste Lumínico Extremo**: La paleta utiliza acentos fluorescentes de alta luminiscencia (Neón Lime y Neón Amber). Esto asegura que los crotales, alertas críticas y números de pesaje sigan siendo legibles bajo la luz solar directa en el campo.
*   **Aero-Industrial Layout**: Los contenedores y bordes imitan paneles modulares de maquinaria pesada. Se aplican efectos sutiles de retroiluminación (*Glow*) en marcos y tarjetas seleccionadas para priorizar visualmente la información técnica.

---

## 2. Análisis del Layout Global y Componentes Comunes

El espacio de trabajo mantiene una estructura de layout fija, diseñada para maximizar la superficie de datos útil y reducir las transiciones de pantalla complejas en movilidad:

```
+-------------------------------------------------------------+
| LOGO (Neon Glow)      [ PÍLDORA RUTA ]      [ BADGE REGA ]  |  <- Header Edge-to-Edge
+-------------------------------------------------------------+
|                                                             |
|                                                             |
|                       ÁREA DINÁMICA                         |  <- Contenido Scrollable
|                     (Tarjetas / Tablas)                     |
|                                                             |
|                                                             |
+-------------------------------------------------------------+
|  [Inicio]   [Ganadería]   [ExPro]   [CoMer]   [MÁS/Sheet]   |  <- Bottom Nav (Fija)
+-------------------------------------------------------------+
```

### Componentes de la Interfaz Global:
1.  **Header (Cabecera Superior Edge-to-Edge)**:
    *   **Identidad**: Posicionado a la izquierda con un icono minimalista y tipografía robusta con un efecto de resplandor neón sutil.
    *   **Píldora de Contexto**: Situada en el centro de la cabecera. Es un contenedor ovalado con un fondo translúcido que muestra el icono y nombre de la sección actual, sirviendo de miga de pan (*breadcrumb*).
    *   **Badge REGA (Finca Activa)**: Ubicado a la derecha. Muestra el código de registro de explotación ganadera (ej. `ES12345678`) en tipografía monoespaciada dorada de alto contraste, garantizando que el operario siempre sepa en qué finca está trabajando físicamente.
2.  **Bottom Navigation (Barra de Navegación Inferior)**:
    *   Fijada en la parte inferior con un efecto de desenfoque de fondo (*backdrop-filter: blur*).
    *   Contiene 5 botones principales de área sobredimensionada para facilitar la pulsación con una sola mano.
    *   El último botón (**Más**) actúa como disparador de un **Bottom Sheet** interactivo para desplegar sub-módulos administrativos sin salir del contexto de la pantalla activa.

---

## 3. Guía de Estilos y Tokens UI (Resumen)

*   **Tipografía de Títulos (Headers)**: `Archivo Expanded` (Múltiples pesos, de Black 900 a Bold 700). Proporciona un carácter robusto, fuerte y duradero.
*   **Tipografía de Datos Técnicos**: `IBM Plex Mono`. Se utiliza para códigos REGA, identificadores de crotales, pesos, litros de leche e importes de facturación, evitando errores de lectura entre caracteres similares (como `0` y `O` u `1` e `I`).
*   **Tipografía de Lectura (Cuerpo)**: `Inter`. Máxima legibilidad y limpieza visual en párrafos, etiquetas y formularios.
*   **Áreas de Contacto (UX)**: Los botones interactivos tienen un radio de curvatura de `16px` y un área de pulsación mínima de `50px x 50px`, ideal para su uso en entornos húmedos o con guantes protectores de trabajo.

---

## 4. Análisis Detallado de la Secuencia de Capturas (17 Imágenes)

A continuación se realiza el análisis individualizado de cada una de las pantallas que componen la secuencia en el directorio `INDUSTRIAL/`:

### 0. Dashboard de Inicio (`0_Inicio.png`)
*   **Propósito**: Vista general y centro de control del Livestock Manager al abrir la aplicación.
*   **Análisis UX/UI**: Presenta un resumen de KPIs de la explotación ganadera (Censo total, animales en alerta y rebaños activos) usando tarjetas modulares de estilo industrial. Destaca un gráfico circular interactivo que desglosa el censo por categorías de edad y sexo, facilitando la toma de decisiones gerenciales rápidas.
*   **Aspecto Crítico**: En la zona inferior muestra la sección "Alertas Sanitarias Rápidas" que utiliza el color rojo neón (`--c-danger`) para indicar animales en cuarentena o con periodos de retirada de leche activos.

### 1. Panel de Ganadería (`1_Ganaderia.png`)
*   **Propósito**: Gestión del censo animal, rebaños y control de inventario de cabezas.
*   **Análisis UX/UI**: Organizado en pestañas superiores que separan la "Ficha de Animales" de la "Gestión de Rebaños". La lista de animales se presenta en filas densas de información donde cada fila destaca el crotal oficial del animal en tipografía monoespaciada de color blanco de alta visibilidad, junto con pequeñas etiquetas de estado ovaladas (ej. "Macho", "Preñada", "Tratamiento").
*   **Aspecto Crítico**: Incorpora un botón flotante verde neón (`#CF0`) en la esquina inferior derecha con el icono de un código QR, indicando el acceso instantáneo al escáner de crotales mediante cámara.

### 2. Módulo de Explotación (`2_Expro.png`)
*   **Propósito**: Control de instalaciones, naves, parcelas y asignaciones estructurales de la finca.
*   **Análisis UX/UI**: Presenta una vista modular que detalla el uso del suelo, hectáreas productivas, capacidad máxima de carga ganadera de la finca y recursos hídricos. La cabecera muestra el balance general de hectáreas con gráficos lineales limpios.
*   **Aspecto Crítico**: Utiliza tarjetas oscuras con bordes finos de color grafito, reduciendo la fatiga visual y ordenando la jerarquía con espaciados amplios.

### 3. Panel Comercial (`3_Comer.png`)
*   **Propósito**: Gestión financiera rápida de ventas de ganado, entregas de productos (leche/carne) y contratos.
*   **Análisis UX/UI**: El diseño destaca métricas de facturación acumulada, precios medios de venta y volumen comercializado. Los gráficos de barras verticales de color azul profundo (`--c-info`) y verde neón contrastan con el fondo de la pantalla.
*   **Aspecto Crítico**: Las cifras de dinero e importes se formatean estrictamente en `IBM Plex Mono` para acentuar el aspecto de precisión técnica de la app.

### 4. Menú Extendio / Bottom Sheet (`4_Masr.png`)
*   **Propósito**: Despliegue del menú secundario sin perder de vista la pantalla de fondo.
*   **Análisis UX/UI**: Al pulsar el botón "Más" de la navegación inferior, emerge un Bottom Sheet con un suave fondo difuminado (*Glassmorphism*). Presenta una cuadrícula de accesos directos iconográficos de 3 columnas para sub-módulos (Gastos, Ajustes, Documentos, etc.).
*   **Aspecto Crítico**: Mantiene el foco en el flujo de trabajo del usuario evitando la carga de una pantalla completa nueva, lo que agiliza la navegación del operario en movimiento.

### 5. Control de Zonas y Pastos (`5_Zonas.png`)
*   **Propósito**: Distribución de animales por parcelas y rotación de pastos.
*   **Análisis UX/UI**: Muestra un listado de las parcelas disponibles (Zonas de pastoreo) con indicadores visuales de nivel de ocupación en formato de barra de progreso (ej. "Zona A: 85% de capacidad").
*   **Aspecto Crítico**: El color de la barra cambia dinámicamente de verde a naranja si se sobrepasa la carga de pasto recomendada, previniendo la degradación del suelo.

### 6. Control Lechero (`6_Leche.png`)
*   **Propósito**: Registro de ordeños, entregas diarias a compradores, calidades (grasa, proteína) y albaranes de leche.
*   **Análisis UX/UI**: Interfaz muy técnica orientada al ingreso de datos cuantitativos. Presenta KPIs superiores con los litros totales entregados en la semana y gráficos analíticos de las entregas diarias de leche.
*   **Aspecto Crítico**: El diseño destaca alertas si se detectan calidades de leche fuera del rango del contrato comercial, marcando en naranja neón los registros desviados.

### 7. Control Cárnico y Cebadero (`7_Carnico.png`)
*   **Propósito**: Seguimiento de lotes de carne, evolución de peso y ganancia media diaria (GMD).
*   **Análisis UX/UI**: Diseñado en torno a la evolución del peso de los lotes de terneros o corderos. Tablas comparativas que muestran la GMD (Ganancia Media Diaria) de cada animal, facilitando la detección de animales que no están asimilando correctamente el pienso.
*   **Aspecto Crítico**: Los animales rezagados en peso muestran un badge sutil de color coral (`--c-danger`), indicando al operario que requiere revisión veterinaria o cambio de dieta.

### 8. Gestión de Contratos Comerciales (`8_Comercial.png`)
*   **Propósito**: Almacenamiento y supervisión de los contratos de compraventa de leche y carne firmados con industrias lácteas y mataderos.
*   **Análisis UX/UI**: Lista los contratos activos mostrando vigencia, volumen contratado y fórmulas de precios acordadas (precios fijos, indexados, primas por calidad).
*   **Aspecto Crítico**: Los contratos próximos a expirar se muestran con una retroiluminación ámbar para alertar al equipo comercial sobre la necesidad de renegociación.

### 9. Fichero de Compradores (`9_Compradores.png`)
*   **Propósito**: Directorio de industrias, cooperativas y mataderos que adquieren los animales o productos de la explotación.
*   **Análisis UX/UI**: Tarjetas compactas de clientes con accesos rápidos a llamadas, correos o historial de albaranes. Incluye KPIs individuales del volumen de ventas total realizado a cada comprador.
*   **Aspecto Crítico**: La consistencia estética se mantiene gracias a los bordes suavizados de `16px` de las tarjetas y a la iconografía lineal minimalista.

### 10. Directorio de Transportistas (`10_Transportista.png`)
*   **Propósito**: Registro de transportistas habilitados, vehículos autorizados para movimiento animal y matrículas.
*   **Análisis UX/UI**: Tarjetas que destacan de forma muy visible las matrículas de los camiones de ganado, el tipo de remolque (ej. cisterna, dos pisos) y la vigencia de su Certificado de Bienestar Animal en el transporte.
*   **Aspecto Crítico**: Un badge verde neón (`#CF0`) resalta visualmente los vehículos autorizados, garantizando el cumplimiento normativo antes de realizar un envío de animales.

### 11. Módulo de Control de Gastos (`11_Gastos.png`)
*   **Propósito**: Registro de egresos, compras de pienso, facturas veterinarias y gastos de mantenimiento.
*   **Análisis UX/UI**: Interfaz altamente cuantitativa. Muestra un listado cronológico de gastos categorizados con iconos sutiles (ej. un saco de pienso, una jeringuilla). Presenta un KPI superior con el gasto mensual total acumulado.
*   **Aspecto Crítico**: Los importes se muestran alineados a la derecha en tipografía `IBM Plex Mono` de tamaño generoso para agilizar la conciliación con las facturas en papel.

### 12. Exportación de Datos (`12_Exportacion.png`)
*   **Propósito**: Exportar informes, históricos de pesajes o censos en formatos abiertos.
*   **Análisis UX/UI**: Diseño de botones grandes de ancho completo que permiten descargar reportes en formatos PDF, Excel, CSV o JSON.
*   **Aspecto Crítico**: Se minimizan los pasos necesarios, permitiendo exportar con solo dos pulsaciones, ideal para operarios que necesitan enviar información de forma urgente desde el campo.

### 13. Exportaciones Oficiales (`13_Exportación _Oficial.png`)
*   **Propósito**: Preparación de archivos estructurados para la declaración obligatoria ante los ministerios de agricultura (censos oficiales, guías de traslado).
*   **Análisis UX/UI**: Interfaz enfocada en la validación y envío formal de información. Muestra listados de declaraciones agrupadas por su estado administrativo ("Pendiente de Envío", "Enviado y Validado", "Rechazado con Errores").
*   **Aspecto Crítico**: Un badge verde resalta las transmisiones exitosas, aportando tranquilidad legal al administrador ganadero.

### 14. Cuaderno Digital de Explotación - CUE (`14_CuadernoDigital.png`)
*   **Propósito**: Registro obligatorio digital que unifica el uso de fitosanitarios, fertilizantes, tratamientos animales y pastoreo.
*   **Análisis UX/UI**: El diseño organiza los bloques de información requeridos por ley de forma secuencial. Ofrece un checklist visual con los campos obligatorios ya completados y los pendientes para que el cuaderno esté libre de sanciones administrativas.
*   **Aspecto Crítico**: El color verde neón resalta que el cuaderno digital está al 100% de cumplimiento legal diario.

### 15. Documentación DIM_OE y Guías (`15_DocumentosDIMOE.png`)
*   **Propósito**: Gestión de los Documentos de Identificación y Movimiento de ganado Ovino y Caprino (DIM_OE) y guías sanitarias oficiales.
*   **Análisis UX/UI**: Interfaz que emula una carpeta digital de expedientes. Lista cada guía de traslado activa o archivada con su número de serie oficial, REGA de destino, número de cabezas de ganado autorizadas y fecha de emisión.
*   **Aspecto Crítico**: Se destacan en ámbar neón las guías en tránsito activo para alertar sobre traslados en curso que requieren confirmación de llegada.

### 16. Panel de Ajustes y Configuración (`16_Ajustes.png`)
*   **Propósito**: Configuración de dispositivos físicos, sincronización en la nube y utilidades de base de datos.
*   **Análisis UX/UI**: Disposición clara de opciones mediante interruptores (*switches*) de estilo industrial e indicador de conexión Bluetooth para lectores RFID de crotales.
*   **Aspecto Crítico**: Incluye un botón para la carga rápida de la "Demo Chamorro", permitiendo poblar instantáneamente la app con datos realistas para pruebas o auditorías sin afectar a la base de datos real.

---

## 5. Conclusiones y Recomendaciones de Implementación

El tema **Industrial Premium** en modo oscuro es una respuesta de diseño sobresaliente a las necesidades reales del operario agrícola moderno:
1.  **Recomendación de Border Glow**: Se aconseja utilizar la propiedad CSS `box-shadow: 0 0 8px var(--p-cork-glow)` en tarjetas con alertas de alta prioridad para acentuar el efecto de retroiluminación bajo condiciones de luz solar intensa.
2.  **Uso Riguroso de la Fuente Mono**: Mantener sin excepciones el uso de `IBM Plex Mono` en todas las cadenas de texto correspondientes a crotales oficiales y REGA para garantizar el cumplimiento normativo libre de errores de digitación.
3.  **Animación de Carga de Wizards**: Implementar transiciones fluidas de `200ms` con aceleración lineal para asegurar que los asistentes de pesaje masivo y ventas se sientan rápidos y reactivos en dispositivos móviles de gama media.
