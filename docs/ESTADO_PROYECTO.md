# Estado del Proyecto — Livestock Manager Premium
> Fotografía técnica generada el 2026-06-03 · Versión de app: **v3.7.1**

---

## 1. Versiones registradas

| Artefacto | Valor |
|---|---|
| `package.json` / `README.md` | `3.5.3` ⚠️ desactualizado |
| `index.html` (cache-bust CSS) | `?v=3.5.3` ⚠️ desactualizado |
| `app.js` (cabecera interna) | `v3.7.0 Industrial Individual` |
| `pesajes.js` (cabecera interna) | `v4.0.0` (versión de módulo) |
| `trazabilidad.js` (cabecera interna) | `v3.3.5 Premium` |
| `analitica.js` (cabecera interna) | `v3.2.1 Premium` |
| `CHANGELOG.md` (última entrada) | `v3.7.1` (hoy) |
| **Base de datos IndexedDB** | **DB v5** |

> **Acción pendiente:** sincronizar `package.json` y `index.html` a `3.7.1`.

---

## 2. Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│                     index.html (SPA Shell)                  │
│  Header · Nav (carrusel 7 ítems) · #app-content · Toast     │
├─────────────────────────────────────────────────────────────┤
│                    CAPA DE ARRANQUE                         │
│  idb-local.js (wrapper idb v5)   ←   db.js (DB v5 schema)  │
│  error-handler.js                                           │
│  crypto.js (AES-GCM)                                        │
└────────────┬────────────────────────────────────────────────┘
             │ window.db / window.dbPromise
┌────────────▼────────────────────────────────────────────────┐
│                   CAPA DE REGLAS Y MOTOR                    │
│  trazabilidad.js   ─  MotorTrazabilidad                     │
│    · checkSupresion · validarAforoZona                      │
│    · importarBackupData · existeCrotal                      │
│    · generarEstructuraAlbaran                               │
│  analitica.js      ─  Analitica                             │
│    · obtenerRentabilidadFinca · obtenerMargenPorAnimal       │
│    · obtenerRentabilidadZonas · obtenerCensoRebanos          │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│                  CAPA DE MODELOS DE DATOS                   │
│  fincas.js    rebanos.js    animales.js                     │
│  pesajes.js ← Motor Maestro de Pesajes (v4.0.0 módulo)      │
│  pesajes-ui.js ← Wizard UI de Pesajes (v1.0.0 módulo)       │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│               CAPA DE OPERACIONES DIARIAS                   │
│  produccion.js   gastos.js   sanitarios.js                  │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│              CAPA DE ONBOARDING / UI / BACKUPS              │
│  export_reco.js       ← Export Excel + Charts               │
│  importador.js        ← Importación legada CORK_BACKUP      │
│  formulario-finca.js  ← Componente formulario               │
│  asistente-configuracion.js ← Wizard primer arranque        │
│  modal-manager.js     ← Gestor centralizado de modales      │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│                  ORQUESTADOR CENTRAL                        │
│  app.js  ─  App (v3.7.0 Industrial Individual)              │
│    · Router hash-based · renderAnimales/Rebanos/Dashboard   │
│    · _escanearCrotal · _registrarPesadaIndividual           │
│    · _ejecutarMigracionesFondo                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Estructura de la Base de Datos IndexedDB — DB v5

### Almacenes y su versión de introducción

| Almacén | Desde DB | KeyPath | Índices | Cifrado |
|---|:---:|---|---|:---:|
| `fincas` | v1 | `id` (auto) | — | No |
| `rebanos` | v1 | `id` (auto) | `fincaId` | No |
| `animales` | v1 | `id` (auto) | `rebanoId`, `caravana` (único) | No |
| `produccion_carne` | v1 | `id` (auto) | `animalId` | No |
| `produccion_leche` | v1 | `id` (auto) | — | **Sí (AES-GCM)** |
| `ventas_ganado` | v1 | `id` (auto) | `fincaId` | **Sí (AES-GCM)** |
| `sanitarios_ganado` | v1 | `id` (auto) | `rebanoId` | No |
| `gastos_ganaderia` | v1 | `id` (auto) | `fincaId` | No |
| `config_especies` | v2 | `id` (auto) | — | No |
| `config_tipos_produccion` | v2 | `id` (auto) | — | No |
| `comercializacion_carne` | v3 | `id` (auto) | `fincaId`, `animalId` | No |
| `comercializacion_leche` | v3 | `id` (auto) | `fincaId` | No |
| `meta` | v4 | `key` | — | No ⚠️ sin uso |
| `registro_eventos` | **v5** | `id` (auto) | `fincaId`, `entidad_id`, `tipo_entidad`, `snap_zona`, `snap_tipo`, `motivo_tarea`, `fecha` | No |

### Datos semilla (populados en `populateDefaults`)

**config_especies** (si el store está vacío al arrancar):

