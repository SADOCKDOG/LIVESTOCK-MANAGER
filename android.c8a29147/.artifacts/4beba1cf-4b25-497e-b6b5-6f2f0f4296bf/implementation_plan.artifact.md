# Corrección de Error "main is not defined" y Mejora de UX en ExPro

Este plan aborda el error reportado por el usuario al navegar a la pantalla de Comercialización desde ExPro, así como otros problemas similares en varias vistas del proyecto donde la variable `main` se utiliza sin estar definida. Además, se mejorará el texto del botón en la vista ExPro para que refleje mejor el modo híbrido.

## User Review Required

> [!IMPORTANT]
> Se han detectado múltiples archivos con el mismo error de variable no definida. Se corregirán todos los archivos identificados para evitar errores futuros en otras secciones de la aplicación.

## Proposed Changes

### [Web Frontend]

#### [MODIFY] [comercializacion-view.js](file:///C:/Users/yo/repo/LIVESTOCK-MANAGER/android/app/src/main/assets/public/js/views/comercializacion-view.js)
- Definir `const main = document.getElementById('app-content');` al inicio de la función `render()`.

#### [MODIFY] [carne-view.js](file:///C:/Users/yo/repo/LIVESTOCK-MANAGER/android/app/src/main/assets/public/js/views/carne-view.js)
- Definir `const main = document.getElementById('app-content');` al inicio de la función `render()`.

#### [MODIFY] [leche-view.js](file:///C:/Users/yo/repo/LIVESTOCK-MANAGER/android/app/src/main/assets/public/js/views/leche-view.js)
- Definir `const main = document.getElementById('app-content');` al inicio de la función `render()`.

#### [MODIFY] [hibrido-view.js](file:///C:/Users/yo/repo/LIVESTOCK-MANAGER/android/app/src/main/assets/public/js/views/hibrido-view.js)
- Definir `const main = document.getElementById('app-content');` al inicio de la función `render()`.

#### [MODIFY] [gastos-view.js](file:///C:/Users/yo/repo/LIVESTOCK-MANAGER/android/app/src/main/assets/public/js/views/gastos-view.js)
- Definir `const main = document.getElementById('app-content');` al inicio de la función `render()`.

#### [MODIFY] [explotacion-view.js](file:///C:/Users/yo/repo/LIVESTOCK-MANAGER/android/app/src/main/assets/public/js/views/explotacion-view.js)
- Actualizar el label del botón en `_renderPipelineComercialHtml` para que en el modo híbrido muestre "Ir a Comercialización Leche, Carne e Híbrido".

## Verification Plan

### Manual Verification
- Navegar a la pantalla **ExPro**.
- Seleccionar el modo **Híbrido**.
- Verificar que el botón de comercialización ahora dice "Ir a Comercialización Leche, Carne e Híbrido".
- Pulsar el botón y verificar que la transición a la pantalla de **Comercialización** se realiza sin errores (el error "main is not defined" no debe aparecer).
- Verificar que las vistas de **Carne**, **Leche**, **Híbrido** (individuales) y **Gastos** también cargan correctamente desde sus respectivos menús.
