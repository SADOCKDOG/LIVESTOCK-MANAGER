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

## Orden de implementación recomendado

| # | Gap | Esfuerzo | Bloqueante para | Prioridad |
|---|---|---|---|---|
| 1 | Catálogo de razas (189 razas) | Bajo — mismo patrón ya probado | Cumplimentar campo `Raza` de cualquier fichero SIGGAN; validación de dato | **Alta** |
| 2 | Tabla de correspondencia `Espe` SIGGAN | Bajo — solo datos, sin UI nueva | Cualquier exportador/importador SIGGAN real | **Alta** |
| 3 | Modelo jerárquico de vacunaciones | Medio — nueva tabla + UI | Alinear con ADSG WEB; informes oficiales de vacunación | Media |
| 4 | Equino: aplicar validación de crotal ya cerrada | Bajo — 2 líneas de código | Nada (mejora aislada) | Media (ya diagnosticado, solo falta aplicar) |
| 5 | Sub-modelo Instalaciones + geolocalización + restricciones en finca | Medio-alto — nueva tabla + formularios | Nada urgente, mejora de completitud | Baja-media |
| 6 | Campos de captura de campo (hora, lote, nº macho, saneamiento individual) | Bajo por campo, medio en conjunto | Compatibilidad con lectores RFID físicos | Baja (según si el usuario usa esos lectores) |
| — | Máquina de estados GTA completa (12 estados) | Alto | — | **No recomendado implementar** — ver razonamiento abajo |

---

## 1. Catálogo de razas (prioridad alta)

**Qué falta**: `raza` es hoy texto libre en el animal (`js/db.js:93-95`, input en `js/views/animales-view.js:321`). Sin catálogo, sin FK a especie, sin clasificación.

**Fuente de datos ya descargada**: `docs/AUDITAR/Catalogos_csv/Catálogo oficial de razas de ganado de España.csv` (189 razas: Bovinos, Cerdos, Ovinos, Caprinos, Gallinas, Ocas, Conejos, Équidos, Dromedario) + `Clasificación en el catálogo oficial de razas de ganado de España.csv` (4 categorías: Autóctona, Autóctona Amenazada, Integrada en España, Otras reconocidas).

**Diseño propuesto** (mismo patrón que `especies`/`tipos_identificador` en `js/db.js`):
```js
const RAZAS_SEED = [
  { id: 1, codigo_siex: '10010', nombre: '...', especieId: 1, clasificacion: 1001, grado_amenaza: null },
  // ... 189 filas, semilladas desde el CSV
];
```
Tabla `razas` (keyPath `id`), índice por `especieId`. UI: convertir el `<input type="text" id="a-raza">` en un `<select>` filtrado por la especie ya seleccionada en el formulario (mismo patrón ya implementado para el selector "TIPO DE CROTAL").

**⚠️ Cuidado con la confusión de catálogos**: existe un segundo catálogo de razas, mucho más corto, específico del fichero de incorporación SIGGAN (ver punto 2) — usa códigos numéricos **distintos** (1-20 por especie, solo caprino/ovino). Si se implementa el exportador SIGGAN del punto 2, hace falta una tabla de correspondencia `raza.codigo_siex → raza_siggan.codigo`, no asumir que son el mismo campo.

**Migración de datos existentes**: los animales ya dados de alta tienen `raza` como texto libre (`'Frisona'`, `'Limusina'`, `'Assaf'`, etc.). Igual que se hizo con especie/tipo-identificador, mantener el campo string original intacto y añadir `razaId` en paralelo (nullable), sin migración automática agresiva — al editar un animal existente, la UI puede sugerir el match más cercano del catálogo por nombre, pero el usuario confirma.

---

## 2. Tabla de correspondencia SIGGAN `Espe` (prioridad alta, requisito bloqueante)

**El problema**: el fichero real de incorporación a SIGGAN usa una codificación de especie **distinta** de la ya implementada (catálogo SIEX del FEGA, `js/db.js` `ESPECIES_SEED`):

