const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const animalesSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'animales.js'), 'utf8');
const movimientosSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'movimientos.js'), 'utf8');

function createDB(seed = {}) {
  const stores = Object.fromEntries(Object.entries(seed).map(([name, rows]) => [name, new Map(rows.map(row => [Number(row.id), { ...row }]))]));
  const nextIds = { animales: 20, contextos_identificacion: 50, movimientos_ganado: 70 };
  return {
    stores,
    async get(store, id) { return stores[store]?.get(Number(id)) || null; },
    async getAllFromIndex(store, index, value) { return [...(stores[store]?.values() || [])].filter(row => Number(row[index]) === Number(value)); },
    async getAll(store) { return [...(stores[store]?.values() || [])]; },
    async put(store, row) { stores[store] ||= new Map(); stores[store].set(Number(row.id), { ...row }); },
    async add(store, row) { stores[store] ||= new Map(); const id = row.id == null ? nextIds[store]++ : Number(row.id); stores[store].set(id, { ...row, id }); return id; },
    async delete(store, id) { stores[store]?.delete(Number(id)); },
  };
}

function loadMovimientos(db, configuracion = null) {
  const window = { db, EventBus: { emit() {} } };
  if (configuracion) {
    window.ComunidadesService = {
      normalizarREGA: (value) => value,
      validarFormatoREGA: () => ({ valido: true }),
      getConfiguracionCCAA: () => configuracion,
    };
  }
  const ErrorHandler = { async tryAsync(operation) { return operation(); } };
  vm.runInNewContext(movimientosSource, { window, ErrorHandler, console, Date, Number, String, Array });
  window.Movimientos._registrarEventos = async () => {};
  return window.Movimientos;
}

const contexto = (overrides = {}) => ({
  id: 3, animalId: 9, fincaId: 1, tipo: 'equino_crotal_boton',
  estado: 'planificado', regaNacimiento: 'ES010000000001',
  regaOrigen: 'ES010000000001', regaDestinoMatadero: 'ES010000000002', ...overrides,
});
const guia = (overrides = {}) => ({
  tipo: 'salida', motivo: 'matadero', fincaId: 1, animalId: [9], num_animales: 1,
  rega_origen: 'ES010000000001', rega_destino: 'ES010000000002', crotales: ['EQ-9'],
  fecha: '2026-11-15', estado_tramite: 'borrador', ...overrides,
});

test('un borrador planificado en comunidad que exige desinsectación se guarda sin certificarla', async () => {
  const db = createDB({ contextos_identificacion: [contexto()] });
  const movimientos = loadMovimientos(db, { requiere_desinsectacion_movimiento: true });
  const id = await movimientos.save(guia({ comunidad_autonoma: 'Andalucía' }));
  assert.ok(id);
  assert.equal((await db.get('movimientos_ganado', id)).desinsectacion_certificada, false);
});

test('una guía planificada presentada mantiene el requisito de certificado', async () => {
  const db = createDB();
  const movimientos = loadMovimientos(db, { requiere_desinsectacion_movimiento: true });
  await assert.rejects(movimientos.save(guia({ comunidad_autonoma: 'Andalucía', estado_tramite: 'presentado', fecha_presentacion: '2026-11-17' })), /certificar la desinsectación/);
});

test('una guía declarada como ejecutada exige certificado en la comunidad configurada', async () => {
  const db = createDB();
  const movimientos = loadMovimientos(db, { requiere_desinsectacion_movimiento: true });
  await assert.rejects(movimientos.save(guia({ comunidad_autonoma: 'Andalucía', estado_traslado: 'ejecutado' })), /certificar la desinsectación/);
});

test('la guía coincidente enlaza el plan equino y mantiene el estado planificado', async () => {
  const db = createDB({ contextos_identificacion: [contexto()] });
  const movimientos = loadMovimientos(db);
  const id = await movimientos.save(guia());
  const saved = await db.get('contextos_identificacion', 3);
  assert.equal(saved.guiaMovimientoId, id);
  assert.equal(saved.estado, 'planificado');
});

test('la guía no enlaza si no coincide animal, tipo, motivo u origen/destino REGA', async () => {
  for (const override of [
    { animalId: [10] }, { tipo: 'entrada' }, { motivo: 'pasto' },
    { rega_origen: 'ES010000000099' }, { rega_destino: 'ES010000000099' },
  ]) {
    const db = createDB({ contextos_identificacion: [contexto()] });
    await loadMovimientos(db).save(guia(override));
    assert.equal((await db.get('contextos_identificacion', 3)).guiaMovimientoId, undefined);
  }
});

test('solo la declaración explícita de traslado ejecutado cierra el plan como ejecutado', async () => {
  const db = createDB({ contextos_identificacion: [contexto()] });
  await loadMovimientos(db).save(guia({ estado_traslado: 'ejecutado' }));
  assert.equal((await db.get('contextos_identificacion', 3)).estado, 'ejecutado');
});

test('anular una guía enlazada cancela el plan equino', async () => {
  const db = createDB({ contextos_identificacion: [contexto()] });
  const movimientos = loadMovimientos(db);
  const id = await movimientos.save(guia());
  await movimientos.delete(id);
  assert.equal((await db.get('contextos_identificacion', 3)).estado, 'cancelado');
});

