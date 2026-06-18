/**
 * Gastos Ganadería - Livestock Manager
 * Módulo para control de costos y gastos operativos
 */

const Gastos = {
    async list(fincaId = null, rebanoId = null) {
        return await ErrorHandler.tryAsync(async () => {
            const fincaActivaId = await ErrorHandler.validateActiveFinca();
            const actualFincaId = fincaId || fincaActivaId;
            
            let gastos = await window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', actualFincaId);
            
            if (rebanoId) {
                gastos = gastos.filter(g => g.rebanoId === rebanoId);
            }
            
            return gastos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        }, { entity: 'Gastos', action: 'list', fincaId, rebanoId });
    },

    async get(id) {
        return await window.db.get('gastos_ganaderia', Number(id));
    },

    async save(data) {
        return await ErrorHandler.tryAsync(async () => {
            const fincaActivaId = await ErrorHandler.validateActiveFinca();
            
            ErrorHandler.validateRequired('concepto', data.concepto, 'Concepto de gasto es obligatorio');
            ErrorHandler.validateRequired('fecha', data.fecha, 'Fecha es obligatoria');
            ErrorHandler.validateNumeric(data.monto, 'Monto', 0, null);

            const esEdicion = data.id !== undefined && data.id !== null && data.id !== '';

            // Capturar Snapshot de contexto
            const snapMetadata = await window.SnapshotService.buildSnapMetadata(data.rebanoId);

            const gastoData = {
                ...data,
                ...snapMetadata,
                fincaId: fincaActivaId,
                monto: Number(data.monto),
                rebanoId: data.rebanoId ? Number(data.rebanoId) : null,
                actualizadoEn: new Date().toISOString()
            };
            
            if (esEdicion) {
                gastoData.id = Number(data.id);
                await window.db.put('gastos_ganaderia', gastoData);
            } else {
                delete gastoData.id;
                gastoData.creadoEn = new Date().toISOString();
                await window.db.add('gastos_ganaderia', gastoData);
            }

            if (window.EventBus) {
                window.EventBus.emit('gasto:created', { gasto: gastoData });
            }

            return gastoData.id;
        }, { entity: 'Gastos', action: 'save' });
    },

    async delete(id) {
        await window.db.delete('gastos_ganaderia', Number(id));
        if (window.EventBus) {
            window.EventBus.emit('gasto:deleted', { id: Number(id) });
        }
    },

    /**
     * Calcula total de gastos en un período
     */
    async getTotalByPeriod(fincaId, dateFrom, dateTo) {
        return await ErrorHandler.tryAsync(async () => {
            const gastos = await this.list(fincaId);
            
            return gastos
                .filter(g => {
                    const fecha = new Date(g.fecha);
                    return fecha >= new Date(dateFrom) && fecha <= new Date(dateTo);
                })
                .reduce((sum, g) => sum + (g.monto || 0), 0);
        }, { action: 'getTotalByPeriod' });
    },

    /**
     * Calcula gastos promedio por animal
     */
    async getCostoPromedioPorAnimal(fincaId, rebanoId = null) {
        return await ErrorHandler.tryAsync(async () => {
            let animales = await Animales.list();
            if (rebanoId) {
                animales = animales.filter(a => a.rebanoId === rebanoId);
            }
            
            if (animales.length === 0) return 0;
            
            const gastos = await this.list(fincaId, rebanoId);
            const totalGastos = gastos.reduce((sum, g) => sum + (g.monto || 0), 0);
            
            return totalGastos / animales.length;
        }, { action: 'getCostoPromedioPorAnimal' });
    },

    /**
     * Desglose de gastos por concepto
     */
    async desglosePorConcepto(fincaId) {
        return await ErrorHandler.tryAsync(async () => {
            const gastos = await this.list(fincaId);
            const desglose = {};
            
            gastos.forEach(g => {
                const concepto = g.concepto || 'Otros';
                desglose[concepto] = (desglose[concepto] || 0) + (g.monto || 0);
            });
            
            return Object.entries(desglose)
                .map(([concepto, monto]) => ({ concepto, monto }))
                .sort((a, b) => b.monto - a.monto);
        }, { action: 'desglosePorConcepto' });
    }
};

window.Gastos = Gastos;
