/**
 * LIVESTOCK MANAGER - SUITE DE PRUEBAS UNITARIAS: AUDIT SERVICE
 * Validacion de persistencia tolerante, lista blanca, saneamiento de secretos,
 * deduplicacion determinista, limites de consulta e integridad lógica.
 */

const assert = require('assert');
const path = require('path');

const AuditService = require(path.join(__dirname, '..', 'js', 'services', 'audit-service.js'));

// Mock de base de datos en memoria para pruebas
function createMockDB() {
  const store = [];
  let nextId = 1;
  let throwOnAdd = false;

  return {
    _store: store,
    setThrowOnAdd: (val) => { throwOnAdd = val; },
    add: async (storeName, item) => {
      if (throwOnAdd) {
        const err = new Error('QuotaExceededError: Mock storage limit exceeded');
        err.name = 'QuotaExceededError';
        throw err;
      }
      if (storeName !== 'registro_eventos') throw new Error(`Unexpected store: ${storeName}`);
      const record = { ...item, id: nextId++ };
      store.push(record);
      return record.id;
    },
    getAllFromIndex: async (storeName, indexName, value) => {
      if (storeName !== 'registro_eventos') return [];
      return store.filter(item => {
        if (indexName === 'fincaId') return String(item.fincaId) === String(value);
        return false;
      });
    }
  };
}

