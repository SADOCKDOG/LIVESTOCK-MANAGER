# Soporte de pago e incidencias en escritorio (Microsoft Store) — Plan de implementación

> **Para agentes ejecutores:** SUB-SKILL OBLIGATORIA: usa `superpowers:subagent-driven-development` (recomendada) o `superpowers:executing-plans` para ejecutar este plan tarea a tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** que un ganadero pueda comprar la licencia de soporte dentro de la Microsoft Store desde la app de escritorio, y abrir y seguir sus incidencias, con la compra verificada en el servidor.

**Arquitectura:** el frontend es el mismo de Android, sincronizado desde `LIVESTOCK-MANAGER`. La compra la hace la Digital Goods API dentro del WebView2; un comando de Rust convierte un ticket de Entra ID en una Store ID key vía WinRT; el Worker consulta con esa clave la API de colecciones de Microsoft y solo entonces emite sesión. `services/identidad.ts` no se toca.

**Stack:** Tauri 2 + Rust (windows-rs), JavaScript ES5 sin framework (frontend), Cloudflare Workers + Hono + TypeScript (backend), `node --test` con borrado de tipos nativo (pruebas del Worker).

**Spec:** `docs/superpowers/specs/2026-09-03-soporte-microsoft-store-design.md`

## Restricciones globales

- **El id del complemento de soporte es `support_unlock`** en Partner Center, y debe coincidir literalmente con la constante del Worker. No confundir con `premium_unlock`, que es el desbloqueo Premium de la app y ya existe en el escritorio.
- **Ancla de identidad en Windows:** `hash("usuario:ms:" + orderId)`, primeros 16 bytes de SHA-256 en hexadecimal. En Android sigue siendo `hash("usuario:" + purchase_token)`.
- **Regla inviolable:** negar la adopción de una identidad anterior **nunca** puede reescribir `instalacion:<id>`. Vive en `services/identidad.ts` y está cubierta por dos pruebas de regresión. Si una prueba nueva obliga a cambiar ese fichero, el diseño está mal, no la prueba.
- **Sin verificación no hay licencia.** Ante cualquier duda (API caída, clave inválida, estado desconocido) se deniega. Preferible negar que regalar el producto de pago.
- **Ningún secreto en `[vars]` de `wrangler.toml`.** Los secretos van solo por `wrangler secret put --env production`. Una var vacía anula el secreto del mismo nombre.
- **No desplegar el Worker ni escribir en producción sin autorización explícita del usuario en cada ocasión.**
- **El frontend de escritorio es una copia sincronizada.** Cualquier fichero nuevo que viva solo en `livestock-desktop/frontend` **debe** añadirse a `$preservedList` de `scripts/sync-from-master.ps1`, o el siguiente `npm run sync` lo borrará: `Prune-Tree` elimina todo lo que no exista en el maestro.
- **Ficheros del escritorio ya preservados** (no llegan del maestro, se editan aquí): `index.html`, `js\app.js`, `js\purchase-manager.js`, `js\mode-config.js`, `js\erp-data-table.js`, `js\icons-desktop.js`, `js\module-colors.js`, `js\guide-manager.js`.
- **El texto que ve el usuario va en español con acentos correctos.** Los comentarios del código del backend siguen la convención existente: español sin acentos.

---

## Estructura de ficheros

| Fichero | Responsabilidad |
|---|---|
| `livestock-desktop/.gitignore` *(modificar)* | Excluir del repositorio los artefactos pesados que hoy están sueltos |
| `livestock-desktop/frontend/js/app.js` *(modificar)* | Registrar las rutas `/soporte` y `/mis-incidencias` |
| `livestock-desktop/frontend/index.html` *(modificar)* | Cargar los cuatro ficheros del módulo de soporte y el puente de la Store |
| `livestock-desktop/frontend/js/services/soporte-store.js` *(crear)* | **Único** punto que habla con la Microsoft Store para el soporte: comprar, acuñar la clave y revalidar |
| `livestock-desktop/frontend/js/purchase-manager.js` *(modificar)* | Exponer `revalidarSoporte()` delegando en `SoporteStore` |
| `livestock-desktop/scripts/sync-from-master.ps1` *(modificar)* | Preservar `js\services\soporte-store.js` |
| `livestock-desktop/src-tauri/src/main.rs` *(modificar)* | Registrar el comando `obtener_store_id_key` |
| `livestock-desktop/src-tauri/src/store_winrt.rs` *(crear)* | Toda la superficie WinRT: `StoreContext`, HWND, `GetCustomerCollectionsIdAsync` |
| `livestock-desktop/src-tauri/Cargo.toml` *(modificar)* | Dependencia `windows` con las features de `Services::Store` |
| `livestock-manager-support-api/src/types.ts` *(modificar)* | `Plataforma` acepta `'windows'`; `Env` recibe las tres variables de Entra ID |
| `livestock-manager-support-api/src/services/msStoreBilling.ts` *(crear)* | Token de Entra ID, consulta a la API de colecciones e interpretación de la respuesta |
| `livestock-manager-support-api/src/routes/auth.ts` *(modificar)* | Ruta `/auth/ms/ticket` y rama `windows` de `/auth/verify-purchase` |
| `livestock-manager-support-api/test/msStoreBilling.test.ts` *(crear)* | Interpretación de respuestas grabadas, sin red |
| `livestock-manager-support-api/test/identidad.test.ts` *(modificar)* | Casos de Windows |

---

## Tarea 1: Poner `livestock-desktop` bajo control de versiones

Hoy el repositorio no tiene ni un commit ni un remoto: todo el trabajo está a un borrado de perderse. Va primero porque todas las tareas siguientes escriben en él.

**Ficheros:**
- Modificar: `livestock-desktop/.gitignore`

**Interfaces:**
- Consume: nada.
- Produce: un repositorio con historial sobre el que las demás tareas pueden hacer commit.

- [ ] **Paso 1: comprobar el estado real antes de tocar nada**

```bash
cd /c/Users/yo/repo/livestock-desktop && git log --oneline -1
```

Esperado: falla con «your current branch appears to be broken» o «does not have any commits yet». Si en cambio muestra commits, **detente**: el repositorio ya tiene historial y esta tarea no aplica; avisa al usuario.

- [ ] **Paso 2: medir qué entraría en el commit**

```bash
cd /c/Users/yo/repo/livestock-desktop && du -sh frontend src-tauri scripts && ls -S *.exe *.png *.log 2>/dev/null | head
```

Se busca detectar basura pesada antes de commitearla: la raíz contiene hoy `vs_buildtools.exe`, `serve.log` y una veintena de capturas `validation-*.png`.

- [ ] **Paso 3: ampliar `.gitignore`**

Añadir al final de `livestock-desktop/.gitignore`:

```gitignore
# --- Artefactos de validación y trabajo local (no forman parte del producto) ---
validation-*.png
validacion-*.png
Captura de pantalla *.png
ns_output.txt
tasklist.txt
nul
serve.log
sync-out.log
cypress_cache/
.playwright-mcp/
deploy-temp/
worker-deploy/
src-tauri/gen/
```

`src-tauri/gen/` lo regenera Tauri en cada build; versionarlo produce diffs de ruido constante.

- [ ] **Paso 4: verificar que la basura ha quedado fuera**

```bash
cd /c/Users/yo/repo/livestock-desktop && git status --short | grep -E "vs_buildtools|validation-|serve\.log|src-tauri/gen" | head
```

Esperado: **sin salida**. Si aparece algo, la regla correspondiente no funciona; corrígela antes de seguir.

- [ ] **Paso 5: primer commit**

