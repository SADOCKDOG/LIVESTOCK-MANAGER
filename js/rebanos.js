const Rebanos = {
    async list() {
        const fincaId = await Fincas.getActiveId();
        if (!fincaId) return [];
        const all = await window.db.getAll('rebanos');
        return all.filter(r => Number(r.fincaId) === Number(fincaId) && !r?.anulado);
    },

    async get(id) {
        return window.db.get('rebanos', Number(id));
    },

    async save(data) {
        return await ErrorHandler.tryAsync(async () => {
            const fincaId = await ErrorHandler.validateActiveFinca();

            const esEdicion = data.id !== undefined && data.id !== null && data.id !== '';
            
            const rebanoData = {
                ...data,
                fincaId: fincaId,
                capacidad_total: Number(data.capacidad_total) || 0,
                actualizadoEn: new Date().toISOString()
            };

            if (esEdicion) {
                rebanoData.id = Number(data.id);
                await window.db.put('rebanos', rebanoData);
                return rebanoData.id;
            } else {
                delete rebanoData.id;
                rebanoData.creadoEn = new Date().toISOString();
                return await window.db.add('rebanos', rebanoData);
            }
        }, { entity: 'Rebanos', action: 'save' });
    },

    async delete(id) {
        const numId = Number(id);
        const rebano = await this.get(numId);
        if (rebano && window.PremiumManager && window.PremiumManager.isFree() && rebano.demo) {
            throw new Error('No puedes eliminar rebaños de demostración en la versión gratuita');
        }
        const animales = await window.db.getAllFromIndex('animales', 'rebanoId', numId);
        const activos = (animales || []).filter(a => !a?.anulado && (a.estado || 'activo') === 'activo');
        if (activos.length > 0) {
            throw new Error('No se puede eliminar el rebaño porque tiene animales asociados.');
        }
        if (!rebano) return;
        rebano.estado = 'inactivo';
        rebano.anulado = true;
        rebano.anuladoEn = new Date().toISOString();
        rebano.actualizadoEn = new Date().toISOString();
        await window.db.put('rebanos', rebano);
        await window.db.add('registro_eventos', {
            fincaId: rebano.fincaId || await Fincas.getActiveId().catch(() => null),
            entidad_id: numId,
            tipo_entidad: 'rebano',
            tipo: 'auditoria',
            motivo_tarea: 'anulacion_rebano',
            fecha: new Date().toISOString().split('T')[0],
            descripcion: `Anulación de rebaño "${rebano.nombre || numId}"`,
            creadoEn: new Date().toISOString(),
        }).catch(() => {});
    }
};

window.Rebanos = Rebanos;
