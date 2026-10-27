/**
 * LIVESTOCK MANAGER - SUITE DE PRUEBAS UNITARIAS: AUDIT SERVICE
 * Validacion de persistencia tolerante, lista blanca, saneamiento de secretos,
 * deduplicacion determinista, limites de consulta e integridad lógica.
 */

const assert = require('assert');
const path = require('path');
const vm = require('vm');
const fs = require('fs');

const AuditService = require(path.join(__dirname, '..', 'js', 'services', 'audit-service.js'));

// Mock de base de datos en memoria para pruebas
function createMockDB() {
  const stores = {
    registro_eventos: [],
    animales: [],
    movimientos_ganado: [],
    gastos_ganaderia: [],
    ventas_ganado: []
  };
  let nextId = 1;
  let throwOnAdd = false;
  let throwOnGetAll = false;

  return {
    _stores: stores,
    _store: stores.registro_eventos,
    setThrowOnAdd: (val) => { throwOnAdd = val; },
    setThrowOnGetAll: (val) => { throwOnGetAll = val; },
    objectStoreNames: {
      _names: ['registro_eventos', 'animales', 'movimientos_ganado', 'gastos_ganaderia', 'ventas_ganado'],
      contains(s) { return this._names.includes(s); },
      [Symbol.iterator]() { return this._names[Symbol.iterator](); }
    },
    get: async (storeName, id) => {
      const arr = stores[storeName] || [];
      return arr.find(x => x.id === Number(id)) || null;
    },
    getFromIndex: async () => null,
    getAll: async (storeName) => {
      if (throwOnGetAll) {
        throw new Error('DatabaseError: Error al recuperar datos de ' + storeName);
      }
      return stores[storeName] || [{ id: 101, crotal: 'ES01' }];
    },
    add: async (storeName, item) => {
      if (throwOnAdd) {
        const err = new Error('QuotaExceededError: Mock storage limit exceeded');
        err.name = 'QuotaExceededError';
        throw err;
      }
      if (!stores[storeName]) stores[storeName] = [];
      const record = { ...item, id: nextId++ };
      stores[storeName].push(record);
      return record.id;
    },
    put: async (storeName, item) => {
      if (!stores[storeName]) stores[storeName] = [];
      const idx = stores[storeName].findIndex(x => x.id === item.id);
      if (idx >= 0) stores[storeName][idx] = item;
      else stores[storeName].push(item);
      return item.id;
    },
    getAllFromIndex: async (storeName, indexName, value) => {
      const arr = stores[storeName] || [];
      return arr.filter(item => {
        if (indexName === 'fincaId') return String(item.fincaId) === String(value);
        if (indexName === 'entidad_id') return String(item.entidad_id) === String(value);
        return false;
      });
    }
  };
}

function loadRealDomainModules(customMocks = {}) {
  const sandbox = {
    window: {},
    console: { log: () => {}, warn: () => {}, error: () => {} },
    setTimeout: setTimeout,
    ErrorHandler: {
      tryAsync: async (fn) => fn(),
      validateCrotal: async (c) => c
    },
    Fincas: { getActiveId: async () => 1 },
    EventBus: customMocks.EventBus || global.EventBus,
    ...customMocks
  };
  sandbox.window = sandbox;
  sandbox.window.db = customMocks.db || global.db;
  sandbox.window.EventBus = sandbox.EventBus;
  sandbox.window.Fincas = sandbox.Fincas;
  sandbox.window.AuditService = AuditService;
  sandbox.AuditService = AuditService;

  vm.createContext(sandbox);

  const animalesCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'animales.js'), 'utf8');
  vm.runInContext(animalesCode + '\n; sandbox_export_Animales = Animales;', sandbox);

  const pesajesCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'pesajes.js'), 'utf8');
  vm.runInContext(pesajesCode + '\n; sandbox_export_Pesajes = Pesajes;', sandbox);

  const movimientosCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'movimientos.js'), 'utf8');
  vm.runInContext(movimientosCode + '\n; sandbox_export_Movimientos = Movimientos;', sandbox);

  return {
    Animales: sandbox.sandbox_export_Animales,
    Pesajes: sandbox.sandbox_export_Pesajes,
    Movimientos: sandbox.sandbox_export_Movimientos,
    sandbox
  };
}

