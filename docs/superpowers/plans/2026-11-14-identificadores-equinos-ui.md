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
- [ ] Revisar reglas equinas completas y modelar captura/validación condicionada por destino, edad, ruta, autorización y medios antes de declarar conformidad.
- [ ] Definir el flujo de edición del estado e historial de identificadores verificados.
- [ ] Evaluar lectores ganaderos LF compatibles cuando se implemente integración física.

## Evidencia y riesgo residual

La inspección visual confirma la presencia y separación de UELN/código único, número DIE, lectura bruta y representación del transpondedor en una ficha nueva de Équidos. No se realizó persistencia de un animal real durante la comprobación visual. La persistencia y preservación de estructuras se cubren con pruebas unitarias. Esta entrega no certifica legalmente un código ni completa todas las rutas equinas.
