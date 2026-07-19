# Especie y Crotal como datos maestros — especificación

**Estado**: especificación recopilada, implementación pendiente.
**Relacionado**: [el-sistema-de-identificacion-crotal.md](el-sistema-de-identificacion-crotal.md) (detalle específico ovino Andalucía/Extremadura, normativa vigente RD 787/2023), [CUMPLIMIENTO_SIGGAN.md](CUMPLIMIENTO_SIGGAN.md), [ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md](ADSG-WEB-SIGGAN-FLUJOS-ESTRUCTURA.md) (**confirma este modelo**: el fichero real de intercambio de SIGGAN para identificación individual de pequeño rumiante lleva campos explícitos `Espe` y `Tipo_Iden` con los mismos códigos oficiales del FEGA, y expone 3 formatos de crotal — 14 caracteres normal, 20 electrónico agrupado, 16 hexadecimal).

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
2. Diseñar el modelo de datos unificado: tabla `especies` con código SIEX oficial (01 Bovino, 02 Porcino, 03 Ovino, 04 Caprino, 05 Équido — ver tabla arriba) + tabla `tipos_identificador` con código RIIA oficial (excluyendo los dados de baja en altas nuevas) + tabla de asociación especie↔tipos de identificador permitidos + función de validación de crotal que reciba especie+tipo y aplique la regex correcta de las confirmadas en este documento.
3. Decidir el mecanismo de sincronización con la API del FEGA (build-time vs. acción manual vs. runtime con CORS) — de momento se puede semillar directamente desde los CSV ya descargados en `docs/AUDITAR/Catalogos_csv/`.
4. Plan de migración de datos existentes (animales ya dados de alta con los catálogos actuales desincronizados, `Vacas`/`Ovejas`/`Cabras`/`Cerdos` → códigos SIEX 01/03/04/02).
