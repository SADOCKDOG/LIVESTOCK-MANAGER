/**
 * validarTargets - Valida selectores CSS de guías contra el DOM real
 * Uso: validarTargets('ExplotacionView') o validarTargets('GanaderiaView')
 * Devuelve: { invalidos: [], sinCoincidencia: [], ok: [] }
 */
(function () {
  'use strict';

  // Mapeo de vista → { route, tab, flagsArray[] }
  const VIEW_CONFIG = {
    'GanaderiaView': {
      route: '/ganaderia',
      tabs: ['panoramica', 'animales', 'rebanos', 'patrimonio', 'zonas', 'sanidad'],
      flagsCombos: [
        { leche: true, carne: true },   // ambos
        { leche: true, carne: false },  // solo leche
        { leche: false, carne: true },  // solo carne
      ]
    },
    'ExplotacionView': {
      route: '/explotacion',
      tabs: ['explotacion', 'lacteo', 'silos', 'fitosanitarios', 'gastos', 'proveedores', 'tramites', 'compradores', 'contratos', 'transportistas'],
      flagsCombos: [
        { leche: true, carne: true },
        { leche: true, carne: false },
        { leche: false, carne: true },
      ]
    },
    'ComercialView': {
      route: '/comercial',
      tabs: ['leche', 'carne', 'compradores', 'contratos', 'transportistas'],
      flagsCombos: [
        { leche: true, carne: true },
        { leche: true, carne: false },
        { leche: false, carne: true },
      ]
    }
  };

  // Obtener guías registradas para un pilar
  function getGuidesForPillar(pillar) {
    const all = window.GuideRegistry ? GuideRegistry.getAll() : [];
    return all.filter(g => g.pillar === pillar);
  }

  // Verificar si una guía aplica con ciertos flags
  function guideApplies(guide, flags) {
    if (!guide.applies) return true;
    try {
      return guide.applies(flags);
    } catch (e) {
      return true;
    }
  }

  // Navegar a ruta/tab y esperar render
  async function navigateAndWait(route, tab, flags) {
    // Setear flags en ModoContextoHelper
    if (window.ModoContextoHelper && ModoContextoHelper._modoCache) {
      ModoContextoHelper._modoCache.flags = flags;
    }
    // Navegar
    if (window.App && App.route) {
      await App.route(route + (tab ? '?tab=' + tab : ''));
    }
    // Esperar un tick para render
    await new Promise(r => setTimeout(r, 300));
    // Disparar EventBus por si acaso
    if (window.EventBus) {
      EventBus.emit('view:tabChanged', { route, tab });
    }
    await new Promise(r => setTimeout(r, 200));
  }

  // Validar un selector contra DOM actual
  function testSelector(selector) {
    if (!selector || selector === null) return { valid: true, matched: true, reason: 'center/no target' };
    try {
      const el = document.querySelector(selector);
      return { valid: true, matched: !!el, reason: el ? 'matched' : 'no match' };
    } catch (e) {
      return { valid: false, matched: false, reason: 'INVALID: ' + e.message };
    }
  }

  // Función principal exportada
  window.validarTargets = async function (viewName) {
    const config = VIEW_CONFIG[viewName];
    if (!config) {
      console.error('[validarTargets] Vista desconocida:', viewName);
      return { invalidos: [], sinCoincidencia: [], ok: [] };
    }

    const pillar = viewName.replace('View', '').toLowerCase();
    if (pillar === 'explotacion') pillar = 'expro';
    if (pillar === 'comercial') pillar = 'comer';

    const guides = getGuidesForPillar(pillar);
    if (!guides.length) {
      console.warn('[validarTargets] Sin guías para pilar:', pillar);
      return { invalidos: [], sinCoincidencia: [], ok: [] };
    }

    const results = { invalidos: [], sinCoincidencia: [], ok: [] };

    for (const guide of guides) {
      for (const flags of config.flagsCombos) {
        if (!guideApplies(guide, flags)) continue;

        const tab = guide.tab || config.tabs[0];
        console.log(`[validarTargets] ${guide.id} | tab=${tab} | flags=`, flags);

        await navigateAndWait(config.route, tab, flags);

        for (const [i, step] of guide.steps.entries()) {
          if (!step.target) continue;

          const test = testSelector(step.target);
          const ctx = { guia: guide.id, paso: i + 1, titulo: step.title, selector: step.target, flags, tab };

          if (!test.valid) {
            results.invalidos.push({ ...ctx, error: test.reason });
            console.error('  ❌ INVÁLIDO:', step.target, '→', test.reason);
          } else if (!test.matched) {
            // Verificar si es justificable (formulario cerrado, modal, etc.)
            const justificado = isJustifiedNoMatch(step.target, step.title);
            if (justificado) {
              results.ok.push({ ...ctx, note: 'justificado: ' + justificado });
              console.log('  ⚠️ SIN COINCIDENCIA (justificado):', step.target, '→', justificado);
            } else {
              results.sinCoincidencia.push({ ...ctx });
              console.warn('  ⚠️ SIN COINCIDENCIA:', step.target);
            }
          } else {
            results.ok.push({ ...ctx });
            console.log('  ✅ OK:', step.target);
          }
        }
      }
    }

    // Resumen
    console.log('\n=== RESUMEN validarTargets(' + viewName + ') ===');
    console.log('✅ OK:', results.ok.length);
    console.log('⚠️ Sin coincidencia (no justificados):', results.sinCoincidencia.length);
    console.log('❌ Inválidos:', results.invalidos.length);

    if (results.invalidos.length) {
      console.table(results.invalidos.map(r => ({
        guía: r.guia,
        paso: r.paso,
        selector: r.selector,
        error: r.error
      })));
    }
    if (results.sinCoincidencia.length) {
      console.table(results.sinCoincidencia.map(r => ({
        guía: r.guia,
        paso: r.paso,
        selector: r.selector,
        título: r.titulo
      })));
    }

    return results;
  };

  // Heurística: selectores que se justifican por estar en modales/formularios cerrados
  function isJustifiedNoMatch(selector, stepTitle) {
    const lowerTitle = stepTitle.toLowerCase();
    const lowerSel = selector.toLowerCase();

    // En formularios/wizards que se abren con launch
    if (lowerTitle.includes('wizard') || lowerTitle.includes('crear') || lowerTitle.includes('nuevo')) {
      return 'formulario wizard cerrado';
    }
    // En ficha detalle que requiere click previo
    if (lowerTitle.includes('ficha') || lowerTitle.includes('detalle')) {
      return 'requiere ficha abierta';
    }
    // En alertas condicionales
    if (lowerSel.includes('supresion') || lowerSel.includes('cuarentena') || lowerSel.includes('sobrepastoreo')) {
      return 'alerta condicional (puede no haber datos)';
    }
    // En botones de rotación/acción que requieren datos previos
    if (lowerSel.includes('rotar') || lowerSel.includes('consumo')) {
      return 'requiere datos previos (rebano/silo)';
    }
    // En modales
    if (lowerSel.startsWith('#modal') || lowerSel.includes('modal')) {
      return 'modal cerrado';
    }
    return null;
  }

})();