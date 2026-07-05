return `
      ${bannerInterno}
      <!-- Card de RESUMEN Normalizada -->
      <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
        <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center justify-between gap-6">
          <span class="flex items-center gap-6" style="color:var(--c-info);">${Icons.documento()} Resumen Documentos</span>
          <button class="resumen-toggle" onclick="DocumentosView.toggleResumen(this)">${Icons.chevronAbajo()}</button>
        </div>
        <div class="resumen-body flex flex-col">
          <div class="py-10 flex justify-between items-center border-bottom-222">
            <span class="text-[0.65rem] text-gray uppercase font-900">${Icons.documento()} TOTAL</span>
            <strong class="text-lg font-950" style="color: var(--c-info);">${totalDocs}</strong>
          </div>
          <div class="py-10 flex justify-between items-center border-bottom-222">
            <span class="text-[0.65rem] text-gray uppercase font-900">${Icons.exportar()} DIMOE</span>
            <strong class="text-lg font-950" style="color: var(--c-success);">${porTipo.dimoe || 0}</strong>
          </div>
          <div class="py-10 flex justify-between items-center border-bottom-222">
            <span class="text-[0.65rem] text-gray uppercase font-900">${Icons.libroVentas()} FACTURAS</span>
            <strong class="text-lg font-950" style="color: var(--c-info);">${porTipo.factura || 0}</strong>
          </div>
          <div class="py-10 flex justify-between items-center border-bottom-222">
            <span class="text-[0.65rem] text-gray uppercase font-900">${Icons.contratos()} CERTIFICADOS</span>
            <strong class="text-lg font-950" style="color: var(--c-warning);">${porTipo.certificado || 0}</strong>
          </div>
          <div class="py-10 flex justify-between items-center border-bottom-222">
            <span class="text-[0.65rem] text-gray uppercase font-900">${Icons.informeRega()} DIB/REGA</span>
            <strong class="text-lg font-950" style="color: var(--c-purple);">${porTipo.dib || 0}</strong>
          </div>
          <div class="py-10 flex justify-between items-center border-bottom-222">
            <span class="text-[0.65rem] text-gray uppercase font-900">${Icons.animales()} CROTALES</span>
            <strong class="text-lg font-950" style="color: var(--c-orange);">${porTipo.crotales || 0}</strong
          </div>
        </div>
      </div>

      <!-- Filtro de búsqueda integrado -->
      <div class="flex gap-8 mb-14">
        <div class="relative flex-1 min-w-0">
          <input type="search" id="search-documentos" placeholder="Buscar por número, tipo o fecha..."
                 oninput="DocumentosView._filtrar(this.value)"
                 class="w-full">
        </div>
        <select id="documentos-filtro-tipo" class="form-select-gold"
                onchange="DocumentosView._filtrarTipo(this.value)"
                style="width:120px; min-width:110px; flex-shrink:0;">
          <option value="todos">Todos los tipos</option>
          <option value="dimoe">DIMOE</option>
          <option value="factura">Facturas</option>
          <option value="certificado">Certificados</option
          <option value="dib">DIB/REGA</option>
          <option value="crotales">Crotales</option>
        </select>
      </div>

      <div class="card-registro" style="--registro-color: var(--c-info); width:100%;">
        <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center gap-6">${Icons.documento()} DOCUMENTOS</div>
        <div class="grid grid-cols-5 gap-4 mb-6">
          <div class="bg-dark rounded-lg p-6 text-center border border-222">
            <div class="text-[0.5rem] text-gray uppercase font-800 tracking-wider">TOTAL</div>
            <div class="text-base font-black text-blue">${totalDocs}</div>
          </div>
          <div class="bg-dark rounded-lg p-6 text-center border border-222">
            <div class="text-[0.5rem] text-gray uppercase font-800 tracking-wider">DIMOE</div>
            <div class="text-base font-black text-green">${porTipo.dimoe || 0}</div>
          </div>
          <div class="bg-dark rounded-lg p-6 text-center border border-222">
            <div class="text-[0.5rem] text-gray uppercase font-800 tracking-wider">FACTURAS</div>
            <div class="text-base font-black text-amber">${porTipo.factura || 0}</div>
          </div>
          <div class="bg-dark rounded-lg p-6 text-center border border-222">
            <div class="text-[0.5rem] text-gray uppercase font-800 tracking-wider">DIB/REGA</div>
            <cd class="text-base font-black text-purple">${porTipo.dib || 0}</div>
          </div>
          <div class="bg-dark rounded-lg p-6 text-center border border-222">
            <div class="text-[0.5rem] text-gray uppercase font-800 tracking-wider">CROTALES</div>
            <div class="text-base font-black text-gold">${porTipo.crotales || 0}</div>
          </div>
        </div>
      </div>

      <div class="card-registro p-12 mb-14 border-222 card-dark-gradient border-top-theme pb-24" style="--theme-color: var(--p-gold); --registro-color: var(--p-gold);">
        <div class="section-header-theme">ACCIONES</div>
        <div class="grid grid-cols-2 gap-10 max-w-320 mx-auto">
          <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="DocumentosView._abrirAsistenteConsulta()">
            ${Icons.buscar()}
            <span class="widget