<p align="center">
  <img src="icons/Logo%20aplicaci%C3%B3n.png" alt="Livestock Manager Logo" width="120">
</p>

<h1 align="center">Livestock Manager v4.9.0</h1>
<h3 align="center">Industrial Premium Management System</h3>

<p align="center">
  Plataforma profesional de gestión ganadera de grado industrial, diseñada para optimizar la operativa de campo, garantizar el cumplimiento normativo oficial y agilizar la toma de decisiones mediante inteligencia analítica.
</p>

---

## 🚀 Novedades v4.9.0: Actualización "Industrial Premium"

Esta versión marca una evolución crítica hacia la operatividad profesional en condiciones exigentes:

- **Interfaz "Deep Dark" OLED:** Rediseño integral con alto contraste neón sobre grafito profundo, optimizado para visibilidad bajo luz solar directa y ahorro de batería.
- **Wizards de Campo 2.0:** Asistentes de registro a pantalla completa (Pesajes, Censo, Tratamientos) diseñados para ser operados rápidamente con una sola mano.
- **Tarjetas de Registro Inteligentes:** Nueva jerarquía visual en fichas de animales y fincas para acceso instantáneo a datos REGA y estados sanitarios.
- **Cumplimiento Normativo Total:** Integración profunda con el **RD 787/2023** y plataformas autonómicas (**SIGGAN/BADIGEX**).
- **Automatización Play Console:** Preparado para despliegue automatizado mediante Google Play Service Accounts.

---

## 🛠️ Alcance Funcional

*   **Gestión R.E.G.A.:** Control total de explotaciones, fincas y zonas de pastoreo.
*   **Módulo Ganadero:** Trazabilidad 360° desde el nacimiento/compra hasta la venta masiva.
*   **Producción Dual:** Gestión especializada para líneas de **Carne** (Pesajes, GMD, SEUROP) y **Leche** (Ordeño, Calidad, MOFA).
*   **Sanidad y Bienestar:** Libro de tratamientos veterinarios con control estricto de periodos de supresión.
*   **Inteligencia de Negocio:** 14 tipos de informes financieros y operativos con exportación a PDF y Excel.
*   **Archivo Documental:** Gestión digital de guías DIMOE, declaraciones ICA y acuses de recibo.

---

## 📐 Estándar de Diseño "Cork Manager"

La aplicación sigue el lenguaje de diseño **Industrial Premium**:
- **Tipografía:** Archivo Expanded (Títulos), Inter (Cuerpo), IBM Plex Mono (Datos Técnicos).
- **Colores Semánticos:** Neon Lime (#CF0) para éxito, Gold (#FFD600) para identificación oficial, Red (#F44) para gastos/alertas.
- **Interactividad:** Botones de gran tamaño (48px+) y radios de 16px para uso táctil robusto.

Para más detalles, consulte el archivo [DESIGN.md](docs/design/DESIGN.md).

---

## 💻 Arquitectura Técnica

Arquitectura PWA híbrida optimizada para ejecución **100% Offline**:
- **Core:** JavaScript ES6+ (Modular), HTML5, CSS3.
- **Persistencia:** IndexedDB con motor de migración automática.
- **Hibridación:** Capacitor v5 con plugins nativos de cámara, sistema de archivos y sincronización.
- **Infraestructura:** Service Worker para caché inteligente de recursos.

---

## 📦 Instalación y Desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar para web
npm run build

# 3. Sincronizar con Android
npm run cap:sync

# 4. Abrir en Android Studio
npm run cap:open
```

---

## 📄 Licencia y Créditos

© 2026 David Asuar Arteaga · Livestock Manager Premium.
Todos los derechos reservados. Uso exclusivo interno.
