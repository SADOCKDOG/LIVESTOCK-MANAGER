# Instrucciones del repositorio — LIVESTOCK-MANAGER

## ⚠️ Disciplina de sincronización (LEER AL INICIAR CADA SESIÓN)

Este repositorio se trabaja desde **dos checkouts locales** que apuntan al mismo
GitHub (`origin`). **GitHub (`origin/master`) es la única fuente de verdad.** Los
checkouts NO se sincronizan entre sí: se sincronizan a través de GitHub.

- `C:\livestock-manager` → clon de trabajo manual + entorno Android (`android/`,
  `node_modules/`, `www/`). Aquí se edita, se compila y se prueba en Android.
- `C:\Users\yo\repo\LIVESTOCK-MANAGER` → checkout que usa la app de Copilot para
  sus sesiones/worktrees. **No borrar:** la app lo necesita.

### Reglas obligatorias

1. **Al INICIAR sesión (en cualquiera de los dos checkouts):**
   ```
   git pull --ff-only origin master
   ```
   Traer siempre lo último antes de tocar nada.

2. **Al TERMINAR cambios validados:**
   ```
   git add -A
   git commit -m "..."
   git push
   ```
   Nunca dejar trabajo sin commitear/pushear: esa es la causa de que los
   checkouts diverjan.

3. **Tras validar cambios en código web (JS/CSS/HTML/manual), ejecutar
   `sync-mirrors.ps1`** para dejar idénticas las 4 ubicaciones (raíz, `www/`,
   Android src y build) antes de compilar/probar en Android:
   ```
   .\sync-mirrors.ps1
   ```
   - El script valida la sintaxis de todo el JS y aborta si hay errores.
   - Recuerda: si editaste en la **raíz** (p. ej. desde Copilot), copia primero
     raíz → `www/` (ver sección de build); si editaste en `www/`, ejecútalo
     directamente. Después **commitea la raíz** y haz `push`.

4. **No borrar ninguno de los dos checkouts.** No son duplicados redundantes;
   tienen funciones distintas.

## Estructura y build (PWA Capacitor/Android)

- Git versiona la **raíz** del repo. `www/`, `android/` y `node_modules/` están
  en `.gitignore` (son salida de build) — **no se commitean**.
- `sync-mirrors.ps1` trata **`www/` como fuente de verdad** y propaga a 4
  ubicaciones: raíz, `android/.../assets/public` (src y build). Tras editar en
  `www/` y correr el script, hay que **commitear los cambios de la raíz** a git.
  - Si los cambios se hicieron en la **raíz** (p. ej. desde Copilot), antes de
    correr `sync-mirrors.ps1` hay que copiar raíz → `www/` para no revertirlos.
- Si se cambia cualquier JS, **subir `CACHE_NAME` en `sw.js`** (service worker)
  para forzar refresco de caché en el dispositivo.
- Compilar/sincronizar a Android: `npm run cap:sync` (build + `cap sync android`).

## Contexto funcional

App de gestión ganadera (ovino/caprino) en español, adaptada al sistema
**SIGGAN** (Sistema Integrado de Gestión Ganadera, Junta de Andalucía) y BADIGEX
(Extremadura): validación/normalización de código REGA, libro de registro,
movimientos inter-explotación, saneamientos, tratamientos veterinarios y export
CSV/XML oficial. La suite de QA SIGGAN está en `js/qa-siggan.js`
(`window.SigganQA.runAll()`).