```bash
cd /c/Users/yo/repo/livestock-desktop && git add -A && git commit -F- <<'MSG'
chore: primer commit del repositorio de escritorio

Estado actual de la app Tauri: frontend sincronizado desde LIVESTOCK-MANAGER,
capa ERP de escritorio, host src-tauri y scripts de sincronizacion.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

- [ ] **Paso 6: comprobar que el commit es sano**

```bash
cd /c/Users/yo/repo/livestock-desktop && git log --oneline -1 && git ls-files | wc -l && git count-objects -vH | grep size-pack
```

Esperado: un commit, varios miles de ficheros, `size-pack` de decenas de MB como mucho. Si supera los 200 MB, algo pesado se ha colado: `git ls-files | xargs du -h 2>/dev/null | sort -rh | head`.

- [ ] **Paso 7: crear el remoto privado y empujar**

Requiere confirmación del usuario: publica código en GitHub.

```bash
cd /c/Users/yo/repo/livestock-desktop && gh repo create SADOCKDOG/livestock-desktop --private --source=. --remote=origin --push
```

---

## Tarea 2: Traer el módulo de soporte al escritorio y hacerlo navegable

Los cuatro ficheros del módulo ya existen en el maestro y llegan solos con el sync. Lo que falta es que el escritorio los cargue y sepa enrutarlos. Al terminar, «Soporte técnico» y «Mis incidencias» funcionan en escritorio contra el backend real, con la única limitación de que todavía no se puede comprar en Windows.

**Ficheros:**
- Modificar: `livestock-desktop/frontend/index.html`
- Modificar: `livestock-desktop/frontend/js/app.js` (tabla de rutas hacia la línea 84, tabla de títulos hacia la 354, e `init()`)
- Sincronizados desde el maestro, no se editan a mano: `frontend/js/services/support-api.js`, `frontend/js/services/avisos-soporte.js`, `frontend/js/views/soporte-view.js`, `frontend/js/views/mis-incidencias-view.js`, `frontend/js/views/ajustes-view.js`

**Interfaces:**
- Consume: el repositorio con historial de la Tarea 1.
- Produce: `window.SupportAPI`, `window.SoporteView`, `window.MisIncidenciasView` y `window.AvisosSoporteService` disponibles en el escritorio, y las rutas `#/soporte` y `#/mis-incidencias`.

- [ ] **Paso 1: dejar el maestro en una rama que el sync acepte**

```bash
cd /c/Users/yo/repo/LIVESTOCK-MANAGER && git checkout master && git pull --ff-only
```

El sync aborta si el maestro no está en `master` o `desktop-mvp`. Si hay trabajo sin commitear, guárdalo antes.

- [ ] **Paso 2: sincronizar**

```bash
cd /c/Users/yo/repo/livestock-desktop && npm run sync
```

Esperado: líneas `Synced: js`, `Synced: css` y varias `preservado (desktop): ...`.

- [ ] **Paso 3: revisar el diff, que no es inocuo**

```bash
cd /c/Users/yo/repo/livestock-desktop && git status --short frontend | head -40 && git diff --stat frontend
```

Dos cambios concretos **se esperan y son correctos**:

1. `frontend/js/views/ajustes-view.js` queda sustituido por el del maestro. El del maestro es mejor: enlaza a `#/soporte` y `#/mis-incidencias` (rutas reales, no una maqueta), usa `Icons.ayuda()` —que sí existe— en lugar de `Icons.telefono()`, y añade la caja `#soporte-licencia` que revalida la licencia contra el servidor. La maqueta local `_verMisIncidencias()`, con sus textos «Funcionalidad de incidencias en desarrollo», desaparece: es justo lo que se busca.
2. `frontend/js/icons.js` pierde la función `telefono()` añadida localmente. No hace falta: nadie la llama después de (1).

Si el diff toca algo más de la capa ERP (barra lateral, tablas), **detente y revísalo con el usuario** antes de commitear.

- [ ] **Paso 4: comprobar que los cuatro ficheros del módulo han llegado**

```bash
cd /c/Users/yo/repo/livestock-desktop && ls -l frontend/js/services/support-api.js frontend/js/services/avisos-soporte.js frontend/js/views/soporte-view.js frontend/js/views/mis-incidencias-view.js
```

Esperado: los cuatro existen. Son cuatro, no tres: `mis-incidencias-view.js` es el más grande de todos.

- [ ] **Paso 5: cargarlos en `frontend/index.html`**

`index.html` está preservado, así que este cambio se hace aquí a mano. Tras el bloque de servicios existente y **antes** de `js/app.js` —porque `App.init()` llama a `AvisosSoporteService.init()` en el arranque—:

```html
    <script src="js/services/support-api.js"></script>
    <script src="js/services/avisos-soporte.js"></script>
    <script src="js/views/soporte-view.js"></script>
    <script src="js/views/mis-incidencias-view.js"></script>
```

- [ ] **Paso 6: registrar las rutas en `frontend/js/app.js`**

En la tabla de rutas, junto a `"/ajustes": "renderAjustes",`:

```js
    "/soporte": "renderSoporte",
    "/mis-incidencias": "renderMisIncidencias",
```

En la tabla de títulos, junto a `'/ajustes': 'Ajustes',`:

```js
    '/soporte': 'Soporte',
    '/mis-incidencias': 'Mis incidencias',
```

Y los dos manejadores, después de `renderAjustes`:

```js
  async renderSoporte(params) {
    if (window.SoporteView) { await SoporteView.render(params); }
    else document.getElementById("app-content").innerHTML = '<div class="loader">Cargando soporte...</div>';
  },

  async renderMisIncidencias(params) {
    if (window.MisIncidenciasView) { await MisIncidenciasView.render(params); }
    else document.getElementById("app-content").innerHTML = '<div class="loader">Cargando incidencias...</div>';
  },
```

- [ ] **Paso 7: arrancar los avisos de soporte en `frontend/js/app.js`**

Dentro de `init()`, junto a las demás inicializaciones de servicios:

```js
      // Avisa de las respuestas del soporte. No bloquea el arranque: si no hay
      // red o no hay licencia, se calla y lo reintenta al volver al primer plano.
      if (window.AvisosSoporteService) {
        try { window.AvisosSoporteService.init(); }
        catch (e) { console.warn('[App] Error init avisos de soporte:', e); }
      }
```

- [ ] **Paso 8: probarlo en el navegador**

```bash
cd /c/Users/yo/repo/livestock-desktop && npm run serve
```

Abrir `http://localhost:8089`, ir a Ajustes → «Soporte técnico». Esperado: la pantalla de licencia de `SoporteView`, **no** un `loader` colgado ni la maqueta antigua. Comprobar también «Mis incidencias». En la consola no debe haber `is not a function` ni `undefined`.

- [ ] **Paso 9: commit**

