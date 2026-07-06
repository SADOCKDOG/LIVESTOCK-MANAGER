# Auditoría e Integración ERP — Módulos, Acciones de Registro y Lógica de Negocio

**Proyecto:** LIVESTOCK-MANAGER · **Alineación:** SIGGAN (Andalucía) / BADIGEX (Extremadura)
**Fecha:** 2026-07-06 · **Alcance:** blueprint de reorganización ERP + navegación + cierre priorizado de huecos de negocio.

---

## 1. Contexto y objetivo

La aplicación ya tiene tres "hubs" operativos (**Ganadería**, **ExPro/Explotación**, **CoMer/Comercialización**) y una capa de datos madura, con motor de trazabilidad inmutable alineado a SIGGAN (17 tests QA). El problema **no es de funcionalidad, sino de organización**: varios módulos de negocio (Gastos, Sanidad/Tratamiento, Compradores, Proveedores, Transportistas, Contratos, Almacén, Trazabilidad, Documentos) están **duplicados o huérfanos** —sin un hub "dueño" claro— lo que rompe la lógica ERP de "cada dato se registra una vez, en su módulo, y los demás lo consultan".

Este documento define **qué debe contener cada hub**, **qué acción de registro vive en cada uno**, y **cómo se conectan entre sí** respetando el modelo de trazabilidad SIGGAN.

---

## 2. Estado actual (hallazgos de auditoría)

### 2.1 Los 3 hubs hoy

| Hub | Ruta | Contiene hoy | Acciones de registro |
|-----|------|--------------|----------------------|
| **Ganadería** | `/ganaderia` | Animales, Rebaños, Zonas + selector de modo (carne/leche/híbrido) | Nuevo registro de producción (pesaje/ordeño) vía FAB |
| **ExPro** | `/explotacion` | Sub-módulos: Producción (carne/leche/híbrido), **Gastos**, **Almacén** | Peso, Tratamiento, Gasto |
| **CoMer** | `/comercializacion` | Tabs: Venta Carne, Entrega Leche, **Gastos** | Venta masiva, Albarán leche, Gasto |

### 2.2 Problemas estructurales detectados

1. **Gastos triplicado** — vive en ExPro, en CoMer y como ruta suelta `/gastos`. Sin dueño único.
2. **Sanidad/Tratamiento mal ubicado** — el botón "Tratamiento" se dispara desde ExPro, pero es el **libro de tratamientos SIGGAN**, censal, ligado a animal/rebaño, y **bloquea la venta** por periodo de supresión. Su lugar natural es Ganadería.
3. **Terceros huérfanos** — Compradores, Proveedores, Transportistas y Contratos están sueltos en el menú "Más", sin agrupación, pese a ser todos "partners comerciales".
4. **Capa de cumplimiento dispersa** — Trazabilidad, Documentos/DIMOE, Cuaderno digital, Informes, Notificaciones REGA y Exportación SIGGAN/BADIGEX están sueltos.
5. **Selector de modo inconsistente** — carne/leche/híbrido se repite en Ganadería y en ExPro con estados independientes; debería ser un filtro de contexto **global**.
6. **Bottom-nav sobrecargado** — Animales y Rebaños ocupan sitio propio en la barra inferior cuando conceptualmente son *dentro de* Ganadería.

### 2.3 Nivel de madurez SIGGAN (base sólida ya implementada)

REGA validado, crotal normativo + DIB con índice único, censo con altas/bajas automáticas y eventos inmutables (`registro_eventos`), movimientos/guías con estado de trámite (borrador→presentado→aceptado/rechazado), libro de tratamientos con tiempos de espera, **motor `checkSupresion()`** que bloquea comercialización, SANDACH por motivo de baja, exportación CSV/XML. Referencias: `js/qa-siggan.js`, `js/trazabilidad.js`, `js/movimientos.js`.

---

## 3. Modelo ERP objetivo

Principio rector: **3 hubs operativos + 1 capa transversal**, cada dato con un único dueño de registro.

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   GANADERÍA     │   │     ExPro       │   │     CoMer       │
│  "Qué tengo"    │   │ "Qué produzco   │   │ "Qué vendo y    │
│                 │   │  y qué gasto"   │   │  a quién"       │
│ Censo/Sanidad/  │   │ Producción/     │   │ Ventas/Terceros/│
│ Movimientos     │──▶│ Gastos/Almacén  │──▶│ Contratos       │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         └──────────┬──────────┴──────────┬──────────┘
                    ▼                      ▼
         ┌──────────────────────────────────────────┐
         │  CAPA TRANSVERSAL — Compliance & BI       │
         │  Trazabilidad · Documentos/DIMOE ·        │
         │  Cuaderno · Informes · Exportación SIGGAN │
         └──────────────────────────────────────────┘
