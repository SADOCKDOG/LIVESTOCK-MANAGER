# Especie y Crotal como datos maestros — especificación
> v1.1 · Última revisión: 2026-10-27 · Ver [PLAN-MEJORA-SIGGAN.md](PLAN-MEJORA-SIGGAN.md) para estado de implementación equina.

**Estado de la base de datos maestros**: implementadas las tablas de especie/tipo y la validación contextual inicial. Las afirmaciones históricas de que la identificación equina estaba “cerrada” corresponden al alcance revisado en julio de 2026; no certifican los casos vigentes ni sustituyen la matriz multicaso abierta en noviembre de 2026. La regulación nacional se actualizó después mediante el RD 787/2023 y su modificación por RD 1307/2024. No considerar cerrada la conformidad normativa multiespecie hasta completar el punto P1 de [la auditoría actual](auditorias/2026-11-12-identificacion-y-claves-unicas.md).
**Relacionado**: [el-sistema-de-identificacion-crotal.md](el-sistema-de-identificacion-crotal.md) (detalle específico ovino Andalucía/Extremadura, normativa vigente RD 787/2023), [CUMPLIMIENTO_SIGGAN.md](CUMPLIMIENTO_SIGGAN.md), [ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md](ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md) (**confirma este modelo**: el fichero real de intercambio de SIGGAN para identificación individual de pequeño rumiante lleva campos explícitos `Espe` y `Tipo_Iden`, aunque con su **propia codificación interna**, distinta de los códigos del catálogo `ESPECIE_ANIMAL`/`RIIA_TIPO_IDENTIFICADOR` del FEGA — ver tabla oficial exacta más abajo).

## Modelo objetivo

```
Especie (dato maestro oficial)
   └── Tipo de identificador / crotal (dato maestro oficial, depende de la especie)
          └── Estructura de código (formato/longitud, depende del tipo de identificador)
```

La validación del crotal se resuelve con la asociación especie ↔ tipo de identificador (`especie_tipo_identificador`) y una regla declarada en `ErrorHandler.CROTAL_FORMATOS`. La ficha y el guardado deben leer la misma regla para que ayuda, longitud y rechazo no diverjan. Los callers sin contexto conservan el fallback genérico por compatibilidad.

En nuevas identificaciones individuales de ovino/caprino, la regla vigente ya valida `ES24 + región (2) + individuo (8)`; las alternativas de sacrificio antes de 12 meses del art. 6.2/6.3 siguen sin estar expuestas en la ficha porque requieren registrar y validar ruta y destino.

En bovinos, la fecha de nacimiento selecciona el formato visual. Desde el 30/06/2025 se exige ES22 + región (2) + individuo (8), el tipo de identificación completa y el código ISO 11784 de 23 dígitos en el campo RFID; región y número individual deben coincidir entre la parte visual y la electrónica. Para nacimientos anteriores se conserva el código convencional del anexo II.1. La ficha heredada sin cambios mantiene su identificador previo.

## Estructuras de código confirmadas por fuente normativa

| Especie / caso | Estructura | Fuente |
|---|---|---|
| Bovino nacido hasta la fecha de corte del anexo II.3 del RD 787/2023 | Identificación convencional con el código del anexo II.1; la fecha de nacimiento determina el régimen aplicable. No se debe derivar la regla solo del tipo de crotal actualmente seleccionado en la UI. | RD 787/2023 consolidado, art. 5.1.a y anexo II.1/II.3 |
| Bovino nacido a partir del 30 de junio de 2025 | Doble medio: crotal visual ES22 + 2 dígitos de comunidad autónoma + 8 individuales y transpondedor electrónico ISO 11784 (23 dígitos) vinculado a la misma región/número individual. | RD 787/2023 consolidado, art. 5.1.b y anexo II.2/II.3/II.9 y anexo III |
| Ovino/caprino individual nuevo, tras el periodo transitorio | Código visual `ES` + `24` (especie ovino/caprino) + 2 dígitos de comunidad autónoma + 8 dígitos individuales. La porción electrónica es el identificador ISO 11784 asociado; el sistema conserva en `numero_identificacion` el código visual. | RD 787/2023 consolidado, art. 6, anexo II.5, anexo III tablas I/II y disposición transitoria cuarta |
| Ovino/caprino identificado antes del cambio normativo | La DT 3 mantiene como válidos los animales ya identificados conforme a la norma anterior. Se conserva al editar otros campos; un alta/cambio de identificador no debe presentar el patrón antiguo como regla vigente para una identificación aún pendiente. | RD 787/2023 consolidado, disposición transitoria tercera y cuarta |
| Porcino ordinario: marca que identifica la **explotación de nacimiento**, no al animal individual | Código REGA: `ES` + 2 dígitos provincia + 3 municipio + 7 explotación (12 cifras después de ES). Al pasar por explotaciones sucesivas, la norma también dispone el remarcado con el código de las explotaciones por las que pasen; el sistema debe distinguir marca de nacimiento y remarcados de movimiento. | RD 787/2023 consolidado, art. 7.1 y 7.1 bis y anexo II.10; estructura REGA en RD 479/2004, art. 5. La redacción anterior del RD 205/1996 quedó derogada por el RD 787/2023. |
| Porcino reproductor con identificación individual adicional | `ES` + 2 dígitos de comunidad autónoma/Ceuta/Melilla + 10 dígitos individuales (12 cifras después de ES). Solo cuando la autoridad competente la establezca por motivos sanitarios. | RD 787/2023, art. 7.2 y Anexo II.7. Esta identificación individual tiene la misma longitud total que el código REGA, pero distinto significado y distribución de dígitos; el formulario actual parametriza el caso ordinario. |
| Equino (caso general y excepción de crotal electrónico) | El art. 8 permite como regla general transpondedor inyectable y, solo en condiciones tasadas, crotal electrónico de botón para producción de carne y determinadas categorías de explotación con traslado directo a matadero. Para équidos silvestres/semisilvestres la excepción requiere además traslado directo antes de los 12 meses. El identificador del transpondedor y el número del DIE son campos distintos; no reducir la regla a una longitud compartida. | RD 787/2023 consolidado, arts. 8 y 19 y anexo I; Reglamento de Ejecución (UE) 2021/963 y Reglamento Delegado (UE) 2019/2035 para el documento y sus datos. La fuente autonómica de 2014 queda como referencia histórica, no como regla nacional vigente. |
| Código REGA de explotación (no es un crotal, identifica la finca) | `ES` + 2 dígitos provincia (INE) + 3 dígitos municipio (INE) + 7 dígitos explotación | RD 479/2004, art. 5 — **ya implementado correctamente**: `ComunidadesService.validarFormatoREGA()` en `js/services/comunidades-service.js:340-361`, regex `^ES(\d{2})(\d{3})(\d{7})$` |

