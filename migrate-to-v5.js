/**
 * MIGRATION SCRIPT: Convert existing data to v5.0 structure
 *
 * This script transforms the existing data to use:
 * 1. Unique IDs for zonas within fincas (instead of relying on names)
 * 2. zonaId (numeric) references in rebanos instead of zonaActual (string names)
 *
 * Run this once to migrate existing data to the v5.0 structure.
 *
 * USAGE:
 *   1. Backup your IndexedDB data first
 *   2. Run this script in the browser console or as part of your build process
 *   3. Verify the migration worked correctly
 *   4. Update your app to use the new structure (already done in UI components)
 */

(async function migrateToV5Structure() {
    console.log('🔧 Starting migration to v5.0 structure...');

    try {
        // Step 1: Add unique IDs to all zonas in all fincas
        await migrateZonaIdsInFincas();

        // Step 2: Convert rebanos zonaActual references from names to zona IDs
        await migrateRebanoZonaReferences();

        // Step 3: Validate referential integrity
        await validateReferentialIntegrity();

        console.log('✅ Migration to v5.0 structure completed successfully!');
        alert('Migración completada exitosamente. Por favor, recarga la aplicación.');
    } catch (error) {
        console.error('❌ Error during migration:', error);
        alert('Error durante la migración: ' + error.message);
        throw error;
    }
})();

/**
 * Step 1: Add unique IDs to all zonas in all fincas
 */
async function migrateZonaIdsInFincas() {
    console.log('📦 Processing zonas in fincas...');

    const fincas = await window.db.getAll('fincas');
    let totalZonasProcesadas = 0;
    let totalZonasConIdAsignado = 0;

    for (const finca of fincas) {
        if (!finca.zonas || !Array.isArray(finca.zonas)) continue;

        let zonaModificada = false;

        // Find the maximum existing ID to avoid collisions
        const maxExistingId = finca.zonas.reduce((max, zona) => {
            return zona.id && typeof zona.id === 'number'
                ? Math.max(max, zona.id)
                : max;
        }, 0);

        let nextId = Math.max(maxExistingId + 1, 1); // Start at 1

        // Process each zona
        const zonasActualizadas = finca.zonas.map(zona => {
            totalZonasProcesadas++;

            // If zona already has a valid numeric ID, keep it
            if (zona.id && typeof zona.id === 'number' && zona.id > 0) {
                return zona;
            }

            // Otherwise assign a new sequential ID
            zonaModificada = true;
            totalZonasConIdAsignado++;

            return {
                ...zona,
                id: nextId++
            };
        });

        // If zonas were modified, save the updated finca
        if (zonaModificada) {
            const fincaActualizada = {
                ...finca,
                zonas: zonasActualizadas,
                actualizadoEn: new Date().toISOString()
            };

            await window.db.put('fincas', fincaActualizada);
        }
    }

    console.log(`   Processed ${totalZonasProcesadas} zonas`);
    console.log(`   Assigned ${totalZonasConIdAsignado} new IDs`);
    console.log('✅ Zona ID assignment completed');
}

/**
 * Step 2: Convert zona references in rebanos from names (string) to IDs (number)
 */
