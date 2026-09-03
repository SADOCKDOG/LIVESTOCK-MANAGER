# Soporte con IA — Livestock Manager

> **Estado: documento de diseño (agosto de 2026).** El sistema ya está
> implementado y en producción desde la 4.10.8 (529). Algunas decisiones se
> resolvieron de forma distinta a lo que se planteaba aquí — sobre todo la
> identidad del usuario, ver 5.2. Para el comportamiento real, la referencia es
> el README de `livestock-manager-support-api`.

## 1. Resumen

Sistema de soporte técnico integrado en la app, disponible para usuarios registrados con licencia de soporte activa. El usuario reporta una incidencia desde la propia app; un agente de IA la estructura y crea un issue en GitHub de forma transparente (el usuario nunca ve GitHub, solo una pantalla de "Mis incidencias" dentro de la app).

## 2. Objetivo

- Ofrecer soporte profesional sin que el usuario perciba la infraestructura técnica subyacente.
- Reducir la fricción de reportar problemas (la IA convierte texto libre en un reporte estructurado).
- El sistema nunca genera código ni PR: el soporte son solo issues de GitHub. La IA estructura y crea el issue; el mantenedor no aprueba nada, solo lee, prioriza y responde.
- Monetizar el soporte mediante una licencia mínima, reutilizando la infraestructura de billing ya existente.

## 3. Flujo de usuario (end-to-end)

1. Usuario con licencia activa entra a "Soporte" dentro de la app.
2. Describe el problema en lenguaje natural (texto libre, opcionalmente adjunta capturas).
3. La app envía la incidencia al backend, autenticada con el token de sesión del usuario.
4. El backend verifica: usuario válido + licencia de soporte activa + no ha superado el rate limit.
5. El backend llama a la IA para estructurar el reporte (título, descripción, pasos de reproducción, severidad estimada) y, opcionalmente, sugiere una causa/solución técnica.
6. Se devuelve el borrador a la app; el usuario lo revisa, edita si quiere, y confirma.
7. Al confirmar, el backend crea el issue en el repo de soporte dedicado (privado) vía GitHub App.
8. El backend guarda el mapeo `ticket_id_interno ↔ issue_id_github ↔ usuario_id` en el almacenamiento.
9. El ticket aparece en "Mis incidencias" dentro de la app, con estado inicial "Enviada".
10. Cambios en GitHub (comentarios, etiquetas, cierre) disparan un webhook que actualiza el estado en el backend.
11. La app consulta periódicamente (o recibe push) las actualizaciones y refleja el nuevo estado.
12. El sistema no sugiere ni crea fixes de código: la incidencia es un issue de GitHub. Si la IA apunta a una posible causa, queda como comentario en el issue. El mantenedor no tiene ningún paso de aprobación; solo lee y responde.

## 4. Arquitectura de componentes

┌──────────────────┐ HTTPS ┌───────────────────────┐
│ App (cliente) │ ───────────────▶│ Cloudflare Worker │
│ Android/PWA/MSIX │ ◀─────────────── │ (backend soporte) │
└──────────────────┘ └───────────┬────────────┘
│
┌───────────────────────────┼───────────────────────┐
▼ ▼ ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│ IA (estructura │ │ GitHub App │ │ Google Play Developer │
│ el reporte) │ │ (crea issue) │ │ API (verifica compra) │
└──────────────────┘ └──────────────────┘ └──────────────────────┘
│
▼
┌──────────────────────┐
│ Repo soporte (privado) │
│ + Webhook → Worker │
└──────────────────────┘
│
▼
┌──────────────────────┐
│ Cloudflare KV / D1 │
│ (mapeo tickets) │
└──────────────────────┘



## 5. Componentes detallados

### 5.1 Backend (Cloudflare Worker) — nuevo repo `livestock-manager-support-api`

**Endpoints necesarios:**

| Método | Ruta | Función |
|---|---|---|
| `POST` | `/tickets` | Recibe descripción, estructura con IA, devuelve borrador |
| `POST` | `/tickets/confirm` | Confirma el borrador, crea el issue en GitHub |
| `GET` | `/tickets` | Lista tickets del usuario autenticado |
| `GET` | `/tickets/:id` | Detalle y estado de un ticket |
| `POST` | `/webhooks/github` | Recibe eventos de GitHub (firmados con secret) |
| `POST` | `/auth/verify-purchase` | Verifica licencia de soporte vía Google Play |

