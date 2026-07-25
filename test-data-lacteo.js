/**
 * Script de Datos de Prueba - Módulo Lácteo
 * Ejecutar desde la consola del navegador en la página de Livestock Manager
 */

(async function() {
    console.log(' Iniciando carga de datos de prueba para módulo lácteo...');

    try {
        // 1. Verificar que hay una finca activa
        const fincas = await window.db.getAll('fincas');
        if (fincas.length === 0) {
            console.error('❌ No hay fincas creadas. Crea una finca primero.');
            return;
        }

        const fincaId = fincas[0].id;
        console.log(`✅ Finca encontrada: ID ${fincaId}`);

        // 2. Crear tanques de leche
        console.log(' Creando tanques de leche...');
        
        const tanque1 = await window.db.add('tanques_leche', {
            fincaId: fincaId,
            nombre: 'TANQUE PRINCIPAL',
            codigo_letra_q: 'T-21-00123',
            capacidad_litros: 6000,
            tipo: 'tanque_frio',
            estado: 'activo',
            temperatura_objetivo: 4,
            temperatura_actual: 3.5,
            ultima_limpieza: '2024-01-15',
            proxima_limpieza: '2024-07-15',
            creadoEn: new Date().toISOString()
        });
        console.log(`✅ Tanque 1 creado: ID ${tanque1}`);

        const tanque2 = await window.db.add('tanques_leche', {
            fincaId: fincaId,
            nombre: 'TANQUE SECUNDARIO',
            codigo_letra_q: 'T-21-00124',
            capacidad_litros: 3000,
            tipo: 'tanque_frio',
            estado: 'activo',
            temperatura_objetivo: 4,
            temperatura_actual: 4.2,
            ultima_limpieza: '2024-01-20',
            proxima_limpieza: '2024-07-20',
            creadoEn: new Date().toISOString()
        });
        console.log(`✅ Tanque 2 creado: ID ${tanque2}`);

        // 3. Crear registros de ordeño (entradas al tanque)
        console.log(' Creando registros de ordeño...');
        
        const hoy = new Date();
        const fechas = [];
        for (let i = 0; i < 7; i++) {
            const fecha = new Date(hoy);
            fecha.setDate(hoy.getDate() - i);
            fechas.push(fecha.toISOString().split('T')[0]);
        }

        // Ordeños para los últimos 7 días (AM y PM)
        for (let i = 0; i < fechas.length; i++) {
            // Ordeño AM
            const ordeñoAM = 650 + Math.floor(Math.random() * 100);
            await window.db.add('balance_lacteo', {
                fincaId: fincaId,
                tanqueId: tanque1,
                tipo_movimiento: 'entrada',
                fecha: fechas[i] + 'T06:30:00',
                cantidad_litros: ordeñoAM,
                referencia_tipo: 'produccion_leche',
                turno: 'AM',
                temperatura: 3.5 + Math.random(),
                creadoEn: new Date().toISOString()
            });

            // Ordeño PM
            const ordeñoPM = 620 + Math.floor(Math.random() * 100);
            await window.db.add('balance_lacteo', {
                fincaId: fincaId,
                tanqueId: tanque1,
                tipo_movimiento: 'entrada',
                fecha: fechas[i] + 'T18:30:00',
                cantidad_litros: ordeñoPM,
                referencia_tipo: 'produccion_leche',
                turno: 'PM',
                temperatura: 3.8 + Math.random(),
                creadoEn: new Date().toISOString()
            });

            console.log(`✅ Ordeño ${fechas[i]}: AM=${ordeñoAM}L, PM=${ordeñoPM}L`);
        }

        // 4. Crear comercializaciones (salidas del tanque)
        console.log('🚛 Creando comercializaciones...');
        
        // Crear un comprador de ejemplo si no existe
        const compradores = await window.db.getAll('compradores');
        let compradorId;
        if (compradores.length > 0) {
            compradorId = compradores[0].id;
        } else {
            compradorId = await window.db.add('compradores', {
                nombre: 'Lácteos La Serena SA',
                nif_cif: 'B12345678',
                tipo_comprador: 'leche',
                activo: true,
                creadoEn: new Date().toISOString()
            });
            console.log(`✅ Comprador creado: ID ${compradorId}`);
        }

        // Crear 3 comercializaciones en los últimos 7 días
        for (let i = 0; i < 3; i++) {
            const fechaRecogida = fechas[i * 2];
            const cantidad = 2400 + Math.floor(Math.random() * 400);
            
            const comercializacionId = await window.db.add('comercializacion_leche', {
                fincaId: fincaId,
                compradorId: compradorId,
                fechaRecogida: fechaRecogida,
                cantidad: cantidad,
                matriculaCisterna: `ABC-${1234 + i}`,
                temperatura: 3.8 + Math.random() * 0.5,
                certificadoInhibidores: true,
                estadoAnalitica: 'Validado',
                // Nuevos campos RD 989/2022
                nif_tomador_muestra: '12345678Z',
                resultado_inhibidores_in_situ: i % 5 === 0 ? 'no_conforme' : 'conforme',
                tipo_movimiento_letra_q: 'explotacion_a_cisterna',
                agente_recogida_nif: null,
                agente_destino_nif: null,
                estado_letra_q: 'pendiente',
                creadoEn: new Date().toISOString()
            });

            // Crear analítica asociada
            await window.db.add('analiticas_leche', {
                fincaId: fincaId,
                comercializacionId: comercializacionId,
                tanqueId: tanque1,
                fecha_muestreo: fechaRecogida,
                tipo_muestreo: 'autocontrol',
                laboratorio_nombre: 'CICAP',
                grasa: 3.5 + Math.random() * 0.5,
                proteina: 3.2 + Math.random() * 0.4,
                extracto_seco: 6.7 + Math.random() * 0.9,
                germenes_30C: 40000 + Math.floor(Math.random() * 50000),
                celulas_somaticas: 150000 + Math.floor(Math.random() * 100000),
                inhibidores: false,
                antibioticos_detectados: false,
                aflatoxina_m1: 10 + Math.random() * 15,
                estado: 'validado',
                creadoEn: new Date().toISOString()
            });

            // Registrar salida del balance
            await window.db.add('balance_lacteo', {
                fincaId: fincaId,
                tanqueId: tanque1,
                tipo_movimiento: 'salida',
                fecha: fechaRecogida + 'T10:00:00',
                cantidad_litros: cantidad,
                referencia_tipo: 'comercializacion_leche',
                referencia_id: comercializacionId,
                creadoEn: new Date().toISOString()
            });

            console.log(`✅ Comercialización ${fechaRecogida}: ${cantidad}L`);
        }

        console.log('✅ Datos de prueba cargados exitosamente!');
        console.log(' Refresca la página para ver los datos en el dashboard.');
        
        // Mostrar resumen
        const balanceTotal = await window.db.getAll('balance_lacteo');
        const entradas = balanceTotal.filter(b => b.tipo_movimiento === 'entrada')
            .reduce((sum, b) => sum + b.cantidad_litros, 0);
        const salidas = balanceTotal.filter(b => b.tipo_movimiento === 'salida')
            .reduce((sum, b) => sum + b.cantidad_litros, 0);
        
        console.log(`\n📊 RESUMEN:`);
        console.log(`   Total entradas: ${entradas.toFixed(2)} L`);
        console.log(`   Total salidas: ${salidas.toFixed(2)} L`);
        console.log(`   Stock actual: ${(entradas - salidas).toFixed(2)} L`);

    } catch (error) {
        console.error('❌ Error cargando datos:', error);
    }
})();
