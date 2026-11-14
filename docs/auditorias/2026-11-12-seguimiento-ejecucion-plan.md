# Seguimiento de ejecución del plan integral

Fecha: 12 de noviembre de 2026

Este seguimiento registra el trabajo posterior a la auditoría integral y la aprobación del plan. Los cambios remotos continúan sujetos a revisión por PR; no se han fusionado ramas ni publicado paquetes en tiendas.

## Estado por producto y repositorio

| Área | Estado ejecutado | Estado de integración / evidencia |
| --- | --- | --- |
| Maestro Android — `LIVESTOCK-MANAGER` | Consolidación de auditoría v2, regresión para conservar la finca del animal al anular y actualización de caché, incluidas vistas diferidas. Build `free` y validaciones unitarias y de navegador sintético completadas en el worktree. | PR [#204](https://github.com/SADOCKDOG/LIVESTOCK-MANAGER/pull/204), commit `27c39150915d7343cfe211cbe97b6a453d06061a`, abierto y con los cuatro checks CodeQL en verde. Sin merge ni nuevo AAB/publicación Play. |
| Piel ERP — `livestock-desktop` | Sincronizada desde el árbol Git inmutable del Maestro `27c3915`; se preservó la capa específica de escritorio. Preflight: 30 pruebas (19 de hash/auditoría y 11 de soporte), todas aprobadas. Token de caché de shell/vistas diferidas subido a `7.45`. | PR borrador [#17](https://github.com/SADOCKDOG/livestock-desktop/pull/17), commit `9e3a8477985a6dc45965aaac0f97a28865aeff50`. Se generó el bundle MSIX x64 `4.11.24.0`; hash bundle `602e202771e591def368a16aa66b355f7762f41a2e7c18b99289c0952d5b00fc`. Bundle, MSIX x64 y manifiesto copiados a `owner-auth-evidence/2026-11-12-msix-candidato`; MakeAppx desempaquetó correctamente bundle y paquete. El manifiesto confirma identidad Store `SdogFarmSoftwareFactory.LIVESTOCKMANAGER`, publicador y versión `4.11.24.0`. Candidato no firmado, no instalado ni publicado. |
| Console — `Console-AI-Dev-Infrastructure` | La aprobación exige autorización firmada del propietario asociada al snapshot revisado de la PR. Se restringió el cliente a API loopback y se deshabilitó la promoción directa hasta disponer de executor independiente. `pytest tests -q`: 16 aprobadas. | PR borrador [#2](https://github.com/SADOCKDOG/Console-AI-Dev-Infrastructure/pull/2), commit `4dbe9f2a2b0f00445cee80bfa974af6b92afcb78`. Falta integración con llave FIDO física y prueba real de revocación; las pruebas usan firma simulada. Pytest notificó un error de permisos al limpiar un directorio temporal después del resumen exitoso. |
| Autonomous AI Dev Infrastructure — Factory | El trabajo local recuperado quedó inventariado y sellado en `owner-auth-evidence/2026-11-11-plan-aprobado`. No se alteró la copia histórica aceptada de las 02:19. | No se publicó cambio nuevo de Factory en este tramo. La autorización de Console consume la API/contrato local que se debe coordinar con la Factory; la promoción de producción permanece bloqueada. |
| Worker de soporte — `livestock-manager-support-api` | Se mantienen diferenciados el contrato estático documentado y la implementación real del Worker. El Desktop valida contra el cliente/contrato correspondiente en el snapshot Maestro. | No se desplegó ni modificó el Worker en este tramo. La copia local recuperada permanece preservada en el inventario sellado. |
| `Autonomous-Doc-Compliance` | Se mantiene como fuente de requisitos y de los gaps funcionales/técnicos ya identificados. | No se cambió el repositorio Compliance en este tramo. Siguen pendientes la normalización de cinco escrituras de auditoría (TASK-4B8E2C19), la capacidad para archivos grandes (SF-TECH01) y suites con ejecución real (SF-TECH02). |
| PWA Microsoft — `livestock-pwa-msix` | Se conserva como producto legado destinado a retirada y sustitución por la Piel ERP Tauri. | No se publicó ni se alteró su paquete. Las capturas facilitadas muestran PWA `4.10.526.0` neutral y clásica `4.10.525.0` x86 en Submission 17. |

## Orden actualizado

1. **P0 — integrar el Maestro:** completar la revisión normal del PR #204 y fusionarlo cuando la revisión funcional confirme el cambio. Los checks automáticos de este SHA están verdes; el build de tienda Android y la distribución a Play son pasos independientes y no se han realizado.
2. **P0 — validar el candidato Tauri:** habilitar Windows Sandbox o disponer de una VM Windows aislada, preparar firma de prueba apropiada, instalar el MSIX y verificar auditoría/soporte. El build completó con `cargo-tauri` 2.8.4 desde `owner-auth-evidence/2026-11-12-tauri-cli`, sin cambiar el lockfile del producto. MakeAppx desempaquetó ambos contenedores correctamente. No se encontró el ejecutable de Sandbox; no se pudo determinar si está deshabilitado o no instalado porque DISM devuelve `740` y requiere elevación para consultar características. El paquete no está firmado, por eso no se instaló sobre el perfil activo. Tras validar la instalación, revisar y cerrar el PR #17 antes de promoverlo.
3. **P0 — cerrar el control de Console:** revisar el PR #2; verificar con FIDO físico el ciclo de autorización y revocación. Mantener deshabilitada la promoción a producción hasta diseñar, revisar y validar un executor aislado con evidencia de resultado.
4. **P1 — terminar conformidad de datos:** normalizar las cinco escrituras de auditoría pendientes en movimientos, rebaños y zonas; ampliar suites de ejecución real y admitir parches pequeños para archivos grandes.
5. **P1 — armonizar soporte:** documentar la fuente de conocimiento efectiva del Worker y alinear su descripción con el código; añadir evidencia integrada entre Android, Tauri y el API de tickets.
6. **P2 — retirar PWA:** preparar retirada coordinada solo después de identificar, instalar y validar el reemplazo Tauri en Microsoft Store.

## Límites de esta actualización

- Las capturas de Play y Microsoft Store son evidencia aportada por el usuario; no se volvió a consultar ni modificar las consolas.
- Un build Android `free` no equivale a un AAB firmado, a una compra verificada ni a una publicación en Google Play.
- Las pruebas de navegador del Maestro usaron IndexedDB sintético y bloquearon Service Workers; no acreditan actualización offline.
- El paquete de escritorio `4.11.24.0` aportado como producción no se ha vinculado aquí a un commit fuente exacto. El candidato futuro debe asociarse a SHA de fuente, hash del paquete y resultado de instalación.
- Los PR #17 y #2 se dejaron como borradores mientras falta validar la instalación MSIX y completar FIDO/executor, respectivamente; ninguno se ha fusionado.
