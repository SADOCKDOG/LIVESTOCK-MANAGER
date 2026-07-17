<p align="center">
  <img src="icons/Logo%20aplicaci%C3%B3n.png" alt="Livestock Manager Logo" width="120">
</p>

<h1 align="center">Livestock Manager Premium</h1>
<h3 align="center">Sistema Integral de Gestión Ganadera · v4.9.0</h3>

<p align="center">
  PWA híbrida (Android · Capacitor) 100% offline-first para la gestión profesional de explotaciones ganaderas, con cumplimiento normativo nativo del sistema <strong>SIGGAN</strong> (Andalucía) y <strong>BADIGEX</strong> (Extremadura).
</p>

<p align="center">
  <a href="#multi-explotación">Multi-Explotación</a> ·
  <a href="#módulos-y-funcionalidades">Módulos</a> ·
  <a href="#integración-siggan--badigex">SIGGAN / BADIGEX</a> ·
  <a href="#arquitectura-técnica">Arquitectura</a> ·
  <a href="#instalación-y-desarrollo">Instalación</a>
</p>

---

## ¿Qué es Livestock Manager?

Livestock Manager es una plataforma de gestión ganadera de grado industrial pensada para el día a día del ganadero: censo y trazabilidad animal, producción (carne y leche), comercialización, sanidad, finanzas y documentación oficial — todo funcionando **sin conexión** en el terreno, con sincronización y exportación cuando hace falta.

La aplicación no es un CRM genérico adaptado al sector: su modelo de datos y sus flujos de trabajo están construidos directamente sobre la normativa española y autonómica de identificación y movimiento de ganado (RD 787/2023, RD 479/2004, Reg. UE 1069/2009), con los sistemas oficiales de gestión ganadera de Andalucía y Extremadura como referencia de diseño.

---

## Multi-Explotación

Livestock Manager gestiona **varias explotaciones (fincas) de forma simultánea** desde una misma instalación, y cada una es completamente independiente en cuanto a datos y configuración:

- **Cambio de finca activa** en un clic desde Ajustes, sin perder el contexto de trabajo.
- **Tipo de explotación por finca — Lácteo / Cárnico / ambos.** Cada finca declara qué produce mediante dos *flags* independientes (`leche`, `carne`); no existe un tercer estado "híbrido" artificial: si una finca tiene ambos activos, cada módulo muestra sus secciones de leche y de carne **por separado**, nunca fusionadas.
  - El tipo de explotación se pregunta directamente en el asistente de alta de una finca nueva.
  - Toda la interfaz reacciona a ese tipo: el Dashboard, Comercialización, Animales, Rebaños, Informes y la barra de navegación ocultan o muestran secciones según lo que esa finca concreta produce — sin tocar nada manualmente en cada módulo.
  - Un banner discreto avisa cuando hay registros ocultos por el tipo de explotación configurado (nunca oculta datos de forma silenciosa).
  - Las alertas de **seguridad alimentaria** (periodos de supresión sanitaria en leche y carne) se muestran siempre, con independencia del tipo de explotación activo.
- **Datos aislados por finca:** rebaños, animales, producción, sanidad, comercialización y documentación oficial cuelgan siempre de la finca a la que pertenecen — cambiar de finca activa nunca mezcla datos entre explotaciones.
- **Datos REGA/CEA independientes** por finca (código REGA, CCAA, ADSG, zonas y parcelas, contrato lácteo), lo que permite operar explotaciones en distintas comunidades autónomas (p. ej. una en Andalucía bajo SIGGAN y otra en Extremadura bajo BADIGEX) desde la misma app.

---

## Módulos y funcionalidades

La aplicación se organiza en pilares interconectados que cubren todas las áreas críticas de una explotación ganadera profesional:

### Dashboard
Panel de control con KPIs en tiempo real, accesos rápidos y alertas prioritarias. Filtra automáticamente según el tipo de explotación activa (leche/carne).

