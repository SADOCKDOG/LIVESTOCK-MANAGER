/**
 * Livestock Manager - Guía Trámites (ExPro)
 * Tour guiado para la pestaña Trámites: 6 sub-tabs (Guías, Censo, Crotales, Traslado, Infolac, Archivo).
 * Siempre disponible.
 */
(function () {
  'use strict';

  GuideRegistry.register({
    id: 'expro.tramites',
    pillar: 'expro',
    route: '/explotacion',
    tab: 'tramites',
    applies: (flags) => true,
    steps: [
      {
        title: 'Bienvenido a Trámites SIGGAN',
        body: 'Esta pestaña (**Trámites**) centraliza la **gestión documental oficial** (SIGGAN/REGA). 6 sub-tabs: **Guías** (DIMOE movimientos), **Censo** (declaración anual + libro registro), **Crotales** (pedido identificadores), **Traslado** (movimientos internos), **Infolac** (entregas industria láctea), **Archivo** (exportación, memoria anual). Color azul (--c-info).',
        target: null,
        position: 'center'
      },
      {
        title: 'Sub-tabs de navegación',
        body: 'Barra de 6 sub-tabs (scrollable): Guías, Censo, Crotales, Traslado, Infolac, Archivo. Cada una con icono y color propio. Click para cambiar sin recargar. La guía se reinicia al cambiar sub-tab.',
        target: '.tramites-sub-tabs button, .tabs-scroll.tramites-sub-tabs, .tabs-scroll [onclick*="_cambiarTramiteSubTab"]',
        waitFor: 1000,
        position: 'below'
      },
      {
        title: 'Guías — Movimientos DIMOE',
        body: 'Sub-tab **Guías**: botón «Emitir Nueva Guía DIMOE» (wizard WizardGuiaMovimiento). Historial guías emitidas: número, fecha, destino, estado (REGISTRADA/ENVIADA/ANULADA). Click abre detalle. Exportación XML/CSV para SIGGAN.',
        target: '#expro-tab-content:has-text("GUÍAS"), #expro-tab-content [onclick*="_abrirWizardGuiaMovimiento"]',
        waitFor: 1500,
        position: 'above'
      },
      {
        title: 'Censo — Declaración Anual REGA',
        body: 'Sub-tab **Censo**: botón «Generar Declaración Censal» (wizard WizardCenso). Accesos directos: «Libro Registro» (cuaderno digital) e «Informe REGA» (InformesView). Historial censos: año, fecha declaración, total cabezas, badge OFICIAL.',
        target: '#expro-tab-content:has-text("CENSO"), #expro-tab-content [onclick*="_abrirWizardCenso"]',
        waitFor: 1500,
        position: 'above'
      },
      {
        title: 'Crotales — Pedido Identificadores',
        body: 'Sub-tab **Crotales**: botón «Pedir Nuevos Crotales» (wizard WizardCrotales). Historial pedidos: ID, fecha, cantidad, estado (PENDIENTE/ENVIADO/RECIBIDO). Trazabilidad completa de identificadores recibidos y asignados.',
        target: '#expro-tab-content:has-text("CROTALES"), #expro-tab-content [onclick*="_abrirWizardCrotales"]',
        waitFor: 1500,
        position: 'above'
      },
      {
        title: 'Traslado — Movimientos Internos',
        body: 'Sub-tab **Traslado**: botón «Registrar Movimiento Interno» (wizard WizardTraslado). Historial traslados: fecha, cabezas, rebaño origen → destino, badge COMPLETADO. Registra evento en auditoría y actualiza zona/rebaño de animales.',
        target: '#expro-tab-content:has-text("TRASLADOS"), #expro-tab-content [onclick*="_abrirWizardTraslado"]',
        waitFor: 1500,
        position: 'above'
      },
      {
        title: 'Infolac — Entregas Industria Láctea',
        body: 'Sub-tab **Infolac** (solo si Leche=ON): botón «Ver Entregas para Infolac» (enlaza a ComercializacionView). Historial declaraciones: fecha recogida, cisterna, litros, estado tramitación. Requisito para industrias lácteas.',
        target: '#expro-tab-content:has-text("INFOLAC"), #expro-tab-content [onclick*="comercializacion"]',
        waitFor: 1500,
        position: 'above',
        optional: true,
        optionalReason: 'Solo visible si flags.leche === true'
      },
      {
        title: 'Archivo — Exportación y Memoria',
        body: 'Sub-tab **Archivo**: 3 tarjetas de acción: **Libro Registro** (cuaderno digital completo), **Exportación SIGGAN** (XML/CSV formatos oficiales CCAA), **Memoria Anual** (balances entrada/salida/existencias por campaña, en InformesView).',
        target: '#expro-tab-content:has-text("ARCHIVO"), #expro-tab-content [onclick*="documentos"]',
        waitFor: 1500,
        position: 'above'
      },
      {
        title: 'FAB Guía contextual por sub-tab',
        body: 'Cada sub-tab tiene su **FAB «Guía»** específico. En Ajustes → Guías: toggle global, guías vistas, «Reiniciar todas».',
        target: '.guide-fab',
        waitFor: 1500,
        position: 'above'
      },
      {
        title: '¡Listo!',
        body: 'Domina trámites: emite guías DIMOE, declara censos, pide crotales, registra traslados, tramita Infolac, exporta SIGGAN. La guía de cada sub-tab está en su FAB.',
        target: null,
        position: 'center'
      }
    ]
  });
})();