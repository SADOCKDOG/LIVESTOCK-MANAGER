# Soporte de pago e incidencias en la aplicación de escritorio (Microsoft Store)

**Fecha:** 2026-09-03
**Autor:** David Asuar (con Claude)
**Estado:** Diseño validado, pendiente de plan de implementación
**Alcance:** `livestock-desktop` (host Tauri + frontend), `livestock-manager-support-api` (Worker), `LIVESTOCK-MANAGER` (código fuente del frontend)

---

## 1. Resumen ejecutivo

El módulo de soporte —compra de la licencia y registro de incidencias— funciona hoy solo en
Android. La app de escritorio ya tiene la Piel de ERP y, desde hoy, las entradas de menú
«Soporte Técnico» y «Mis Incidencias» en Ajustes, pero detrás no hay nada: no existe el
cliente de la API de soporte, no existe la vista de incidencias y la lista de incidencias es
una maqueta con texto fijo.

Este documento define cómo se completa: la compra se cobra **dentro de la Microsoft Store**
como complemento (add-on) de una aplicación gratuita, igual que en Android, y se **verifica en
el servidor** contra la API de colecciones de Microsoft. El host es **Tauri**, empaquetado
como MSIX para obtener identidad de paquete, que es lo que permite usar WinRT.

El hallazgo que ordena todo el diseño: en Microsoft Store el `purchaseToken` que devuelve la
Digital Goods API **es el identificador del complemento** (`support_unlock`), idéntico para
todos los compradores del mundo. No sirve ni como identidad ni como prueba de compra. La
identidad de Windows se ancla por tanto al `orderId` de la compra real, que solo se obtiene
consultando la API de colecciones desde el servidor.

Lo que **no** cambia: `services/identidad.ts` del Worker no se toca. Está escrito contra una
abstracción (`comprobarLicencia`), no contra Google, y toda su tabla de decisiones —incluida
la regla que costó una incidencia en producción— vale igual en Windows.

---

## 2. Decisiones de diseño (validadas con el usuario)

| # | Decisión |
|---|---|
| D1 | El soporte **se cobra** en escritorio, no se regala. La aplicación sigue siendo gratuita; lo de pago es el complemento, igual que en Android. |
| D2 | El cobro va **por Microsoft Store** (opción B: host nativo con WinRT y verificación real en servidor), descartando pasarela externa tipo Stripe. |
| D3 | El host nativo es **Tauri** (`livestock-desktop`), no una app C#/WinUI 3 con WebView2. |
| D4 | Se reutiliza el frontend existente: `soporte-view.js`, `avisos-soporte.js` y `support-api.js` se copian tal cual desde `LIVESTOCK-MANAGER`; solo `support-api.js` aprende a mandar una prueba distinta. |
| D5 | La unificación de cuentas entre Android y Windows queda **fuera de alcance**: es la fase de Google Sign-In. Quien pague en las dos tiendas tendrá dos licencias y dos identidades. |

### 2.1 Hechos verificados (no suposiciones)

Todo lo siguiente se comprobó contra el código real del repositorio o la documentación de
Microsoft, no se dio por supuesto:

1. **El `purchaseToken` de Microsoft Store es el Product ID.** `listPurchases()` y
   `listPurchaseHistory()` devuelven `purchaseToken === 'support_unlock'` para cualquier
   comprador. No identifica a nadie y cualquiera puede teclearlo.
2. **La verificación real es la API de colecciones**:
   `POST https://collections.mp.microsoft.com/v6.0/collections/query`, autenticada con Entra
   ID y consumiendo una **Store ID key** de 30 días de validez. La clave se genera **en el
   cliente** con WinRT: `StoreContext.GetCustomerCollectionsIdAsync(serviceTicket, publisherUserId)`.
3. **Una PWA no tiene WinRT.** El formato PWABuilder no puede verificar nada. Una aplicación
   Win32 empaquetada sí, vía `IInitializeWithWindow` con el HWND de la ventana, y para eso
   hace falta **identidad de paquete MSIX**.
4. **Tauri no genera MSIX de serie.** Su ruta oficial a la Store es una ficha que enlaza a un
   instalador externo: sin identidad de paquete, sin `StoreContext`, sin complementos. Se usa
   el empaquetador comunitario `@choochmeque/tauri-windows-bundle`.
5. **La Digital Goods API sí existe** en Edge desde `134.0.3124.51`, en todos los canales,
   **pero no dentro de Tauri** (ver «Corrección del 3 sep 2026» al final). El
   README de `livestock-pwa-msix` dice lo contrario y está obsoleto: su propio
   `js/purchase-manager.js` ya la usa.
6. **`livestock-pwa-msix/js/purchase-manager.js` ya tiene escrita la compra completa**:
   `getDigitalGoodsService`, `getDetails`, `PaymentRequest` y reconfirmación con
   `listPurchases`. Es código aprovechable, no hay que escribirlo.
