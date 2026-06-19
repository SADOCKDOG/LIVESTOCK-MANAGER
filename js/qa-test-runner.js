/**
 * QA Test Runner — Livestock Manager
 * Ejecuta NIVEL 1-3 del Plan QA: Smoke Test + Integridad + CRUD
 *
 * Uso: window.QATestRunner.runLevel(1) o window.QATestRunner.runAll()
 */

window.QATestRunner = {
  results: [],
  errors: [],
  startTime: null,
  endTime: null,

  // ==================== UTILIDADES ====================
  log(msg, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '✓',
      error: '✗',
      warn: '⚠',
      pass: '✅',
      fail: '❌'
    }[type] || '○';

    const color = {
      info: '#888',
      error: '#ef4444',
      warn: '#f59e0b',
      pass: '#10b981',
      fail: '#ef4444'
    }[type] || '#999';

    const logLine = `[${timestamp}] ${prefix} ${msg}`;
    console.log(`%c${logLine}`, `color: ${color}; font-weight: bold;`);
    this.results.push({ timestamp, msg, type });
  },

  async assertEquals(actual, expected, label) {
    if (actual === expected) {
      this.log(`${label}: ${actual} === ${expected}`, 'pass');
      return true;
    } else {
      this.log(`${label}: Expected ${expected} but got ${actual}`, 'fail');
      this.errors.push({ label, expected, actual });
      return false;
    }
  },

  async assertCount(array, expected, label) {
    return this.assertEquals(array.length, expected, `${label} count`);
  },

  async sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  },

  // ==================== NIVEL 1: SMOKE TEST ====================
  async runLevel1() {
    this.log('=== NIVEL 1: SMOKE TEST (Carga de Seed) ===', 'info');

    try {
      // Verificar que los módulos existan
      if (!window.Fincas || !window.Rebanos || !window.Animales) {
        this.log('ERROR: Módulos no cargados. Recarga la página.', 'error');
        return false;
      }

      const fincaId = await Fincas.getActiveId();
      if (!fincaId) {
        this.log('ERROR: No hay finca activa. Carga la demo primero.', 'error');
        this.log('Pasos: Ajustes → Cargar Demo CHAMORRO → Espera → Recarga (F5)', 'warn');
        return false;
      }

      this.log(`Finca activa: ${fincaId}`, 'info');

      // Verificar conteos básicos
      const [fincas, rebanos, animales, compradores, proveedores, transportistas, contratos, sanitarios, eventos] = await Promise.all([
        Fincas.list(),
        Rebanos.list(),
        Animales.list(),
        Compradores.list(),
        Proveedores.list(),
        Transportistas.list(),
        Contratos.list(),
        Sanitarios.list(),
        Reproduccion.listEventos()
      ]);

      let allPass = true;
      allPass &= await this.assertCount(fincas, 1, 'Fincas');
      allPass &= await this.assertCount(rebanos, 3, 'Rebaños');
      allPass &= await this.assertCount(animales, 9, 'Animales');
      allPass &= await this.assertCount(compradores, 3, 'Compradores');
      allPass &= await this.assertCount(proveedores, 3, 'Proveedores');
      allPass &= await this.assertCount(transportistas, 2, 'Transportistas');
      allPass &= await this.assertCount(contratos, 2, 'Contratos');
      allPass &= await this.assertCount(sanitarios, 3, 'Sanitarios');
      allPass &= await this.assertCount(eventos, 4, 'Eventos Reproducción');

      if (allPass) {
        this.log('NIVEL 1: ✅ PASS', 'pass');
      } else {
        this.log('NIVEL 1: ❌ FAIL', 'fail');
      }
      return allPass;
    } catch (e) {
      this.log(`NIVEL 1 ERROR: ${e.message}`, 'error');
      return false;
    }
  },

  // ==================== NIVEL 2: INTEGRIDAD ====================
  async runLevel2() {
    this.log('\n=== NIVEL 2: INTEGRIDAD DE DATOS ===', 'info');

    try {
      let allPass = true;

      // === 2.1 Compradores ===
      this.log('Verificando Compradores...', 'info');
      const compradores = await Compradores.list();

      const compCarne = compradores.find(c => c.nombre === 'Cárnicas Extremeñas SL');
      if (compCarne && compCarne.tipo_comprador === 'cárnico') {
        this.log('Comprador cárnico: OK', 'pass');
      } else {
        this.log('Comprador cárnico: FAIL', 'fail');
        allPass = false;
      }

      const compLeche = compradores.find(c => c.nombre === 'Lácteos La Serena SA');
      if (compLeche && compLeche.tipo_comprador === 'láctico') {
        this.log('Comprador láctico: OK', 'pass');
      } else {
        this.log('Comprador láctico: FAIL', 'fail');
        allPass = false;
      }

      // === 2.2 Proveedores ===
      this.log('Verificando Proveedores...', 'info');
      const proveedores = await Proveedores.list();

      const provPienso = proveedores.find(p => p.nombre === 'Piensos El Trébol SA');
      if (provPienso && Array.isArray(provPienso.categorias) && provPienso.categorias.includes('Alimentacion')) {
        this.log('Proveedor Piensos (Alimentacion): OK', 'pass');
      } else {
        this.log('Proveedor Piensos: FAIL', 'fail');
        allPass = false;
      }

      // === 2.3 Transportistas ===
      this.log('Verificando Transportistas...', 'info');
      const transportistas = await Transportistas.list();

      const transGanadero = transportistas.find(t => t.nombre === 'Transportes Ganaderos del Sur SL');
      if (transGanadero && transGanadero.tipo_vehiculo === 'camion' && transGanadero.certificado_bienestar === true) {
        this.log('Transportista Ganadero (camion, bienestar): OK', 'pass');
      } else {
        this.log('Transportista Ganadero: FAIL', 'fail');
        allPass = false;
      }

      // === 2.4 Animales ===
      this.log('Verificando Animales...', 'info');
      const animales = await Animales.list();

      const crotalesValidos = animales.every(a => /^[A-Z]{2}\d{12}$/.test(a.numero_identificacion));
      if (crotalesValidos) {
        this.log(`Todos los crotales válidos (${animales.length}/9): OK`, 'pass');
      } else {
        const inválidos = animales.filter(a => !/^[A-Z]{2}\d{12}$/.test(a.numero_identificacion));
        this.log(`Crotales inválidos: ${inválidos.map(a => a.numero_identificacion).join(', ')}`, 'fail');
        allPass = false;
      }

      // === 2.5 Vinculación Madre-Cría ===
      const vaca1 = animales.find(a => a.numero_identificacion === 'ES123456789012');
      const ternero1 = animales.find(a => a.numero_identificacion === 'ES123456789015');
      if (vaca1 && ternero1 && ternero1.madre_id === vaca1.id) {
        this.log('Vinculación madre-cría (vaca1 → ternero1): OK', 'pass');
      } else {
        this.log('Vinculación madre-cría: FAIL', 'fail');
        allPass = false;
      }

      // === 2.6 Sanitarios ===
      this.log('Verificando Sanitarios...', 'info');
      const sanitarios = await Sanitarios.list();
      const tiposValidos = sanitarios.every(s =>
        ['Vacunación', 'Desparasitación', 'Antibiótico', 'Anti-inflamatorio', 'Vitaminas', 'Cirugía', 'Inspección General', 'Otro']
          .includes(s.tipo_tratamiento)
      );
      if (tiposValidos) {
        this.log(`Tipos de tratamiento válidos (${sanitarios.length}/3): OK`, 'pass');
      } else {
        this.log('Tipos de tratamiento inválidos', 'fail');
        allPass = false;
      }

      // === 2.7 Reproducción ===
      this.log('Verificando Reproducción...', 'info');
      const eventos = await Reproduccion.listEventos();
      const tiposEvValidos = eventos.every(e =>
        ['Celo', 'Inseminación Artificial', 'Monta Natural', 'Diagnóstico Gestación', 'Secado', 'Parto', 'Aborto', 'Destete']
          .includes(e.tipo_evento)
      );
      if (tiposEvValidos && eventos.length === 4) {
        this.log(`Tipos de evento válidos (${eventos.length}/4): OK`, 'pass');
      } else {
        this.log('Tipos de evento o cantidad inválida', 'fail');
        allPass = false;
      }

      if (allPass) {
        this.log('NIVEL 2: ✅ PASS', 'pass');
      } else {
        this.log('NIVEL 2: ❌ FAIL', 'fail');
      }
      return allPass;
    } catch (e) {
      this.log(`NIVEL 2 ERROR: ${e.message}`, 'error');
      return false;
    }
  },

  // ==================== NIVEL 3: CRUD ====================
  async runLevel3() {
    this.log('\n=== NIVEL 3: OPERACIONES CRUD ===', 'info');

    try {
      let allPass = true;

      // === 3.1 Crear Comprador ===
      this.log('Test 3.1: Crear Comprador...', 'info');
      try {
        const nuevoComprador = {
          nombre: 'Test Comprador QA',
          nif_cif: 'B88888888',
          tipo_comprador: 'cárnico',
          ciudad: 'Test City',
          activo: true
        };
        const compId = await Compradores.save(nuevoComprador);
        if (compId > 0) {
          this.log(`Comprador creado con ID ${compId}: OK`, 'pass');
          // Cleanup
          await Compradores.delete(compId);
        } else {
          this.log('Comprador no retornó ID válido', 'fail');
          allPass = false;
        }
      } catch (e) {
        this.log(`Crear Comprador: ${e.message}`, 'fail');
        allPass = false;
      }

      // === 3.2 Crear Gasto ===
      this.log('Test 3.2: Crear Gasto...', 'info');
      try {
        const fincaId = await Fincas.getActiveId();
        const rebanos = await Rebanos.list();
        const rebVacas = rebanos.find(r => r.nombre === 'Vacas Frisonas');

        const nuevoGasto = {
          concepto: 'Test QA Gasto',
          monto: 100,
          categoria: 'Alimentacion',
          fecha: new Date().toISOString().split('T')[0],
          fincaId: fincaId,
          rebanoId: rebVacas.id
        };
        const gastoId = await Gastos.save(nuevoGasto);
        if (gastoId > 0) {
          this.log(`Gasto creado con ID ${gastoId}: OK`, 'pass');
          // Cleanup
          await Gastos.delete(gastoId);
        } else {
          this.log('Gasto no retornó ID válido', 'fail');
          allPass = false;
        }
      } catch (e) {
        this.log(`Crear Gasto: ${e.message}`, 'fail');
        allPass = false;
      }

      // === 3.3 Editar Proveedor ===
      this.log('Test 3.3: Editar Proveedor...', 'info');
      try {
        const proveedores = await Proveedores.list();
        const prov = proveedores[0];
        if (prov) {
          const nombreOrig = prov.nombre;
          prov.nombre = 'Test Updated Proveedor';
          await Proveedores.save(prov);

          const provActualizado = await Proveedores.get(prov.id);
          if (provActualizado.nombre === 'Test Updated Proveedor') {
            this.log(`Proveedor actualizado: OK`, 'pass');
            // Revertir
            prov.nombre = nombreOrig;
            await Proveedores.save(prov);
          } else {
            this.log('Proveedor no se actualizó', 'fail');
            allPass = false;
          }
        }
      } catch (e) {
        this.log(`Editar Proveedor: ${e.message}`, 'fail');
        allPass = false;
      }

      if (allPass) {
        this.log('NIVEL 3: ✅ PASS', 'pass');
      } else {
        this.log('NIVEL 3: ❌ FAIL', 'fail');
      }
      return allPass;
    } catch (e) {
      this.log(`NIVEL 3 ERROR: ${e.message}`, 'error');
      return false;
    }
  },

  // ==================== MAIN ====================
  async runAll() {
    this.startTime = new Date();
    this.results = [];
    this.errors = [];

    console.clear();
    this.log('╔════════════════════════════════════════╗', 'info');
    this.log('║  LIVESTOCK MANAGER — QA TEST RUNNER   ║', 'info');
    this.log('║  Niveles 1-3: Smoke + Integridad + CRUD║', 'info');
    this.log('╚════════════════════════════════════════╝', 'info');

    const l1 = await this.runLevel1();
    await this.sleep(500);
    const l2 = await this.runLevel2();
    await this.sleep(500);
    const l3 = await this.runLevel3();

    this.endTime = new Date();
    const duration = ((this.endTime - this.startTime) / 1000).toFixed(2);

    console.log('\n');
    this.log('╔════════════════════════════════════════╗', 'info');
    this.log(`║  RESUMEN — ${duration}s${' '.repeat(22 - duration.toString().length)}║`, 'info');
    this.log(`║  Nivel 1 (Smoke):    ${l1 ? '✅ PASS' : '❌ FAIL'}${' '.repeat(22)}║`, l1 ? 'pass' : 'fail');
    this.log(`║  Nivel 2 (Integridad): ${l2 ? '✅ PASS' : '❌ FAIL'}${' '.repeat(20)}║`, l2 ? 'pass' : 'fail');
    this.log(`║  Nivel 3 (CRUD):     ${l3 ? '✅ PASS' : '❌ FAIL'}${' '.repeat(21)}║`, l3 ? 'pass' : 'fail');
    this.log('╚════════════════════════════════════════╝', 'info');

    if (this.errors.length > 0) {
      console.log('\n⚠️  ERRORES ENCONTRADOS:');
      this.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.label}: esperado ${err.expected}, obtuvo ${err.actual}`);
      });
    }

    return { l1, l2, l3, duration, errors: this.errors.length };
  },

  async runLevel(n) {
    this.startTime = new Date();
    this.results = [];
    this.errors = [];

    const levelMap = {
      1: this.runLevel1.bind(this),
      2: this.runLevel2.bind(this),
      3: this.runLevel3.bind(this)
    };

    if (!levelMap[n]) {
      console.log(`❌ Nivel ${n} no existe (1-3)`);
      return false;
    }

    console.clear();
    this.log(`Ejecutando NIVEL ${n}...`, 'info');
    const result = await levelMap[n]();
    this.endTime = new Date();

    return result;
  }
};

// Auto-exportar para uso global
console.log('✅ QA Test Runner cargado. Usa: window.QATestRunner.runAll() o .runLevel(1)');
