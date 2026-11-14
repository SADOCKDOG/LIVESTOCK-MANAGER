# Propuesta integral de ordenación de Livestock Manager y su factoría

Fecha de corte del 11 de noviembre de 2026. Este documento consolida la revisión de siete repositorios, las capturas de distribución aportadas por el propietario y el material recuperado de las 02:19. Completa y actualiza los dos informes anteriores de esta misma fecha.

## 1. Resultado buscado

Livestock Manager debe tener una fuente canónica de las reglas de negocio, dos clientes mantenidos con sus condiciones comerciales y un servicio común de soporte opcional. La factoría debe poder producir cambios sobre esos productos conservando la procedencia del código, la revisión de las pruebas, la autorización y la relación con el paquete o despliegue que recibe el usuario.

La documentación rectificada de cumplimiento define el alcance comercial como gestión ganadera **cárnica y láctea de bovino, ovino y caprino**, organizada en GeGan, ExPro y Comer. Incluye identificación, censo, reproducción, patrimonio, producción, sanidad, movimientos, comercialización y documentación. Clasifica el módulo porcino y su FCR como ensayo de evaluación de agentes. Su código integrado sigue formando parte del árbol revisado, pero cualquier trabajo nuevo del producto debe partir del alcance comercial acordado. Este hallazgo corrige el peso dado al módulo porcino en la propuesta anterior. [Mapa de arquitectura rectificado](https://github.com/SADOCKDOG/Autonomous-Doc-Compliance/blob/cdc3c19/governance/MAPA_ARQUITECTURA_Y_MATRIZ_CAPACIDADES_20261028.md)

## 2. Responsabilidad de los siete repositorios

| Repositorio | Responsabilidad propuesta | Qué recibe y qué entrega |
|---|---|---|
| **LIVESTOCK-MANAGER** | Maestro Android y frontend compartido. Propietario de los esquemas, reglas y servicios comunes. Android tiene desbloqueo Premium por compra única y soporte con IA por suscripción opcional. | Recibe requisitos de producto y correcciones comunes nacidas en otro cliente. Entrega un commit de referencia probado para Android y para sincronizar Windows. |
| **livestock-desktop** | Cliente Tauri en producción. Premium gratuito y suscripción opcional al soporte. Propietario del shell Windows, WinRT/Store y del paquete de escritorio. | Recibe una revisión explícita del Maestro, conserva adaptaciones justificadas de plataforma y devuelve las mejoras comunes al Maestro mediante PR. |
| **livestock-pwa-msix** | Cliente Windows anterior durante la transición. | Debe permitir recuperar datos y completar el traslado de sus usuarios. La retirada y el archivo son el resultado de una transición aceptada. |
| **livestock-manager-support-api** | Backend del soporte, identidad de la compra, tickets KV y relación con GitHub/IA. | Define el contrato que consumen ambos clientes y entrega un despliegue identificado. Sus pruebas deben cubrir compra, restauración, caducidad, aislamiento e historial. |
| **Autonomous-AI-Dev-Infrastructure** | Motor de ejecución de la factoría, perfiles de proyecto, persistencia y controles técnicos de autorización. | Implementa las políticas que le corresponden y registra qué política, código y pruebas se aplicaron a cada tarea. Expone un contrato para la consola. |
| **Console-AI-Dev-Infrastructure** | Interfaz operativa de los responsables de la factoría. Propongo usar este repositorio como origen mantenido de la consola de operación. | Presenta el expediente, recoge las decisiones del operador y usa los servicios de Factory. Hay que conciliar el trabajo de interfaz que también existe en `desktop_console/` dentro de Factory. |
| **Autonomous-Doc-Compliance** | Gobierno documental privado, procedimientos, políticas de agentes y conocimiento técnico curado. | Publica revisiones de políticas y decisiones con fecha y evidencia. Factory conserva la implementación del mecanismo de autorización y el producto conserva el código de dominio. |

La asignación de Console como origen mantenido es una propuesta organizativa. Hoy conviven la aplicación de su repositorio y otra interfaz en Factory. La PR #7 trabaja en esta segunda ubicación. Conviene decidir el destino antes de duplicar otra implementación.

Fuentes principales revisadas: [Maestro](https://github.com/SADOCKDOG/LIVESTOCK-MANAGER/tree/7d72dc5), [Desktop](https://github.com/SADOCKDOG/livestock-desktop/tree/c7c10608), [PWA](https://github.com/SADOCKDOG/livestock-pwa-msix/tree/4b67d3a6), [Worker](https://github.com/SADOCKDOG/livestock-manager-support-api/tree/95b0e9e9), [Factory](https://github.com/SADOCKDOG/Autonomous-AI-Dev-Infrastructure/tree/cc4f6e0b), [Console](https://github.com/SADOCKDOG/Console-AI-Dev-Infrastructure/tree/156fdd06) y [Compliance](https://github.com/SADOCKDOG/Autonomous-Doc-Compliance/tree/cdc3c19).

## 3. Publicaciones acreditadas por las capturas

| Plataforma y canal visible | Versión | Evidencia disponible |
|---|---|---|
| Google Play, prueba cerrada Alpha | **4.10.8, código 530** | Disponible para testers, lanzamiento completo. Última actualización visible del 27 de octubre a las 7:54. Un país de 178. |
| Google Play, prueba interna | **4.10.8, código 530** | Disponible para testers internos, lanzamiento completo. Última actualización visible del 27 de octubre a las 7:18. |
| Google Play, app bundles | **530 activo; 529 inactivo** | El 530 fue subido el 27 de octubre. La captura resuelve cuál es el código activo en esos canales. |
| Microsoft Store, Submission 17 | **4.10.526.0 neutral** y **4.10.525.0 x86** | Paquetes activos mostrados bajo esa submission. |
| Microsoft Store, Activación Licencia de Soporte | **Tauri 4.11.24.0 x64** | Paquete activo en la agrupación con ese nombre. La captura y la declaración del propietario acreditan su presencia en distribución. El colectivo elegible para cada agrupación requiere el detalle de asignación del canal. |
| Equipo auditado | **4.11.24.0 x64** | Get-AppxPackage identificó el paquete instalado, firma Store y estado Ok. Se obtuvo también SHA-256 del ejecutable. |

Las dos fuentes de captura son `codex-clipboard-c35fae6e-a777-4b11-88b4-d82199d06a76.png` y `codex-clipboard-d3335ecb-59c4-438c-9529-9c3108e97a65.png`, aportadas por el propietario en este chat. Las horas anteriores se transcriben como aparecen en la captura.

El 529 mostrado en `js/app-version.js` es un desfase del código visible respecto al bundle activo 530. Las capturas aún dejan pendiente vincular cada binario a un commit exacto y al resultado de sus pruebas. La fecha de distribución y el número 4.11.24.0 tampoco acreditan por sí solos qué mejoras posteriores del repositorio contiene el ejecutable instalado.

## 4. Lo que ya está hecho y sus límites

### Producto y consolidación

- El Maestro ya integra auditoría inicial (#203), accesos de soporte (#198), corrección del contrato de caducidad (#205), perfil declarativo (#201) y documentación D2-C (#206).
- Desktop integra auditoría v2 y mejoras de anulación (#13/#15). La PR #204 del Maestro prepara el retorno de ese trabajo y añade minimización de datos personales.
- Entre los 171 archivos JavaScript del Maestro con homólogo en Desktop hay 137 blobs idénticos y 34 distintos. Desktop añade 10. Las adaptaciones de guías, arranque, Store y piel explican parte de las diferencias.
- El servicio porcino coincide entre las revisiones auditadas. Su presencia es una evidencia histórica del ensayo y de la sincronización.
- El Worker responde en su URL pública. La suite local pasó 55 casos. El código confirmado de autenticación pasó el contraste TypeScript con la configuración local. Estos resultados identifican capacidades y disponibilidad básica; la revisión desplegada y las compras reales siguen por acreditar.

Referencias: [PR #204](https://github.com/SADOCKDOG/LIVESTOCK-MANAGER/pull/204), [PR #205](https://github.com/SADOCKDOG/LIVESTOCK-MANAGER/pull/205), [Desktop #15](https://github.com/SADOCKDOG/livestock-desktop/pull/15) y [Worker #14](https://github.com/SADOCKDOG/livestock-manager-support-api/pull/14).

### Recuperación

La copia de las 02:19 mantiene los 1.873 archivos enumerados en su manifiesto sin divergencias de tamaño o SHA-256. Los 558 archivos de la instantánea de #204 corresponden a `176548c` tras normalizar finales de línea y nombres. La revisión posterior `e4e7cfff` mejora la privacidad y añade regresiones. La integración puede tomar esa PR como base y conservar la copia como evidencia. Dos archivos del piloto recuperado requieren conciliación independiente. [Auditoría de recuperación](https://github.com/SADOCKDOG/Autonomous-AI-Dev-Infrastructure/blob/cc4f6e0/docs/governance/OWNER_AUTH_RECOVERY_AUDIT_2026-11-08.md)

### Gobierno

Factory ya integró el núcleo de autorización firmada y el bloqueo de aprobaciones sin firma y de transiciones directas a DONE (#5/#6). La interfaz #7 está en revisión y excluye la ejecución del merge. D2-B de Console cambió tres documentos; el código actual de su aprobación local sigue escribiendo DONE directamente en SQLite y su promoción contempla GitHub CLI, opción administrativa y limpieza local. Por tanto, la protección implementada en el servicio de Factory necesita cubrir también la ruta que utiliza Console. [Factory #5](https://github.com/SADOCKDOG/Autonomous-AI-Dev-Infrastructure/pull/5), [Factory #6](https://github.com/SADOCKDOG/Autonomous-AI-Dev-Infrastructure/pull/6), [interfaz #7](https://github.com/SADOCKDOG/Autonomous-AI-Dev-Infrastructure/pull/7) y [Console, código de aprobación y promoción](https://github.com/SADOCKDOG/Console-AI-Dev-Infrastructure/blob/156fdd06/console/app.py#L1753).

## 5. Brechas que determinan el orden

| Brecha | Consecuencia comprobada o pendiente de comprobar | Trabajo concreto |
|---|---|---|
| Sync desde el Maestro v1 hacia Desktop v2 | En copias aisladas, Desktop pasó 16/16 pruebas antes del sync y 0/16 después. El script sustituyó ocho archivos rastreados. | Resolver #204 y verificar la sincronización de regreso, conservando las adaptaciones nativas. |
| Diferencia entre el contrato histórico de pruebas y la privacidad actual | Con los cuatro archivos de implementación de #204, la suite histórica de Desktop pasó 15/16. La restante exige duplicar el motivo libre en auditoría. Con la suite actualizada de #204 y sus cuatro rutas adaptadas a `frontend/js`, pasaron **18/18** sobre la estructura de Desktop. | Incluir implementación y contrato de pruebas en la misma consolidación Windows. Mantener el motivo de negocio íntegro en su entidad y minimizarlo en el evento auditable. |
| Cinco escrituras pendientes de normalización | El mapa privado registra TASK-4B8E2C19 en READY al corte del 28 de octubre. El código actual aún contiene escrituras directas en movimientos, rebaños y zonas. Hay transacciones y reversión que deben conservarse. | Retomar esa tarea después de v2. Actualizar el inventario por puntos de entrada antes de editar. Mantener atomicidad, referencias, históricos y deduplicación. |
| Comandos de prueba alejados del alcance comercial | El perfil del Maestro ejecuta el ensayo porcino. Faltan algunos scripts anunciados por el README y el perfil apunta a un archivo de tokens ausente. | Recuperar SF-TECH-02: configurar pruebas reales de auditoría, censo/zonas, lácteo y soporte según sus ejecutores. Registrar fuente y artefacto probado. |
| Edición automatizada de archivos grandes | SF-TECH-01 propuso edición por parches. El agente revisado sigue pidiendo archivos completos con límite de salida de 8.192 tokens. | Comprobar y completar esa capacidad antes de encomendarle automáticamente la modificación integral de vistas grandes. Se puede mantener el producto mediante cambios acotados revisados por su procedimiento vigente. |
| Console y Factory tienen caminos distintos de autorización | El bloqueo del núcleo puede coexistir con la actualización directa de la base por la consola. | Conciliar las dos interfaces, establecer un contrato único para autorizar y probar el bloqueo desde el botón real de operación. |
| Gobierno documental y comportamiento actual divergen | El acta de octubre y el SOP describen cierre, firma e inmutabilidad. La revisión de noviembre identifica límites concretos y función de autorización aún desactivada. El inicializador de Console usa journal DELETE, aunque hay documentos que dicen WAL. | Conservar las actas como evidencia fechada y añadir el estado vigente, sus pruebas y la revisión a la que aplica. Resolver la política de DB en la integración Windows/WSL con pruebas de concurrencia y recuperación. |
| Base de conocimiento declarada y consumida difieren | Compliance describe consumo de su conocimiento por GitHub desde el Worker. El servicio revisado de conocimiento del Worker usa secciones estáticas, algunas con versiones, modelo comercial y comandos antiguos. Factory carga políticas desde el repo privado o alternativas locales y conserva caché. | Identificar y versionar el contenido efectivamente usado por los agentes y por el soporte. Actualizar los hechos y probar su consumo. Incluir revisión y hashes resueltos en el expediente. |
| Borrador del Worker sin confirmar | Son 69 líneas de migración, con tres errores de tipado y una incoherencia entre índice de tickets y propietario. | Preservarlo como borrador identificado. Diagnosticar identidad, sesión, compra e índice mediante tickets sintéticos antes de decidir su destino. |
| Continuidad PWA → Tauri | El nombre común LivestockDB v28 no demuestra acceso al mismo origen. Hay exportador JSON en la PWA servida e importador en Tauri. | Ensayar el traslado, comparar datos y relaciones y comprobar la cobertura x86. Probar licencia e historial remoto por separado. |
| Candidato Android y frontend de pruebas desalineados | Play tiene 530 activo; el cliente muestra 529. Las pruebas de interfaz revisadas servían una copia `www` diferente de las fuentes. El service worker presenta una discrepancia de rutas versionadas y precaché. | Construir un candidato identificado desde la revisión elegida, alinear metadatos y probar arranque sin red, actualización, copia/restauración y operaciones ganaderas en dispositivo. |

Las pruebas de sync son simulaciones locales en directorios aislados. El resultado 18/18 valida la adaptación de ese conjunto de archivos y tests; la aceptación del próximo MSIX incluye además construcción e interacción con Store.

Fuentes complementarias: [mapa de tareas pendientes](https://github.com/SADOCKDOG/Autonomous-Doc-Compliance/blob/cdc3c19/governance/MAPA_ARQUITECTURA_Y_MATRIZ_CAPACIDADES_20261028.md), [SOP](https://github.com/SADOCKDOG/Autonomous-Doc-Compliance/blob/cdc3c19/governance/PROCEDIMIENTO_GOBERNANZA_SOP-SF-001.md), [políticas de Factory](https://github.com/SADOCKDOG/Autonomous-AI-Dev-Infrastructure/blob/cc4f6e0/src/software_factory/agents/policy_manager.py), [conocimiento del Worker](https://github.com/SADOCKDOG/livestock-manager-support-api/blob/95b0e9e9/src/services/conocimiento.ts) y [sync de Desktop](https://github.com/SADOCKDOG/livestock-desktop/blob/c7c10608/scripts/sync-from-master.ps1).

## 6. Plan de ejecución completo

El orden se basa en la exposición actual, las dependencias y la posibilidad de verificar el cierre. No se asignan fechas hasta conocer la disponibilidad de los dispositivos y cuentas de prueba.

| Prioridad | Paquete de trabajo | Entregable y aceptación |
|---|---|---|
| **P0 · Antes del siguiente paquete Windows** | **Consolidación Maestro → Desktop.** Revisar #204, resolver sus observaciones y comprobar compatibilidad histórica. Sincronizar su resultado y las pruebas actualizadas a Desktop; revisar qué se preserva y cómo se selecciona la revisión del Maestro. | PR revisable por repo, diff explicado y suites correctas antes/después. MSIX candidato vinculado a sus dos commits. Caso real de anulación y avisos de fallo de auditoría verificados. |
| **P0 · Antes de otra promoción desde Console** | **Cerrar la vía de aprobación paralela.** Conciliar el código recuperado con #5/#6/#7 y el repositorio Console; documentar cuál es la interfaz operativa. Preparar la adaptación para que el botón use el contrato protegido. | La operación desde Console exige la autorización de la revisión prevista y no puede registrar éxito solo mediante actualización directa de una tarea. La validación real de FIDO y la ejecución se prueban en su propio entorno controlado. |
| **P0 · En paralelo** | **Preservación y registro de entregas.** Inventariar trabajo local de Factory, Console y Worker, instantáneas, archivos del piloto y artefactos publicados. Los checkouts contienen piezas ya integradas y piezas pendientes, por lo que hay que comparar por archivo y revisión. | Cada pieza tiene origen, hash, destino y decisión. Las capturas fijan los números publicados; el ejecutable y cada candidato quedan vinculados a commit y pruebas cuando esa trazabilidad esté disponible. |
| **P1 · Después de consolidar v2** | **TASK-4B8E2C19.** Normalizar auditoría en movimientos, rebaños y zonas desde el Maestro y llevar el resultado a Desktop. | Operaciones reales con hash v2, históricos intactos, ausencia de duplicados, rollback e identidad de zonas conservados. |
| **P1 · En paralelo al mantenimiento** | **SF-TECH-02 y SF-TECH-01.** Conectar las suites de negocio al perfil y verificar edición de archivos grandes. | Una tarea informa qué suites ejercitó y sobre qué fuente. El agente modifica un archivo grande manteniendo el contenido ajeno al cambio. |
| **P1 · Antes de retirar la PWA** | **Migración de usuarios Windows.** Probar actualización o exportación/importación de una instalación PWA a Tauri y elegibilidad de arquitectura/canal. | Datos y relaciones contrastados, instrucciones de recuperación y resultado del usuario x86. Después se fija la retirada del cliente y su alojamiento. |
| **P1 · Antes del siguiente envío Android y del cierre de soporte** | **Aceptación de plataformas y licencias.** Play 530 como antecedente; candidato nuevo identificado. Separar compra Premium Android de suscripción opcional. En ambas tiendas probar compra, restauración, renovación/caducidad y recuperación de un ticket. | Matriz por tienda y artefacto. Caducar soporte conserva derechos Premium. Reinstalar permite la continuidad que el contrato de identidad promete. Worker desplegado identificado y pruebas con datos sintéticos. |
| **P1 · Antes de declarar operativo el gobierno completo** | **Autorización end-to-end.** FIDO real, identidad ejecutora, permisos, persistencia, revocación, revisión diferente y resultado de merge incierto. Conciliar D2-A/B/C y las actas con el estado demostrado. | Evidencia enlazada desde tarea y revisión hasta la confirmación de GitHub. Las decisiones se mantienen coherentes ante error o reintento. |
| **P2 · Evolución del producto** | **PROD-P2.** Revalidar y priorizar intercambio SIGGAN, traducción BADIGEX y ampliación RFID con requisitos actuales y muestras sintéticas. Mejorar después accesibilidad, rendimiento y documentación. | Criterios funcionales aprobados por flujo, archivos aceptables para el destinatario previsto y regresiones de GeGan, ExPro y Comer correctas. |

Los dos primeros P0 responden a acciones distintas: construir un paquete Windows y promover código desde Console. El mantenimiento revisado del producto puede avanzar mientras se completa la validación de la factoría.

## 7. Cómo mantener el orden

Propongo un único registro de trabajo con tres vistas: producto, infraestructura y evidencia/publicación. Cada registro debe apuntar al repositorio propietario, requisito, revisión, PR, pruebas y estado de entrega. Las tareas SF-TECH permanecen en Factory; la normalización del dominio y PROD-P2 parten del Maestro; la piel y Store pertenecen a Desktop; el contrato de soporte pertenece al Worker. Compliance conserva las decisiones y los procedimientos y enlaza su implementación.

Una tarea de código puede estar revisada o integrada mientras el candidato de tienda sigue pendiente. Para expresarlo, registrar por separado estado del cambio, estado de validación y estado de publicación, conservando una definición inequívoca de DONE en cada flujo. Evitar reabrir trabajo integrado solo porque una copia local es anterior; comparar primero contra su PR y commit.

El expediente mínimo de entrega incluye versión/variante/plataforma, commit del repositorio y del Maestro usado, hash del artefacto, resultado de pruebas, canal y fecha, despliegue Worker cuando aplique y revisión de políticas consumidas. En el registro compartido basta enlazar el repositorio privado de cumplimiento y la evidencia autorizada.

## 8. Límites y decisiones de esta propuesta

La revisión incorpora ramas principales remotas, documentación y políticas, código de aprobación de Console, conocimiento realmente cargado, PR, commits, diffs y pruebas seleccionadas. Las capturas acreditan los paquetes y canales que muestran; la revisión no inspeccionó sus asignaciones privadas ni los datos de compradores. Los tickets y compras de producción, la operación FIDO física, la ejecución de una promoción y la validación legal de intercambios oficiales quedan como aceptación pendiente.

Esta entrega modifica documentación y aporta resultados de ensayos aislados. Las prioridades y la propuesta de consolidar la interfaz en Console son decisiones recomendadas para la planificación. Las afirmaciones históricas de certificación se conservan con su fecha y alcance; la capacidad actual se determina por la implementación y su evidencia de prueba.
