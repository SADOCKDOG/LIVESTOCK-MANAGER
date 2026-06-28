# Reescritura Completa de Manuales de Usuario (v4.8.0 Premium)

La aplicación ha experimentado una transformación radical en su arquitectura de navegación y diseño visual (UI/UX). Los manuales actuales están obsoletos tanto en imágenes como en instrucciones paso a paso. Este plan propone una reescritura desde cero de los manuales principales basándose en la estructura de navegación "Hub-Centric" (Ganadería y ExPro).

## Análisis de la Nueva Navegación (Hub-Centric)

1.  **Barra Inferior Simplificada**:
    *   `Inicio`: Dashboard con visión 360°.
    *   `Ganadería`: Hub de gestión del censo (Animales, Rebaños, Zonas).
    *   `ExPro`: Hub de operativa diaria (Pesajes, Ordeños, Silos, Gastos operativos).
    *   `Más`: Menú desplegable para configuraciones, maestros comerciales y documentos.

2.  **Modos de Trabajo**:
    *   La app ahora funciona bajo un "Contexto de Modo" (Cárnico, Lácteo, Híbrido) que cambia la interfaz dinámicamente en Ganadería y ExPro.

## Cambios Propuestos

### 1. Generación de Base Gráfica (Capturas de Pantalla)
Se tomarán capturas sistemáticas siguiendo los flujos reales:
*   `01-dashboard.png`: Inicio.
*   `02-ganaderia-hub.png`: Pantalla Ganadería.
*   `03-animales-lista.png`: Listado de animales.
*   `04-ficha-animal-wizard.png`: Nuevo wizard de alta de animal (Ficha Animal).
*   `05-expro-carne.png`: ExPro en modo cárnico.
*   `06-expro-leche.png`: ExPro en modo lácteo.
*   `07-expro-hibrido.png`: ExPro en modo híbrido.
*   `08-comercial-carne.png`: Comercialización > Carne.
*   `09-comercial-leche.png`: Comercialización > Leche.
*   `10-informes-analitica.png`: Inteligencia Analítica.
*   `11-menu-mas.png`: El nuevo menú de navegación "Más".

### 2. Actualización de Manuales (Contenido)

#### [MODIFY] [index.html](file:///C:/Users/yo/repo/LIVESTOCK-MANAGER/manual/index.html)
*   Reescribir la sección "Cómo usar la aplicación" explicando los dos Hubs principales: **Ganadería** y **ExPro**.
*   Eliminar referencias a la barra inferior antigua.
*   Actualizar capturas de pantalla.

#### [MODIFY] [manual-animales-rebanos.html](file:///C:/Users/yo/repo/LIVESTOCK-MANAGER/manual/manual-animales-rebanos.html)
*   **Paso 1**: Acceso desde el Hub de Ganadería.
*   **Paso 2**: Explicación del nuevo diseño de Ficha Animal (pantalla completa con NFC/SCAN arriba).
*   **Paso 3**: Validación de crotal en tiempo real (dorado/verde).

#### [MODIFY] [manual-comercializacion.html](file:///C:/Users/yo/repo/LIVESTOCK-MANAGER/manual/manual-comercializacion.html)
*   Actualizar rutas: `Más -> Comercialización` o desde el pipeline de `ExPro`.
*   Mostrar los nuevos KPIs Premium en las cabeceras de Carne/Leche.

#### [MODIFY] [manual-gastos.html](file:///C:/Users/yo/repo/LIVESTOCK-MANAGER/manual/manual-gastos.html)
*   Ruta: `ExPro -> Acciones de Gasto` (Alimentación, Energía, Fito).
*   Nueva UI de los botones neón.

### 3. Ajustes de Versión
*   Unificar toda la documentación en la versión **v4.8.0 Premium**.

## Plan de Ejecución

1.  **Captura Directa**: Usar el emulador para obtener las pantallas exactas de la v4.8.0.
2.  **Edición HTML**: Aplicar los cambios de texto reflejando las rutas `Ganadería -> X` o `ExPro -> Y`.
3.  **Verificación**: Abrir los manuales en la app y validar que el "Paso 1" coincide con lo que el usuario ve en pantalla.
