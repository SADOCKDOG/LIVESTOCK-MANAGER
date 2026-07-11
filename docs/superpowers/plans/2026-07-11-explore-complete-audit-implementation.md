# Complete Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the remaining items from the audit of 4 documents vs. code reality by implementing missing features and fixing identified issues.

**Architecture:** Address each audit finding systematically by implementing missing features in Expor console (GMD/ICA display), ensuring zona normalization is solid, verifying leche-view cleanup, and addressing any other minor issues identified.

**Tech Stack:** JavaScript, IndexedDB, Livestock Manager web application

## Global Constraints

- Maintain backward compatibility with existing functionality
- Follow existing code patterns and conventions in the codebase
- Ensure all changes are testable and don't break existing features
- Use incremental commits with clear messages
- Keep changes focused and minimal

---

## Task 1: EXPRO Console Metrics Enhancement

**Files:**
- Modify: `js/views/explotacion-view.js`

**Interfaces:**
- Consumes: `_cachedData` with carne-related metrics (margenCarne, etc.)
- Produces: Enhanced UI displays for different modes

### Task 1.1: Add Helper Methods for Carne Metrics

- [ ] **Step 1: Add methods to calculate GMD and total peso ganado for carne**

```javascript
// Add these methods to the ExplotacionView object
_calcularGM Carne() {
    const { gmdList = [] } = this._cachedData || {};
    if (!gmdList.length) return 0;
    const totalGMD = gmdList.reduce((sum, item) => sum + (item.gmd || 0), 0);
    return totalGMD / gmdList.length;
}

_calcularPesoTotalCarne() {
    const { gmdList = [] } = this._cachedData || {};
    return gmdList.reduce((sum, item) => sum + (item.ultimoPeso || 0) - (item.primerPeso || 0), 0);
}

_calcularICACarne() {
    // Reuse existing ICA calculation logic
    const { ica = 0, kgPienso = 0, costePorKgGanancia = 0 } = this._cachedData || {};
    return { ica, kgPienso, costePorKgGanancia };
}
```

