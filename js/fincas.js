const Fincas = {
    // Normalización única del código REGA: usa ComunidadesService (criterio SIGGAN:
    // mayúsculas + elimina separadores) con fallback simple si no está cargado.
    _normalizarREGA(value) {
        return window.ComunidadesService
            ? window.ComunidadesService.normalizarREGA(value || '')
            : (value || '').toString().trim().toUpperCase();
    },

    async list() {
        const list = await window.db.getAll('fincas');
        if (list) {
            list.forEach(f => {
                if (f) {
                    const regaVal = this._normalizarREGA(f.rega || f.codigo_REGA);
                    f.rega = regaVal;
                    f.codigo_REGA = regaVal;
                }
            });
        }
        return list;
    },

    async get(id) {
        const f = await window.db.get('fincas', Number(id));
        if (f) {
            const regaVal = this._normalizarREGA(f.rega || f.codigo_REGA);
            f.rega = regaVal;
            f.codigo_REGA = regaVal;
        }
        return f;
    },

    async getActiveId() {
        let id = localStorage.getItem('activeFincaIdLivestock');

        // 1. Recuperar de IndexedDB (tabla meta) si localStorage es volátil y se borró
        if (!id) {
            try {
                const meta = await window.db.get('meta', 'activeFincaId');
                if (meta && meta.value) {
                    id = meta.value;
                    localStorage.setItem('activeFincaIdLivestock', id);
                }
            } catch (e) { console.warn("[Fincas] Error leyendo meta", e); }
        }

        // 2. Autorecuperación de seguridad: Si se perdió el ID pero hay fincas, auto-seleccionar la primera
        if (!id) {
            const todasFincas = await this.list();
            if (todasFincas.length > 0) {
                id = todasFincas[0].id;
                await this.setActiveId(id);
            } else {
                return null;
            }
        }

        // Verificar que la finca realmente existe en la DB actual
        const finca = await this.get(id).catch(() => null);
        if (!finca) {
            localStorage.removeItem('activeFincaIdLivestock');
            try { await window.db.delete('meta', 'activeFincaId'); } catch (e) { }
            return null;
        }
        return Number(id);
    },

    async getActive() {
        const id = await this.getActiveId();
        if (!id) return null;
        return this.get(id);
    },

    async setActiveId(id) {
        localStorage.setItem('activeFincaIdLivestock', id);
        try {
            await window.db.put('meta', { key: 'activeFincaId', value: id });
        } catch (e) { console.warn("[Fincas] Error guardando meta", e); }
        window.dispatchEvent(new CustomEvent('fincaChanged', { detail: { id } }));
    },

    async save(data) {
        if (data) {
            const regaVal = this._normalizarREGA(data.rega || data.codigo_REGA);
            data.rega = regaVal;
            data.codigo_REGA = regaVal;
        }

        const esEdicion = data.id !== undefined && data.id !== null && data.id !== '';

        if (esEdicion) {
            data.id = Number(data.id);
            await window.db.put('fincas', data);
            return data.id;
        } else {
            delete data.id;
            const newId = await window.db.add('fincas', {
                ...data,
                creadoEn: new Date().toISOString()
            });

            if (!(await this.getActiveId())) {
                await this.setActiveId(newId);
            }
            return newId;
        }
    },

    async delete(id) {
        const numId = Number(id);
        const rebanos = await window.db.getAllFromIndex('rebanos', 'fincaId', numId);

        if (rebanos.length > 0) {
            throw new Error('No se puede eliminar la finca porque tiene rebaños asociados.');
        }
        return window.db.delete('fincas', numId);
    },

    /**
     * Importar múltiples fincas masivamente
     * Sobrescribe fincas existentes con mismo nombre
     * @param {Array} fincasData - Array de objetos finca a importar
     * @returns {Object} {importadas: [], errores: []}
     */
    async importarMasivo(fincasData) {
        return await ErrorHandler.tryAsync(async () => {
            if (!Array.isArray(fincasData) || fincasData.length === 0) {
                throw new Error('No hay fincas para importar');
            }

            const importadas = [];
            const errores = [];

            for (let i = 0; i < fincasData.length; i++) {
                try {
                    const finca = fincasData[i];

                    // Validar campos requeridos
                    ErrorHandler.validateRequired('nombre', finca.nombre, 'Nombre es requerido');
                    ErrorHandler.validateRequired('propietario', finca.propietario, 'Propietario es requerido');

                    const regaVal = this._normalizarREGA(finca.rega || finca.codigo_REGA);
                    finca.rega = regaVal;
                    finca.codigo_REGA = regaVal;

                    // Buscar si finca con mismo nombre ya existe
                    const existentes = await this.list();
                    const fincaExistente = existentes.find(f => f.nombre === finca.nombre);

                    let fincaId;
                    if (fincaExistente) {
                        // Actualizar finca existente manteniendo el ID
                        const fincaActualizada = {
                            ...finca,
                            id: fincaExistente.id,
                            actualizadoEn: new Date().toISOString()
                        };
                        await window.db.put('fincas', fincaActualizada);
                        fincaId = fincaExistente.id;
                    } else {
                        // Crear nueva finca
                        const nuevaFinca = {
                            ...finca,
                            creadoEn: new Date().toISOString()
                        };
                        delete nuevaFinca.id;
                        fincaId = await window.db.add('fincas', nuevaFinca);
                    }

                    // Si es la primera finca que se importa y no hay activa, ponerla como activa
                    if (!(await this.getActiveId())) {
                        await this.setActiveId(fincaId);
                    }

                    importadas.push({
                        id: fincaId,
                        nombre: finca.nombre,
                        accion: fincaExistente ? 'actualizada' : 'creada'
                    });
                } catch (error) {
                    errores.push(`Finca ${i + 1} (${fincasData[i].nombre}): ${error.message}`);
                }
            }

            return {
                importadas,
                errores,
                total: fincasData.length,
                exitosas: importadas.length,
                fallidas: errores.length
            };
        }, { action: 'importarMasivo' });
    },

    /**
     * Crear nueva finca manualmente
     * @param {Object} datos - {nombre, propietario, direccion, telefonoContacto, zonas}
     * @returns {number} ID de la finca creada
     */
    async crearNueva(datos) {
        return await ErrorHandler.tryAsync(async () => {
            // Validar campos requeridos
            ErrorHandler.validateRequired('nombre', datos.nombre, 'Nombre es requerido');
            ErrorHandler.validateRequired('propietario', datos.propietario, 'Propietario es requerido');

            // Validar que no exista con mismo nombre
            const existentes = await this.list();
            if (existentes.some(f => f.nombre === datos.nombre)) {
                throw new Error(`Ya existe una finca con nombre "${datos.nombre}"`);
            }

            // Crear finca nueva
            const regaNorm = this._normalizarREGA(datos.rega || datos.codigo_REGA);
            const nuevaFinca = {
                nombre: datos.nombre.trim(),
                propietario: datos.propietario.trim(),
                direccion: datos.direccion.trim(),
                telefonoContacto: (datos.telefonoContacto || '').trim(),
                nif_cif: (datos.nif_cif || '').trim(),
                email: (datos.email || '').trim(),
                rega: regaNorm,
                // Espejo para compatibilidad con vistas que leen codigo_REGA
                codigo_REGA: regaNorm,
                cea: (datos.cea || '').toString().trim().toUpperCase(),
                adsg_nombre: (datos.adsg_nombre || '').trim(),
                comunidad_autonoma: datos.comunidad_autonoma || '',
                provincia: datos.provincia || '',
                municipio: (datos.municipio || '').trim(),
                tipo_explotacion: datos.tipo_explotacion || '',
                clasificacion_zootecnica: datos.clasificacion_zootecnica || '',
                capacidad_maxima: datos.capacidad_maxima != null ? Number(datos.capacidad_maxima) : null,
                especies_autorizadas: Array.isArray(datos.especies_autorizadas) ? datos.especies_autorizadas : [],
                zonas: datos.zonas || [],
                creadoEn: new Date().toISOString()
            };

            const fincaId = await window.db.add('fincas', nuevaFinca);

            // Si es la primera finca, establecerla como activa
            if (!(await this.getActiveId())) {
                await this.setActiveId(fincaId);
            }

            return fincaId;
        }, { action: 'crearNueva', entity: 'Fincas' });
    }
};

window.Fincas = Fincas;
