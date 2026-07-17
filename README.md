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

## <img src="docs/readme-icons/cow.svg" width="22" height="22" align="absmiddle" alt=""> ¿Qué es Livestock Manager?

Livestock Manager es una plataforma de gestión ganadera de grado industrial pensada para el día a día del ganadero: censo y trazabilidad animal, producción (carne y leche), comercialización, sanidad, finanzas y documentación oficial — todo funcionando **sin conexión** en el terreno, con sincronización y exportación cuando hace falta.

La aplicación no es un CRM genérico adaptado al sector: su modelo de datos y sus flujos de trabajo están construidos directamente sobre la normativa española y autonómica de identificación y movimiento de ganado (RD 787/2023, RD 479/2004, Reg. UE 1069/2009), con los sistemas oficiales de gestión ganadera de Andalucía y Extremadura como referencia de diseño.

---

## <img src="docs/readme-icons/house.svg" width="22" height="22" align="absmiddle" alt=""> Multi-Explotación

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

## <img src="docs/readme-icons/wrench.svg" width="22" height="22" align="absmiddle" alt=""> Módulos y funcionalidades

La aplicación se organiza en pilares interconectados que cubren todo el ciclo de vida de la explotación:

### 1. Explotación y R.E.G.A.
- **Fincas:** alta y edición de datos oficiales (REGA, CEA, NIF/CIF, comunidad autónoma, tipo y sistema de explotación, calificación sanitaria), gestión de ADSG y del contrato lácteo obligatorio.
- **Zonas / Parcelas:** subdivisión física de la finca con código PAC, distancia mínima al agua, carga ganadera (UGM/Ha) y aforo por zona.
- **Multi-finca:** ver sección [Multi-Explotación](#-multi-explotación).

### 2. Censo y Trazabilidad Animal (GeGan)
- **Animales:** ficha individual con identificador oficial (ES + 12 dígitos), escáner de crotales por cámara, genealogía (madre → cría), línea de tiempo vital completa (nacimiento, traslados, tratamientos, bajas) y clasificación SANDACH del motivo de baja (Reg. UE 1069/2009).
- **Rebaños:** agrupación lógica de animales; jerarquía *Finca → Zona → Rebaño → Animal*.
- **Movimientos:** traslados internos entre zonas con validación de aforo, y movimientos oficiales inter-explotación con guía de origen y sanidad.

### 3. Producción (ExPro)
- **Línea Cárnica:** pesajes individuales o por lote, cálculo automático de GMD (Ganancia Media Diaria), tandas de cebo ligadas a movimientos de entrada SIGGAN.
- **Línea Láctea:** control de ordeño diario, gestión de silos/tanques, calidad de leche (grasa, proteína, células somáticas, extracto seco) e indicadores lácteos (MOFA, precio €/L).
- **Silos:** inventario de piensos y suministros con trazabilidad de consumo por rebaño.

### 4. Comercialización y Logística (CoMer)
- **Compradores y Proveedores:** directorio con REGA/NIF/CIF, contratos comerciales y tablas de precios pactados.
- **Transportistas:** registro de matrículas, autorización de transporte de ganado (ATG) y certificado de desinsectación.
- **Ventas y Albaranes:** venta masiva de ganado (carga de matadero) y albaranes de entrega de leche, con liquidación comercial automática (IVA/REAGP) y enlace directo al movimiento oficial correspondiente.

### 5. Sanidad y Bienestar Animal
- **Libro de Tratamientos:** registro conforme al RD 1749/1998 — motivo/diagnóstico, vía de administración, nº de animales tratados, lote y caducidad del medicamento, veterinario prescriptor (con nº colegiado) y nº de receta.
- **Alertas de periodo de supresión:** bloqueo automático de venta de leche o carne durante el periodo de espera del tratamiento — visibles siempre, sin excepción, por seguridad alimentaria.
- **Saneamientos:** campañas ADSG/TBC/brucelosis y calificación sanitaria de la explotación.

### 6. Finanzas y Costes
- **Gastos operativos:** imputación analítica por categoría (alimentación, sanidad, energía, personal, amortizaciones), con trazabilidad hacia el registro de eventos.
- **Fitosanitarios:** tratamientos de parcelas y control de productos fitosanitarios aplicados al terreno.

### 7. Inteligencia de Negocio e Informes
- Panel analítico con más de una decena de categorías de informes técnicos y financieros.
- Balances (P&L): margen neto, punto de equilibrio y rentabilidad por animal o rebaño.
- Exportación a PDF y Excel con logo y maquetación profesional.

### 8. Gestión Documental y Normativa
- **Cuaderno Digital (CUE):** cuaderno de explotación oficial, exportable en PDF, compatible con los requisitos de SIGGAN/BADIGEX.
- **Documentos oficiales:** guías DIMOE, declaraciones ICA, solicitudes de crotales y documentos de movimiento, archivados y reimprimibles en cualquier momento.
- **Visor de documentos unificado:** todo documento generado (crotales, movimientos, albaranes, facturas, certificados, censo) se abre en un visor común con exportación/compartición nativa (Capacitor Share) e integración con el botón físico "atrás" de Android — sin ventanas emergentes que fallen en el WebView.

### 9. Onboarding y Ajustes
- Asistente de configuración inicial guiado, con carga opcional de una finca de demostración ("Ganadería Chamorro") totalmente poblada.
- Backups exportables/importables, gestión de especies y razas, objetivos de eficiencia técnica y preferencias visuales (tema OLED, acentos, opacidad de banners).

---

## <img src="docs/readme-icons/shield-check.svg" width="22" height="22" align="absmiddle" alt=""> Integración SIGGAN / BADIGEX

Livestock Manager no se limita a "permitir" introducir datos oficiales: su modelo de dominio está diseñado para que cada flujo de trabajo produzca, de forma nativa, la información que exige la tramitación telemática ante la Junta de Andalucía (**SIGGAN**) o la Junta de Extremadura (**BADIGEX**).

- **Base normativa:** RD 479/2004 (Registro General de Explotaciones Ganaderas), RD 787/2023 (identificación, registro y movimiento de ganado), Reg. UE 1069/2009 (subproductos animales / SANDACH).
- **REGA validado por comunidad autónoma:** formato y provincia INE verificados en el momento de guardar la finca, con reglas específicas por CCAA (`ComunidadesService`).
- **Plataforma detectada automáticamente:** la app resuelve internamente si una finca tramita contra SIGGAN (Andalucía) o BADIGEX (Extremadura) según su comunidad autónoma, y ajusta textos, umbrales PAC y distancias mínimas en consecuencia.
- **Movimientos y tandas de cebo:** una tanda de cebo se corresponde con los animales de un movimiento de entrada real (no con el rebaño en abstracto), tal y como exige el modelo SIGGAN; el rebaño se reutiliza para tandas sucesivas y sirve de base al ICA de cierre.
- **Notificaciones REGA y auditoría inmutable:** toda alta, baja o modificación relevante queda registrada en un store auditable (no en `localStorage`); las bajas y eliminaciones se anulan, nunca se borran.
- **Workflow administrativo:** guías de movimiento, INFOLAC, declaración censal y traslados siguen un ciclo borrador → presentado → aceptado/rechazado, con acuse de recibo archivado.
- **Exportación oficial:** generación de CSV/XML (REGA, SIA) con validación semántica previa (formato REGA, coherencia de fechas, códigos macho/hembra, escape CSV) y modal de verificación antes de exportar.
- **Suite de QA normativa integrada:** `SigganQA.runAll()` ejecuta más de 15 comprobaciones automáticas de cumplimiento (REGA, crotal, DIB, movimientos, sanidad, SANDACH, exportación...) directamente desde la consola de la app, sobre datos de demostración.

El detalle completo, flujo a flujo, está documentado en [`docs/CUMPLIMIENTO_SIGGAN.md`](docs/CUMPLIMIENTO_SIGGAN.md).

---

## <img src="docs/readme-icons/cpu.svg" width="22" height="22" align="absmiddle" alt=""> Arquitectura Técnica

PWA híbrida optimizada para ejecución **100% offline**, sin backend propio:

- **Core:** JavaScript ES6+ modular (sin framework ni bundler), HTML5, CSS3 con sistema de diseño propio (neón semántico sobre grafito, modo OLED).
- **Persistencia:** IndexedDB con motor de migración de esquema automático, y cifrado de datos sensibles en cliente.
- **Hibridación:** Capacitor v5 con plugins nativos — cámara/escáner de crotales, sistema de archivos, compartir nativo (Share), compras in-app.
- **Infraestructura:** Service Worker cache-first para uso 100% offline en campo, con precarga de vistas agrupadas por pilar funcional (carga perezosa por ruta).
- **Modelo Free/Premium:** compra única desbloqueable vía Google Play; la versión FREE cubre una finca con funcionalidad completa, Premium desbloquea multi-finca y exportaciones avanzadas.

---

## <img src="docs/readme-icons/folder.svg" width="22" height="22" align="absmiddle" alt=""> Estructura del repositorio

```
├── index.html            # Punto de entrada de la PWA
├── sw.js                 # Service Worker (cache-first)
├── js/
│   ├── app.js             # Router y orquestación de la app
│   ├── views/              # Vistas por módulo (dashboard, ganadería, comercialización...)
│   │   ├── wizards/          # Asistentes de registro a pantalla completa
│   │   └── helpers/           # Lógica transversal (modo de explotación, calidad de leche...)
│   └── services/           # Servicios compartidos (PDF, visor de documentos, caché, eventos...)
├── css/                  # Sistema de diseño y estilos
├── manual/               # Manuales de usuario interactivos (servidos dentro de la app)
├── docs/                 # Documentación técnica y normativa del proyecto
├── android/              # Proyecto nativo Capacitor
└── Private/              # (excluido de git) material interno: diseño, legislación de referencia, herramientas de desarrollo
```

---

## <img src="docs/readme-icons/package.svg" width="22" height="22" align="absmiddle" alt=""> Instalación y Desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar para web (variante FREE)
npm run build:free

# 3. Sincronizar con el proyecto Android
npm run cap:sync:free

# 4. Abrir en Android Studio
npm run cap:open
```

Requiere Node.js, Android Studio y JDK para la compilación nativa. El proyecto usa `patch-package` para aplicar parches a dependencias de terceros automáticamente tras `npm install`.

---

## <img src="docs/readme-icons/document.svg" width="22" height="22" align="absmiddle" alt=""> Licencia y Créditos

© 2026 David Asuar Arteaga · Livestock Manager Premium.
Todos los derechos reservados. Uso exclusivo interno.