| Codificación | 01 | 02 | 03 | 04 | 05 |
|---|---|---|---|---|---|
| **SIEX/FEGA** (ya en `js/db.js`) | Bovino | Porcino | Ovino | Caprino | Équido |
| **`Espe` (SIGGAN, fichero incorporación)** | Équido | Bovino | Porcino | Ovino+Caprino combinados (distinguidos por `Espe_ID`: 2=caprino, 3=ovino) | Aves |

Especificación completa del fichero de 15 campos (`ID;Iden_elec;Pais;NumExplo;FNaci;FId;Espe;Espe_ID;Dupli;Raza;Tipo_Iden;Tec;Cr;Sexo;Cebo`) ya documentada en detalle en [NORMATIVA-CROTAL-ESPECIE.md](NORMATIVA-CROTAL-ESPECIE.md#especificación-oficial-y-exacta-fichero-de-incorporación-de-datos-a-siggan-pequeño-rumiante) — no se repite aquí.

**Buena noticia**: el catálogo `Tipo_Iden` (3 valores: bolo ruminal+crotal, inyectable+crotal, crotal electrónico+crotal) **ya coincide** con `TIPOS_IDENTIFICADOR_SEED` (ids 2, 3, 4) — no requiere trabajo adicional.

**Diseño propuesto**: no una tabla nueva completa, sino un campo adicional en la tabla `especies` ya existente:
```js
{ id: 1, codigo_siex: '01', nombre_oficial: 'Bovino', ..., codigo_espe_siggan: '02' },
{ id: 2, codigo_siex: '02', nombre_oficial: 'Porcino', ..., codigo_espe_siggan: '03' },
{ id: 3, codigo_siex: '03', nombre_oficial: 'Ovino', ..., codigo_espe_siggan: '04', espe_id_siggan: 3 },
{ id: 4, codigo_siex: '04', nombre_oficial: 'Caprino', ..., codigo_espe_siggan: '04', espe_id_siggan: 2 },
{ id: 5, codigo_siex: '05', nombre_oficial: 'Équido', ..., codigo_espe_siggan: '01' },
```

**Nota de alcance**: este trabajo por sí solo NO construye un exportador funcional — solo deja los datos maestros listos para que, cuando se decida abordar la exportación/importación real de ficheros SIGGAN, no haga falta re-descubrir el mapeo. El campo `Cebo` del fichero debería vincularse al concepto de "tanda de cebo" ya modelado en la app (ver memoria `cebo-tandas-siggan-model`).

**Advertencia regional ya documentada** (sin acción requerida todavía): los códigos de especie/raza son por región, no nacionales — Andalucía (SIGGAN) y Extremadura (BADIGEX) usan numeraciones invertidas. Esta tabla de correspondencia cubre solo el caso SIGGAN/Andalucía. Detalle completo en [NORMATIVA-CROTAL-ESPECIE.md](NORMATIVA-CROTAL-ESPECIE.md#️-advertencia-importante-los-códigos-de-especierraza-son-por-región-no-nacionales).

---

## 3. Modelo jerárquico de vacunaciones (prioridad media)

**Qué falta**: `js/sanitarios.js` trata "Vacunación" como una entrada plana más en una lista de tipos de tratamiento genérico — sin lote, sin dosis, sin nombre comercial, sin estado de cierre.

**Modelo real exigido por ADSG** (fuente: `docs/AUDITAR/ADSGVacunacionesRumiantes.pdf`), jerarquía de 3 niveles:

1. **Vacunación** (cabecera): fecha, NIF del veterinario, observaciones, estado `abierta`/`cerrada` — una vez cerrada, ni ella ni sus tipos/lotes/animales se pueden modificar (mismo patrón de "anulación trazable, no borrado" que ya usas en movimientos, `js/movimientos.js:172-175`).
2. **Tipo de Vacuna** (máx. 4 por vacunación): tipo de vacuna (catálogo), lote, dosis, nombre comercial.
3. **Lotes/Animales vacunados**: totales por categoría en la UP, distinguiendo "animales totales" de "animales vacunados"; selección por edad/especie, por fichero de recensado, o repitiendo una vacunación anterior. Genera dos informes oficiales: "INFORME DE CERTIFICACIÓN DE VACUNA" e "INFORME DE VACUNACIÓN".

**Diseño propuesto**: nuevas tablas `vacunaciones` (cabecera, con flag `cerrada`) + `vacunaciones_tipos` (hasta 4 por vacunación, con `lote`/`dosis`/`nombre_comercial`) + relación con animales (por categoría agregada o individual, reutilizando el patrón ya usado en saneamientos para selección por lote).

**Nota menor relacionada**: el campo "completa" (indica si se vacunó el 100% del censo susceptible) tampoco existe hoy — mismo documento fuente, gap menor, se puede añadir junto con este trabajo.

---

## 4. Equino — aplicar la validación de crotal ya cerrada normativamente (prioridad media, esfuerzo bajo)

Este es el gap con la ratio esfuerzo/beneficio más favorable de todo el plan — la investigación normativa ya está cerrada, solo falta aplicar el cambio en código.

**Estructura confirmada** (detalle completo en [NORMATIVA-CROTAL-ESPECIE.md](NORMATIVA-CROTAL-ESPECIE.md)): microchip obligatorio siempre, Número Permanente Único/UELN de 15 dígitos (`724` + 3 dígitos organización + 9 dígitos correlativo, ej. `724901000007790`), basado en ISO 11784/11785. El DIE (documento/pasaporte) en sí no tiene formato fijo — no forzar regex ahí.

**Cambios concretos**:
- `js/error-handler.js`, objeto `CROTAL_FORMATOS` (línea ~307): añadir
  ```js
  equino_microchip: {
    regex: /^\d{15}$/,
    descripcion: "15 dígitos (UELN + correlativo, ISO 11784, ej. 724901000007790)",
  },
  ```
- `js/db.js`, `ESPECIE_TIPO_IDENTIFICADOR_SEED` (línea 56): sustituir `{ especieId: 5, tipoIdentificadorId: 14, formato: null }` por dos filas — mantener el DIE (id 14) sin formato estricto, y añadir `{ especieId: 5, tipoIdentificadorId: 3, formato: 'equino_microchip' }` (el microchip es complementario obligatorio al DIE, no una alternativa).
- Esto requiere un bump de `DB_VERSION` y migración aditiva, mismo patrón que `migrarV15()`.

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

- `2025.09.18-Documento_Tecnico_ganadero_SIEX_3.6_CORRECCION_ERRORES.pdf` — es la versión **más reciente** (2025) del documento técnico SIEX, podría contener correcciones a los catálogos `ESPECIE_ANIMAL`/`RIIA_TIPO_IDENTIFICADOR` ya usados en `js/db.js`. Recomendado auditarlo antes de dar esos catálogos por definitivamente cerrados.
- `GTA006E_MUS_Manual_Usuario_0400.odt`, `Anexo_I_Manual_ADSGWeb.ods` — no se pudieron abrir por falta de librería `odfpy` en el entorno de auditoría.
- `Manual_SIGGAN_Diagnosticos.pdf` — identificado como módulo "SIGGAN - Saneamiento Bovino" (ALANA), solo portada leída.
- `GUIA_AD-SIEX-DSI-PortalPublico.pdf` — no auditado en esta pasada.
- Sección "Mensajes de error" (3.4) de `ADS005E...pdf` — ~4800 líneas, podría aportar reglas de validación de negocio adicionales.
- Detalle operativo paso a paso (más allá del mapa 1.4) de Avícola, Porcino y Cunícola en ADSG WEB.

---

## Verificación al implementar cualquiera de estos puntos

Seguir el patrón ya establecido en el proyecto:
1. Migración aditiva (`DB_VERSION` bump, nueva función `migrarVXX()`), nunca destructiva sobre datos existentes.
2. Extender `js/qa-*.js` con la suite de test correspondiente (patrón `window.*QA.runAll()`).
3. Prueba manual en navegador antes de dar por cerrado.
4. Actualizar el documento normativo de origen (`NORMATIVA-CROTAL-ESPECIE.md` o `ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md`) marcando el punto como implementado, con el commit correspondiente.
