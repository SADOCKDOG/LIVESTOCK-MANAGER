## Release Notes - Version 4.10.8 (529)

Publicada sobre la 4.10.5 (526). El grueso de la versión es el módulo de
soporte: la conversación con el equipo dentro de la app y la identidad que
mantiene el historial cuando cambia la suscripción.

### Soporte
- **Mis incidencias es ahora una conversación.** Campo para responder al
  equipo, respuestas del agente de IA distinguidas visualmente de las del
  equipo humano y estado `analizada` en la leyenda.
- **`resuelta` es una propuesta, no un cierre.** La app pregunta al usuario si
  la solución le funciona; si dice que no, la incidencia se reabre y vuelve a
  `revision`. Confirmada la resolución, el campo de respuesta desaparece.
- **La cabecera de Mis incidencias volvía a verse** (se había quedado sin
  estilos en móvil).

### Identidad de soporte
- **Id de instalación** guardado en el almacén `meta` de IndexedDB y enviado en
  `/auth/verify-purchase`. Reencuentra al mismo usuario cuando Google emite un
  `purchase_token` nuevo tras una recompra, que antes dejaba huérfano el
  historial. Como entra en la copia de seguridad, sobrevive a un móvil nuevo.
- El Worker **rechaza adoptar la identidad anterior** si la licencia vieja
  sigue activa: dos licencias vivas a la vez son dos personas, no una recompra.
- **Correo de contacto opcional** en Ajustes → Licencia, como último recurso
  manual. Es el de quien usa la app, que puede ser un empleado; nunca se
  prerrellena con el de la ficha de finca, que es el del titular.

### Tabla ERP
- Reticula legible y exportación CSV funcional en móvil; se veía sin estilos y
  con el conmutador invisible en Android.
- Un solo buscador, con el estado sobreviviendo al repintado.
- Vista de registros unificada en Ajustes y marco de acciones usable en móvil.

### Versiones
- 4.10.8 (529) en `js/app-version.js`, `package.json` y
  `android/app/build.gradle`.
- Caché del Service Worker en `corcho-v6.81` y enlaces a `v=6.81` en
  `index.html`.

### Antes de subir a Google Play
El AAB debe generarse con `npm run build:free`, que es el build **con pago**
(`window.FREE_MODE = true`). El nombre engaña: `build:premium` produce el build
de pruebas, con la app desbloqueada, y **no sirve para publicar**.
