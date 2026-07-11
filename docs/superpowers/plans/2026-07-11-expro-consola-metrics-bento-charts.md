# EXPRO Console Metrics and Bento Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the EXPRO console to show proper metrics by operation mode (LACTEO: MOFA, litros; CARNICO: GMD, peso, ICA; HIBRIDO: combination) and implement the missing Bento bar charts in Comercializacion view as specified in Fase 4 of the auditoría de comercialización y logística.

**Architecture:** 
- Enhance ExplotacionView._renderModoExplotacion to display mode-specific metrics
- Add proper GMD (Ganancia Media Diaria) calculation for carne mode
- Add ICA (Indice de Conversion Alimenticia) display for carne mode
- Implement missing Bento bar charts in ComercializacionView for rendimiento visual
- Ensure all calculations use proper temporal windows and data sources

**Tech Stack:** JavaScript, IndexedDB, DOM manipulation, existing ExplotacionView and ComercializacionView architectures

## Global Constraints

- Maintain compatibility with existing codebase patterns
- Use existing utility functions for date formatting and number localization
- Follow existing visualization patterns in the codebase (card-registro, leche-kpi-item, etc.)
- Preserve existing functionality while enhancing it
- All dates should be handled in ISO 8601 format (YYYY-MM-DD) for consistency
- Monetary values should display with 2 decimal places and proper locale formatting
- Percentages should be formatted appropriately

---

### Task 1: EXPRO Console - Carne Mode Metrics Enhancement

**Files:**
- Modify: `js/views/explotacion-view.js:650-690` (Render section for metrics)

**Interfaces:**
- Consumes: `d.margenCarne` (already calculated), needs to add GMD and ICA calculations
- Produces: Enhanced display showing GMD, peso total, and ICA for carne mode

- [ ] **Step 1: Identify where carnico mode metrics are rendered**

```javascript
// Look for the metrics rendering section in _renderModoExplotacion around lines 260-270
// Current implementation only shows margenCarne
```

- [ ] **Step 2: Add helper methods for GMD and ICA calculation (if not already present)**

```javascript
// Add these methods to ExplotacionView class if they don't exist
_calcularGMDCarne() {
    // Calculate Ganancia Media Diaria for carnico mode
    // Similar to what's done in CarneView._calcularICA but focused on GMD
    // Return average daily gain in kg
}

_calcularICACarne() {
    // Calculate ICA for carnico mode using existing _calcularICA from CarneView
    // or reuse similar logic
    // Return ICA ratio and cost per kg gain
}
```

- [ ] **Step 3: Modify the metrics display to show carne-specific values**

```javascript
// Replace the simple margenCarne display with:
<div class="py-10 flex justify-between items-center">
    <span class="text-[0.65rem] text-gray uppercase font-900">GMD (Ganancia Media Diaria)</span>
    <strong class="text-lg font-950" style="color: var(--c-success);">${this._calcularGMDCarne() > 0 ? this._calcularGMDCarne().toFixed(2) + ' kg/día' : '0.00 kg/día'}</strong>
</div>
<div class="py-10 flex justify-between items-center">
    <span class="text-[0.65rem] text-gray uppercase font-900">Peso Total Ganado</span>
    <strong class="text-lg font-950" style="color: var(--c-success);">${this._calcularPesoTotalCarne().toLocaleString()} kg</strong>
</div>
<div class="py-10 flex justify-between items-center">
    <span class="text-[0.65rem] text-gray uppercase font-900">ICA (Conversión)</span>
    <strong class="text-lg font-950" style="color: var(--c-success);">${this._calcularICACarne().ica > 0 ? this._calcularICACarne().ica.toFixed(2) + ' : 1' : '0.00 : 1'}</strong>
</div>
```

- [ ] **Step 4: Run test to verify it works**

Open the application in browser, navigate to Explotacion → Carne mode, verify GMD, peso total, and ICA are displayed correctly

- [ ] **Step 5: Commit**

```bash
git add js/views/explotacion-view.js
git commit -m "feat(expro): enhance carne mode metrics with GMD, peso total, and ICA"
```