### Ganadería y Animales
- Censo completo con trazabilidad individual (crotal, DIB, pedigree)
- Gestión de partos, celos y tratamientos reproductivos
- Historial clínico completo por animal
- Gestión de rebones y lotes

### Producción Lechera (módulo condicional)
- Registro de ordeños individuales y por lote
- Control de calidad leche (grasa, proteína, celulas somáticas)
- Gestión de cuotas y contratos lácteos
- Alertas de periodos de espera post-tratamiento

### Producción Cárnica (módulo condicional)
- Registro de engorde y conversión alimenticia
- Control de prácticas de bienestar animal
- Trazabilidad completa desde nacimiento hasta sacrificio
- Gestión de lotes de cebo y fechas de salida previstas

### Sanidad y Tratamientos
- Libro de tratamientos veterinarios con tiempos de espera automáticos
- Gestión de vacunaciones, desparasitaciones y profilaxis
- Alertas de periodos de supresión (SIGGAN/BADIGEX)
- Historial sanitario completo por animal y lote

### Finanzas y Gastos
- Control de ingresos y gastos por categoría
- Gestión de facturas y albaranes
- Control de subvenciones y ayudas PAC
- Análisis de rentabilidad por producción y animal

### Comercialización
- Gestión de ventas de animales, leche y subproductos
- Gestión de compras de ganado y piensos
- Control de proveedores y transportistas
- Generación automática de documentación de transporte

### Documentación Oficial
- Generación automática de guías de movimiento oficiales
- Libro de registro de explotación (registro de eventos)
- Libro de tratamientos veterinarios
- Libro de piensos y medicamentos
- Exportación a formatos oficiales SIGGAN/BADIGEX

### Informes y Analítica
- Informes de producción (leche/carne) por periodo
- Informes sanitarios y tratamientos
- Informes financieros y de rentabilidad
- Informes de cumplimiento normativo
- Exportación a PDF/CSV para presentación oficial

### Herramientas y Asistentes
- Asistentes guiados (wizards) para operaciones complejas:
  - Alta de finca y animales
  - Movimientos oficiales (entradas/salidas)
  - Traslados internos y aforo de zonas
  - Tratamientos veterinarios
  - Nacimientos y gestiones reproductivas
  - Ventas masivas y lotes
- Manuales de usuario integrados y actualizables

### Ajustes y Configuración
- Gestión de múltiples fincas y cambio de contexto
- Configuración de tipo de explotación (leche/carne)
- Gestión de usuarios y permisos
- Configuración de impresión y exportación
- Gestión de actualizaciones y mantenimiento

---

## Integración SIGGAN / BADIGEX

Livestock Manager está diseñado desde cero para cumplir con los requisitos normativos de los sistemas oficiales de gestión ganadera:

### **SIGGAN (Andalucía)**
- ✅ Formato REGA validado según RD 479/2004
- ✅ Gestión completa de movimientos oficiales con guías de origen y sanitarias
- ✅ Libro de tratamientos con tiempos de espera automáticos (carne/leche)
- ✅ Gestión de zonas, UGM y carga ganadera
- ✅ Exportación oficial de documentos en formatos compatibles
- ✅ Alertas de periodos de supresión SANDACH
- ✅ Trazabilidad completa desde nacimiento hasta destino final

### **BADIGEX (Extremadura)**
- ✅ Adaptación completa al marco normativo extremeño
- ✅ Formatos de exportación e importación compatibles
- ✅ Gestión específica de ayudas y controles autonómicos
- ✅ Adaptación de flujos de trabajo a procedimientos extremeños

### **Cumplimiento Verificado**
Consulte la [Matriz de Cumplimiento SIGGAN](docs/CUMPLIMIENTO_SIGGAN.md) para un detalle exhaustivo de los flujos normativos validados, con evidencia en código y resultados de la suite QA automatizada.

---

## Arquitectura Técnica

