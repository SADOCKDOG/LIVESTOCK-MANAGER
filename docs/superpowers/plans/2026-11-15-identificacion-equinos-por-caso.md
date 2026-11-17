# Identificación equina por caso y excepción de crotal electrónico

Fecha: 2026-11-15
Actualizado: 2026-11-16
Repositorio: SADOCKDOG/LIVESTOCK-MANAGER (Maestro Android)
Estado: integración implementada y verificada visualmente en Maestro Android. Alta equina, persistencia del contexto y enlace con una guía guardada como borrador confirmados en tablet. El filtro dinámico de especie quedó corregido, reconstruido, reinstalado y comprobado visualmente.

## Objetivo

Mantener el transpondedor inyectable como vía general para équidos y permitir seleccionar explícitamente el crotal electrónico de botón únicamente para el caso normativo de destino a matadero. La app valida la consistencia de los datos declarados, sin atribuirse verificación administrativa.

## Condiciones recogidas

- Destino declarado a producción de carne.
- Categoría declarada de la explotación de nacimiento entre producción-reproducción, pastos o silvestre/semisilvestre.
- REGA de origen del traslado coincidente con el REGA de nacimiento declarado.
- Traslado directo desde la explotación de nacimiento al matadero y REGA del matadero declarado.
- Para origen silvestre/semisilvestre, llegada prevista antes de que el animal cumpla doce meses.
- Código visual equino válido según fecha de nacimiento y transpondedor ISO 11784 de 23 dígitos compatible con la región del código visual.

Los datos de destino y traslado se guardan como contexto planificado, fuera de los atributos permanentes del animal. El origen de nacimiento queda como declaración local en la ficha. La aplicación no verifica la clasificación REGA, destino comercial, autorización ni aplicación física del dispositivo.

## Diseño técnico y estado

1. [x] Auditar el esquema de movimientos y determinar que registra movimientos efectivos, no planes de traslado.
2. [x] Separar origen declarado de nacimiento y plan futuro de destino/traslado.
3. [x] Añadir en la migración de IndexedDB v31 el almacén `contextos_identificacion` con índices por animal, finca, tipo y estado. La migración porcina existente sigue ejecutándose de forma independiente.
4. [x] Añadir la asociación equina/tipo de identificador para el caso `crotal_boton_carne_directo` con validador visual equino contextual.
5. [x] Implementar validación pura de formato visual antiguo/nuevo por fecha, ISO 11784, elegibilidad, campos ausentes y límite de edad, incluidos nacimientos el 29 de febrero.
6. [x] Integrar selector de caso, ayuda de formato, formulario de declaraciones y obligación del transpondedor ISO en la ficha Android.
7. [x] Guardar el origen declarado en el animal y el plan como registro separado `planificado`. Si falla la escritura del contexto, el guardado revierte el animal editado o elimina el alta recién creada.
8. [x] Ejecutar build Android, instalar la actualización debug y comprobar la ficha en tablet Samsung SM-X230, paquete `com.livestockmanager.app.manual`, versión 4.10.8 / versionCode 530.
9. [x] Asociar el contexto con la guía coincidente por animal, caso y REGA de origen/destino; resolver el plan según la declaración de traslado ejecutado o la anulación de la guía.
10. [x] Añadir pruebas de persistencia/rollback para alta y edición, fallo parcial, guías coincidentes/no coincidentes, estados declarados y edición de fichas equinas heredadas.
11. [x] Repetir en tablet el paso de especie del asistente tras corregir el filtrado. Con équidos seleccionado, la pantalla muestra solo `ES210112345679`; al alternar a vacas el équido se desmarca y oculta.
12. [x] Recorrer y guardar visualmente una guía equina desde el asistente con el équido temporal y los REGA coincidentes. Se verificó el paso 4 en `PLANIFICADO` / `BORRADOR`, la ficha documental `G-62287048` y el enlace persistido `contextos_identificacion.guiaMovimientoId = 9903`. El trámite permanece en borrador y no se presentó.
13. [x] Cerrar los hallazgos de la revisión final: exigir transpondedor ISO 11784 válido en el guardado del caso de botón, cancelar el contexto planificado si cambia el tipo de identificación y ejecutar la persistencia contextual antes de generar efectos secundarios reversibles.

## Evidencia visual

