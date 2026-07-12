# LIVESTOCK MANAGER V5.0 MIGRATION TOOLS

## DESCRIPTION

Este directorio contiene las herramientas necesarias para migrar los datos existentes de LIVESTOCK MANAGER a la estructura v5.0, la cual mejora la integridad de los datos al usar identificadores únicos estáticos para zonas y referencias numéricas en lugar de nombres de zonas.

## ARCHIVOS INCLUIDOS

1. `migrate-to-v5.js` - Script de migración que transforma los datos existentes a la estructura v5.0
2. `verify-v5-migration.js` - Script de verificación que confirma que la migración fue exitosa
3. (Las mejoras de UI ya están implementadas en los componentes principales)

## REQUISITOS PREVIOS

Antes de ejecutar cualquier script de migración:

1. **HACER UNA COPIA DE SEGURIDAD COMPLETA** de su base de datos IndexedDB actual
2. Asegurarse de tener acceso a la consola a la consola de développeur del navegador donde se ejecuta LIVESTOCK MANAGER
3. Tener disponible una versión reciente de los componentes de UI que ya soportan la estructura v5.0

## INSTRUCCIONES DE USO

### PASO 1: PREPARACIÓN
1. Respaldar su base de datos actual (IndexedDB)
2. Asegurarse de que la aplicación no esté en uso durante el proceso de migración
3. Tener disponible los scripts `migrate-to-v5.js` y `verify-v5-migration.js`

### PASO 2: EJECUTAR LA MIGRACIÓN
En la consola del navegador (pestaña Application > Console o similar):

```javascript
// Copiar y pegar el contenido completo de migrate-to-v5.js y presionar Enter
// O bien, cargar el archivo como un script y ejecutarlo
```

El script mostrará progreso en la consola y notificará al completar.

### PASO 3: VERIFICAR LA MIGRACIÓN
Después de que la migración haya completado exitosamente:

```javascript
// Copiar y pegar el contenido completo de verify-v5-migration.js y presionar Enter
```

El script reportará si todas las verificaciones pasaron o si se encontraron problemas que necesitan atención.

### PASO 4: DESPLIEGUE
Una vez verificada la migración:
1. Desplegar la versión actualizada de la aplicación (con las mejoras de UI ya implementadas)
2. Confirmar que todo funcione correctamente
3. Monitorear los logs iniciales en busca de advertencias

## QUÉ HACE LA MIGRACIÓN

### TRANSFORMACIÓN 1: ZONAS EN FINCAS
ANTES:
```javascript
zonas: [
  { nombre: "Zona A", superficie: 10, /* sin ID único */ },
  { nombre: "Zona B", superficie: 15, /* sin ID único */ }
]
```

DESPUÉS:
```javascript
zonas: [
  { id: 1, nombre: "Zona A", superficie: 10, /* otros campos */ },
  { id: 2, nombre: "Zona B", superficie: 15, /* otros campos */ }
]
```

### TRANSFORMACIÓN 2: REFERENCIAS DE ZONA EN REBAÑOS
ANTES:
```javascript
{ nombre: "Rebano 1", zonaActual: "Zona A", /* otros campos */ }
```

DESPUÉS:
```javascript
{ nombre: "Rebano 1", zonaId: 1, /* zonaActual eliminado, otros campos */ }
```

## BENEFICIOS DE LA MIGRACIÓN

1. **INTEGRIDAD DE DATOS GARANTIZADA**: Cambiar el nombre de una zona NO rompe las asociaciones con rebaños
2. **CONSULTAS EFICIENTES**: Búsquedas y filtrados por zona son ahora mucho más rápidos
3. **ELIMINACIÓN DE INCONSISTENCIAS**: Imposible tener referencias a zonas que no existen
4. **BASE PARA MEJORAS FUTURES**: Estructura de datos preparada para funciones avanzadas de análisis

## SOLUCIÓN DE PROBLEMAS

### Si encuentra "Zona no encontrados" durante la migración:
Esto indica que hay referencias de zona en rebanaos que apuntan a nombres de zonas que no existen en la finca correspondiente. Estos casos se marcan con `zonaId: null` y requerirán revisión manual después de la migración.

### Si falla la validación de integridad referencial:
Revisar los mensajes de error en la consola para identificar las referencias específicas problemáticas.

### Si necesita revertir la migración:
Restaurar su copia de seguridad de la base de datos IndexedDB desde el respaldo hecho antes de la migración.

## NOTAS DE COMPATIBILIDAD

Los componentes de UI que interactúan con zonas y rebaños ya han sido actualizados para trabajar con la nueva estructura, pero incluyen lógica de compatibilidad hacia atrás para manejar datos existentes durante el período de transición.

Una vez completada la migración y verificada, el sistema probablemente podrá operar en modo estricto v5.0, aunque las capas de acceso a datos incluyen protección contra regresiones durante el período de adopción.