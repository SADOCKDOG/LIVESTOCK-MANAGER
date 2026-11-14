const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'error-handler.js'), 'utf8');

function createErrorHandler(especieId, tipoIdentificadorId, formato) {
  const window = {
    db: {
      async getAllFromIndex(_store, _index, especie) {
        assert.equal(Number(especie), especieId);
        return [{ especieId, tipoIdentificadorId, formato }];
      },
    },
  };
  vm.runInNewContext(source, { window, console, Date });
  return window.ErrorHandler;
}

test('porcino ordinario acepta el codigo REGA ES + 12 cifras', async () => {
  const handler = createErrorHandler(2, 16, 'porcino_marca_explotacion');
  assert.equal(await handler.validateCrotal('ES123456789029', 2, 16), 'ES123456789029');
});

test('porcino ordinario rechaza estructura antigua con siglas provinciales', async () => {
  const handler = createErrorHandler(2, 16, 'porcino_marca_explotacion');
  await assert.rejects(handler.validateCrotal('123AB4567', 2, 16), (error) => {
    assert.match(error.message, /REGA/i);
    assert.match(error.message, /12 cifras/);
    return error.details.field === 'numero_identificacion';
  });
});

test('porcino ordinario requiere prefijo ES', async () => {
  const handler = createErrorHandler(2, 16, 'porcino_marca_explotacion');
  await assert.rejects(handler.validateCrotal('123456789029', 2, 16));
});

test('una asociación multicaso exige elegir explícitamente el caso', async () => {
  const association = {
    especieId: 2,
    tipoIdentificadorId: 16,
    requiereCaso: true,
    casos: [{ id: 'ordinario', formato: 'porcino_marca_explotacion' }],
  };
  const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'error-handler.js'), 'utf8');
  const window = { db: { async getAllFromIndex() { return [association]; } } };
  vm.runInNewContext(source, { window, console, Date });
  await assert.rejects(window.ErrorHandler.validateCrotal('ES123456789029', 2, 16), (error) => {
    assert.match(error.message, /caso/i);
    assert.equal(error.details.field, 'casoIdentificacion');
    return true;
  });
});

test('una asociación multicaso valida con el formato del caso elegido', async () => {
  const association = {
    especieId: 2,
    tipoIdentificadorId: 16,
    requiereCaso: true,
    casos: [{ id: 'ordinario', formato: 'porcino_marca_explotacion' }],
  };
  const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'error-handler.js'), 'utf8');
  const window = { db: { async getAllFromIndex() { return [association]; } } };
  vm.runInNewContext(source, { window, console, Date });
  assert.equal(
    await window.ErrorHandler.validateCrotal('ES123456789029', 2, 16, { casoIdentificacion: 'ordinario' }),
    'ES123456789029'
  );
});

test('una regla multicaso sin formato configurado no acepta el valor como texto libre', async () => {
  const association = {
    especieId: 2,
    tipoIdentificadorId: 16,
    casos: [{ id: 'sanitario', formato: 'formato_no_configurado' }],
  };
  const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'error-handler.js'), 'utf8');
  const window = { db: { async getAllFromIndex() { return [association]; } } };
  vm.runInNewContext(source, { window, console, Date });
  await assert.rejects(
    window.ErrorHandler.validateCrotal('ES123456789029', 2, 16, { casoIdentificacion: 'sanitario' }),
    (error) => error.details.field === 'formato' && /pendiente de configuración/i.test(error.message)
  );
});

test('la normalizacion porcino recorta y convierte a mayusculas', async () => {
  const handler = createErrorHandler(2, 16, 'porcino_marca_explotacion');
  assert.equal(await handler.validateCrotal(' es123456789029 ', 2, 16), 'ES123456789029');
});

test('bovino conserva compatibilidad con ES + 12 cifras heredadas', async () => {
  const handler = createErrorHandler(1, 16, 'bovino_fisico');
  assert.equal(
    await handler.validateCrotal('ES123456789029', 1, 16, { fecha_nacimiento: '2022-01-01' }),
    'ES123456789029'
  );
});

test('bovino nacido desde el corte exige el código visual nuevo y el transpondedor vinculado', async () => {
  const handler = createErrorHandler(1, 16, 'bovino_fisico');
  const codigoVisual = 'ES220112345678';
  const rfid = '10020000724220112345678';
  assert.equal(
    await handler.validateCrotal(codigoVisual, 1, 16, {
      fecha_nacimiento: '2026-01-01',
      tipo_identificacion: 'Completa (EID + Visual)',
      rfid_codigo: rfid,
    }),
    codigoVisual
  );
});