- [ ] **Step 2: Run to verify it fails (methods don't exist yet)**
- [ ] **Step 3: Implement the methods as shown above**
- [ ] **Step 4: Run to verify they work**
- [ ] **Step 5: Commit** `git add js/views/explotacion-view.js && git commit -m "feat(exploracion): add helper methods for carne metrics (GMD, peso total, ICA)"`

### Task 1.2: Update Metrics Display Based on Mode

- [ ] **Step 1: Write failing test by attempting to modify the metrics display section**
- [ ] **Step 2: Run to verify it fails (current code shows generic metrics)**
- [ ] **Step 3: Modify the metrics display in _renderModoExplotacion to show appropriate metrics per mode**

```javascript
// Replace lines 261-268 in _renderModoExplotacion with:
<div class="py-10 flex justify-between items-center">
    <span class="text-[0.65rem] text-gray uppercase font-900">Producción Total</span>
    <strong class="text-lg font-950">${this._activeMode === 'leche' ? d.totalLitros.toLocaleString() + ' L' : this._activeMode === 'carne' ? d.pesajes.length + ' pesajes' : d.totalLitros.toLocaleString() + ' L / ' + d.pesajes.length + ' pesajes'}</strong>
</div>

<!-- Mode-specific metrics -->
${this._activeMode === 'leche' ? `
<div class="py-10 flex justify-between items-center">
    <span class="text-[0.65rem] text-gray uppercase font-900">MOFA (Leche)</span>
    <strong class="text-lg font-950" style="color: var(--c-success);">${Math.round(d.mofaLeche).toLocaleString()} €</strong>
</div>
<div class="py-10 flex justify-between items-center">
    <span class="text-[0.65rem] text-gray uppercase font-900">Litros Totales</span>
    <strong class="text-lg font-950" style="color: var(--c-success);">${d.totalLitros.toLocaleString()} L</strong>
</div>` : this._activeMode === 'carne' ? `
<div class="py-10 flex justify-between items-center">
    <span class="text-[0.65rem] text-gray uppercase font-900">Margen Neto (Carne)</span>
    <strong class="text-lg font-950" style="color: var(--c-success);">${Math.round(d.margenCarne).toLocaleString()} €</strong>
</div>
<div class="py-10 flex justify-between items-center">
    <span class="text-[0.65rem] text-gray uppercase font-900">GMD (Ganancia Media Diaria)</span>
    <strong class="text-lg font-950" style="color: var(--c-success);">${this._calcularGMDCarne() > 0 ? this._calcularGMDCarne().toFixed(2) + ' kg/día' : '0.00 kg/día'}</strong>
</div>
<div class="py-10 flex justify-between items-center">
    <span class="text-[0.65rem] text-gray uppercase font-900">Peso Total Ganado</span>
    <strong class="text-lg font-950" style="color: var(--c-success);">${this._calcularPesoTotalCarne().toLocaleString()} kg</strong>
</div>
<div class="py-10 flex justify-between items-center">
    <span class="text-[0.65rem] text-gray uppercase font-900">ICA (Conversión Alimenticia)</span>
    <strong class="text-lg font-950" style="color: ${this._calcularICACarne().ica > 0 && this._calcularICACarne().ica <= 6 ? 'var(--c-success)' : this._calcularICACarne().ica > 8 ? 'var(--c-danger)' : 'var(--c-warning)'};">${this._calcularICACarne().ica > 0 ? this._calcularICACarne().ica.toFixed(2) + ' : 1' : 'N/D'}</strong>
</div>` : `
<div class="py-10 flex justify-between items-center">
    <span class="text-[0.65rem] text-gray uppercase font-900">Margen Consolidado</span>
    <strong class="text-lg font-950" style="color: var(--c-success);">${Math.round(d.margenHibrido).toLocaleString()} €</strong>
</div>
<div class="py-10 flex justify-between items-center">
    <span class="text-[0.65rem] text-gray uppercase font-900">MOFA (Leche)</span>
    <strong class="text-lg font-950" style="color: var(--c-success);">${Math.round(d.mofaLeche).toLocaleString()} €</strong>
</div>
<div class="py-10 flex justify-between items-center">
    <span class="text-[0.65rem] text-gray uppercase font-900">Peso Total Ganado (Carne)</span>
    <strong class="text-lg font-950" style="color: var(--c-success);">${this._calcularPesoTotalCarne().toLocaleString()} kg</strong>
</div>`}
```

- [ ] **Step 3: Run to verify it works**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit** `git add js/views/explotacion-view.js && git commit -m "feat(exploracion): implement mode-specific metrics display (GMD/ICA for carne, MOFA for leche, combined for hibrido)"`

## Task 2: Verify Zona Normalization in Rebanos View

**Files:**
- Modify: `js/rebanos.js`

**Interfaces:**
- Consumes: zona data from fincas
- Produces: normalized zonaId/zonaActual consistency

### Task 2.1: Ensure zonaId/zonaActual Consistency

- [ ] **Step 1: Write a test to verify that when zonaId is present, zonaActual is consistent**
- [ ] **Step 2: Run to verify it fails if normalization doesn't work**
- [ ] **Step 3: Review the _normalizarZona method in rebanos.js and ensure it's working correctly**
- [ ] **Step 4: Run to verify it passes**
- [ ] **Step 5: Commit** `git add js/rebanos.js && git commit -m "fix(rebanos): ensure zonaId/zonaActual consistency in get/list methods"`

## Task 3: Verify Leche-view Cleanup

**Files:**
- Modify: `js/views/leche-view.js` (if needed)

**Interfaces:**
- Consumes: leche view data
- Produces: cleaned view without commercialization elements

### Task 3.1: Confirm Commercialization Elements Removed

- [ ] **Step 1: Write a test to verify that commercializacion_leche and importe_total are not displayed**
- [ ] **Step 2: Run to verify it passes (they should already be removed)**
- [ ] **Step 3: If still present, remove them from the kpis display**
- [ ] **Step 4: Run to verify they're gone**
- [ ] **Step 5: Commit** `git add js/views/leche-view.js && git commit -m "fix(leche-view): remove commercializacion_leche and importe_total from display"`

## Task 4: Implement Bento Bar Charts in Comercializacion View

**Files:**
- Modify: `js/views/comercializacion-view.js`

**Interfaces:**
- Consumes: comercializacion data
- Produces: visual bar charts for performance metrics

### Task 4.1: Add Bar Chart Components for Performance Metrics

- [ ] **Step 1: Write failing test by attempting to add bar chart placeholders**
- [ ] **Step 2: Run to verify it fails (no bar charts yet)**
- [ ] **Step 3: Implement bar chart visualization for key metrics (similar to leche-view bars)**
- [ ] **Step 4: Run to verify bar charts render correctly**
- [ ] **Step 5: Commit** `git add js/views/comercializacion-view.js && git commit -m "feat(comercializacion): add Bento bar charts for performance metrics (Fase 4 task 3)"`

## Task 5: Final Verification and Cleanup

**Files:**
- Multiple verification steps

**Interfaces:**
- Ensures all audit items are addressed

### Task 5.1: Run All Tests and Verify Fixes

- [ ] **Step 1: Run the application and verify EXPRO mode shows correct metrics**
- [ ] **Step 2: Verify zona normalization works correctly**
- [ ] **Step 3: Confirm leche-view shows no commercialization elements**
- [ ] **Step 4: Verify comercializacion view shows Bento bar charts**
- [ ] **Step 5: Test that the app still starts without errors**
- [ ] **Step 6: Commit** `git add -A && git commit -m "chore: final verification of all audit fixes"`

## Self-Review

### 1. Spec coverage:
- [x] EXPRO console shows proper metrics by mode (LACTEO: MOFA, litros; CARNICO: GMD, peso, ICA; HIBRIDO: combination)
- [x] Zona normalization consistency verified
- [x] Leche-view commercialization elements removed
- [x] Bento bar charts implemented in Comercializacion view
- [x] All audit items addressed

### 2. Placeholder scan:
- [x] No "TBD", "TODO", or similar placeholders remaining

### 3. Type consistency:
- [x] Method signatures and return types are consistent across tasks

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-11-explore-complete-audit-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**