# ADSG WEB (SIGGAN, Junta de Andalucía) — Flujos y estructura

**Fuente**: `docs/AUDITAR/ADS005E_MUS_Manual_Usuario_0100.pdf` — "ADSG WEB, Manual de Usuario", Consejería de Agricultura, Pesca y Desarrollo Rural, v0100, 02/03/2015, 345 páginas.
**Relacionado**: [NORMATIVA-CROTAL-ESPECIE.md](NORMATIVA-CROTAL-ESPECIE.md), [el-sistema-de-identificacion-crotal.md](el-sistema-de-identificacion-crotal.md), [CUMPLIMIENTO_SIGGAN.md](CUMPLIMIENTO_SIGGAN.md).

## Qué es

ADSG WEB es el sistema (canal web) mediante el cual las ADSG (Agrupaciones de Defensa Sanitaria Ganadera) consultan y operan sobre **SIGGAN** (Sistema Integrado de Gestión Ganadera de Andalucía) en nombre de los ganaderos: Registro de Explotaciones, Titulares y Animales, Control de Movimientos Pecuarios y Saneamiento Animal. Es la referencia más directa que tenemos del backend/modelo de datos real con el que Livestock Manager debería poder interoperar (import/export de ficheros, formatos de crotal, catálogos).

## Mapa completo de navegación

```
1. Descripción del sistema
   1.4 Mapa del sistema (navegación por especie: Bovino, Porcino, Avícola, Pequeños Rumiantes, Cunícola)

2. Operativa del sistema
   2.1 Anexos para Informes
   2.2 Favoritos
   2.3 Registro General (no filtra por especie)
       2.3.1 Registro: Explotaciones normales | Mataderos | Plaza de toros
       2.3.2 Consultas: Titulares y titularidad | Explotaciones nacionales (búsqueda por explotación / provincia-municipio / nombre-dirección)
       2.3.3 Informes: ADSG | Titulares | Explotaciones/UP | UP sin coordenadas | Explotaciones que no cumplen vacunación Lengua Azul
       2.3.4 Gestión ADSG: Datos de ADSG | Usuarios del perfil | Asociar/Desvincular UP | Histórico asociación-desvinculación | Traspaso de Identificaciones Ganaderas

   2.4 Avícola
       Registro: Datos generales | Estructura | Histórico | Datos Sanitarios
       Movimientos pecuarios: Gestión | Crear Salida | Crear Entrada
       Datos sanitarios: Analíticas Sanitarias
       Informes: Registro | Movimientos

   2.5 Porcino
       Registro: Datos generales | Estructura | Histórico | Saneamiento
       Datos Sanitarios: Controles Serológicos + Hoja de Remisión de Muestras | Gestión de Vacunas
       Movimientos pecuarios: Gestión | Crear guía | Notificación de Llegada
       Informes: Registro | Sanitarios | Movimientos

   2.6 Bovino
       Registro: Datos generales | Estructura | Animales | Filiaciones | Histórico
       Consultas: Relación madres-hijos (explotaciones normales) | Relación madre-hijo (explotaciones de lidia)
       Movimientos pecuarios: Gestión | Crear guía | Histórico de movimientos de un animal | Histórico fuera de Andalucía
       Datos Sanitarios: Gestión de saneamientos + Hoja de Remisión | Explotaciones que pierden calificación | Histórico calificaciones | Histórico saneamientos | Gestión de Vacunas | Consulta de Vacunas por crotal | Previsión de visitas sanitarias
       Informes: Registro | Sanitarios | Movimientos

   2.7 Pequeño rumiante (ovino/caprino)
       Registro: Explotaciones | Identificación individual (carga de ficheros, histórico, consulta de localización por crotal) | Recensado (carga de ficheros, histórico)
       Movimientos pecuarios: Gestión
       Datos sanitarios: Histórico calificaciones | Explotaciones que pierden calificación | Actas de indemnización | Gestión de Vacunas | Consulta de Vacunas por crotal | Gestión de Serologías por lotes | Previsión de visitas sanitarias
       Informes: Registro | Sanitarios | Movimientos

   2.8 Cunícola
       Registro: Datos generales | Estructura | Históricos
       Informes: Censos y capacidades máximas

3. Anexos: Ref. Proceso/Requisito | Ref. Proceso/Validación | Incidencias frecuentes | Mensajes de error (extenso, ~4800 líneas de texto extraído — pendiente de revisar en detalle si hace falta mapear códigos de error concretos) | Términos y acrónimos | FAQ | Ayudas
4. Glosario
5. Bibliografía
```

## Flujos detallados (leídos a fondo — los más relevantes para Livestock Manager)

### Registro General (2.3)

Tres tipos de explotación consultables: **normales**, **mataderos**, **plaza de toros** — filtrables por explotación/provincia/comarca/municipio, con búsqueda por prefijo de código. Las consultas de "Explotaciones nacionales" (bovino) tienen tres modos: por código nacional directo, por provincia/municipio, o por nombre/dirección (esta última solo para explotaciones de Andalucía). Para explotaciones fuera de Andalucía, SIGGAN no dispone de dirección/nombre/clasificación zootécnica.

### Identificación individual — Pequeño Rumiante (2.7.2.2)

**Esta es la pieza más directamente aplicable al trabajo de crotal.**