| nombre | consumoAguaL |
|---|---|
| Vacas | 60 |
| Ovejas | 8 |
| Cabras | 8 |
| Cerdos | 12 |

**config_tipos_produccion** (si el store está vacío al arrancar):

| nombre |
|---|
| Cárnica |
| Láctea |
| Mixto |
| Ibérico |

### Esquema del almacén principal: `registro_eventos`

```
registro_eventos {
  id            : number   (autoIncrement, PK)
  fincaId       : number   (FK → fincas.id)
  fecha         : string   (YYYY-MM-DD)

  // Identidad
  entidad_id    : number   (FK → animales.id | rebanos.id)
  tipo_entidad  : string   ('animal' | 'rebano' | 'tanque' | 'insumo')

  // Snapshot inalterable (contexto en el momento del evento)
  snap_zona     : string
  snap_tipo     : string
  snap_especie  : string

  // Magnitudes físicas
  peso_bruto    : number   (kg, camión cargado)
  tara          : number   (kg, camión vacío)
  valor_neto    : number   (kg real = bruto - tara)
  valor_canal   : number   (kg tras sacrificio)
  unidad        : 'kg' | 'L'

  // Economía
  precio_unitario : number  (€/kg o €/L)
  importe_total   : number  (valor_neto × precio_unitario)
  rol_contable    : 'VENTA' | 'COMPRA' | 'INVENTARIO'

  // Logística y documentación
  matricula       : string  (matrícula del transporte)
  documento_ref   : string  (albarán / factura)
  motivo_tarea    : string  ('control' | 'expedicion' | 'produccion_leche'
                             | 'ALTA_IMPORTACION')
  creadoEn        : string  (ISO 8601)
}
```

### Finca activa

Almacenada en `localStorage` bajo la clave `activeFincaIdLivestock`. No vive en IndexedDB. `Fincas.getActiveId()` valida que la finca exista antes de devolverla.

---

## 4. Flujo de arranque de la aplicación

```
DOMContentLoaded
       │
       ▼
idb-local.js carga self.idb
       │
       ▼
db.js → initDB() → openDB('LivestockDB', 5)
       │   └── upgrade(): aplica migraciones v1→v5 si necesario
       ▼
populateDefaults() → siembra especies y tipos si están vacíos
       │
       ▼
window.db disponible → window.dbPromise resuelto
       │
       ▼
app.js: App.init()
       ├── _injectGlobalStyles()
       ├── window.addEventListener('hashchange', App.route)
       ├── await window.dbPromise
       ├── Fincas.list() → ¿hay fincas?
       │       │
       │    NO ─┴──► AsistenteConfiguracion.mostrarAsistente()
       │                    ├── Crear nueva finca (FormularioFinca)
       │                    ├── Importar backup (window.Trazabilidad.importarBackupData)
       │                    └── Seleccionar finca existente
       │
       └── SÍ ──► App.updateHeader()
                  App._ejecutarMigracionesFondo()  ← Pesajes.ejecutarMigracion()
                  App.route()  ← renderiza vista según hash
```

---

## 5. Router

| Hash | Método | Estado |
|---|---|:---:|
| `#/` | `renderDashboard()` | ✅ Activo |
| `#/rebanos` | `renderRebanos()` | ✅ Activo |
| `#/rebano?id=X` | `renderDetalleRebano()` | ✅ Activo |
| `#/animales` | `renderAnimales()` | ✅ Activo |
| `#/animal?id=X` | `renderDetalleAnimal()` | ✅ Activo |
| `#/comercializacion` | `renderComercializacion()` | ⚠️ Stub → redirige a dashboard |
| `#/informes` | `renderInformes()` | ⚠️ Stub → redirige a dashboard |
| `#/ajustes` | `renderAjustes()` | ⚠️ Stub → redirige a dashboard |
| `#/zonas` | *(sin entrada en router)* | 🔴 Nav lo enlaza pero no existe |

---

## 6. Mapa de módulos y sus exports globales

| Archivo | Export `window.*` | Versión interna |
|---|---|---|
| `idb-local.js` | `window.idb` | idb v5 (minificado) |
| `db.js` | `window.db`, `window.dbPromise` | — |
| `error-handler.js` | `window.ErrorHandler` | — |
| `crypto.js` | `window.CryptoUtils` | — |
| `trazabilidad.js` | `window.Trazabilidad`, `window.MotorTrazabilidad` | v3.3.5 |
| `analitica.js` | `window.Analitica` | v3.2.1 |
| `fincas.js` | `window.Fincas` | — |
| `rebanos.js` | `window.Rebanos` | — |
| `animales.js` | `window.Animales` | — |
| `pesajes.js` | `window.Pesajes` | v4.0.0 (módulo) |
| `pesajes-ui.js` | `window.PesajesUI` | v1.0.0 (módulo) |
| `produccion.js` | `window.Produccion` | — |
| `gastos.js` | `window.Gastos` | — |
| `sanitarios.js` | `window.Sanitarios` | — |
| `export_reco.js` | `window.Export`, `window.Charts` | — |
| `importador.js` | `window.Importador` | — |
| `formulario-finca.js` | `window.FormularioFinca` | — |
| `asistente-configuracion.js` | `window.AsistenteConfiguracion` | — |
| `modal-manager.js` | `window.ModalManager` | — |
| `app.js` | `window.App` | v3.7.0 |

