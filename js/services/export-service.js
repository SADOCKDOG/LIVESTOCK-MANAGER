/**
 * Livestock Manager - ExportService v1.0.0
 * Exportación oficial CSV/XML para REGA, SIA y PIGGAN.
 * Genera ficheros compatibles con las plataformas autonómicas.
 *
 * Formatos:
 *   - REGA: CSV censo actual + XML explotación
 *   - SIA:  CSV movimientos (altas/bajas/expediciones)
 *   - PIGGAN: CSV producción y tratamiento
 */

const ExportService = {

  /**
   * Genera un informe REGA (censo actual) en CSV
   * @param {object} finca - datos de la finca activa
   * @param {object[]} animales - todos los animales
   * @param {object[]} rebanos - todos los rebaños
   * @returns {string} contenido CSV
   */
  generarCSV_CensoREGA(finca, animales, rebanos) {
    const activos = animales.filter(a =>
      a.estado === 'activo' || a.estado === 'Activo'
    );

    // Cabecera del fichero con datos de explotación
    const lines = [];
    lines.push(';;;EXPORTACION REGA - CENSO GANADERO;;;');
    lines.push(`EXPLOTACION;;${finca?.nombre || ''};;`);
    lines.push(`REGA;;${finca?.codigo_REGA || finca?.rega || ''};;`);
    lines.push(`CEA;;${finca?.cea || ''};;`);
    lines.push(`PROPIETARIO;;${finca?.propietario_nombre || finca?.nombre || ''};;`);
    lines.push(`NIF;;${finca?.nif || ''};;`);
    lines.push(`MUNICIPIO;;${finca?.municipio || ''};;`);
    lines.push(`PROVINCIA;;${finca?.provincia || ''};;`);
    lines.push(`COMUNIDAD;;${finca?.comunidad_autonoma || ''};;`);
    lines.push(`ADSG;;${finca?.adsg_nombre || ''};;`);
    lines.push(`VETERINARIO;;${finca?.adsg_veterinario || ''};;`);
    lines.push(`FECHA_EXPORTACION;;${new Date().toISOString().split('T')[0]};;`);
    lines.push('');

    // Resumen por especie
    lines.push(';;RESUMEN POR ESPECIE;;');
    lines.push('ESPECIE;REBAÑO;ACTIVOS;HEMBRAS;MACHOS;BAJAS_ANIO');
    const now = new Date();
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    const especies = [...new Set(activos.map(a => a.especie || 'Sin especie'))];
    especies.forEach(esp => {
      const deEsp = activos.filter(a => (a.especie || 'Sin especie') === esp);
      const rebanosDeEsp = rebanos.filter(r => r.especie === esp || deEsp.some(a => a.rebanoId === r.id));
      (rebanosDeEsp.length ? rebanosDeEsp : [{ nombre: 'General' }]).forEach(rb => {
        const deRb = rb.id ? deEsp.filter(a => a.rebanoId === rb.id) : deEsp;
        const hembras = deRb.filter(a => a.sexo === 'hembra' || a.sexo === 'Hembra').length;
        const machos = deRb.filter(a => a.sexo === 'macho' || a.sexo === 'Macho').length;
        const bajas = animales.filter(a =>
          (a.estado === 'baja' || a.estado === 'Baja') &&
          a.fecha_baja && new Date(a.fecha_baja) >= yearAgo
        ).length;
        lines.push(`${esp};${rb.nombre};${deRb.length};${hembras};${machos};${bajas}`);
      });
    });

    lines.push('');
    lines.push(`TOTAL_ACTIVOS;;${activos.length};;`);
    lines.push('');
    lines.push(';;DETALLE ANIMALES ACTIVOS;;');
    lines.push('ID;CROTAL;ESPECIE;RAZA;SEXO;FECHA_NAC;EDAD_MESES;REBAÑO;CATEGORIA;PESO_ACTUAL;DIB;NOTIFICADO_REGA');
    activos.forEach(a => {
      const nac = a.fecha_nacimiento ? new Date(a.fecha_nacimiento) : null;
      const edadMeses = nac ? Math.floor((now - nac) / (1000 * 60 * 60 * 24 * 30.44)) : 0;
      const rb = rebanos.find(r => r.id === a.rebanoId);
      lines.push([
        a.id,
        a.numero_identificacion || '',
        a.especie || '',
        a.raza || '',
        a.sexo || '',
        a.fecha_nacimiento || '',
        edadMeses,
        rb?.nombre || '',
        a.categoria || '',
        a.peso_actual || '',
        a.dib || '',
        a.notificado_rega || ''
      ].join(';'));
    });

    return '﻿' + lines.join('\r\n'); // BOM UTF-8 para Excel
  },

  /**
   * Genera XML de explotación para REGA (formato compatible con SIGGAN/BADIGEX)
   * @param {object} finca
   * @param {object[]} animales
   * @param {object[]} rebanos
   * @returns {string} XML
   */
  generarXML_REGA(finca, animales, rebanos) {
    const activos = animales.filter(a => a.estado === 'activo' || a.estado === 'Activo');
    const now = new Date().toISOString().split('T')[0];
    const especiesAgrupadas = {};
    activos.forEach(a => {
      const esp = a.especie || 'Sin especie';
      if (!especiesAgrupadas[esp]) especiesAgrupadas[esp] = [];
      especiesAgrupadas[esp].push(a);
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<REGA_Exportacion fecha="${now}" version="1.0">\n`;
    xml += `  <Explotacion>\n`;
    xml += `    <Nombre>${escXml(finca?.nombre || '')}</Nombre>\n`;
    xml += `    <REGA>${escXml(finca?.codigo_REGA || finca?.rega || '')}</REGA>\n`;
    xml += `    <CEA>${escXml(finca?.cea || '')}</CEA>\n`;
    xml += `    <NIF>${escXml(finca?.nif || '')}</NIF>\n`;
    xml += `    <Propietario>${escXml(finca?.propietario_nombre || finca?.nombre || '')}</Propietario>\n`;
    xml += `    <Municipio>${escXml(finca?.municipio || '')}</Municipio>\n`;
    xml += `    <Provincia>${escXml(finca?.provincia || '')}</Provincia>\n`;
    xml += `    <ComunidadAutonoma>${escXml(finca?.comunidad_autonoma || '')}</ComunidadAutonoma>\n`;
    xml += `    <TipoExplotacion>${escXml(finca?.tipo_explotacion || '')}</TipoExplotacion>\n`;
    xml += `    <SistemaExplotacion>${escXml(finca?.sistema_explotacion || '')}</SistemaExplotacion>\n`;
    if (finca?.adsg_nombre) {
      xml += `    <ADSG>\n`;
      xml += `      <Nombre>${escXml(finca.adsg_nombre)}</Nombre>\n`;
      xml += `      <Codigo>${escXml(finca.adsg_codigo || '')}</Codigo>\n`;
      xml += `      <Veterinario>${escXml(finca.adsg_veterinario || '')}</Veterinario>\n`;
      xml += `      <VetColegiado>${escXml(finca.adsg_vet_colegiado || '')}</VetColegiado>\n`;
      xml += `      <Vencimiento>${finca.adsg_fecha_vencimiento || ''}</Vencimiento>\n`;
      xml += `    </ADSG>\n`;
    }
    xml += `  </Explotacion>\n`;
    xml += `  <Censo>\n`;

    Object.entries(especiesAgrupadas).forEach(([especie, ejemplares]) => {
      xml += `    <Especie nombre="${escXml(especie)}">\n`;
      const porCategoria = {};
      ejemplares.forEach(a => {
        const cat = a.categoria || 'Sin categoría';
        if (!porCategoria[cat]) porCategoria[cat] = [];
        porCategoria[cat].push(a);
      });
      Object.entries(porCategoria).forEach(([categoria, animalesCat]) => {
        xml += `      <Categoria nombre="${escXml(categoria)}" total="${animalesCat.length}">\n`;
        animalesCat.forEach(a => {
          xml += `        <Animal>\n`;
          xml += `          <ID>${escXml(a.numero_identificacion || '#' + a.id)}</ID>\n`;
          xml += `          <Crotal>${escXml(a.numero_identificacion || '')}</Crotal>\n`;
          xml += `          <Raza>${escXml(a.raza || '')}</Raza>\n`;
          xml += `          <Sexo>${escXml(a.sexo || '')}</Sexo>\n`;
          xml += `          <FechaNacimiento>${a.fecha_nacimiento || ''}</FechaNacimiento>\n`;
          xml += `          <DIB>${escXml(a.dib || '')}</DIB>\n`;
          xml += `          <NotificadoREGA>${a.notificado_rega ? 'SI' : 'NO'}</NotificadoREGA>\n`;
          xml += `          <Estado>activo</Estado>\n`;
          xml += `        </Animal>\n`;
        });
        xml += `      </Categoria>\n`;
      });
      xml += `    </Especie>\n`;
    });

    xml += `    <Totales>\n`;
    xml += `      <TotalAnimales>${activos.length}</TotalAnimales>\n`;
    xml += `    </Totales>\n`;
    xml += `  </Censo>\n`;
    xml += `</REGA_Exportacion>\n`;
    return xml;
  },

  /**
   * Genera CSV de movimientos (altas/bajas/expediciones) para SIA/PIGGAN
   * @param {object[]} eventos - registro_eventos
   * @param {object[]} animales
   * @param {object} finca
   * @returns {string} CSV
   */
  generarCSV_Movimientos(eventos, animales, finca) {
    const lines = [];
    lines.push(';;;EXPORTACION MOVIMIENTOS SIA/PIGGAN;;;');
    lines.push(`EXPLOTACION;;${finca?.nombre || ''};;`);
    lines.push(`REGA;;${finca?.codigo_REGA || finca?.rega || ''};;`);
    lines.push('');

    lines.push('FECHA;TIPO_MOVIMIENTO;ANIMAL_ID;CROTAL;ESPECIE;MOTIVO;DESTINO_ORIGEN;OBSERVACIONES');
    const sorted = [...(eventos || [])]
      .filter(e => e.fecha)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    sorted.forEach(e => {
      const a = animales.find(an => an.id === e.animal_id || an.id === e.entidad_id);
      const tipo = e.motivo_tarea || e.tipo || 'no especificado';
      lines.push([
        e.fecha || '',
        tipo,
        e.animal_id || e.entidad_id || '',
        a?.numero_identificacion || e.crotal || '',
        a?.especie || '',
        tipo,
        e.destino || e.origen || '',
        (e.descripcion || e.notas || '').replace(/;/g, ',')
      ].join(';'));
    });

    return '﻿' + lines.join('\r\n');
  },

  /**
   * Genera CSV de producción (leche y carne) compatible con sistemas de calidad
   * @param {object[]} produccionesLeche
   * @param {object[]} produccionesCarne
   * @returns {string} CSV
   */
  generarCSV_Produccion(produccionesLeche, produccionesCarne) {
    const lines = [];
    lines.push(';;;EXPORTACION PRODUCCION PIGGAN;;;');
    lines.push('');

    if (produccionesLeche?.length) {
      lines.push(';;PRODUCCION LECHE;;');
      lines.push('FECHA;LITROS;GRASA%;PROTEINA%;CELULAS_SOMATICAS;EXTRACTO_SECO;DESTINO');
      produccionesLeche.forEach(p => {
        lines.push([
          p.fechaRecogida || p.fecha || '',
          p.litros || 0,
          p.grasa || '',
          p.proteina || '',
          p.celulas_somaticas || '',
          (parseFloat(p.grasa || 0) + parseFloat(p.proteina || 0)).toFixed(2),
          p.destino || p.comprador || ''
        ].join(';'));
      });
      lines.push('');
    }

    if (produccionesCarne?.length) {
      lines.push(';;PRODUCCION CARNE;;');
      lines.push('FECHA;ANIMAL;PESO_CANAL(kg);CATEGORIA;PRECIO_UNITARIO;TOTAL;MATADERO');
      produccionesCarne.forEach(p => {
        lines.push([
          p.fechaSacrificio || p.fecha || '',
          p.animalId || '',
          p.peso_canal || '',
          p.categoria || p.seurop || '',
          p.precio_unitario || '',
          p.precio_total || '',
          p.codigoMatadero || ''
        ].join(';'));
      });
    }

    return '﻿' + lines.join('\r\n');
  },

  /**
   * Descarga/comparte un fichero — primero intenta Capacitor nativo, luego fallback blob
   * @param {string} content - contenido del fichero
   * @param {string} filename - nombre del fichero
   * @param {string} mime - tipo MIME
   */
  async descargar(content, filename, mime = 'text/csv;charset=utf-8') {
    // 1️⃣ Capacitor Filesystem + Share (funciona en Android nativo)
    try {
      const cap = window.Capacitor;
      const fsPlugin = cap?.Plugins?.Filesystem;
      const sharePlugin = cap?.Plugins?.Share;
      if (fsPlugin && sharePlugin) {
        // Convertir string a base64
        const encoder = new TextEncoder();
        const bytes = encoder.encode(content);
        let binary = '';
        bytes.forEach(b => { binary += String.fromCharCode(b); });
        const base64 = btoa(binary);

        const result = await fsPlugin.writeFile({
          path: filename,
          data: base64,
          directory: 'CACHE'
        });
        await sharePlugin.share({
          title: filename,
          text: `Exportación: ${filename}`,
          url: result.uri,
          files: [result.uri],
          dialogTitle: `Compartir ${filename} con…`
        });
        App.toast(`${filename} compartido ✅`);
        return;
      }
    } catch (e) {
      console.warn(`[ExportService] Capacitor falló:`, e?.message || e);
    }

    // 2️⃣ Fallback: blob download (funciona en navegador)
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    App.toast(`${filename} descargado ✅`);
  },

  /**
   * Exportación completa REGA (CSV + XML) con descarga directa
   */
  async exportarREGA(finca, animales, rebanos) {
    const csv = this.generarCSV_CensoREGA(finca, animales, rebanos);
    const xml = this.generarXML_REGA(finca, animales, rebanos);
    const rega = finca?.codigo_REGA || finca?.rega || 'unknown';
    const fecha = new Date().toISOString().split('T')[0];

    await this.descargar(csv, `REGA_Censo_${rega}_${fecha}.csv`, 'text/csv;charset=utf-8');
    await this.descargar(xml, `REGA_Explotacion_${rega}_${fecha}.xml`, 'application/xml;charset=utf-8');
    return { csv, xml };
  },

  /**
   * Exportación movimientos SIA/PIGGAN
   */
  async exportarMovimientos(eventos, animales, finca) {
    const csv = this.generarCSV_Movimientos(eventos, animales, finca);
    const rega = finca?.codigo_REGA || finca?.rega || 'unknown';
    await this.descargar(csv, `Movimientos_SIA_${rega}_${new Date().toISOString().split('T')[0]}.csv`);
    return { csv };
  },

  /**
   * Exportación producción PIGGAN
   */
  async exportarProduccion(produccionesLeche, produccionesCarne) {
    const csv = this.generarCSV_Produccion(produccionesLeche, produccionesCarne);
    await this.descargar(csv, `Produccion_PIGGAN_${new Date().toISOString().split('T')[0]}.csv`);
    return { csv };
  },

  /**
   * Exportación completa (todo en uno)
   */
  async exportarCompleto(finca, animales, rebanos, eventos, prodLeche, prodCarne) {
    await this.exportarREGA(finca, animales, rebanos);
    await this.exportarMovimientos(eventos, animales, finca);
    await this.exportarProduccion(prodLeche, prodCarne);
    return { success: true };
  }
};

// Helper XML escape
function escXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

window.ExportService = ExportService;
