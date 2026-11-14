# Auditoría de situación de Livestock Manager y su relación con la factoría

Revisión inicial completada por la [propuesta integral del ecosistema](2026-11-11-propuesta-integral-producto-factoria.md). La revisión ampliada incorpora las capturas de tiendas, Console y el repositorio de cumplimiento, incluida la rectificación histórica del ensayo porcino y las tareas pendientes de producto y factoría.

**Fecha de corte:** 11 de noviembre de 2026. **Base del producto:** `master`, commit `7d72dc5`, coincidente con el HEAD de GitHub. El árbol de trabajo estaba limpio al iniciar la revisión.

## 1. Qué estamos haciendo y para qué

El proyecto tiene dos objetivos que se pueden evaluar por separado. Para el ganadero, el objetivo es gestionar la explotación desde el campo, conservar el historial por finca y poder preparar movimientos, documentación y decisiones de producción incluso sin conexión. Para el equipo de desarrollo, el objetivo es usar este producto real para demostrar que la factoría puede convertir una petición en un cambio probado, revisado, autorizado por el propietario e integrado con evidencias recuperables.

El historial de noviembre sitúa al equipo en **consolidación de un producto existente y de su proceso de entrega**. Ya se han integrado funcionalidades ganaderas y correcciones de soporte. La última entrega de este repositorio, D2-C, explica quién define el procedimiento de autorización y qué quedaba por validar en la revisión de Console. El siguiente hito operativo que se deduce de esa entrega es demostrar el recorrido desde una tarea hasta el código integrado y el artefacto entregado. Es una interpretación de las entregas y los documentos. El tablero operativo de la factoría y las fechas de lanzamiento no se consultaron.

## 2. Qué componente responde de cada entrega