7. **El frontend de escritorio no tiene el módulo de soporte**: son **cuatro** ficheros, no tres
   —`frontend/js/services/support-api.js`, `js/services/avisos-soporte.js`,
   `js/views/soporte-view.js` y `js/views/mis-incidencias-view.js`, el mayor de todos—, y ni
   `#/soporte` ni `#/mis-incidencias` aparecen en `frontend/js/app.js`.
   `AjustesView._verMisIncidencias()` es una maqueta con texto fijo que nunca llama al backend.
8. **`livestock-desktop` no está bajo control de versiones**: sin ningún commit, sin remoto,
   todo sin seguimiento. Es el riesgo más inmediato del proyecto.
9. **Microsoft Store permite motor de cobro de terceros** para productos dentro de la app en
   aplicaciones que no son juegos, y esas compras no pagan comisión de la Store. Es la base de
   la opción descartada; se registra aquí para no volver a investigarlo.
10. **La sincronización borra lo que no reconoce.** `Prune-Tree`, dentro de
   `scripts/sync-from-master.ps1`, elimina de `frontend/` todo fichero que no exista en el
   maestro y no figure en `$preservedList`. Cualquier fichero nuevo que viva solo en el
   escritorio debe registrarse ahí.
11. **La lista de orígenes CORS del Worker no incluye el de Tauri.** `ORIGENES`, en
   `livestock-manager-support-api/src/index.ts`, no contempla `tauri://localhost` ni
   `http://tauri.localhost`: sin añadirlos, la app empaquetada falla en la primera petición.

---

## 3. Arquitectura

Cuatro piezas en tres repositorios, con una regla: **el frontend es un único código fuente**,
mantenido en `LIVESTOCK-MANAGER` y sincronizado hacia los demás con
`scripts/sync-from-master.ps1`.

| Pieza | Repositorio | Qué cambia |
|---|---|---|
| Frontend compartido | `LIVESTOCK-MANAGER` | Nada: `iniciarSesion` ya envía en `purchase_token` lo que se le pase, y en Windows eso es la Store ID key |
| Frontend de escritorio | `livestock-desktop/frontend` | Recibe la sincronización; se registran `/soporte` y `/mis-incidencias`; nuevo `js/services/soporte-store.js` |
| Host nativo | `livestock-desktop/src-tauri` | Nuevo comando `obtener_store_id_key()` |
| Backend | `livestock-manager-support-api` | Nuevo `services/msStoreBilling.ts`, nueva ruta `/auth/ms/ticket`, rama `windows` en `/auth/verify-purchase` |

`services/identidad.ts` **no se modifica**. Recibe un `comprobarLicencia` distinto y un
`userIdDelToken` distinto, y su tabla de decisiones se mantiene íntegra.


### 3.1 Qué papel juega Tauri, exactamente

Tauri **no cambia**: sigue siendo el mismo host que ya está en `livestock-desktop/src-tauri`,
con su `tauri.conf.json`, su ventana de 1280x800 y su `frontendDist: "../frontend"`. El diseño
no lo sustituye ni lo reescribe. Le añade **una sola cosa** y le cambia **una sola cosa**.

**Lo que le añade: un comando, y nada más.** Todo el trabajo nativo del diseño cabe en una
función de Rust expuesta con `#[tauri::command]`:

```rust
#[tauri::command]
async fn obtener_store_id_key(ventana: tauri::Window, ticket: String, publisher_user_id: String)
    -> Result<String, String>
```

Dentro: `StoreContext::GetDefault()`, inicializarlo con el HWND que da `ventana.hwnd()` a
través de `IInitializeWithWindow` —sin eso, WinRT lanza en una aplicación de escritorio— y
`GetCustomerCollectionsIdAsync(ticket, publisher_user_id)`. Devuelve la Store ID key. El
frontend lo llama con `window.__TAURI__.core.invoke('obtener_store_id_key', ...)`.

La superficie nativa son **dos** comandos, no uno: `obtener_store_id_key` y
`comprar_complemento` (`StoreContext::RequestPurchaseAsync`, también con `IInitializeWithWindow`).
La identidad y la verificación siguen fuera de Rust: de eso se encarga el Worker. Ver
«Corrección del 3 sep 2026» al final: el pago tuvo que bajar a Rust porque la Digital Goods API
no funciona dentro del WebView2 de Tauri.

**Lo que le cambia: cómo se empaqueta.** Aquí está el único conflicto real con Tauri. Sus
objetivos de `bundle` son MSI y NSIS —instaladores—, y la ruta oficial de Tauri a la Microsoft
Store es publicar una ficha que enlaza a ese instalador. Una aplicación instalada así **no
tiene identidad de paquete**, y sin identidad de paquete `StoreContext` no funciona y la Store
no le vende complementos. La ruta oficial de Tauri es, por tanto, incompatible con D2.

