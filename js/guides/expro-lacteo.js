/**
 * Livestock Manager - Guía Láctea (ExPro)
 * Tour guiado para la pestaña Láctea: producción diaria, tanques, control, balance, gráficos.
 * SOLO disponible si flags.leche === true.
 */
(function () {
  'use strict';

  GuideRegistry.register({
    id: 'expro.lacteo',
    pillar: 'expro',
    route: '/explotacion',
    tab: 'lacteo',
    applies: (flags) => flags.leche === true, // SOLO si Leche=ON
    steps: [
      {
        title: 'Bienvenido a Gestión Láctea',
        body: 'Esta pestaña (**Láctea**) solo aparece con **Leche=ON** en Ajustes → Explotación. Centraliza producción diaria, analíticas de laboratorio, tanques de enfriamiento y rendimiento MOFA (margen sobre coste alimentación). Color azul (--c-info) identifica láctea.',
        target: null,
        position: 'center'
      },
      {
        title: 'Resumen Lácteo (KPIs)',
        body: 'Tarjeta superior con 2 KPIs: **Litros Control** = producción en controles oficiales; **Margen MOFA** = ingresos leche - coste pienso (€). Indicadores clave de rentabilidad lechera.',
        target: '.leche-kpi-item',
        waitFor: 1000,
        position: 'below'
      },
      {
        title: 'Sub-tabs de navegación interna',
        body: 'Barra de 5 sub-tabs bajo el resumen: **Dashboard** (visión general), **Tanques** (enfriadores, capacidades, temperaturas), **Control** (registros oficiales laboratorio), **Balance** (economía láctea: ingresos, costes, MOFA), **Gráficos** (evolución producción, componentes, comparativas). Click para cambiar sin recargar.',
        target: '.leche-sub-tabs button, .tabs-scroll.leche-sub-tabs',
        waitFor: 1000,
        position: 'below'
      },
      {
        title: 'Dashboard — Visión general',
        body: 'Sub-tab por defecto. Resumen visual: producción última semana, tanques con nivel/temperatura, próximos controles, alertas (ej. temperatura alta). Acceso rápido a registrar ordeño y ver control.',
        target: '#expro-lacteo-subtab-content .card-registro, #expro-lacteo-subtab-content .dashboard-kpi',
        waitFor: 1500,
        position: 'above'
      },
      {
        title: 'Tanques — Enfriadores y almacenamiento',
        body: 'Sub-tab **Tanques** (delega a TanquesView si existe). Cada tanque: capacidad, litros actuales, temperatura, estado (enfriando/ok/alarma). FAB «Nuevo Tanque». Click en tarjeta abre ficha con histórico temperaturas y calibración.',
        target: '#expro-lacteo-subtab-content .card-registro, [onclick*="TanquesView"]',
        waitFor: 1500,
        position: 'above',
        optional: true,
        optionalReason: 'Requiere window.TanquesView cargado (módulo opcional)'
      },
      {
        title: 'Control — Analíticas laboratorio',
        body: 'Sub-tab **Control**: listado de controles oficiales (fecha, litros, grasa, proteína, extracto seco, urea, recuento celular). Cada control abre ficha con componentes, comparación con anterior y tendencia. FAB para registrar nuevo control (wizard).',
        target: '#expro-lacteo-subtab-content .card-registro, [onclick*="renderControl"]',
        waitFor: 1500,
        position: 'above'
      },
      {
        title: 'Balance — Economía láctea (MOFA)',
        body: 'Sub-tab **Balance**: ingresos por leche (litros × precio), costes alimentación (pienso, forraje), **MOFA** = Ingresos - Coste Alimentación. Desglose por periodo, comparativa con campañas anteriores. KPIs: €/litro, €/vaca/día, % coste alimentación.',
        target: '#expro-lacteo-subtab-content .card-registro, [onclick*="renderBalance"]',
        waitFor: 1500,
        position: 'above'
      },
      {
        title: 'Gráficos — Evolución y componentes',
        body: 'Sub-tab **Gráficos**: series temporales de producción (L/día), grasa/proteína (%), recuento celular, urea, MOFA. Selector de rango (semana/mes/año/campaña). Exportable a imagen/PDF para informes.',
        target: '#expro-lacteo-subtab-content canvas, #expro-lacteo-subtab-content .grafico-wrap',
        waitFor: 1500,
        position: 'above'
      },
      {
        title: 'FAB Guía contextual',
        body: 'Cada sub-tab tiene su **FAB «Guía»** específico. En Ajustes → Guías: toggle global, guías vistas, «Reiniciar todas».',
        target: '.guide-fab',
        waitFor: 1500,
        position: 'above'
      },
      {
        title: '¡Listo!',
        body: 'Domina la láctea: registra controles oficiales, vigila tanques, analiza MOFA, usa gráficos para decisiones. La guía de cada sub-tab está en su FAB.',
        target: null,
        position: 'center'
      }
    ]
  });
})();