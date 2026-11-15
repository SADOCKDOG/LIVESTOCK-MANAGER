# Captura y persistencia inicial de identificadores equinos

Fecha: 2026-11-14  
Repositorio: `SADOCKDOG/LIVESTOCK-MANAGER` (Maestro Android)  
Estado: vertical slice implementada y validada visualmente en tablet. El modelo legal completo por especie/caso sigue pendiente.

## Objetivo

Añadir a la ficha equina controles separados para UELN/código único, número DIE y lectura bruta del transpondedor. Guardarlos en las colecciones optativas de identificación aprobadas en el contrato de persistencia, sin reinterpretar la clave principal ni migrar campos heredados.

## Límites

- La sección solo se muestra para la especie equina (ID 5).
- UELN y DIE se capturan como datos independientes y no se autogeneran.
- La lectura del transpondedor se conserva en bruto. La representación debe declararse como código nacional o código ISO completo.
- Las altas nuevas quedan en estado `pendiente` de verificación.
- El botón NFC es complementario. Web NFC no acredita lectura del transpondedor ganadero LF.
- No se habilitan excepciones legales, reglas de movimiento, migraciones de `rfid_codigo` o `dib`, ni unicidad global.

## Implementación y verificación

- [x] Presentar los campos equinos separados, con selección explícita de representación de lectura.
- [x] Construir las colecciones estructuradas sin sobrescribir otros identificadores ni alterar los campos legacy.
- [x] Permitir listas con identificadores secundarios sin exigir reclasificar la clave principal heredada.
- [x] Probar validación del contrato, la representación, la preservación de entradas existentes y el comportamiento para otras especies.
- [x] Suite `node --test tests/*.unit.test.cjs` — 51/51 pruebas.
- [x] `node --check` para `js/animales.js` y `js/views/animales-view.js`.
- [x] `npm run build`, `npx cap sync android` y `gradlew assembleDebug` completados.
- [x] Instalar APK debug 4.10.8 (versionCode 530) en Samsung SM-X230. Firma del APK igual a la ya instalada y datos conservados.
- [x] Evidencia visual real de la ficha equina, sin guardar un animal de prueba, en `PRIVATE/evidencias/2026-11-14-maestro-android-equino-identificadores-campos.png`.
- [x] Revisar las reglas equinas oficiales y delimitar la captura actual frente a elegibilidad legal.
- [x] Implementar edición e historial de verificaciones: un valor sin cambios conserva estado y metadatos; reemplazar o borrar archiva el registro anterior; valores nuevos vuelven a pendiente; marcar vigente requiere responsable, fecha y referencia documental.
- [ ] Evaluar lectores ganaderos LF compatibles cuando se implemente integración física.
- [x] Añadir campos de estado y evidencia local de verificación para UELN, DIE y transpondedor, con validación del contrato de persistencia.

## Matriz equina confirmada y flujo de edición

El RD 787/2023 consolidado, artículo 8, establece como medio general el transpondedor inyectable aplicado por veterinario. El crotal electrónico de botón solo queda previsto para équidos con destino a producción de carne nacidos en categorías de explotación enumeradas y trasladados directamente a matadero. Para nacidos en explotaciones silvestres o semisilvestres, además, el traslado directo debe ocurrir antes de los 12 meses. El artículo 16 sitúa la identificación en la explotación de nacimiento y antes de salir de ella. El artículo 15 impide retirar o sustituir medios sin autorización y regula sustitución por pérdida o deterioro.

El Reglamento de Ejecución (UE) 2021/963 separa el código único/UELN, los datos del transpondedor, el documento de identificación permanente y único y los métodos alternativos autorizados. La identidad verificada por métodos alternativos debe verificarse antes de registrarse en el documento y base de datos. Por eso la ficha actual solo captura transpondedor leído, UELN/código único y número DIE como datos separados. No habilita la excepción del crotal electrónico ni métodos alternativos, no determina edad/destino/ruta y no certifica correspondencia oficial.

Política de edición implementada en la interfaz: un valor sin cambios conserva su estado y metadatos; borrar o reemplazar archiva el valor activo como histórico, sin eliminar el registro; cualquier valor introducido o reemplazado se crea como pendiente. La UI exige quién verificó, cuándo y la referencia documental para marcar un registro como vigente. El registro local de esa verificación tampoco sustituye la asignación o autorización de la autoridad competente.

Fuentes oficiales consultadas el 14-11-2026: [RD 787/2023 consolidado, arts. 8, 15 y 16](https://www.boe.es/buscar/act.php?id=BOE-A-2023-22499&p=20241224&tn=1) y [Reglamento de Ejecución (UE) 2021/963](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX%3A32021R0963).

## Evidencia y riesgo residual

La inspección visual confirma la presencia y separación de UELN/código único, número DIE, lectura bruta y representación del transpondedor en una ficha nueva de Équidos. No se realizó persistencia de un animal real durante la comprobación visual. La persistencia y preservación de estructuras se cubren con pruebas unitarias. Esta entrega no certifica legalmente un código ni completa todas las rutas equinas.