La salida es empaquetar la salida de Tauri como **MSIX** con `@choochmeque/tauri-windows-bundle`,
que es un empaquetador comunitario, no oficial. Es la dependencia frágil del diseño y conviene
decirlo con todas las letras: si ese empaquetador no da la talla, la alternativa es generar el
MSIX a mano con `MakeAppx.exe` a partir de la carpeta que Tauri produce, lo cual es más trabajo
pero no depende de nadie. Lo que **no** cambiaría en ninguno de los dos casos es el código:
mismo frontend, mismo comando de Rust.

**Lo que no toca de Tauri:** el `identifier` `com.livestockmanager.premium` y el nombre de
producto siguen siendo los del `tauri.conf.json` actual; solo hay que reconciliarlos con la
ficha de Partner Center (sección 7). Y `beforeBuildCommand: "npm run sync"` se queda: es el
que garantiza que el frontend empaquetado sea el sincronizado desde `LIVESTOCK-MANAGER`.

---

## 4. Compra y verificación

La compra la abre WinRT (`comprar_complemento`), no la Digital Goods API — ver «Corrección del
3 sep 2026». La verificación son tres saltos:

1. **La app pide un ticket.** `POST /auth/ms/ticket`. El Worker obtiene de Entra ID un token
   con audiencia `https://onestore.microsoft.com` usando su secreto de cliente, que **nunca
   sale del servidor**, y devuelve el ticket.
2. **El host convierte el ticket en clave.** La app llama al comando Tauri
   `obtener_store_id_key(ticket, publisher_user_id)`. Rust hace `StoreContext.GetDefault()`,
   lo inicializa con el HWND de la ventana vía `IInitializeWithWindow` y llama a
   `GetCustomerCollectionsIdAsync`. Devuelve una Store ID key válida 30 días.
3. **El Worker consulta la colección.** La app manda la clave a `/auth/verify-purchase` con
   `plataforma: 'windows'`. El Worker consulta la API de colecciones.

**Se concede la licencia solo si** existe un elemento con `inAppOfferToken === 'support_unlock'`,
`status === 'Active'` y `endDate` en el futuro. `licencia_expira` se toma de `endDate`. Los
estados `Revoked` y `Banned` deniegan igual que un reembolso de Google.

`/auth/ms/ticket` es una ruta abierta pero no concede nada: solo permite a quien la llama
acuñar una clave **para su propia identidad de Windows**. Va limitada por IP.

---

## 5. Identidad

| | Android | Windows |
|---|---|---|
| Ancla | `hash("usuario:" + purchase_token)` | `hash("usuario:ms:" + orderId)` |
| Puente entre compras | id de instalación | id de instalación |
| Prueba de recompra encadenada | `linkedPurchaseToken` | **no existe equivalente** |

El `publisherUserId` que se pasa al acuñar la clave **es el id de instalación**, y vuelve en
`purchaser.identityValue` de la respuesta. Eso permite al Worker comprobar que la clave
corresponde a la instalación que dice ser.

Como Microsoft no expone nada equivalente a `linkedPurchaseToken`, el motivo
`recompra-encadenada` sencillamente nunca se dispara en Windows: ese caso cae en
`licencia-anterior-caducada`, que es el comportamiento correcto.

**Consecuencia aceptada (D5):** el mismo ganadero pagando en Android y en Windows tendrá dos
licencias y dos identidades. Restaurar en el escritorio la copia de seguridad del móvil unifica
el historial, porque el id de instalación viaja dentro de la copia.

---

## 6. Frontend

En este orden:

1. Ejecutar `scripts/sync-from-master.ps1` y **revisar el diff**: el frontend de escritorio ha
   divergido y la sincronización no es inocua. La maqueta de `AjustesView._verMisIncidencias()`
   desaparece sola, porque `ajustes-view.js` no está preservado y llega el del maestro, que ya
   enlaza a las rutas reales; no hay que sustituirla a mano.
2. Registrar `/soporte` y `/mis-incidencias` en `frontend/js/app.js`, y arrancar
   `AvisosSoporteService` en `init()`.
3. Añadir las cuatro etiquetas `<script>` del módulo a `frontend/index.html`.
4. Escribir `frontend/js/services/soporte-store.js`, registrarlo en `$preservedList` y exponer
   `revalidarSoporte()` en las dos ramas de `purchase-manager.js`. `support-api.js` no cambia.

---

## 7. Empaquetado

