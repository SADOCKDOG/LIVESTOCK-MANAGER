console.log("[DB] Cargando script db.js");
const DB_NAME = 'LivestockDB';
const DB_VERSION = 11;

async function initDB() {
    console.log('[DB] Ejecutando initDB...');

    if (!self.idb || !self.idb.openDB) {
        console.error("[DB] self.idb no detectado!");
        throw new Error('Librería de base de datos no encontrada (idb-local.js)');
    }

    const { openDB } = self.idb;
    console.log('[DB] Llamando a openDB...');

    return await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`[DB] Upgrade: v${oldVersion} -> v${newVersion}`);

            // v1: Estructura base
            if (oldVersion < 1) {
                if (!db.objectStoreNames.contains('fincas')) {
                    db.createObjectStore('fincas', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('rebanos')) {
                    const store = db.createObjectStore('rebanos', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('fincaId', 'fincaId');
                }
                if (!db.objectStoreNames.contains('animales')) {
                    const store = db.createObjectStore('animales', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('rebanoId', 'rebanoId');
                    store.createIndex('caravana', 'numero_identificacion', { unique: true });
                }
                if (!db.objectStoreNames.contains('produccion_carne')) {
                    const store = db.createObjectStore('produccion_carne', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('animalId', 'animalId');
                }
                if (!db.objectStoreNames.contains('produccion_leche')) {
                    db.createObjectStore('produccion_leche', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('ventas_ganado')) {
                    const store = db.createObjectStore('ventas_ganado', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('fincaId', 'fincaId');
                }
                if (!db.objectStoreNames.contains('sanitarios_ganado')) {
                    const store = db.createObjectStore('sanitarios_ganado', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('rebanoId', 'rebanoId');
                }
                if (!db.objectStoreNames.contains('gastos_ganaderia')) {
                    const store = db.createObjectStore('gastos_ganaderia', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('fincaId', 'fincaId');
                }
            }

            // v2: Configuración
            if (oldVersion < 2) {
                if (!db.objectStoreNames.contains('config_especies')) db.createObjectStore('config_especies', { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains('config_tipos_produccion')) db.createObjectStore('config_tipos_produccion', { keyPath: 'id', autoIncrement: true });
            }

            // v3: Comercialización mejorada
            if (oldVersion < 3) {
                if (!db.objectStoreNames.contains('comercializacion_carne')) {
                    const store = db.createObjectStore('comercializacion_carne', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('fincaId', 'fincaId');
                    store.createIndex('animalId', 'animalId');
                }
                if (!db.objectStoreNames.contains('comercializacion_leche')) {
                    const store = db.createObjectStore('comercializacion_leche', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('fincaId', 'fincaId');
                }
            }

            // v4: Metadatos y Migración
            if (oldVersion < 4) {
                if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
            }

            // v5: Registro Maestro de Eventos (Trazabilidad 360)
            if (oldVersion < 5) {
                if (!db.objectStoreNames.contains('registro_eventos')) {
                    const store = db.createObjectStore('registro_eventos', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('fincaId', 'fincaId');
                    store.createIndex('entidad_id', 'entidad_id');
                    store.createIndex('tipo_entidad', 'tipo_entidad');
                    store.createIndex('snap_zona', 'snap_zona');
                    store.createIndex('snap_tipo', 'snap_tipo');
                    store.createIndex('motivo_tarea', 'motivo_tarea');
                    store.createIndex('fecha', 'fecha');
                }
            }

            // v6: Módulo de Reproducción
            if (oldVersion < 6) {
                if (!db.objectStoreNames.contains('reproduccion_eventos')) {
                    const store = db.createObjectStore('reproduccion_eventos', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('fincaId', 'fincaId');
                    store.createIndex('animalId', 'animalId');
                    store.createIndex('tipo_evento', 'tipo_evento'); // celo, inseminacion, diagnostico, parto, aborto
                    store.createIndex('fecha', 'fecha');
                }
            }

            // v7: Índices adicionales para Módulo Lácteo
            if (oldVersion < 7) {
                const lecheStore = transaction.objectStore('comercializacion_leche');
                if (!lecheStore.indexNames.contains('comunidad_autonoma')) {
                    lecheStore.createIndex('comunidad_autonoma', 'comunidad_autonoma');
                }
                if (!lecheStore.indexNames.contains('fechaRecogida')) {
                    lecheStore.createIndex('fechaRecogida', 'fechaRecogida');
                }
                if (!lecheStore.indexNames.contains('contrato_numero')) {
                    lecheStore.createIndex('contrato_numero', 'contrato_numero');
                }
            }

            // v8: Compradores, Proveedores y Contratos
            if (oldVersion < 8) {
                if (!db.objectStoreNames.contains('compradores')) {
                    const store = db.createObjectStore('compradores', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('nif_cif', 'nif_cif', { unique: true });
                    store.createIndex('tipo_comprador', 'tipo_comprador');
                    store.createIndex('activo', 'activo');
                }
                if (!db.objectStoreNames.contains('proveedores')) {
                    const store = db.createObjectStore('proveedores', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('nif_cif', 'nif_cif', { unique: true });
                    store.createIndex('activo', 'activo');
                }
                if (!db.objectStoreNames.contains('contratos_compra')) {
                    const store = db.createObjectStore('contratos_compra', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('compradorId', 'compradorId');
                    store.createIndex('activo', 'activo');
                    store.createIndex('tipo', 'tipo');
                }
                // Añadir índices a stores existentes
                const carneStore = transaction.objectStore('comercializacion_carne');
                if (!carneStore.indexNames.contains('compradorId')) {
                    carneStore.createIndex('compradorId', 'compradorId');
                }
                if (!carneStore.indexNames.contains('contratoId')) {
                    carneStore.createIndex('contratoId', 'contratoId');
                }
                const lecheStore = transaction.objectStore('comercializacion_leche');
                if (!lecheStore.indexNames.contains('compradorId')) {
                    lecheStore.createIndex('compradorId', 'compradorId');
                }
                if (!lecheStore.indexNames.contains('contratoId')) {
                    lecheStore.createIndex('contratoId', 'contratoId');
                }
                const gastosStore = transaction.objectStore('gastos_ganaderia');
                if (!gastosStore.indexNames.contains('proveedorId')) {
                    gastosStore.createIndex('proveedorId', 'proveedorId');
                }
            }

            // v9: Transportistas, Documentos Legales y nuevos índices de trazabilidad
            if (oldVersion < 9) {
                // TRANSPORTISTAS
                if (!db.objectStoreNames.contains('transportistas')) {
                    const store = db.createObjectStore('transportistas', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('nif_cif', 'nif_cif', { unique: true });
                    store.createIndex('activo', 'activo');
                    store.createIndex('matricula', 'matricula');
                }

                // DOCUMENTOS LEGALES (DIMOE, Facturas, Certificados)
                if (!db.objectStoreNames.contains('documentos_legales')) {
                    const store = db.createObjectStore('documentos_legales', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('tipo', 'tipo');          // dimoe, factura, certificado, dib
                    store.createIndex('fincaId', 'fincaId');
                    store.createIndex('animalId', 'animalId');
                    store.createIndex('numero', 'numero', { unique: true });
                    store.createIndex('fecha_emision', 'fecha_emision');
                }

                // Nuevos índices en FINCAS
                const fincasStore = transaction.objectStore('fincas');
                if (!fincasStore.indexNames.contains('rega')) {
                    fincasStore.createIndex('rega', 'rega', { unique: true });
                }

                // Nuevos índices en ANIMALES
                const animalesStore = transaction.objectStore('animales');
                if (!animalesStore.indexNames.contains('dib')) {
                    animalesStore.createIndex('dib', 'dib', { unique: true });
                }
                if (!animalesStore.indexNames.contains('categoria')) {
                    animalesStore.createIndex('categoria', 'categoria');
                }
                if (!animalesStore.indexNames.contains('madre_id')) {
                    animalesStore.createIndex('madre_id', 'madre_id');
                }

                // Nuevos índices en COMERCIALIZACION_CARNE
                const carneStore = transaction.objectStore('comercializacion_carne');
                if (!carneStore.indexNames.contains('numero_albaran')) {
                    carneStore.createIndex('numero_albaran', 'numero_albaran', { unique: true });
                }
                if (!carneStore.indexNames.contains('dimoe')) {
                    carneStore.createIndex('dimoe', 'dimoe');
                }
                if (!carneStore.indexNames.contains('transportistaId')) {
                    carneStore.createIndex('transportistaId', 'transportistaId');
                }
                if (!carneStore.indexNames.contains('autorizacion_veterinaria')) {
                    carneStore.createIndex('autorizacion_veterinaria', 'autorizacion_veterinaria');
                }
            }

            // v11: SIGGAN — Notificaciones a REGA (migración desde localStorage)
            if (oldVersion < 11) {
                if (!db.objectStoreNames.contains('notificaciones_rega')) {
                    const store = db.createObjectStore('notificaciones_rega', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('animal_id', 'animal_id');
                    store.createIndex('finca_id', 'finca_id');
                    store.createIndex('fecha_notificacion', 'fecha_notificacion');
                    store.createIndex('estado_notificacion', 'estado_notificacion');
                }
            }

            // v10: SIGGAN — Movimientos oficiales inter-explotación y Saneamientos
            if (oldVersion < 10) {
                // MOVIMIENTOS DE GANADO (guía de origen y sanidad pecuaria)
                if (!db.objectStoreNames.contains('movimientos_ganado')) {
                    const store = db.createObjectStore('movimientos_ganado', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('fincaId', 'fincaId');
                    store.createIndex('tipo', 'tipo');                 // entrada | salida
                    store.createIndex('numero_guia', 'numero_guia');
                    store.createIndex('rega_origen', 'rega_origen');
                    store.createIndex('rega_destino', 'rega_destino');
                    store.createIndex('fecha', 'fecha');
                    store.createIndex('animalId', 'animalId', { multiEntry: true });
                }

                // SANEAMIENTOS (campañas oficiales: TBC, brucelosis, etc.)
                if (!db.objectStoreNames.contains('saneamientos')) {
                    const store = db.createObjectStore('saneamientos', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('fincaId', 'fincaId');
                    store.createIndex('campana', 'campana');
                    store.createIndex('fecha', 'fecha');
                    store.createIndex('calificacion', 'calificacion');
                }
            }
        },
    });
}

async function populateDefaults(db) {
    console.log("[DB] Verificando datos por defecto...");
    
    // Especies por defecto
    const especiesCount = await db.count('config_especies');
    if (especiesCount === 0) {
        const especies = [
            { nombre: 'Vacas', consumoAguaL: 60 },
            { nombre: 'Ovejas', consumoAguaL: 8 },
            { nombre: 'Cabras', consumoAguaL: 8 },
            { nombre: 'Cerdos', consumoAguaL: 12 }
        ];
        for (let e of especies) { await db.add('config_especies', { ...e, creadoEn: Date.now() }); }
    }

    // Tipos de producción por defecto
    const tiposCount = await db.count('config_tipos_produccion');
    if (tiposCount === 0) {
        const tipos = [
            { nombre: 'Cárnica' },
            { nombre: 'Láctea' },
            { nombre: 'Mixto' },
            { nombre: 'Ibérico' }
        ];
        for (let t of tipos) { await db.add('config_tipos_produccion', { ...t, creadoEn: Date.now() }); }
    }
}

/**
 * Migración v8: Extraer compradores y proveedores únicos de registros existentes
 * y crear entidades en los nuevos stores.
 */
async function migrarV8(windowDb) {
    try {
        console.log("[DB] Migración v8: compradores y proveedores...");

        // --- COMPRADORES desde comercializacion_carne ---
        const ventasCarne = await windowDb.getAll('comercializacion_carne');
        const paresUnicos = new Map();
        for (const v of ventasCarne) {
            const key = (v.nifComprador || '').trim().toUpperCase() || (v.razonSocial || '').trim().toLowerCase();
            if (!key) continue;
            if (!paresUnicos.has(key)) {
                paresUnicos.set(key, {
                    nif_cif: (v.nifComprador || '').trim(),
                    nombre: (v.razonSocial || '').trim(),
                    tipo_comprador: 'híbrido'
                });
            }
        }

        // Crear compradores si no existen por NIF
        for (const [_, datos] of paresUnicos) {
            if (!datos.nif_cif && !datos.nombre) continue;
            try {
                const existente = datos.nif_cif ? await windowDb.getFromIndex('compradores', 'nif_cif', datos.nif_cif.toUpperCase()).catch(() => null) : null;
                if (!existente) {
                    const newId = await windowDb.add('compradores', {
                        nombre: datos.nombre || datos.nif_cif || 'Comprador migrado',
                        nif_cif: (datos.nif_cif || '').toUpperCase(),
                        tipo_comprador: datos.tipo_comprador || 'híbrido',
                        activo: true,
                        creadoEn: new Date().toISOString(),
                        notas: 'Creado automáticamente desde registros de ventas existentes.'
                    });
                    // Asignar compradorId a las ventas de este comprador
                    for (const v of ventasCarne) {
                        const vKey = (v.nifComprador || '').trim().toUpperCase() || (v.razonSocial || '').trim().toLowerCase();
                        const dKey = (datos.nif_cif || '').toUpperCase() || (datos.nombre || '').trim().toLowerCase();
                        if (vKey === dKey) {
                            v.compradorId = newId;
                            await windowDb.put('comercializacion_carne', v);
                        }
                    }
                } else {
                    // Asignar compradorId a las ventas ya existentes
                    for (const v of ventasCarne) {
                        if (!v.compradorId) {
                            const vKey = (v.nifComprador || '').trim().toUpperCase() || (v.razonSocial || '').trim().toLowerCase();
                            const eKey = (existente.nif_cif || '').toUpperCase() || (existente.nombre || '').trim().toLowerCase();
                            if (vKey === eKey) {
                                v.compradorId = existente.id;
                                await windowDb.put('comercializacion_carne', v);
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn("[DB] Error migrando comprador:", e.message);
            }
        }

        // --- PROVEEDORES desde gastos_ganaderia ---
        const gastos = await windowDb.getAll('gastos_ganaderia');
        const proveedoresUnicos = new Map();
        for (const g of gastos) {
            const prov = (g.proveedor || '').trim();
            if (!prov) continue;
            const key = prov.toLowerCase();
            if (!proveedoresUnicos.has(key)) {
                proveedoresUnicos.set(key, prov);
            }
        }

        for (const [_, nombre] of proveedoresUnicos) {
            try {
                const existente = await windowDb.getFromIndex('proveedores', 'nif_cif', nombre.toUpperCase()).catch(() => null);
                if (!existente) {
                    const newId = await windowDb.add('proveedores', {
                        nombre: nombre,
                        nif_cif: '',
                        categorias: [],
                        activo: true,
                        creadoEn: new Date().toISOString(),
                        notas: 'Creado automáticamente desde registros de gastos existentes.'
                    });
                    for (const g of gastos) {
                        if ((g.proveedor || '').trim().toLowerCase() === nombre.toLowerCase() && !g.proveedorId) {
                            g.proveedorId = newId;
                            await windowDb.put('gastos_ganaderia', g);
                        }
                    }
                } else {
                    for (const g of gastos) {
                        if ((g.proveedor || '').trim().toLowerCase() === nombre.toLowerCase() && !g.proveedorId) {
                            g.proveedorId = existente.id;
                            await windowDb.put('gastos_ganaderia', g);
                        }
                    }
                }
            } catch (e) {
                console.warn("[DB] Error migrando proveedor:", e.message);
            }
        }

        // Marcar migración completada
        await windowDb.put('meta', { key: 'migracion_v8', value: true, migradoEn: new Date().toISOString() });
        console.log("[DB] Migración v8 completada.");
    } catch (e) {
        console.warn("[DB] Error en migración v8:", e);
    }
}

/**
 * Migración v9: Asignar números de albarán secuenciales a registros existentes
 * y crear documentos_legales DIMOE para ventas sin ellos.
 */
async function migrarV9(windowDb) {
    try {
        console.log("[DB] Migración v9: albaranes y documentos legales...");

        const ventasCarne = await windowDb.getAll('comercializacion_carne');
        const metaSerie = await windowDb.get('meta', 'contador_albaran').catch(() => null);
        let contador = metaSerie ? (metaSerie.valor || 0) : 0;
        const year = new Date().getFullYear();

        for (const v of ventasCarne) {
            if (!v.numero_albaran) {
                contador++;
                v.numero_albaran = `${year}-${String(contador).padStart(4, '0')}`;
                await windowDb.put('comercializacion_carne', v);
            }
        }

        await windowDb.put('meta', { key: 'contador_albaran', valor: contador, actualizadoEn: new Date().toISOString() });

        // --- Crear documentos_legales (DIMOE) ---
        const docsExistentes = await windowDb.getAll('documentos_legales').catch(() => []);
        const dimoeExistentes = new Set(docsExistentes.filter(d => d.tipo === 'dimoe').map(d => d.ventaId));

        let dimoeContador = 0;
        for (const v of ventasCarne) {
            if (!v.numero_albaran) continue;
            if (dimoeExistentes.has(v.id)) continue;

            dimoeContador++;
            const finca = await windowDb.get('fincas', Number(v.fincaId)).catch(() => null);
            const dimoe = {
                tipo: 'dimoe',
                ventaId: v.id,
                animalId: v.animalId || null,
                fincaId: v.fincaId || null,
                numero: `DIMOE-${v.numero_albaran}`,
                fecha_emision: v.fechaSacrificio || new Date().toISOString().split('T')[0],
                origen_rega: finca?.codigo_REGA || finca?.rega || '',
                destino: v.codigoMatadero || '',
                motivo: 'sacrificio',
                created_at: new Date().toISOString()
            };
            await windowDb.add('documentos_legales', dimoe).catch(() => {});
        }

        await windowDb.put('meta', { key: 'migracion_v9', value: true, migradoEn: new Date().toISOString() });
        console.log("[DB] Migración v9 completada.");
    } catch (e) {
        console.warn("[DB] Error en migración v9:", e);
    }
}

console.log("[DB] Iniciando window.dbPromise...");
const dbTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT: IndexedDB no respondió en 15s')), 15000));
window.dbPromise = Promise.race([initDB(), dbTimeout]).then(async database => {
    window.db = database;
    await populateDefaults(database);
    // Ejecutar migración v8 si no se ha ejecutado antes
    try {
        const meta = await database.get('meta', 'migracion_v8');
        if (!meta) {
            await migrarV8(database);
        }
    } catch (e) {
        // La meta store puede no existir si es primera ejecución
        console.log("[DB] Primera ejecución o store meta no disponible aún.");
    }

    // Ejecutar migración v9 si no se ha ejecutado antes
    try {
        const metaV9 = await database.get('meta', 'migracion_v9');
        if (!metaV9) {
            await migrarV9(database);
        }
    } catch (e) {
        console.log("[DB] Primera ejecución o store meta no disponible aún.");
    }

    console.log("[DB] Inicialización completada con éxito.");
    return database;
}).catch(err => {
    console.error("[DB] ERROR CRÍTICO:", err);
    // Intentar mostrar el error en pantalla si el DOM está listo
    const msg = "Error Base de Datos: " + err.message;
    if (document.getElementById('app-content')) {
        document.getElementById('app-content').innerHTML = `<div style="color:red; padding:20px; background:black; border:1px solid red;">${msg}</div>`;
    }
    throw err;
});