Notas:
- **Corrección normativa porcino (2026-11-12)**: no aplicar a nuevas altas porcinas el formato histórico `municipio + siglas provinciales + explotación` ni el `ES` opcional. El RD 787/2023 derogó expresamente el RD 205/1996; la identificación ordinaria actual es el código de explotación REGA. El error previo para `ES123456789029` procedía de una regex obsoleta. Para porcinos reproductores, la autoridad puede exigir adicionalmente identificación individual; aunque también mide ES + 12 cifras, se compone con otros segmentos y no se debe confundir con REGA. Fuentes: [RD 787/2023 consolidado, art. 7 y anexo II](https://www.boe.es/buscar/act.php?id=BOE-A-2023-22499&p=20241224&tn=1) y [RD 479/2004 consolidado, art. 5](https://www.boe.es/buscar/act.php?id=BOE-A-2004-6426&p=20241224&tn=1).
- La regex genérica `^[A-Z]{2}\d{12}$` de `validateCaravana()` es un fallback de compatibilidad, no una regla común para todas las especies. La validación contextual debe seguir la asociación especie/tipo de identificador. Para porcino ordinario se aplica el código REGA de la explotación de nacimiento (`ES` + 12 dígitos); no el patrón histórico de siglas provinciales.
- **⚠️ Compatibilidad local, no conformidad equina cerrada**: `equino_microchip` mantiene temporalmente una regex de 15 cifras para datos existentes, pero ese campo no equivale por sí solo al UELN/código único ni al código ISO 11784 completo del transpondedor. La ayuda ya deja de confundir los conceptos. Hace falta separar y migrar los datos de UELN/código único, número del DIE y código del transpondedor antes de aplicar validación normativa contextual. La asociación actual `{ especieId: 5, tipoIdentificadorId: 3, formato: 'equino_microchip' }` y el DIE libre (`tipoIdentificadorId: 14`) son una base heredada, no un modelo completo de los casos del RD 787/2023 y del Reglamento (UE) 2021/963.

## Especificación oficial y exacta: fichero de incorporación de datos a SIGGAN (pequeño rumiante)

**Fuente**: `Private/limpieza-2026-09/docs/AUDITAR/SIGGAN_Manual_Fichero_Incorporacion.pdf` — "Identificación individual de Pequeños Rumiantes: definición del fichero de incorporación de datos a SIGGAN", AGAPA/Junta de Andalucía, v0400, 10/07/2012. Este documento es la especificación técnica formal (8 páginas) del formato que hasta ahora solo habíamos deducido por un ejemplo en el manual de ADSG WEB — **corrige y precisa** varios detalles. *(archivado 2026-10-27)*

- Fichero de texto plano, extensión `.txt`. Nombre: `AAAAMMDD_DESCRIPCION` (máx. 23 caracteres, sin espacios), ej. `20060801_ES140080009876`.
- Primera fila: cabecera con los nombres de campo. Filas siguientes: una por animal.
- Separador: `;`. Campos, en orden:

| # | Campo | Tipo | Longitud | Obligatorio | Detalle |
|---|---|---|---|---|---|
| 1 | `ID` | Numérico | 12 | Sí | Los 12 últimos dígitos del crotal |
| 2 | `Iden_elec` | Carácter | 16 | Sí | Identificación electrónica del bolo, formato **hexadecimal** |
| 3 | `Pais` | Carácter | 4 | Sí | 4 dígitos numéricos (España = `0724`) |
| 4 | `NumExplo` | Carácter | 14 | Sí | REGA: `ES` + PP (provincia, 2) + MMM (municipio, 3) + NNNNNNN (explotación, 7) |
| 5 | `FNaci` | Carácter | 10 | Sí | Fecha de nacimiento, `YYYY-MM-DD` |
| 6 | `FId` | Carácter | 10 | Sí | Fecha de identificación, `YYYY-MM-DD` |
| 7 | `Espe` | Carácter | 2 | Sí | Código de especie **leído automáticamente del chip** (posiciones 3-4 de las 23 del identificador en formato decimal por grupos) — ver tabla propia abajo, **no coincide con el catálogo `ESPECIE_ANIMAL` del FEGA** |
| 8 | `Espe_ID` | Numérico | 1 | Sí | Especie del animal identificado: `2` = caprino, `3` = ovino |
| 9 | `Dupli` | Numérico | 1 | Sí | Leído del 2º carácter del chip; cuántas veces está duplicado |
| 10 | `Raza` | Numérico | 1-2 | Sí | Código de raza según especie (Anexo — ver tabla abajo) |
| 11 | `Tipo_Iden` | Carácter | 2 | Sí | Por defecto `02`; catálogo propio de 3 valores — ver tabla abajo |
| 12 | `Tec` | Carácter | 10 | Sí | NIF del veterinario que coloca el bolo |
| 13 | `Cr` | Carácter | 15 | **No** | Crotal antiguo o de explotación, si tuviera |
| 14 | `Sexo` | Carácter | 2 | Sí | `01` = Macho, `02` = Hembra |
| 15 | `Cebo` | Numérico | 1 | Sí | `1` = destinado a cebo, `0` = no |

Ejemplo real (fichero de 1 animal):
```
ID;Iden_elec;Pais;NumExplo;FNaci;FId;Espe;Espe_ID;Dupli;Raza;Tipo_Iden;Tec;Cr;Sexo;Cebo
000123456799;8000f9c0075bcd1f;0724;ES1400200001;2006-01-01;2006-01-15;04;2;0;4;02;099999997A;;01;0
```

### Tabla `Espe` (código de especie del chip — SIGGAN, distinta del catálogo FEGA)

| Código | Significado |
|---|---|
| 00 | No codificada en el bolo |
| 01 | Caballos, asnos, mulos y burdéganos |
| 02 | Bovina |
| 03 | Porcina |
| 04 | Ovina **y** caprina (ambas comparten este código; se distinguen por `Espe_ID`) |
| 05 | Gallos, gallinas, patos, gansos, pavos y pintadas |
| 06 | Los demás animales vivos |

### Tabla `Tipo_Iden` (específica de este fichero — subconjunto del catálogo general `RIIA_TIPO_IDENTIFICADOR`)

| Código | Descripción |
|---|---|
| 02 | Bolo ruminal + crotal |
| 03 | Inyectable + crotal |
| 04 | Crotal electrónico + crotal |

### Tabla `Raza` (Anexo, por especie — extracto; el documento trae el listado completo)

Caprino (`Espe_ID=2`): 1 Blanca Celtibérica, 2 Blanca Andaluza, 3 Negra Serrana o Castiza, 4 Payoya, 5 Murciano-Granadina, 6 Malagueña, 7 Florida, 8 Otras puras, 9 Conjunto mestizo, 10 Saanen, 11 Alpina Francesa.

Ovino (`Espe_ID=3`): 1 Merina, 2 Merino Precoz, 3 Segureña, 4 Montesina, 5 Churra Lebrijana, 6 Merino de Grazalema, 7 Manchega, 8 Ile de France, 9 Berrinchon du Cher, 10 Fleischschaf, 11 Landschaf, 12 Charmoise, 13 Suffolk, 14 Romanov, 15 Otras puras, 16 Conjunto mestizo, 17 Lacaune, 18 Muflón, 19 Awassi, 20 Karakul.

### Implicación para el diseño

Esto confirma el modelo (especie → tipo de identificador → estructura de código) pero con un matiz importante: **la app no puede limitarse a usar directamente los códigos del catálogo FEGA `ESPECIE_ANIMAL` para este fichero** — SIGGAN usa su propia codificación interna para los campos leídos del chip (`Espe`, con 04 agrupando ovino+caprino y diferenciándolos vía `Espe_ID`). El diseño del modelo de datos debe contemplar **una tabla de correspondencia** entre el código de especie "oficial" (FEGA, para catálogos y UI) y el código de especie "SIGGAN/chip" (para generar/leer ficheros de intercambio), no asumir que son el mismo código.

## Catálogos oficiales del FEGA (fuente de verdad recomendada)

Servicio público REST del Fondo Español de Garantía Agraria, **sin autenticación**:

```
GET https://www11.fega.es/bdcsixwsp/catalogos/{idCatalogo}?Extension=CSV|XLSX|PDF
GET https://www11.fega.es/bdcsixwsp/catalogos/zip   (todos los catálogos)
```
Swagger: `https://www11.fega.es/bdcsixwsp/swagger-ui/index.html`
Fuente: `Private/limpieza-2026-09/docs/AUDITAR/GUIA_AD-SIEX-DSI-PortalPublico.pdf` (BDCSIXWSP, Guía de Servicios Públicos de SIEX, FEGA, v4.5.0). *(archivado 2026-10-27)*

Catálogos relevantes (grupo GANADERAS, sección 5.1.3 de la guía):

| IdTabla | Descripción |
|---|---|
| `ESPECIE_ANIMAL` | Catálogo oficial de especies de animales |
| `RIIA_TIPO_IDENTIFICADOR` | Catálogo oficial de tipo de identificador (el "tipo de crotal") |
| `CLASIFICACIONES_ZOOTECNICAS` | Clasificación zootécnica |
| `RAZAS` / `CLASIFICACION_RAZAS` | Catálogo oficial de razas de ganado de España |
| `CATEGORIA_ANIMALES` | Categoría de animales |
| `RIIA_SEXO` | Sexo (para datos individuales de animales) |
| `RIIA_TIPO_MUERTE` | Tipo de muerte |
| `ARIES_SCRAPIE` | Resultado genotipado Scrapie |

**Nota de arquitectura**: la app es offline-first (IndexedDB local, service worker cache-first). No debe depender de esta API en tiempo real para operar — el patrón correcto es usarla como **fuente de sincronización puntual/periódica** para poblar/actualizar las tablas locales de catálogo, no como dependencia de runtime. Pendiente de validar: si el endpoint permite CORS para llamarlo directamente desde el navegador, o si hace falta descargar el CSV una vez (en tiempo de build o mediante una acción manual de "sincronizar catálogos" en Ajustes) y versionarlo en el repo.

### Catálogos ya descargados localmente

Ya están en `Private/limpieza-2026-09/docs/AUDITAR/Catalogos_csv/` (descarga completa vía `/catalogos/zip`). Contenido relevante: *(archivado 2026-10-27)*

**`Especies animales.csv`** (`ESPECIE_ANIMAL`) — catálogo con ~190 entradas (incluye acuicultura, apicultura, especies cinegéticas, experimentación, etc., fuera del alcance actual de la app). Las especies de abasto/ganadería relevantes para Livestock Manager:

| Código SIEX | Especie | Código familia | Familia |
|---|---|---|---|
| 01 | Bovinos | 01 | Bóvidos |
| 02 | Cerdos | 02 | Porcino |
| 03 | Ovinos | 03 | Pequeños Rumiantes |
| 04 | Caprinos | 03 | Pequeños Rumiantes |
| 05 | Équidos | 04 | Équidos |
| 06-10 | Gallinas, Pavos, Pintadas, Patos, Ocas | 05 | Aves de corral |

Nota: el campo `config_especies` actual del código (`Vacas`, `Ovejas`, `Cabras`, `Cerdos`) debería mapear a estos códigos oficiales (01, 03, 04, 02) en vez de mantener nombres propios.

**`Tipo de identificador.csv`** (`RIIA_TIPO_IDENTIFICADOR`) — catálogo completo de tipos de identificador oficiales:

| Código | Descripción | Fecha de baja |
|---|---|---|
| 01 | Crotal | 05/09/2011 (**dado de baja**, no usar en altas nuevas) |
| 02 | Bolo ruminal | — |
| 03 | Inyectable electrónico | — |
| 04 | Crotal electrónico | — |
| 05 | Fotografías | — |
| 06 | Reseña | — |
| 07 | Palatograma | — |
| 08 | Identificación biométrica por la retina | — |
| 09 | Tatuaje | — |
| 10 | Fuego | — |
| 11 | Nitrógeno líquido | — |
| 12 | Marcadores genéticos | — |
| 13 | Pulsera electrónica | — |
| 14 | DIE (Documento de Identificación Equina) | — |
| 15 | Pasaporte | 28/06/2012 (**dado de baja**) |
| 16 | Crotal visual | — |

Importante: el catálogo tiene un campo `Fecha de baja` — la lógica de validación debe excluir los tipos dados de baja al ofrecer opciones en altas nuevas (aunque debe seguir reconociéndolos para leer/mostrar animales históricos ya identificados con el código antiguo "01 Crotal").

También descargados y disponibles para uso futuro: `Catálogo oficial de razas de ganado de España.csv`, `Sexo.csv`, `Tipo de muerte.csv`, `Resultado genotipado Scrapie.csv`, `Variedad - Especie - Tipo.csv`.

## Catálogo de razas — IMPLEMENTADO (commit `8675c08`, 2026-07-22)

**Estado**: implementado. DB_VERSION 15→16 (migración aditiva). Nueva tabla `razas` (keyPath `id`, índice `especieId`), semillada con **163 razas** (de las 189 del catálogo oficial, filtradas a las 5 especies ya modeladas: 47 bovino, 16 porcino, 51 ovino, 22 caprino, 27 équido — se excluyen gallinas/ocas/conejos/dromedario, fuera del alcance actual). `js/views/animales-view.js`: el campo RAZA pasa de texto libre a un `<select>` filtrado por especie (mismo patrón que el selector de tipo de crotal), con opción "OTRA (ESPECIFICAR)" que revela un input de texto libre para razas fuera de catálogo o datos legados. Comparación case-insensitive para que datos demo/existentes ("Frisona") casen con el catálogo ("FRISONA") sin requerir migración forzosa de datos — el campo `raza` (string) del animal se mantiene intacto, sin migración automática a `razaId`.

**`Catálogo oficial de razas de ganado de España.csv`** (`RAZAS`/`CLASIFICACION_RAZAS`) — 189 razas reales en la fuente, columnas `Código;Raza;Especie;Clasificación;Grado de amenaza`, cubriendo Bovinos, Cerdos, Ovinos, Caprinos, Gallinas, Ocas, Conejos, Équidos, Dromedario. Complementado por `Clasificación en el catálogo oficial de razas de ganado de España.csv` (4 categorías: 1001 Raza Autóctona, 1002 Raza Autóctona Amenazada, 1003 Raza Integrada en España, 1004 Otras razas reconocidas en España) — ambos campos (`clasificacion`, `grado_amenaza`) ya están en la tabla `razas`, aunque todavía no se muestran en la UI.

**Pendiente, fuera de este cambio**: `Asociación de criadores` (catálogo `Asociación de razas.csv`, ~170 entidades), `Resultado genotipado Scrapie` (28 combinaciones alélicas, obligatorio en vigilancia ovino/caprino), `Tipo de muerte` (solo 3 valores oficiales, más simple que el `MOTIVOS_BAJA` ya implementado), y el campo `Morfotipo` (sin catálogo CSV correspondiente en la fuente descargada). Ver `docs/PLAN-MEJORA-SIGGAN.md` para el resto de gaps.

**⚠️ No confundir con el catálogo de razas propio del fichero de incorporación SIGGAN** (sección de arriba, "Tabla `Raza`") — ese es mucho más corto (solo caprino/ovino, ~15-20 valores) y usa **códigos numéricos distintos** a este catálogo general de 163/189 razas. Si se construye el exportador SIGGAN (punto 2 de `PLAN-MEJORA-SIGGAN.md`), hace falta tabla de correspondencia entre ambos, no asumir que son el mismo código.

## Estado actual del código (auditoría, sin cambios aplicados aún)

- **Dos catálogos de especie desincronizados**:
  - `config_especies` (tabla IndexedDB real, la que rellena el `<select>` de alta de animal): `Vacas`, `Ovejas`, `Cabras`, `Cerdos` — nombres coloquiales. `js/db.js:42-47,290,497-509`; consumo en `js/views/animales-view.js:225-226,276-279`.
  - `ESPECIES_AUTORIZABLES` (constante hardcodeada, usada en el wizard de finca y pedido de crotales): `Bovino`, `Ovino`, `Caprino`, `Porcino`, `Equino`, `Avícola`, `Apícola` — nomenclatura zootécnica oficial. `js/services/comunidades-service.js:90-92,391`.
  - Se conectan solo indirectamente vía `getGrupoEspecie()` (regex de sinónimos), `js/services/comunidades-service.js:430-437`.
  - No hay validación que impida guardar un animal con una especie fuera de `config_especies` (`js/animales.js:101` acepta cualquier string).
- **`finca.especies_autorizadas`** (array, wizard de finca) se guarda pero no se usa en ningún otro sitio del código — no hay validación cruzada animal↔finca.
- **Crotal**: una única regex para todas las especies (`js/error-handler.js:271-299`, `CROTAL_REGEX = /^[A-Z]{2}\d{12}$/`), invocada desde `js/animales.js:36`, `js/movimientos.js:99-100`, `js/views/wizards/wizard-guia-movimiento.js:156-158`. Hay control de unicidad (índice `caravana` en IndexedDB, `js/db.js:177`), pero no diferenciación de formato por especie.
- Validación UI en tiempo real (`AnimalesView._validarCrotalUI`, `js/views/animales-view.js:664-698`) da feedback visual pero no bloquea el guardado; el escáner QR/código de barras (`js/app.js:1684-1873`) no valida formato al capturar, solo pasa a mayúsculas.
- No hay catálogo de "tipo de identificador" en el código (ni `config_especies` ni `ESPECIES_AUTORIZABLES` lo cubren) — es la pieza que faltaba y que aporta `RIIA_TIPO_IDENTIFICADOR` del FEGA.

## Próximos pasos

**Estado actualizado 2026-07-21** — ver [PLAN-MEJORA-SIGGAN.md](PLAN-MEJORA-SIGGAN.md) para el plan de implementación completo y priorizado (no solo este documento). Resumen de lo que queda de esta especificación en concreto:

1. **Équidos: modelar los identificadores/casos completos** — la revisión normativa está acotada, pero la implementación sigue pendiente. La ayuda de `equino_microchip` ya identifica el campo como formato local actual y advierte que UELN y transpondedor son datos distintos; falta separar el código único compatible con UELN, el identificador leído del transpondedor y el número/documento DIE, además de modelar la excepción de crotal electrónico para sacrificio con sus condiciones.
2. ~~Diseñar el modelo de datos unificado~~ — **hecho e implementado** (commit `20055ad`: tablas `especies`/`tipos_identificador`/`especie_tipo_identificador`, `ErrorHandler.validateCrotal()`).
3. **Tabla de correspondencia con la codificación interna de SIGGAN** (`Espe`/`Espe_ID`/`Tipo_Iden` del fichero de incorporación, distinta de los códigos FEGA) — sigue sin implementar, es requisito bloqueante para cualquier exportador SIGGAN real. Ver plan.
4. **Catálogo de razas** (189 razas) — nuevo gap detectado en la auditoría 2026-07-21, ver sección dedicada arriba. No estaba en el alcance original de este documento.
5. Decidir el mecanismo de sincronización con la API del FEGA (build-time vs. acción manual vs. runtime con CORS) — de momento se puede semillar directamente desde los CSV ya descargados en `Private/limpieza-2026-09/docs/AUDITAR/Catalogos_csv/`. Sigue pendiente, sin decidir. *(archivado 2026-10-27)*
6. Plan de migración de datos existentes (animales ya dados de alta con los catálogos actuales desincronizados, `Vacas`/`Ovejas`/`Cabras`/`Cerdos` → códigos SIEX 01/03/04/02). Sigue pendiente.
7. Si se aborda la generación/lectura de guías de movimiento compatibles con SIGGAN: la máquina de estados real de GTA (12 estados, pago de tasa, firma digital) ya está documentada en detalle en [ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md](ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md) — la recomendación de la auditoría 2026-07-21 es NO replicarla completa (complejidad de integración real que la app no tiene), solo evaluar el flag "autoguía" si aporta valor.

## ⚠️ Advertencia importante: los códigos de especie/raza son POR REGIÓN, no nacionales

**Fuente**: `Private/limpieza-2026-09/docs/AUDITAR/LECTOR/ID Andalucia.zip` e `ID Extremadura.zip` — no son informes ni RDF semántico, son ficheros de configuración de menú de un **lector físico de crotales** (dispositivo de campo usado por técnicos/ADSG), uno por Comunidad Autónoma. Formato de texto plano con pares etiqueta+código. *(archivados 2026-10-27)*

**Hallazgo**: comparando ambos ficheros, la codificación de especie **no coincide** entre Andalucía y Extremadura:

| | Andalucía (SIGGAN) | Extremadura (BADIGEX) |
|---|---|---|
| Ovino | 3 | 2 |
| Caprino | 2 | 3 |

(Andalucía coincide con el `Espe_ID` del fichero SIGGAN ya documentado arriba — 2=caprino, 3=ovino. Extremadura usa exactamente lo contrario.)

Los **códigos de raza tampoco coinciden** — son numeraciones completamente distintas e independientes:
- Andalucía (ya documentado arriba): Ovino 1=Merina, 3=Segureña, 4=Montesina... Caprino 1=Blanca Celtibérica, 2=Blanca Andaluza...
- Extremadura: Ovino `016`=Merina, `017`=Talaverana, `018`=Churra, `019`=Manchega, `023`=Ille France, `024`=Merino Precoz, `025`=Landschaf, `026`=Fleischaf, `027`=Berrinchon, `028`=Otras Nac., `029`=Otras Ext., `902`=Desconocida. Caprino: `020`=Serrana, `021`=Murciano-Gran, `022`=Malagueña, `030`=Verata, `031`=Saanen, `032`=Retinta Extr., `033`=Canaria, `034`=Cruzada, `035`=Otras, `903`=Desconocida.

El catálogo `TIPO ID` de Extremadura sí coincide en significado con el RIIA del FEGA (`01`=Crotal, `02`=Bolo ruminal, `03`=Inyectable, `04`=Crotal electrónico), con la salvedad de que localmente Extremadura sigue ofreciendo `01 Crotal` como opción activa aunque el catálogo nacional del FEGA lo marca dado de baja en 2011 — puede ser una particularidad regional o un dato desactualizado del propio lector.

### Implicación para la implementación ya hecha

La implementación actual (`js/db.js`, tablas `especies`/`tipos_identificador`/`especie_tipo_identificador`) usa **una sola codificación nacional** (la del catálogo `ESPECIE_ANIMAL` del FEGA, códigos SIEX 01-05), que es correcta como *identificador interno* de la app y para el **formato del crotal en sí** (que sí es nacional, normativa RD 787/2023). Lo que este hallazgo afecta es **si en algún momento se genera/lee un fichero de intercambio directo con el sistema autonómico** (SIGGAN o BADIGEX) — en ese caso hará falta una **tabla de correspondencia por región** (especie SIEX → código regional) en vez de asumir un único mapeo, ya que Andalucía y Extremadura no comparten numeración. No se ha tocado código por esto todavía — es una decisión a tomar cuando se aborde la integración real de ficheros de intercambio (fuera del alcance de esta sesión).

### Resto de `Private/limpieza-2026-09/docs/AUDITAR/LECTOR/` — identificado el dispositivo y el flujo completo *(archivado 2026-10-27)*

**Fuente añadida**: `Private/limpieza-2026-09/docs/AUDITAR/LECTOR/UniTransfer_1.37.zip` (instalador del software de PC) + fichas técnicas `EI2061.pdf`, `Guia Instalación.pdf`, `GUIA RAPIDA MANEJO LECTOR UNIVERSAL.pdf`, `Posibles_Errores.pdf`. *(archivado 2026-10-27)*

**Dispositivo identificado**: **Lector Universal II**, de **Felixcan Animal ID** (Albacete, España; código de fabricante ICAR 941; www.felixcan.com). Es un lector RFID de mano específico para ganadería:

- **Compatibilidad**: ISO 11784, ISO 11784-AMD1, ISO 11785, UNE-ISO 11784/11785, UNE 68402. Lee tecnologías **FDX-B y HDX** (las dos variantes de RFID LF 134.2 kHz usadas en crotales/bolos electrónicos oficiales).
- Distancia de lectura hasta 35 cm, pantalla LCD 128×64, teclado alfanumérico de 16 teclas, memoria no volátil de 512 kb (>20.000 lecturas), reloj interno, IP65.
- **Conexión al PC**: cable USB 2.0 (el paquete base). Existen módulos opcionales de **Bluetooth**, RS232 y GPRS como accesorios, pero no vienen de serie.
- Accesorio "antena panel": convierte el lector en un sistema de lectura dinámica autónomo para manga de manejo (lee automáticamente todos los crotales que pasen por el alcance de la antena, sin necesitar PC conectado).

**Software de PC: UniTransfer** — confirma exactamente el rol de los ficheros `.rdf` que ya habíamos analizado:

1. En el lector se carga un **"programa"** (fichero `.uni`, cargado vía `interno/HHR Loader/HHR ProgramLoader.exe`) que define los menús y campos a capturar — esto es lo que contienen los `.rdf` extraídos de cada zip (`ID Andalucia`, `ID Extremadura`, `Altas`, `Bajas`, `Partos`, `Cubriciones`, `Montas`, `Saneamientos`, `Tratamientos`, `Secados`, `Reposiciones`, `Control Lechero`, `Cebadero_CLM`/`_Extremadura`/`_CYL`, `Censo Extremadura`) — **uno por operación de campo y, cuando aplica, por Comunidad Autónoma** (coherente con el hallazgo de codificación regional ya documentado arriba). El propio `UniTransfer_1.37.zip` incluye de fábrica `programas/Gen_Gestion7.uni` ("Genérico de Gestión").
2. En campo: el ganadero/técnico enciende el lector, selecciona el programa/menú, lee el crotal electrónico (pulsando el botón RFID) y rellena a mano los campos que pida ese programa (fecha, litros, tipo de tratamiento, etc. — igual que vimos en `Control Lechero.rdf`). Si el chip ya existía en memoria, el lector avisa "El microchip ya existe" y permite editar sus datos asociados.
3. De vuelta en la oficina: se conecta el lector al PC por USB y se ejecuta **UniTransfer → "Recibir datos"**. El programa **convierte automáticamente** lo capturado a: Excel, Word, o **"formatos oficiales de identificación de las distintas CC.AA."** (cita textual de `EI2061.pdf`) — es decir, UniTransfer ya sabe generar el fichero de intercambio SIGGAN/BADIGEX directamente desde una lectura de campo.

**Implicación para la app**: esto resuelve la pregunta de "cómo entra el RFID en la app". La vía realista **no es** que el teléfono lea el chip (confirmado inviable por incompatibilidad de frecuencia, ver `js/app.js:1483-1553`), sino:

- **Opción A (mínima)**: soportar la **importación del Excel que exporta UniTransfer** tras una sesión de lectura de campo — mapeando sus columnas (variables según el programa/`.rdf` cargado) a los formularios de alta/movimiento/reproducción/sanidad ya existentes en la app. No requiere hardware nuevo ni acceso al protocolo propietario del lector.
- **Opción B (a futuro, si se justifica)**: comunicación directa lector↔PC/móvil sin pasar por UniTransfer, vía el módulo Bluetooth opcional — requeriría documentación del protocolo serie de Felixcan (no incluida en lo aportado hasta ahora) y `navigator.bluetooth`/Web Serial.
- La opción A es la que aprovecha directamente todo lo ya documentado (estructura de los `.rdf` = qué campos trae cada exportación) sin más incertidumbre técnica.

**Pendiente real**: no tenemos todavía una muestra real de un fichero exportado por UniTransfer (Excel ni el "formato oficial CCAA") para confirmar el mapeo exacto de columnas — sería el siguiente artefacto útil si se decide implementar la Opción A.

### Segundo fabricante confirmado: Datamars (GES3S / Rumisoft) — mismo ecosistema, más piezas

**Fuente**: `Private/limpieza-2026-09/docs/AUDITAR/LECTOR/GES3S - Configuración de Equivalencias v.1.0.pdf` + página oficial de descargas `https://www.livestock.datamars.es/descargas` (aportada por el usuario). *(archivado 2026-10-27)*

Hay **dos fabricantes/ecosistemas distintos** detrás de los ficheros `.rdf` de este proyecto, ambos con el mismo tipo de flujo:

| | Felixcan | Datamars |
|---|---|---|
| Lector | Lector Universal II (EI2061) | GES3S |
| Software PC | UniTransfer | **Rumisoft** (v1.5.11) |
| Formato export crudo | — (Excel / formato CCAA directo) | CSV: `EIC, Date, Time` (+ hasta 4 campos propios vía fichero de "equivalencias") |
| Ficheros de programa/menú | `.uni` (`andalucia7.uni`, `extremadura_Continua3.uni`) cargados con `HHR ProgramLoader.exe` | `.rdf` ("definiciones", cargadas como "Definicion seleccionada" al iniciar un control) |

**Hallazgo clave**: la página de descargas de Datamars confirma que sus 19 "definiciones" para GES3S son **exactamente el mismo catálogo de operaciones** que el usuario ya ha ido compartiendo (Altas, Bajas, Censos regionales, Control Lechero, Cubriciones, Montas, Partos, Reposiciones, Secados, Saneamientos, Tratamientos, Identidades regionales), más una que no teníamos: **Ecografías**.

**Lo más importante — conversores oficiales ya existentes**: Datamars distribuye para GES3S un **"Conversor SIGGAN (Junta de Andalucía)"** y un **"Conversor XML (Junta de Castilla y León)"**. Esto significa que la generación del fichero oficial de intercambio con SIGGAN a partir de una lectura de campo **ya está resuelta por el fabricante del lector** — no haría falta que la app reimplementase esa conversión desde cero; el camino más corto sería:
1. El ganadero/técnico lee en campo con el GES3S + programa "Andalucía" (SIGGAN).
2. Convierte con Rumisoft + el Conversor SIGGAN oficial → obtiene el fichero de intercambio SIGGAN ya con el formato exacto de 15 campos documentado arriba en este mismo documento.
3. La app **importaría ese fichero de intercambio SIGGAN** (formato ya 100% conocido y documentado aquí) en vez de intentar interpretar el export crudo del lector — evita depender de ingeniería inversa del CSV crudo de Rumisoft/UniTransfer.

**Pendiente real (actualizado)**: no se ha descargado todavía ningún fichero de `https://www.livestock.datamars.es/descargas` (instaladores, manuales de Rumisoft, ni los conversores SIGGAN/XML) — se ha consultado solo el listado de la página. Si se quiere avanzar en la Opción A, el artefacto más valioso a por el que ir sería el **manual de Rumisoft** (documenta el conversor SIGGAN) y, si es descargable, una **muestra de fichero SIGGAN generado por el conversor oficial** para contrastar contra la especificación ya documentada del fichero de incorporación.


## Revisión equina y flujo de edición — 2026-11-14

La revisión de las fuentes oficiales confirma la matriz para équidos: el medio general es transpondedor inyectable aplicado por veterinario; el crotal electrónico de botón es una excepción limitada a destino de producción de carne, categorías de explotación expresamente enumeradas y traslado directo a matadero. En équidos nacidos en explotaciones silvestres o semisilvestres se añade el límite de traslado antes de los 12 meses. La identificación se aplica en explotación de nacimiento y antes de abandonarla. La sustitución o retirada de medios requiere autorización en los casos del artículo 15.

El Reglamento (UE) 2021/963 trata separadamente código único/UELN, lectura del transpondedor, DIE y métodos alternativos autorizados. El método alternativo exige verificación antes de su registro en el documento permanente y la base de datos. La ficha actual permanece como captura documental auxiliar y no ofrece las excepciones ni declara conformidad regulatoria.

Flujo de mantenimiento acordado: conservar estado y metadatos si el valor no cambia; archivar como histórico el valor activo sustituido o eliminado; crear valores nuevos como pendientes. La interfaz equina permite registrar estado pendiente, vigente o legado, y exige verificador, fecha y referencia documental para marcar el registro como vigente. Cambiar la lectura o representación del transpondedor reinicia la verificación y archiva el valor anterior. Este estado es evidencia local de revisión, no una autorización oficial. La evaluación de lectores físicos LF sigue pendiente.

Fuentes primarias consultadas el 14-11-2026: [RD 787/2023 consolidado, arts. 8, 15 y 16](https://www.boe.es/buscar/act.php?id=BOE-A-2023-22499&p=20241224&tn=1) y [Reglamento de Ejecución (UE) 2021/963](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX%3A32021R0963).
