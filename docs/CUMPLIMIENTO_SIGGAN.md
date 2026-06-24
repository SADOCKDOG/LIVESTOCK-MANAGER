# Matriz de Cumplimiento SIGGAN — Livestock Manager
> Generada el **2026-06-24** · App v4.5.0 · DB v10 · Suite QA: 18 tests
>
> Vara de medir: modelo y flujos oficiales del **SIGGAN** (Sistema de Información de Gestión Ganadera, Andalucía) y marco **BADIGEX** (Extremadura), con base normativa RD 479/2004 (REGA), RD 787/2023 (identificación/registro/movimientos) y Reg. UE 1069/2009 (SANDACH).
>
> Leyenda: ✅ Cumple · 🟡 Parcial · 🔴 No cumple · — No aplica

---

## 1. Resumen ejecutivo

La adaptación SIGGAN está **sustancialmente completa**. De los flujos normativos evaluados, la mayoría **cumplen** con validación en capa de dominio (no solo UI) y cobertura de QA automatizada. Los puntos abiertos son **operativos y de documentación** (validación en Android, manuales) más una **deuda técnica** concreta (KPIs de zonas en el hub de Ganadería).

| Bloque | Estado global |
|---|---|
| Explotación / REGA | ✅ |
| Identificación animal (crotal/DIB) | ✅ |
| Censo y libro de registro | ✅ |
| Movimientos / guías oficiales | ✅ |
| Sanidad (tratamientos / saneamientos) | ✅ |
| Comercialización (carne / leche) | ✅ |
| Maestros comerciales (operadores/transporte) | ✅ |
| Trazabilidad / auditoría | ✅ |
| Workflow administrativo (trámites) | ✅ |
| Exportación oficial | 🟡 |
| Documentación de usuario (manuales) | 🔴 |

---

## 2. Matriz por flujo

| # | Flujo / Campo normativo | Estado | Evidencia en código | Observación / gap |
|---|---|:---:|---|---|
| 1 | **Formato REGA** (RD 479/2004) validado por CCAA | ✅ | `error-handler.validateREGA`, `ComunidadesService.validarFormatoREGA`, `Fincas.save` | TEST 1. Puede tensionar REGA legados mal formados. |
| 2 | **Catálogos normativos cerrados** (tipoAlta, categoría, especie) | ✅ | `comunidades-service.js` (`TIPOS_ALTA`, `CATEGORIAS_ANIMAL`, `getGrupoEspecie`) | TEST 2. |
| 3 | **Crotal normativo** (ES + 12 díg. / país + díg.) único | ✅ | índice único `caravana`, `validateCaravana` | TEST 9. |
| 4 | **DIB** (Documento Identificación Bovina) | ✅ | índice único `animales.dib` (v9) | Soportado a nivel de dato. |
| 5 | **Genealogía** (madre_id) y parto → alta de cría | ✅ | `animales.madre_id`, `reproduccion.js` `_registrarCriasParto` | TEST 11. |
| 6 | **Censo / altas-bajas** en libro de registro | ✅ | `Animales.save` → `registro_eventos`; wizard-censo con trámite | TEST 12. |
| 7 | **Movimientos oficiales** (guía origen y sanidad) | ✅ | `movimientos_ganado` (v10), `Movimientos.save`, `wizard-guia-movimiento` | TEST 3. |
| 8 | **Traslado interno** + aforo de zona | ✅ | `wizard-traslado` → evento `traslado_interno`, `validarAforoZona` | TEST 10. |
| 9 | **Saneamientos** (campañas ADSG/TBC/brucelosis) | ✅ | `saneamientos` (v10), calificación sanitaria | TEST 4. |
| 10 | **Libro de tratamientos** + tiempos de espera | ✅ | `sanitarios_ganado`, `prohibidoLeche`, `tiempo_espera_*` | TEST 5. |
| 11 | **Bloqueo venta de leche** en periodo de espera | ✅ | validación en wizard-albaran-leche / comercialización | TEST 15. |
| 12 | **Clasificación SANDACH** por motivo de baja | ✅ | infra SANDACH + UI animal (Reg. UE 1069/2009) | TEST 16. |
| 13 | **Tipo de explotación REGA** en rebaños | ✅ | `rebanos.tipo_explotacion_rega` | TEST 14. |
| 14 | **Zonas**: UGM, carga ganadera, distancias, PAC | ✅ | campos en `fincas.zonas`, migración de relleno | TEST 13. (Ver gap KPIs, §3) |
| 15 | **Venta → movimiento oficial** enlazado | ✅ | `wizard-venta-masiva` → `Movimientos.save('salida')` + `movimientoId` | Con rollback si falla el movimiento. |
| 16 | **Operadores comerciales** (comprador/proveedor) con REGA + NIF/CIF + tipo operador | ✅ | `compradores.js`, `proveedores.js`, `validateNifCif` | — |
| 17 | **Transportista**: ATG + desinsectación (fechas/vigencia) | ✅ | `transportistas.js` (`autorizacion_transporte_ganado`, `desinsectacion_*`) | — |
| 18 | **Liquidación** con IVA / retención (REAGP) | ✅ | `Liquidacion.calcular`, re-derivado desde contrato activo | — |
| 19 | **Trazabilidad económica** (gasto → registro_eventos) | ✅ | `gastos.js` → `registro_eventos`, enlace sanitario | — |
| 20 | **Auditoría legal inmutable** (anulación, no borrado) | ✅ | `Animales/Rebanos.delete`, anulación de zonas + evento auditoría | — |
| 21 | **Workflow administrativo** (borrador→presentado→aceptado/rechazado + acuse) | ✅ | guías, INFOLAC, censo, traslado → `documentos_legales` | — |
| 22 | **Pedidos de crotales** persistidos | ✅ | `pedidos-crotales.js` (BD, no solo PDF) | — |
| 23 | **Notificaciones REGA** al alta | 🟡 | `notificaciones-rega.js` (en `localStorage`) | TEST 17 OK, pero debería persistir en store versionado / `documentos_legales`. |
| 24 | **Exportación oficial** CSV/XML (REGA, SIA) + cierre mensual | 🟡 | `export-service`, `AjustesView._exportarCierreMensual`, `pedidos-crotales` export | TEST 6. Falta validar el formato exacto contra el importador real de SIGGAN/BADIGEX. |
| 25 | **Cobertura de datos demo** (validación integral) | ✅ | TEST 18 `testCoberturaDemo` | 17/17 módulos. |
| 26 | **Manuales de usuario** alineados a SIGGAN | 🔴 | `docs/GUIA_*.html` | Sin Cuaderno Digital ni libros de registro; sin tocar desde el commit inicial. |
| 27 | **Validación en dispositivo Android** | 🟡 | — | Código listo; `SigganQA.runAll()` en dispositivo pendiente de ejecución. |