```bash
cd /c/Users/yo/repo/livestock-desktop && git add -A && git commit -F- <<'MSG'
feat(soporte): modulo de soporte visible y navegable en escritorio

Sincroniza el frontend desde el maestro, que trae support-api, avisos,
SoporteView y MisIncidenciasView, y sustituye la maqueta local de
_verMisIncidencias por los enlaces reales de Ajustes.

Registra /soporte y /mis-incidencias en el router preservado del escritorio y
arranca AvisosSoporteService. Todavia sin compra en Windows.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Tarea 3: `Plataforma` admite `windows` y el Worker sabe leer la API de colecciones

Módulo puro de interpretación: dado el JSON que devuelve Microsoft, decidir si hay licencia y de quién es. Se prueba sin red, contra respuestas grabadas.

**Ficheros:**
- Modificar: `livestock-manager-support-api/src/types.ts`
- Crear: `livestock-manager-support-api/src/services/msStoreBilling.ts`
- Probar: `livestock-manager-support-api/test/msStoreBilling.test.ts`

**Interfaces:**
- Consume: `ResultadoLicencia` de `src/services/playBilling.ts` — `{ activa: boolean; expira: string | null; motivo?: string; es_suscripcion: boolean; token_anterior: string | null; renovacion_automatica: boolean | null }`.
- Produce:
  - `export const PRODUCTO_SOPORTE_MS = 'support_unlock'`
  - `export interface ElementoColeccion { inAppOfferToken?: string; productId?: string; orderId?: string; transactionId?: string; status?: string; startDate?: string; endDate?: string; acquiredDate?: string; purchaser?: { identityType?: string; identityValue?: string } }`
  - `export interface LicenciaWindows extends ResultadoLicencia { order_id: string | null; instalacion_declarada: string | null }`
  - `export function interpretarColeccion(items: ElementoColeccion[], ahoraMs?: number): LicenciaWindows`
  - `export function tokenDeAcceso(tenantId: string, clientId: string, clientSecret: string): Promise<string>`
  - `export function verificarLicenciaWindows(tenantId: string, clientId: string, clientSecret: string, storeIdKey: string): Promise<LicenciaWindows>`

- [ ] **Paso 1: escribir la prueba que falla**

Crear `test/msStoreBilling.test.ts`:

```ts
/**
 * Interpretacion de la respuesta de la API de colecciones de Microsoft.
 * Sin red: se prueba contra respuestas grabadas.
 *
 *   node --test test/
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { interpretarColeccion } from '../src/services/msStoreBilling.ts';

const AHORA = Date.parse('2026-09-03T12:00:00.000Z');
const INSTALACION = '35e52bca-aa09-4d81-9a33-44b358bab7c3';

function elemento(extra: Record<string, unknown> = {}) {
  return {
    inAppOfferToken: 'support_unlock',
    productId: '9NBLGGH4XXXX',
    orderId: 'a1b2c3d4-0000-1111-2222-333344445555',
    transactionId: 'f0f0f0f0-9999-8888-7777-666655554444',
    status: 'Active',
    startDate: '2026-09-01T00:00:00.000Z',
    endDate: '2027-09-01T00:00:00.000Z',
    acquiredDate: '2026-09-01T00:00:00.000Z',
    purchaser: { identityType: 'b2b', identityValue: INSTALACION },
    ...extra,
  };
}

test('suscripcion activa y vigente: concede licencia', () => {
  const r = interpretarColeccion([elemento()], AHORA);
  assert.equal(r.activa, true);
  assert.equal(r.expira, '2027-09-01T00:00:00.000Z');
  assert.equal(r.order_id, 'a1b2c3d4-0000-1111-2222-333344445555');
  assert.equal(r.instalacion_declarada, INSTALACION);
  assert.equal(r.es_suscripcion, true);
});

test('microsoft no encadena compras: token_anterior siempre null', () => {
  const r = interpretarColeccion([elemento()], AHORA);
  assert.equal(r.token_anterior, null);
});

test('coleccion vacia: no hay compra', () => {
  const r = interpretarColeccion([], AHORA);
  assert.equal(r.activa, false);
  assert.equal(r.order_id, null);
});

test('otro complemento del mismo comprador: se ignora', () => {
  const r = interpretarColeccion([elemento({ inAppOfferToken: 'premium_unlock' })], AHORA);
  assert.equal(r.activa, false);
});

test('caducada: no concede, pero conserva el orderId para reencontrar al usuario', () => {
  const r = interpretarColeccion([elemento({ endDate: '2026-08-01T00:00:00.000Z' })], AHORA);
  assert.equal(r.activa, false);
  assert.equal(r.order_id, 'a1b2c3d4-0000-1111-2222-333344445555');
});

test('revocada: deniega aunque la fecha sea futura', () => {
  const r = interpretarColeccion([elemento({ status: 'Revoked' })], AHORA);
  assert.equal(r.activa, false);
  assert.match(r.motivo ?? '', /revocada|reembols/i);
});

test('baneada: deniega', () => {
  const r = interpretarColeccion([elemento({ status: 'Banned' })], AHORA);
  assert.equal(r.activa, false);
});

test('estado desconocido: deniega, no se presume', () => {
  const r = interpretarColeccion([elemento({ status: 'Fiesta' })], AHORA);
  assert.equal(r.activa, false);
});

test('sin endDate: se toma como no vigente, no como perpetua', () => {
  const r = interpretarColeccion([elemento({ endDate: undefined })], AHORA);
  assert.equal(r.activa, false);
});

test('dos compras del mismo complemento: gana la que caduca mas tarde', () => {
  const r = interpretarColeccion(
    [
      elemento({ endDate: '2026-10-01T00:00:00.000Z', orderId: 'vieja' }),
      elemento({ endDate: '2027-09-01T00:00:00.000Z', orderId: 'nueva' }),
    ],
    AHORA,
  );
  assert.equal(r.activa, true);
  assert.equal(r.order_id, 'nueva');
});
```

- [ ] **Paso 2: ejecutar y ver que falla**

```bash
cd /c/Users/yo/repo/livestock-manager-support-api && npm test
```

Esperado: FALLA con «Cannot find module '../src/services/msStoreBilling.ts'».

- [ ] **Paso 3: `Plataforma` admite `windows`**

En `src/types.ts`, sustituir:

```ts
export type Plataforma = 'android' | 'web';
```

por:

```ts
/** Plataforma de origen: determina como se verifica la licencia. */
export type Plataforma = 'android' | 'web' | 'windows';
```

Ampliar el comentario de `Usuario.purchase_token`:

```ts
  /**
   * Token de compra de Play (android) o, en windows, el orderId de la compra en
   * Microsoft Store. En windows NO es un secreto reutilizable: la prueba de
   * compra es la Store ID key, que caduca a los 30 dias y se pide de nuevo.
   */
  purchase_token?: string;
```

Y en `Env`, junto a los demás secretos:

```ts
  /** Registro de aplicacion en Entra ID, para la API de colecciones de Microsoft. */
  MS_ENTRA_TENANT_ID?: string;
  MS_ENTRA_CLIENT_ID?: string;
  MS_ENTRA_CLIENT_SECRET?: string;
```

- [ ] **Paso 4: implementar `msStoreBilling.ts`**

Crear `src/services/msStoreBilling.ts`:

```ts
/**
 * Verificacion de la licencia de soporte contra Microsoft Store.
 *
 * Nunca se confia en lo que diga el cliente. Ojo: en Microsoft Store el
 * purchaseToken que devuelve la Digital Goods API es el id del complemento
 * ('support_unlock'), identico para todo el mundo, asi que no prueba nada. La
 * prueba real es la Store ID key, que el cliente acuna con WinRT y que aqui se
 * cambia por la coleccion de compras del comprador.
 */

import type { ResultadoLicencia } from './playBilling';

/** InAppOfferToken del complemento en Partner Center. Debe coincidir. */
export const PRODUCTO_SOPORTE_MS = 'support_unlock';

const URL_COLECCIONES = 'https://collections.mp.microsoft.com/v6.0/collections/query';
const AUDIENCIA = 'https://onestore.microsoft.com/.default';

/** Un elemento de la coleccion (CollectionItemContractV6), recortado a lo usado. */
export interface ElementoColeccion {
  inAppOfferToken?: string;
  productId?: string;
  orderId?: string;
  transactionId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  acquiredDate?: string;
  purchaser?: { identityType?: string; identityValue?: string };
}

export interface LicenciaWindows extends ResultadoLicencia {
  /** Ancla de identidad en Windows. null si no hay compra que anclar. */
  order_id: string | null;
  /**
   * `publisherUserId` que el cliente declaro al acunar la Store ID key, tal y
   * como lo devuelve Microsoft. Lo usamos como id de instalacion: permite
   * comprobar que la clave corresponde a la instalacion que dice ser.
   */
  instalacion_declarada: string | null;
}

function vacia(motivo: string): LicenciaWindows {
  return {
    activa: false,
    expira: null,
    motivo,
    es_suscripcion: true,
    renovacion_automatica: null,
    // Microsoft no expone nada equivalente a linkedPurchaseToken.
    token_anterior: null,
    order_id: null,
    instalacion_declarada: null,
  };
}

