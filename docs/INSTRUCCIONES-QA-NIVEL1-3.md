# Instrucciones — Ejecutar QA NIVEL 1-3

## Resumen
Este documento explica cómo ejecutar los tests automáticos de QA (Niveles 1-3) que validan:
- **NIVEL 1**: Carga correcta del seed (smoke test)
- **NIVEL 2**: Integridad de datos (campos coherentes)
- **NIVEL 3**: Operaciones CRUD (crear, editar, eliminar)

---

## Requisitos previos

1. **App ejecutándose en localhost**
   ```bash
   npm run dev
   # O si usas un servidor local diferente, anotar la URL
   ```

2. **Demo CHAMORRO cargada**
   - Abre la app
   - Ve a **Ajustes → Cargar Demo CHAMORRO**
   - Espera a que terminen los logs en consola

3. **Consola de desarrollador abierta**
   - Chrome: `F12` o `Ctrl+Shift+I`
   - Safari: `Cmd+Option+I`
   - Firefox: `F12`

---

## Ejecución

### Opción 1: Ejecutar TODO (NIVEL 1-3)

En la **consola de DevTools**, escribe:
```javascript
window.QATestRunner.runAll()
```

**Tiempo estimado**: 15-30 segundos

**Salida esperada**:
```
✓ [12:34:56] === NIVEL 1: SMOKE TEST (Carga de Seed) ===
✓ [12:34:57] Fincas count: 1 === 1
✓ [12:34:57] Rebaños count: 3 === 3
✓ [12:34:57] Animales count: 9 === 9
✓ [12:34:57] Compradores count: 3 === 3
... [más líneas]
✓ [12:35:01] === NIVEL 2: INTEGRIDAD DE DATOS ===
✓ [12:35:02] Comprador cárnico: OK
✓ [12:35:02] Comprador láctico: OK
... [más líneas]
✓ [12:35:08] === NIVEL 3: OPERACIONES CRUD ===
✓ [12:35:09] Comprador creado con ID 10: OK
... [más líneas]

╔════════════════════════════════════════╗
║  RESUMEN — 12.34s                      ║
║  Nivel 1 (Smoke):    ✅ PASS           ║
║  Nivel 2 (Integridad): ✅ PASS         ║
║  Nivel 3 (CRUD):     ✅ PASS           ║
╚════════════════════════════════════════╝
```

### Opción 2: Ejecutar un nivel específico

```javascript
window.QATestRunner.runLevel(1)  // Solo NIVEL 1
window.QATestRunner.runLevel(2)  // Solo NIVEL 2
window.QATestRunner.runLevel(3)  // Solo NIVEL 3
```

---

## Interpretación de resultados

### ✅ PASS (Verde)
Todo funciona correctamente. La línea incluye:
- `✓` símbolo de check
- Verde en la consola
- Mensaje de éxito (count match, FAIL)

### ❌ FAIL (Rojo)
Hay un problema. Causas comunes:
- Demo no cargada completamente
- Datos corruptos en localStorage
- Cambios en los nombres de registros del seed

**Acción**: Limpia y recarga la demo:
```javascript
// En consola:
localStorage.clear();
location.reload();
// Luego ve a Ajustes → Cargar Demo CHAMORRO
```

### ⚠️ ERROR (Amarillo)
Error no controlado (excepción). Revisa el stack trace en consola.

---

## Desglose por nivel

### NIVEL 1: Smoke Test (Carga)

**Verifica**: ¿Se cargaron todos los datos?

| Elemento | Expected | Qué revisar si falla |
|----------|----------|---------------------|
| Fincas | 1 | Demo no cargada |
| Rebaños | 3 | Rebanos.list() en seed-data.js |
| Animales | 9 | Animales.list() en seed-data.js |
| Compradores | 3 | Compradores seed correctos |
| Proveedores | 3 | Proveedores seed correctos |
| Transportistas | 2 | Transportistas seed correctos |
| Contratos | 2 | Contratos seed correctos |
| Sanitarios | 3 | Sanitarios seed correctos |
| Eventos Reproducción | 4 | Reproduccion.saveEvento() en seed |

**Si falla el conteo**:
1. Abre DevTools → Application → IndexedDB → Livestock-Manager
2. Expande cada tabla (rebanos, animales, etc.)
3. Cuenta manualmente y compara con el expected
4. Si discrepancia, la demo no cargó correctamente → Reload + Cargar Demo
2. Abre el fichero `qa-test-runner.js` en tu editor.
3. Busca la sección `// === NIVEL 1: SMOKE TEST ===`.
4. Compara el valor `expected` de la prueba que falló con la cantidad real de datos en la demo. Si la demo ha cambiado, actualiza el valor `expected` en el script.

---

### NIVEL 2: Integridad (Campos coherentes)

**Verifica**: ¿Tienen los datos los valores correctos?

