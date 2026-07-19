# Especie y Crotal como datos maestros — especificación

**Estado**: implementado (commit `20055ad`, 2026-07-19: tablas `especies`/`tipos_identificador`/`especie_tipo_identificador`, `ErrorHandler.validateCrotal()`, UI en ficha de animal). Ver advertencia importante sobre codificación regional más abajo — pendiente de decidir si se aplica a la implementación actual.
**Relacionado**: [el-sistema-de-identificacion-crotal.md](el-sistema-de-identificacion-crotal.md) (detalle específico ovino Andalucía/Extremadura, normativa vigente RD 787/2023), [CUMPLIMIENTO_SIGGAN.md](CUMPLIMIENTO_SIGGAN.md), [ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md](ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md) (**confirma este modelo**: el fichero real de intercambio de SIGGAN para identificación individual de pequeño rumiante lleva campos explícitos `Espe` y `Tipo_Iden`, aunque con su **propia codificación interna**, distinta de los códigos del catálogo `ESPECIE_ANIMAL`/`RIIA_TIPO_IDENTIFICADOR` del FEGA — ver tabla oficial exacta más abajo).

## Modelo objetivo

```
Especie (dato maestro oficial)
   └── Tipo de identificador / crotal (dato maestro oficial, depende de la especie)
          └── Estructura de código (formato/longitud, depende del tipo de identificador)
```

Hoy el código trata "especie" como texto y aplica **una única regex de crotal para todas las especies**. Eso es incorrecto: el formato del código depende del tipo de identificador, que a su vez depende de la especie.

## Estructuras de código confirmadas por fuente normativa

| Especie / caso | Estructura | Fuente |
|---|---|---|
| Bovino (crotal físico, doble crotal no electrónico) | 1 dígito uso + 1 dígito control + 2 dígitos CC.AA. + 8 dígitos animal (12 caracteres, **sin letras**) | Métodos de identificación oficial, Junta de Andalucía, feb. 2014 |
| Ovino/caprino, identificación electrónica individual (EID), normativa vigente | `ES` + 2 dígitos CC.AA. (01 Andalucía, 10 Extremadura) + 10 dígitos individuales | RD 787/2023 y RD 1307/2024 — ver [el-sistema-de-identificacion-crotal.md](el-sistema-de-identificacion-crotal.md) |
| Porcino / ovino / caprino, marca que identifica la **explotación** de origen (no al animal individual) | máx. 3 dígitos municipio (INE) + siglas provincia + máx. 7 dígitos explotación; `ES` opcional al inicio solo si el animal va a intercambios | RD 205/1996 (arts. 7 y 8), modificado por RD 479/2004 (BOE núm. 89, 13 abril 2004) |
| Código REGA de explotación (no es un crotal, identifica la finca) | `ES` + 2 dígitos provincia (INE) + 3 dígitos municipio (INE) + 7 dígitos explotación | RD 479/2004, art. 5 — **ya implementado correctamente**: `ComunidadesService.validarFormatoREGA()` en `js/services/comunidades-service.js:340-361`, regex `^ES(\d{2})(\d{3})(\d{7})$` |

Notas:
- La regex actual del crotal en el código, `^[A-Z]{2}\d{12}$` (`js/error-handler.js:282`, función `validateCaravana`), **solo coincide con el caso ovino/caprino electrónico**. No es válida para el crotal físico bovino descrito arriba (que no lleva letras) ni refleja la marca de explotación de porcino.
- Pendiente: leer con detalle la normativa de equino (identificación por documento de identificación equina / microchip, estructura distinta) — no cubierta aún en esta especificación.

## Especificación oficial y exacta: fichero de incorporación de datos a SIGGAN (pequeño rumiante)

**Fuente**: `docs/AUDITAR/SIGGAN_Manual_Fichero_Incorporacion.pdf` — "Identificación individual de Pequeños Rumiantes: definición del fichero de incorporación de datos a SIGGAN", AGAPA/Junta de Andalucía, v0400, 10/07/2012. Este documento es la especificación técnica formal (8 páginas) del formato que hasta ahora solo habíamos deducido por un ejemplo en el manual de ADSG WEB — **corrige y precisa** varios detalles.

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
Fuente: `docs/AUDITAR/GUIA_AD-SIEX-DSI-PortalPublico.pdf` (BDCSIXWSP, Guía de Servicios Públicos de SIEX, FEGA, v4.5.0).

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

Ya están en `docs/AUDITAR/Catalogos_csv/` (descarga completa vía `/catalogos/zip`). Contenido relevante:

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

## Próximos pasos (no iniciados)

1. Terminar de acotar la normativa de equino.
2. Diseñar el modelo de datos unificado: tabla `especies` con código SIEX oficial (01 Bovino, 02 Porcino, 03 Ovino, 04 Caprino, 05 Équido — ver tabla arriba) + tabla `tipos_identificador` con código RIIA oficial (excluyendo los dados de baja en altas nuevas) + tabla de asociación especie↔tipos de identificador permitidos + **tabla de correspondencia con la codificación interna de SIGGAN** (`Espe`/`Espe_ID`/`Tipo_Iden` del fichero de incorporación, distinta de los códigos FEGA) + función de validación de crotal que reciba especie+tipo y aplique la regex correcta de las confirmadas en este documento.
3. Decidir el mecanismo de sincronización con la API del FEGA (build-time vs. acción manual vs. runtime con CORS) — de momento se puede semillar directamente desde los CSV ya descargados en `docs/AUDITAR/Catalogos_csv/`.
4. Plan de migración de datos existentes (animales ya dados de alta con los catálogos actuales desincronizados, `Vacas`/`Ovejas`/`Cabras`/`Cerdos` → códigos SIEX 01/03/04/02).
5. Si se aborda la generación/lectura de guías de movimiento compatibles con SIGGAN, revisar `docs/AUDITAR/GTA007E_MUS_Manual_Usuario_0400.pdf` ("GTA - Guía Telemática", solicitudes, generación/firma de guías, pago de tasa Modelo 046, notificaciones por especie, DIBs) — sistema complementario a ADSG WEB, relacionado con `js/views/wizards/wizard-guia-movimiento.js`. No revisado en detalle todavía.

## ⚠️ Advertencia importante: los códigos de especie/raza son POR REGIÓN, no nacionales

**Fuente**: `docs/AUDITAR/LECTOR/ID Andalucia.zip` e `ID Extremadura.zip` — no son informes ni RDF semántico, son ficheros de configuración de menú de un **lector físico de crotales** (dispositivo de campo usado por técnicos/ADSG), uno por Comunidad Autónoma. Formato de texto plano con pares etiqueta+código.

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

### Resto de `docs/AUDITAR/LECTOR/` — pendiente de revisar

Mismos ficheros de configuración de lector, uno por operación (probablemente con estructura similar, por región donde aplique): `Altas`, `Bajas`, `Cebadero_CLM`, `Cebadero_Extremadura`, `Cebaderos_CYL`, `Censo Extremadura` (incluye además un `.rdf` suelto fuera del zip), `Control Lechero`, `Cubriciones`, `Montas`, `Partos`, `Reposiciones`, `Saneamientos`, `Secados`, `Tratamientos`. No abiertos todavía — candidatos a revisar cuando se trabaje en los módulos equivalentes de la app (`js/movimientos.js`, `js/reproduccion.js`, `js/sanitarios.js`, `js/produccion.js`).