**Variables de entorno / secretos (Cloudflare Worker Secrets):**
- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_APP_INSTALLATION_ID`
- `GITHUB_WEBHOOK_SECRET`
- `AI_API_KEY` (proveedor del modelo)
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (para verificar compras)
- `JWT_SECRET` (o equivalente para validar sesión de usuario)

**Lógica de rate limiting:** contador por `usuario_id` en KV, ej. máximo 5 tickets/día, reseteable a las 24h.

### 5.2 Identidad de usuario (nuevo)

- Autenticación mínima: email + código de un solo uso (OTP), o Google Sign-In (más simple de integrar con Play Billing).
- Al autenticarse, el backend emite un JWT de corta duración que la app adjunta en cada llamada.
- Tabla de usuarios mínima: `user_id`, `email`, `play_purchase_token`, `licencia_activa_hasta`.

> **Lo implementado no es esto.** No hay cuentas, ni OTP, ni Google Sign-In: al
> ganadero no se le pide nada. El `user_id` se deriva del `purchase_token`
> (`SHA-256`), y como Google emite otro token al recomprar, la app manda además
> un id de instalación que vive en su IndexedDB y viaja en la copia de
> seguridad. El servidor decide con él si adopta la identidad anterior, con una
> regla que no es obvia y que ya costó una pérdida de historial en producción.
> El JWT de corta duración sí se conserva tal cual.
>
> El detalle está en la sección **Identidad del usuario** del README de
> `livestock-manager-support-api` y en `src/services/identidad.ts`. Google
> Sign-In sigue en el plan, pero para la fase 2 (copia en Drive), no para
> identificar al usuario de soporte.

### 5.3 Verificación de licencia de soporte

- Producto nuevo en Google Play Billing: `support_unlock` (compra única) o suscripción mensual, según se decida.
- El cliente envía el `purchase_token` tras la compra.
- El backend lo valida contra la **Google Play Developer API** (`purchases.products.get` o `purchases.subscriptions.get`), nunca confía en el estado que reporte el cliente.
- Se cachea el resultado con expiración corta para no golpear la API de Google en cada ticket.

### 5.4 GitHub App

- Crear en `Settings → Developer settings → GitHub Apps`.
- Permisos: **Issues: Read & Write** únicamente. Nada de `contents`, `pull requests` ni `administration`.
- Instalar solo en el repo de soporte dedicado.
- Autenticación desde el Worker: JWT firmado con la clave privada de la App → intercambio por installation token (expira en 1h).

### 5.5 Repo de soporte dedicado

- Nuevo repo privado, ej. `livestock-manager-support-tickets`.
- Cada issue = un ticket. Labels sugeridas: `estado:enviada`, `estado:revision`, `estado:curso`, `estado:resuelta`, `severidad:alta/media/baja`.
- Plantilla de issue generada por la IA con estructura fija (título, descripción, pasos, contexto del usuario — versión de app, dispositivo).

### 5.6 Almacenamiento (Cloudflare KV o D1)

**Esquema mínimo (tabla `tickets`):**

| Campo | Tipo | Descripción |
|---|---|---|
| `ticket_id` | string (uuid) | ID interno mostrado al usuario |
| `github_issue_number` | int | Referencia al issue real |
| `user_id` | string | Usuario que lo creó |
| `estado` | string | enviada / revision / curso / resuelta |
| `titulo` | string | Generado por IA |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Tabla `users`:**

| Campo | Tipo |
|---|---|
| `user_id` | string |
| `email` | string |
| `licencia_soporte_activa` | boolean |
| `licencia_expira` | timestamp |

### 5.7 Webhook de GitHub

- Configurado en el repo de soporte, apuntando a `POST /webhooks/github`.
- Eventos a escuchar: `issues` (labeled, closed, reopened), `issue_comment`.
- Verificar la firma HMAC con `GITHUB_WEBHOOK_SECRET` antes de procesar.
- Traduce labels de GitHub → estado interno → actualiza KV/D1.

### 5.8 UI nueva en la app

- `js/views/soporte-view.js`: formulario de nueva incidencia + pantalla de confirmación del borrador generado por IA.
- `js/views/mis-incidencias-view.js`: listado con estado traducido, detalle de cada ticket.
- `js/services/support-service.js`: llamadas HTTP al backend.
- `js/services/auth-service.js`: gestión de sesión (login, token JWT, refresco).
- Entradas nuevas en el router (`js/app.js`) y en la navegación principal.
- Traducción de estados para mostrar en español natural:
  - `enviada` → "Enviada"
  - `revision` → "En revisión"
  - `curso` → "En curso"
  - `resuelta` → "Resuelta"

## 6. Seguridad — principios no negociables

- El usuario **nunca** tiene un token de GitHub propio; solo interactúa con el backend propio.
- GitHub App con permisos mínimos (`Issues: write`), no un Personal Access Token personal ni acceso a todo el repo.
- Instalación de la GitHub App limitada al repo de soporte, nunca al repo de código fuente.
- Tokens de instalación de corta duración (~1h).
- Rate limiting por usuario para evitar spam/abuso, incluso de usuarios legítimos.
- Sanitización del contenido generado por IA antes de publicarlo (evitar inyección de markdown/HTML peligroso).
- Verificación server-side de la compra — nunca confiar en el estado enviado por el cliente.
- Branch protection en `main` del repo principal: nada de push directo, todo vía PR revisado.
- El usuario valida su **propio reporte** (human-in-the-loop a su nivel). El sistema nunca genera código ni PR; el mantenedor no aprueba nada, solo lee, prioriza y responde.
- El sistema no genera código ni PR. Si la IA sugiere una solución, queda como comentario en el issue; el mantenedor no tiene ningún paso de aprobación.
- Webhook de GitHub verificado por firma HMAC, rechazando cualquier payload no firmado correctamente.

## 7. Organización de repositorios y ramas

| Repo | Acción |
|---|---|
| `LIVESTOCK-MANAGER` | Nueva rama `feature/soporte-ia`: auth, UI, llamadas al backend |
| `livestock-manager-support-api` (nuevo) | Repo independiente para el Cloudflare Worker (contiene secretos, despliegue propio) |
| `livestock-manager-support-tickets` (nuevo) | Repo privado dedicado a los issues/tickets |
| `livestock-pwa-msix` | Sin rama propia — hereda el cambio vía `sync-from-source.ps1` una vez esté en `master` del repo principal |

## 8. Ya disponible (reutilizable)

- Infraestructura de billing (`js/purchase-manager.js`) — extender con nuevo producto de soporte.
- Estructura modular de vistas (`js/views/`).
- Hosting estático gratuito ya resuelto (GitHub Pages, usado en `livestock-pwa-msix`).

## 9. Consideraciones legales/fiscales

Cobrar por soporte, aunque sea un importe mínimo, implica facturación real: normativa de consumidores, posible IVA, condiciones de servicio claras (qué incluye el soporte, plazos de respuesta, política de reembolso). Revisar con gestoría/asesor fiscal antes de lanzar el cobro. Esto no es asesoramiento legal ni fiscal.

## 10. Fases de implementación sugeridas

**Fase 1 — Backend base**
- Crear repo `livestock-manager-support-api`.
- Configurar GitHub App y repo de soporte.
- Endpoint `POST /tickets` con IA + creación de issue (sin auth todavía, para probar el flujo técnico).

**Fase 2 — Identidad y licencia**
- Añadir autenticación de usuario.
- Integrar verificación de compra vía Google Play Developer API.
- Proteger endpoints con JWT.

**Fase 3 — Seguimiento**
- Webhook de GitHub + almacenamiento del mapeo.
- Endpoint `GET /tickets` y `/tickets/:id`.

**Fase 4 — UI en la app**
- Vista "Soporte" y "Mis incidencias".
- Integración con el router y navegación.

**Fase 5 — Monetización**
- Producto `support_unlock` en Play Billing.
- Pruebas de compra real (modo sandbox primero).

**Fase 6 — Pulido**
- Rate limiting, sanitización, revisión de seguridad completa.
- Documentación de uso interna.

## 11. Pendiente de definir

- Precio y modelo de la licencia de soporte (compra única vs. suscripción).
- Proveedor concreto de autenticación (Google Sign-In vs. email+OTP propio).
- Prompt/estructura exacta que usará la IA para formatear incidencias.
- Diseño visual de "Mis incidencias".
- Política de SLA / tiempos de respuesta a comunicar al usuario.
- Proveedor de IA a usar en el backend (coste por ticket a estimar).

