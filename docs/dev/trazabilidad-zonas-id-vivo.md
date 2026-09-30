# Trazabilidad: Proteccion de zonaId vivo

## Contexto
Commit base: e53fcd8 -- fix(zonas): proteger identidad y trazabilidad al importar parcelas

## Problema
Cuando Fincas.save asigna un ID a una zona nueva, debe evitar colisiones con
zonaIds referenciados por reboños existentes. Un rebano con zonaId: 5 pero
sin zona asociada (husfano) indica que una zona legacy perdio su ID. Asignar 5
a una zona nueva reenlazaria silenciosamente el rebano a la zona equivocada.

## Proteccion en e53fcd8

### fincas.js -- save(data, options)
1. Filtra zonas con ID valido (entero positivo), lanza error si no
2. Rechaza IDs duplicados
3. Consulta reboños ANTES de asignar IDs (getAllFromIndex rebanos fincaId)
4. Extrae idsReferenciados de los reboños
5. Asigna IDs evitando zonaIds referenciados y zonaIds existentes (while loop)
6. Usa transaccion (options.transaction) para atomicidad
7. Valida en edicion que IDs sean completos y unicos
8. Rechaza creacion de finca dentro de transaccion de actualizacion

### zonas-view.js -- _asegurarIdsZonasYRelaciones(finca, opciones)
- Consulta reboños de la finca para extraer zonaIds referenciados
- Reutiliza un zonaId husfano solo si nombre e ID apuntan a una unica zona
- Lanza error cuando hay ambigüedad (multiples candidatos)
- Usa _resolverRelacionesLegacyZonas() para enlazar reboños sin zonaId
- Persiste cambios en transaccion con rollback manual ante error

### importar-zonas-view.js -- _guardarParcelas()
- Usa db.transaction([fincas,rebanos,croquis_parcelas,registro_eventos], readwrite)
- Aborta si falla el registro de eventos

## Test de regresion
Archivo: tests/zonas-duplicados.unit.test.js linea 156
Nombre: Fincas.save no reasigna una zona sobre un zonaId de rebano ya referenciado
Verifica que una zona nueva sin ID no recibe zonaId 5 cuando un rebano lo referencia
Pasa con e53fcd8 (14/14 tests passed)

## Que NO hacer (leyes del rollback)
1. No simplificar save() sin consultar reboños -- ID 5 puede ser zonaId vivo
2. No eliminar transacciones atomicas -- inconsistency on partial failure
3. No eliminar normalizacion de claves -- sin separadores, municipios se fusionan
4. No eliminar revalidacion de coincidencias tras mutar estado
