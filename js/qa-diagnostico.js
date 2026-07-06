/**
 * QA Diagnóstico rápido — Verificar qué falta antes de ejecutar tests
 * Uso: window.QADiagnostico.run()
 */

window.QADiagnostico = {
  async run() {
    console.clear();
    console.log('%c╔════════════════════════════════════════╗', 'color: #10b981; font-weight: bold;');
    console.log('%c║  QA DIAGNÓSTICO RÁPIDO                ║', 'color: #10b981; font-weight: bold;');
    console.log('%c╚════════════════════════════════════════╝', 'color: #10b981; font-weight: bold;');

    let allGood = true;

    // 1. Verificar módulos
    console.log(`\n${Icons.check()} Verificando módulos cargados...`);
    const modules = [
      'Fincas', 'Rebanos', 'Animales', 'Compradores', 'Proveedores',
      'Transportistas', 'Contratos', 'Sanitarios', 'Reproduccion', 'Gastos'
    ];

    modules.forEach(mod => {
      if (window[mod]) {
        console.log(`  ${Icons.check()} ${mod} cargado`);
      } else {
        console.log(`  ${Icons.cerrar()} ${mod} NO cargado`);
        allGood = false;
      }
    });

    // 2. Verificar IndexedDB
    console.log(`\n${Icons.check()} Verificando IndexedDB...`);
    try {
      const dbs = await indexedDB.databases();
      const livestockDB = dbs.find(db => db.name === 'Livestock-Manager');
      if (livestockDB) {
        console.log(`  ${Icons.check()} IndexedDB "Livestock-Manager" existe`);
      } else {
        console.log(`  ${Icons.cerrar()} IndexedDB "Livestock-Manager" NO existe`);
        allGood = false;
      }
    } catch (e) {
      console.log(`  ${Icons.cerrar()} Error al acceder IndexedDB: ${e.message}`);
      allGood = false;
    }

    // 3. Verificar finca activa
    console.log(`\n${Icons.check()} Verificando finca activa...`);
    try {
      const fincaId = await Fincas.getActiveId();
      if (fincaId) {
        const finca = await Fincas.getActive();
        console.log(`  ${Icons.check()} Finca activa: ${finca.nombre} (ID: ${fincaId})`);
      } else {
        console.log(`  ${Icons.alerta()}️  No hay finca activa`);
        console.log(`      → Ve a Ajustes → Cargar Demo CHAMORRO`);
        allGood = false;
      }
    } catch (e) {
      console.log(`  ${Icons.cerrar()} Error al obtener finca: ${e.message}`);
      allGood = false;
    }

    // 4. Verificar datos en DB
    console.log(`\n${Icons.check()} Verificando datos en DB...`);
    try {
      const [fincas, rebanos, animales, compradores] = await Promise.all([
        Fincas.list().catch(() => []),
        Rebanos.list().catch(() => []),
        Animales.list().catch(() => []),
        Compradores.list().catch(() => [])
      ]);

      console.log(`  • Fincas: ${fincas.length}`);
      console.log(`  • Rebaños: ${rebanos.length}`);
      console.log(`  • Animales: ${animales.length}`);
      console.log(`  • Compradores: ${compradores.length}`);

      if (fincas.length === 0 || rebanos.length === 0 || animales.length === 0) {
        console.log(`  ${Icons.alerta()}️  Datos incompletos — carga la demo nuevamente`);
        allGood = false;
      } else {
        console.log(`  ${Icons.check()} Datos cargados correctamente`);
      }
    } catch (e) {
      console.log(`  ${Icons.cerrar()} Error al leer datos: ${e.message}`);
      allGood = false;
    }

    // 5. Verificar QA Test Runner
    console.log(`\n${Icons.check()} Verificando QA Test Runner...`);
    if (window.QATestRunner) {
      console.log(`  ${Icons.check()} QATestRunner cargado`);
    } else {
      console.log(`  ${Icons.cerrar()} QATestRunner NO cargado`);
      allGood = false;
    }

    // Resumen
    console.log('\n╔════════════════════════════════════════╗');
    if (allGood) {
      console.log(`%c║  ${Icons.check()} TODO LISTO PARA TESTS              ║`, 'color: #10b981; font-weight: bold;');
      console.log('║  Ejecuta: window.QATestRunner.runAll() ║');
    } else {
      console.log(`%c║  ${Icons.alerta()}️  PROBLEMAS DETECTADOS             ║`, 'color: #f59e0b; font-weight: bold;');
      console.log('║  Sigue las indicaciones arriba         ║');
    }
    console.log('╚════════════════════════════════════════╝');

    return allGood;
  }
};

console.log(`${Icons.check()} QA Diagnóstico cargado. Usa: window.QADiagnostico.run()`);
