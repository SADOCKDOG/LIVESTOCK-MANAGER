# Plan de mejora e implementación — integración SIGGAN

**Origen**: auditoría completa de `docs/AUDITAR/` (~150 documentos: PDFs normativos BOE/BOJA/Junta de Andalucía/FEGA, ~120 catálogos CSV oficiales, ZIPs de configuración de lectores RFID de campo), realizada el 2026-07-21 con 6 subagentes especializados en paralelo, más una auditoría dedicada previa que ya cerró el modelo de datos maestro Especie/Crotal (commit `20055ad`).

**Cómo leer este documento**: es el plan maestro. Cada sección enlaza al documento de detalle normativo correspondiente (`docs/NORMATIVA-CROTAL-ESPECIE.md`, `docs/ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md`) donde está la cita exacta de fuente y el razonamiento completo — aquí solo está lo accionable: qué falta, dónde, y en qué orden abordarlo.

**Relacionado**: [NORMATIVA-CROTAL-ESPECIE.md](NORMATIVA-CROTAL-ESPECIE.md), [ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md](ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md), [CUMPLIMIENTO_SIGGAN.md](CUMPLIMIENTO_SIGGAN.md), [el-sistema-de-identificacion-crotal.md](el-sistema-de-identificacion-crotal.md), [AUDITAR/INVENTARIO-AUDITORIA.md](AUDITAR/INVENTARIO-AUDITORIA.md) (qué documento/fichero de `docs/AUDITAR/` está auditado, cuál no aplica, y cuál queda pendiente).

---

## Resumen ejecutivo

La adaptación SIGGAN de Livestock Manager está en buen estado en los flujos ya cubiertos por `CUMPLIMIENTO_SIGGAN.md` (movimientos, sanidad básica, trazabilidad, comercialización). Esta auditoría añade **6 gaps estructurales** no detectados hasta ahora, todos con fuente normativa oficial citada y cruzados contra el código actual (`file:line`). Ninguno es urgente en el sentido de "rompe algo hoy" — son extensiones que acercan la app a paridad de datos con el sistema real (SIGGAN/ADSG WEB), necesarias sobre todo si en algún momento se quiere:

- Generar/importar ficheros de intercambio SIGGAN reales (gaps 1 y 2 son bloqueantes para esto).
- Ofrecer un módulo de vacunación con el mismo nivel de detalle que exige ADSG (gap 3).
- Capturar datos de campo con lectores RFID físicos sin perder información (gap 6).
- Modelar la explotación física con el mismo detalle que SIGGAN (gap 5).
- Modelar el nivel intermedio REGA→especie que SIEX exige formalmente (gap 7, detectado en la auditoría de pendientes prioritarios del 2026-07-22).

## Orden de implementación recomendado

| # | Gap | Esfuerzo | Bloqueante para | Prioridad |
|---|---|---|---|---|
| 1 | Catálogo de razas (163 razas) | ✅ **Implementado** (commit `8675c08`, 2026-07-22) | — | — |
| 2 | Tabla de correspondencia `Espe` SIGGAN | ✅ **Implementado** (commit `e2e8c76`, 2026-07-22) | — | — |
| 3 | Modelo jerárquico de vacunaciones | ✅ **Implementado** (commit `325d812`, 2026-07-22; sin UI todavía) | — | — |
| 4 | Equino: aplicar validación de crotal ya cerrada | ✅ **Implementado** (commit `acde2fa`, 2026-07-22) | — | — |
| 5 | Sub-modelo Instalaciones + geolocalización + restricciones en finca | Medio-alto — nueva tabla + formularios | Nada urgente, mejora de completitud | Baja-media |
| 6 | Campos de captura de campo (hora, lote, nº macho, saneamiento individual) | Bajo por campo, medio en conjunto | Compatibilidad con lectores RFID físicos | Baja (según si el usuario usa esos lectores) |
| 7 | Concepto "Subexplotación" (REGA→especie→clasificación zootécnica) | Alto — cambio de modelo de relación finca↔animal | Cumplimiento formal SIEX/REGA a nivel administrativo | Baja (estructural, evaluar si aporta valor real de uso) |
| — | Máquina de estados GTA completa (12 estados) | Alto | — | **No recomendado implementar** — ver razonamiento abajo |