/**
 * Decide si hay licencia a partir de la coleccion. Puro: sin red ni reloj
 * implicito, para poder probarlo contra respuestas grabadas.
 */
export function interpretarColeccion(
  items: ElementoColeccion[],
  ahoraMs: number = Date.now(),
): LicenciaWindows {
  const nuestros = (items ?? []).filter((i) => i && i.inAppOfferToken === PRODUCTO_SOPORTE_MS);
  if (nuestros.length === 0) {
    return vacia('No hay ninguna compra del soporte');
  }

  // La que caduca mas tarde es la que manda: al renovar conviven brevemente la
  // vieja y la nueva, y quedarse con la primera daria por caducado a alguien
  // que acaba de pagar.
  const ordenados = [...nuestros].sort(
    (a, b) => (Date.parse(b.endDate ?? '') || 0) - (Date.parse(a.endDate ?? '') || 0),
  );
  const item = ordenados[0];

  const finMs = item.endDate ? Date.parse(item.endDate) : NaN;
  const base: LicenciaWindows = {
    activa: false,
    expira: Number.isFinite(finMs) ? new Date(finMs).toISOString() : null,
    es_suscripcion: true,
    renovacion_automatica: null,
    token_anterior: null,
    order_id: item.orderId ?? null,
    instalacion_declarada: item.purchaser?.identityValue ?? null,
  };

  if (item.status === 'Revoked' || item.status === 'Banned') {
    // Equivale a un reembolso en Google: hubo compra, pero ya no vale.
    return { ...base, motivo: 'La compra fue revocada o reembolsada' };
  }
  if (item.status !== 'Active') {
    // Incluye 'Expired' y cualquier estado que Microsoft anada despues. No se
    // presume nada: sin verificacion positiva no hay licencia.
    return { ...base, motivo: 'La suscripcion no esta activa' };
  }
  if (!Number.isFinite(finMs)) {
    return { ...base, motivo: 'La suscripcion no tiene fecha de caducidad' };
  }
  if (finMs <= ahoraMs) {
    return { ...base, motivo: 'La suscripcion ha caducado' };
  }

  return { ...base, activa: true };
}

interface RespuestaColecciones {
  items?: ElementoColeccion[];
}

/** Access token de Entra ID para la API de colecciones (client credentials). */
export async function tokenDeAcceso(
  tenantId: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      'Faltan MS_ENTRA_TENANT_ID, MS_ENTRA_CLIENT_ID o MS_ENTRA_CLIENT_SECRET: '
        + 'cargalos con wrangler secret put --env production',
    );
  }
  const respuesta = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: AUDIENCIA,
      }),
    },
  );
  if (!respuesta.ok) {
    const texto = (await respuesta.text().catch(() => '')).slice(0, 300);
    throw new Error(`Entra ID rechazo la autenticacion (${respuesta.status}): ${texto}`);
  }
  const datos = (await respuesta.json()) as { access_token?: string };
  if (!datos.access_token) throw new Error('Entra ID no devolvio access_token');
  return datos.access_token;
}

/**
 * Consulta la coleccion del comprador identificado por la Store ID key.
 * Lanza si Microsoft no responde: quien llama debe tratarlo como «no se sabe»,
 * nunca como «no tiene licencia».
 */
export async function verificarLicenciaWindows(
  tenantId: string,
  clientId: string,
  clientSecret: string,
  storeIdKey: string,
): Promise<LicenciaWindows> {
  const token = await tokenDeAcceso(tenantId, clientId, clientSecret);
  const respuesta = await fetch(URL_COLECCIONES, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      maxPageSize: 100,
      beneficiaries: [
        { identitytype: 'b2b', identityValue: storeIdKey, localTicketReference: '' },
      ],
    }),
  });
  if (!respuesta.ok) {
    const texto = (await respuesta.text().catch(() => '')).slice(0, 300);
    throw new Error(`La API de colecciones respondio ${respuesta.status}: ${texto}`);
  }
  const datos = (await respuesta.json()) as RespuestaColecciones;
  return interpretarColeccion(datos.items ?? []);
}
```

- [ ] **Paso 5: ejecutar las pruebas**

```bash
cd /c/Users/yo/repo/livestock-manager-support-api && npm test
```

Esperado: pasan las 10 nuevas y siguen pasando las 8 de `identidad.test.ts`.

- [ ] **Paso 6: comprobar tipos**

```bash
cd /c/Users/yo/repo/livestock-manager-support-api && npm run typecheck
```

Esperado: sin errores. Si el valor nuevo de `Plataforma` rompe algún `switch` exhaustivo, arréglalo aquí.

- [ ] **Paso 7: commit**

```bash
cd /c/Users/yo/repo/livestock-manager-support-api && git add src/types.ts src/services/msStoreBilling.ts test/msStoreBilling.test.ts && git commit -F- <<'MSG'
feat(windows): interpretacion de la API de colecciones de Microsoft

El purchaseToken de Microsoft Store es el id del complemento, igual para
todos: no prueba nada. La prueba es la Store ID key, que aqui se cambia por la
coleccion de compras del comprador.

Modulo puro y probado sin red: Revoked y Banned deniegan como un reembolso, un
estado desconocido tambien, y de dos compras vivas gana la que caduca mas tarde.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Tarea 4: Ruta `/auth/ms/ticket`

El cliente necesita un ticket de servicio de Entra ID para poder acuñar la Store ID key. El secreto de cliente no puede salir del servidor, así que el ticket lo emite el Worker.

**Ficheros:**
- Modificar: `livestock-manager-support-api/src/routes/auth.ts`

**Interfaces:**
- Consume: `tokenDeAcceso(tenantId, clientId, clientSecret)` de la Tarea 3.
- Produce: `POST /auth/ms/ticket` → `200 { "ticket": "<jwt>" }` · `501 { error, codigo: 'MS_STORE_NO_CONFIGURADO' }` · `502 { error }`.

- [ ] **Paso 1: escribir la ruta**

En `src/routes/auth.ts`, añadir a los imports:

```ts
import { tokenDeAcceso as tokenEntraID, verificarLicenciaWindows } from '../services/msStoreBilling';
import { detalleError } from '../utils/errores';
```

`console.error('mensaje', e)` se traga `e.message` en Workers y deja el log inútil; por eso `detalleError`.

Y la ruta, antes de `rutas.get('/me', ...)`:

```ts
/**
 * Ticket de servicio para acunar la Store ID key.
 *
 * El cliente no puede pedirselo el mismo a Entra ID porque haria falta el
 * secreto de cliente, que no sale de aqui. La ruta es abierta pero no concede
 * nada: con el ticket solo se puede acunar una clave para la identidad de
 * Windows de quien llama, y esa clave hay que traerla luego a
 * /auth/verify-purchase para que sirva de algo.
 */
rutas.post('/ms/ticket', async (c) => {
  if (!c.env.MS_ENTRA_TENANT_ID || !c.env.MS_ENTRA_CLIENT_ID || !c.env.MS_ENTRA_CLIENT_SECRET) {
    return c.json(
      {
        error: 'La compra en Microsoft Store todavia no esta disponible',
        codigo: 'MS_STORE_NO_CONFIGURADO',
      },
      501,
    );
  }
  try {
    const ticket = await tokenEntraID(
      c.env.MS_ENTRA_TENANT_ID,
      c.env.MS_ENTRA_CLIENT_ID,
      c.env.MS_ENTRA_CLIENT_SECRET,
    );
    return c.json({ ticket });
  } catch (e) {
    console.error('[auth] fallo el ticket de Entra ID:', detalleError(e));
    return c.json({ error: 'No se pudo contactar con Microsoft ahora mismo' }, 502);
  }
});
```

- [ ] **Paso 2: permitir el origen de Tauri en CORS**

