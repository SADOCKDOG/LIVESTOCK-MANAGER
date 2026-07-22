/**
 * Compras - Livestock Manager
 * Modelo de datos para registro de compras de ganado.
 */

const Compras = {
    /**
     * Listar compras con filtros opcionales
     * @param {Object} filtros - { fincaId, desde, hasta }
     */
    async list(filtros = {}) {
        return await ErrorHandler.tryAsync(async () => {
            let compras = await window.db.getAll('compras_ganado');

            // Filtrar por fincaId si se proporciona
            if (filtros.fincaId !== undefined) {
                compras = compras.filter(c => c.fincaId === Number(filtros.fincaId));
            }
            // Filtrar por rango de fechas (opcional)
            if (filtros.desde) {
                const desde = new Date(filtros.desde);
                compras = compras.filter(c => c.fecha && new Date(c.fecha) >= desde);
            }
            if (filtros.hasta) {
                const hasta = new Date(filtros.hasta);
                compras = compras.filter(c => c.fecha && new Date(c.fecha) <= hasta);
            }

            return compras.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        }, { entity: 'Compras', action: 'list' });
    },

    async get(id) {
        return await window.db.get('compras_ganado', Number(id));
    },

    async save(data) {
        return await ErrorHandler.tryAsync(async () => {
            const esEdicion = data.id !== undefined && data.id !== null && data.id !== '';

            // Validaciones básicas
            if (data.animal_id_list && !Array.isArray(data.animal_id_list)) {
                throw new Error('animal_id_list debe ser un array');
            }
            if (data.total_amount !== undefined && (isNaN(parseFloat(data.total_amount)) || parseFloat(data.total_amount) < 0)) {
                throw new Error('total_amount debe ser un número positivo');
            }
            if (data.fecha === undefined || data.fecha === '') {
                throw new Error('Fecha requerida');
            }

            const compraData = {
                animal_id_list: data.animal_id_list || [],
                total_amount: data.total_amount !== undefined ? parseFloat(data.total_amount) : 0,
                proveedor_id: data.proveedor_id ? Number(data.proveedor_id) : null,
                factura: data.factura || null,
                fecha: data.fecha,
                pago_pendiente: data.pago_pendiente !== undefined ? Boolean(data.pago_pendiente) : false,
                fincaId: data.fincaId !== undefined ? Number(data.fincaId) : null,
                creadoEn: data.creadoEn || new Date().toISOString(),
                actualizadoEn: new Date().toISOString()
            };

            if (esEdicion) {
                compraData.id = Number(data.id);
                await window.db.put('compras_ganado', compraData);
            } else {
                delete compraData.id;
                const newId = await window.db.add('compras_ganado', compraData);
                compraData.id = newId;
            }

            if (window.EventBus) {
                window.EventBus.emit('compra:creada', { compra: compraData });
            }

            return compraData.id;
        }, { entity: 'Compras', action: 'save' });
    },

    async eliminar(id) {
        return await ErrorHandler.tryAsync(async () => {
            await window.db.delete('compras_ganado', Number(id));
            if (window.EventBus) {
                window.EventBus.emit('compra:eliminada', { id: Number(id) });
            }
        }, { entity: 'Compras', action: 'delete' });
    }
};

window.Compras = Compras;