---

## 7. Dependencias externas

### `package.json` — devDependencies

| Paquete | Versión |
|---|---|
| `@capacitor/android` | ^5.0.0 |
| `@capacitor/cli` | 5.7.8 |
| `@capacitor/core` | ^5.0.0 |
| `@capacitor/assets` | ^3.0.5 |

### `package.json` — dependencies (runtime)

| Paquete | Versión | Uso |
|---|---|---|
| `@capacitor-community/barcode-scanner` | ^4.0.1 | Escáner de crotales |
| `@capacitor/filesystem` | ^5.2.2 | Acceso a ficheros Android |
| `@capacitor/share` | ^5.0.8 | Compartir documentos PDF |
| `@capawesome/capacitor-file-picker` | ^5.3.0 | Selección de archivo backup |

### CDN (cargadas en `index.html`)

| Librería | Uso |
|---|---|
| `xlsx@0.18.5` | Exportación a Excel |
| `html2pdf.js@0.10.1` | Generación de PDF |
| `chart.js` (latest) | Gráficos analíticos |

---

## 8. Infraestructura Android

| Fichero | Configuración relevante |
|---|---|
| `capacitor.config.ts` | `appId: com.livestockmanager.app`, `androidScheme: https` |
| `AndroidManifest.xml` | `INTERNET`, `CAMERA`, `READ/WRITE_EXTERNAL_STORAGE`, `FLASHLIGHT`, `READ_MEDIA_*` (Android 13+); `hardwareAccelerated=true` |
| `file_paths.xml` | `external-path`, `cache-path`, `external-cache-path`, `files-path` |
| `build-android.ps1` | Copia www/, `npx cap sync`, `gradlew assembleDebug` |

---

## 9. Issues conocidos (deuda técnica activa)

| # | Severidad | Archivo | Descripción |
|---|:---:|---|---|
| 1 | 🔴 **RESUELTO** | `trazabilidad.js` | Bug backup sobrescritura: `.clear().onsuccess` sobre Promise idb → corregido con `window.idb.unwrap()` |
| 2 | 🟡 Medio | `index.html` | Nav enlaza `#/zonas` pero la ruta no existe en `app.js` → cae silenciosamente al dashboard |
| 3 | 🟡 Medio | `formulario-finca.js` | `_aplicarEstilos()` crea el `<style>` pero nunca lo añade al DOM → estilos del formulario no se aplican |
| 4 | 🟡 Medio | `app.js` | `renderComercializacion`, `renderInformes`, `renderAjustes` son stubs → secciones enteras sin UI |
| 5 | 🟠 Bajo | `db.js` | Almacén `meta` (DB v4) creado pero ningún módulo lo usa |
| 6 | 🟠 Bajo | `tests.js` | Tests escritos para validaciones de v1/v2 (rebano obligatorio, formato crotal estricto) → fallarían contra el código actual |
| 7 | 🟠 Bajo | `package.json` / `index.html` | Versión congelada en `3.5.3`; no refleja el estado real `3.7.1` |

---

## 10. Reglas de negocio implementadas

| Regla | Módulo | Descripción |
|---|---|---|
| **Supresión farmacológica** | `trazabilidad.js` | Bloquea comercialización si el animal está dentro del periodo de espera de un tratamiento activo |
| **Aforo de zona** | `trazabilidad.js` | Impide traslados si la zona destino supera `aforoMax` |
| **Merma canal** | `trazabilidad.js` | Valida que `pesoCanal < pesoVivo` en toda expedición |
| **Clasificación SEUROP** | `trazabilidad.js` | Clasificación de canal porcino por % de magro |
| **Laboratorio lácteo** | `trazabilidad.js` | Evalúa inhibidores/antibióticos en muestra de leche |
| **Duplicados de crotal** | `animales.js` | Índice único `caravana`; verificación en save() para alta y edición |
| **Integridad referencial** | `animales.js`, `rebanos.js`, `fincas.js` | Bloquea borrado si existen registros dependientes |
| **Snapshot de contexto** | `pesajes.js`, `produccion.js`, `gastos.js` | Captura zona/tipo/especie en el momento del evento; el dato queda inalterable |
| **Seguridad de datos** | `crypto.js` | Ventas y producción láctea cifradas con AES-GCM usando `fincaId` como clave derivada |