`src/index.ts` restringe `/auth/*` a una lista de orígenes que no incluye el de Tauri. Sin esto, la app empaquetada recibe un error de CORS en la primera petición. Añadir a `ORIGENES`:

```ts
  // La app de escritorio (Tauri 2) sirve el frontend desde su propio origen.
  'tauri://localhost',
  'http://tauri.localhost',
  'https://tauri.localhost',
```

- [ ] **Paso 3: comprobar tipos y lint**

```bash
cd /c/Users/yo/repo/livestock-manager-support-api && npm run typecheck && npm run lint
```

- [ ] **Paso 4: probar la ruta sin credenciales configuradas**

```bash
cd /c/Users/yo/repo/livestock-manager-support-api && npx wrangler dev --port 8787
```

En otra terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:8787/auth/ms/ticket
```

Esperado: `501`. Es el comportamiento correcto mientras el registro de Entra ID no exista: no se inventa nada.

- [ ] **Paso 5: commit**

```bash
cd /c/Users/yo/repo/livestock-manager-support-api && git add src/routes/auth.ts src/index.ts && git commit -F- <<'MSG'
feat(windows): ruta /auth/ms/ticket y origen de Tauri en CORS

Emite el ticket de servicio de Entra ID que el cliente necesita para acunar la
Store ID key con WinRT; el secreto de cliente no sale del servidor.

Devuelve 501 mientras el registro de Entra ID no este configurado: sin el no se
puede verificar nada, y sin verificacion no se concede licencia.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Tarea 5: Rama `windows` en `/auth/verify-purchase`

Donde todo se junta. `services/identidad.ts` no se modifica: recibe otro `comprobarLicencia` y otro `userIdDelToken`, y su tabla de decisiones vale igual.

**Ficheros:**
- Modificar: `livestock-manager-support-api/src/routes/auth.ts`
- Modificar: `livestock-manager-support-api/test/identidad.test.ts`

**Interfaces:**
- Consume: `verificarLicenciaWindows(...)` de la Tarea 3; `resolverIdentidad(...)` de `src/services/identidad.ts`, sin cambios.
- Produce: `POST /auth/verify-purchase` con `{ purchase_token: <storeIdKey>, plataforma: 'windows', instalacion, email, actualizar_email }` → la misma respuesta `{ token, expira, licencia }` que Android.

- [ ] **Paso 1: escribir las pruebas de identidad en Windows**

Añadir al final de `test/identidad.test.ts`:

```ts
// --- Windows: mismo motor de decision, otra ancla -----------------------------

test('windows: recompra tras caducar adopta el historial', async () => {
  const r = await resolverIdentidad({
    lectura: lectura({ viejo: usuario('viejo', 'ms:pedido-viejo') }, { [INSTALACION]: 'viejo' }),
    userIdDelToken: 'nuevo',
    purchaseToken: 'ms:pedido-nuevo',
    instalacion: INSTALACION,
    // Microsoft no encadena compras: aqui nunca hay tokenEncadenado.
    comprobarLicencia: async () => ({ activa: false }),
  });
  assert.equal(r.userId, 'viejo');
  assert.equal(r.motivo, 'licencia-anterior-caducada');
});

test('windows: la compra anterior sigue viva: historial vacio, enlace intacto', async () => {
  const r = await resolverIdentidad({
    lectura: lectura({ viejo: usuario('viejo', 'ms:pedido-viejo') }, { [INSTALACION]: 'viejo' }),
    userIdDelToken: 'nuevo',
    purchaseToken: 'ms:pedido-nuevo',
    instalacion: INSTALACION,
    comprobarLicencia: async () => ({ activa: true }),
  });
  assert.equal(r.userId, 'nuevo');
  assert.equal(r.vincularInstalacion, false);
  assert.equal(r.motivo, 'dos-licencias-vivas');
});

test('windows: si la API de colecciones no responde, el enlace se queda', async () => {
  const r = await resolverIdentidad({
    lectura: lectura({ viejo: usuario('viejo', 'ms:pedido-viejo') }, { [INSTALACION]: 'viejo' }),
    userIdDelToken: 'nuevo',
    purchaseToken: 'ms:pedido-nuevo',
    instalacion: INSTALACION,
    comprobarLicencia: async () => {
      throw new Error('503');
    },
  });
  assert.equal(r.vincularInstalacion, false);
  assert.equal(r.motivo, 'comprobacion-fallida');
});
```

- [ ] **Paso 2: ejecutar**

```bash
cd /c/Users/yo/repo/livestock-manager-support-api && npm test
```

Esperado: **pasan sin tocar `identidad.ts`**. Eso es lo que se quiere demostrar: el motor de decisión ya es agnóstico de la tienda. Si alguna falla, el diseño tiene un agujero: investígalo antes de seguir, no cambies la prueba.

- [ ] **Paso 3: añadir el hash de Windows en `auth.ts`**

Refactorizar `hashUserId` para compartir el digest y añadir la variante de Windows:

```ts
async function hashDe(texto: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', codificador.encode(texto));
  return Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * user_id derivado del purchase_token. Se hashea para no usar el token de
 * compra como identificador en claro por todo el almacenamiento.
 */
async function hashUserId(purchaseToken: string): Promise<string> {
  return hashDe(`usuario:${purchaseToken}`);
}

/**
 * user_id de Windows. Se ancla al orderId de la compra en Microsoft Store, que
 * es lo unico estable y por comprador que devuelve la API de colecciones: el
 * purchaseToken de la Digital Goods API es el id del complemento e igual para
 * todo el mundo. El prefijo 'ms:' evita cualquier colision con Android.
 */
async function hashUserIdWindows(orderId: string): Promise<string> {
  return hashDe(`usuario:ms:${orderId}`);
}
```

- [ ] **Paso 4: aceptar `windows` como plataforma en el cuerpo**

Sustituir en `/verify-purchase`:

```ts
  const plataforma: Plataforma = cuerpo?.plataforma === 'web' ? 'web' : 'android';
```

por:

```ts
  const plataforma: Plataforma =
    cuerpo?.plataforma === 'web' ? 'web'
    : cuerpo?.plataforma === 'windows' ? 'windows'
    : 'android';
```

- [ ] **Paso 5: escribir la rama `windows`**

Insertar **después** del bloque `if (plataforma === 'web')` y **antes** de la verificación con Google:

