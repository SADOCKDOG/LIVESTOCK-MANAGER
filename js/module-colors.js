/**
 * module-colors.js — MAPA ÚNICO de colores de módulo (estándar Cork Manager).
 * Normativa: .agent/AGENTS.md §1 · Tokens CSS equivalentes: css/design-tokens.css.
 * PROHIBIDO duplicar mapas de color en menús/vistas: consumir siempre este objeto.
 */
window.MODULE_COLORS = Object.freeze({
  // Success / Zonas / Híbrido / Ventas
  '/': '#C5FA50',
  '/explotacion': '#C5FA50',
  '/hibrido': '#C5FA50',
  '/zonas': '#C5FA50',
  '/comercializacion': '#4FADF5',
  '/trazabilidad': '#4FADF5',
  // Danger / Carne / Gastos
  '/ganaderia': '#E8555F',
  '/carne': '#E8555F',
  '/gastos': '#E8555F',
  // Info / Leche / Listas
  '/leche': '#4FADF5',
  '/rebanos': '#4FADF5',
  '/compradores': '#4FADF5',
  // Warning / Informes / Alertas
  '/informes': '#FFFC55',
  '/alertas': '#FFFC55',
  // Naranja de módulo: Animales / Cuaderno (Reasignado a Rojo Coral)
  '/animales': '#E8555F',
  '/cuaderno': '#E8555F',
  // Violeta de módulo: Proveedores / Manuales / Documentos-Trámites (Reasignados a Cyan)
  '/proveedores': '#4FADF5',
  '/manuales': '#4FADF5',
  '/documentos': '#4FADF5',
  // Rosa de módulo: Logística (Reasignado a Cyan)
  '/transportistas': '#4FADF5',
  // Neutro
  '/ajustes': '#B1B1B1',
  // Alias de rutas de detalle (heredan el color de su módulo)
  '/animal': '#E8555F',
  '/rebano': '#4FADF5',
  '/zona': '#C5FA50',
  '/comprador': '#4FADF5',
  '/proveedor': '#4FADF5',
  '/gasto': '#E8555F',
  '/venta-carne': '#E8555F',
  '/albaran-leche': '#4FADF5',
  '/contrato': '#4FADF5'
});

/** Color de un módulo por ruta (fallback: lima corporativo). */
window.getModuleColor = function (path) {
  return window.MODULE_COLORS[path] || '#C5FA50';
};
