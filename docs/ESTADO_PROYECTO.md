# Estado del Proyecto — Livestock Manager (SIGGAN)
> Fotografía técnica regenerada el **2026-06-28** · Versión de app: **v4.7.0** · Base de datos: **IndexedDB DB v11** · Service Worker: **`corcho-v6.7.19`**
>
> Documento anterior: v4.5.0 / DB v10 / SW corcho-v6.5.63 (2026-06-24) — **obsoleto**.

---

## 1. Versiones registradas

| Artefacto | Valor |
|---|---|
| `package.json` | `4.7.0` |
| `index.html` CSS cache-bust | `?v=5.3.0` |
| **Base de datos IndexedDB** | **DB v11** |
| **Service Worker** `CACHE_NAME` | **`corcho-v6.7.19`** |
| `app.js` (ExPro about) | `v4.5.0` (string interno pendiente de actualizar) |
| Git commits desde v4.5.0 | ~159 commits |

> **Disciplina de caché:** al modificar cualquier JS/CSS/HTML hay que subir `CACHE_NAME` en `sw.js` para forzar recarga en Android/PWA.

---

## 2. Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│                     index.html (SPA Shell)                   │
│  Header · Nav · #app-content · Toast · ~85 <script> cargados │
├─────────────────────────────────────────────────────────────┤
│                    CAPA DE ARRANQUE                           │
│  idb-local.js (wrapper idb)  →  db.js (DB v11 + migraciones) │
│  error-handler.js (validación NIF/CIF/REGA) · crypto.js       │
├─────────────────────────────────────────────────────────────┤
│                    CAPA DE SERVICIOS                          │
│  event-bus · cache-service · alertas-service · balance-service│
│  comunidades-service (catálogos SIGGAN/BADIGEX) · pdf-service │
│  export-service v1.2.0                                        │
├─────────────────────────────────────────────────────────────┤
│                CAPA DE REGLAS Y MOTOR                         │
│  trazabilidad.js (MotorTrazabilidad) · analitica.js           │
│  liquidacion.js (IVA/REAGP) · snapshot-service.js            │
├─────────────────────────────────────────────────────────────┤
│              CAPA DE MODELOS / DOMINIO                        │
│  fincas · rebanos · animales · pesajes · produccion · gastos  │
│  sanitarios · saneamientos · movimientos · reproduccion       │
│  compradores · proveedores · transportistas · contratos       │
│  pedidos-crotales · notificaciones-rega · liquidacion         │
├─────────────────────────────────────────────────────────────┤
│                 CAPA DE UI / FRAMEWORK                        │
│  modal-manager.js (Toast + Confirm + prompt)                  │
│  wizard-manager.js · produccion-ui.js · pesajes-ui.js         │
│  icons.js (SVG, ~50 glifos)                                   │
├─────────────────────────────────────────────────────────────┤
│                 CAPA DE VISTAS (js/views/)                    │
│  21 vistas + 9 wizards (js/views/wizards/)                    │
├─────────────────────────────────────────────────────────────┤
│                  ORQUESTADOR CENTRAL                          │
│  app.js — App (router hash-based, ~28 rutas)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Base de Datos IndexedDB — DB v11

### Almacenes y versión de introducción

