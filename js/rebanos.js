const Rebanos = {
    async list() {
        const fincaId = await Fincas.getActiveId();
        if (!fincaId) return [];
        const all = await window.db.getAll('rebanos');
        return all.filter(r => Number(r.fincaId) === Number(fincaId));
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
        const animales = await window.db.getAllFromIndex('animales', 'rebanoId', numId);
        if (animales.length > 0) {
            throw new Error('No se puede eliminar el rebaño porque tiene animales asociados.');
        }
        return window.db.delete('rebanos', numId);
    }
};

window.Rebanos = Rebanos;
