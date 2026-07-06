/**
 * SUITE DE TESTS - Livestock Manager v1.0
 * Testing Framework: Custom Async Runner
 * 
 * Uso: Llamar window.TestRunner.runAll() en la consola del navegador
 * O incluir este archivo en index.html después de todos los módulos
 */

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, errors: [] };
        this.currentContext = null;
    }

    describe(suiteName, callback) {
        const oldContext = this.currentContext;
        this.currentContext = { suite: suiteName, tests: [] };
        callback();
        this.currentContext = oldContext;
    }

    it(testName, callback) {
        this.tests.push({
            suite: this.currentContext?.suite || 'Global',
            name: testName,
            fn: callback
        });
    }

    assert(condition, message) {
        if (!condition) throw new Error(`Assertion failed: ${message}`);
    }

    async runAll() {
        console.log(`\n${Icons.fitosanitario()} INICIANDO SUITE DE TESTS...\n`);
        const startTime = performance.now();

        for (const test of this.tests) {
            try {
                await test.fn();
                this.results.passed++;
                console.log(`${Icons.check()} [${test.suite}] ${test.name}`);
            } catch (error) {
                this.results.failed++;
                this.results.errors.push({ test: test.name, suite: test.suite, error: error.message });
                console.error(`${Icons.cerrar()} [${test.suite}] ${test.name}`);
                console.error(`   Error: ${error.message}`);
            }
        }

        const duration = (performance.now() - startTime).toFixed(2);
        this.printSummary(duration);
        return this.results;
    }

    printSummary(duration) {
        console.log('\n═══════════════════════════════════════');
        console.log(`${Icons.grafico()} RESUMEN DE TESTS`);
        console.log('═══════════════════════════════════════');
        console.log(`${Icons.check()} Pasados: ${this.results.passed}`);
        console.log(`${Icons.cerrar()} Fallidos: ${this.results.failed}`);
        console.log(`⏱️  Tiempo total: ${duration}ms`);
        console.log('═══════════════════════════════════════\n');

        if (this.results.failed > 0) {
            console.log(`${Icons.documento()} ERRORES DETALLADOS:`);
            this.results.errors.forEach((err, idx) => {
                console.log(`\n${idx + 1}. ${err.suite} > ${err.test}`);
                console.log(`   ${err.error}`);
            });
        }
    }
}

const runner = new TestRunner();

// ═════════════════════════════════════════════════════════════════
// ${Icons.check()} TESTS: MÓDULO FINCAS
// ═════════════════════════════════════════════════════════════════

runner.describe('Módulo Fincas', () => {
    runner.it('debe crear una finca correctamente', async () => {
        const fincaData = { nombre: 'Test Finca 1', ubicacion: 'Test Location' };
        const id = await Fincas.save(fincaData);
        runner.assert(typeof id === 'number', 'ID debe ser numérico');

        const saved = await Fincas.get(id);
        runner.assert(saved.nombre === 'Test Finca 1', 'Nombre debe coincidir');
        runner.assert(saved.creadoEn, 'Debe tener creadoEn');
    });

    runner.it('debe obtener todas las fincas', async () => {
        const before = await Fincas.list();
        const initialCount = before.length;

        await Fincas.save({ nombre: 'Finca Lista Test' });
        const after = await Fincas.list();
        runner.assert(after.length > initialCount, 'Debe haber más fincas después de agregar');
    });

    runner.it('debe actualizar una finca existente', async () => {
        const fincaData = { nombre: 'Finca Original' };
        const id = await Fincas.save(fincaData);

        const updated = await Fincas.save({ id, nombre: 'Finca Actualizada' });
        runner.assert(updated === id, 'ID debe ser el mismo');

        const verify = await Fincas.get(id);
        runner.assert(verify.nombre === 'Finca Actualizada', 'Nombre debe estar actualizado');
    });

    runner.it('debe establecer finca activa', async () => {
        const fincaData = { nombre: 'Finca Activa Test' };
        const id = await Fincas.save(fincaData);

        await Fincas.setActiveId(id);
        const activeId = await Fincas.getActiveId();
        runner.assert(activeId === id, 'Finca activa debe coincidir con la establecida');
    });

    runner.it('debe obtener finca activa', async () => {
        const fincaData = { nombre: 'Finca Get Active Test' };
        const id = await Fincas.save(fincaData);
        await Fincas.setActiveId(id);

        const active = await Fincas.getActive();
        runner.assert(active.id === id, 'Finca activa debe tener el ID correcto');
        runner.assert(active.nombre === 'Finca Get Active Test', 'Nombre debe coincidir');
    });
});