**Trabajo abierto confirmado en GitHub.** Las dos entregas funcionales en revisión son la consolidación de AuditService v2 en el producto y la interfaz de autorización firmada en Factory. Esta segunda PR reside en el repositorio de infraestructura, aunque su título y su función se refieren a la consola. D2-C ya está integrado en los tres repositorios consumidores y D2-B está integrado en el repositorio propio de Console. [PR del producto](https://github.com/SADOCKDOG/LIVESTOCK-MANAGER/pull/204), [PR de interfaz](https://github.com/SADOCKDOG/Autonomous-AI-Dev-Infrastructure/pull/7), [Console](https://github.com/SADOCKDOG/Console-AI-Dev-Infrastructure/pull/1), [Windows](https://github.com/SADOCKDOG/livestock-desktop/pull/16) y [soporte](https://github.com/SADOCKDOG/livestock-manager-support-api/pull/14).

| Componente | Responsabilidad | Evidencia y límite |
|---|---|---|
| LIVESTOCK-MANAGER | Fuente común de la PWA y aplicación Android con Capacitor. Contiene reglas ganaderas, interfaz, almacenamiento, pruebas y proyecto Gradle. | Perfil local de la factoría, código fuente y metadatos Android. Se verificó la coincidencia con GitHub. |
| livestock-desktop | Cliente Windows/Tauri y distribución propia. | Historial local con cambios de auditoría y gobernanza. Un cambio en Android requiere comprobación independiente en Windows. |
| livestock-manager-support-api | Servicio de tickets, autenticación y suscripción consumido por los clientes. | Repositorio e historial propios. Las pruebas de este informe cubren el cliente JavaScript. El Worker desplegado y los datos de producción quedan fuera de esa prueba. |
| Factory | Define arquitectura, políticas, perfil de proyecto y diseño del intermediario de operaciones de desarrollo (DOI). | El producto referencia las especificaciones canónicas. El perfil selecciona un comando de prueba y otro de compilación. |
| Console | Interfaz del operador para supervisar tareas y gestionar su aprobación y promoción. | D2-B y el aviso de D2-C describen el alcance de la aprobación local. La evidencia documental está vinculada a una revisión específica de Console. |

Fuentes primarias del producto: [perfil de la factoría](../../.factory/config.json), [manifiesto de gobierno](../../.software-factory/project.yaml), [ciclo de vida y expediente piloto](../AI_GRC_LIFECYCLE.md), [gobernanza y canales de distribución](../../README.md), [arquitectura del soporte](../SOPORTE_INFRAESTRUCTURA.md).

## 3. Qué está hecho en el producto

| Área | Implementación localizada | Grado de comprobación |
|---|---|---|
| Explotación y censo | Fincas, rebaños, animales, zonas, altas, cambios, pesajes y movimientos. Las operaciones generan registros asociados a la finca. | Se ejecutaron pruebas de dominio sobre altas, modificaciones, pesajes, movimientos, aislamiento por finca e identidad de zonas. |
| Sanidad y trazabilidad | Tratamientos, saneamientos, vacunación y motor de trazabilidad. El flujo porcino comprueba origen y destino, identificación y periodos de retirada. Incorpora cálculo de conversión alimenticia (FCR). | Prueba porcina ejecutada sobre el código actual. Hay expediente histórico con capturas de integración en la interfaz. |
| Producción y economía | Control lechero, tanques, albaranes, reproducción, gastos, márgenes, compradores, proveedores, contratos y comercialización. | Se localizaron modelos, servicios, vistas y manuales. Esta revisión no recorrió cada operación con datos de una explotación. |
| Documentación e intercambio | Informes, exportaciones, importador RFID, ayudas y manuales HTML. La aplicación incluye catálogos y reglas para flujos SIGGAN/BADIGEX. | El plan SIGGAN da por cerrados los siete puntos de su revisión histórica dentro del alcance acordado. La validación oficial en línea figura en el roadmap. Esta auditoría no certifica conformidad jurídica ni aceptación de un envío por la Administración. |
| Persistencia y auditoría | IndexedDB v28, copias de seguridad y registro local de eventos. La auditoría distingue operaciones por finca, minimiza datos y maneja fallos de escritura. | La suite comprueba también exportación, restauración, deduplicación y saneamiento de la vista. Un fallo del registro puede dejar continuar la operación. Para reconstruir un expediente importa comprobar también la salud del registro. |
| Soporte y monetización | Panel de soporte, cliente de la API, acceso rápido, compra/restauración y configuración por variante. El soporte mensual es un complemento distinto de la compra Premium de Android. | Se verificaron la lógica de caducidad y la sincronización de correo del cliente. Queda por comprobar el ciclo de compra, identidad, historial y resolución con un artefacto identificado y el servicio correspondiente. |

Véanse [modelos y módulos](../../js), [servicios](../../js/services), [pruebas](../../tests), [manuales](../../manual), [plan SIGGAN y su alcance](../PLAN-MEJORA-SIGGAN.md) y [estado técnico histórico](../ESTADO_PROYECTO.md).

## 4. Qué demuestra el historial de entregas

| Entrega en el producto | Resultado integrado |
|---|---|
| PR #200 y #202 | Módulo porcino y cálculo FCR. Sirven como ejemplo de una regla de negocio que puede comprobarse automáticamente. |
| PR #201 | Perfil declarativo que identifica al repositorio como origen de Android/PWA, con rama base, prueba y compilación. |
| PR #198 y #205 | Accesos rápidos a soporte y consolidación en el cliente de la comprobación de suscripción expirada. |
| PR #203 | Registro de auditoría de negocio, cobertura de copias de seguridad y conexión con operaciones de censo, pesajes y movimientos. |
| PR #206, D2-C | Referencia canónica a la autorización del propietario. El contenido de la rama D2-C coincide con el de `master` en el corte auditado. |

Hay dos registros distintos. La **auditoría ganadera** recoge qué pasó en una explotación. La **auditoría de la factoría** debe poder acreditar quién autorizó integrar una revisión concreta del código. Las 30 comprobaciones de la primera aportan evidencia sobre datos y flujos de la aplicación. Para la segunda hace falta correlacionar la tarea, la aprobación, la revisión y el resultado en GitHub.

El expediente porcino conserva pruebas, capturas y una declaración de cierre. D2-C documenta que, en la base de Console `c67d62ab`, la aprobación local podía llevar una tarea a `DONE` y la promoción contemplaba integración y sincronización/limpieza sin la protección FIDO/DOI diseñada. Ese dato histórico sirve para definir qué verificar en la versión actual. Para acreditar la operación hacen falta tanto una promoción permitida por el propietario como la evidencia de que una revisión sin autorización queda bloqueada.

## 5. Hallazgos que cambian decisiones

**Avance posterior a D2-C.** La rama principal de Factory está en `cc4f6e0b`. Las PR #5 y #6 integraron el núcleo de autorización firmada con migraciones explícitas y el rechazo de la aprobación antigua sin firma y del paso directo a `DONE`. El contrato del test de integración del piloto cambió para que la tarea quede en `REVIEW`. Las PR describen la función desactivada por defecto, sin ejecutor de merge, y dejan pendientes la identidad efectiva de la App, custodia y permisos de credenciales, FIDO real, staging y la reconciliación de un resultado de merge incierto. Sus resultados de CI y pruebas son evidencia publicada por esas PR, no repetida en esta auditoría. La PR #7 añade interfaz y excluye la ejecución del merge. Esta distinción explica cómo puede haber controles ya implementados en Factory y seguir pendiente la validación integral desde Console. [Auditoría de recuperación](https://github.com/SADOCKDOG/Autonomous-AI-Dev-Infrastructure/pull/4), [núcleo firmado](https://github.com/SADOCKDOG/Autonomous-AI-Dev-Infrastructure/pull/5), [barrera de aprobación](https://github.com/SADOCKDOG/Autonomous-AI-Dev-Infrastructure/pull/6) e [interfaz abierta](https://github.com/SADOCKDOG/Autonomous-AI-Dev-Infrastructure/pull/7).

**Consolidación pendiente en Android/PWA.** Windows ya integró correcciones en la anulación de animales y su registro de auditoría. La PR #204 propone portar al producto compartido el hash v2, la verificación compatible con registros v1, el resultado explícito de la anulación y los avisos visibles de integridad y persistencia. GitHub la muestra abierta y técnicamente integrable. Su descripción pide mantenerla preparatoria. Las pruebas v2 que declara la PR corresponden a esa rama. Las pruebas de esta auditoría se han ejecutado sobre `master`. El cierre de esta línea consiste en revisar la compatibilidad con históricos y los avisos en el flujo real antes de decidir su integración. [PR #204](https://github.com/SADOCKDOG/LIVESTOCK-MANAGER/pull/204) y [origen en Windows](https://github.com/SADOCKDOG/livestock-desktop/pull/15).

1. **La PWA tiene un riesgo concreto en su promesa de trabajo sin conexión.** El HTML solicita scripts con `?v=6.90`; el precaché declara rutas sin esa consulta y el manejador usa `caches.match(event.request)` con sus opciones predeterminadas. Si no encuentra el recurso, hace `fetch` sin guardar la respuesta en ese manejador. Además, el servicio de auditoría y el servicio y vista porcinos se cargan desde el HTML y faltan en la lista inicial. La lista incluye `js/zonas.js`, ausente del árbol, y la instalación tolera errores por recurso. El efecto previsto es que una PWA instalada pueda carecer de scripts al arrancar sin red. Es un hallazgo de código que requiere reproducción en navegador con caché HTTP fría. El registro de este service worker está condicionado al modo web. [Arranque](../../index.html) y [service worker](../../sw.js).
2. **Una prueba de interfaz puede examinar otra compilación.** Las suites de arranque y soporte sirven `www`. En esta máquina tanto `www/index.html` como `www/js/app.js` tenían hashes distintos de sus fuentes en la raíz. La prueba de arranque también contiene una ruta absoluta a este equipo. Un aprobado sobre esa copia no certifica el commit auditado. Cierre verificable: generar la variante en un directorio limpio desde el commit elegido, identificar los archivos servidos y ejecutar allí las pruebas. [Build](../../package.json), [arranque](../../tests/app-boot.spec.js) y [soporte](../../tests/soporte-panel-playwright.spec.js).
3. **“Pruebas superadas” tiene un alcance demasiado estrecho en el perfil de la factoría.** El comando declarado ejecuta solo trazabilidad porcina. El manifiesto contempla `npm test`, y el README anuncia `test:qa`, `lint` y `format`; esos scripts faltan en `package.json`. El perfil también apunta a `css/theme.css`, ausente del árbol, mientras el producto carga `css/design-tokens.css`. Esto puede producir un resultado verde para cambios de soporte o auditoría que la prueba seleccionada nunca ejercita. [Perfil](../../.factory/config.json), [scripts reales](../../package.json) y [manifiesto](../../.software-factory/project.yaml).
4. **La versión visible no identifica inequívocamente la compilación Android.** Gradle declara `4.10.8 (530)`; la aplicación declara `4.10.8 (529)` y el README atribuye 529 a la prueba cerrada. Pueden coexistir una publicación anterior y un candidato posterior. Lo que sí difiere en el mismo árbol es el número de Gradle frente al del cliente. El informe histórico también cita caché `corcho-v6.86`, frente a `corcho-v6.90` en el código. Identificar los paquetes por versión, código, variante, commit y hash evitaría atribuir una incidencia al artefacto equivocado. [Gradle](../../android/app/build.gradle), [versión del cliente](../../js/app-version.js) y [fotografía histórica](../ESTADO_PROYECTO.md).
5. **La documentación mezcla políticas, arquitectura real y antecedentes.** Por ejemplo, el manifiesto nombra Dexie y el arranque de la base usa el adaptador local `idb.openDB`. En gobierno, el ciclo de vida describe aprobaciones obligatorias y el README de D2-C precisa qué estaba aún por demostrar. Para decidir una publicación o promoción conviene enlazar cada afirmación operativa a su evidencia, revisión y fecha. [Base de datos](../../js/db.js), [manifiesto](../../.software-factory/project.yaml) y [D2-C](../../README.md).

## 6. Qué falta y cómo reconocer que se ha terminado

| Orden propuesto | Actuación y responsable funcional | Evidencia de cierre |
|---|---|---|
| 1. Entrega fiable del producto | Android/PWA y QA. Alinear metadatos, construir la variante en limpio y revisar el precaché. | Un candidato identificado; arranque, lectura por finca, movimiento y consulta de auditoría tras cortar la red y reabrir la PWA. Repetir en Android instalado. |
| 2. Pruebas reproducibles | Mantenedores del producto y de Factory. Alinear los comandos con las suites reales, la ubicación de los tokens y las rutas portables. | Desde un checkout limpio se ejecutan las pruebas pertinentes. El registro identifica el commit, los comandos, el resultado y el artefacto. |
| 3. Gobierno operativo | Equipos de Factory y Console y propietario. Revisar la rama principal efectiva de ambos, identificar las operaciones protegidas y cerrar el recorrido de autorización. | Un expediente enlaza tarea, identidad aprobadora, revisión exacta, decisión, integración y registro. Una aprobación ausente o aplicada a otra revisión impide promover. |
| 4. Aceptación de soporte y Windows | Responsables del cliente, del Worker y de distribución. Probar alta de ticket, respuesta, cierre, historial tras reinstalación y estado de suscripción. Verificar en Windows exportación CSV, navegación de Lácteo/Finanzas y acceso al manual SIGPAC. | Resultados por plataforma y versión, identificador del despliegue de prueba, archivo exportado recuperable y ticket visible tras restaurar la identidad. Los casos de Windows son comprobaciones de regresión, sin diagnóstico nuevo en este informe. |
| 5. Distribución | Responsable de cada tienda. Contrastar la prueba cerrada de Android y los canales público y de vuelo de Windows con sus consolas de distribución. | Ficha de cada canal con versión realmente disponible, público destinatario y artefacto probado. El README presenta Windows 4.10.526 público y 4.11.24.0 en vuelo como antecedentes. |
| 6. Evolución | Producto. Priorizar las líneas de v5 después de conocer el resultado de aceptación del producto actual. | Decisión de alcance por iniciativa. El README enumera servicios oficiales en línea, análisis predictivo, IoT, multidioma y sincronización con resolución de conflictos. También enumera mejoras continuas de accesibilidad, rendimiento, ayudas y migración gradual a TypeScript. No se encontró un compromiso de fecha en ese roadmap. |

El orden es una propuesta de la auditoría. La comprobación de gobierno puede avanzar en paralelo a la del producto. La disponibilidad general de Android, la paridad con Windows y la autorización operativa de la factoría tienen criterios de aceptación independientes.

## 7. Pruebas ejecutadas y límites del dictamen

| Verificación | Resultado el 11 de noviembre | Qué permite concluir |
|---|---|---|
| Node sobre auditoría, trazabilidad porcina y cliente de soporte | Salida 0. La suite de auditoría informó 30/30, la porcina terminó satisfactoriamente y pasaron los 11 casos de soporte. | Las operaciones y reglas concretas ejercitadas funcionan en la fuente de `master`. Las baterías usan entornos controlados. |
| Playwright sobre identidad y duplicados de zonas | 13/13 aprobadas con el ejecutor de Playwright. | Se comprobaron reglas de identidad, referencias vinculadas y reversión transaccional con la fuente actual. |
| Chromium sobre arranque y panel de soporte | 8/9 aprobadas en `www`. Pasaron ambos casos de arranque y seis del panel. El último, asociado al aviso de caducidad, terminó con timeout en `afterAll` al cerrar el navegador. | Se observó el ciclo abrir, minimizar, reabrir y cerrar. El timeout impide declarar verde la suite y por sí solo no demuestra un defecto en el aviso. Los hashes limitan el resultado a la copia servida. |
| GitHub | HEAD del producto `7d72dc5`, Factory `cc4f6e0b`, Console `156fdd06`, Windows `c7c10608` y API `95b0e9e9`. | Las PR abiertas observadas fueron producto #204, Factory #7, Windows #14 y soporte #10. Las dos últimas son actualizaciones de dependencias. Console no tenía PR abierta en la consulta. |

Para reproducir las verificaciones locales desde la raíz, con las dependencias del proyecto instaladas:

```powershell
node --test tests/audit-service.unit.test.js tests/porcine-traceability.unit.test.js tests/support-api.test.cjs
node node_modules/@playwright/test/cli.js test tests/zonas-duplicados.unit.test.js --workers=1
node node_modules/@playwright/test/cli.js test tests/app-boot.spec.js tests/soporte-panel-playwright.spec.js --workers=1
```

La revisión abarca arquitectura, historial, módulos, documentación, configuración de integración y pruebas seleccionadas. Los resultados no incluyen una compilación Android firmada, una sesión en dispositivo físico, una consulta a Play Console o Partner Center, una operación real contra el Worker, una prueba FIDO con el propietario ni una revisión exhaustiva de seguridad o normativa. Los estados de tienda citados proceden del README. Ninguna de las comprobaciones exigió publicar, fusionar ramas ni cambiar datos de explotaciones.