function loadRealAppInstance(customMocks = {}) {
  const appPath = path.join(__dirname, '..', 'js', 'app.js');
  const appCode = fs.readFileSync(appPath, 'utf8');

  class MockFileReader {
    constructor() { this.onload = null; }
    readAsText(file) {
      setTimeout(() => {
        if (this.onload) {
          this.onload({ target: { result: file._content || '' } });
        }
      }, 5);
    }
  }

  const sandbox = {
    window: {},
    document: {
      readyState: 'loading',
      addEventListener: () => {},
      createElement: (tag) => ({ tag, href: '', download: '', click() {}, style: {} }),
      body: { appendChild: () => {}, removeChild: () => {} }
    },
    Blob: global.Blob,
    URL: { createObjectURL: () => 'blob:mock-url', revokeObjectURL: () => {} },
    FileReader: MockFileReader,
    setTimeout: (fn) => setTimeout(fn, 1),
    console: { log: () => {}, warn: () => {}, error: () => {} },
    DB_VERSION: 1,
    ...customMocks
  };

  sandbox.window = sandbox;
  sandbox.window.db = customMocks.db || global.db;
  sandbox.window.APP_INFO = { version: '2.5.0' };
  sandbox.window.AuditService = AuditService;
  sandbox.AuditService = AuditService;
  sandbox.window.location = { reload: () => {} };
  sandbox.window.Confirm = { alert: async () => {} };
  sandbox.window.Fincas = { setActiveId: async () => {} };
  sandbox.window.Trazabilidad = customMocks.Trazabilidad || {
    importarBackupData: async () => ({ fincas: [{ id: 1 }], multiplesFincas: false })
  };

  vm.createContext(sandbox);
  vm.runInContext(appCode + '\n; sandbox_export_App = App;', sandbox);

  const realApp = sandbox.sandbox_export_App;
  realApp.toast = (msg, type) => {
    if (customMocks.onToast) customMocks.onToast(msg, type);
  };
  realApp.toastError = (msg) => {
    if (customMocks.onToastError) customMocks.onToastError(msg);
  };

  return { App: realApp, sandbox };
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

  // Grupo 6: Auditoría de Copias de Seguridad (Exportación e Importación)
  console.log('\n--- 6. Auditoría de Copias de Seguridad ---');

  await test('Registra auditoría de exportación satisfactoria de backup', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;

    const res = await AuditService.record({
      fincaId: 'global',
      actor_type: 'user',
      action: 'EXPORT',
      resultado: 'SUCCESS',
      tipo_entidad: 'backup',
      entidad_id: 'backup_json',
      motivo_tarea: 'exportacion_backup',
      descripcion: 'Copia de seguridad exportada y descargada (142 registros)'
    });

    assert.strictEqual(res.success, true);
    const saved = mockDB._store[0];
    assert.strictEqual(saved.tipo_entidad, 'backup');
    assert.strictEqual(saved.action, 'EXPORT');
    assert.strictEqual(saved.resultado, 'SUCCESS');
    assert.strictEqual(saved.motivo_tarea, 'exportacion_backup');
    assert.strictEqual(saved.fincaId, 'global');
  });

  await test('Registra auditoría de importación POST-restauración y preserva el evento', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;

    // Simular que la base de datos tenía registros previos
    await mockDB.add('registro_eventos', { id: 1, fincaId: 1, tipo: 'auditoria', motivo_tarea: 'evento_antiguo' });

    // 1. Simulación del proceso de restauración de Trazabilidad.importarBackupData:
    //    Se limpian o reemplazan los datos con los del archivo de backup
    mockDB._store.length = 0; // Se vacía como parte de la carga del archivo
    mockDB._store.push({ id: 10, fincaId: 1, tipo: 'auditoria', motivo_tarea: 'evento_restaurado_del_fichero', creadoEn: '2026-10-25T10:00:00Z' });

    // 2. Ejecutar la auditoría post-restauración de App.importBackup:
    const res = await AuditService.record({
      fincaId: 'global',
      actor_type: 'user',
      action: 'IMPORT',
      resultado: 'SUCCESS',
      tipo_entidad: 'backup',
      entidad_id: 'backup_json',
      motivo_tarea: 'importacion_backup',
      descripcion: 'Copia de seguridad restaurada (2 fincas)'
    });

    assert.strictEqual(res.success, true);

    // Verificar que el evento de importación NO desapareció durante la restauración
    assert.strictEqual(mockDB._store.length, 2);
    const ultimoRegistro = mockDB._store[mockDB._store.length - 1];
    assert.strictEqual(ultimoRegistro.motivo_tarea, 'importacion_backup');
    assert.strictEqual(ultimoRegistro.tipo_entidad, 'backup');
    assert.strictEqual(ultimoRegistro.action, 'IMPORT');
    assert.strictEqual(ultimoRegistro.fincaId, 'global');

    // Comprobar que list() lo muestra como el más reciente
    const logs = await AuditService.list({ fincaId: 1, limit: 10 });
    assert.strictEqual(logs[0].motivo_tarea, 'importacion_backup');
  });

  await test('Registra eventos de fallo ante errores de exportación o importación', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;

    const resFalloExport = await AuditService.record({
      fincaId: 'global',
      action: 'EXPORT',
      resultado: 'FAILED',
      tipo_entidad: 'backup',
      entidad_id: 'backup_json',
      motivo_tarea: 'fallo_exportacion_backup',
      descripcion: 'Fallo al generar copia de seguridad'
    });
    assert.strictEqual(resFalloExport.success, true);
    assert.strictEqual(mockDB._store[0].resultado, 'FAILED');
    assert.strictEqual(mockDB._store[0].motivo_tarea, 'fallo_exportacion_backup');

    const resFalloImport = await AuditService.record({
      fincaId: 'global',
      action: 'IMPORT',
      resultado: 'FAILED',
      tipo_entidad: 'backup',
      entidad_id: 'backup_json',
      motivo_tarea: 'fallo_importacion_backup',
      descripcion: 'Fallo al restaurar copia de seguridad'
    });
    assert.strictEqual(resFalloImport.success, true);
    assert.strictEqual(mockDB._store[1].resultado, 'FAILED');
    assert.strictEqual(mockDB._store[1].motivo_tarea, 'fallo_importacion_backup');
  });

  await test('Fallo de escritura de auditoría en backup no lanza excepción (modo tolerante)', async () => {
    const mockDB = createMockDB();
    mockDB.setThrowOnAdd(true);
    global.db = mockDB;
    AuditService._recentOperations.clear();

    const res = await AuditService.record({
      fincaId: 'global',
      action: 'EXPORT',
      resultado: 'SUCCESS',
      tipo_entidad: 'backup',
      entidad_id: 'backup_json',
      motivo_tarea: 'exportacion_backup',
      descripcion: 'Copia de seguridad exportada'
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.reason, 'AUDIT_WRITE_FAILED');
  });

  // Grupo 7: Mitigación de Inyección HTML (XSS) y Seguridad DOM
  console.log('\n--- 7. Mitigación de Inyección HTML (XSS) y Seguridad DOM ---');

  await test('AuditService.escapeHtml sanea caracteres especiales y entidades maliciosas', async () => {
    assert.strictEqual(AuditService.escapeHtml(null), '');
    assert.strictEqual(AuditService.escapeHtml(undefined), '');
    assert.strictEqual(AuditService.escapeHtml('Texto plano'), 'Texto plano');

    const dangerous = '<script>alert("xss")</script>';
    const escaped = AuditService.escapeHtml(dangerous);
    assert.strictEqual(escaped, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');

    const attrs = '" onmouseover="alert(\'xss\')"';
    const escapedAttrs = AuditService.escapeHtml(attrs);
    assert.strictEqual(escapedAttrs, '&quot; onmouseover=&quot;alert(&#39;xss&#39;)&quot;');
  });

  await test('Renderizado de vista de auditoría neutraliza vectores maliciosos en campos almacenados', async () => {
    const maliciousLogs = [
      {
        id: 1,
        fincaId: 1,
        tipo: 'auditoria',
        motivo_tarea: '<script>evil()</script>',
        actor_id: '<img src=x onerror=steal()>',
        descripcion: '"><svg onload=alert(document.cookie)>',
        fields_modified: ['<b onmouseover=evil()>', 'campo_normal'],
        rectificadoMotivo: '"><iframe src=evil.com></iframe>',
        creadoEn: '2026-10-27T12:00:00Z'
      }
    ];

    const _esc = AuditService.escapeHtml;
    // Simular el renderizado idéntico al de ConfigSistemaView._renderAuditoria
    const renderedHtml = maliciousLogs.map(l => {
      const isAnulado = l.anulado || l.motivo_tarea?.includes('anulacion') || l.motivo_tarea?.includes('baja') || l.action === 'DELETE_LOGICAL';
      const isRectificado = l.rectificado || l.resultado === 'WARNING' || l.motivo_tarea?.includes('rectificacion');
      const color = isAnulado ? 'var(--c-danger)' : (isRectificado ? 'var(--c-warning)' : 'var(--c-info)');
      const actorTag = l.actor_id ? `<span class="actor">| Actor: ${_esc(l.actor_id)}</span>` : '';
      const fieldsTag = Array.isArray(l.fields_modified) && l.fields_modified.length > 0
        ? `<div class="fields">Campos alterados: ${_esc(l.fields_modified.join(', '))}</div>`
        : '';
      const motivo = _esc((l.motivo_tarea || 'Evento de Sistema').replace(/_/g, ' '));
      const fechaStr = _esc(new Date(l.creadoEn || l.fecha).toLocaleString());
      const desc = _esc(l.descripcion || l.observaciones || 'Registro modificado');
      const detalleMotivo = (l.rectificadoMotivo || l.anuladoMotivo)
        ? `<div class="motivo">Motivo: ${_esc(l.rectificadoMotivo || l.anuladoMotivo)}</div>`
        : '';

      return `
        <div class="card" style="border-left-color:${color};">
          <div class="header">
            <span>${motivo} ${actorTag}</span>
            <span>${fechaStr}</span>
          </div>
          <div class="desc">${desc}</div>
          ${fieldsTag}
          ${detalleMotivo}
        </div>
      `;
    }).join('');

    // Comprobaciones estrictas de seguridad
    assert.ok(!renderedHtml.includes('<script>'), 'No debe contener tags de script activos');
    assert.ok(!renderedHtml.includes('<img src=x'), 'No debe contener tags de imagen maliciosos');
    assert.ok(!renderedHtml.includes('<svg onload='), 'No debe contener vectores SVG maliciosos');
    assert.ok(!renderedHtml.includes('<iframe'), 'No debe contener iframes maliciosos');
    assert.ok(renderedHtml.includes('&lt;script&gt;evil()&lt;/script&gt;'));
    assert.ok(renderedHtml.includes('&lt;img src=x onerror=steal()&gt;'));
    assert.ok(renderedHtml.includes('&quot;&gt;&lt;svg onload=alert(document.cookie)&gt;'));
  });

  // Grupo 8: Reconciliación de Cobertura de Eventos y No Duplicación
  console.log('\n--- 8. Reconciliación de Cobertura de Eventos y No Duplicación ---');

  await test('EventBus registra altas y bajas de compradores, proveedores, contratos y saneamientos', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;
    AuditService._recentOperations.clear();

    const handlers = {};
    global.EventBus = {
      on: (ev, fn) => { handlers[ev] = fn; },
      emit: async (ev, data) => { if (handlers[ev]) await handlers[ev](data); }
    };
    AuditService._listenersInitialized = false;
    AuditService.initEventBusListeners();

    // 1. Alta y baja de comprador
    await global.EventBus.emit('comprador:created', { comprador: { id: 10, fincaId: 1, nombre: 'Matadero Central' } });
    await global.EventBus.emit('comprador:deleted', { id: 10 });

    // 2. Alta y baja de proveedor
    await global.EventBus.emit('proveedor:created', { proveedor: { id: 20, fincaId: 1, nombre: 'Piensos del Norte' } });
    await global.EventBus.emit('proveedor:deleted', { id: 20 });

    // 3. Alta de contrato
    await global.EventBus.emit('contrato:created', { contrato: { id: 30, fincaId: 1 } });

    // 4. Anulación de saneamiento y de vacunación
    await global.EventBus.emit('saneamiento:anulado', { id: 40 });
    await global.EventBus.emit('vacunacion:anulada', { id: 50 });

    assert.strictEqual(mockDB._store.length, 7);
    assert.strictEqual(mockDB._store[0].tipo_entidad, 'comprador');
    assert.strictEqual(mockDB._store[0].action, 'CREATE');
    assert.strictEqual(mockDB._store[1].tipo_entidad, 'comprador');
    assert.strictEqual(mockDB._store[1].action, 'DELETE_LOGICAL');
    assert.strictEqual(mockDB._store[2].tipo_entidad, 'proveedor');
    assert.strictEqual(mockDB._store[3].tipo_entidad, 'proveedor');
    assert.strictEqual(mockDB._store[4].tipo_entidad, 'contrato');
    assert.strictEqual(mockDB._store[5].tipo_entidad, 'saneamiento');
    assert.strictEqual(mockDB._store[6].tipo_entidad, 'vacunacion');
  });

  await test('EventBus NO duplica anulación de animal si ya fue registrada de forma nativa', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;
    AuditService._recentOperations.clear();

    const handlers = {};
    global.EventBus = {
      on: (ev, fn) => { handlers[ev] = fn; },
      emit: async (ev, data) => { if (handlers[ev]) await handlers[ev](data); }
    };
    AuditService._listenersInitialized = false;
    AuditService.initEventBusListeners();

    // Simular que animales.js registra la anulación directamente
    await mockDB.add('registro_eventos', {
      fincaId: 1,
      entidad_id: 99,
      tipo_entidad: 'animal',
      tipo: 'auditoria',
      motivo_tarea: 'anulacion_registro',
      descripcion: 'Anulación de ficha animal ES99'
    });
    assert.strictEqual(mockDB._store.length, 1);

    // Emitir el evento con la bandera { anulacion: true } generada por animales.js
    await global.EventBus.emit('animal:deleted', { id: 99, anulacion: true });

    // Verificar que AuditService no añadió un segundo evento duplicado
    assert.strictEqual(mockDB._store.length, 1, 'No debe duplicar anulación ya registrada en db');
  });

  await test('list() recupera registros de auditoría y mutaciones directas de censo (altas y bajas)', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;

    // Insertar operaciones directas e indirectas
    mockDB._store.push({ id: 1, fincaId: 1, tipo: 'alta', motivo_tarea: 'alta_nacimiento', descripcion: 'Alta animal ES01', creadoEn: '2026-10-27T08:00:00Z' });
    mockDB._store.push({ id: 2, fincaId: 1, tipo: 'baja', motivo_tarea: 'baja_muerte', descripcion: 'Baja animal ES02', creadoEn: '2026-10-27T08:30:00Z' });
    mockDB._store.push({ id: 3, fincaId: 1, tipo: 'auditoria', motivo_tarea: 'anulacion_registro', descripcion: 'Anulación animal ES03', creadoEn: '2026-10-27T09:00:00Z' });
    mockDB._store.push({ id: 4, fincaId: 1, tipo: 'telemetria', motivo_tarea: 'ping_sensor', descripcion: 'Ping sensor', creadoEn: '2026-10-27T09:15:00Z' });

    const logs = await AuditService.list({ fincaId: 1, limit: 10 });
    assert.strictEqual(logs.length, 3, 'Debe mostrar 3 operaciones de negocio y omitir telemetría irrelevante');
    assert.strictEqual(logs[0].id, 3); // más reciente primero
    assert.strictEqual(logs[1].id, 2);
    assert.strictEqual(logs[2].id, 1);
  });

  // Grupo 9: Pruebas de Ejecución de Flujos Reales de App (Exportación e Importación)
  console.log('\n--- 9. Pruebas de Ejecución de Flujos Reales de App (Exportación e Importación) ---');

  await test('Flujo real App.exportBackup() exitoso registra auditoría con metadatos', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;
    AuditService._recentOperations.clear();

    let toastSuccess = null;
    const { App } = loadRealAppInstance({
      db: mockDB,
      onToast: (msg, type) => {
        if (type === 'success') toastSuccess = msg;
      }
    });

    await App.exportBackup();

    assert.ok(toastSuccess && toastSuccess.includes('Backup descargado'));
    assert.strictEqual(mockDB._store.length, 1);
    const auditRec = mockDB._store[0];
    assert.strictEqual(auditRec.tipo_entidad, 'backup');
    assert.strictEqual(auditRec.action, 'EXPORT');
    assert.strictEqual(auditRec.resultado, 'SUCCESS');
    assert.strictEqual(auditRec.motivo_tarea, 'exportacion_backup');
    assert.strictEqual(auditRec.fincaId, 'global');
    assert.ok(auditRec.descripcion.includes('Copia de seguridad exportada y descargada'));
    assert.strictEqual(auditRec.hash_integridad, AuditService.computeIntegrityHash(auditRec));
  });

  await test('Flujo real App.exportBackup() con fallo registra auditoría tolerante de error', async () => {
    const mockDB = createMockDB();
    mockDB.setThrowOnGetAll(true);
    global.db = mockDB;
    AuditService._recentOperations.clear();

    let toastErrorMsg = null;
    const { App } = loadRealAppInstance({
      db: mockDB,
      onToastError: (msg) => { toastErrorMsg = msg; }
    });

    await App.exportBackup();

    assert.ok(toastErrorMsg && toastErrorMsg.includes('Error al exportar'));
    assert.strictEqual(mockDB._store.length, 1);
    const auditRec = mockDB._store[0];
    assert.strictEqual(auditRec.tipo_entidad, 'backup');
    assert.strictEqual(auditRec.action, 'EXPORT');
    assert.strictEqual(auditRec.resultado, 'FAILED');
    assert.strictEqual(auditRec.motivo_tarea, 'fallo_exportacion_backup');
  });

  await test('Flujo real App.importBackup() exitoso restaura datos y preserva registro de auditoría POST-restauración', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;
    AuditService._recentOperations.clear();

    // Base de datos previa con un registro histórico
    mockDB._store.push({ id: 1, fincaId: 1, tipo: 'alta', motivo_tarea: 'alta_historica' });

    let toastSuccess = null;
    const { App } = loadRealAppInstance({
      db: mockDB,
      Trazabilidad: {
        importarBackupData: async (db, jsonStr) => {
          // Simula la sustitución física de datos efectuada por la restauración
          mockDB._store.length = 0;
          mockDB._store.push({ id: 200, fincaId: 1, tipo: 'alta', motivo_tarea: 'alta_restaurada_de_fichero' });
          return { fincas: [{ id: 1 }], multiplesFincas: false };
        }
      },
      onToast: (msg, type) => {
        if (type === 'success') toastSuccess = msg;
      }
    });

    const mockFile = { name: 'backup_explotacion.json', _content: JSON.stringify({ datos: 'demo' }) };
    const event = { target: { files: [mockFile] } };

    await App.importBackup(event);
    // Esperar resolución de FileReader simulado
    await new Promise(r => setTimeout(r, 50));

    assert.ok(toastSuccess && toastSuccess.includes('Backup restaurado'));
    // Debe haber 2 registros: el importado del fichero + el registro de auditoría añadido POST-restauración
    assert.strictEqual(mockDB._store.length, 2);
    const auditImport = mockDB._store.find(r => r.action === 'IMPORT');
    assert.ok(auditImport, 'El registro de auditoría de importación debe existir');
    assert.strictEqual(auditImport.resultado, 'SUCCESS');
    assert.strictEqual(auditImport.motivo_tarea, 'importacion_backup');
    assert.strictEqual(auditImport.fincaId, 'global');

    // Comprobar que list() lo muestra como el evento más reciente
    const listado = await AuditService.list({ fincaId: 1, limit: 10 });
    assert.strictEqual(listado[0].motivo_tarea, 'importacion_backup');
  });

  await test('Flujo real App.importBackup() con fallo registra evento FAILED de auditoría', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;
    AuditService._recentOperations.clear();

    let toastErrorMsg = null;
    const { App } = loadRealAppInstance({
      db: mockDB,
      Trazabilidad: {
        importarBackupData: async () => {
          throw new Error('Estructura de JSON inválida o corrupta');
        }
      },
      onToastError: (msg) => { toastErrorMsg = msg; }
    });

    const mockFile = { name: 'backup_corrupto.json', _content: 'no-json' };
    const event = { target: { files: [mockFile] } };

    await App.importBackup(event);
    await new Promise(r => setTimeout(r, 50));

    assert.ok(toastErrorMsg && toastErrorMsg.includes('Estructura de JSON inválida'), 'Debe notificar el error de restauración');
    assert.strictEqual(mockDB._store.length, 1);
    const auditFallo = mockDB._store[0];
    assert.strictEqual(auditFallo.action, 'IMPORT');
    assert.strictEqual(auditFallo.resultado, 'FAILED');
    assert.strictEqual(auditFallo.motivo_tarea, 'fallo_importacion_backup');
  });

  // Grupo 10: Pruebas de Ruta Real desde Operaciones de Dominio (Altas, Modificaciones, Pesajes y Movimientos)
  console.log('\n--- 10. Pruebas de Ruta Real desde Operaciones de Dominio (Altas, Modificaciones, Pesajes y Movimientos) ---');

  await test('Ruta real: Animales.save (alta en censo) persiste en registro_eventos y aparece en list()', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;
    AuditService._recentOperations.clear();

    const { Animales } = loadRealDomainModules({ db: mockDB });

    // Ejecutar alta real de animal en finca 1
    const nuevoId = await Animales.save({
      numero_identificacion: 'ES011122233344',
      tipoAlta: 'Nacimiento',
      fincaId: 1,
      fecha_nacimiento: '2026-10-27'
    });

    assert.ok(nuevoId > 0, 'Debe devolver un ID de animal válido');
    
    // Comprobar que en registro_eventos existe el alta oficial de censo
    const eventosCenso = mockDB._stores.registro_eventos.filter(e => e.tipo === 'alta');
    assert.strictEqual(eventosCenso.length, 1);
    assert.strictEqual(eventosCenso[0].fincaId, 1);
    assert.strictEqual(eventosCenso[0].entidad_id, nuevoId);
    assert.strictEqual(eventosCenso[0].motivo_tarea, 'alta_nacimiento');
    assert.ok(eventosCenso[0].descripcion.includes('ES011122233344'));

    // Comprobar que list() de AuditService para la finca 1 lo recupera
    const logsFinca1 = await AuditService.list({ fincaId: 1, limit: 10 });
    const logAlta = logsFinca1.find(l => l.entidad_id === nuevoId);
    assert.ok(logAlta, 'El evento de alta debe aparecer en la auditoría de la finca 1');
    assert.strictEqual(logAlta.motivo_tarea, 'alta_nacimiento');
  });

  await test('Ruta real: Animales.save (modificación de ficha) audita la operación vía EventBus sin duplicar', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;
    AuditService._recentOperations.clear();

    const handlers = {};
    const bus = {
      on: (ev, fn) => { handlers[ev] = fn; },
      emit: async (ev, data) => { if (handlers[ev]) await handlers[ev](data); }
    };
    global.EventBus = bus;
    AuditService._listenersInitialized = false;
    AuditService.initEventBusListeners();

    const { Animales } = loadRealDomainModules({ db: mockDB, EventBus: bus });

    // Pre-insertar animal en almacén
    mockDB._stores.animales.push({
      id: 50,
      numero_identificacion: 'ES099988877766',
      fincaId: 1,
      estado: 'activo',
      rebanoId: 1
    });

    // Modificar animal (cambio de rebaño)
    await Animales.save({
      id: 50,
      numero_identificacion: 'ES099988877766',
      fincaId: 1,
      estado: 'activo',
      rebanoId: 2
    });

    // Comprobar que AuditService registró la modificación
    const eventosAudit = mockDB._stores.registro_eventos.filter(e => e.tipo === 'auditoria');
    assert.ok(eventosAudit.length >= 1, 'Debe registrarse auditoría de la modificación');
    const logMod = eventosAudit.find(e => e.entidad_id === '50' || e.entidad_id === 50);
    assert.ok(logMod);
    assert.strictEqual(logMod.action, 'UPDATE');
    assert.strictEqual(logMod.fincaId, 1);

    // Comprobar que list() de AuditService lo muestra
    const logs = await AuditService.list({ fincaId: 1, limit: 10 });
    assert.ok(logs.some(l => l.entidad_id === '50' || l.entidad_id === 50));
  });

  await test('Ruta real: Pesajes.registrar persiste pesaje de control y se visualiza en list() sin duplicados', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;
    AuditService._recentOperations.clear();

    const { Pesajes } = loadRealDomainModules({ db: mockDB });

    // Registrar pesaje de control real en finca 1
    const idPesaje = await Pesajes.registrar({
      fincaId: 1,
      entidad_id: 105,
      valor_neto: 420.5,
      unidad: 'kg',
      motivo_tarea: 'control'
    });

    assert.ok(idPesaje > 0);

    // Comprobar que en registro_eventos hay exactamente un registro de pesaje
    const eventosPesaje = mockDB._stores.registro_eventos.filter(e => e.valor_neto === 420.5);
    assert.strictEqual(eventosPesaje.length, 1, 'No debe haber registros duplicados de pesaje');
    assert.strictEqual(eventosPesaje[0].fincaId, 1);
    assert.strictEqual(eventosPesaje[0].unidad, 'kg');

    // Comprobar que AuditService.list() para la finca 1 incluye el pesaje
    const logs = await AuditService.list({ fincaId: 1, limit: 10 });
    const logP = logs.find(l => l.valor_neto === 420.5);
    assert.ok(logP, 'El pesaje debe aparecer en el registro de actividad de la finca');
    assert.strictEqual(logP.motivo_tarea, 'control');
  });

  await test('Ruta real: Movimientos._registrarEventos persiste eventos pecuarios oficiales y aparecen en list()', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;
    AuditService._recentOperations.clear();

    const { Movimientos } = loadRealDomainModules({ db: mockDB });

    // Registrar evento de salida de 2 animales con guía sanitaria oficial
    await Movimientos._registrarEventos({
      fincaId: 1,
      animalId: [201, 202],
      tipo: 'salida',
      fecha: '2026-10-27',
      numero_guia: 'GUIA-OFICIAL-2026-001',
      rega_destino: 'ES450000000001'
    });

    // Comprobar que se persistieron 2 eventos de tipo 'movimiento'
    const movEvents = mockDB._stores.registro_eventos.filter(e => e.tipo === 'movimiento');
    assert.strictEqual(movEvents.length, 2);
    assert.strictEqual(movEvents[0].motivo_tarea, 'salida');
    assert.strictEqual(movEvents[0].fincaId, 1);
    assert.ok(movEvents[0].descripcion.includes('GUIA-OFICIAL-2026-001'));

    // Comprobar que AuditService.list() los muestra
    const logs = await AuditService.list({ fincaId: 1, limit: 10 });
    const logsMov = logs.filter(l => l.tipo === 'movimiento');
    assert.strictEqual(logsMov.length, 2);
  });

  await test('Ruta real: Aislamiento estricto por explotación en operaciones pecuarias', async () => {
    const mockDB = createMockDB();
    global.db = mockDB;
    AuditService._recentOperations.clear();

    let activeFinca = 1;
    const { Animales, Pesajes } = loadRealDomainModules({
      db: mockDB,
      Fincas: { getActiveId: async () => activeFinca }
    });

    // Operación en Finca 1
    activeFinca = 1;
    await Animales.save({
      numero_identificacion: 'ES111111111111',
      tipoAlta: 'Nacimiento',
      fincaId: 1,
      fecha_nacimiento: '2026-10-27'
    });

    // Operación en Finca 2
    activeFinca = 2;
    await Pesajes.registrar({
      fincaId: 2,
      entidad_id: 301,
      valor_neto: 510,
      unidad: 'kg',
      motivo_tarea: 'control'
    });

    // Consultar auditoría de Finca 1
    const logsFinca1 = await AuditService.list({ fincaId: 1, limit: 10 });
    assert.ok(logsFinca1.some(l => l.descripcion && l.descripcion.includes('ES111111111111')), 'Finca 1 debe ver su alta');
    assert.ok(!logsFinca1.some(l => l.valor_neto === 510), 'Finca 1 NO debe ver el pesaje de Finca 2');

    // Consultar auditoría de Finca 2
    const logsFinca2 = await AuditService.list({ fincaId: 2, limit: 10 });
    assert.ok(logsFinca2.some(l => l.valor_neto === 510), 'Finca 2 debe ver su pesaje');
    assert.ok(!logsFinca2.some(l => l.descripcion && l.descripcion.includes('ES111111111111')), 'Finca 2 NO debe ver el alta de Finca 1');
  });

  console.log(`\n========================================`);
  console.log(`RESULTADO FINAL: ${passed}/${total} PRUEBAS SUPERADAS`);
  console.log(`========================================\n`);
}

runTests().catch(err => {
  console.error('ERROR EN SUITE:', err);
  process.exit(1);
});