### **Enfoque Offline-First**
- Aplicación Progressive Web App (PWA) 100% funcional sin conexión
- Sincronización inteligente cuando hay conectividad disponible
- Servicio Worker con estrategia cache-first para rendimiento offline
- ÍndiceDB como base de datos local encriptada

### **Tecnologías Utilizadas**
- **Frontend:** HTML5, CSS3 (CSS Grid/Flexbox), JavaScript ES6+
- **Framework:** Arquitectura modular propia basada en componentes web nativos
- **Movilidad:** Capacitor para empaquetado nativo Android
- **Base de Datos:** ÍndiceDB con esquemas versionados
- **Servicios:** DocumentViewer unificado para generación y visualización de PDFs
- **Build System:** npm scripts con procesamiento de assets y cache-busting

### **Arquitectura de Capas**
1. **Presentación:** Vistas modulares con System de Diseño Coral (neón semántico, Marco Galáctico)
2. **Lógica de Aplicación:** Servicios compartidos y helpers transversales
3. **Acceso a Datos:** Capa de abstração de ÍndiceDB con validación normativa
4. **Persistencia:** Almacenamiento local encriptado con estrategias de recuperación

### **Sistema de Diseño Coral**
- Neón semántico para estados y alertas críticas
- Marco Galáctico para layouts responsivos y consistentes
- Componentes card-registro con posicionamiento estandarizado
- Badges retroiluminados estándar para estados y alertas
- Tipografía y espaciado basados en tokens de diseño definidos

---

## Estructura del repositorio

```
├── index.html            # Punto de entrada de la PWA
├── sw.js                 # Service Worker (cache-first)
├── js/
│   ├── app.js             # Router y orquestación de la app
│   ├── views/              # Vistas por módulo (dashboard, ganadería, comercialización...)
│   │   ├── wizards/          # Asistentes de registro a pantalla completa
│   │   └── helpers/           # Lógica transversal (modo de explotación, calidad de leche...)
│   └── services/           # Servicios compartidos (PDF, visor de documentos, caché, eventos...)
├── css/                  # Sistema de diseño y estilos (con preventivo de "grid blowout")
├── manual/               # Manuales de usuario interactivos (servidos dentro de la app)
├── docs/                 # Documentación técnica y normativa del proyecto
├── android/              # Proyecto nativo Capacitor
└── Private/              # (excluido de git) material interno: diseño, legislación de referencia, herramientas de desarrollo
```

---

## Instalación y Desarrollo

### Prerrequisitos
- Node.js (v16+ recommended)
- Android Studio (para compilación nativa)
- JDK 11 o superior
- Git

### Instalación y Build

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/LIVESTOCK-MANAGER.git
cd LIVESTOCK-MANAGER

# 2. Instalar dependencias
npm install

# 3. Compilar para web (variante FREE - 1 finca)
npm run build:free

# 4. Compilar para web (variante PREMIUM - multi-finca)
npm run build:premium

# 5. Sincronizar con el proyecto Android (FREE)
npm run cap:sync:free

# 6. Sincronizar con el proyecto Android (PREMIUM)
npm run cap:sync:premium