MSIX con `@choochmeque/tauri-windows-bundle`, firmado, subido a Partner Center; si ese
empaquetador falla, MSIX a mano con `MakeAppx.exe` (ver 3.1).
`support_unlock` ya está descrito en `livestock-pwa-msix/partner_center_addon.json` como
`MONTHLY`, y así se queda: el soporte se cobra mensual y es opcional, a **6,99 EUR de
precio base** (Partner Center convierte a las demás divisas). La app va a **Gratis**
en Partner Center; lo único de pago es este complemento. No se replica el periodo anual de
Play. Consecuencia técnica: con `validityType: 'All'` una suscripción mensual acumula un
elemento por renovación en la colección, que es exactamente el caso que obliga a paginar en
`verificarLicenciaWindows`. El `identifier` de Tauri
(`com.livestockmanager.premium`) y el nombre de producto («Livestock Manager PREMIUM») deben
reconciliarse con la ficha de la Store.

---

## 8. Cuando algo falla

| Fallo | Comportamiento |
|---|---|
| No hay puente nativo (ejecución fuera de la app instalada) | El soporte simplemente no se ofrece; la app funciona igual |
| El usuario cierra el diálogo de compra | `RequestPurchaseAsync` devuelve `NotPurchased`; se trata como cancelación, no como error |
| Entra ID caído | 502; la sesión anterior sigue válida hasta caducar |
| `GetCustomerCollectionsIdAsync` lanza | Mensaje claro; no se concede nada |
| API de colecciones caída | `comprobarLicencia` lanza → `comprobacion-fallida` → **el enlace de instalación se queda intacto** |

La última fila es la regla que costó una incidencia en producción el 2026-09-03: negar la
adopción nunca puede reescribir `instalacion:<id>`, porque eso destruye para siempre el único
camino de vuelta al historial, ni restaurando la copia de seguridad.

---

## 9. Pruebas

- `msStoreBilling.ts` se prueba contra respuestas grabadas de la API de colecciones, sin red.
- Se añaden casos de Windows a `test/identidad.test.ts`: recompra tras caducidad adopta el
  historial; suscripción revocada deniega.
- WinRT no es automatizable: se verifica instalando el MSIX firmado y comprando en el entorno
  de pruebas de Partner Center.

---

## 10. Orden de construcción

1. **Poner `livestock-desktop` bajo control de versiones.** Hoy no tiene ni un commit ni un
   remoto: todo el trabajo está a un borrado de perderse.
2. Sincronizar el frontend y dejar el módulo de soporte visible y navegable en escritorio,
   todavía sin pago.
3. `msStoreBilling.ts` y la rama `windows` del Worker, con pruebas.
4. El comando Rust y el puente desde el frontend.
5. MSIX, firma y una compra real en Partner Center.

Los pasos 1 y 2 ya dejan algo demostrable.

**Coste:** Entra ID es gratuito, el KV ya existe, la app sigue siendo gratuita. Microsoft se
lleva el 15 % del complemento.

---

## Corrección del 3 sep 2026 — la compra va por WinRT, no por Digital Goods

Al probar el vuelo 4.11.0.0 instalado desde la Store, la pantalla de soporte falló con
«unsupported context». `window.getDigitalGoodsService` **existe** en el WebView2 de Tauri, pero
rechaza: Chromium solo habilita esa API (y el método de pago `microsoft.com/…` de
`PaymentRequest`) en aplicaciones instaladas *desde* la Store —PWA o TWA—, y un WebView2
embebido en un host Win32 no lo es.

La restricción queda invertida respecto a lo que asumía esta spec, escrita para la PWA MSIX:

| | PWA empaquetada (MSIX) | App de escritorio (Tauri) |
|---|---|---|
| WinRT / `StoreContext` | No | **Sí** |
| Digital Goods + Payment Request | Sí | **No** |

**Consecuencias, ya implementadas** en `livestock-desktop`:

- `comprar_complemento(hwnd, store_id)` en `src-tauri/src/store_winrt.rs`, expuesto como comando
  Tauri en `main.rs`, llama a `StoreContext::RequestPurchaseAsync`.
- **`RequestPurchaseAsync` quiere el Store ID del complemento (`9P4577W3B0D2`), no el Product ID.**
  El Product ID (`support_unlock`) sigue siendo lo que devuelve la API de colecciones en
  `inAppOfferToken` y lo que filtra el Worker; son identificadores distintos y no intercambiables.
- `StorePurchaseStatus::AlreadyPurchased` cuenta como éxito y `NotPurchased` como cancelación.
  Pagar no concede licencia por sí solo: quien la acredita sigue siendo el servidor, tras
  `revalidar()`.
- `frontend/js/services/soporte-store.js` ya no contiene `getDigitalGoodsService` ni
  `PaymentRequest`. El bloque de Digital Goods que queda en `purchase-manager.js` pertenece al
  camino de la PWA y no se ejecuta en el build de escritorio (`FREE_MODE = false`).

El hallazgo 6 sigue siendo cierto para `livestock-pwa-msix`; deja de serlo para el escritorio.
