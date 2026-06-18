/**
 * TrazabilidadView - Livestock Manager Premium v4.0
 * Panel de Trazabilidad 360°: Timeline completo del ciclo de vida de un animal.
 */

const TrazabilidadView = {
  /**
   * Renderizar panel de trazabilidad para un animal
   * @param {number} animalId - ID del animal
   */
  async render(animalId) {
    const main = document.getElementById('app-content');
    if (!main) return;

    const animal = await Animales.get(animalId).catch(() => null);
    if (!animal) {
      main.innerHTML = `<div class="card error-card"><h2>Error</h2><p>Animal no encontrado (ID: ${animalId})</p></div>`;
      return;
    }

    const rebano = animal.rebanoId ? await Rebanos.get(animal.rebanoId).catch(() => null) : null;
    const finca = await Fincas.getActive().catch(() => null);

    // Cargar datos de todas las fuentes
    const [sanitarios, pesajes, eventos, reproduccion, ventas] = await Promise.all([
      this._getAllSanitarios(animal.id, animal.rebanoId),
      this._getAllPesajes(animal.id),
      this._getAllEventos(animal.id),
      this._getAllReproduccion(animal.id),
      this._getVentas(animal.id),
    ]);

    // Construir timeline
    const timeline = this._buildTimeline(animal, sanitarios, pesajes, eventos, reproduccion, ventas);

    main.innerHTML = this._buildHTML(animal, rebano, finca, timeline);
  },

  async _getAllSanitarios(animalId, rebanoId) {
    try {
      let records = [];
      const store = window.db.transaction('sanitarios_ganado', 'readonly').objectStore('sanitarios_ganado');
      // First by animalId if the index exists
      if (store.indexNames.contains('animalId')) {
        records = await window.db.getAllFromIndex('sanitarios_ganado', 'animalId', Number(animalId));
      }
      // Also by rebanoId
      if (rebanoId && store.indexNames.contains('rebanoId')) {
        const rebanoRecords = await window.db.getAllFromIndex('sanitarios_ganado', 'rebanoId', Number(rebanoId));
        records = records.concat(rebanoRecords.filter(r => !records.some(x => x.id === r.id)));
      }
      return records.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    } catch(e) { return []; }
  },

  async _getAllPesajes(animalId) {
    try {
      if (!window.db.getAllFromIndex) return [];
      const records = await window.db.getAllFromIndex('produccion_carne', 'animalId', Number(animalId)).catch(() => []);
      return records.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    } catch(e) { return []; }
  },

  async _getAllEventos(animalId) {
    try {
      const records = await window.db.getAllFromIndex('registro_eventos', 'entidad_id', Number(animalId)).catch(() => []);
      return records.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    } catch(e) { return []; }
  },

  async _getAllReproduccion(animalId) {
    try {
      const records = await window.db.getAll('reproduccion_eventos').catch(() => []);
      return records.filter(r => Number(r.animalId) === Number(animalId))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    } catch(e) { return []; }
  },

  async _getVentas(animalId) {
    try {
      const records = await window.db.getAll('comercializacion_carne').catch(() => []);
      return records.filter(r => Number(r.animalId) === Number(animalId))
        .sort((a, b) => new Date(b.fechaSacrificio) - new Date(a.fechaSacrificio));
    } catch(e) { return []; }
  },

  _calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return 'N/D';
    const nac = new Date(fechaNacimiento);
    if (isNaN(nac)) return 'N/D';
    const hoy = new Date();
    const meses = Math.floor((hoy - nac) / (1000 * 60 * 60 * 24 * 30.44));
    const anios = Math.floor(meses / 12);
    const restoMeses = meses % 12;
    return anios > 0 ? `${anios}a ${restoMeses}m` : `${meses}m`;
  },

  _buildTimeline(animal, sanitarios, pesajes, eventos, reproduccion, ventas) {
    const timeline = [];

    // 1. NACIMIENTO / ALTA
    timeline.push({
      fecha: animal.fecha_nacimiento || animal.creadoEn?.split('T')[0] || 'N/D',
      tipo: 'nacimiento',
      icon: '🐄',
      titulo: 'NACIMIENTO / ALTA',
      detalle: `
        <strong>Crotal:</strong> ${animal.numero_identificacion}<br>
        ${animal.dib ? `<strong>DIB:</strong> ${animal.dib}<br>` : ''}
        <strong>Especie:</strong> ${animal.especie || 'N/D'}<br>
        <strong>Raza:</strong> ${animal.raza || 'N/D'}<br>
        <strong>Sexo:</strong> ${animal.sexo || 'N/D'}<br>
        <strong>Categoría:</strong> ${animal.categoria || 'Sin categoría'}<br>
        ${animal.procedencia_tipo ? `<strong>Procedencia:</strong> ${animal.procedencia_tipo}${animal.explotacion_origen ? ' ('+animal.explotacion_origen+')' : ''}<br>` : ''}
      `
    });

    // 2. SANITARIOS (cada tratamiento es un evento)
    for (const s of sanitarios) {
      const supresion = s.tiempo_espera_carne_dias > 0 ? ` (supresión: ${s.tiempo_espera_carne_dias}d)` : '';
      timeline.push({
        fecha: s.fecha || 'N/D',
        tipo: 'sanitario',
        icon: '💉',
        titulo: `TRATAMIENTO: ${s.medicamento || 'N/D'}`,
        detalle: `
          <strong>Tipo:</strong> ${s.tipo_tratamiento || 'N/D'}<br>
          <strong>Producto:</strong> ${s.medicamento || 'N/D'}<br>
          <strong>Supresión carne:</strong> ${s.tiempo_espera_carne_dias || 0} días${supresion}<br>
          ${s.prohibidoLeche ? '<strong class="text-red">PROHIBIDO para leche</strong><br>' : ''}
        `
      });
    }

    // 3. REPRODUCCIÓN
    for (const r of reproduccion) {
      const tipoLabels = {
        'celo': { icon: '🔴', label: 'CELO' },
        'inseminacion': { icon: '💉', label: 'INSEMINACIÓN' },
        'gestacion': { icon: '🤰', label: 'GESTACIÓN' },
        'parto': { icon: '🐣', label: 'PARTO' },
        'aborto': { icon: '⚠️', label: 'ABORTO' },
        'diagnostico_gestacion': { icon: '🔬', label: 'DIAG. GESTACIÓN' },
      };
      const info = tipoLabels[r.tipo_evento] || { icon: '📋', label: r.tipo_evento || 'OTRO' };
      timeline.push({
        fecha: r.fecha || 'N/D',
        tipo: 'reproduccion',
        icon: info.icon,
        titulo: `${info.icon} ${info.label}`,
        detalle: `
          <strong>Fecha:</strong> ${r.fecha || 'N/D'}<br>
          ${r.resultado ? `<strong>Resultado:</strong> ${r.resultado}<br>` : ''}
          ${r.observaciones ? `<strong>Observaciones:</strong> ${r.observaciones}<br>` : ''}
        `
      });
    }

    // 4. PESAJES (cada pesaje)
    for (const p of pesajes) {
      timeline.push({
        fecha: p.fecha || 'N/D',
        tipo: 'pesaje',
        icon: '⚖️',
        titulo: `PESAJE: ${p.valor_neto || 0} ${p.unidad || 'kg'}`,
        detalle: `
          <strong>Peso:</strong> ${p.valor_neto || 0} ${p.unidad || 'kg'}<br>
          ${p.motivo_tarea ? `<strong>Motivo:</strong> ${p.motivo_tarea}<br>` : ''}
        `
      });
    }

    // 5. EVENTOS (registro_eventos)
    for (const e of eventos) {
      const labels = {
        'ALTA_IMPORTACION': { icon: '📥', label: 'ALTA POR IMPORTACIÓN' },
        'expedicion': { icon: '📦', label: 'EXPEDICIÓN' },
        'control': { icon: '✅', label: 'CONTROL' },
        'baja': { icon: '❌', label: 'BAJA' },
      };
      const info = labels[e.motivo_tarea] || { icon: '📝', label: e.motivo_tarea || 'EVENTO' };
      timeline.push({
        fecha: e.fecha || 'N/D',
        tipo: 'evento',
        icon: info.icon,
        titulo: `${info.icon} ${info.label}`,
        detalle: `
          <strong>Motivo:</strong> ${e.motivo_tarea || 'N/D'}<br>
          ${e.observaciones ? `<strong>Notas:</strong> ${e.observaciones}<br>` : ''}
          ${e.valor_neto ? `<strong>Valor:</strong> ${e.valor_neto} ${e.unidad || ''}<br>` : ''}
        `
      });
    }

    // 6. VENTA (si el animal fue vendido)
    for (const v of ventas) {
      timeline.push({
        fecha: v.fechaSacrificio || 'N/D',
        tipo: 'venta',
        icon: '📦',
        titulo: `VENTA / SACRIFICIO`,
        detalle: `
          <strong>Comprador:</strong> ${v.razonSocial || 'N/D'}<br>
          <strong>NIF:</strong> ${v.nifComprador || 'N/D'}<br>
          <strong>Fecha sacrificio:</strong> ${v.fechaSacrificio || 'N/D'}<br>
          <strong>Peso vivo:</strong> ${v.pesoVivo || 0} kg<br>
          <strong>Peso canal:</strong> ${v.pesoCanal || 0} kg<br>
          <strong>Rendimiento:</strong> ${v.rendimientoCanal || 0}%<br>
          <strong>Matadero:</strong> ${v.codigoMatadero || 'N/D'}<br>
          <strong>Nº Albarán:</strong> ${v.numero_albaran || 'N/D'}<br>
          <strong>DIMOE:</strong> ${v.dimoe || 'N/D'}<br>
          <strong>Transportista:</strong> ${v.nombreTransportista || 'N/D'}<br>
          ${v.clasificacion?.seurop ? `<strong>SEUROP:</strong> ${v.clasificacion.seurop}<br>` : ''}
          <strong>IVA:</strong> ${v.IVA || 0}%<br>
          ${v.autorizacion_veterinaria ? `<strong>Veterinario:</strong> ${v.autorizacion_veterinaria.vet_nombre || 'N/D'}<br>` : ''}
        `
      });
    }

    // Ordenar timeline por fecha ascendente (más antiguo primero)
    return timeline.sort((a, b) => {
      const fa = a.fecha === 'N/D' ? '0000-00-00' : a.fecha;
      const fb = b.fecha === 'N/D' ? '0000-00-00' : b.fecha;
      return fa.localeCompare(fb);
    });
  },

  _buildHTML(animal, rebano, finca, timeline) {
    const edad = this._calcularEdad(animal.fecha_nacimiento);
    const totalPesajes = timeline.filter(t => t.tipo === 'pesaje').length;
    const totalSanitarios = timeline.filter(t => t.tipo === 'sanitario').length;
    const totalReproduccion = timeline.filter(t => t.tipo === 'reproduccion').length;
    const totalEventos = timeline.filter(t => t.tipo === 'evento').length;

    return `
      <div class="p-16" style="max-width:800px; margin:0 auto;">
        <!-- Cabecera con botón volver -->
        <div class="flex items-center gap-10 mb-14">
          <button onclick="App._navigateBack()" class="text-gray" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">←</button>
        </div>

        <!-- Datos Básicos del Animal -->
        <div class="card p-20 mb-20">
          <div class="grid grid-cols-2 gap-10" style="font-size:0.9rem;">
            <div><strong class="text-amber">${animal.numero_identificacion}</strong></div>
            <div class="text-right">
              <span style="background:${animal.estado === 'activo' || animal.estado === 'Activo' ? '#065f46' : '#7f1d1d'}; color:white; padding:3px 10px; border-radius:20px; font-size:0.75rem;">${animal.estado}</span>
            </div>
            <div><span class="text-gray">Especie:</span> ${animal.especie || 'N/D'}</div>
            <div><span class="text-gray">Raza:</span> ${animal.raza || 'N/D'}</div>
            <div><span class="text-gray">Sexo:</span> ${animal.sexo || 'N/D'}</div>
            <div><span class="text-gray">Categoría:</span> ${animal.categoria || 'Sin categoría'}</div>
            <div><span class="text-gray">Edad:</span> ${edad}</div>
            <div><span class="text-gray">DIB:</span> ${animal.dib || '<span class="text-red">No registrado</span>'}</div>
            ${rebano ? `<div><span class="text-gray">Rebaño:</span> ${rebano.nombre || 'N/D'}</div>` : ''}
            ${animal.procedencia_tipo ? `<div><span class="text-gray">Procedencia:</span> ${animal.procedencia_tipo}${animal.explotacion_origen ? ' ('+animal.explotacion_origen+')' : ''}</div>` : ''}
          </div>
        </div>

        <!-- KPIs rápidos -->
        <div class="grid gap-10 mb-20" style="grid-template-columns:repeat(4,1fr);">
          <div class="card p-12 text-center mb-0">
            <div class="kpi-value text-green">${totalPesajes}</div>
            <div class="kpi-label">PESAJES</div>
          </div>
          <div class="card p-12 text-center mb-0">
            <div class="kpi-value text-blue">${totalSanitarios}</div>
            <div class="kpi-label">TRATAMIENTOS</div>
          </div>
          <div class="card p-12 text-center mb-0">
            <div class="kpi-value text-violet">${totalReproduccion}</div>
            <div class="kpi-label">REPRODUCCIÓN</div>
          </div>
          <div class="card p-12 text-center mb-0">
            <div class="kpi-value text-amber">${totalEventos}</div>
            <div class="kpi-label">EVENTOS</div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="mt-20">
          <h3 class="text-white" style="font-size:1rem; margin-bottom:15px;">📅 Línea de Vida</h3>
          ${timeline.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🔍</div><p class="empty-state-text">No hay datos de trazabilidad para este animal.</p></div>' : ''}
          <div style="position:relative;">
            <!-- Línea vertical -->
            <div style="position:absolute; left:18px; top:0; bottom:0; width:2px; background:#333;"></div>
            ${timeline.map(t => this._renderTimelineItem(t)).join('')}
          </div>
        </div>

        <!-- Botón volver -->
        <div class="text-center mt-20" style="padding-bottom:40px;">
          <button onclick="App._navigateBack()" class="border-muted rounded" style="background:#222; color:white; padding:10px 30px; cursor:pointer;">← Volver al animal</button>
        </div>
      </div>
    `;
  },

  _renderTimelineItem(item) {
    const colors = {
      nacimiento: { bg: 'rgba(16,185,129,0.1)', border: '#10b981', dot: '#10b981' },
      sanitario: { bg: 'rgba(59,130,246,0.1)', border: '#3b82f6', dot: '#3b82f6' },
      reproduccion: { bg: 'rgba(167,139,250,0.1)', border: '#a78bfa', dot: '#a78bfa' },
      pesaje: { bg: 'rgba(251,191,36,0.1)', border: '#f59e0b', dot: '#f59e0b' },
      evento: { bg: 'rgba(236,72,153,0.1)', border: '#ec4899', dot: '#ec4899' },
      venta: { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', dot: '#ef4444' },
    };
    const c = colors[item.tipo] || { bg: '#1a1a1a', border: '#555', dot: '#555' };

    return `
      <div style="position:relative; margin-bottom:15px; padding-left:45px;">
        <div style="position:absolute; left:10px; top:18px; width:18px; height:18px; background:${c.dot}; border-radius:50%; border:2px solid #000; z-index:1; display:flex; align-items:center; justify-content:center; font-size:10px;"></div>
        <div class="p-12" style="background:${c.bg}; border:1px solid ${c.border}; border-radius:12px;">
          <div class="flex justify-between items-center">
            <strong class="text-white text-85">${item.titulo}</strong>
            <span class="text-gray text-2xs">${item.fecha}</span>
          </div>
          <div class="mt-8 text-sm leading-normal text-ccc">
            ${item.detalle}
          </div>
        </div>
      </div>
    `;
  }
};

window.TrazabilidadView = TrazabilidadView;