// ═════════════════════════════════════════════════════════════════
// ${Icons.check()} TESTS: MÓDULO REBAÑOS
// ═════════════════════════════════════════════════════════════════

runner.describe('Módulo Rebaños', () => {
    runner.it('debe crear un rebaño correctamente', async () => {
        const fincaData = { nombre: 'Finca Rebanos Test' };
        const fincaId = await Fincas.save(fincaData);
        await Fincas.setActiveId(fincaId);

        const rebanoData = { nombre: 'Rebano Carne', tipo: 'carne', capacidad_total: 100 };
        const id = await Rebanos.save(rebanoData);
        runner.assert(typeof id === 'number', 'ID debe ser numérico');

        const saved = await Rebanos.get(id);
        runner.assert(saved.nombre === 'Rebano Carne', 'Nombre debe coincidir');
        runner.assert(saved.fincaId === fincaId, 'FincaId debe coincidir');
        runner.assert(saved.capacidad_total === 100, 'Capacidad debe ser 100');
    });

    runner.it('debe obtener rebaños de la finca activa', async () => {
        const fincaData = { nombre: 'Finca Rebanos Listar' };
        const fincaId = await Fincas.save(fincaData);
        await Fincas.setActiveId(fincaId);

        const rebano1 = await Rebanos.save({ nombre: 'Rebano 1', tipo: 'carne', capacidad_total: 50 });
        const rebano2 = await Rebanos.save({ nombre: 'Rebano 2', tipo: 'leche', capacidad_total: 30 });

        const rebanos = await Rebanos.list();
        runner.assert(rebanos.length >= 2, 'Debe haber al menos 2 rebaños');
        const ids = rebanos.map(r => r.id);
        runner.assert(ids.includes(rebano1), 'Debe incluir rebano1');
        runner.assert(ids.includes(rebano2), 'Debe incluir rebano2');
    });

    runner.it('debe validar fincaId requerido', async () => {
        await Fincas.setActiveId(null);
        try {
            await Rebanos.save({ nombre: 'Rebano Sin Finca' });
            throw new Error('Debería haber lanzado un error');
        } catch (e) {
            runner.assert(e.message.includes('finca activa'), 'Error debe mencionar finca activa');
        }
    });
});

// ═════════════════════════════════════════════════════════════════
// ${Icons.check()} TESTS: MÓDULO ANIMALES
// ═════════════════════════════════════════════════════════════════

runner.describe('Módulo Animales', () => {
    runner.it('debe crear un animal con validaciones', async () => {
        const fincaData = { nombre: 'Finca Animales' };
        const fincaId = await Fincas.save(fincaData);
        await Fincas.setActiveId(fincaId);

        const rebanoId = await Rebanos.save({ nombre: 'Rebano', tipo: 'carne', capacidad_total: 50 });

        const animalData = {
            rebanoId: rebanoId,
            numero_identificacion: 'ABC1234567',
            raza: 'Angus',
            edad: 24
        };
        const id = await Animales.save(animalData);
        runner.assert(typeof id === 'number', 'ID debe ser numérico');

        const saved = await Animales.get(id);
        runner.assert(saved.numero_identificacion === 'ABC1234567', 'Caravana debe coincidir');
        runner.assert(saved.rebanoId === rebanoId, 'RebanoId debe coincidir');
    });

    runner.it('debe rechazar caravana con formato inválido', async () => {
        const fincaData = { nombre: 'Finca Animales Validar' };
        const fincaId = await Fincas.save(fincaData);
        await Fincas.setActiveId(fincaId);

        const rebanoId = await Rebanos.save({ nombre: 'Rebano', tipo: 'carne', capacidad_total: 50 });

        const invalidCaravanas = ['ABC', 'abc1234567', 'ABC12345'];

        for (const caravana of invalidCaravanas) {
            try {
                await Animales.save({
                    rebanoId: rebanoId,
                    numero_identificacion: caravana,
                    raza: 'Test'
                });
                throw new Error(`Debería rechazar caravana: ${caravana}`);
            } catch (e) {
                runner.assert(e.message.includes('Validación fallida'), 'Debe ser error de validación');
            }
        }
    });

    runner.it('debe rechazar animal sin rebanoId', async () => {
        try {
            await Animales.save({
                numero_identificacion: 'VALID1234567',
                raza: 'Test'
            });
            throw new Error('Debería haber lanzado un error');
        } catch (e) {
            runner.assert(e.message.includes('rebanoId'), 'Error debe mencionar rebanoId');
        }
    });
});

