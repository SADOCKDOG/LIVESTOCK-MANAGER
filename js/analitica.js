/**
 * Analítica Ganadera - Motor de Cálculo Financiero v3.2.1 Premium
 * Procesamiento avanzado de márgenes por animal, rentabilidad por zona y balances.
 */

const Analitica = {
    /**
     * Calcula la rentabilidad total de una finca con desglose Premium
     */
    async obtenerRentabilidadFinca(fincaId) {
        const fId = Number(fincaId);
        let [vCarne, vLeche, gastos, rebanos, especies] = await Promise.all([
            Produccion.listVentas(fId).catch(() => []),
            Produccion.listLeche(fId).catch(() => []),
            window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', fId),
            window.db.getAllFromIndex('rebanos', 'fincaId', fId),
            window.db.getAll('config_especies')
        ]);

        // Fallback: si las listas cifradas vienen vacías, leer de stores sin cifrar
        if (!vCarne || vCarne.length === 0) {
            try {
                const cc = await window.db.getAllFromIndex('comercializacion_carne', 'fincaId', fId);
                if (cc && cc.length > 0) {
                    vCarne = cc.map(c => ({
                        precio_total: c.precio_total || 0,
                        pesoCanal: c.pesoCanal || 0,
                        gastosComercializacion: {
                            transporte: c.Gasto_Transporte || 0,
                            matadero: c.Gasto_Matanza || 0
                        }
                    }));
                }
            } catch (_) {}
        }
        if (!vLeche || vLeche.length === 0) {
            try {
                const cl = await window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fId);
                if (cl && cl.length > 0) {
                    vLeche = cl.map(l => ({
                        cantidad: l.cantidad || 0,
                        precioBase: l.precioBase || 0.45,
                        estadoAnalitica: l.estadoAnalitica || 'Pendiente'
                    }));
                }
            } catch (_) {}
        }
        
        let ingCarne = 0, ingLeche = 0;
        
        // Ingresos Carne
        for (let v of vCarne) {
            const bruto = v.precio_total || ((v.pesoCanal || 0) * 5.5);
            const deducciones = (v.gastosComercializacion?.transporte || 0) + (v.gastosComercializacion?.matadero || 0);
            ingCarne += (bruto - deducciones);
        }

        // Ingresos Leche
        for (let l of vLeche) {
            if (l.estadoAnalitica !== 'Alerta Crítica') {
                ingLeche += (l.cantidad * (l.precioBase || 0.45));
            }
        }

        const totalIngresos = ingCarne + ingLeche;
        const totalGastosDirectos = gastos.reduce((sum, g) => sum + (g.monto || 0), 0);

        // Agua y Suministros Estimados
        let costoAgua = 0;
        for (let r of rebanos) {
            const esp = especies.find(e => e.nombre === r.especie);
            const animales = (await window.db.getAllFromIndex('animales', 'rebanoId', r.id)).filter(a => a.estado === 'activo');
            if (esp && animales.length > 0) {
                costoAgua += (animales.length * (esp.consumoAguaL || 10) * 0.002 * 30);
            }
        }

        return {
            ingresos: totalIngresos,
            gastos: totalGastosDirectos + costoAgua,
            balance: totalIngresos - (totalGastosDirectos + costoAgua),
            detalles: {
                carne: ingCarne,
                leche: ingLeche,
                agua: costoAgua,
                otros_gastos: totalGastosDirectos
            }
        };
    },

    /**
     * Margen Neto por Animal (Dispersión)
     */
    async obtenerMargenPorAnimal(fincaId) {
        const animales = await window.db.getAll('animales');
        const ventas = await Produccion.listVentas(Number(fincaId)).catch(() => []);
        
        return ventas.map(v => {
            const animalId = v.animal_id_list && v.animal_id_list.length > 0 ? v.animal_id_list[0] : v.animalId;
            const animal = animales.find(a => a.id === animalId);
            const costeCompra = animal?.precioCompra || 0;
            const bruto = v.precio_total || (v.pesoCanal ? v.pesoCanal * 5.5 : 0);
            const ingresos = bruto - ((v.gastosComercializacion?.transporte || 0) + (v.gastosComercializacion?.matadero || 0));
            return {
                x: v.pesoVivo || 0, // Peso vivo como eje X
                y: ingresos - costeCompra, // Margen neto como eje Y
                label: animal?.numero_identificacion || 'Venta Lote'
            };
        });
    },

    /**
     * Rentabilidad Real por Zona (Histograma)
     */
    async obtenerRentabilidadZonas(fincaId) {
        const finca = await window.db.get('fincas', Number(fincaId));
        const zonas = finca?.zonas || [];
        const ventas = await Produccion.listVentas(Number(fincaId)).catch(() => []);
        const gastos = await window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', Number(fincaId));
        
        const data = [];
        for (let z of zonas) {
            const ing = ventas.filter(v => v.snap_zona === z.nombre).reduce((s, v) => s + (v.precio_total || (v.pesoCanal * 5.5) || 0), 0);
            const gst = gastos.filter(g => g.snap_zona === z.nombre).reduce((s, g) => s + (g.monto || 0), 0);
            data.push({ zona: z.nombre, ingresos: ing, gastos: gst, neto: ing - gst });
        }
        return data;
    },

    /**
     * Censo de Rebaños y Animales
     */
    async obtenerCensoRebanos(fincaId) {
        const rebanos = await window.db.getAllFromIndex('rebanos', 'fincaId', Number(fincaId));
        const data = [];
        for (let r of rebanos) {
            const animales = await window.db.getAllFromIndex('animales', 'rebanoId', r.id);
            data.push({
                nombre: r.nombre,
                tipo: r.tipo,
                total: animales.length,
                activos: animales.filter(a => a.estado === 'activo').length,
                vendidos: animales.filter(a => a.estado === 'vendido').length
            });
        }
        return data;
    },

    /**
     * Estadísticas de Tratamientos Sanitarios y Retenciones
     */
    async obtenerEstadisticasSanitarias(fincaId) {
        const rebanos = await window.db.getAllFromIndex('rebanos', 'fincaId', Number(fincaId));
        const rebanosIds = rebanos.map(r => r.id);
        const sanitarios = await window.db.getAll('sanitarios_ganado') || [];
        const sanitariosFinca = sanitarios.filter(s => rebanosIds.includes(s.rebanoId));

        const porCategoria = {};
        let retencionesActivas = 0;
        const hoy = new Date();

        sanitariosFinca.forEach(s => {
            const cat = s.tipo_tratamiento || 'Otro';
            porCategoria[cat] = (porCategoria[cat] || 0) + 1;

            const fechaTrat = new Date(s.fecha);
            const diasPasados = Math.floor((hoy - fechaTrat) / (1000 * 60 * 60 * 24));
            
            // Si aún no han pasado los días de espera (carne o leche), o está prohibido de por vida para leche
            if ((s.tiempo_espera_carne_dias && s.tiempo_espera_carne_dias > diasPasados) || 
                (s.tiempo_espera_leche_dias && s.tiempo_espera_leche_dias > diasPasados) || 
                s.prohibidoLeche) {
                retencionesActivas++;
            }
        });

        return {
            totalTratamientos: sanitariosFinca.length,
            retencionesActivas,
            porCategoria: Object.entries(porCategoria).map(([categoria, cantidad]) => ({ categoria, cantidad })).sort((a,b) => b.cantidad - a.cantidad)
        };
    },

    /**
     * Resumen de compradores: totales agregados
     */
    async obtenerResumenCompradores(fincaId) {
        try {
            const [ventasCarne, ventasLeche] = await Promise.all([
                window.db.getAllFromIndex('comercializacion_carne', 'fincaId', Number(fincaId)).catch(() => []),
                window.db.getAllFromIndex('comercializacion_leche', 'fincaId', Number(fincaId)).catch(() => []),
            ]);
            const compradoresUnicos = new Set();
            ventasCarne.forEach(v => { if (v.razonSocial) compradoresUnicos.add(v.razonSocial); });
            ventasLeche.forEach(v => { if (v.nombreComprador) compradoresUnicos.add(v.nombreComprador); });
            const totalImporte = ventasCarne.reduce((s, v) => s + (v.precio_total || 0), 0)
                + ventasLeche.reduce((s, v) => s + ((v.cantidad || 0) * (v.precioBase || 0.45)), 0);
            return { numCompradores: compradoresUnicos.size, totalVentasCarne: ventasCarne.length, totalVentasLeche: ventasLeche.length, totalImporte };
        } catch (e) { return { numCompradores: 0, totalVentasCarne: 0, totalVentasLeche: 0, totalImporte: 0 }; }
    },

    /**
     * Resumen de proveedores: totales agregados
     */
    async obtenerResumenProveedores(fincaId) {
        try {
            const gastos = await window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', Number(fincaId)).catch(() => []);
            const proveedoresUnicos = new Set();
            gastos.forEach(g => { if (g.proveedor) proveedoresUnicos.add(g.proveedor); });
            const totalGasto = gastos.reduce((s, g) => s + (g.monto || 0), 0);
            return { numProveedores: proveedoresUnicos.size, numFacturas: gastos.length, totalGasto };
        } catch (e) { return { numProveedores: 0, numFacturas: 0, totalGasto: 0 }; }
    },

    /**
     * Gastos fitosanitarios: totales y desglose
     */
    async obtenerGastosFitosanitarios(fincaId) {
        try {
            const gastos = await window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', Number(fincaId)).catch(() => []);
            const fitosanitarios = gastos.filter(g => (g.categoria || '').toLowerCase() === 'fitosanitarios');
            const total = fitosanitarios.reduce((s, g) => s + (g.monto || 0), 0);
            return { total, numRegistros: fitosanitarios.length, registros: fitosanitarios };
        } catch (e) { return { total: 0, numRegistros: 0, registros: [] }; }
    }
};

window.Analitica = Analitica;
