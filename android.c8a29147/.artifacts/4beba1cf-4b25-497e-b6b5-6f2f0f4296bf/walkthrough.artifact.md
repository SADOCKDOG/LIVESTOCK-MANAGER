# Walkthrough - Reescritura de Manuales v4.8.0 Premium

Se ha realizado una actualización integral y desde cero de la documentación de usuario para reflejar fielmente la nueva arquitectura de la aplicación basada en Hubs y el diseño Premium.

## Cambios Realizados

### 1. Nueva Base Gráfica (Estandarizada)
Se han tomado 11 capturas de pantalla clave del emulador, asegurando que cada una refleje el estado actual de la UI (Tema oscuro, acentos neón, nueva barra de navegación):
- `01-dashboard.png`: Portada del sistema.
- `02-ganaderia-hub.png`: Centro de gestión del censo.
- `03-animales-lista.png`: Nuevo diseño de listado con búsqueda.
- `04-ficha-animal-wizard.png`: Documentación del wizard a pantalla completa.
- `05-expro-carne.png`, `06-expro-leche.png`, `07-expro-hibrido.png`: Los tres estados del Hub operativo.
- `08-comercial-carne.png`, `09-comercial-leche.png`: Flujos de venta actualizados.
- `10-informes-analitica.png`: Pantalla de inteligencia de negocio.
- `11-menu-mas.png`: Nueva navegación secundaria.

### 2. Reescritura de Instrucciones Paso a Paso
Se han redefinido las rutas de acceso en todos los archivos HTML para evitar errores de navegación:
- **Antes**: "Registros -> Animales"
- **Ahora**: "Ganadería -> Animales" o "ExPro -> Registrar X"
- Se ha añadido la explicación de la **Ficha Animal Wizard**, que antes no existía como proceso independiente.

### 3. Archivos Actualizados
- `manual/index.html`: Reestructurado para explicar el concepto de Hubs (Ganadería y ExPro).
- `manual/manual-animales-rebanos.html`: Actualizado con el flujo de alta Premium.
- `manual/manual-comercializacion.html`: Actualizado con el acceso dual (Más o ExPro).
- `manual/manual-gastos.html`: Simplificado para resaltar el registro rápido desde ExPro.

## Verificación
Se ha comprobado manualmente que:
1. Las imágenes existen en `manual/img/` con los nombres correctos.
2. Los enlaces internos del manual general (`index.html`) funcionan.
3. El lenguaje utilizado es consistente con el tono "Premium" de la v4.8.0.
