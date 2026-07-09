/**
 * Helper transversal para contexto de modo por bloque.
 * Permite independencia de modo (carne/leche/híbrido) en cada módulo.
 */
const ModoContextoHelper = {
  VALID_MODES: new Set(['carne', 'leche', 'hibrido']),

  getModeMeta(mode) {
    const map = {
      carne: { icon: Icons.carne(), label: 'Cárnico', color: 'var(--c-danger)' },
      leche: { icon: Icons.leche(), label: 'Lácteo', color: 'var(--c-info)' },
      hibrido: { icon: Icons.rotacion(), label: 'Híbrido', color: 'var(--c-success)' }
    };
    return map[mode] || map.leche;
  },

  detectModeFromRebanos(rebanos) {
    let tieneCarne = false;
    let tieneLeche = false;
    let tieneHibrido = false;

    (rebanos || []).forEach(r => {
      const tipo = (r.tipo || '').toLowerCase();
      if (tipo.includes('carne') || tipo.includes('cárn')) tieneCarne = true;
      else if (tipo.includes('leche') || tipo.includes('láct')) tieneLeche = true;
      else if (tipo.includes('mixt') || tipo.includes('híbr') || tipo.includes('doble')) tieneHibrido = true;
    });

    if (tieneHibrido || (tieneCarne && tieneLeche)) return 'hibrido';
    if (tieneLeche) return 'leche';
    return 'carne';
  },

  _matchTipoByMode(tipo, mode) {
    const t = (tipo || '').toLowerCase();
    const esCarne = t.includes('carne') || t.includes('cárn');
    const esLeche = t.includes('leche') || t.includes('láct');
    const esHibrido = t.includes('mixt') || t.includes('híbr') || t.includes('doble');

    if (mode === 'carne') return esCarne || esHibrido;
    if (mode === 'leche') return esLeche || esHibrido;
    if (mode === 'hibrido') return esCarne || esLeche || esHibrido;
    return false;
  },

  filterRebanosByMode(rebanos, mode) {
    return (rebanos || []).filter(r => this._matchTipoByMode(r.tipo, mode));
  },

  getModeForBlock(blockKey, rebanos) {
    const fallback = this.detectModeFromRebanos(rebanos);
    try {
      const saved = localStorage.getItem(`lm.modo.${blockKey}`);
      if (saved && this.VALID_MODES.has(saved)) return saved;
    } catch (_) {}

    // Si no hay modo guardado y el sistema detecta híbrido,
    // forzamos 'leche' por defecto según requerimiento de UI.
    if (fallback === 'hibrido') return 'leche';

    return fallback;
  },

  setModeForBlock(blockKey, mode) {
    if (!this.VALID_MODES.has(mode)) return;
    try {
      localStorage.setItem(`lm.modo.${blockKey}`, mode);
    } catch (_) {}
  },

  getEspecieColor(especie) {
    if (!especie) return '#6b7280'; // Gray
    const e = especie.toLowerCase();
    if (e.includes('vaca') || e.includes('bovin')) return 'var(--c-danger)'; // Red
    if (e.includes('oveja') || e.includes('ovin')) return 'var(--c-info)'; // Blue
    if (e.includes('cabra') || e.includes('caprin')) return '#4FADF5'; // Purple
    if (e.includes('cerdo') || e.includes('porcin')) return 'var(--c-success)'; // Green
    if (e.includes('equin') || e.includes('caball')) return 'var(--c-orange)';
    if (e.includes('avicol') || e.includes('ave')) return 'var(--c-warning)'; // Amber
    return '#6b7280'; // Default
  }
};

window.ModoContextoHelper = ModoContextoHelper;