test('bovino con fecha de nacimiento ausente no permite inferir el régimen', async () => {
  const handler = createErrorHandler(1, 16, 'bovino_fisico');
  await assert.rejects(
    handler.validateCrotal('ES123456789029', 1, 16),
    (error) => error.details.field === 'fecha_nacimiento' && error.details.required === true
  );
});

test('bovino nacido desde el corte rechaza el código visual convencional antiguo', async () => {
  const handler = createErrorHandler(1, 16, 'bovino_fisico');
  await assert.rejects(
    handler.validateCrotal('ES123456789029', 1, 16, {
      fecha_nacimiento: '2025-06-30',
      tipo_identificacion: 'Completa (EID + Visual)',
      rfid_codigo: '10020000724220112345678',
    }),
    (error) => error.details.field === 'numero_identificacion' && /22/.test(error.message)
  );
});

test('bovino moderno rechaza un código de comunidad autónoma inexistente', async () => {
  const handler = createErrorHandler(1, 16, 'bovino_fisico');
  await assert.rejects(
    handler.validateCrotal('ES220012345678', 1, 16, {
      fecha_nacimiento: '2025-06-30',
      tipo_identificacion: 'Completa (EID + Visual)',
      rfid_codigo: '10020000724220012345678',
    }),
    (error) => error.details.field === 'numero_identificacion' && /01-19/.test(error.message)
  );
});

test('bovino nacido desde el corte requiere identificador electrónico', async () => {
  const handler = createErrorHandler(1, 16, 'bovino_fisico');
  await assert.rejects(
    handler.validateCrotal('ES220112345678', 1, 16, {
      fecha_nacimiento: '2025-06-30',
      tipo_identificacion: 'Completa (EID + Visual)',
    }),
    (error) => error.details.field === 'rfid_codigo' && error.details.required === true
  );
});

test('bovino valida que la porción regional e individual del chip corresponda al código visual', async () => {
  const handler = createErrorHandler(1, 16, 'bovino_fisico');
  await assert.rejects(
    handler.validateCrotal('ES220112345678', 1, 16, {
      fecha_nacimiento: '2025-06-30',
      tipo_identificacion: 'Completa (EID + Visual)',
      rfid_codigo: '10020000724220887654321',
    }),
    (error) => error.details.field === 'rfid_codigo'
  );
});

test('ovino/caprino usa el código vigente ES + especie 24 + región + 8 cifras individuales', async () => {
  const handler = createErrorHandler(3, 4, 'ovino_caprino_eid');
  assert.equal(await handler.validateCrotal('ES240112345678', 3, 4), 'ES240112345678');
});

test('ovino/caprino rechaza el código anterior para una identificación nueva', async () => {
  const handler = createErrorHandler(3, 4, 'ovino_caprino_eid');
  await assert.rejects(handler.validateCrotal('ES011234567890', 3, 4), (error) => {
    assert.match(error.message, /24/);
    assert.match(error.message, /8/);
    return error.details.field === 'numero_identificacion';
  });
});

test('ovino/caprino rechaza una comunidad autónoma no codificada', async () => {
  const handler = createErrorHandler(3, 4, 'ovino_caprino_eid');
  await assert.rejects(handler.validateCrotal('ES240012345678', 3, 4));
});

test('la ayuda equina no confunde el formato local de 15 cifras con UELN o transpondedor', () => {
  const handler = createErrorHandler(5, 3, 'equino_microchip');
  const ayuda = handler.CROTAL_FORMATOS.equino_microchip.ayuda;
  assert.match(ayuda, /formato local actual: 15 cifras/i);
  assert.match(ayuda, /UELN y código del transpondedor son datos distintos/i);
  assert.doesNotMatch(ayuda, /microchip equino UELN/i);
});

test('la ayuda de la ficha toma longitud y mensaje de la misma regla del guardado', () => {
  const handler = createErrorHandler(2, 16, 'porcino_marca_explotacion');
  const window = { ErrorHandler: handler };
  const sourceView = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'animales-view.js'), 'utf8');
  const context = {
    window,
    document: {
      getElementById(id) {
        if (id === 'a-especie') return { selectedOptions: [{ dataset: { especieId: '2' } }] };
        if (id === 'a-tipo-crotal-oficial') return { value: '16' };
        return null;
      },
    },
  };
  vm.runInNewContext(sourceView, context);
  const view = window.AnimalesView;
  view._especieTipoIdentificadorCache = [{ especieId: 2, tipoIdentificadorId: 16, formato: 'porcino_marca_explotacion' }];

  const { config, formato } = view._getFormatoCrotalActual();
  assert.equal(config.maxLength, 14);
  assert.equal(config.placeholder, 'ES + 12 cifras REGA');
  assert.match(config.ayuda, /explotación de nacimiento/i);
  assert.equal(formato.regex.test('ES123456789029'), true);
});