| Almacén | Desde | Cifrado | Notas |
|---|:---:|:---:|---|
| `fincas` | v1 | No | REGA único (v9); zonas embebidas como array |
| `rebanos` | v1 | No | índice `fincaId` |
| `animales` | v1 | No | índices: `rebanoId`, `caravana`(único), `dib`(único,v9), `categoria`(v9), `madre_id`(v9) |
| `produccion_carne` | v1 | No | índice `animalId` |
| `produccion_leche` | v1 | **Sí (AES-GCM)** | — |
| `ventas_ganado` | v1 | **Sí (AES-GCM)** | índice `fincaId` |
| `sanitarios_ganado` | v1 | No | índice `rebanoId` |
| `gastos_ganaderia` | v1 | No | índices `fincaId`, `proveedorId`(v8) |
| `config_especies` | v2 | No | 4 especies semilla |
| `config_tipos_produccion` | v2 | No | 4 tipos semilla |
| `comercializacion_carne` | v3 | No | índices: `fincaId`, `animalId`, `compradorId`(v8), `contratoId`(v8), `numero_albaran`(único,v9), `dimoe`(v9), `transportistaId`(v9), `autorizacion_veterinaria`(v9) |
| `comercializacion_leche` | v3 | No | índices: `fincaId`, `comunidad_autonoma`(v7), `fechaRecogida`(v7), `contrato_numero`(v7), `compradorId`(v8), `contratoId`(v8) |
| `meta` | v4 | No | Control de idempotencia de migraciones |
| `registro_eventos` | v5 | No | 8 índices; fuente del Cuaderno Digital |
| `reproduccion_eventos` | v6 | No | índices: `fincaId`, `animalId`, `tipo_evento`, `fecha` |
| `compradores` | v8 | No | NIF/CIF único; migración auto desde ventas legadas |
| `proveedores` | v8 | No | NIF/CIF único |
| `contratos_compra` | v8 | No | índices: `compradorId`, `activo`, `tipo` |
| `transportistas` | v9 | No | índices: `nif_cif`(único), `activo`, `matricula` |
| `documentos_legales` | v9 | No | índices: `tipo`, `fincaId`, `animalId`, `numero`(único), `fecha_emision` |
| `movimientos_ganado` | v10 | No | índices: `fincaId`, `tipo`, `numero_guia`, `rega_origen/destino`, `fecha`, `animalId`(multi) |
| `saneamientos` | v10 | No | índices: `fincaId`, `campana`, `fecha`, `calificacion` |
| `notificaciones_rega` | **v11** | No | Migrado desde `localStorage`; auditable |

> **Regla crítica:** las **zonas no son un store propio**; viven embebidas en `fincas.zonas` (array). Siempre leer desde `Fincas.getActive()`, nunca `db.getAllFromIndex('zonas', …)`.

### Migraciones automáticas en arranque

| Versión | Migración | Idempotencia |
|---|---|---|
| v8 | `migrarV8`: extrae compradores/proveedores únicos de ventas/gastos legados; crea entidades y enlaza IDs | `meta.migracion_v8` |
| v9 | `migrarV9`: asigna `numero_albaran` secuencial (`AAAA-NNNN`) y genera DIMOE en `documentos_legales` para ventas sin documento | `meta.migracion_v9` |
| v11 | Auto-migración de notificaciones REGA desde `localStorage` a `notificaciones_rega` | idempotente por diseño |

### Datos semilla (`populateDefaults`)
- **config_especies**: Vacas (60 L), Ovejas (8 L), Cabras (8 L), Cerdos (12 L).
- **config_tipos_produccion**: Cárnica, Láctea, Mixto, Ibérico.

### Finca activa
`localStorage` → clave `activeFincaIdLivestock`. `Fincas.getActiveId()` valida existencia.

---

## 4. Router (app.js) — ~28 rutas

| Hash | Vista / método | Hash | Vista / método |
|---|---|---|---|
| `#/` | DashboardView | `#/explotacion` | ExplotacionView |
| `#/ganaderia` | GanaderiaView | `#/gastos` | GastosView |
| `#/rebanos` | RebanosView | `#/gasto?id` | App.renderDetalleGasto |
| `#/rebano?id` | App.renderRebano | `#/comercializacion` | ComercializacionView |
| `#/carne` | CarneView | `#/venta-carne?id` | App.renderDetalleVentaCarne |
| `#/hibrido` | HibridoView | `#/albaran-leche?id` | App.renderDetalleLeche |
| `#/zonas` | ZonasView | `#/informes` | InformesView |
| `#/zona?index` | ZonasView.renderDetalle | `#/ajustes` | AjustesView |
| `#/animales` | AnimalesView | `#/compradores` | CompradorView |
| `#/animal?id` | AnimalesView.renderDetalle | `#/comprador?id` | CompradorView.renderDetalle |
| `#/leche` | LecheView | `#/proveedores` | ProveedoresView |
| `#/trazabilidad` | TrazabilidadView | `#/proveedor?id` | ProveedoresView.renderDetalle |
| `#/cuaderno` | CuadernoView | `#/transportistas` | TransportistasView |
| `#/documentos` | DocumentosView | `#/contrato?id` | App.renderContrato |
| `#/manuales` | ManualesView | | |