| Check | Expected | Qué revisar si falla |
|-------|----------|---------------------|
| Comprador cárnico | tipo_comprador === 'cárnico' | Valor en seed-data.js línea 140 |
| Comprador láctico | tipo_comprador === 'láctico' | Valor en seed-data.js línea 141 |
| Proveedor Piensos | categorias.includes('Alimentacion') | Valor en seed-data.js línea 156 |
| Transportista Ganadero | tipo_vehiculo === 'camion' | Valor en seed-data.js línea 172 |
| Todos los crotales | /^[A-Z]{2}\d{12}$/ | Formato en seed-data.js línea 84+ |
| Vinculación madre-cría | ternero1.madre_id === vaca1.id | Código seed línea 107-108 |
| Tipos de tratamiento | En array TIPOS_TRATAMIENTO | Valores en seed-data.js línea 213-216 |
| Tipos de evento | En array TIPOS_EVENTO | Valores en seed-data.js línea 226-229 |

**Si falla algún check**:
1. Identifica qué registro/campo falló (mensaje en rojo)
2. Abre seed-data.js
3. Busca el valor esperado vs. actual
4. Corrige el seed
2. Abre `qa-test-runner.js` y localiza la prueba fallida en la sección de Nivel 2.
3. Verifica si la lógica de la prueba (`fn`) o el valor esperado (`expected`) son correctos según la versión actual de `seed-data.js`.
4. Corrige el `seed-data.js` o la prueba en `qa-test-runner.js` según corresponda.
5. Limpia localStorage y recarga demo

---

### NIVEL 3: CRUD (Operaciones)

**Verifica**: ¿Se pueden crear, editar y eliminar registros?

| Operación | Acción | Verificación |
|-----------|--------|--------------|
| Crear Comprador | Genera "Test Comprador QA" | ID > 0, luego se elimina (cleanup) |
| Crear Gasto | Genera "Test QA Gasto" en Alimentacion | ID > 0, luego se elimina |
| Editar Proveedor | Cambia nombre del primer proveedor | Se actualiza, se revierte |

**Si falla alguna operación CRUD**:
1. El error específico aparecerá en rojo
2. Revisa el mensaje: "Error: ..."
3. Causas comunes:
   - Fincas no activa → `await Fincas.setActive(fincaId)`
   - Rebaño no existe → cargar demo nuevamente
   - Validación fallida → revisar errorhandler.js

---

## Checklist de verificación

Antes de dar por bueno el test:

- [ ] NIVEL 1: ✅ Todos los conteos coinciden
- [ ] NIVEL 2: ✅ Todos los campos tienen valores correctos
- [ ] NIVEL 3: ✅ CRUD funciona sin errores
- [ ] **RESUMEN**: Muestra ✅ PASS en los 3 niveles
- [ ] Tiempo de ejecución: < 30 segundos
- [ ] Errores encontrados: 0

---

## Exportar resultados

### Para reportar en Slack/Email

Copia del resumen final de la consola:
```
╔════════════════════════════════════════╗
║  LIVESTOCK MANAGER — QA TEST RUNNER   ║
║  Niveles 1-3: Smoke + Integridad + CRUD║
╚════════════════════════════════════════╝

[logs...]

╔════════════════════════════════════════╗
║  RESUMEN — 12.34s                      ║
║  Nivel 1 (Smoke):    ✅ PASS           ║
║  Nivel 2 (Integridad): ✅ PASS         ║
║  Nivel 3 (CRUD):     ✅ PASS           ║
╚════════════════════════════════════════╝
```

### Para screenshot

1. Abre DevTools
2. Haz scroll hacia arriba en la consola
3. `Ctrl+A` + `Ctrl+C` (copiar)
4. Pega en editor de texto
5. Guarda como `QA-LEVEL-1-3-RESULTS-[FECHA].txt`

---

## Troubleshooting

### "window.QATestRunner is not defined"
- ✅ El script `qa-test-runner.js` no está cargado
- Recarga la página: `F5` o `Ctrl+R`
- Verifica que en DevTools veas: `✅ QA Test Runner cargado. Usa: ...`

### "No hay finca activa"
- ✅ No cargaste la demo
- Ve a **Ajustes → Cargar Demo CHAMORRO**
- Espera a que termine (mira los logs)
- Recarga la página
- Ejecuta `runAll()` de nuevo

### "0 de 9 animales" o conteos bajos
- ✅ Carga incompleta de seed
- Abre DevTools → Console → mira los logs rojos `[SEED] Error ...`
- Si hay errores, es que algo en el seed está roto
- Contacta con el equipo de desarrollo

### Test se queda congelado
- ✅ Finca activa tardó mucho
- Espera 10 segundos
- Si sigue, cierra y recarga DevTools

---

## Próximo paso

Una vez que todos los tests pasen:
1. ✅ Documenta fecha y hora en PLAN-QA.md
2. ✅ Guarda el reporte de resultados
3. ✅ Procede con **NIVEL 4: Flujos Transversales** (manual o script adicional)

---

## Contacto

Si encuentras errores en los tests:
- **No es error de tu parte** — el script está diseñado para fallar si hay problemas
- Copia el stack trace de la consola
- Reporta en el issue correspondiente con: fecha, hora, nivel que falló, error exacto

¡Gracias por validar! 🧪
