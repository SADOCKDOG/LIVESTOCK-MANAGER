/**
 * Sanitarios Ganado - Livestock Manager
 * Módulo para registrar tratamientos, vacunas y procedimientos sanitarios
 */

const Sanitarios = {
    // Tipos de tratamientos predefinidos
    TIPOS_TRATAMIENTO: [
        'Vacunación',
        'Desparasitación',
        'Antibiótico',
        'Anti-inflamatorio',
        'Vitaminas',
        'Cirugía',
        'Inspección General',
        'Otro'
    ],

    async list(rebanoId = null, fincaId = null) {
        return await ErrorHandler.tryAsync(async () => {
            if (rebanoId) {
                return await window.db.getAllFromIndex('sanitarios_ganado', 'rebanoId', Number(rebanoId));
            }
            
            // Si no hay rebanoId, listar de todos los rebaños de la finca activa
            const fincaActivaId = await ErrorHandler.validateActiveFinca();
            const actualFincaId = fincaId || fincaActivaId;
            
            const rebanos = await window.db.getAllFromIndex('rebanos', 'fincaId', actualFincaId);
            let allSanitarios = [];
            
            for (const rebano of rebanos) {
                const sanitarios = await window.db.getAllFromIndex('sanitarios_ganado', 'rebanoId', rebano.id);
                allSanitarios = allSanitarios.concat(sanitarios);
            }
            
            return allSanitarios.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        }, { entity: 'Sanitarios', action: 'list' });
    },

    async get(id) {
        return await window.db.get('sanitarios_ganado', Number(id));
    },

    async save(data) {
        return await ErrorHandler.tryAsync(async () => {
            ErrorHandler.validateRequired('rebanoId', data.rebanoId, 'Rebaño es obligatorio');
            ErrorHandler.validateRequired('tipo_tratamiento', data.tipo_tratamiento, 'Tipo de tratamiento es obligatorio');
            ErrorHandler.validateDate(data.fecha);

            const esEdicion = data.id !== undefined && data.id !== null && data.id !== '';

            // Integración con Catálogo Sanitario: auto-rellenar datos si se seleccionó un medicamento del catálogo
            if (data.catalogoMedId && window.CatalogoSanitario) {
                const med = window.CatalogoSanitario.obtenerMedicamento(data.catalogoMedId);
                if (med) {
                    data.medicamento = data.medicamento || med.principioActivo;
                    data.tiempo_espera_carne_dias = data.tiempo_espera_carne_dias ?? med.retiroCarneDias;
                    data.tiempo_espera_leche_dias = data.tiempo_espera_leche_dias ?? (med.retiroLecheDias || 0);
                    data.prohibidoLeche = data.prohibidoLeche ?? med.prohibidoLeche;
                    data.tipo_tratamiento = data.tipo_tratamiento || med.categoria;
                }
            }

            const sanitarioData = {
                ...data,
                rebanoId: Number(data.rebanoId),
                prohibidoLeche: data.prohibidoLeche === true,
                actualizadoEn: new Date().toISOString()
            };

            let savedId;
            if (esEdicion) {
                sanitarioData.id = Number(data.id);
                await window.db.put('sanitarios_ganado', sanitarioData);
                savedId = sanitarioData.id;
            } else {
                delete sanitarioData.id;
                sanitarioData.creadoEn = new Date().toISOString();
                savedId = await window.db.add('sanitarios_ganado', sanitarioData);
            }

            // Notificar al sistema via EventBus
            if (window.EventBus) {
                window.EventBus.emit('tratamiento:added', {
                    tratamiento: { ...sanitarioData, id: savedId },
                    esEdicion
                });
            }

            return savedId;
        }, { entity: 'Sanitarios', action: 'save' });
    },

    async delete(id) {
        const result = await window.db.delete('sanitarios_ganado', Number(id));
        if (window.EventBus) {
            window.EventBus.emit('tratamiento:deleted', { id: Number(id) });
        }
        return result;
    },

    /**
     * Obtiene próximos tratamientos (proyección)
     */
    async getProximosTratamientos(rebanoId, diasAdelante = 30) {
        return await ErrorHandler.tryAsync(async () => {
            const sanitarios = await this.list(rebanoId);
            if (sanitarios.length === 0) return [];
            
            const hoy = new Date();
            const limite = new Date(hoy.getTime() + diasAdelante * 24 * 60 * 60 * 1000);
            
            // Asumir que tratamientos se repiten cada 30, 60 o 90 días según tipo
            const proximosTratamientos = [];
            
            sanitarios.forEach(s => {
                const ultimoTratamiento = new Date(s.fecha);
                const diasDesdeUltimo = (hoy - ultimoTratamiento) / (24 * 60 * 60 * 1000);
                
                // Calcular intervalo según tipo
                let intervalo = 90; // Default 3 meses
                if (s.tipo_tratamiento.includes('Desparasit')) intervalo = 60;
                if (s.tipo_tratamiento.includes('Vacun')) intervalo = 180; // 6 meses
                
                const proximaFecha = new Date(ultimoTratamiento.getTime() + intervalo * 24 * 60 * 60 * 1000);
                
                if (proximaFecha >= hoy && proximaFecha <= limite) {
                    proximosTratamientos.push({
                        ...s,
                        fechaProgramada: proximaFecha.toISOString().split('T')[0],
                        diasHasta: Math.ceil((proximaFecha - hoy) / (24 * 60 * 60 * 1000)),
                        urgencia: Math.ceil((proximaFecha - hoy) / (24 * 60 * 60 * 1000)) < 7 ? 'urgente' : 'normal'
                    });
                }
            });
            
            return proximosTratamientos.sort((a, b) => a.diasHasta - b.diasHasta);
        }, { action: 'getProximosTratamientos' });
    },

    /**
     * Historial de tratamientos por tipo
     */
    async getHistorialPorTipo(rebanoId, tipo_tratamiento) {
        return await ErrorHandler.tryAsync(async () => {
            const sanitarios = await this.list(rebanoId);
            return sanitarios
                .filter(s => s.tipo_tratamiento === tipo_tratamiento)
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        }, { action: 'getHistorialPorTipo' });
    },

    /**
     * Cuenta de animales tratados vs total del rebaño
     */
    async getCoberturaTratamiento(rebanoId) {
        return await ErrorHandler.tryAsync(async () => {
            const sanitarios = await this.list(rebanoId);
            const animalesDelRebano = await window.db.getAllFromIndex('animales', 'rebanoId', rebanoId);
            
            if (animalesDelRebano.length === 0) return { cubiertos: 0, total: 0, porcentaje: 0 };
            
            // Contar animales únicos en los últimos 30 días
            const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const sanitariosRecientes = sanitarios.filter(s => new Date(s.fecha) >= hace30Dias);
            
            // Asumir que cada tratamiento es para todo el rebaño (simplificación)
            const cubiertos = sanitariosRecientes.length > 0 ? animalesDelRebano.length : 0;
            
            return {
                cubiertos,
                total: animalesDelRebano.length,
                porcentaje: animalesDelRebano.length > 0 ? Math.round((cubiertos / animalesDelRebano.length) * 100) : 0,
                ultimoTratamiento: sanitarios.length > 0 ? sanitarios[0].fecha : null
            };
        }, { action: 'getCoberturaTratamiento' });
    }
};

window.Sanitarios = Sanitarios;
