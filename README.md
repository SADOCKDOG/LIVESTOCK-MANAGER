# LIVESTOCK MANAGER

Plataforma de gestión ganadera diseñada para operación profesional y cumplimiento normativo, adaptada al marco SIGGAN (Andalucía) y al contexto BADIGEX (Extremadura).

## 1. Estado actual

La aplicación se encuentra en una fase funcional consolidada, con cobertura de procesos clave de explotación y ganadería, trazabilidad reforzada y flujos administrativos estructurados para operación diaria y auditoría.

## 2. Alcance funcional

LIVESTOCK MANAGER integra en una sola aplicación:

- Gestión de explotación (REGA, terceros, contratos, gastos).
- Gestión ganadera (animales, rebaños, zonas, traslados, censo).
- Movimientos oficiales y documentación asociada.
- Comercialización de carne y leche.
- Sanidad y tratamientos.
- Registro de eventos y auditoría operativa.

## 3. Adaptación SIGGAN implementada

### 3.1 Trazabilidad y auditoría

- Sustitución de borrado destructivo en entidades críticas por anulación trazable.
- Registro de acciones en `registro_eventos`.
- Conservación de histórico para revisión técnica y normativa.

### 3.2 Flujo administrativo

Se han incorporado en procesos relevantes:

- Estado de trámite (`borrador`, `presentado`, `aceptado`, `rechazado`).
- Fecha de presentación.
- Número de registro oficial.
- Acuse de recibo.

La persistencia documental se realiza en `documentos_legales`.

### 3.3 Validación de consistencia

- Validaciones cruzadas entre animales, crotales y número declarado.
- Validación de datos obligatorios según tipo de trámite.
- Refuerzo de validaciones en asistentes de guía, traslado y censo.

## 4. Arquitectura técnica

- Frontend: HTML, CSS y JavaScript.
- Persistencia local: IndexedDB.
- Entorno móvil: Capacitor (Android).
- Soporte PWA: `manifest.webmanifest` y `sw.js`.

## 5. Estructura del repositorio

```text
.
├─ index.html
├─ css/
├─ js/
│  ├─ views/
│  │  └─ wizards/
│  ├─ qa-siggan.js
│  ├─ qa-test-runner.js
│  └─ qa-diagnostico.js
├─ icons/
├─ www/                    # salida de build para Capacitor (no versionada)
├─ android/                # proyecto Android (no versionado)
├─ sync-mirrors.ps1
├─ capacitor.config.ts
└─ package.json
```

## 6. Requisitos

- Node.js 18 o superior.
- npm.
- Android Studio.
- JDK compatible con Capacitor 5.

## 7. Instalación

```bash
npm install
```

## 8. Comandos principales

```bash
npm run build
npm run cap:sync
npm run cap:open
```

Descripción:

- `npm run build`: genera `www` copiando recursos web.
- `npm run cap:sync`: ejecuta build y sincroniza con Android.
- `npm run cap:open`: abre el proyecto Android.

## 9. Flujo operativo recomendado

Este proyecto se opera en dos checkouts locales sincronizados a través de GitHub (`origin/master`):

- `C:\livestock-manager`: entorno de build y prueba Android.
- `C:\Users\yo\repo\LIVESTOCK-MANAGER`: entorno de sesiones Copilot/worktrees.

Norma de trabajo:

1. Al iniciar sesión de trabajo:
   ```bash
   git pull --ff-only origin master
   ```
2. Tras validar cambios:
   ```bash
   git add -A
   git commit -m "mensaje"
   git push
   ```
3. Si hay cambios web (JS/CSS/HTML), ejecutar:
   ```powershell
   .\sync-mirrors.ps1
   ```
4. Si se modifica `sw.js`, incrementar `CACHE_NAME` para invalidación de caché.

## 10. Validación funcional y QA

Desde consola de la aplicación:

```js
await SigganQA.runAll();
await SigganQA.run("coverage");
await SigganQA.cleanup();
```

Utilidades adicionales:

- `window.QATestRunner.runAll()`
- `window.QATestRunner.runLevel(1-7)`
- `window.QADiagnostico.run()`

## 11. Proceso de integración a master

1. Publicar la rama de trabajo:
   ```bash
   git push -u origin <branch>
   ```
2. Crear Pull Request a `master`.
3. Verificar build y QA.
4. Ejecutar merge del Pull Request.

## 12. Licencia

Repositorio privado de uso interno del proyecto.

