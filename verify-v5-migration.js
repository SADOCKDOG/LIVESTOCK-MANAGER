/**
 * VERIFICATION SCRIPT: Check if v5.0 migration was successful
 *
 * This script verifies that:
 * 1. All zonas have unique numeric IDs
 * 2. All rebaños have zonaId (numeric) references, not zonaActual (string names)
 * 3. Referential integrity is maintained
 *
 * Run this after migration to confirm success.
 */

(async function verifyV5Migration() {
    console.log('🔍 Verifying v5.0 migration...');

    try {
        const zonasCheck = await checkZonaIds();
        const rebañosCheck = await checkRebanoZonaReferences();
        const integrityCheck = await checkReferentialIntegrity();

        if (zonasCheck.pass && rebañosCheck.pass && integrityCheck.pass) {
            console.log('✅ All verification checks passed! Migration successful.');
            alert('Verificación completada: Migración a v5.0 exitosa.');
            return true;
        } else {
            console.error('❌ Some verification checks failed:');
            if (!zonasCheck.pass) console.error('  - Zona IDs: ' + zonasCheck.message);
            if (!rebañosCheck.pass) console.error('  - Rebaño zona references: ' + rebañosCheck.message);
            if (!integrityCheck.pass) console.error('  - Referential integrity: ' + integrityCheck.message);
            alert('Verificación fallida. Consulta la consola para detalles.');
            return false;
        }
    } catch (error) {
        console.error('❌ Error during verification:', error);
        alert('Error durante la verificación: ' + error.message);
        return false;
    }
})();

/**
 * Check that all zonas have unique numeric IDs
 */
async function checkZonaIds() {
    try {
        const fincas = await window.db.getAll('fincas');
        let issues = [];
        let totalZonas = 0;

        for (const finca of fincas) {
            if (!finca.zonas || !Array.isArray(finca.zonas)) continue;

            const ids = new Set();
            for (const zona of finca.zonas) {
                totalZonas++;
                if (!zona.id || typeof zona.id !== 'number' || zona.id <= 0 || !Number.isInteger(zona.id)) {
                    issues.push(`Finca "${finca.nombre || finca.id}" tiene zona "${zona.nombre || 'sin nombre'}" con ID inválido: ${zona.id}`);
                } else if (ids.has(zona.id)) {
                    issues.push(`Finca "${finca.nombre || finca.id}" tiene ID de zona duplicado: ${zona.id}`);
                } else {
                    ids.add(zona.id);
                }
            }
        }

        if (issues.length === 0) {
            return { pass: true, message: `All ${totalZonas} zonas have valid unique numeric IDs` };
        } else {
            return { pass: false, message: issues.join('; ') };
        }
    } catch (error) {
        return { pass: false, message: `Error checking zonas: ${error.message}` };
    }
}

/**
 * Check that all rebaños have zonaId (numeric) references
 */
async function checkRebanoZonaReferences() {
    try {
        const rebaños = await window.db.getAll('rebanos');
        let issues = [];
        let totalRebaños = 0;
        let zonaActualCount = 0;

        for (const rebano of rebaños) {
            totalRebaños++;

            // Check for remaining zonaActual usage (should be migrated or null)
            if (rebano.zonaActual && typeof rebano.zonaActual === 'string' && rebano.zonaActual.trim() !== '') {
                zonaActualCount++;
                issues.push(`Rebana "${rebano.nombre || rebano.id}" todavía usa zonaActual (string): "${rebano.zonaActual}"`);
            }

            // Check zonaId validity (can be null for review-needed cases, but if set should be valid)
            if (rebano.zonaId !== null && rebano.zonaId !== undefined) {
                if (typeof rebano.zonaId !== 'number' || !Number.isInteger(rebano.zonaId) || rebano.zonaId <= 0) {
                    issues.push(`Rebana "${rebano.nombre || rebano.id}" tiene zonaId inválido: ${rebano.zonaId}`);
                }
            }
        }

        if (zonaActualCount > 0) {
            return { pass: false, message: `Found ${zonaActualCount} rebaños still using zonaActual (string) references` };
        }

        if (issues.length === 0) {
            return { pass: true, message: `All ${totalRebaños} rebaños have valid zonaId references (null values flagged for review)` };
        } else {
            return { pass: false, message: issues.join('; ') };
        }
    } catch (error) {
        return { pass: false, message: `Error checking rebaños: ${error.message}` };
    }
}

/**
 * Check referential integrity between rebaños and zonas
 */
async function checkReferentialIntegrity() {
    try {
        const fincas = await window.db.getAll('fincas');
        const rebaños = await window.db.getAll('rebanos');

        // Build map of valid zona IDs by finca
        const zonasValidasPorFinca = new Map();
        for (const finca of fincas) {
            if (!finca.zonas || !Array.isArray(finca.zonas)) continue;

            const idsValidos = new Set();
            for (const zona of finca.zonas) {
                if (zona.id && typeof zona.id === 'number' && zona.id > 0) {
                    idsValidos.add(zona.id);
                }
            }
            if (finca.id !== undefined) {
                zonasValidasPorFinca.set(finca.id, idsValidos);
            }
        }

        let issues = [];
        let totalChecked = 0;

        for (const rebano of rebaños) {
            if (!rebano || !rebano.fincaId) continue;

            // Skip null zonaIds (these are expected to need manual review)
            if (rebano.zonaId === null) continue;

            totalChecked++;

            const zonaId = rebano.zonaId;
            const zonasValidas = zonasValidasPorFinca.get(rebano.fincaId);

            if (!zonasValidas || !zonasValidas.has(zonaId)) {
                issues.push(`Rebana "${rebano.nombre || rebano.id}" (finca ${rebano.fincaId}) tiene zonaId inválido: ${zonaId}`);
            }
        }

        if (issues.length === 0) {
            return { pass: true, message: `Referential integrity validated for ${totalChecked} rebaños with zonaId references` };
        } else {
            return { pass: false, message: issues.join('; ') };
        }
    } catch (error) {
        return { pass: false, message: `Error checking referential integrity: ${error.message}` };
    }
}