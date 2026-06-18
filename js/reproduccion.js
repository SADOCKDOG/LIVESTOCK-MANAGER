/**
 * Reproducción - Livestock Manager
 * Módulo para el control del ciclo reproductivo (celos, montas, IA, diagnósticos y partos)
 */

const Reproduccion = {
    TIPOS_EVENTO: [
        'Celo',
        'Inseminación Artificial',
        'Monta Natural',
        'Diagnóstico Gestación',
        'Secado',
        'Parto',
        'Aborto',
        'Destete'
    ],

    async listEventos(animalId = null, fincaId = null) {
        return await ErrorHandler.tryAsync(async () => {
            if (animalId) {
                const eventos = await window.db.getAllFromIndex('reproduccion_eventos', 'animalId', Number(animalId));
                return eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            }
            
            const fincaActivaId = await ErrorHandler.validateActiveFinca();
            const actualFincaId = fincaId || fincaActivaId;
            
            const eventos = await window.db.getAllFromIndex('reproduccion_eventos', 'fincaId', actualFincaId);
            return eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        }, { entity: 'Reproduccion', action: 'listEventos' });
    },

    async getEvento(id) {
        return await window.db.get('reproduccion_eventos', Number(id));
    },

    async saveEvento(data) {
        return await ErrorHandler.tryAsync(async () => {
            const fincaActivaId = await ErrorHandler.validateActiveFinca();
            
            ErrorHandler.validateRequired('animalId', data.animalId, 'El ID del animal es obligatorio');
            ErrorHandler.validateRequired('tipo_evento', data.tipo_evento, 'El tipo de evento es obligatorio');
            ErrorHandler.validateDate(data.fecha);

            const esEdicion = data.id !== undefined && data.id !== null && data.id !== '';

            // Obtener el animal para enriquecer datos y el snapshot
            const animal = await Animales.get(data.animalId);
            if (!animal) throw new Error("El animal referenciado no existe.");

            const snapMetadata = await window.SnapshotService.buildSnapMetadata(animal.rebanoId);

            const eventoData = {
                ...data,
                ...snapMetadata,
                fincaId: fincaActivaId,
                animalId: Number(data.animalId),
                actualizadoEn: new Date().toISOString()
            };

            // Lógica de validación específica de reproducción
            if (eventoData.tipo_evento === 'Diagnóstico Gestación') {
                ErrorHandler.validateRequired('resultado', data.resultado, 'El resultado del diagnóstico es obligatorio');
            }

            let eventoId;
            if (esEdicion) {
                eventoData.id = Number(data.id);
                await window.db.put('reproduccion_eventos', eventoData);
                eventoId = eventoData.id;
            } else {
                delete eventoData.id;
                eventoData.creadoEn = new Date().toISOString();
                eventoId = await window.db.add('reproduccion_eventos', eventoData);
            }

            // Integración opcional con eventos globales si es un parto o evento crítico
            if (eventoData.tipo_evento === 'Parto' && window.Trazabilidad) {
                // Actualizar número de partos del animal
                animal.numero_partos = (animal.numero_partos || 0) + 1;
                animal.estado_reproductivo = 'Vacía';
                await Animales.save(animal);
            }

            if (eventoData.tipo_evento === 'Diagnóstico Gestación' && eventoData.resultado === 'Positivo') {
                animal.estado_reproductivo = 'Gestante';
                await Animales.save(animal);
            }

            // Notificar al sistema via EventBus
            if (window.EventBus) {
                window.EventBus.emit('reproduccion:evento', {
                    evento: eventoData,
                    tipo: eventoData.tipo_evento,
                    animalId: eventoData.animalId,
                    eventoId
                });
            }

            return eventoId;
        }, { entity: 'Reproduccion', action: 'saveEvento' });
    },

    async deleteEvento(id) {
        return await window.db.delete('reproduccion_eventos', Number(id));
    },

    /**
     * Proyectar próximos eventos (ej: fecha estimada de parto)
     * Basado en la duración promedio de gestación por especie
     */
    async getEventosProximos(fincaId, diasAdelante = 30) {
        return await ErrorHandler.tryAsync(async () => {
            const eventos = await this.listEventos(null, fincaId);
            const animales = await Animales.list();
            const configEspecies = await window.db.getAll('config_especies');
            
            const hoy = new Date();
            const limite = new Date(hoy.getTime() + diasAdelante * 24 * 60 * 60 * 1000);
            const proximos = [];

            // Diccionario de gestación (días) aproximado
            const gestacionPromedio = {
                'Vacas': 283,
                'Ovejas': 152,
                'Cabras': 150,
                'Cerdos': 114
            };

            for (const ev of eventos) {
                if (ev.tipo_evento === 'Inseminación Artificial' || ev.tipo_evento === 'Monta Natural') {
                    // Verificar si ya hay un parto posterior o si fue diagnosticada vacía
                    const posteriores = eventos.filter(e => e.animalId === ev.animalId && new Date(e.fecha) > new Date(ev.fecha));
                    const diagnosticadaVacia = posteriores.some(e => e.tipo_evento === 'Diagnóstico Gestación' && e.resultado === 'Negativo');
                    const yaPario = posteriores.some(e => e.tipo_evento === 'Parto' || e.tipo_evento === 'Aborto');

                    if (!yaPario && !diagnosticadaVacia) {
                        const animal = animales.find(a => a.id === ev.animalId);
                        if (!animal) continue;
                        
                        const diasGestacion = gestacionPromedio[animal.especie] || 283;
                        const fechaInseminacion = new Date(ev.fecha);
                        const fechaPartoEstimada = new Date(fechaInseminacion.getTime() + diasGestacion * 24 * 60 * 60 * 1000);
                        const fechaSecadoEstimada = new Date(fechaPartoEstimada.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 días antes del parto

                        // Chequear secado
                        if (fechaSecadoEstimada >= hoy && fechaSecadoEstimada <= limite) {
                            proximos.push({
                                animalId: animal.id,
                                crotal: animal.numero_identificacion,
                                tipo_alerta: 'Secado Sugerido',
                                fecha_estimada: fechaSecadoEstimada.toISOString().split('T')[0],
                                urgencia: Math.ceil((fechaSecadoEstimada - hoy) / (24 * 60 * 60 * 1000)) < 7 ? 'urgente' : 'normal'
                            });
                        }

                        // Chequear parto
                        if (fechaPartoEstimada >= hoy && fechaPartoEstimada <= limite) {
                            proximos.push({
                                animalId: animal.id,
                                crotal: animal.numero_identificacion,
                                tipo_alerta: 'Parto Estimado',
                                fecha_estimada: fechaPartoEstimada.toISOString().split('T')[0],
                                urgencia: Math.ceil((fechaPartoEstimada - hoy) / (24 * 60 * 60 * 1000)) < 7 ? 'urgente' : 'normal'
                            });
                        }
                    }
                }
            }

            return proximos.sort((a, b) => new Date(a.fecha_estimada) - new Date(b.fecha_estimada));
        }, { action: 'getEventosProximos' });
    },

    /**
     * Calcula Indicadores Clave (KPIs) Reproductivos
     */
    async getKPIs(fincaId) {
        return await ErrorHandler.tryAsync(async () => {
            const eventos = await this.listEventos(null, fincaId);
            if (!eventos || eventos.length === 0) {
                return {
                    tasaFertilidadPct: 0,
                    indiceProlificidad: 0,
                    intervaloEntrePartosDias: 0,
                    totalPartosAnalizados: 0,
                    diagnosticosRealizados: 0,
                };
            }
    
            const eventosPorAnimal = eventos.reduce((acc, ev) => {
                if (!acc[ev.animalId]) acc[ev.animalId] = [];
                acc[ev.animalId].push(ev);
                return acc;
            }, {});
    
            let totalPartos = 0;
            let totalCriasVivas = 0;
            let totalDiagnosticos = 0;
            let diagnosticosPositivos = 0;
            
            let sumaIntervalosParto = 0;
            let countIntervalosParto = 0;
    
            for (const animalId in eventosPorAnimal) {
                const historial = eventosPorAnimal[animalId].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                
                let ultimoPartoDate = null;
    
                for (const ev of historial) {
                    if (ev.tipo_evento === 'Diagnóstico Gestación') {
                        totalDiagnosticos++;
                        if (ev.resultado === 'Positivo') diagnosticosPositivos++;
                    }
    
                    if (ev.tipo_evento === 'Parto') {
                        totalPartos++;
                        totalCriasVivas += (ev.crias_vivas || 0);
    
                        const fechaPartoActual = new Date(ev.fecha);
    
                        if (ultimoPartoDate) {
                            const diasDiff = (fechaPartoActual - ultimoPartoDate) / (1000 * 60 * 60 * 24);
                            if (diasDiff > 100) { // Sanity check to avoid counting abortions as part of IEP
                                sumaIntervalosParto += diasDiff;
                                countIntervalosParto++;
                            }
                        }
                        ultimoPartoDate = fechaPartoActual;
                    }
                }
            }
    
            return {
                tasaFertilidadPct: totalDiagnosticos > 0 ? parseFloat(((diagnosticosPositivos / totalDiagnosticos) * 100).toFixed(1)) : 0,
                indiceProlificidad: totalPartos > 0 ? parseFloat((totalCriasVivas / totalPartos).toFixed(2)) : 0,
                intervaloEntrePartosDias: countIntervalosParto > 0 ? Math.round(sumaIntervalosParto / countIntervalosParto) : 0,
                totalPartosAnalizados: totalPartos,
                diagnosticosRealizados: totalDiagnosticos
            };
        }, { action: 'getKPIs' });
    }
};

window.Reproduccion = Reproduccion;
