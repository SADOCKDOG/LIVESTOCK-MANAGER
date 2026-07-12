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

---

## 🛠️ Alcance Funcional

La aplicación se organiza en módulos interconectados que cubren todo el ciclo de vida de la explotación ganadera:

### 1. Gestión de Infraestructura y R.E.G.A.
*   **Explotaciones (Fincas):** Configuración de datos oficiales (REGA, CEA), titularidad y comunidad autónoma. Es la raíz de la jerarquía de datos.
*   **Zonas y Parcelas:** Subdivisión física de la finca. Permite el control de carga ganadera (UGM/Ha), aforos y pastoreo rotacional. Integración con datos PAC.

### 2. Módulo Ganadero (Censo y Trazabilidad)
*   **Animales:** Ficha individual con identificador oficial (ES+12), escáner de crotales, genealogía completa y línea de tiempo vital (nacimiento, traslados, bajas).
*   **Rebaños:** Agrupación lógica de animales para gestión masiva. Estructura: *Finca > Zona > Rebaño > Animal*.
*   **Movimientos:** Registro de traslados internos entre zonas y movimientos inter-explotación.

### 3. Producción y Rendimiento (ExPro)
*   **Línea Cárnica:** Registro de pesajes individuales o por lotes, cálculo automático de GMD (Ganancia Media Diaria) y clasificación SEUROP.
*   **Línea Láctea:** Control de ordeño diario, gestión de silos y tanques, y analíticas de calidad (Grasa, Proteína, Células Somáticas).
*   **Silos:** Control de inventario de suministros y piensos con trazabilidad de consumo por rebaño.

### 4. Comercialización y Logística (CoMer)
*   **Compradores:** Gestión CRM de clientes, contratos comerciales vinculados y tablas de precios pactados.
*   **Transportistas:** Directorio de logística autorizada con registro de matrículas y certificados de bienestar animal.
*   **Ventas y Albaranes:** Emisión masiva de ventas de animales y albaranes de leche. Generación automática de liquidaciones comerciales.

### 5. Sanidad y Bienestar Animal
*   **Libro de Tratamientos:** Registro normativo de aplicaciones veterinarias, recetas y periodos de supresión (carne/leche).
*   **Alertas Sanitarias:** Bloqueo automático de animales en periodo de espera para evitar riesgos en la cadena alimentaria.

### 6. Finanzas y Control de Costes
*   **Gastos Operativos:** Imputación analítica de costes (Alimentación, Sanidad, Energía, Personal, Amortizaciones).
*   **Fitosanitarios:** Registro de tratamientos de parcelas y control de fitosanitarios aplicados al terreno.

### 7. Inteligencia de Negocio e Informes (BI)
*   **Panel Analítico:** 14 categorías de informes técnicos y financieros.
*   **Balances (P&L):** Cálculo de margen neto, punto de equilibrio y rentabilidad por animal o rebaño.

### 8. Gestión Documental y Normativa (RD 787/2023)
*   **Cuaderno Digital (CUE):** Generación y exportación del cuaderno oficial de explotación compatible con SIGGAN/BADIGEX.
*   **Documentos Oficiales:** Archivo digital para guías DIMOE, declaraciones ICA y documentos de movimiento SIA.

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