async function migrateRebanoZonaReferences() {
    console.log('🔗 Processing zona references in rebanos...');

    // First, get all fincas to build a lookup map of zona names to IDs by finca
    const fincas = await window.db.getAll('fincas');
    const fincaZonaLookup = new Map(); // Key: fincaId -> Map<zonaNombre, zonaId>

    // Build lookup map: for each finca, map zona names to their IDs
    for (const finca of fincas) {
        if (!finca.zonas || !Array.isArray(finca.zonas)) continue;

        const zonaMap = new Map();
        for (const zona of finca.zonas) {
            if (zona.nombre && zona.id) {
                zonaMap.set(zona.nombre, zona.id);
            }
        }
        if (zonaMap.size > 0) {
            fincaZonaLookup.set(finca.id, zonaMap);
        }
    }

    const rebaños = await window.db.getAll('rebanos');
    let totalRebañosProcesados = 0;
    let totalReferenciasActualizadas = 0;
    let totalNoEncontradas = 0;

    for (const rebano of rebaños) {
        totalRebañosProcesados++;

        // Skip if not a valid rebano or no fincaId
        if (!rebano || !rebano.fincaId) continue;

        // Check if zonaActual exists and is a non-empty string (old format)
        const zonaActual = rebano.zonaActual;
        if (typeof zonaActual === 'string' && zonaActual.trim() !== '') {

            // Look up the zona ID by name in the corresponding finca
            const zonaMap = fincaZonaLookup.get(rebano.fincaId);
            let zonaId = null;

            if (zonaMap && zonaMap.has(zonaActual.trim())) {
                zonaId = zonaMap.get(zonaActual.trim());
            }

            if (zonaId !== null) {
                // Update the rebano: replace zonaActual (string) with zonaId (number)
                const rebanoActualizado = {
                    ...rebano,
                    zonaId: zonaId,         // New numeric ID field
                    zonaActual: undefined   // Remove the old string field
                };

                await window.db.put('rebanos', rebanoActualizado);
                totalReferenciasActualizadas++;
            } else {
                // Zona name not found - this indicates data inconsistency
                console.warn(
                    `⚠️ Zona "${zonaActual}" not found for rebana "${rebano.nombre || rebano.id}" in finca ${rebano.fincaId}`
                );
                totalNoEncontradas++;

                // Set zonaId to null to flag for manual review
                const rebanoActualizado = {
                    ...rebano,
                    zonaId: null,           // Flag for review
                    zonaActual: undefined
                };

                await window.db.put('rebanos', rebanoActualizado);
            }
        }
        // If zonaActual is not a string or is empty, leave as-is (might already be converted)

        // Ensure zonaId field exists (for cases where neither zonaActual nor zonaId was present)
        if (!('zonaId' in rebano)) {
            const rebanoActualizado = {
                ...rebano,
                zonaId: null // Default to null for records needing attention
            };
            await window.db.put('rebanos', rebanoActualizado);
        }
    }

    console.log(`   Processed ${totalRebañosProcesados} rebaños`);
    console.log(`   Updated ${totalReferenciasActualizadas} zona references`);
    if (totalNoEncontradas > 0) {
        console.log(`   ⚠️  ${totalNoEncontradas} references could not be resolved (require manual review)`);
    }
    console.log('✅ Zona reference conversion completed');
}

/**
 * Step 3: Validate referential integrity after migration
 */
async function validateReferentialIntegrity() {
    console.log('🔍 Validating referential integrity...');

    const fincas = await window.db.getAll('fincas');
    const rebaños = await window.db.getAll('rebanos');

    let errores = 0;
    let advertencias = 0;

    // Build a map of valid zona IDs by finca for quick lookup
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

    // Validate each rebano
    for (const rebano of rebaños) {
        if (!rebano || !rebano.fincaId) continue;

        const zonaId = rebano.zonaId;

        // Skip explicit null values (these are flagged for manual review)
        if (zonaId === null) {
            advertencias++;
            continue;
        }

        // Verify that the zonaId exists in the corresponding finca
        const zonasValidas = zonasValidasPorFinca.get(rebano.fincaId);
        if (!zonasValidas || !zonasValidas.has(zonaId)) {
            console.error(`   ❌ Rebaño ${rebano.id} references invalid zonaId ${zonaId} in finca ${rebano.fincaId}`);
            errores++;
        }
    }

    if (errores === 0) {
        console.log('✅ Referential integrity validated - no errors found');
    } else {
        console.error(`❌ Found ${errores} referential integrity errors`);
        throw new Error(`Referential integrity validation failed: ${errores} errors found`);
    }

    if (advertencias > 0) {
        console.log(`⚠️  ${advertencias} warnings (records requiring manual review)`);
    }
}