- **Carga de ficheros**: registra en SIGGAN animales identificados individualmente mediante un fichero de texto plano, un animal por línea, campos separados por `;`, **sin espacios ni retornos de carro tras el último `;`**. Nombre final en servidor: `WEB_ADSG_USR_{CODADSG}_{AAAAMMDDHHmm}.TXT`.

- **Estructura exacta del fichero** (idéntica para identificación individual y recensado):
  ```
  ID;Iden_elec;Pais;NumExplo;FNaci;FId;Espe;Espe_ID;Dupli;Raza;Tipo_Iden;Tec;Cr;Sexo;Cebo
  ```
  Ejemplo real del manual:
  ```
  010001453377;8200B50254221141;0724;ES230020000723;06-01-01;08-07-30;04;2;0;9;02;75553636Q;;2;0
  ```
  Interpretación de campos (deducida del ejemplo y el contexto):
  | Campo | Ejemplo | Significado |
  |---|---|---|
  | `ID` | `010001453377` | Código de crotal (12 dígitos) |
  | `Iden_elec` | `8200B50254221141` | Identificación electrónica, **16 caracteres hexadecimales** |
  | `Pais` | `0724` | Código de país **numérico ISO 3166-1** (724 = España), no "ES" |
  | `NumExplo` | `ES230020000723` | Código REGA de la explotación |
  | `FNaci` | `06-01-01` | Fecha de nacimiento (AA-MM-DD) |
  | `FId` | `08-07-30` | Fecha de identificación (AA-MM-DD) |
  | `Espe` | `04` | Código de especie — coincide con el catálogo oficial `ESPECIE_ANIMAL` del FEGA (ver [NORMATIVA-CROTAL-ESPECIE.md](NORMATIVA-CROTAL-ESPECIE.md); 04 = Caprino) |
  | `Espe_ID` | `2` | Subtipo/variedad de especie |
  | `Dupli` | `0` | Indicador de duplicado |
  | `Raza` | `9` | Código de raza |
  | `Tipo_Iden` | `02` | Código de tipo de identificador — coincide con el catálogo oficial `RIIA_TIPO_IDENTIFICADOR` (02 = Bolo ruminal) |
  | `Tec` | `75553636Q` | NIF del técnico/veterinario responsable |
  | `Cr` | (vacío en el ejemplo) | Campo adicional sin confirmar |
  | `Sexo` | `2` | Código de sexo — catálogo `RIIA_SEXO` |
  | `Cebo` | `0` | Indicador de animal de cebo |

  **Esto confirma y cierra el modelo especie→tipo de identificador→código** descrito en NORMATIVA-CROTAL-ESPECIE.md: el propio fichero de intercambio de SIGGAN lleva el código de especie y el código de tipo de identificador como campos explícitos, exactamente el diseño que se propuso allí.

- **Consulta de Localización de Animal por crotal**: el sistema acepta el identificador en **tres formatos**, confirmando (y ampliando) los formatos de crotal ya documentados:
  1. **Formato normal, 14 caracteres** — coincide exactamente con `ES` + 2 dígitos CC.AA. + 10 dígitos individuales = 14 caracteres, ya documentado en NORMATIVA-CROTAL-ESPECIE.md.
  2. **Identificación electrónica agrupada, 20 caracteres** (formato con separadores, estándar ISO 11784/11785 "legible").
  3. **Formato hexadecimal, 16 caracteres** — coincide con el campo `Iden_elec` del fichero de arriba.

### Recensado — Pequeño Rumiante (2.7.2.3)

Mismo formato de fichero que identificación individual. Parámetros de carga: fecha de lectura, explotación destino, **porcentaje** de animales leídos (100% o parcial), especies a considerar.

Lógica de negocio del procesamiento (importante si se quiere generar/consumir ficheros compatibles):
- Si se declara **100%** de la explotación: los animales que SIGGAN tiene localizados ahí y **no** aparecen en el fichero pasan a estado **DESAPARECIDO**.
- Animal **muerto**: no se modifica (revivir requiere trámite en la OCA).
- Animal **desaparecido** que aparece en el fichero: reaparece automáticamente en la explotación indicada.
- Animal localizado en **otra explotación** que aparece en este fichero: desaparece de la de origen y reaparece en la nueva (movimiento implícito).
- Si el animal no existe aún en SIGGAN, se da de alta con los datos del fichero (fecha nacimiento, sexo, especie, raza); si ya existe, **no se modifican sus datos**, solo su localización/estado.

### Animales y Filiaciones — Bovino (2.6.2.3, 2.6.2.4)

- Estados de animal observados: **Localizados, Desaparecidos, Devueltos, Muertos en explotación** (filtros de pestaña sobre el listado de animales de una Unidad Productiva).
- Búsqueda de crotal por prefijo (autocompletado).
- **Filiaciones**: relación madre-hijo navegable por crotal, con distinción entre explotaciones normales y explotaciones de lidia. Si se busca la madre de un animal no registrado en SIGGAN, se muestra un aviso (no es un error duro).

## Pendiente de revisar

- Sección completa de "Mensajes de error" (3.4) — muy extensa (~4800 líneas de texto extraído), no revisada en detalle; podría aportar validaciones de negocio adicionales si se necesita en el futuro.
- Detalle de Avícola, Porcino y Cunícola — solo mapeados por título (ver mapa de navegación arriba), no leídos a fondo. Retomar si el alcance de la app se amplía a esas especies.
- Formato exacto de fichero de "Carga de ficheros" para Bovino (si existe una sección equivalente) y para Movimientos/Guías — no localizado aún en esta pasada.