```ts
  if (plataforma === 'windows') {
    // En windows `purchase_token` transporta la Store ID key, no un token de
    // compra: es lo unico que prueba algo, y caduca a los 30 dias.
    const claveStore = purchaseToken;
    if (!c.env.MS_ENTRA_TENANT_ID || !c.env.MS_ENTRA_CLIENT_ID || !c.env.MS_ENTRA_CLIENT_SECRET) {
      return c.json(
        {
          error: 'La compra en Microsoft Store todavia no esta disponible',
          codigo: 'MS_STORE_NO_CONFIGURADO',
        },
        501,
      );
    }

    let licencia;
    try {
      licencia = await verificarLicenciaWindows(
        c.env.MS_ENTRA_TENANT_ID,
        c.env.MS_ENTRA_CLIENT_ID,
        c.env.MS_ENTRA_CLIENT_SECRET,
        claveStore,
      );
    } catch (e) {
      console.error('[auth] fallo la verificacion con Microsoft Store:', detalleError(e));
      return c.json({ error: 'No se pudo verificar la compra ahora mismo' }, 502);
    }

    if (!licencia.activa || !licencia.order_id) {
      return c.json(
        { error: licencia.motivo ?? 'La compra no es valida', codigo: 'COMPRA_NO_VALIDA' },
        403,
      );
    }

    // La instalacion que declaro el cliente al acunar la clave vuelve firmada
    // por Microsoft. Si no coincide con la que dice ahora, manda la que
    // Microsoft confirma.
    const instalacionWin = licencia.instalacion_declarada ?? instalacion;

    const almacen = new Almacen(c.env.TICKETS_KV);
    const userIdDelToken = await hashUserIdWindows(licencia.order_id);
    const { userId, existente, vincularInstalacion, motivo } = await resolverIdentidad({
      lectura: almacen,
      userIdDelToken,
      purchaseToken: licencia.order_id,
      instalacion: instalacionWin,
      // Microsoft no expone equivalente a linkedPurchaseToken: la recompra
      // encadenada nunca se dispara aqui y cae en licencia-anterior-caducada,
      // que es el comportamiento correcto.
      tokenEncadenado: null,
      // No se puede reconsultar una compra ajena: la coleccion se consulta por
      // comprador, no por pedido. La compra anterior de ESTA instalacion estaba
      // en la coleccion que se acaba de leer, asi que si no ha salido como
      // activa es que no lo esta.
      comprobarLicencia: async () => ({ activa: false }),
    });
    if (motivo !== 'usuario-conocido' && motivo !== 'instalacion-nueva') {
      console.log(`[auth] identidad resuelta (windows): ${motivo}`);
    }

    const usuarioWin: Usuario = {
      user_id: userId,
      email: cuerpo?.actualizar_email ? email : email || existente?.email || '',
      plataforma: 'windows',
      purchase_token: licencia.order_id,
      instalacion_id: instalacionWin || existente?.instalacion_id || null,
      licencia_soporte_activa: true,
      licencia_expira: licencia.expira,
    };
    await almacen.guardarUsuario(usuarioWin);
    if (instalacionWin && vincularInstalacion) {
      await almacen.vincularInstalacion(instalacionWin, userId);
    }

    const sesionWin = await emitirSesion(c.env.JWT_SECRET, usuarioWin);
    return c.json({ ...sesionWin, licencia: { activa: true, expira: licencia.expira } });
  }
```

- [ ] **Paso 6: pruebas, tipos y lint**

```bash
cd /c/Users/yo/repo/livestock-manager-support-api && npm test && npm run typecheck && npm run lint
```

- [ ] **Paso 7: comprobar que la regla inviolable sigue intacta**

```bash
cd /c/Users/yo/repo/livestock-manager-support-api && git diff --stat src/services/identidad.ts
```

Esperado: **sin salida**. Si `identidad.ts` aparece modificado, revierte y replantea: la tarea está mal resuelta.

- [ ] **Paso 8: commit**

```bash
cd /c/Users/yo/repo/livestock-manager-support-api && git add src/routes/auth.ts test/identidad.test.ts && git commit -F- <<'MSG'
feat(windows): rama windows en /auth/verify-purchase

La identidad se ancla al orderId de Microsoft Store, no al purchaseToken de la
Digital Goods API, que es el id del complemento e igual para todos. El id de
instalacion sigue siendo el puente, y lo confirma Microsoft devolviendo el
publisherUserId que se declaro al acunar la clave.

services/identidad.ts no se toca: las tres pruebas nuevas pasan tal cual.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Tarea 6: Comando de Rust `obtener_store_id_key`

Toda la superficie nativa del proyecto, en un fichero. Sin esto el WebView2 no puede llegar a WinRT.

**Ficheros:**
- Crear: `livestock-desktop/src-tauri/src/store_winrt.rs`
- Modificar: `livestock-desktop/src-tauri/src/main.rs`
- Modificar: `livestock-desktop/src-tauri/Cargo.toml`

**Interfaces:**
- Consume: el ticket que devuelve `POST /auth/ms/ticket`.
- Produce: comando Tauri `obtener_store_id_key(ticket: String, publisher_user_id: String) -> Result<String, String>`, invocable desde el frontend como `window.__TAURI__.core.invoke('obtener_store_id_key', { ticket, publisherUserId })`.

- [ ] **Paso 1: añadir la dependencia**

En `src-tauri/Cargo.toml`:

```toml
[target.'cfg(windows)'.dependencies]
windows = { version = "0.58", features = [
  "Services_Store",
  "Foundation",
  "Win32_Foundation",
  "Win32_System_WinRT",
] }
```

- [ ] **Paso 2: escribir `src-tauri/src/store_winrt.rs`**

```rust
//! Puente hacia WinRT para la Microsoft Store.
//!
//! Unica superficie nativa del proyecto. El pago lo hace la Digital Goods API
//! dentro del WebView2 y la verificacion la hace el Worker; aqui solo se acuna
//! la Store ID key, que es lo unico que el WebView2 no puede conseguir solo.
//!
//! Requiere identidad de paquete: sin MSIX, StoreContext no funciona.

#[cfg(windows)]
pub mod imp {
    use windows::core::{Interface, HSTRING};
    use windows::Services::Store::StoreContext;
    use windows::Win32::Foundation::HWND;
    use windows::Win32::System::WinRT::IInitializeWithWindow;

    /// Acuna una Store ID key valida 30 dias para el usuario que ha iniciado
    /// sesion en la Store en esta maquina.
    pub fn obtener_clave(
        hwnd: isize,
        ticket: &str,
        publisher_user_id: &str,
    ) -> Result<String, String> {
        let contexto = StoreContext::GetDefault()
            .map_err(|e| format!("No se pudo abrir la Microsoft Store: {e}"))?;

        // Sin esto WinRT lanza en aplicaciones de escritorio: necesita saber
        // sobre que ventana mostrar sus dialogos.
        let init: IInitializeWithWindow = contexto
            .cast()
            .map_err(|e| format!("La Store no acepta la ventana: {e}"))?;
        unsafe {
            init.Initialize(HWND(hwnd as *mut _))
                .map_err(|e| format!("No se pudo asociar la ventana a la Store: {e}"))?;
        }

        let operacion = contexto
            .GetCustomerCollectionsIdAsync(
                &HSTRING::from(ticket),
                &HSTRING::from(publisher_user_id),
            )
            .map_err(|e| format!("No se pudo pedir la clave a la Store: {e}"))?;
        let clave = operacion
            .get()
            .map_err(|e| format!("La Store no devolvio la clave: {e}"))?
            .to_string();

        if clave.is_empty() {
            // Pasa cuando no hay sesion iniciada en la Store o la app no tiene
            // identidad de paquete. Sin clave no hay verificacion posible.
            return Err(
                "La Microsoft Store no devolvio ninguna clave. Inicia sesion en la Store \
                 con la cuenta que compro el soporte."
                    .to_string(),
            );
        }
        Ok(clave)
    }
}

#[cfg(not(windows))]
pub mod imp {
    pub fn obtener_clave(
        _hwnd: isize,
        _ticket: &str,
        _publisher_user_id: &str,
    ) -> Result<String, String> {
        Err("La compra en Microsoft Store solo esta disponible en Windows.".to_string())
    }
}
```

- [ ] **Paso 3: registrar el comando en `src-tauri/src/main.rs`**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod store_winrt;

/// Acuna la Store ID key que el backend necesita para verificar la compra.
/// Se ejecuta en un hilo aparte: `get()` bloquea, y bloquear el hilo principal
/// congela la ventana.
#[tauri::command]
async fn obtener_store_id_key(
    ventana: tauri::Window,
    ticket: String,
    publisher_user_id: String,
) -> Result<String, String> {
    let hwnd = ventana
        .hwnd()
        .map_err(|e| format!("No se pudo obtener la ventana: {e}"))?
        .0 as isize;
    tauri::async_runtime::spawn_blocking(move || {
        store_winrt::imp::obtener_clave(hwnd, &ticket, &publisher_user_id)
    })
    .await
    .map_err(|e| format!("Fallo interno al pedir la clave: {e}"))?
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![obtener_store_id_key])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Paso 4: compilar**

```bash
cd /c/Users/yo/repo/livestock-desktop/src-tauri && cargo check
```

Esperado: compila. Los errores típicos son features de `windows` que faltan (el mensaje dice cuál) o la firma de `HWND`, que cambió entre versiones de `windows-rs`: ajusta a la versión que resuelva Cargo, no la fuerces.

- [ ] **Paso 5: comprobar el fallo esperado sin MSIX**

```bash
cd /c/Users/yo/repo/livestock-desktop && npm run dev
```

En la consola del WebView:

```js
await window.__TAURI__.core.invoke('obtener_store_id_key', { ticket: 'x', publisherUserId: 'y' })
```

Esperado: **un error legible**, no un cuelgue ni un panic. Ejecutando sin identidad de paquete no puede funcionar; lo que se valida aquí es que falla bien.

- [ ] **Paso 6: commit**

```bash
cd /c/Users/yo/repo/livestock-desktop && git add src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/src/main.rs src-tauri/src/store_winrt.rs && git commit -F- <<'MSG'
feat(windows): comando obtener_store_id_key

