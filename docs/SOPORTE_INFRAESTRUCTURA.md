# Infraestructura de soporte con IA — LIVESTOCK-MANAGER

Resumen de todo lo relativo al complemento opcional de soporte, que vive en el backend Cloudflare Workers `livestock-manager-support-api` y se consume desde la app de Android 4.10.8 y la de Windows nativa 4.11.24.0. El soporte es un complemento mensual con suscripción (`support_unlock`); la app funciona completa sin él.

> **Repo del backend:** `https://github.com/SADOCKDOG/livestock-manager-support-api` (repositorio independiente, no comparte historial git ni build con LIVESTOCK-MANAGER ni livestock-desktop).

## Modelo de cobro

La app es gratuita. Solo se paga `support_unlock`, mensual y opcional, vinculado a la suscripción de cada usuario (el `order_id` es el id de la suscripción, estable al renovar, cambia al recontratar).

- Microsoft Store (MSIX / Windows): compra vía Digital Goods (WinRT + Store ID), no vale en Tauri; IAP diferido hasta terminar la piel ERP.
- Google Play (Android): suscripción `support_unlock`, `order_id` estable al renovar.

## Cómo funciona una incidencia (resumen)

1. El usuario escribe la incidencia desde la app → `POST /tickets`. La IA estructura el reporte y devuelve un borrador (no se crea nada en GitHub todavía).
2. El usuario revisa y confirma → `POST /tickets/confirm`. Se crea el issue en GitHub y el agente de IA responde en segundo plano.
3. El usuario lee las respuestas en la app. Puede escribir de vuelta con `POST /tickets/:id/responder`.
4. Cuando el equipo marca `resuelta`, el usuario confirma (`/confirmar`) o reabre con un mensaje.
5. Dos cupos diarios separados por usuario: `MAX_TICKETS_PER_DAY` (5) y `MAX_MENSAJES_PER_DAY` (10).

### Estados del ticket

| Estado | Quién lo pone | Qué significa |
|---|---|---|
| `enviada` | Worker, al crear el issue | Registrada, nadie la ha mirado |
| `analizada` | Agente de IA | Analizada y respondida |
| `revision` | Mantenedor | Una persona la está mirando |
| `curso` | Mantenedor | Confirmada como fallo, se trabaja en ella |
| `resuelta` | Mantenedor | Propuesta de resolución, espera confirmación |

## Endpoints de la API

| Método | Ruta | Para qué |
|---|---|---|
| `POST` | `/tickets` | Estructura el reporte con IA y devuelve borrador |
| `POST` | `/tickets/confirm` | Crea el issue en GitHub y lanza el agente |
| `GET` | `/tickets` | Listado propio con estado y respuestas |
| `GET` | `/tickets/:id` | Detalle con el hilo completo |
| `POST` | `/tickets/:id/responder` | Mensaje del usuario en incidencia abierta |
| `POST` | `/tickets/:id/confirmar` | El usuario acepta la resolución y cierra el issue |
| `POST` | `/auth/verify-purchase` | Verifica compra y devuelve JWT de sesión (Android: Google Play; Windows: Microsoft Store) |
| `POST` | `/auth/ms/ticket-compras` | Acuña ticket Entra ID para Store ID key (compra, `support_unlock`) |
| `POST` | `/auth/ms/ticket` | Acuña ticket Entra ID (audiencia colecciones, no para `support_unlock`) |
| `GET` | `/auth/me` | Estado de sesión y licencia |
| `POST` | `/webhooks/github` | Etiquetas, comentarios y cierre del issue (HMAC) |
| `GET` | `/` | Sonda de vida `{servicio, ok}` |

Las rutas de lectura y mensaje no exigen licencia activa: quien ya abrió una incidencia puede seguir hablando aunque su licencia caduque.

## Identidad del usuario

No hay cuentas ni contraseñas. El `user_id` se deriva del `purchase_token` (Android, hash SHA-256) o del `order_id` de Microsoft Store (Windows). Un id de instalación —generado en el dispositivo y guardado en IndexedDB, por tanto incluido en la copia de seguridad— permite reencontrar al mismo usuario cuando Google emite un `purchase_token` nuevo (recompra tras caducar o cambio de plan).

La decisión de adopción de identidad vive en `src/services/identidad.ts` del worker y nunca reescribe `instalacion:<id>` si apunta a otro usuario, para no perder el historial (causa raíz de un bug en producción el 2026-09-03).

El `email` es opcional y solo de índice inverso (`email:<correo> → user_id`); no concede licencia ni decide el historial. En Windows, la cuenta de la Store con sesión en el equipo es la que decide la compra, no el correo de Ajustes (ver [[cuenta-store-define-la-licencia]]).

## Dónde está cada cosa

| Documento | Ubicación | Qué cubre |
|---|---|---|
| Esquema KV completo | `livestock-manager-support-api/docs/KV_SCHEMA.md` | Todas las claves, TTLs y reglas críticas del almacenamiento |
| Flujo de identidad (diagrama Mermaid) | `livestock-manager-support-api/README.md` | Diagrama visual del resolver de identidad |
| Variables de entorno | `livestock-manager-support-api/.dev.vars.example` | Template para `wrangler dev` local |
| README del worker | `livestock-manager-support-api/README.md` | Stack, setup, endpoints, identidad, seguridad, cómo funciona una incidencia |
| Historial de soporte | `historial-soporte-kv-vacio.md` (memoria) | Corrección del KV vacío el 24 oct 2026 |
| Modelo de cobro | `modelo-cobro-soporte.md` (memoria) | App gratis, solo `support_unlock` mensual opcional |

## Referencias cruzadas en el ecosistema

- `docs/plan-mejoras-soporte.md` — mejoras pendientes de soporte (sobre el backend worker)
- `docs/CUMPLIMIENTO_SIGGAN.md` — matriz de cumplimiento SIGGAN (no tiene relación con soporte)
- `docs/NORMATIVA-CROTAL-ESPECIE.md` — normativa de crotal/identificación animal