async function runTests() {
  console.log('\n=== INICIANDO SUITE DE AUDIT SERVICE ===\n');
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  // Grupo 1: Saneamiento y Minimización
  console.log('--- 1. Saneamiento y Minimización ---');

  await test('Sanea actor_id enmascarando correos electrónicos', async () => {
    assert.strictEqual(AuditService._sanitizeActorId('juan.perez@dominio.com', 'user'), 'ju***@dominio.com');
    assert.strictEqual(AuditService._sanitizeActorId('a@b.es', 'user'), 'a***@b.es');
    assert.strictEqual(AuditService._sanitizeActorId('admin_finca', 'user'), 'admin_finca');
    assert.strictEqual(AuditService._sanitizeActorId(null, 'user'), 'operador_local');
    assert.strictEqual(AuditService._sanitizeActorId(undefined, 'system_service'), 'servicio_interno');
  });

  await test('Redacta tokens Bearer, contraseñas y hashes largos en descripcion', async () => {
    const raw1 = 'Error con token Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz';
    const clean1 = AuditService._sanitizeDescription(raw1);
    assert.ok(!clean1.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
    assert.ok(clean1.includes('[REDACTED]'));

    const raw2 = 'Usuario cambió password: MiPasswordSeguro123!';
    const clean2 = AuditService._sanitizeDescription(raw2);
    assert.ok(!clean2.includes('MiPasswordSeguro123!'));
    assert.ok(clean2.includes('[REDACTED]'));

    const raw3 = 'Hash de sesion 1234567890abcdef1234567890abcdef12345678 completado';
    const clean3 = AuditService._sanitizeDescription(raw3);
    assert.ok(!clean3.includes('1234567890abcdef1234567890abcdef12345678'));
    assert.ok(clean3.includes('[REDACTED]'));
  });

  await test('No inventa fields_modified si no es suministrado', async () => {
    assert.strictEqual(AuditService._sanitizeFieldsModified(undefined), undefined);
    assert.strictEqual(AuditService._sanitizeFieldsModified(null), undefined);
    assert.strictEqual(AuditService._sanitizeFieldsModified([]), undefined);
    assert.strictEqual(AuditService._sanitizeFieldsModified('peso'), undefined);
  });

  await test('Filtra y limpia fields_modified válidos conservando solo nombres', async () => {
    const input = ['peso', 'estado', 'fincaId', 'campo_con_$simbolos!', ''];
    const res = AuditService._sanitizeFieldsModified(input);
    assert.deepStrictEqual(res, ['peso', 'estado', 'fincaId', 'campo_con_simbolos']);
  });

  // Grupo 2: Hash de Integridad
  console.log('\n--- 2. Hash de Integridad ---');

  await test('Calcula hash consistente para campos idénticos', async () => {
    const rec1 = {
      fincaId: 10,
      creadoEn: '2026-10-27T18:00:00.000Z',
      actor_id: 'operador_local',
      action: 'UPDATE',
      tipo_entidad: 'animal',
      entidad_id: '101',
      motivo_tarea: 'edicion_animal',
      resultado: 'SUCCESS'
    };
    const hash1 = AuditService.computeIntegrityHash(rec1);
    const hash2 = AuditService.computeIntegrityHash({ ...rec1 });
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(typeof hash1, 'string');
    assert.strictEqual(hash1.length, 8);
  });

  await test('Cualquier alteración de campos modifica el hash de integridad', async () => {
    const recOriginal = {
      fincaId: 10,
      creadoEn: '2026-10-27T18:00:00.000Z',
      actor_id: 'operador_local',
      action: 'UPDATE',
      tipo_entidad: 'animal',
      entidad_id: '101',
      motivo_tarea: 'edicion_animal',
      resultado: 'SUCCESS'
    };
    const hashOriginal = AuditService.computeIntegrityHash(recOriginal);
    const hashAlterado = AuditService.computeIntegrityHash({ ...recOriginal, resultado: 'FAILED' });
    assert.notStrictEqual(hashOriginal, hashAlterado);
  });

  // Grupo 3: Persistencia y Deduplicación
  console.log('\n--- 3. Persistencia y Deduplicación ---');

  await test('Persiste evento cumpliendo lista blanca e inyectando hash', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;

    const res = await AuditService.record({
      fincaId: 5,
      actor_type: 'user',
      actor_id: 'veterinario@finca.es',
      action: 'CREATE',
      tipo_entidad: 'animal',
      entidad_id: 'ES012345678901',
      motivo_tarea: 'alta_nacimiento',
      descripcion: 'Alta de ternero nacido en parto #42',
      fields_modified: ['estado', 'peso']
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.id, 1);
    assert.strictEqual(mockDB._store.length, 1);

    const saved = mockDB._store[0];
    assert.strictEqual(saved.tipo, 'auditoria');
    assert.strictEqual(saved.fincaId, 5);
    assert.strictEqual(saved.actor_id, 've***@finca.es');
    assert.strictEqual(saved.tipo_entidad, 'animal');
    assert.strictEqual(saved.action, 'CREATE');
    assert.strictEqual(saved.motivo_tarea, 'alta_nacimiento');
    assert.deepStrictEqual(saved.fields_modified, ['estado', 'peso']);
    assert.ok(saved.hash_integridad);
    assert.strictEqual(saved.hash_integridad.length, 8);
  });

  await test('Deduplica llamadas idénticas inmediatas (doble clic) sobre la misma entidad', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;
    AuditService._recentOperations.clear();

    const op = {
      fincaId: 5,
      action: 'UPDATE',
      tipo_entidad: 'animal',
      entidad_id: 'ANIMAL-99',
      motivo_tarea: 'pesaje_registrado',
      descripcion: 'Actualizacion peso'
    };

    const res1 = await AuditService.record(op);
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.deduplicated, undefined);

    const res2 = await AuditService.record(op);
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.deduplicated, true);
    assert.strictEqual(res2.id, res1.id);
    assert.strictEqual(mockDB._store.length, 1);
  });

  await test('NO descarta operaciones legítimas sobre entidades distintas en la misma ventana temporal', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;
    AuditService._recentOperations.clear();

    const opA = {
      fincaId: 5,
      action: 'CREATE',
      tipo_entidad: 'animal',
      entidad_id: 'ES-01',
      motivo_tarea: 'alta_censo'
    };
    const opB = {
      fincaId: 5,
      action: 'CREATE',
      tipo_entidad: 'animal',
      entidad_id: 'ES-02',
      motivo_tarea: 'alta_censo'
    };

    const resA = await AuditService.record(opA);
    const resB = await AuditService.record(opB);

    assert.strictEqual(resA.success, true);
    assert.strictEqual(resB.success, true);
    assert.strictEqual(resA.deduplicated, undefined);
    assert.strictEqual(resB.deduplicated, undefined);
    assert.strictEqual(mockDB._store.length, 2);
  });

  // Grupo 4: Modo Tolerante
  console.log('\n--- 4. Modo Tolerante ante Fallos ---');

  await test('Si IndexedDB falla, no lanza excepción, actualiza salud y retorna false', async () => {
    const mockDB = createMockDB();
    mockDB.setThrowOnAdd(true);
    global.db = mockDB;
    AuditService._failureCount = 0;
    AuditService._recentFailures = [];

    const res = await AuditService.record({
      fincaId: 1,
      action: 'UPDATE',
      tipo_entidad: 'botiquin',
      entidad_id: 'FARM-01',
      descripcion: 'Administracion de farmaco'
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.reason, 'AUDIT_WRITE_FAILED');

    const health = AuditService.getHealth();
    assert.strictEqual(health.isHealthy, false);
    assert.strictEqual(health.failureCount, 1);
    assert.strictEqual(health.recentFailures.length, 1);
    assert.strictEqual(health.recentFailures[0].error, 'QuotaExceededError');
  });

  // Grupo 5: Consulta, Aislamiento y Límites
  console.log('\n--- 5. Consulta y Aislamiento por Finca ---');

  await test('list() recupera eventos de la finca activa más eventos de sistema global', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;

    await mockDB.add('registro_eventos', {
      fincaId: 7, tipo: 'auditoria', motivo_tarea: 'evento_finca_7', creadoEn: '2026-10-27T10:00:00Z'
    });
    await mockDB.add('registro_eventos', {
      fincaId: 8, tipo: 'auditoria', motivo_tarea: 'evento_otra_finca', creadoEn: '2026-10-27T11:00:00Z'
    });
    await mockDB.add('registro_eventos', {
      fincaId: 'global', tipo: 'auditoria', motivo_tarea: 'cambio_tema_global', creadoEn: '2026-10-27T12:00:00Z'
    });

    const logsFinca7 = await AuditService.list({ fincaId: 7, limit: 50 });
    assert.strictEqual(logsFinca7.length, 2);
    const motivos = logsFinca7.map(l => l.motivo_tarea);
    assert.ok(motivos.includes('evento_finca_7'));
    assert.ok(motivos.includes('cambio_tema_global'));
    assert.ok(!motivos.includes('evento_otra_finca'));
  });

  await test('list() respeta el límite de presentación solicitado', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;

    for (let i = 1; i <= 60; i++) {
      await mockDB.add('registro_eventos', {
        fincaId: 99, tipo: 'auditoria', motivo_tarea: `evento_${i}`, creadoEn: `2026-10-27T${String(i % 24).padStart(2, '0')}:00:00Z`
      });
    }

    const logs = await AuditService.list({ fincaId: 99, limit: 50 });
    assert.strictEqual(logs.length, 50);
  });

  console.log(`\n========================================`);
  console.log(`RESULTADO FINAL: ${passed}/${total} PRUEBAS SUPERADAS`);
  console.log(`========================================\n`);
}

runTests().catch(err => {
  console.error('ERROR EN SUITE:', err);
  process.exit(1);
});
