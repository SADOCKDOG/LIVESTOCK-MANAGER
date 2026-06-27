# Certificados y Huellas de Android (Google Play)

Este documento guarda la referencia de las huellas digitales públicas (SHA) de la aplicación para su verificación en Android. Esto es útil para configurar integraciones como Firebase, Google Sign-In, o los App Links (Digital Asset Links).

## Google Play App Signing / Upload Key

*   **SHA-256:** `F1:4E:DA:BB:8B:E1:F2:CC:CD:98:F8:F9:84:8F:F2:3A:AC:D1:4D:91:D2:EE:A1:43:4C:2A:85:D7:55:18:6A:A4`
*   **Package Name (App ID):** `com.livestockmanager.app.manual`

> **Nota de seguridad:** Las huellas SHA-1 y SHA-256 de los certificados son públicas y se pueden almacenar de forma segura en el repositorio. No contienen la clave privada (`.keystore` o `.jks`), la cual nunca debe subirse a GitHub.
