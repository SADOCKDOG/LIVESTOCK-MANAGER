/**
 * Livestock Manager - ComunidadesService v1.0.0
 * Constantes autonómicas y funciones de configuración para
 * normativa de Andalucía y Extremadura en ovino de leche.
 *
 * Referencia normativa:
 *   - Decreto 14/2006 (Andalucía) — distancias mínimas 500m
 *   - Decreto 163/2022 (Extremadura) — distancias mínimas 1000m
 *   - Paquete Lácteo UE — contratos obligatorios, INFOLAC, Letra Q
 *   - LIGAL — umbrales de calidad para ovino de leche
 */

window.ComunidadesService = (() => {
  'use strict';

  // ============================================================
  // 1. CONFIGURACIÓN POR COMUNIDAD AUTÓNOMA
  // ============================================================
  const COMUNIDADES = Object.freeze({
    andalucia: Object.freeze({
      label: 'Andalucía',
      provincias: Object.freeze(['Huelva', 'Sevilla', 'Cádiz', 'Córdoba', 'Jaén', 'Málaga', 'Granada', 'Almería']),
      codigo_provincia_prefijo: '21',           // Huelva
      distancia_minima_REGA_m: 500,             // Decreto 14/2006
      umbral_PAC_corderos_oveja: 0.6,           // 0.6 corderos/oveja/año
      sistema_movimiento: 'SIGGAN',             // Sistema de Información de Gestión Ganadera
      plataforma_tramitacion: 'PIMA',
      url_tramitacion: 'https://www.juntadeandalucia.es/servicios/sede/tramites/procedimientos/detalle/146.html',
      guia_automatica_si_saneada: true,         // Emisión guía 365 días si explotación saneada
      compensacion_vacunacion: 'directa',       // Ayudas directas Junta para vacunas
      adsg_subvencion: 'alta',                  // ADSG subvenciona vacunas
      formulario_crotales: 'SIGGAN',            // Sistema de pedido de crotales
      requiere_desinsectacion_movimiento: true, // Certificar desinsectación 48h previas
    }),

    extremadura: Object.freeze({
      label: 'Extremadura',
      provincias: Object.freeze(['Badajoz', 'Cáceres']),
      codigo_provincia_prefijo: '06',           // Badajoz
      distancia_minima_REGA_m: 1000,            // Decreto 163/2022
      umbral_PAC_corderos_oveja: 0.4,           // 0.4 corderos/oveja/año
      sistema_movimiento: 'BADIGEX',            // Base de Datos Identificación Ganadera Extremadura
      plataforma_tramitacion: 'Arado/Laboreo',
      url_tramitacion: 'https://doe.juntaex.es/pdfs/doe/2023/60o/23040002.pdf',
      guia_automatica_si_saneada: false,        // Requiere confirmación previa
      compensacion_vacunacion: 'fuerza_mayor',  // Cláusulas de fuerza mayor PAC
      adsg_subvencion: 'media',                 // Control estricto ADSG
      formulario_crotales: 'BADIGEX',           // Sistema de pedido de crotales
      requiere_desinsectacion_movimiento: true, // + restricción movimientos nocturnos
    }),
  });

  // ============================================================
  // 2. ESTRUCTURA DE COSTES LÁCTEOS (Referencia sectorial)
  // ============================================================
  const COSTES_LECHE_REF = Object.freeze({
    alimentacion:     Object.freeze({ pct: 55,  '€_por_litro': 0.66, indicador: 'g pienso / L producido', objetivo: '<450g/L', categoria_gasto: 'Alimentacion' }),
    mano_obra:        Object.freeze({ pct: 18,  '€_por_litro': 0.21, indicador: 'L / hora trabajo',        objetivo: '-' }),
    sanidad:          Object.freeze({ pct: 12,  '€_por_litro': 0.14, indicador: 'tasa reposición %',       objetivo: '20-25%', categoria_gasto: 'Sanidad' }),
    energeticos:      Object.freeze({ pct: 8,   '€_por_litro': 0.10, indicador: 'kW / L enfriado',         objetivo: '<4°C', categoria_gasto: 'Electricidad' }),
    amortizacion:     Object.freeze({ pct: 7,   '€_por_litro': 0.09, indicador: 'coste estructura fijo/L', objetivo: '-', categoria_gasto: 'Amortizacion' }),
    total:            Object.freeze({ pct: 100, '€_por_litro': 1.20 }),
  });

  // ============================================================
  // 3. ESTADOS DE ANALÍTICA DE LECHE
  // ============================================================
  const ESTADOS_ANALITICA_LECHE = Object.freeze({
    PENDIENTE:      Object.freeze({ label: 'Pendiente',      color: '#f59e0b', icon: '⏳' }),
    EN_ANALISIS:    Object.freeze({ label: 'En Análisis',    color: '#3b82f6', icon: '🔬' }),
    VALIDADO:       Object.freeze({ label: 'Validado',       color: '#10b981', icon: '✅' }),
    ALERTA_CRITICA: Object.freeze({ label: 'Alerta Crítica', color: '#ef4444', icon: '🚨' }),
    RECHAZADO:      Object.freeze({ label: 'Rechazado',      color: '#dc2626', icon: '❌' }),
  });

  // ============================================================
  // 4. UMBRALES DE CALIDAD — Ovino de Leche (Referencia LIGAL)
  // ============================================================
  const CALIDAD_LECHE_OVINO_UMBRALES = Object.freeze({
    grasa:         Object.freeze({ min: 6.0,  max: 8.5,  optimo: 7.2, unidad: '%' }),
    proteina:      Object.freeze({ min: 5.0,  max: 6.5,  optimo: 5.8, unidad: '%' }),
    extracto_seco: Object.freeze({ min: 11.0, max: 15.0, optimo: 13.0, unidad: '%' }),
    somaticas:     Object.freeze({ max: 400000,           optimo: '<200000', unidad: 'cel/mL' }),
    bacterias:     Object.freeze({ max: 1500000,          optimo: '<500000', unidad: 'UFC/mL' }),
    temperatura:   Object.freeze({ max: 4,                optimo: '<2',      unidad: '°C' }),
    antibioticos:  Object.freeze({ permitido: false }),
  });

  // ============================================================
  // 5. MOTIVOS DE RECHAZO DE LECHE
  // ============================================================
  const MOTIVOS_RECHAZO_LECHE = Object.freeze([
    'antibioticos',
    'temperatura_superior',
    'celulas_somaticas_elevadas',
    'carga_bacteriana_elevada',
    'inhibidores',
    'mastitis',
    'calostro',
    'otro',
  ]);

  // ============================================================
  // 6. TIPOS DE EXPLOTACIÓN / SISTEMAS
  // ============================================================
  const TIPOS_EXPLOTACION = Object.freeze(['carne', 'leche', 'mixto', 'ibérico']);
  const SISTEMAS_EXPLOTACION = Object.freeze(['intensivo', 'extensivo', 'semiextensivo']);

  // ============================================================
  // 7. PRECIOS DE REFERENCIA — Liquidación por Extracto Seco
  // ============================================================
  const PRECIO_EXTRACTO_SECO_REF = Object.freeze({
    precio_base_referencia: 0.45,            // €/L base contractual
    precio_por_punto_extracto: 0.045,        // €/punto sobre el precio base
    prima_calidad_extra: 0.02,               // €/L extra si cumple TODOS los umbrales
    penalizacion_somaticas: -0.03,           // €/L si >400.000 cél/mL
    penalizacion_bacterias: -0.02,           // €/L si >1.500.000 UFC/mL
    tasa_INLAC_defecto: 0.0012,              // Tasa mensual estándar INFOLAC
  });

  // ============================================================
  // FUNCIONES PÚBLICAS
  // ============================================================

  /**
   * Obtiene la configuración completa de una comunidad autónoma
   * @param {'andalucia'|'extremadura'} ccaa
   * @returns {object|undefined}
   */
  function getConfiguracionCCAA(ccaa) {
    return COMUNIDADES[ccaa] || undefined;
  }

  /**
   * Obtiene las dos comunidades disponibles
   * @returns {object}
   */
  function getComunidades() {
    return { ...COMUNIDADES };
  }

  /**
   * Obtiene las opciones para un select de comunidad autónoma
   * @returns {Array<{value:string, label:string}>}
   */
  function getOpcionesComunidad() {
    return [
      { value: 'andalucia', label: 'Andalucía' },
      { value: 'extremadura', label: 'Extremadura' },
    ];
  }

  /**
   * Retorna la plataforma de movimiento de ganado (SIGGAN / BADIGEX)
   * @param {'andalucia'|'extremadura'} ccaa
   * @returns {string}
   */
  function getPlataformaMovimiento(ccaa) {
    const conf = COMUNIDADES[ccaa];
    return conf ? conf.sistema_movimiento : 'No configurado';
  }

  /**
   * Retorna el umbral PAC de corderos/oveja/año
   * @param {'andalucia'|'extremadura'} ccaa
   * @returns {number}
   */
  function getUmbralPAC(ccaa) {
    const conf = COMUNIDADES[ccaa];
    return conf ? conf.umbral_PAC_corderos_oveja : 0;
  }

  /**
   * Retorna la distancia mínima REGA entre explotaciones
   * @param {'andalucia'|'extremadura'} ccaa
   * @returns {number} metros
   */
  function getDistanciaMinimaREGA(ccaa) {
    const conf = COMUNIDADES[ccaa];
    return conf ? conf.distancia_minima_REGA_m : 0;
  }

  /**
   * Obtiene los costes de referencia para ovino de leche
   * @returns {object}
   */
  function getCostesLecheReferencia() {
    return { ...COSTES_LECHE_REF };
  }

  /**
   * Obtiene tabla de costes formateada para visualización
   * @returns {Array<{categoria:string, pct:number, €_por_litro:number, indicador:string, objetivo:string}>}
   */
  function getTablaCostesLeche() {
    const keys = Object.keys(COSTES_LECHE_REF).filter(k => k !== 'total');
    return keys.map(k => ({
      categoria: k,
      pct: COSTES_LECHE_REF[k].pct,
      '€_por_litro': COSTES_LECHE_REF[k]['€_por_litro'],
      indicador: COSTES_LECHE_REF[k].indicador,
      objetivo: COSTES_LECHE_REF[k].objetivo,
    }));
  }

  /**
   * Obtiene la configuración de estados analíticos
   * @returns {object}
   */
  function getEstadosAnalitica() {
    return { ...ESTADOS_ANALITICA_LECHE };
  }

  /**
   * Obtiene un estado analítico por su clave
   * @param {string} key — PENDIENTE|EN_ANALISIS|VALIDADO|ALERTA_CRITICA|RECHAZADO
   * @returns {object|undefined}
   */
  function getEstadoAnalitica(key) {
    return ESTADOS_ANALITICA_LECHE[key] || undefined;
  }

  /**
   * Obtiene todos los umbrales de calidad para ovino de leche
   * @returns {object}
   */
  function getUmbralesCalidad() {
    return { ...CALIDAD_LECHE_OVINO_UMBRALES };
  }

  /**
   * Evalúa la calidad de un análisis de leche contra los umbrales
   * @param {object} lab — { grasa, proteina, somaticas, germenes, antibioticos, temperatura }
   * @returns {{ apto: boolean, alertas: string[], badges: object[] }}
   */
  function evaluarCalidadLeche(lab) {
    const alertas = [];
    const badges = [];

    if (!lab) return { apto: false, alertas: ['Sin datos de laboratorio'], badges: [] };

    if (lab.antibioticos) {
      alertas.push('ANTIBIÓTICOS DETECTADOS — LECHE NO APTA');
      badges.push({ label: '🚫 Antibióticos', color: '#dc2626', tipo: 'critico' });
    }

    if (lab.grasa != null) {
      if (lab.grasa < CALIDAD_LECHE_OVINO_UMBRALES.grasa.min) {
        alertas.push(`Grasa baja (${lab.grasa}% < ${CALIDAD_LECHE_OVINO_UMBRALES.grasa.min}%)`);
        badges.push({ label: `⚠️ Grasa ${lab.grasa}%`, color: '#f59e0b', tipo: 'alerta' });
      } else {
        badges.push({ label: `✅ Grasa ${lab.grasa}%`, color: '#10b981', tipo: 'ok' });
      }
    }

    if (lab.proteina != null) {
      if (lab.proteina < CALIDAD_LECHE_OVINO_UMBRALES.proteina.min) {
        alertas.push(`Proteína baja (${lab.proteina}% < ${CALIDAD_LECHE_OVINO_UMBRALES.proteina.min}%)`);
        badges.push({ label: `⚠️ Proteína ${lab.proteina}%`, color: '#f59e0b', tipo: 'alerta' });
      } else {
        badges.push({ label: `✅ Proteína ${lab.proteina}%`, color: '#10b981', tipo: 'ok' });
      }
    }

    if (lab.somaticas != null && lab.somaticas > CALIDAD_LECHE_OVINO_UMBRALES.somaticas.max) {
      alertas.push(`Células somáticas elevadas (${lab.somaticas.toLocaleString()} > ${CALIDAD_LECHE_OVINO_UMBRALES.somaticas.max.toLocaleString()})`);
      badges.push({ label: `🔴 CS ${(lab.somaticas / 1000).toFixed(0)}k`, color: '#ef4444', tipo: 'alerta' });
    }

    if (lab.germenes != null && lab.germenes > CALIDAD_LECHE_OVINO_UMBRALES.bacterias.max) {
      alertas.push(`Carga bacteriana elevada (${lab.germenes.toLocaleString()} UFC)`);
      badges.push({ label: `🔴 UFC ${(lab.germenes / 1000).toFixed(0)}k`, color: '#ef4444', tipo: 'alerta' });
    }

    const apto = alertas.length === 0 || !lab.antibioticos;
    return { apto, alertas, badges };
  }

  /**
   * Calcula el extracto seco (grasa + proteína)
   * @param {number} grasa
   * @param {number} proteina
   * @returns {number}
   */
  function calcularExtractoSeco(grasa, proteina) {
    if (grasa == null || proteina == null) return 0;
    return parseFloat((grasa + proteina).toFixed(2));
  }

  /**
   * Calcula el precio final unitario de la leche según extracto seco
   * @param {object} params
   * @param {number} params.precioBase — €/L base
   * @param {number} params.extractoSeco — grasa% + proteina%
   * @param {number} params.precioExtracto — €/punto extracto
   * @param {number} params.tasaINLAC — tasa mensual
   * @param {number} params.primasPenalizaciones — +/- ajuste calidad
   * @returns {number}
   */
  function calcularPrecioFinalUnitario({ precioBase, extractoSeco, precioExtracto, tasaINLAC, primasPenalizaciones }) {
    const base = parseFloat(precioBase) || 0;
    const extracto = parseFloat(extractoSeco) || 0;
    const pExtracto = parseFloat(precioExtracto) || 0;
    const tasa = parseFloat(tasaINLAC) || 0;
    const primas = parseFloat(primasPenalizaciones) || 0;

    return parseFloat((base + (extracto * pExtracto) - tasa + primas).toFixed(4));
  }

  /**
   * Calcula el MOFA (Margen sobre Coste de Alimentación)
   * MOFA = Ingresos totales - Coste alimentación del período
   * @param {number} importeTotal — ingresos del período
   * @param {number} costeAlimentacion — coste alimentación del período
   * @returns {number}
   */
  function calcularMOFA(importeTotal, costeAlimentacion) {
    return parseFloat(((importeTotal || 0) - (costeAlimentacion || 0)).toFixed(2));
  }

  /**
   * Genera un badge HTML para estado analítico
   * @param {string} estado — clave del estado
   * @returns {string}
   */
  function badgeEstadoAnalitica(estado) {
    const cfg = ESTADOS_ANALITICA_LECHE[estado] || ESTADOS_ANALITICA_LECHE.PENDIENTE;
    return `<span style="font-size:0.62rem; font-weight:700; padding:2px 8px; border-radius:4px;
             background:${cfg.color}16; color:${cfg.color}; border:1px solid ${cfg.color}40;">
             ${cfg.icon} ${cfg.label}</span>`;
  }

  /**
   * Genera badges HTML para los resultados de calidad
   * @param {object} lab — datos de laboratorio
   * @returns {string}
   */
  function badgesCalidadLeche(lab) {
    if (!lab) return '';
    const { badges } = evaluarCalidadLeche(lab);
    return badges.map(b =>
      `<span style="font-size:0.6rem; font-weight:700; padding:1px 6px; border-radius:3px;
               background:${b.color}16; color:${b.color}; border:1px solid ${b.color}40;
               margin-right:3px;">${b.label}</span>`
    ).join('');
  }

  // API pública
  return {
    COMUNIDADES,
    COSTES_LECHE_REF,
    ESTADOS_ANALITICA_LECHE,
    CALIDAD_LECHE_OVINO_UMBRALES,
    MOTIVOS_RECHAZO_LECHE,
    TIPOS_EXPLOTACION,
    SISTEMAS_EXPLOTACION,
    PRECIO_EXTRACTO_SECO_REF,
    getConfiguracionCCAA,
    getComunidades,
    getOpcionesComunidad,
    getPlataformaMovimiento,
    getUmbralPAC,
    getDistanciaMinimaREGA,
    getCostesLecheReferencia,
    getTablaCostesLeche,
    getEstadosAnalitica,
    getEstadoAnalitica,
    getUmbralesCalidad,
    evaluarCalidadLeche,
    calcularExtractoSeco,
    calcularPrecioFinalUnitario,
    calcularMOFA,
    badgeEstadoAnalitica,
    badgesCalidadLeche,
  };
})();