---

## 1. Catálogo de razas — ✅ IMPLEMENTADO (commit `8675c08`, 2026-07-22)

DB_VERSION 15→16, migración aditiva. Tabla `razas` (keyPath `id`, índice `especieId`) semillada con 163 de las 189 razas del catálogo oficial (filtradas a las 5 especies ya modeladas: 47 bovino, 16 porcino, 51 ovino, 22 caprino, 27 équido). `js/views/animales-view.js`: el campo RAZA es ahora un `<select>` filtrado por especie con opción "OTRA (ESPECIFICAR)" para razas fuera de catálogo. Comparación case-insensitive, sin migración forzosa del campo `raza` (string) de animales existentes — igual que se planteó, se mantiene intacto en paralelo. Detalle completo en [NORMATIVA-CROTAL-ESPECIE.md](NORMATIVA-CROTAL-ESPECIE.md#catálogo-de-razas--implementado-commit-8675c08-2026-07-22).

**Pendiente de este punto, no incluido en la implementación**: mostrar `clasificacion`/`grado_amenaza` en la UI (los campos ya están en la tabla, sin usar todavía); catálogo `Asociación de razas.csv`.

---

## 2. Tabla de correspondencia SIGGAN `Espe` — ✅ IMPLEMENTADO (commit `e2e8c76`, 2026-07-22)

Añadidos los campos `codigo_espe_siggan`/`espe_id_siggan` a `ESPECIES_SEED` en `js/db.js`: Bovino→`02`, Porcino→`03`, Ovino→`04`/`espe_id_siggan: 3`, Caprino→`04`/`espe_id_siggan: 2`, Équido→`01`. Migración de datos (`migrarEspeSiggan()`) para instalaciones que ya tenían la tabla `especies` sembrada antes de este cambio — sin bump de `DB_VERSION` (no crea tablas nuevas, solo añade campos). Verificado en navegador para instalación nueva e instalación existente migrada.

**El catálogo `Tipo_Iden`** (3 valores: bolo ruminal+crotal, inyectable+crotal, crotal electrónico+crotal) ya coincidía con `TIPOS_IDENTIFICADOR_SEED` (ids 2, 3, 4) — no requirió trabajo adicional.

**Sigue pendiente, fuera de este cambio**: esto solo deja los datos maestros listos — no construye ningún exportador/importador SIGGAN real. El campo `Cebo` del fichero (relacionado con "tanda de cebo") sigue sin vincularse. Especificación completa del fichero de 15 campos en [NORMATIVA-CROTAL-ESPECIE.md](NORMATIVA-CROTAL-ESPECIE.md#especificación-oficial-y-exacta-fichero-de-incorporación-de-datos-a-siggan-pequeño-rumiante).

**Advertencia regional ya documentada** (sin acción requerida todavía): los códigos de especie/raza son por región, no nacionales — Andalucía (SIGGAN) y Extremadura (BADIGEX) usan numeraciones invertidas. Esta tabla de correspondencia cubre solo el caso SIGGAN/Andalucía. Detalle completo en [NORMATIVA-CROTAL-ESPECIE.md](NORMATIVA-CROTAL-ESPECIE.md#️-advertencia-importante-los-códigos-de-especierraza-son-por-región-no-nacionales).

---

## 3. Modelo jerárquico de vacunaciones — ✅ IMPLEMENTADO (commit `325d812`, 2026-07-22)

DB_VERSION 16→17, nueva tabla `vacunaciones` (índices `fincaId`, `rebanoId`, `fecha`, `cerrada`) + nuevo módulo `js/vacunaciones.js`, separado del libro de tratamientos genérico (`js/sanitarios.js`, que sigue existiendo sin cambios).

**Modelo implementado**: Vacunación (cabecera: fecha, veterinario, observaciones) con array embebido `tipos_vacuna` (máx. 4 por normativa, truncado automáticamente: `tipo`, `lote`, `dosis`, `nombre_comercial`) y `animales_vacunados` (por categoría agregada o individual). Campo `completa` (% censo susceptible vacunado, exigido por ADSG y ausente en el libro genérico) y flag `cerrada` que bloquea edición/borrado una vez `true`. `anular()` es trazable (marca `anulada`/`motivo_anulacion`/`fecha_anulacion` sin borrar, funciona incluso sobre vacunaciones ya cerradas) — mismo patrón que movimientos.

**Sin UI todavía**: mismo patrón que `Saneamientos` (que tampoco tiene vista propia) — se priorizó dejar la capa de datos completa y verificada; wizard/vista pendiente si se decide abordarla.

Verificado en navegador: rechazo sin tipos de vacuna, alta con múltiples tipos, truncado a 4 máximo, cálculo de total de animales vacunados, edición antes/bloqueada después de cerrar, borrado bloqueado tras cerrar, anulación trazable funcional incluso cerrada, `list()` por rebaño.

---

## 4. Equino — ✅ IMPLEMENTADO (commit `acde2fa`, 2026-07-22)

Nueva entrada `equino_microchip` en `CROTAL_FORMATOS` (`js/error-handler.js`, regex 15 dígitos) + fila `{ especieId: 5, tipoIdentificadorId: 3, formato: 'equino_microchip' }` en `ESPECIE_TIPO_IDENTIFICADOR_SEED` (`js/db.js`), manteniendo el DIE (id 14) sin regex estricta. Migración de datos (`migrarEquinoMicrochip()`) para instalaciones existentes, sin bump de `DB_VERSION`.

**Fix relacionado detectado durante la verificación**: `validateCrotal()` aplicaba por error la regex genérica `ES+12 dígitos` de `validateCaravana` cuando la asociación especie↔tipo existía pero su `formato` era explícitamente `null` (el caso del propio DIE) — corregido para que en ese caso solo se exija que el campo no esté vacío, sin forzar el formato de otra especie.

Verificado en navegador: microchip válido/inválido, DIE con formato heredado variable (ej. `41/053850`) aceptado, DIE vacío rechazado, regresión OK en bovino/ovino/porcino, migración correcta en instalación nueva y existente.

---

## 5. Sub-modelo Instalaciones + geolocalización + restricciones en finca (prioridad baja-media)

**Fuente**: mapa de navegación 1.4 de ADSG WEB (`docs/AUDITAR/ADS005E_MUS_Manual_Usuario_0100.pdf`), auditoría dedicada — ver árbol completo en [ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md](ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md#árbol-completo-del-punto-14-mapa-del-sistema-auditoría-dedicada-2026-07-21).

**Conclusión de esa auditoría, importante**: NO se justifica reestructurar Livestock Manager en módulos separados por especie (como hace ADSG WEB) — la mayoría de nodos (Titulares, Responsables Sanitarios, Censos, Identificación) son casi idénticos entre las 5 especies del manual y ya tienen equivalente razonable en el código. Solo el nodo **"Estructura"** diverge de verdad y es donde hay gap total real:

| Campo/módulo nuevo | Gap hoy | Aplica a |
|---|---|---|
| `latitud`/`longitud` en finca | Gap total, trivial de implementar | Las 5 especies |
| Sub-tabla `instalaciones` (naves/corrales/sistemas) | Gap total | Purines/Estercolero (porcino, cunícola, pequeños rumiantes); Naves (avícola); Sistemas/Características (bovino) |
| Flag `restriccion_movimientos` en `js/saneamientos.js` | Hoy solo existe `calificacion`, sin estado operativo de restricción | Bovino, Porcino, Pequeño Rumiante |
| Distinción "Explotación de Lidia" en filiaciones | Genealogía madre-cría genérica sin este tipo | Solo Bovino |

**No priorizar** salvo que el alcance de la app se amplíe a porcino/avícola industrial — en ese caso sí conviene evaluar una unidad de agrupación por encima del animal individual (nave/lote), ya anticipado conceptualmente por el modelo de "tandas de cebo".

**Actualización (auditoría de pendientes prioritarios, 2026-07-22)**: el Anexo I de Variables Ganaderas del FEGA (`docs/AUDITAR/Catalogos_csv/20250514-Anexo_I_Definicion_de_Variables_Ganaderas_3.6.0...xlsx`, bloque "Edificaciones e instalaciones") confirma que este gap es más grande de lo estimado — no basta con un catálogo de tipos de instalación (`Edificaciones e instalaciones.csv`, 109 tipos, ya inventariado), sino un **formulario completo de 12-13 campos por instalación**: tipo (catálogo), referencia catastral, propia/ajena, coordenadas, cota, superficie m², nº unidades, año de construcción, régimen de tenencia, NIF del arrendador, **plazas máximas de alojamiento ganadero**, **volumen máximo de silos/depósitos en m³**. Si se implementa este gap, el diseño debe contemplar esta ficha completa, no solo un selector de tipo de instalación.

---

## 6. Campos de captura de campo — lectores RFID (prioridad baja, condicional)

**Fuente**: comparación de los `.rdf` de programas de lector físico (Felixcan/Datamars, carpeta `docs/AUDITAR/LECTOR/`) contra los formularios actuales de la app.

Solo relevante si el usuario efectivamente usa o planea usar lectores RFID físicos de campo (Felixcan Universal II, Datamars GES3S) — la vía de entrada realista sigue siendo importar el fichero que exporta el software de PC del lector (UniTransfer/Rumisoft), no que el móvil lea el chip directamente (limitación de frecuencia ya documentada en `js/app.js:1483-1553`).

| Campo que captura el lector | Falta en | Módulo app |
|---|---|---|
| **HORA** (además de fecha) | Altas, Bajas, Cubriciones, Secados, Tratamientos | `js/movimientos.js`, `js/reproduccion.js`, `js/sanitarios.js` |
| **LOTE** (identificador de lote de cubrición) | Cubriciones | `js/reproduccion.js` |
| **NÚMERO DE MACHO** (semental/reproductor) | Montas | `js/reproduccion.js`, wizard en `js/app.js:1990-1997` (hoy solo texto libre en "notas") |
| **NIF VETERINARIO** vinculado a alta de cebadero (Castilla y León) | Altas de cebadero | — |
| Granularidad individual (nº tubo + sexo por animal) | Saneamientos — hoy agregado por campaña (`num_examinados`, `num_positivos`) | `js/saneamientos.js` |

El último punto (saneamientos por animal) es el único con impacto real en trazabilidad SIGGAN si se necesita; el resto son mejoras de formulario de bajo riesgo.

---

## 7. Concepto "Subexplotación" (prioridad baja, gap estructural — añadido 2026-07-22)

**Fuente**: `docs/AUDITAR/2025.09.18-Documento_Tecnico_ganadero_SIEX_3.6_CORRECCION_ERRORES.pdf` (documento técnico SIEX más reciente, 2025) y el XLSX Anexo I de Variables Ganaderas (bloque "Subexplotación", 21 campos).

**Qué falta**: el concepto **"Subexplotación" no existe en absoluto en el código** de Livestock Manager (confirmado por búsqueda exhaustiva en todo `js/`, cero coincidencias). Es la unidad real que usa SIEX/REGA por debajo de la explotación: **una subexplotación = un código REGA + una especie + su clasificación zootécnica**. Es decir, SIEX no relaciona animales directamente con la explotación (finca), sino con una subdivisión de esa explotación por especie.

Livestock Manager hoy organiza los animales directamente bajo "finca" (`js/fincas.js`), sin ese nivel intermedio. El bloque XLSX de 21 campos incluye: censo por categoría, integradora comercial asociada, y datos de cría animal (asociación de criadores/raza/clasificación — coincide con el catálogo de razas ya priorizado en el punto 1 de este plan).

**Por qué prioridad baja pese a ser un gap estructural**: introducir este nivel intermedio implicaría cambiar la relación fundamental animal↔finca en todo el código (un cambio de mayor alcance que cualquier otro punto de este plan). Antes de acometerlo, vale la pena confirmar si realmente aporta valor de uso a un ganadero que gestiona una sola explotación con una o pocas especies — el nivel de detalle formal que exige SIEX (pensado para la administración pública, no para el día a día del ganadero) puede no justificar la complejidad añadida en la mayoría de casos de uso reales de la app. Recomendación: no implementar salvo que se identifique un caso de uso concreto (ej. un ganadero con varias especies en la misma finca que necesite reportar censos separados por subexplotación a SIGGAN).

---

## Máquina de estados GTA — por qué NO se recomienda implementarla completa

**Contexto**: el sistema real de guías telemáticas (GTA) tiene 12 estados (pago de tasa modelo 046 con 2 sub-estados, actores separados origen/destino, delegación a OCA/ganadero destino, firma digital vía @firma con registro @ries, concepto de "autoguía" sin tasa ni firma cuando el titular origen=destino). Livestock Manager modela hoy 4 estados (`borrador`/`presentado`/`aceptado`/`rechazado` + `anulado` trazable).

**Razonamiento de la auditoría**: replicar los 12 estados solo tiene sentido si la app fuese a integrarse en vivo con el backend real de SIGGAN (pagos, firma digital con certificado, notificaciones oficiales) — algo que hoy no hace y que requeriría infraestructura y acuerdos con la Junta de Andalucía muy por encima del alcance actual. La simplificación actual (4 estados + anulación trazable) es razonable para una app de un solo ganadero que lleva su propio registro. Único cambio de bajo riesgo que sí aportaría valor: añadir un flag `autoguia` (mismo titular origen/destino) para reflejar cuándo no aplicaría tasa/firma, sin construir el resto del flujo de pago/firma real.

Detalle completo de los 12 estados en [ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md](ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md) por si se retoma esta decisión más adelante.

---

## Descartado explícitamente (no aplica al alcance actual, con justificación)

- **Núcleos zoológicos / especies exóticas / multiespecie de exhibición** — fuera del perfil de ganadería comercial de producción/reproducción que cubre la app.
- **Vigilancia de salmonela** (`TUTORIAL_MUESTRAS_SALMONELLA.pdf`) — es un programa específicamente **avícola** (Reglamento CE 2160/2003), y la app no modela la especie "Aves" hoy. Retomar solo si se amplía el alcance a avícola.
- **Catálogo `Enfermedades.csv` del FEGA** (603 filas) — es **fitosanitario** (hongos/plagas de plantas), no ganadero pese al nombre engañoso. El catálogo ganadero real de saneamiento ya existe en `js/services/comunidades-service.js:150-158` (`CAMPANAS_SANEAMIENTO`).
- **PIGGAN como integración separada** — corrección de premisa importante: PIGGAN no es un sistema porcino aparte, es el portal general "Punto de Información y Gestión para el Ganadero Andaluz" (todas las especies), hermano de ADSG WEB y GTA bajo el mismo SIGGANnet. No requiere tratamiento diferenciado en el modelo de datos.
- **Crotal porcino** — confirmado correcto con doble fuente (manual ADSG + BOE RD 479/2004 texto íntegro), sin cambios necesarios más allá de la posible fila de "tatuaje" como alternativa de marca (menor, ver tabla del punto 1 de `NORMATIVA-CROTAL-ESPECIE.md`).

---

## Documentos que quedaron sin auditar a fondo (pendiente si se retoma este trabajo)

**Actualizado 2026-07-22** — los 3 documentos que eran prioridad máxima ya están auditados (ver más abajo, sección "Auditoría de pendientes prioritarios cerrada"). Solo quedan de baja prioridad:

- `GTA006E_MUS_Manual_Usuario_0400.odt`, `Anexo_I_Manual_ADSGWeb.ods` — no se pudieron abrir por falta de librería `odfpy` en el entorno de auditoría.
- `Manual_SIGGAN_Diagnosticos.pdf` — identificado como módulo "SIGGAN - Saneamiento Bovino" (ALANA), solo portada leída.
- Sección "Mensajes de error" (3.4) de `ADS005E...pdf` — ~4800 líneas, podría aportar reglas de validación de negocio adicionales.
- Detalle operativo paso a paso (más allá del mapa 1.4) de Avícola, Porcino y Cunícola en ADSG WEB.

### Auditoría de pendientes prioritarios cerrada (2026-07-22)

Los 3 documentos marcados como prioritarios en `docs/AUDITAR/INVENTARIO-AUDITORIA.md` ya están auditados:

- **`2025.09.18-Documento_Tecnico_ganadero_SIEX_3.6_CORRECCION_ERRORES.pdf`** (el más importante) — **confirmado sin cambios** respecto al catálogo `ESPECIE_ANIMAL` ya implementado en `js/db.js` (pese al nombre "corrección de errores", es el documento técnico SIEX v3.6.0 completo, no un changelog puntual). Cero riesgo para el modelo de datos ya cerrado. Aportó 2 hallazgos: catálogo de 23 "Tipos de explotación ganadera" (complementa el ya inventariado) y confirmación del gap "Subexplotación" (ver punto 7 arriba).
- **`GUIA_AD-SIEX-DSI-PortalPublico.pdf`** — API REST del FEGA confirmada "sin autenticación"; CORS sigue sin documentarse explícitamente (pendiente de validar empíricamente). Endpoint nuevo útil no usado hoy: `GET /catalogos/{idTabla}/fecha` (para sincronización incremental de catálogos, solo descargar si cambió). 2 catálogos del grupo GANADERAS reclasificados desde "agrícola" a "ganadero": `Sistemas de sostenibilidad y control.csv`, `Datos de la integradora comercial.csv` (ver `INVENTARIO-AUDITORIA.md`).
- **XLSX Anexo I de Variables Ganaderas** — auditado completo (los 11 bloques restantes, más allá de "Datos individuales de los animales" ya cubierto). Aportó el detalle de campos del gap "Instalaciones" (punto 5, actualizado arriba) y confirmó el gap nuevo "Subexplotación" (punto 7). Los bloques "Gerente de explotación", "Rendimiento económico", "Asociaciones/socios" y "Actividad secundaria" son gaps completos de prioridad baja, no incorporados a este plan por no chocar con nada ya implementado ni aportar valor claro al alcance operativo actual de la app — mencionados aquí solo para constancia de que fueron revisados.

---

## Verificación al implementar cualquiera de estos puntos

Seguir el patrón ya establecido en el proyecto:
1. Migración aditiva (`DB_VERSION` bump, nueva función `migrarVXX()`), nunca destructiva sobre datos existentes.
2. Extender `js/qa-*.js` con la suite de test correspondiente (patrón `window.*QA.runAll()`).
3. Prueba manual en navegador antes de dar por cerrado.
4. Actualizar el documento normativo de origen (`NORMATIVA-CROTAL-ESPECIE.md` o `ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md`) marcando el punto como implementado, con el commit correspondiente.