Unica superficie nativa del proyecto: acuna la Store ID key con WinRT, que es
lo unico que el WebView2 no puede conseguir solo. El pago sigue en la Digital
Goods API y la verificacion en el Worker.

Necesita identidad de paquete MSIX; sin ella devuelve un error legible en vez
de colgarse.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Tarea 7: Puente en el frontend de escritorio

Une las tres piezas: comprar en la Store, acuñar la clave y canjearla en el Worker.

**Ficheros:**
- Crear: `livestock-desktop/frontend/js/services/soporte-store.js`
- Modificar: `livestock-desktop/frontend/js/purchase-manager.js`
- Modificar: `livestock-desktop/frontend/index.html`
- Modificar: `livestock-desktop/scripts/sync-from-master.ps1`

**Interfaces:**
- Consume: `window.SupportAPI.iniciarSesion(prueba, plataforma, email, actualizarEmail)` y `window.SupportAPI._idDeInstalacion()`; el comando `obtener_store_id_key`; `POST /auth/ms/ticket`.
- Produce: `window.SoporteStore` con `disponible()`, `comprar()` y `revalidar()`; y `window.PurchaseManager.revalidarSoporte()`, que `support-api.js` llama sola cuando una petición devuelve `LICENCIA_CADUCADA`.

**Nota de diseño:** `support-api.js` no necesita ni una línea nueva. `iniciarSesion` manda en `purchase_token` lo que se le pase, y en Windows eso es la Store ID key, que es exactamente lo que la rama `windows` del Worker espera. La complejidad se queda en un fichero del escritorio en vez de repartirse por el código compartido con Android.

- [ ] **Paso 1: preservar el fichero nuevo del sync**

En `scripts/sync-from-master.ps1`, dentro de `$preservedList`, junto a `'js\purchase-manager.js'`:

```powershell
    'js\services\soporte-store.js', # Compra del soporte en Microsoft Store (solo escritorio)
```

Sin esto, `Prune-Tree` borra el fichero en el siguiente `npm run sync` por no existir en el maestro.

- [ ] **Paso 2: escribir `frontend/js/services/soporte-store.js`**

```js
/**
 * soporte-store.js — compra del complemento de soporte en Microsoft Store.
 *
 * Solo escritorio. Vive aparte de purchase-manager.js porque son dos productos
 * distintos: purchase-manager vende 'premium_unlock' (desbloqueo de la app) y
 * esto vende 'support_unlock' (soporte con incidencias).
 *
 * Tres saltos para verificar:
 *   1. El Worker emite un ticket de Entra ID  (POST /auth/ms/ticket)
 *   2. Tauri lo cambia por una Store ID key   (comando obtener_store_id_key)
 *   3. El Worker canjea la clave por sesion   (POST /auth/verify-purchase)
 *
 * Ojo: el purchaseToken que devuelve la Digital Goods API es el id del
 * complemento, igual para todo el mundo. No prueba nada y no se usa como tal.
 */
(function () {
  'use strict';

  var PRODUCTO = 'support_unlock';
  var BILLING = 'https://store.microsoft.com/billing';
  var BASE = window.SUPPORT_API_BASE
    || 'https://livestock-manager-support-api-production.livestock-desktop.workers.dev';

  var SoporteStore = {
    _dgs: null,

    /** Hay Store y hay puente nativo: solo cierto en la app instalada. */
    disponible: function () {
      return !!(window.__TAURI__ && typeof window.getDigitalGoodsService === 'function');
    },

    _servicio: function () {
      var self = this;
      if (self._dgs) return Promise.resolve(self._dgs);
      if (typeof window.getDigitalGoodsService !== 'function') {
        return Promise.reject(new Error(
          'La compra solo está disponible en la app instalada desde la Microsoft Store.'));
      }
      return window.getDigitalGoodsService(BILLING).then(function (dgs) {
        self._dgs = dgs;
        return dgs;
      });
    },

    /** Compra el complemento. Devuelve true si el servidor concedio licencia. */
    async comprar() {
      var dgs = await this._servicio();
      var detalles = await dgs.getDetails([PRODUCTO]);
      if (!detalles || !detalles.length) {
        throw new Error('El soporte no está disponible en la Store ahora mismo.');
      }
      var item = detalles[0];

      var peticion = new PaymentRequest(
        [{ supportedMethods: BILLING, data: { sku: item.itemId } }],
        {
          total: {
            label: item.title || 'Soporte técnico',
            amount: { currency: item.price.currency, value: item.price.value },
          },
        },
      );
      var respuesta = await peticion.show();
      await respuesta.complete('success');

      // El pago no basta: hasta que el servidor no lo confirme no hay licencia.
      return await this.revalidar();
    },

    /**
     * Acuna una clave nueva y la canjea por sesion. Se llama tras comprar, en
     * cada arranque y cuando support-api.js detecta la licencia caducada.
     */
    async revalidar() {
      if (!this.disponible()) return false;

      var instalacion = await window.SupportAPI._idDeInstalacion();
      if (!instalacion) {
        // Sin id de instalacion la compra sigue valiendo, pero el historial no
        // sobrevive a una recompra. Se avisa y se continua.
        console.warn('[SoporteStore] sin id de instalación: el historial no se podrá reencontrar');
      }

      var respuesta = await fetch(BASE + '/auth/ms/ticket', { method: 'POST' });
      if (!respuesta.ok) {
        if (respuesta.status === 501) {
          throw new Error('La compra en Microsoft Store todavía no está activada.');
        }
        throw new Error('No se pudo contactar con el servidor de soporte.');
      }
      var datos = await respuesta.json();

      var clave = await window.__TAURI__.core.invoke('obtener_store_id_key', {
        ticket: datos.ticket,
        publisherUserId: instalacion || '',
      });

      await window.SupportAPI.iniciarSesion(clave, 'windows');
      return window.SupportAPI.licenciaActiva();
    },
  };

  window.SoporteStore = SoporteStore;
})();
```

- [ ] **Paso 3: exponer `revalidarSoporte` en `frontend/js/purchase-manager.js`**

`support-api.js` llama a `window.PurchaseManager.revalidarSoporte()` cuando una petición devuelve `LICENCIA_CADUCADA` o `LICENCIA_INACTIVA`. Hay que darle esa función en las **dos** ramas del fichero, porque con `FREE_MODE === false` el `PurchaseManager` real ni se construye.

En la rama del stub, junto a `restorePurchases`:

```js
      // El soporte se cobra aparte del desbloqueo Premium: sigue haciendo falta
      // aunque la app este desbloqueada.
      revalidarSoporte: function () {
        return window.SoporteStore ? window.SoporteStore.revalidar() : Promise.resolve(false);
      },
```

Y lo mismo dentro del objeto `PurchaseManager` real:

```js
    /** Renueva la licencia de soporte. La llama support-api.js sola. */
    revalidarSoporte: function () {
      return window.SoporteStore ? window.SoporteStore.revalidar() : Promise.resolve(false);
    },
```

