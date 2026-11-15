# Identificación equina por caso y excepción de crotal electrónico

Fecha: 2026-11-15
Repositorio: SADOCKDOG/LIVESTOCK-MANAGER (Maestro Android)
Estado: integración implementada y verificada visualmente en Maestro Android. Alta equina y persistencia del contexto confirmadas en tablet. El filtro dinámico de especie quedó corregido, reconstruido, reinstalado y comprobado visualmente.

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
11. [x] Repetir en tablet el paso de especie del asistente tras corregir el filtrado. Con équidos seleccionado, la pantalla muestra solo `ES210112345679`; al alternar a vacas el équido se desmarca y oculta. Se cerró el borrador sin registrar una guía.

## Evidencia visual

Capturas reales de la tablet guardadas en `PRIVATE/evidencias/2026-11-15-caso-equino-boton/`. En la ficha se comprobó el selector de tipos, el caso de botón, el formato `ES21 + CCAA + 8 dígitos`, la etiqueta `14/14`, las declaraciones y el chip ISO 11784 obligatorio. Se guardó el animal equino temporal `ES210112345679` en la finca de demo y se confirmó su contexto separado en IndexedDB. En la guía se comprobó que el registro aparece como selección disponible, que solo se ve con équidos seleccionado y que al cambiar a vacas desaparece y se desmarca. El borrador se cerró con “Salir sin guardar”.

La evidencia confirma el comportamiento de interfaz en el APK instalado. No representa una autorización oficial ni verifica que el animal real reúna las condiciones declaradas.

## Verificación ejecutada

- Pruebas previas del conjunto `tests/*.unit.test.cjs`: 85 casos aprobados, 0 fallidos.
- Pruebas del conjunto `tests/*.unit.test.cjs` tras la corrección: 86 casos aprobados, 0 fallidos.
- Comprobaciones `node --check` de los módulos de vista, guardado, reglas equinas, DB y error handler.
- Build web, sincronización Capacitor, compilación Gradle debug e instalación en la tablet completados durante esta integración.
- Captura del formulario con transpondedor requerido: `17-chip-required.png`.
- Captura del paso 4 mostrando `PLANIFICADO` y `BORRADOR`: `40-wizard-estado-traslado.png`.
- Captura del paso administrativo final de la guía equina: `48-wizard-guia-equino-paso-4.png`.
- Captura de salida sin guardar y retorno al inicio: `42-tablet-sin-guardar.png`.
- `git diff --check` sin errores.

## Límites y siguientes pasos

- Mantener `www/` generado por build. Editar fuentes raíz y reconstruir.
- No sincronizar a livestock-desktop ni publicar en tiendas desde esta fase.
- La tablet no contiene un équido activo en el censo. El enlace contextual con una guía equina queda probado por unidad. El recorrido visual del wizard se hizo con una vaca de demo solo en borrador y sin guardar.
- No se validó un transporte equino real, la documentación oficial ni la ejecución física del traslado.

## Fuentes oficiales

- Real Decreto 787/2023 consolidado, artículos 8, 15, 16 y 19: https://www.boe.es/buscar/act.php?id=BOE-A-2023-22499&p=20241224&tn=1
- Reglamento de Ejecución (UE) 2021/963, artículos 10, 16 y 29 y anexo I: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX%3A32021R0963
- Reglamento Delegado (UE) 2019/2035, artículos 59 y 62: https://eur-lex.europa.eu/eli/reg_del/2019/2035