Capturas reales de la tablet guardadas en `PRIVATE/evidencias/2026-11-15-caso-equino-boton/`. En la ficha se comprobó el selector de tipos, el caso de botón, el formato `ES21 + CCAA + 8 dígitos`, la etiqueta `14/14`, las declaraciones y el chip ISO 11784 obligatorio. Se guardó el animal temporal `ES210112345679` y su contexto separado en IndexedDB. El asistente muestra el animal solo con équidos seleccionado, y lo desmarca y oculta al cambiar a vacas. La guía guardada `G-62287048` aparece en Documentos como borrador. El movimiento `9903` enlaza con el contexto `1` mediante `guiaMovimientoId`, que conserva estado `planificado`. El borrador tiene la nota de prueba local y no se presentó. Capturas clave: `49-guia-equino-borrador-sin-certificado.png`, `52-guia-equino-visible-listado.png` y `53-guia-equino-borrador-sin-desinsectacion.png`.

La evidencia confirma el comportamiento de interfaz en el APK instalado. No representa una autorización oficial ni verifica que el animal real reúna las condiciones declaradas.

## Verificación ejecutada

- Pruebas previas del conjunto `tests/*.unit.test.cjs`: 85 casos aprobados, 0 fallidos.
- Pruebas del conjunto `tests/*.unit.test.cjs` tras la corrección: 86 casos aprobados, 0 fallidos.
- Comprobaciones `node --check` de los módulos de vista, guardado, reglas equinas, DB y error handler.
- Build web, sincronización Capacitor, compilación Gradle debug e instalación en la tablet completados durante esta integración.
- Captura del formulario con transpondedor requerido: `17-chip-required.png`.
- Captura previa del estado del wizard: `40-wizard-estado-traslado.png`.
- Captura del paso administrativo final de la guía equina: `48-wizard-guia-equino-paso-4.png`.
- Captura de salida sin guardar y retorno al inicio: `42-tablet-sin-guardar.png`.
- `git diff --check` sin errores.
- Revisión independiente del diff contra `origin/master`: tres hallazgos corregidos con pruebas de regresión, sin diferidos. Suite completa `node --test tests/*.unit.test.cjs`: 92/92 aprobadas.
- Build web, `npx cap sync android` y `gradlew assembleDebug` completados. APK debug 4.10.8 / versionCode 530 instalado sobre la instalación existente de Samsung SM-X230.
- Prueba visual real: el formulario muestra condiciones declaradas completas, bloquea Guardar sin transpondedor ISO 11784 válido y conserva 17 animales antes y después. Captura local en `PRIVATE/evidencias/2026-11-17-equino-transpondedor-obligatorio/bloqueo-sin-transpondedor.png`. El formulario se cerró sin guardar.

## Límites y siguientes pasos

- Mantener `www/` generado por build. Editar fuentes raíz y reconstruir.
- No sincronizar a livestock-desktop ni publicar en tiendas desde esta fase.
- La persistencia del enlace se comprobó visualmente tras guardar desde el asistente y se corroboró en IndexedDB. La ficha de documentos conserva la guía como borrador.
- La prueba visual inicial detectó que la finca configurada en Andalucía no permitía guardar una guía planificada como borrador sin certificar la desinsectación. Se corrigió la validación del asistente y de Movimientos.save(): solo esa combinación queda exenta. Las guías presentadas y los traslados declarados como ejecutados conservan el requisito. Las pruebas de regresión en tests/equine-context-persistence.unit.test.cjs pasan y la prueba visual en la tablet SM-X230, con el APK reconstruido, avanzó hasta el paso 4 y guardó la guía sin certificado. Evidencia local en PRIVATE/evidencias/2026-11-17-guia-borrador-desinsectacion/, incluida la pantalla de aviso y el documento guardado. En la misma tablet se comprobó que los estados presentado y ejecutado con certificado desmarcado muestran el bloqueo en el paso 4; el asistente se canceló después sin guardar.
- No se validó un transporte equino real, la documentación oficial ni la ejecución física del traslado.

## Fuentes oficiales

- Real Decreto 787/2023 consolidado, artículos 8, 15, 16 y 19: https://www.boe.es/buscar/act.php?id=BOE-A-2023-22499&p=20241224&tn=1
- Reglamento de Ejecución (UE) 2021/963, artículos 10, 16 y 29 y anexo I: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX%3A32021R0963
- Reglamento Delegado (UE) 2019/2035, artículos 59 y 62: https://eur-lex.europa.eu/eli/reg_del/2019/2035
