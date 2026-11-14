# Plan: persistencia de identificadores animales

> **Para agentes:** ejecutar este plan en la rama de trabajo, tarea por tarea, escribiendo primero las pruebas.

**Objetivo:** añadir una estructura optativa y validada para guardar varios identificadores tipados y documentos de identificación, sin cambiar los campos existentes.

**Arquitectura:** `numero_identificacion` y `tipoIdentificadorId` siguen siendo la proyección principal actual. Se añaden las listas opcionales `identificadores[]` y `documentos_identificacion[]`; se validan sin reescribir fichas heredadas, inferir situación legal ni crear índices de unicidad global. Los casos legales sujetos a contexto permanecen cerrados hasta que el flujo recoja esos datos.

**Tecnologías:** JavaScript, wrapper IndexedDB y ejecutor de pruebas integrado de Node.

**Especificación:** `docs/auditorias/2026-11-12-identificacion-y-claves-unicas.md`, sección «Modelo aditivo, compatible con fichas existentes».

## Restricciones globales

- Preservar los registros y campos de identificación principales existentes.
- No inferir asignación oficial, elegibilidad ni régimen legal a partir de la sintaxis.
- Guardar los valores como texto, incluidos sus ceros iniciales.
- No crear índices únicos para identificadores o documentos en esta tarea.
- No migrar `rfid_codigo`, `dib` ni valores DIE heredados a las nuevas listas.
- Mantener el destino y la ruta del movimiento fuera del registro permanente del animal.
- Trabajar solo en Maestro Android; no sincronizar con Desktop ni publicar artefactos.

## Aspectos para revisar

- Los guardados heredados sin listas estructuradas conservan su comportamiento y no adquieren datos inferidos.
- Se guardan varios identificadores sin mezclar sus tipos.
- Una lista puede contener solo identificadores secundarios; si marca uno como principal, debe haber solo uno y coincidir con `numero_identificacion`.
- Los identificadores preservan ceros iniciales.
- Los números DIE/documentales quedan separados y sin unicidad por animal.

---

### Task 1: Validar el contrato optativo de identificación animal

**Archivos:**
- Modificar: `js/animales.js`
- Prueba: `tests/animal-identification-contract.unit.test.cjs`

**Interfaz:**
- Consume: el payload actual del guardado de animales.
- Produce: `validarContratoIdentificacionAnimal(data)`, que valida las listas optativas sin modificarlas.

- [x] Añadir pruebas fallidas para listas mal formadas, tipos no válidos, falta o multiplicidad de principal, diferencia con la proyección y un par válido de código nacional/transpondedor con ceros iniciales.
- [x] Ejecutar la nueva prueba y confirmar que falla por las aserciones del contrato.
- [x] Implementar el validador y llamarlo al inicio de `Animales.save()`.
- [x] Ejecutar las pruebas nuevas y las de compatibilidad de identificadores heredados.

Tipos de `identificadores[].tipo`: `codigo_nacional`, `marca_explotacion`, `transpondedor_iso`, `ueln`, `otro`. Cada elemento requiere `valor` de texto, `principal` booleano y `estado` en `vigente`, `historico`, `legado`, `pendiente`; admite además `tipoIdentificadorId`, `medio`, `valorLeido`, `fechaAplicacion`, `fechaFin` y `asignador`. Una lista no vacía puede tener cero o un elemento principal; si existe, su `valor` debe coincidir exactamente con el `numero_identificacion` normalizado que se guardará. Esta forma permite agregar identificadores secundarios a fichas heredadas sin clasificar ni duplicar el valor principal. Si se necesita conservar una lectura original distinta, se almacena en `valorLeido`.

Los documentos requieren `tipo` (`DIE`, `PASAPORTE`, `OTRO`) y `numero` de texto no vacío; `emisor`, `fechaEmision`, `estado` y `referenciaAutorizacion` son opcionales. No se valida unicidad.

### Task 2: Demostrar compatibilidad y persistencia

**Archivos:**
- Prueba: `tests/animal-identification-contract.unit.test.cjs`
- Modificar solo si falla una prueba: `js/animales.js`

**Interfaz:**
- Consume: `validarContratoIdentificacionAnimal(data)` de la tarea 1.
- Produce: las listas válidas se conservan junto a los campos heredados en `Animales.save()`.

- [x] Comprobar que un registro válido guarda ambas listas sin alterarlas y conserva los campos existentes.
- [x] Comprobar que los datos estructurados inválidos se rechazan antes de escribir en IndexedDB.
- [x] Comprobar que guardar sin ninguna lista sigue el flujo heredado sin añadir campos.
- [x] Ejecutar las pruebas focalizadas y la suite disponible `node --test tests/*.unit.test.cjs` (41/41).

### Task 3: Registrar límites y revisar

**Archivos:**
- Modificar: `docs/auditorias/2026-11-12-identificacion-y-claves-unicas.md`
- Revisar: todos los archivos modificados y consumidores actuales de identificadores.

- [x] Documentar que esta persistencia no activa flujos de interfaz, no certifica elegibilidad legal ni migra campos existentes.
- [x] Revisar que el diff no amplíe el alcance a UI, tiendas o Desktop; ejecutar `git diff --check`.
- [x] Confirmar revisión independiente (sin bloqueantes), separar esta implementación de la PR #207 y registrar el contrato y la verificación en la nueva PR.