test('un fallo posterior a la escritura del contexto compensa contexto y animal', async () => {
  const animal = { id: 9, numero_identificacion: 'EQ-9', especieId: 5, tipoIdentificadorId: 4, especie: 'Équidos', estado: 'activo' };
  const initialContext = contexto({ regaDestinoMatadero: 'ES010000000003' });
  const db = createDB({ animales: [animal], contextos_identificacion: [initialContext] });
  const window = { db };
  const ErrorHandler = { async tryAsync(operation) { return operation(); }, async validateCrotal() {} };
  vm.runInNewContext(animalesSource, { window, ErrorHandler, console, Date, Number, String, Set, Array, Object });
  window.Animales._registrarEventoCenso = async () => {};
  await assert.rejects(window.Animales.save({ ...animal, notas: 'modificado' }, {
    afterPersist: async (_id, _data, registerRollback) => {
      await db.put('contextos_identificacion', contexto({ regaDestinoMatadero: 'ES010000000002' }));
      registerRollback(() => db.put('contextos_identificacion', initialContext));
      throw new Error('fallo inyectado después de guardar el contexto');
    },
  }), /fallo inyectado/);
  assert.equal((await db.get('animales', 9)).notas, undefined);
  assert.equal((await db.get('contextos_identificacion', 3)).regaDestinoMatadero, 'ES010000000003');
});

test('las fichas equinas heredadas con identificador sin cambios se pueden editar', async () => {
  const animal = { id: 9, numero_identificacion: 'ES010123456789', especie: 'Équidos', especieId: 5, tipoIdentificadorId: 3, estado: 'activo' };
  const db = createDB({ animales: [animal] });
  const window = { db };
  const ErrorHandler = { async tryAsync(operation) { return operation(); }, async validateCrotal() { throw new Error('no debe revalidarse'); } };
  vm.runInNewContext(animalesSource, { window, ErrorHandler, console, Date, Number, String, Set, Array, Object });
  window.Animales._registrarEventoCenso = async () => {};
  await window.Animales.save({ ...animal, notas: 'edición heredada' });
  assert.equal((await db.get('animales', 9)).numero_identificacion, animal.numero_identificacion);
  assert.equal((await db.get('animales', 9)).notas, 'edición heredada');
});


test('aceptar el trámite no declara por sí mismo ejecutado el traslado', async () => {
  const db = createDB({ contextos_identificacion: [contexto()] });
  await loadMovimientos(db).save(guia({ estado_tramite: 'aceptado', fecha_presentacion: '2026-11-15', numero_registro_oficial: 'REG-1', acuse_recibo: 'REC-1' }));
  assert.equal((await db.get('contextos_identificacion', 3)).estado, 'planificado');
});

test('una nueva guía coincidente conserva la trazabilidad de la guía sustituida', async () => {
  const db = createDB({ contextos_identificacion: [contexto({ guiaMovimientoId: 69 })] });
  const id = await loadMovimientos(db).save(guia());
  const saved = await db.get('contextos_identificacion', 3);
  assert.equal(saved.guiaMovimientoId, id);
  assert.deepEqual(Array.from(saved.guiasSustituidas), [69]);
});

test('cancelar explícitamente la guía cancela el plan enlazado', async () => {
  const db = createDB({ contextos_identificacion: [contexto()] });
  await loadMovimientos(db).save(guia({ estado_traslado: 'cancelado' }));
  assert.equal((await db.get('contextos_identificacion', 3)).estado, 'cancelado');
});

test('al cambiar el caso equino a otra identificación se cancela el contexto planificado', async () => {
  const animal = { id: 9, numero_identificacion: 'EQ-9', especieId: 5, tipoIdentificadorId: 4, especie: 'Équidos', estado: 'activo' };
  const initialContext = contexto({ guiaMovimientoId: 77 });
  const db = createDB({ animales: [animal], contextos_identificacion: [initialContext] });
  const window = { db };
  const document = { getElementById() { return null; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'animales-view.js'), 'utf8'), { window, document, console, Date, Number, String, Object });
  const view = window.AnimalesView;
  const compensaciones = [];

  await view._invalidarContextoCrotalEquino(9, (_fn) => compensaciones.push(_fn));

  const saved = await db.get('contextos_identificacion', 3);
  assert.equal(saved.estado, 'cancelado');
  assert.equal(saved.guiaMovimientoId, 77);
  assert.match(saved.motivoCancelacion, /identificación/i);
  await compensaciones[0]();
  assert.equal((await db.get('contextos_identificacion', 3)).estado, 'planificado');
});

test('un alta revertida por fallo contextual no deja pesaje ni eventos del censo', async () => {
  const db = createDB();
  const eventos = [];
  const pesajes = [];
  const window = { db, EventBus: { emit: (...args) => eventos.push(args) } };
  const ErrorHandler = { async tryAsync(operation) { return operation(); }, async validateCrotal() {} };
  const Pesajes = { async registrar(entry) { pesajes.push(entry); } };
  vm.runInNewContext(animalesSource, { window, ErrorHandler, Pesajes, console, Date, Number, String, Set, Array, Object });
  window.Animales._registrarEventoCenso = async (_edit, animal) => {
    await db.add('registro_eventos', { entidad_id: animal.id, tipo: 'alta' });
  };

  await assert.rejects(window.Animales.save({ numero_identificacion: 'EQ-20', peso_inicial: 300 }, {
    afterPersist: async () => { throw new Error('fallo al guardar contexto'); },
  }), /fallo al guardar contexto/);

  assert.equal((await db.getAll('animales')).length, 0);
  assert.equal(pesajes.length, 0);
  assert.equal((await db.getAll('registro_eventos')).length, 0);
  assert.equal(eventos.length, 0);
});