# 7. Abrir en Android Studio
npm run cap:open
```

### Scripts Disponibles
- `npm run build:free` - Compila versión FREE (1 finca)
- `npm run build:premium` - Compila versión PREMIUM (multi-finca)
- `npm run cap:sync:free` - Sincroniza build FREE con Android
- `npm run cap:sync:premium` - Sincroniza build PREMIUM con Android
- `npm run cap:open` - Abre proyecto en Android Studio
- `npm run test:qa` - Ejecuta suite QA de cumplimiento normativo
- `npm run lint` - Ejecuta linting de código
- `npm run format` - Formatea código con Prettier

### Arquitectura Free/Premium
- **FREE:** Versión limitada a una finca activa, funcionalidad completa para gestión individual
- **PREMIUM:** Compra única mediante `premium_unlock` en Google Play, habilita:
  - Gestión ilimitada de fincas
  - Exportaciones avanzadas y lotes
  - Informes consolidados multi-finca
  - Sincronización en la nube opcional

---

## Capturas de Pantalla

A continuación se presentan algunas capturas de pantalla de la aplicación en acción:

![Pantalla Principal 1](docs/Pantallas/Livestock_20260717_202535.png)
*Pantalla principal mostrando el dashboard con métricas en tiempo real*

![Pantalla Principal 2](docs/Pantallas/Livestock_20260717_202552.png)
*Vista del módulo de Ganadería y Animales con filtrado por tipo de explotación*

![Pantalla Principal 3](docs/Pantallas/Livestock_20260717_202608.png)
*Interfaz de Producción Lechera con gráficos y métricas de calidad*

![Pantalla Principal 4](docs/Pantallas/Livestock_20260717_220636.png)
*Módulo de Sanidad y Tratamientos con alertas de periodos de supresión*

![Pantalla Principal 5](docs/Pantallas/Livestock_20260717_220748.png)
*Vista de Finanzas y Gastos con análisis de rentabilidad*

![Pantalla Principal 6](docs/Pantallas/Livestock_20260717_220804.png)
*Sección de Comercialización con gestión de ventas y compras*

![Pantalla Principal 7](docs/Pantallas/Livestock_20260717_220814.png)
*Documentación Oficial con generación de guías de movimiento*

![Pantalla Principal 8](docs/Pantallas/Livestock_20260717_220854.png)
*Informes y Analítica con exportación a PDF/CSV*

![Pantalla Principal 9](docs/Pantallas/Livestock_20260717_220928.png)
*Herramientas y Asistentes con wizards guiados para operaciones complejas*

![Pantalla Principal 10](docs/Pantallas/Livestock_20260717_220942.png)
*Ajustes y Configuración con gestión de múltiples fincas*

---

## Documentación Adicional

Consulte los siguientes documentos para información técnica y normativa detallada:

- [CUMPLIMIENTO_SIGGAN.md](docs/CUMPLIMIENTO_SIGGAN.md) - Matriz de cumplimiento con SIGGAN/BADIGEX
- [CUMPLIMIENTO_BADIGEX.md](docs/CUMPLIMIENTO_BADIGEX.md) - Adaptación específica a Extremadura (si aplica)
- [INTERACTION_PATTERNS.md](docs/INTERACTION_PATTERNS.md) - Patrón de interacción y componentes UI
- [DESIGN_TOKENS.md](docs/DESIGN_TOKENS.md) - Tokens de diseño y sistema de estilo
- [STATUS_BADGE_STANDARD.md](docs/STATUS_BADGE_STANDARD.md) - Estándar de badges retroiluminados
- [WIDGET_BUTTON_STANDARD.md](docs/WIDGET_BUTTON_STANDARD.md) - Estándar de botones widget
- [PREMIUM-LIMIT-PATTERN.md](memory/premium-limit-pattern.md) - Patrón de límites Free/Premium en capa de datos

---

## Próximos Pasos y Roadmap

### Versión 5.0 (Planificada)
- Integración con servicios web de SIGGAN/BADIGEX para validación oficial en tiempo real
- Módulo de análisis predictivo de producción y salud
- Integración con dispositivos IoT (balanzas, sensores de ambiente, etc.)
- Modo multiidioma completo (es/fr/en)
- Mejora en sincronización selectiva y resolución de conflictos

### Mejoras Continuas
- Optimización de rendimiento offline
- Expansión de documentación de usuario interactiva
- Mejoras en accesibilidad (WCAG 2.1 AA)
- Nuevos asistentes guiados para operaciones complejas

---

## Licencia y Créditos

© 2026 David Asuar Arteaga · Livestock Manager Premium.  
Todos los derechos reservados. Uso exclusivo interno.
