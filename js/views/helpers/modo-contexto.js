/**
 * Helper transversal para el modo de explotación (Leche / Carne).
 * Dos flags independientes y persistentes: el usuario puede activar uno o ambos.
 * No existe un tercer estado "híbrido": tener ambos flags activos ES el caso mixto.
 */
const ModoContextoHelper = {
  FLAGS_KEY: 'lm.explotacion.flags',
  LEGACY_MODE_KEY: 'lm.explotacion.modo_global',
  VALID_LEGACY_MODES: new Set(['carne', 'leche', 'hibrido']),

  getModeMeta(mode) {
    const map = {
      carne: { icon: Icons.carne(), label: 'Cárnico', color: 'var(--c-success)' },
      leche: { icon: Icons.leche(), label: 'Lácteo', color: 'var(--c-info)' }
    };
    return map[mode] || map.leche;
  },

  detectFlagsFromRebanos(rebanos) {
    let tieneCarne = false;
    let tieneLeche = false;

    (rebanos || []).forEach(r => {
      const tipo = (r.tipo || '').toLowerCase();
      if (tipo.includes('carne') || tipo.includes('cárn')) tieneCarne = true;
      if (tipo.includes('leche') || tipo.includes('láct')) tieneLeche = true;
      if (tipo.includes('mixt') || tipo.includes('híbr') || tipo.includes('doble')) { tieneCarne = true; tieneLeche = true; }
    });

    if (!tieneCarne && !tieneLeche) return { leche: true, carne: false };
    return { leche: tieneLeche, carne: tieneCarne };
  },

  _matchTipoByMode(tipo, flags) {
    const t = (tipo || '').toLowerCase();
    const esCarne = t.includes('carne') || t.includes('cárn');
    const esLeche = t.includes('leche') || t.includes('láct');
    const esHibrido = t.includes('mixt') || t.includes('híbr') || t.includes('doble');

    if (esHibrido) return flags.leche || flags.carne;
    if (esCarne) return !!flags.carne;
    if (esLeche) return !!flags.leche;
    return false;
  },

  filterRebanosByMode(rebanos, flags) {
    return (rebanos || []).filter(r => this._matchTipoByMode(r.tipo, flags));
  },

  /**
   * Lee los flags persistidos, migrando desde el antiguo modo único si hace falta.
   */
  getFlags() {
    try {
      const saved = localStorage.getItem(this.FLAGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.leche || parsed.carne)) {
          return { leche: !!parsed.leche, carne: !!parsed.carne };
        }
      }
    } catch (_) {}

    // Migración desde el modo único antiguo (leche/carne/hibrido)
    try {
      const legacy = localStorage.getItem(this.LEGACY_MODE_KEY);
      if (legacy && this.VALID_LEGACY_MODES.has(legacy)) {
        const flags = legacy === 'hibrido' ? { leche: true, carne: true }
          : legacy === 'carne' ? { leche: false, carne: true }
          : { leche: true, carne: false };
        this.setFlags(flags);
        return flags;
      }
    } catch (_) {}

    return null; // null indica que no hay preferencia establecida todavía
  },

  /**
   * Guarda los flags. Si ambos vienen desactivados, no hace nada (se exige al menos uno activo).
   */
  setFlags(flags) {
    const leche = !!flags.leche;
    const carne = !!flags.carne;
    if (!leche && !carne) return false;
    try {
      localStorage.setItem(this.FLAGS_KEY, JSON.stringify({ leche, carne }));
    } catch (_) {}
    return true;
  },

  /**
   * Flags efectivos: preferencia guardada, o detección automática (y persistencia) la primera vez.
   */
  async getEffectiveFlags(fincaId) {
    const saved = this.getFlags();
    if (saved) return saved;

    try {
      if (fincaId !== undefined) {
        const rebanos = await window.db.getAllFromIndex('rebanos', 'fincaId', fincaId).catch(() => []);
        const detected = this.detectFlagsFromRebanos(rebanos);
        this.setFlags(detected);
        return detected;
      }
    } catch (_) {}

    return { leche: true, carne: false };
  },

  isLecheActivo() {
    const flags = this.getFlags();
    return flags ? flags.leche : true;
  },

  isCarneActivo() {
    const flags = this.getFlags();
    return flags ? !!flags.carne : false;
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