---

## 3. Deuda técnica que afecta a cumplimiento

| Severidad | Descripción | Impacto normativo | Acción |
|:---:|---|---|---|
| 🔴 | `GanaderiaView` lee zonas de un object store inexistente (`db.getAllFromIndex('zonas',…)`); zonas viven en `fincas.zonas`. Falla en silencio (`.catch(()=>[])`). | KPIs de zonas (UGM/carga) del hub salen vacíos → la información de carga ganadera no se muestra aunque el dato exista. | Leer desde `fincas.zonas` como `zonas-view.js`. |
| 🟡 | `notificaciones-rega.js` en `localStorage`. | Workflow administrativo de notificación menos robusto/auditable. | Migrar a store versionado / `documentos_legales`. |
| 🟡 | Formato de exportación oficial no validado contra el sistema real. | Riesgo de rechazo en carga telemática SIGGAN/BADIGEX. | Validar contra plantilla oficial. |

---

## 4. Backlog priorizado (impacto normativo alto → bajo)

1. 🔴 **Corregir KPIs de zonas en `GanaderiaView`** (lectura desde `fincas.zonas`).
2. 🟡 **Validar export oficial** CSV/XML contra el formato de carga SIGGAN/BADIGEX real.
3. 🟡 **Migrar notificaciones REGA** a almacenamiento versionado/expediente.
4. 🟡 **Validación end-to-end en Android** (`cap:sync` + `SigganQA.runAll()` en dispositivo).
5. 🔴/doc **Actualizar manuales** (Cuaderno Digital + libros de registro SIGGAN).

---

## 5. Cómo reproducir la validación

```js
// Consola del navegador (Chrome DevTools)
await SeedData.run(true);        // Cargar Demo CHAMORRO
await SigganQA.runAll();         // 18 tests SIGGAN
await SigganQA.run("coverage");  // Cobertura de módulos (17/17)
await SigganQA.cleanup();        // Limpieza de datos de test
```