---

## 5. Módulos JS principales

### Dominio / Modelos
`fincas` · `rebanos` · `animales` · `pesajes` · `produccion` · `gastos` · `sanitarios` · `saneamientos` · `movimientos` · `reproduccion` · `compradores` · `proveedores` · `transportistas` · `contratos` · `pedidos-crotales` · `notificaciones-rega` · `liquidacion`

### Servicios
`alertas-service` · `balance-service` · `cache-service` · `comunidades-service` · `event-bus` · `export-service` · `pdf-service`

### UI / Framework
`modal-manager` (Toast + Confirm + prompt) · `wizard-manager` (9 wizards) · `produccion-ui` · `pesajes-ui` · `icons` (~50 SVG glifos) · `snapshot-service`

### Wizards (js/views/wizards/)
`wizard-albaran-leche` · `wizard-censo` · `wizard-crotales` · `wizard-finca` · `wizard-gasto` · `wizard-guia-movimiento` · `wizard-traslado` · `wizard-tratamiento` · `wizard-venta-masiva`

### QA / Testing
`qa-siggan` (18 tests SIGGAN) · `qa-diagnostico` · `qa-test-runner` · `e2e-test-suite` · `tests` · `seed-data`

---

## 6. Sistema de UI/UX — Fase 6 completa

Toda la auditoría UI/UX (`docs/AUDITORIA-UI-UX.md`) está ✅ terminada:

| Fase | Contenido | Estado |
|---|---|:---:|
| 0 | Tokens CSS (`--p-gold`, `--p-cork`, `--c-success/danger/warning/info`) + bug `--p-gold` | ✅ |
| 1 | Consolidación CSS: inputs unificados, FAB único, parche `:has()` eliminado | ✅ |
| 2 | Iconos: librería `Icons.*` SVG conectada; ~35 emojis funcionales → SVG | ✅ |
| 3 | Mensajes: `Toast.success/warning/error/info()` + `Confirm.confirm()/alert()` — cero `alert()`/`confirm()` nativos | ✅ |
| 4 | Estilos inline: 1.361 → **625** (100% residuales justificados: PDF templates, custom props dinámicos, colores computados) | ✅ |
| 5 | Formularios/wizards: `wizard-manager` unificado, `wizard-finca` reemplaza `formulario-finca` | ✅ |
| 6 | Pantallas densas: `informes-view` con nav 2 niveles (5 cat × 22 sub-tabs); modal validación exportación | ✅ |

---

## 7. Adaptación SIGGAN — Estado

Ver `docs/CUMPLIMIENTO_SIGGAN.md` para la matriz completa. Resumen:

| Bloque | Estado |
|---|:---:|
| Explotación / REGA | ✅ |
| Identificación animal (crotal/DIB/genealogía) | ✅ |
| Censo y libro de registro | ✅ |
| Movimientos / guías oficiales | ✅ |
| Sanidad (tratamientos / saneamientos / bloqueo leche) | ✅ |
| Comercialización (carne / leche / SANDACH) | ✅ |
| Maestros comerciales (compradores/proveedores/transportistas) | ✅ |
| Trazabilidad / auditoría inmutable | ✅ |
| Workflow administrativo (borrador→presentado→aceptado/rechazado) | ✅ |
| Notificaciones REGA en BD (v11) | ✅ |
| Exportación CSV/XML (validación local) | ✅ |
| Exportación validada contra importador real SIGGAN/BADIGEX | 🟡 requiere credenciales Junta |
| Validación en dispositivo Android real | 🟡 `SigganQA.runAll()` pendiente ejecución manual |
| Manuales de usuario alineados a SIGGAN | ✅ |

---

## 8. QA / Testing

