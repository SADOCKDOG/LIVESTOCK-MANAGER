/**
 * module-colors.js — MAPA ÚNICO de colores de módulo (estándar Cork Manager).
 * Normativa: .agent/AGENTS.md §1 · Tokens CSS equivalentes: css/design-tokens.css.
 * PROHIBIDO duplicar mapas de color en menús/vistas: consumir siempre este objeto.
 */
window.MODULE_COLORS = Object.freeze({
  // Success / Zonas / Híbrido / Ventas
  '/': '#CCFF00',
  '/explotacion': '#CCFF00',
  '/hibrido': '#CCFF00',
  '/zonas': '#CCFF00',
  '/comercializacion': '#CCFF00',
  '/trazabilidad': '#CCFF00',
  // Danger / Carne / Gastos
  '/ganaderia': '#FF4444',
  '/carne': '#FF4444',
  '/gastos': '#FF4444',
  // Info / Leche / Listas
  '/leche': '#3b82f6',
  '/rebanos': '#3b82f6',
  '/compradores': '#3b82f6',
  // Warning / Informes / Alertas
  '/informes': '#FFD600',
  // Naranja de módulo: Animales / Cuaderno
  '/animales': '#F97316',
  '/cuaderno': '#F97316',
  // Violeta de módulo: Proveedores / Manuales / Documentos-Trámites
  '/proveedores': '#A855F7',
  '/manuales': '#A855F7',
  '/documentos': '#A855F7',
  // Rosa de módulo: Logística
  '/transportistas': '#EC4899',
  // Neutro
  '/ajustes': '#94A3B8'
});

/** Color de un módulo por ruta (fallback: lima corporativo). */
window.getModuleColor = function (path) {
  return window.MODULE_COLORS[path] || '#CCFF00';
};
