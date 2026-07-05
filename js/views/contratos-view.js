async _renderLista(lista) {
    const container = document.getElementById('contratos-lista-standalone');
    if (!container) return;

    if (lista.length === 0) {
      container.innerHTML = `<div class="empty-state"><p class="empty-state-text">No hay contratos que coincidan</p></div>`;
      return;
    }

    const compradores = await Compradores.list().catch(() => []);
    const compMap = {};
    compradores.forEach(c => compMap[c.id] = c);

    container.innerHTML = `<div class="grid gap-12">${lista.map(c => {
        const color = c.tipo === 'leche' ? 'var(--c-info)' : (c.tipo === 'carne' ? 'var(--c-danger)' : 'var(--c-purple)');
        const comp = compMap[c.compradorId];

        return `
        <div class="card-registro" onclick="ContratosView.renderFormulario({get: (k) => k === 'id' ? ${c.id} : null})"
             style="--registro-color: ${color}; display:flex; gap:10px; align-items:stretch;">
            <!-- BLOQUE IZQUIERDO: Identificación y Datos -->
            <div class="flex-1 min-w-0 flex flex-col justify-center">
                <!-- Encabezado de la Card -->
                <div class="flex items-center gap-10 min-w-0">
                    <span class="text-xl" style="color:${color};">${c.tipo === 'leche' ? Icons.leche() : Icons.carne()}</span>
                    <div class="font-950 uppercase text-[0.9rem] tracking-tight"
                         style="color:var(--p-gold); font-weight: 950;">
                        ${c.numero_contrato}
                    </div>
                </div>
                <!-- Metadatos Secundarios -->
                <div class="flex flex-wrap gap-x-12 gap-y-2 text-[0.62rem] text-gray font-800 uppercase mt-4">
                    ${comp ? `<span>${Icons.compradores()} ${comp.nombre}</span>` : `<span>${Icons.edificio()} SIN COMPRADOR</span>`}
                    <span>·</span>
                    <span>${Icons.calendar()} ${c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString() : '—'}</span>
                </div>
            </div>
            <!-- BLOQUE DERECHO: Estado y Acción -->
            <div class="flex flex-col items-end justify-between flex-shrink-0">
                <!-- Parte Superior: Viñeta Iluminada (Status Badge) -->
                <div class="top-part">
                    <div style="background:${c.activo ? 'var(--c-success)' : 'var(--c-danger')}15;
                                color:${c.activo ? 'var(--c-success)' : 'var(--c-danger)'};
                                border:1px solid ${c.activo ? 'var(--c-success)' : 'var(--c-danger)'}40;
                                filter:drop-shadow(0 0 4px ${c.activo ? 'var(--c-success)' : 'var(--c-danger)'});
                                padding:2px 8px; border-radius:6px; font-size:0.6rem;
                                font-weight:900; text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap;">
                        ${c.activo ? 'ACTIVO' : 'INACTIVO'}
                    </div>
                </div>
                <!-- Parte Inferior: Link de Acción -->
                <div class="bottom-part">
                    <span style="color:var(--c-warning); font-weight:800; font-size:0.7rem; text-transform:uppercase;">
                        FICHA ${Icons.flechaDerecha()}
                    </span>
                </div>
            </div>
        </div>
        `;
    }).join('')}</div>`;
  },