```

### 3.1 HUB 1 — GANADERÍA · *Maestro de Activos Vivos* ("qué tengo")

Núcleo SIGGAN: identidad, censo, sanidad, movimientos y genealogía.

| Sub-módulo | Responsabilidad | Fuente de datos |
|------------|-----------------|-----------------|
| Animales | Individuo: crotal, DIB, estado, categoría | `js/animales.js` |
| Rebaños | Grupos por tipo/línea | `js/rebanos.js` |
| Zonas/Parcelas | UGM, PAC, aforo | `js/views/zonas-view.js` |
| **Sanidad / Libro de Tratamientos** *(reubicado desde ExPro)* | Tratamientos, tiempos de espera, `prohibidoLeche` | `js/sanitarios.js` |
| Reproducción | Celo, IA, partos, genealogía (madre_id) | `js/reproduccion.js` |
| Movimientos / Guías | Altas-bajas censo, entrada/salida inter-explotación | `js/movimientos.js` |
| Trazabilidad individual | Ficha 360 del animal | `js/trazabilidad.js` |

**Acciones de registro (dueño):** Alta animal (nacimiento/compra/traslado) → `wizard-censo`; Alta rebaño; **Nuevo tratamiento → `wizard-tratamiento`**; Nuevo movimiento/guía → `wizard-guia-movimiento`; Evento reproductivo; Baja (motivo SANDACH); Pedido de crotales.

### 3.2 HUB 2 — ExPro / EXPLOTACIÓN · *Operación productiva* ("qué produzco y qué gasto")

| Sub-módulo | Responsabilidad | Fuente de datos |
|------------|-----------------|-----------------|
| Producción Carne | Pesajes, GMD, proyección peso | `js/produccion.js` |
| Producción Leche | Controles lecheros, calidad de tanque | `js/produccion.js` (cifrada) |
| Producción Híbrido | Vista combinada carne+leche | `js/views/hibrido-view.js` |
| **Gastos** *(dueño único)* | Alimentación, sanidad, amortización, energía | `js/gastos.js` |
| Almacén / Inventario | Pienso, insumos, silos | `_renderAlmacenView()` |

**Acciones de registro (dueño):** Registrar peso → asistente producción carne; Registrar control lechero → asistente producción leche; **Registrar gasto → `wizard-gasto`** (único punto de alta); Movimiento de almacén.

### 3.3 HUB 3 — CoMer / COMERCIALIZACIÓN · *Comercial* ("qué vendo y a quién")

| Sub-módulo | Responsabilidad | Fuente de datos |
|------------|-----------------|-----------------|
| Ventas Carne | Canal, matadero, SEUROP, DIMOE | `comercializacion_carne` |
| Entregas Leche | Albaranes, calidad, INFOLAC | `comercializacion_leche` |
| **Directorio de Terceros** *(reubicado desde "Más")* | Compradores, Proveedores, Transportistas | `js/compradores.js`, `js/proveedores.js`, `js/transportistas.js` |
| Contratos | Precios, IVA, retención REAGP | `js/contratos.js` |
| Liquidaciones | Cálculo IVA/REAGP por operador | `js/liquidacion.js` |

**Acciones de registro (dueño):** Registrar venta carne → `wizard-venta-masiva`; Registrar entrega leche → `wizard-albaran-leche`; Alta comprador/proveedor/transportista; Nuevo contrato.

> **Nota sobre Gastos en CoMer:** CoMer **no registra** gastos; solo **muestra en lectura** los gastos comerciales (transporte, matanza) filtrados desde ExPro para calcular el margen/MOFA de cada venta.

### 3.4 CAPA TRANSVERSAL — Compliance & BI (menú "Más" / header, no es hub de registro)

Cuaderno Digital · Documentos Legales (DIMOE, estados de trámite) · Notificaciones REGA · Informes (ventas, REGA) · Exportación SIGGAN/BADIGEX (CSV/XML) · Trazabilidad global. Todos **consumen** el libro maestro `registro_eventos`; ninguno crea datos primarios.

---

## 4. Reasignación de módulos (de dónde → a dónde)

| Módulo | Ubicación actual | Ubicación objetivo | Motivo |
|--------|------------------|--------------------|--------|
| Sanidad/Tratamiento | ExPro (botón) | **Ganadería** (dueño) + acceso rápido en ExPro | Libro censal SIGGAN, bloquea ventas |
| Gastos | ExPro + CoMer + `/gastos` | **ExPro** (dueño único), lectura en CoMer | Coste de producción, evita triplicación |
| Compradores | "Más" | **CoMer › Terceros** | Partner de venta |
| Proveedores | "Más" | **CoMer › Terceros** (enlace bidireccional con Gastos) | Partner de compra |
| Transportistas | "Más" | **CoMer › Terceros** | Partner logístico |
| Contratos | "Más" | **CoMer › Contratos** | Condiciones de venta |
| Almacén | ExPro (incipiente) | **ExPro › Almacén** (consolidar) | Inventario de producción |
| Trazabilidad / Documentos / Cuaderno / Informes / Exportación | Sueltos | **Capa transversal** | Cumplimiento, no registro primario |
| Modo carne/leche/híbrido | Duplicado Ganadería + ExPro | **Filtro de contexto global** persistente | Coherencia entre hubs |
| Animales / Rebaños | Bottom-nav propio | Dentro de **Ganadería** | Reducir carga de barra inferior |

---

## 5. Lógica de negocio transversal (reglas que conectan los hubs)

Estas reglas ya existen (parcial o totalmente) y son el "pegamento" ERP que hay que preservar y reforzar:

1. **Sanidad bloquea Venta** — `checkSupresion(animal, fecha, destino)` en Ganadería determina si CoMer puede vender. *(Existe para carne; falta automatizar en leche — ver §6 P1).*
2. **Venta actualiza Censo** — al vender (CoMer), el animal pasa a `estado='vendido'` en Ganadería y se genera Movimiento + DIMOE automáticamente.
3. **Gasto referencia Proveedor** — gasto (ExPro) se auto-vincula a proveedor (CoMer › Terceros) y, si es Sanidad, a un sanitario por fecha ±30 días.
4. **Producción alimenta Margen** — producción (ExPro) + gastos (ExPro) → `BalanceService` calcula MOFA/rentabilidad mostrado en CoMer.
5. **Todo evento va al libro maestro** — `registro_eventos` es el ledger inmutable que alimenta Cuaderno, Informes y Exportación (capa transversal). Ningún módulo borra: anula de forma trazable.

---

## 6. Huecos de negocio priorizados (fase de implementación posterior)

| Prio | Hueco | Impacto | Acción propuesta |
|------|-------|---------|------------------|
| **P1** | `checkSupresion()` no se ejecuta automáticamente en `comercializacion_leche.save()` | **Riesgo normativo**: venta de leche con supresión activa | Invocar `checkSupresion(rebano, fecha, 'leche')` en el save y en el wizard de albarán, con bloqueo duro |
| **P2** | Gasto asignable solo por rebaño, no por animal | Sin coste por individuo → rentabilidad imprecisa | Añadir `animalId` opcional en `gastos.js` (tabla bridge `animal_gastos`) |
| **P3** | Producción individual no enlaza con la venta | No se traza kg pesado → kg canal vendido | Enlazar `produccion_carne.animalId` con `comercializacion_carne` en `BalanceService` |
| **P4** | `contratoId` en venta es referencial, no exigido | Precios pueden discrepar del contrato sin alerta | Validar vigencia/precio del contrato en el wizard de venta |
| **P5** | Alta por compra sin FK a proveedor/origen | Genealogía de importación incompleta | Añadir `proveedorId`/`rega_origen` enlazado en alta tipo "Compra" |

---

## 7. Reorganización de navegación

- **Bottom-nav (5 fijos):** Inicio · Ganadería · ExPro · CoMer · Más.
- **Quitar del bottom-nav:** Animales y Rebaños (pasan a ser tabs internos de Ganadería).
- **Menú "Más" = capa transversal:** Cuaderno, Documentos, Informes, Trazabilidad, Exportación, Ajustes, Manuales.
- **Tabs internos consistentes** en cada hub (mismo patrón visual de sub-módulos que ya usa ExPro con `_cambiarSubModulo`).
- **Selector de modo** (carne/leche/híbrido): un único control de contexto en el header o en Ganadería, cuyo estado consumen ExPro y CoMer.

Archivos afectados por la reorganización de nav: `index.html` (bottom-nav y `nav-more-sheet`), `js/app.js` (objeto `routes` ~L101 y lógica `_updateNav`/`route`), y las tres vistas hub (`ganaderia-view.js`, `explotacion-view.js`, `comercializacion-view.js`).

---

## 8. Verificación (cómo probar la reorganización)

1. **Navegación:** cada hub abre sus sub-módulos como tabs internos; "Más" solo muestra la capa transversal; Animales/Rebaños accesibles dentro de Ganadería.
2. **Dueño único de registro:** el alta de Gasto existe **solo** en ExPro; el alta de Tratamiento **solo** en Ganadería; CoMer muestra gastos en lectura.
3. **Reglas cruzadas (regresión):** ejecutar `SigganQA.runAll()` (`js/qa-siggan.js`) y confirmar que los 17 tests siguen en verde tras mover Sanidad a Ganadería.
4. **Bloqueo sanitario:** registrar tratamiento con supresión activa en Ganadería y confirmar que CoMer impide la venta de carne **y** de leche (P1).
5. **Build:** `npm run build:free` + `cap sync android` y verificar en dispositivo que la nueva navegación y el selector de modo global funcionan.
