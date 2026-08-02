/**
 * Livestock Manager - Guía Rebaños (GeGan)
 * Tour guiado para la pestaña Rebaños: lotes, balance, ficha, sanidad, gastos, rotación.
 * Lanza wizard real: RebanosView._crearRebano() y consumo de pienso.
 */
(function () {
  'use strict';

  GuideRegistry.register({
    id: 'gegan.rebanos',
    pillar: 'gegan',
    route: '/ganaderia',
    tab: 'rebanos',
    applies: (flags) => true, // Siempre disponible
    steps: [
      {
        title: 'Bienvenido a Lotes y Rebaños',
        body: 'Esta pestaña gestiona **lotes productivos** (rebaños). Cada rebaño agrupa animales por especie/tipo, tiene capacidad (aforo), zona asignada y **tipo de explotación REGA** obligatorio (RD 787/2023). El color azul identifica esta sub-vista.',
        target: null,
        position: 'center'
      },
      {
        title: 'Evolución mensual (últimos 6 meses)',
        body: 'El gráfico de barras muestra **rebaños creados por mes**. Verde = pocos, amarillo = medio, rojo = muchos. Indicador visual de actividad de constitución de lotes.',
        target: '.rebaño-bar-wrap, [style*="rebaño-bar"]',
        waitFor: 1500,
        position: 'below'
      },
      {
        title: 'Balance de Rebaños (colapsable)',
        body: 'Panel colapsable con conteos por categoría: **Todos, Carne, Leche, Activos** (filtrados por modo de explotación activo). El total final refleja solo los rebaños visibles según tus flags Leche/Carne.',
        target: '.card-resumen, .card-total-3d:has(.fa-rebanos), .card-resumen:has-text("BALANCE DE REBAÑOS")',
        waitFor: 1000,
        position: 'below'
      },
      {
        title: 'Buscar rebaños',
        body: 'Búsqueda instantánea por **nombre, raza o código de lote**. Escribe y la lista se filtra al momento.',
        target: '#search-rebanos',
        waitFor: true,
        position: 'below'
      },
      {
        title: 'Crear nuevo rebaño (wizard guiado)',
        body: 'Botón **«Nuevo Rebaño»** abre wizard de 5 pasos: (1) Identificación: nombre + especie; (2) Ubicación y tipo: tipo producción + zona; (3) REGA: tipo explotación obligatorio; (4) Capacidad y trazabilidad: aforo + código lote; (5) Fecha y notas. Valida cada paso antes de avanzar.',
        target: '.module-header-primary-action button, [onclick*="RebanosView._crearRebano"]',
        waitFor: true,
        position: 'below',
        launch: () => { if (window.RebanosView && RebanosView._crearRebano) RebanosView._crearRebano(); }
      },
      {
        title: 'Ficha de rebaño (click en tarjeta)',
        body: 'Click en una tarjeta abre **ficha full-screen** con: KPIs (total, activos, vendidos, kg carne, litros leche, eventos), categorías, edición de datos (nombre, especie, tipo, capacidad, lote, fecha, zona, REGA, notas), **sanidad** (botón «Añadir Trat.» → WizardTratamiento), **gastos/consumos** (consumo pienso desde Silos + otros gastos), **animales** del lote con botón «Mover Lote».',
        target: '#rebanos-content .card-registro',
        waitFor: 1500,
        position: 'above'
      },
      {
        title: 'Consumo de pienso (desde Silos)',
        body: 'En la ficha, botón **«Consumo Pienso»** descuenta stock del silo elegido, imputa kilos al rebaño y genera gasto analítico. Si hay varios silos, pide elegir. Requiere módulo ExPro → Silos configurado.',
        target: '#rebanos-content [onclick*="_abrirConsumoPienso"], .widget-link-label:has-text("Consumo Pienso")',
        waitFor: 2000,
        position: 'above'
      },
      {
        title: 'Mover lote (rotación)',
        body: 'Botón **«Mover Lote»** abre selector para trasladar animales a otro rebaño/zona. Útil para rotaciones de pastillo o cambios de fase productiva.',
        target: '#rebanos-content [onclick*="_abrirSelectorAnimales"], .widget-link-label:has-text("Mover Lote")',
        waitFor: 2000,
        position: 'above'
      },
      {
        title: '¡Listo!',
        body: 'Gestiona tus lotes: crea rebaños con wizard validado, registra tratamientos y consumos, controla gastos, mueve animales entre zonas. La guía está en el FAB «Guía» cuando la necesites.',
        target: null,
        position: 'center'
      }
    ]
  });
})();