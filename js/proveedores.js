/**
 * Proveedores - Livestock Manager Premium v4.0
 * Modelo de datos para registro de proveedores con trazabilidad de gastos.
 */

const Proveedores = {
    /**
     * Listar proveedores con filtros opcionales
     * @param {Object} filtros - { activo, busqueda, categoria }
     */
    async list(filtros = {}) {
        return await ErrorHandler.tryAsync(async () => {
            let proveedores = await window.db.getAll('proveedores');

            if (filtros.activo !== undefined) {
                proveedores = proveedores.filter(p => p.activo === filtros.activo);
            }
            if (filtros.categoria) {
                proveedores = proveedores.filter(p =>
                    (p.categorias || []).includes(filtros.categoria)
                );
            }
            if (filtros.busqueda) {
                const q = filtros.busqueda.toLowerCase();
                proveedores = proveedores.filter(p =>
                    (p.nombre || '').toLowerCase().includes(q) ||
                    (p.nif_cif || '').toLowerCase().includes(q) ||
                    (p.ciudad || '').toLowerCase().includes(q)
                );
            }

            return proveedores.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        }, { entity: 'Proveedores', action: 'list' });
    },

    async get(id) {
        return await window.db.get('proveedores', Number(id));
    },

    async getByNif(nif) {
        try {
            return await window.db.getFromIndex('proveedores', 'nif_cif', nif.trim().toUpperCase());
        } catch (e) {
            return null;
        }
    },

    async save(data) {
        return await ErrorHandler.tryAsync(async () => {
            const esEdicion = data.id !== undefined && data.id !== null && data.id !== '';

            ErrorHandler.validateRequired('nombre', data.nombre, 'Nombre o razón social es obligatorio');

            if (data.nif_cif) {
                const existente = await this.getByNif(data.nif_cif);
                if (existente && (!esEdicion || existente.id !== Number(data.id))) {
                    throw new Error(`Ya existe un proveedor con NIF/CIF "${data.nif_cif}"`);
                }
            }

            const proveedorData = {
                nombre: data.nombre.trim(),
                nif_cif: (data.nif_cif || '').trim().toUpperCase(),
                direccion: (data.direccion || '').trim(),
                codigo_postal: (data.codigo_postal || '').trim(),
                ciudad: (data.ciudad || '').trim(),
                provincia: (data.provincia || '').trim(),
                telefono: (data.telefono || '').trim(),
                email: (data.email || '').trim(),
                categorias: Array.isArray(data.categorias) ? data.categorias : [],
                condiciones_pago: (data.condiciones_pago || '').trim(),
                notas: (data.notas || '').trim(),
                activo: data.activo !== undefined ? data.activo : true,
                actualizadoEn: new Date().toISOString()
            };

            if (esEdicion) {
                proveedorData.id = Number(data.id);
                await window.db.put('proveedores', proveedorData);
            } else {
                proveedorData.creadoEn = new Date().toISOString();
                const newId = await window.db.add('proveedores', proveedorData);
                proveedorData.id = newId;
            }

            if (window.EventBus) {
                window.EventBus.emit('proveedor:created', { proveedor: proveedorData });
            }

            return proveedorData.id;
        }, { entity: 'Proveedores', action: 'save' });
    },

    async delete(id) {
        return await ErrorHandler.tryAsync(async () => {
            const gastos = await this.getGastos(id);
            if (gastos.length > 0) {
                throw new Error(`No se puede eliminar: el proveedor tiene ${gastos.length} gasto(s) asociado(s).`);
            }
            await window.db.delete('proveedores', Number(id));
            if (window.EventBus) {
                window.EventBus.emit('proveedor:deleted', { id: Number(id) });
            }
        }, { entity: 'Proveedores', action: 'delete', id });
    },

    // ============================================
    // TRAZABILIDAD: Historial de gastos del proveedor
    // ============================================

    /**
     * Obtener todos los gastos asociados a un proveedor
     */
    async getGastos(proveedorId) {
        return await ErrorHandler.tryAsync(async () => {
            const fincaActivaId = await ErrorHandler.validateActiveFinca();
            const todos = await window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaActivaId);
            return todos
                .filter(g => Number(g.proveedorId) === Number(proveedorId))
                .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
        }, { entity: 'Proveedores', action: 'getGastos', proveedorId });
    },

    /**
     * Resumen de actividad del proveedor
     */
    async getResumen(proveedorId) {
        const gastos = await this.getGastos(proveedorId);

        const totalGastado = gastos.reduce((s, g) => s + (g.monto || 0), 0);

        // Agrupar por categoría
        const porCategoria = {};
        gastos.forEach(g => {
            const cat = g.categoria || 'Otros';
            if (!porCategoria[cat]) porCategoria[cat] = { total: 0, count: 0 };
            porCategoria[cat].total += (g.monto || 0);
            porCategoria[cat].count += 1;
        });

        // Últimos 12 meses
        const hace12meses = new Date();
        hace12meses.setMonth(hace12meses.getMonth() - 12);
        const ultimoAno = gastos.filter(g => new Date(g.fecha) >= hace12meses);
        const gastoAnual = ultimoAno.reduce((s, g) => s + (g.monto || 0), 0);

        return {
            total_gastos: gastos.length,
            total_gastado: totalGastado,
            gasto_anual: gastoAnual,
            gasto_promedio: gastos.length > 0 ? totalGastado / gastos.length : 0,
            por_categoria: porCategoria,
            ultimo_gasto: gastos.length > 0 ? gastos[0] : null
        };
    }
};

window.Proveedores = Proveedores;