// ═════════════════════════════════════════════════════════════════
// ${Icons.check()} TESTS: MÓDULO PRODUCCIÓN
// ═════════════════════════════════════════════════════════════════

runner.describe('Módulo Producción', () => {
    runner.it('debe registrar producción de carne', async () => {
        const fincaData = { nombre: 'Finca Produccion Carne' };
        const fincaId = await Fincas.save(fincaData);
        await Fincas.setActiveId(fincaId);

        const rebanoId = await Rebanos.save({ nombre: 'Rebano', tipo: 'carne', capacidad_total: 50 });
        const animalId = await Animales.save({
            rebanoId: rebanoId,
            numero_identificacion: 'PRODCARNE001',
            raza: 'Angus'
        });

        const prodId = await Produccion.saveCarne({
            animalId: animalId,
            fecha: '2026-06-01',
            peso: 250
        });
        runner.assert(typeof prodId === 'number', 'ID debe ser numérico');

        const prods = await Produccion.listCarne(animalId);
        runner.assert(prods.length > 0, 'Debe haber producción registrada');
        runner.assert(prods[0].peso === 250, 'Peso debe coincidir');
    });

    runner.it('debe cifrar/descifrar producción de leche', async () => {
        const fincaData = { nombre: 'Finca Produccion Leche' };
        const fincaId = await Fincas.save(fincaData);
        await Fincas.setActiveId(fincaId);

        const rebanoId = await Rebanos.save({ nombre: 'Rebano', tipo: 'leche', capacidad_total: 30 });
        const vacaId = await Animales.save({
            rebanoId: rebanoId,
            numero_identificacion: 'PRODUCLECHE01',
            raza: 'Jersey'
        });

        const prodId = await Produccion.saveLeche({
            vacaId: vacaId,
            fecha: '2026-06-01',
            cantidad_litros: 20,
            analisis_grasa_proteina: { grasa: 3.5, proteina: 3.2 }
        }, fincaId);

        runner.assert(typeof prodId === 'number', 'ID debe ser numérico');

        const prods = await Produccion.listLeche(fincaId);
        runner.assert(prods.length > 0, 'Debe haber producción desencriptada');
        runner.assert(prods[0].cantidad_litros === 20, 'Litros deben coincidir');
    });
});

// ═════════════════════════════════════════════════════════════════
// ${Icons.check()} TESTS: MÓDULO CRYPTO
// ═════════════════════════════════════════════════════════════════

runner.describe('Módulo Crypto', () => {
    runner.it('debe encriptar y desencriptar datos', async () => {
        const testData = { message: 'Test Data', timestamp: '2026-06-01' };
        const fincaId = 1;

        const { encrypted, iv } = await window.CryptoUtils.encryptData(testData, fincaId);
        runner.assert(encrypted, 'Datos encriptados no deben estar vacíos');
        runner.assert(iv, 'IV no debe estar vacío');

        const decrypted = await window.CryptoUtils.decryptData(encrypted, iv, fincaId);
        runner.assert(decrypted.message === 'Test Data', 'Mensaje debe coincidir después de desencriptar');
        runner.assert(decrypted.timestamp === '2026-06-01', 'Timestamp debe coincidir');
    });

    runner.it('debe rechazar descifrado con fincaId incorrecto', async () => {
        const testData = { secret: 'TestSecret' };
        const fincaId1 = 1;
        const fincaId2 = 2;

        const { encrypted, iv } = await window.CryptoUtils.encryptData(testData, fincaId1);

        try {
            await window.CryptoUtils.decryptData(encrypted, iv, fincaId2);
            throw new Error('Debería haber fallado con fincaId incorrecto');
        } catch (e) {
            runner.assert(
                e.message.includes('descifrado') || e.message.includes('Fallo'),
                'Error debe mencionar fallo de descifrado'
            );
        }
    });

    runner.it('debe generar diferentes IVs para cada cifrado', async () => {
        const testData = { value: 'Same Data' };
        const fincaId = 1;

        const result1 = await window.CryptoUtils.encryptData(testData, fincaId);
        const result2 = await window.CryptoUtils.encryptData(testData, fincaId);

        runner.assert(result1.iv !== result2.iv, 'IVs deben ser diferentes');
        runner.assert(result1.encrypted !== result2.encrypted, 'Datos encriptados deben ser diferentes');
    });
});

if (typeof window !== 'undefined') {
    window.TestRunner = runner;
}
