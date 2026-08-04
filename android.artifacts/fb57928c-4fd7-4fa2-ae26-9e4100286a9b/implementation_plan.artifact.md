# Plan de Implementación: Solución de bloqueo e índices faltantes en Base de Datos

Se ha identificado que la carga de la "DEMO CHAMORRO" y otras operaciones de guardado fallan o muestran advertencias debido a la falta de índices específicos en IndexedDB. Además, el proceso de carga de datos demo es lento debido a la secuencialidad de las operaciones.

## User Review Required

> [!IMPORTANT]
> Se incrementará la versión de la base de datos a la **v28**. Esto activará una migración automática la próxima vez que se abra la aplicación.

## Proposed Changes

### Database Layer

#### [MODIFY] [db.js](file:///C:/Users/yo/repo/LIVESTOCK-MANAGER/android/app/src/main/assets/public/js/db.js)
- Incrementar `DB_VERSION` de 27 a 28.
- Añadir índices faltantes en la lógica de `upgrade`:
    - `sanitarios_ganado`: añadir índice `fincaId`.
    - `vacunaciones`: añadir índice `fincaId`.

---

### Logic Layer (Optional/Optimization)

#### [MODIFY] [seed-data.js](file:///C:/Users/yo/repo/LIVESTOCK-MANAGER/android/app/src/main/assets/public/js/seed-data.js)
- Reducir los tiempos de `sleep` en el proceso de carga de datos para mejorar la percepción de fluidez sin saturar el hilo principal.

## Verification Plan

### Automated Tests
- No se dispone de un entorno de tests unitarios para IndexedDB en este contexto, pero se verificará mediante logs.

### Manual Verification
1. Abrir la aplicación.
2. Ir a "Asistente de Configuración".
3. Pulsar "Cargar Demo CHAMORRO".
4. Verificar en el Logcat que no aparece el error `The specified index was not found` durante el guardado de gastos sanitarios.
5. Confirmar que el mensaje "Completado exitosamente" aparece en los logs y el brindis (toast) de éxito se muestra en la UI.
