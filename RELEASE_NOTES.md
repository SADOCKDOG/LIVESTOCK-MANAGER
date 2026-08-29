## Release Notes - Version 4.10.5 (526)

- Corrección del bloqueo de generación de PDFs tras el revert.
- Mejorada la revalidación automática de la licencia al entrar en Soporte.
- Actualizada la caché del Service Worker a `corcho-v6.78`.
- Versión incrementada a 4.10.5 (526) en todas las ubicaciones.
- Verificación de sintaxis completada en los assets generados.
- Preparado para subir a Google Play Console.

### Notas de publicación
- La generación de PDFs ahora utiliza la API unificada DocumentViewer.
- Al entrar en la sección de Soporte, la app revalida automáticamente la licencia; si la compra está activa, se muestra la fecha de expiración.
- Se añadió la cabecera de navegación en Mis Incidencias con estilo adecuado.
- Se resolvió el problema de que el mensaje «Sin licencia de soporte» aparecía aunque la suscripción estuviera vigente.
- Se actualizó el número de versión y el código en `js/app-version.js`, `package.json`, `android/app/build.gradle` y en los assets.
- Se incrementó el número de versión en el Service Worker (`CACHE_NAME`).
- Se actualizaron los enlaces a `v=6.78` en `index.html` para forzar la recarga de los recursos.