- [ ] **Paso 4: cargarlo en `frontend/index.html`**

Después de `support-api.js` y **antes** de `purchase-manager.js`:

```html
    <script src="js/services/soporte-store.js"></script>
```

- [ ] **Paso 5: comprobar que el sync no lo borra**

```bash
cd /c/Users/yo/repo/livestock-desktop && npm run sync && ls -l frontend/js/services/soporte-store.js
```

Esperado: la salida incluye `preservado (desktop): js\services\soporte-store.js` y el fichero sigue ahí. Si desaparece, la ruta del Paso 1 está mal escrita: usa barras invertidas.

- [ ] **Paso 6: comprobar el camino de degradación**

```bash
cd /c/Users/yo/repo/livestock-desktop && npm run serve
```

En `http://localhost:8089`, en la consola:

```js
window.SoporteStore.disponible()
```

Esperado: `false` —no hay Tauri ni Digital Goods en un navegador suelto— y la app funciona con normalidad. Ir a Ajustes → Soporte técnico: la pantalla de licencia se ve, sin errores en consola. Es el comportamiento de la sección 8 del spec: sin Store, el soporte no se ofrece y la app no se entera.

- [ ] **Paso 7: commit**

```bash
cd /c/Users/yo/repo/livestock-desktop && git add frontend/js/services/soporte-store.js frontend/js/purchase-manager.js frontend/index.html scripts/sync-from-master.ps1 && git commit -F- <<'MSG'
feat(soporte): puente de compra con Microsoft Store en el escritorio

soporte-store.js encadena los tres saltos de la verificacion: ticket de Entra
ID del Worker, Store ID key via Tauri y canje por sesion. Vive aparte de
purchase-manager porque son dos productos distintos: support_unlock frente a
premium_unlock.

support-api.js no cambia: iniciarSesion ya manda en purchase_token lo que se le
da, y en windows eso es la Store ID key.

El fichero se anade a preservedList; sin eso el sync lo borraria.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Tarea 8: MSIX, Partner Center y compra real

La única parte que no se puede automatizar. WinRT no es simulable: hay que instalar el paquete firmado y comprar de verdad en el entorno de pruebas.

**Ficheros:**
- Modificar: `livestock-desktop/package.json` (script de empaquetado)
- Modificar: `livestock-desktop/src-tauri/tauri.conf.json` (reconciliar identidad con la ficha de la Store)

**Interfaces:**
- Consume: todas las tareas anteriores.
- Produce: un MSIX firmado, instalable, con el complemento `support_unlock` comprable.

- [ ] **Paso 1: lo que el usuario tiene que crear (no automatizable)**

Pedírselo en este orden, porque cada uno depende del anterior:

1. **Reserva del nombre de la app** en Partner Center, y anotar el **Store ID** asignado.
2. **Complemento `support_unlock`**: tipo suscripción, periodo de facturación y precio. `livestock-pwa-msix/partner_center_addon.json` lo describe como `MONTHLY`; hay que decidir si se replica el periodo anual de Google Play. **Decisión del usuario.**
3. **Registro de aplicación en Entra ID** (Azure AD), asociado en Partner Center → *Configuración de la cuenta* → *Identidad de usuario*, para poder llamar a la API de colecciones. De ahí salen `MS_ENTRA_TENANT_ID`, `MS_ENTRA_CLIENT_ID` y un secreto de cliente.
4. **Certificado de firma** que coincida con el `Publisher` de la ficha.

- [ ] **Paso 2: cargar los secretos en el Worker**

Requiere autorización explícita del usuario: escribe en producción. Uno por uno, escribiendo el valor directamente en el prompt. Nunca con `echo` ni con tubería: un `Get-Content` que falla dentro de una tubería hace que wrangler suba un secreto **vacío** mientras imprime «Success».

```bash
cd /c/Users/yo/repo/livestock-manager-support-api && npx wrangler secret put MS_ENTRA_TENANT_ID --env production
```

Repetir con `MS_ENTRA_CLIENT_ID` y `MS_ENTRA_CLIENT_SECRET`. Comprobar después que ninguno de los tres aparece en `[vars]` de `wrangler.toml`: una var vacía anula el secreto del mismo nombre.

- [ ] **Paso 3: reconciliar la identidad del paquete**

`src-tauri/tauri.conf.json` declara hoy `identifier: "com.livestockmanager.premium"` y `productName: "Livestock Manager PREMIUM"`. El MSIX debe llevar el `Identity/Name` y el `Publisher` que asigna Partner Center, que **no** son estos. Anotar los valores reales de la ficha y usarlos en el manifiesto del paquete.

- [ ] **Paso 4: empaquetar como MSIX**

Tauri no genera MSIX: sus destinos son MSI y NSIS. Se usa el empaquetador de la comunidad:

```bash
cd /c/Users/yo/repo/livestock-desktop && npx @choochmeque/tauri-windows-bundle --help
```

Añadir a `package.json`:

```json
    "build:msix": "npm run build:pago && tauri build && npx @choochmeque/tauri-windows-bundle"
```

Si el empaquetador no da la talla, la alternativa es `MakeAppx.exe pack` sobre la carpeta que produce `tauri build`, con un `AppxManifest.xml` escrito a mano: más trabajo, sin depender de terceros. El código no cambia en ninguno de los dos casos.

- [ ] **Paso 5: instalar y comprobar que hay identidad de paquete**

Instalar el MSIX firmado y, con la app abierta, en la consola del WebView:

```js
typeof window.getDigitalGoodsService
```

Esperado: `"function"`. Si sale `"undefined"`, el paquete no tiene identidad de la Store y no hay nada más que probar: vuelve al Paso 4.

- [ ] **Paso 6: la compra real**

Con la cuenta de pruebas de Partner Center: Ajustes → Soporte técnico → comprar. Comprobar en este orden:

1. Se abre el diálogo de pago de la Store.
2. Tras pagar, `obtener_store_id_key` devuelve una clave, no un error.
3. El Worker responde 200 y la licencia aparece activa en Ajustes.
4. `npx wrangler tail --env production` no muestra ningún motivo raro: `usuario-conocido` e `instalacion-nueva` no se registran, así que lo normal es no ver nada.
5. Se puede abrir una incidencia desde `#/soporte` y aparece en `#/mis-incidencias`.

- [ ] **Paso 7: probar la recompra, que es donde se rompió Android**

Dejar caducar o cancelar la suscripción de pruebas, volver a comprar y comprobar que **las incidencias antiguas siguen ahí**. Es el escenario que causó la incidencia de producción del 2026-09-03. Si el historial se pierde, mira el motivo que registra el Worker antes de tocar nada: `licencia-anterior-caducada` es lo correcto; `dos-licencias-vivas` significa que la anterior aún cuenta como activa; `comprobacion-fallida` que Microsoft no respondió.

- [ ] **Paso 8: commit**

```bash
cd /c/Users/yo/repo/livestock-desktop && git add package.json src-tauri/tauri.conf.json && git commit -F- <<'MSG'
build: empaquetado MSIX para Microsoft Store

Sin identidad de paquete no hay StoreContext ni complementos, asi que la ruta
oficial de Tauri (instalador enlazado desde la ficha) no sirve para cobrar.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
```

---

## Qué queda fuera

- **Unificar cuentas entre Android y Windows** (D5 del spec). Quien pague en las dos tiendas tendrá dos licencias y dos identidades. Restaurar en el escritorio la copia de seguridad del móvil sí unifica el historial, porque el id de instalación viaja dentro. La unificación real es la fase de Google Sign-In.
- **Corregir el README de `livestock-pwa-msix`**, que contradice a su propio `purchase-manager.js` al declarar inexistente la Digital Goods API.
- **Decidir el precio** del complemento y si se replica el periodo anual de Google Play. Es del usuario, y bloquea solo el Paso 1 de la Tarea 8.