- **Suite SIGGAN** (`window.SigganQA`, `js/qa-siggan.js`): **18 tests** automatizados.
  - TEST 1 REGA · 2 Catálogos · 3 Movimientos · 4 Saneamientos · 5 Tratamientos · 6 Export CSV/XML · 7 Cuaderno · 8 Rendimiento DB · 9 Crotal · 10 Traslado/aforo · 11 Parto/genealogía · 12 Censo alta/baja · 13 Zonas UGM/PAC · 14 Tipo explotación REGA · 15 prohibidoLeche · 16 SANDACH · 17 Notificaciones REGA · 18 Cobertura demo CHAMORRO
  - Ejecución: `await SigganQA.runAll()` · `SigganQA.run("coverage")` · `SigganQA.cleanup()`
- **E2E Test Suite** (`js/e2e-test-suite.js`): 13 tests de flujo.
- **QA Test Runner** (`window.QATestRunner.runLevel(1-7)`) y **QA Diagnóstico** (`window.QADiagnostico.run()`).
- **Cobertura demo CHAMORRO: 17/17 módulos (100%)**.

---

## 9. Infraestructura Android

| Fichero | Configuración |
|---|---|
| `capacitor.config.ts` | `appId: com.livestockmanager.app`, `androidScheme: https` |
| `package.json` scripts | `build` (copia a `www/`), `cap:sync`, `cap:open` |
| `sync-mirrors.ps1` | Sincroniza raíz ↔ `www/` ↔ Android src ↔ Android build |
| `android/` | Gitignored; build sale del repo principal |

**Flujo de trabajo:** todo cambio JS/CSS/HTML → subir `CACHE_NAME` → `npm run build` → `sync-mirrors.ps1` → commit + push.

---

## 10. Deuda técnica abierta

| # | Severidad | Descripción | Estado |
|---|:---:|---|---|
| 1 | 🟡 | **Exportación SIGGAN/BADIGEX** — validación local ✅; falta contrastar contra importador real (requiere XSD/credenciales Junta). | Abierto — externo |
| 2 | 🟡 | **Test Android real** — código listo (`cap:sync` ejecutado); falta `SigganQA.runAll()` en dispositivo físico. | Abierto — manual |
| 3 | 🟢 | String de versión interno en `app.js` línea 1699 (`version: "4.5.0"`) sin actualizar a 4.7.0. | Menor |
| 4 | 🟠 | **7 vulnerabilidades Dependabot** en GitHub (6 high, 1 moderate) en dependencias de `package.json`. | Revisar |

---

## 11. Reglas de negocio implementadas

| Regla | Módulo |
|---|---|
| Supresión farmacológica | `trazabilidad.js` — bloquea comercialización en periodo de espera |
| Aforo de zona | `trazabilidad.js` — impide traslados que superen `aforoMax` |
| Merma canal | `trazabilidad.js` — valida `pesoCanal < pesoVivo` |
| Clasificación SEUROP | `trazabilidad.js` — % magro en canal |
| Laboratorio lácteo | `trazabilidad.js` — inhibidores/antibióticos |
| Crotal único + formato | `animales.js` — índice único `caravana` + `ES+12dígitos` |
| Anulación trazable | `animales.js`, `rebanos.js`, zonas — sin borrado físico |
| Integridad referencial | `animales/rebanos/fincas` — bloquea anulación con dependientes activos |
| Snapshot de contexto | `pesajes/produccion/gastos` — captura zona/tipo/especie inalterable |
| Seguridad de datos | `crypto.js` — ventas y producción láctea cifradas AES-GCM |
| Validación NIF/CIF/REGA | `error-handler.js` — DNI/NIE/CIF con dígito de control + REGA por CCAA |
| Venta ↔ movimiento oficial | `wizard-venta-masiva.js` — genera movimiento SIGGAN con rollback |
| Bloqueo venta leche | `sanitarios.js` / wizards — `prohibidoLeche` en periodo de espera |
| SANDACH | `animales.js` — clasificación por motivo de baja (Reg. UE 1069/2009) |
| Workflow trámite | `documentos_legales` — estados borrador→presentado→aceptado/rechazado |
