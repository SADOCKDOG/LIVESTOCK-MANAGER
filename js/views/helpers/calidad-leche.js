/**
 * Livestock Manager - CalidadLecheHelper v1.0.0
 * Helpers visuales para indicadores de calidad láctea.
 * Reutiliza ComunidadesService para umbrales y constantes.
 */

window.CalidadLecheHelper = (() => {
  'use strict';

  /**
   * Genera HTML para un badge de parámetro de calidad individual
   * @param {string} label — nombre del parámetro
   * @param {number|string} value — valor medido
   * @param {boolean} ok — true si cumple umbral
   * @returns {string}
   */
  function badgeParametro(label, value, ok) {
    const color = ok ? '#10b981' : '#ef4444';
    const icon = ok ? '✅' : '⚠️';
    return `<span style="display:inline-flex; align-items:center; gap:3px; font-size:0.62rem; font-weight:700;
             padding:2px 8px; border-radius:4px; background:${color}16; color:${color};
             border:1px solid ${color}40; margin:2px;">
             ${icon} ${label}: ${value}</span>`;
  }

  /**
   * Genera el HTML completo de badges de calidad para una card de leche
   * @param {object} e — registro de comercializacion_leche
   * @returns {string}
   */
  function badgesCompletos(e) {
    const lab = e.laboratorio || {};
    const parts = [];

    // Estado analítica
    if (e.estadoAnalitica) {
      parts.push(window.ComunidadesService.badgeEstadoAnalitica(e.estadoAnalitica));
    }

    // Temperatura
    if (e.temperatura != null) {
      const ok = e.temperatura <= 4;
      parts.push(badgeParametro('🌡️', e.temperatura + '°C', ok));
    }

    // Grasa
    if (lab.grasa != null) {
      const ok = lab.grasa >= 6.0;
      parts.push(badgeParametro('🧈 Grasa', lab.grasa + '%', ok));
    }

    // Proteína
    if (lab.proteina != null) {
      const ok = lab.proteina >= 5.0;
      parts.push(badgeParametro('🥩 Prot', lab.proteina + '%', ok));
    }

    // Extracto seco
    const es = lab.extracto_seco || (lab.grasa != null && lab.proteina != null ? (lab.grasa + lab.proteina).toFixed(1) : null);
    if (es != null) {
      const ok = es >= 11.0;
      parts.push(badgeParametro(`${Icons.grafico()} ES`, es + '%', ok));
    }

    // Células somáticas
    if (lab.somaticas != null) {
      const ok = lab.somaticas <= 400000;
      parts.push(badgeParametro(`${Icons.fitosanitario()} CS`, (lab.somaticas / 1000).toFixed(0) + 'k', ok));
    }

    // Inhibidores
    if (e.certificadoInhibidores != null) {
      const ok = e.certificadoInhibidores;
      parts.push(badgeParametro(`${Icons.veterinario()} Inhib`, ok ? 'OK' : 'PENDIENTE', ok));
    }

    return parts.join(' ');
  }

  /**
   * Genera un mini indicador de calidad tipo semáforo
   * @param {object} e — registro de comercializacion_leche
   * @returns {{color:string, label:string, icon:string}}
   */
  function semaforoCalidad(e) {
    const lab = e.laboratorio || {};
    const problemas = [];

    if (e.antibioticos || lab.antibioticos) problemas.push('antibióticos');
    if (e.temperatura != null && e.temperatura > 6) problemas.push('temp');
    if (lab.somaticas != null && lab.somaticas > 400000) problemas.push('células');
    if (lab.germenes != null && lab.germenes > 1500000) problemas.push('bacterias');
    if (e.certificadoInhibidores === false) problemas.push('inhibidores');

    if (problemas.length === 0) {
      return { color: '#10b981', label: 'Calidad Óptima', icon: '✅' };
    }
    if (problemas.length <= 2) {
      return { color: '#f59e0b', label: 'Atención: ' + problemas.join(', '), icon: '⚠️' };
    }
    return { color: '#ef4444', label: 'Alerta: ' + problemas.join(', '), icon: '🚨' };
  }

  /**
   * Formatea importe en euros
   * @param {number} val
   * @returns {string}
   */
  function fmtEuro(val) {
    return (val != null && !isNaN(val)) ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : '0 €';
  }

  /**
   * Formatea número genérico
   * @param {number} n
   * @returns {string}
   */
  function fmtNum(n) {
    return (n != null && !isNaN(n)) ? Number(n).toLocaleString() : '0';
  }

  return {
    badgeParametro,
    badgesCompletos,
    semaforoCalidad,
    fmtEuro,
    fmtNum,
  };
})();
