/**
 * Datos demo "CHAMORRO" — Livestock Manager
 * Se carga BAJO DEMANDA desde el asistente de configuración
 * (botón "Cargar Demo CHAMORRO"). No se auto-ejecuta.
 *
 * NOTA: en este proyecto los módulos *.save() devuelven el ID (número),
 * no el objeto. Por eso aquí reconstruimos el objeto con
 * Object.assign({ id: idDevuelto }, definicion) para poder encadenar.
 */
(function () {
  'use strict';

  var DEMO_FINCA = {
    nombre: 'Ganadería CHAMORRO (DEMO)',
    propietario: 'Familia Chamorro',
    direccion: 'Ctra. EX-203, Km 15, Parcela 42',
    telefonoContacto: '+34 654 123 456',
    nif_cif: 'B12345678',
    email: 'demo.chamorro@example.com',
    rega: 'ES-10-123456-789',
    cea: 'BA-12345-67',
    adsg_nombre: 'ADSG Tierra de Barros',
    comunidad_autonoma: 'Extremadura',
    tipo_explotacion: 'Mixto',
    sistema_explotacion: 'Semiextensivo',
    zonas: [
      { nombre: 'Parcela Norte 42ha', superficieGrafica: 42, superficie: 42, aforoMax: 200, aforo_maximo: 200, usoPrincipal: 'Pasto', uso: 'Pasto', localizacion: 'Pasto principal de vacuno', descripcion: 'Pasto principal de vacuno' },
      { nombre: 'Parcela Sur 28ha', superficieGrafica: 28, superficie: 28, aforoMax: 150, aforo_maximo: 150, usoPrincipal: 'Barbecho', uso: 'Barbecho', localizacion: 'Rotación y barbecho', descripcion: 'Rotación y barbecho' },
      { nombre: 'Pastos Este 15ha', superficieGrafica: 15, superficie: 15, aforoMax: 250, aforo_maximo: 250, usoPrincipal: 'Pasto', uso: 'Pasto', localizacion: 'Pastos de ovino', descripcion: 'Pastos de ovino' }
    ]
  };

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function showToast(msg, bg) {
    var toast = document.getElementById('toast-container');
    if (toast) {
      var el = document.createElement('div');
      el.style.cssText = 'background:' + (bg || '#d97706') + ';color:#fff;padding:12px;border-radius:12px;margin-bottom:8px;font-weight:700;';
      el.textContent = msg;
      toast.appendChild(el);
    }
    console.log('[SEED]', msg);
  }

  async function seedDatabase(force) {
    try {
      if (!force && localStorage.getItem('seed_data_completed') === 'true') {
        console.log('[SEED] Ya seedeado');
        return;
      }

      var existing = await Fincas.list();
      if (existing && existing.length > 0) {
        showToast('Ya hay datos en la app; la demo no se carga para no sobrescribir.', '#ef4444');
        return;
      }

      showToast('Cargando datos demo CHAMORRO...');

      // 1. Finca (crearNueva devuelve el id y la deja activa)
      var fincaId = await Fincas.crearNueva(DEMO_FINCA);
      await sleep(400);
      console.log('[SEED] Finca creada:', fincaId);

      // 2. Rebaños
      var rebDefs = [
        { nombre: 'Vacas Frisonas', tipo: 'Madres', especie: 'Vacas', zonaActual: 'Parcela Norte 42ha', capacidad_total: 50, fincaId: fincaId },
        { nombre: 'Terneros Cebo', tipo: 'Cebo', especie: 'Vacas', zonaActual: 'Parcela Norte 42ha', capacidad_total: 30, fincaId: fincaId },
        { nombre: 'Ovejas Merinas', tipo: 'Madres', especie: 'Ovejas', zonaActual: 'Pastos Este 15ha', capacidad_total: 200, fincaId: fincaId }
      ];
      var rebs = [];
      for (var i = 0; i < rebDefs.length; i++) {
        var rid = await Rebanos.save(rebDefs[i]);
        rebs.push(Object.assign({ id: rid }, rebDefs[i]));
        await sleep(120);
      }
      var rebVacas = rebs[0], rebTerneros = rebs[1], rebOvejas = rebs[2];

      // 3. Animales (rebanoId asignado directamente en la definición)
      var animDefs = [
        { numero_identificacion: 'ES123456789012', especie: 'Vacas', tipo: 'Vaca Frisona', estado: 'activo', fecha_nacimiento: '2021-03-15', sexo: 'Hembra', raza: 'Frisona', peso_inicial: 580, rebanoId: rebVacas.id },
        { numero_identificacion: 'ES123456789013', especie: 'Vacas', tipo: 'Vaca Frisona', estado: 'activo', fecha_nacimiento: '2020-07-22', sexo: 'Hembra', raza: 'Frisona', peso_inicial: 620, rebanoId: rebVacas.id },
        { numero_identificacion: 'ES123456789014', especie: 'Vacas', tipo: 'Vaca Frisona', estado: 'activo', fecha_nacimiento: '2022-01-10', sexo: 'Hembra', raza: 'Frisona', peso_inicial: 510, rebanoId: rebVacas.id },
        { numero_identificacion: 'ES123456789015', especie: 'Vacas', tipo: 'Ternero', estado: 'activo', fecha_nacimiento: '2024-11-05', sexo: 'Macho', raza: 'Frisona', peso_inicial: 180, rebanoId: rebTerneros.id },
        { numero_identificacion: 'ES123456789016', especie: 'Vacas', tipo: 'Ternero', estado: 'activo', fecha_nacimiento: '2024-10-20', sexo: 'Macho', raza: 'Frisona', peso_inicial: 195, rebanoId: rebTerneros.id },
        { numero_identificacion: 'ES654321098765', especie: 'Ovejas', tipo: 'Oveja Merina', estado: 'activo', fecha_nacimiento: '2022-06-01', sexo: 'Hembra', raza: 'Merina', peso_inicial: 55, rebanoId: rebOvejas.id },
        { numero_identificacion: 'ES654321098766', especie: 'Ovejas', tipo: 'Oveja Merina', estado: 'activo', fecha_nacimiento: '2023-02-14', sexo: 'Hembra', raza: 'Merina', peso_inicial: 52, rebanoId: rebOvejas.id },
        { numero_identificacion: 'ES654321098767', especie: 'Ovejas', tipo: 'Oveja Merina', estado: 'activo', fecha_nacimiento: '2021-11-30', sexo: 'Hembra', raza: 'Merina', peso_inicial: 58, rebanoId: rebOvejas.id },
        { numero_identificacion: 'ES654321098768', especie: 'Ovejas', tipo: 'Cordero', estado: 'activo', fecha_nacimiento: '2024-05-18', sexo: 'Macho', raza: 'Merina', peso_inicial: 60, rebanoId: rebOvejas.id }
      ];
      var anims = [];
      for (var a = 0; a < animDefs.length; a++) {
        try {
          var aid = await Animales.save(animDefs[a]);
          anims.push(Object.assign({ id: aid }, animDefs[a]));
        } catch (e) { console.log('[SEED] Error animal:', e.message); }
        await sleep(120);
      }
      var vaca1 = anims[0], vaca2 = anims[1], vaca3 = anims[2];
      var terner1 = anims[3], terner2 = anims[4];
      var oveja4 = anims[8];

      // 4. Pesajes de control para vaca1 (registro_eventos)
      if (vaca1) {
        var pesajes = [
          { fecha: '2025-01-15', valor_neto: 585 },
          { fecha: '2025-02-15', valor_neto: 590 },
          { fecha: '2025-03-15', valor_neto: 588 },
          { fecha: '2025-04-15', valor_neto: 592 },
          { fecha: '2025-05-15', valor_neto: 595 }
        ];
        for (var p = 0; p < pesajes.length; p++) {
          try {
            await Pesajes.registrar({
              entidad_id: vaca1.id,
              tipo_entidad: 'animal',
              valor_neto: pesajes[p].valor_neto,
              fecha: pesajes[p].fecha,
              motivo_tarea: 'control',
              snap_zona: rebVacas.zonaActual,
              snap_tipo: rebVacas.tipo,
              snap_especie: rebVacas.especie,
              unidad: 'kg',
              rol_contable: 'INVENTARIO'
            });
          } catch (e) { console.log('[SEED] Error pesaje:', e.message); }
          await sleep(80);
        }
      }

      // 5. Compradores
      var compDefs = [
        { nombre: 'Cárnicas Extremeñas SL', nif_cif: 'B98765432', tipo_comprador: 'carne', telefono: '+34 924 111 222', ciudad: 'Mérida', provincia: 'Badajoz' },
        { nombre: 'Lácteos La Serena SA', nif_cif: 'A87654321', tipo_comprador: 'leche', telefono: '+34 924 333 444', ciudad: 'Don Benito', provincia: 'Badajoz' },
        { nombre: 'Ganados del Oeste SL', nif_cif: 'B76543210', tipo_comprador: 'híbrido', telefono: '+34 927 555 666', ciudad: 'Cáceres', provincia: 'Cáceres' }
      ];
      var comps = [];
      for (var c = 0; c < compDefs.length; c++) {
        try {
          var cid = await Compradores.save(compDefs[c]);
          comps.push(Object.assign({ id: cid }, compDefs[c]));
        } catch (e) { console.log('[SEED] Error comprador:', e.message); }
        await sleep(100);
      }
      var compCarne = comps[0], compLeche = comps[1];

      // 6. Proveedores
      var provDefs = [
        { nombre: 'Piensos El Trébol SA', nif_cif: 'A65432109', ciudad: 'Zafra', provincia: 'Badajoz', categorias: ['Piensos', 'Forrajes'] },
        { nombre: 'Farmacia Veterinaria VetPlus', nif_cif: 'B54321098', ciudad: 'Badajoz', provincia: 'Badajoz', categorias: ['Farmacia'] },
        { nombre: 'Maquinaria Agrícola La Vega', nif_cif: 'B43210987', ciudad: 'Plasencia', provincia: 'Cáceres', categorias: ['Maquinaria'] }
      ];
      for (var pv = 0; pv < provDefs.length; pv++) {
        try { await Proveedores.save(provDefs[pv]); } catch (e) { console.log('[SEED] Error proveedor:', e.message); }
        await sleep(100);
      }

      // 7. Transportistas
      var transDefs = [
        { nombre: 'Transportes Ganaderos del Sur SL', nif_cif: 'B32109876', matricula: '1234BCD', ciudad: 'Almendralejo', provincia: 'Badajoz', tipo_vehiculo: 'Camión ganadero', capacidad_animales: 40, certificado_bienestar: true },
        { nombre: 'Logística Láctea Extremeña', nif_cif: 'B21098765', matricula: '5678EFG', ciudad: 'Villanueva de la Serena', provincia: 'Badajoz', tipo_vehiculo: 'Cisterna lechera', capacidad_animales: 0, condiciones_termoneutrales: true }
      ];
      for (var t = 0; t < transDefs.length; t++) {
        try { await Transportistas.save(transDefs[t]); } catch (e) { console.log('[SEED] Error transportista:', e.message); }
        await sleep(100);
      }

      // 8. Contratos
      if (compCarne) {
        try {
          await Contratos.save({ compradorId: compCarne.id, numero_contrato: 'CT-' + new Date().getFullYear() + '-001', tipo: 'carne', fecha_inicio: new Date().getFullYear() + '-01-01', fecha_fin: (new Date().getFullYear() + 1) + '-12-31', iva_pct: 10, retencion_pct: 0, condiciones: 'Pago 30 días', precios: [{ producto: 'Cordero cebo', precio_unitario: 6.50, unidad: 'kg' }] });
        } catch (e) { console.log('[SEED] Error contrato carne:', e.message); }
      }
      if (compLeche) {
        try {
          await Contratos.save({ compradorId: compLeche.id, numero_contrato: 'CT-' + new Date().getFullYear() + '-002', tipo: 'leche', fecha_inicio: new Date().getFullYear() + '-01-01', fecha_fin: (new Date().getFullYear() + 1) + '-12-31', iva_pct: 10, retencion_pct: 0, condiciones: 'Pago 15 días', precios: [{ producto: 'Leche cruda', precio_unitario: 0.58, unidad: 'L' }] });
        } catch (e) { console.log('[SEED] Error contrato leche:', e.message); }
      }
      await sleep(150);

      // 9. Gastos
      var gastosDefs = [
        { concepto: 'Pienso concentrado vacuno', fecha: '2025-03-01', monto: 2340.50, categoria: 'Alimentación', rebanoId: rebVacas.id },
        { concepto: 'Paja para cama', fecha: '2025-03-05', monto: 680.00, categoria: 'Cama', rebanoId: rebVacas.id },
        { concepto: 'Vacunación trimestral', fecha: '2025-03-10', monto: 425.00, categoria: 'Sanidad', rebanoId: rebVacas.id },
        { concepto: 'Gasoil tractor', fecha: '2025-03-15', monto: 320.75, categoria: 'Combustible' },
        { concepto: 'Mantenimiento valla parcela norte', fecha: '2025-03-20', monto: 890.00, categoria: 'Mantenimiento', rebanoId: rebVacas.id },
        { concepto: 'Pienso lactancia corderos', fecha: '2025-02-12', monto: 540.00, categoria: 'Alimentación', rebanoId: rebOvejas.id },
        { concepto: 'Veterinario revisión rebaño', fecha: '2025-05-02', monto: 260.00, categoria: 'Sanidad', rebanoId: rebVacas.id }
      ];
      for (var g = 0; g < gastosDefs.length; g++) {
        try { await Gastos.save(gastosDefs[g]); } catch (e) { console.log('[SEED] Error gasto:', e.message); }
        await sleep(80);
      }

      // 10. Sanitarios
      var sanDefs = [
        { tipo_tratamiento: 'Vacunación', medicamento: 'Cydectin 1%', fecha: '2025-02-01', tiempo_espera_carne_dias: 14, tiempo_espera_leche_dias: 7, prohibidoLeche: false, rebanoId: rebVacas.id },
        { tipo_tratamiento: 'Desparasitación', medicamento: 'Eprinex Pour-On', fecha: '2025-01-15', tiempo_espera_carne_dias: 7, tiempo_espera_leche_dias: 0, prohibidoLeche: false, rebanoId: rebVacas.id }
      ];
      for (var s = 0; s < sanDefs.length; s++) {
        try { await Sanitarios.save(sanDefs[s]); } catch (e) { console.log('[SEED] Error sanitario:', e.message); }
        await sleep(80);
      }

      // 11. Eventos reproductivos (vaca1)
      if (vaca1) {
        var repDefs = [
          { tipo_evento: 'Celo', fecha: '2024-11-10', animalId: vaca1.id },
          { tipo_evento: 'Inseminación Artificial', fecha: '2024-11-20', animalId: vaca1.id },
          { tipo_evento: 'Diagnóstico Gestación', fecha: '2024-12-20', animalId: vaca1.id, resultado: 'Positivo' },
          { tipo_evento: 'Parto', fecha: '2025-03-20', animalId: vaca1.id, crias_vivas: 1 }
        ];
        for (var r2 = 0; r2 < repDefs.length; r2++) {
          try { await Reproduccion.saveEvento(repDefs[r2]); } catch (e) { console.log('[SEED] Error reproducción:', e.message); }
          await sleep(80);
        }
      }

      // 12. Producción de carne (pesos para GMD / informes)
      var prodCarneData = [
        { animal: terner1, pesos: [{ f: '2025-01-10', p: 175 }, { f: '2025-02-10', p: 210 }, { f: '2025-03-10', p: 248 }, { f: '2025-04-10', p: 285 }] },
        { animal: terner2, pesos: [{ f: '2025-01-10', p: 190 }, { f: '2025-02-10', p: 228 }, { f: '2025-03-10', p: 265 }, { f: '2025-04-10', p: 300 }] },
        { animal: oveja4, pesos: [{ f: '2025-02-01', p: 60 }, { f: '2025-03-01', p: 68 }, { f: '2025-04-01', p: 75 }] }
      ];
      for (var pc = 0; pc < prodCarneData.length; pc++) {
        var pcItem = prodCarneData[pc];
        if (!pcItem.animal) continue;
        for (var pp = 0; pp < pcItem.pesos.length; pp++) {
          try {
            await Produccion.saveCarne({ animalId: pcItem.animal.id, fecha: pcItem.pesos[pp].f, peso: pcItem.pesos[pp].p });
          } catch (e) { console.log('[SEED] Error prod carne:', e.message); }
          await sleep(60);
        }
      }

      // 13. Producción de leche por vaca (cifrada)
      var prodLecheVacas = [vaca1, vaca2, vaca3];
      var lecheFechas = ['2025-03-01', '2025-03-15', '2025-04-01', '2025-04-15', '2025-05-01'];
      for (var plv = 0; plv < prodLecheVacas.length; plv++) {
        if (!prodLecheVacas[plv]) continue;
        for (var lf = 0; lf < lecheFechas.length; lf++) {
          try {
            await Produccion.saveLeche({
              vacaId: prodLecheVacas[plv].id,
              fecha: lecheFechas[lf],
              cantidad_litros: 22 + Math.round(Math.random() * 8),
              analisis_grasa_proteina: { grasa: 3.7, proteina: 3.3 }
            }, fincaId);
          } catch (e) { console.log('[SEED] Error prod leche:', e.message); }
          await sleep(60);
        }
      }

      // 14. Comercialización de leche (entregas a tanque con laboratorio + MOFA)
      var entregasLeche = [
        { fecha: '2025-03-05', cantidad: 1850, precioBase: 0.58, grasa: 6.2, proteina: 5.1, somaticas: 320000, germenes: 35000 },
        { fecha: '2025-04-05', cantidad: 2010, precioBase: 0.60, grasa: 6.4, proteina: 5.3, somaticas: 280000, germenes: 28000 },
        { fecha: '2025-05-05', cantidad: 1940, precioBase: 0.59, grasa: 6.1, proteina: 5.0, somaticas: 410000, germenes: 60000 }
      ];
      for (var elx = 0; elx < entregasLeche.length; elx++) {
        var en = entregasLeche[elx];
        var extractoSeco = +(en.grasa + en.proteina).toFixed(2);
        var precioExtracto = 0.012;
        var precioFinal = +(en.precioBase + extractoSeco * precioExtracto).toFixed(4);
        var importeTotal = +(en.cantidad * precioFinal).toFixed(2);
        var costeAlim = 420;
        try {
          await window.db.add('comercializacion_leche', {
            fincaId: fincaId,
            compradorId: compLeche ? compLeche.id : null,
            fecha: en.fecha,
            fechaRecogida: en.fecha,
            matriculaCisterna: '5678EFG',
            cantidad: en.cantidad,
            precioBase: en.precioBase,
            hora_ordeno: '06:30',
            hora_carga: '08:00',
            temperatura: 3.5,
            laboratorio: {
              grasa: en.grasa, proteina: en.proteina, somaticas: en.somaticas, germenes: en.germenes,
              antibioticos: false, extracto_seco: extractoSeco, recuento_bacterias: en.germenes,
              antibioticos_positivos: false, laboratorio_nombre: 'LIGAL', nro_boletin: 'B-' + en.fecha.replace(/-/g, '')
            },
            antibioticos: false,
            estadoAnalitica: 'Validado',
            precio_extracto_seco: precioExtracto,
            primas_penalizaciones: 0,
            precio_final_unitario: precioFinal,
            importe_total: importeTotal,
            coste_alimentacion_diario: 14,
            coste_alimentacion_periodo: costeAlim,
            mofa: +(importeTotal - costeAlim).toFixed(2),
            creadoEn: new Date().toISOString()
          });
        } catch (e) { console.log('[SEED] Error com. leche:', e.message); }
        await sleep(80);
      }

      // 15. Comercialización de carne (venta de un ternero) + DIMOE
      if (terner2 && compCarne) {
        try {
          var pesoVivoV = 300, pesoCanalV = 168;
          var regVentaCarne = {
            animalId: terner2.id,
            compradorId: compCarne.id,
            contratoId: null,
            fechaSacrificio: '2025-05-12',
            codigoMatadero: 'ES10.05/M',
            pesoVivo: pesoVivoV,
            pesoCanal: pesoCanalV,
            rendimientoCanal: +((pesoCanalV / pesoVivoV) * 100).toFixed(2),
            fincaId: fincaId,
            snap_zona: rebTerneros.zonaActual,
            snap_especie: rebTerneros.especie,
            snap_tipo: rebTerneros.tipo,
            nifComprador: compCarne.nif_cif,
            razonSocial: compCarne.nombre,
            codigoDocumento_ICA: 'ICA-2025-0012',
            numero_Guia_Sanitaria: 'GS-2025-0451',
            IVA: 10,
            retencionREAGP: 0,
            Gasto_Transporte: 35,
            Gasto_Matanza: 28,
            clasificacion: { seurop: 'U' },
            transportistaId: null,
            nombreTransportista: 'Transportes Ganaderos del Sur SL',
            nifTransportista: 'B32109876',
            matriculaTransportista: '1234BCD',
            numero_albaran: 'ALB-2025-0007',
            precio_total: +(pesoCanalV * 5.1).toFixed(2),
            autorizacion_veterinaria: { vet_nombre: '', vet_colegiado: '', fecha_autorizacion: '' },
            creadoEn: new Date().toISOString()
          };
          var idVentaCarne = await window.db.add('comercializacion_carne', regVentaCarne);
          // También registrar en ventas_ganado cifrado (para analítica y reportes)
          try {
            await Produccion.saveVentas({
              animal_id_list: [terner2.id],
              precio_total: regVentaCarne.precio_total,
              comprador: compCarne.nombre,
              documentacion: 'ALB-2025-0007',
              fecha: regVentaCarne.fechaSacrificio,
              creadoEn: regVentaCarne.creadoEn
            }, fincaId);
          } catch (e) { console.log('[SEED] Error saveVentas:', e.message); }
          // Marcar animal como vendido
          var aVendido = await Animales.get(terner2.id);
          if (aVendido) { aVendido.estado = 'vendido'; await Animales.save(aVendido); }
          // DIMOE como documento legal
          await window.db.add('documentos_legales', {
            tipo: 'dimoe',
            ventaId: idVentaCarne,
            animalId: terner2.id,
            fincaId: fincaId,
            numero: 'DIMOE-ALB-2025-0007',
            fecha_emision: '2025-05-12',
            origen_rega: DEMO_FINCA.rega,
            origen_nombre: DEMO_FINCA.nombre,
            destino: 'ES10.05/M',
            destino_nombre: 'Cárnicas Extremeñas SL',
            motivo: 'sacrificio',
            transportista_nombre: 'Transportes Ganaderos del Sur SL',
            transportista_nif: 'B32109876',
            transportista_matricula: '1234BCD',
            created_at: new Date().toISOString()
          });
        } catch (e) { console.log('[SEED] Error com. carne:', e.message); }
      }

      // Seed completado
      localStorage.setItem('seed_data_completed', 'true');
      showToast('Datos demo CHAMORRO cargados correctamente', '#22c55e');
      console.log('[SEED] Completado exitosamente');

    } catch (e) {
      console.error('[SEED] Error:', e.message, e.stack);
      showToast('Error cargando datos: ' + e.message, '#ef4444');
      throw e;
    }
  }

  // Sin auto-siembra: la demo se carga bajo demanda desde el asistente
  // de configuración (botón "Cargar Demo CHAMORRO").
  window.SeedData = { run: seedDatabase };

})();
