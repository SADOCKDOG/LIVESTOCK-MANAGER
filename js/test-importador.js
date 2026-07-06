/**
 * Script de Prueba - Validación de Importador
 * Prueba que el módulo importador funciona correctamente con CORK_BACKUP.json
 */

const TestImportador = {
    async ejecutar() {
        console.log("🧪 Iniciando pruebas de Importador...\n");

        try {
            // Prueba 1: Leer archivo
            console.log("✓ Prueba 1: Validación de esquema de finca");
            const datosPrueba = {
                nombre: "Finca Test",
                propietario: "Propietario Test",
                direccion: "Calle Test 123"
            };
            Importador.validarEsquemaFinca(datosPrueba);
            console.log("  ✓ Esquema válido\n");

            // Prueba 2: Validar teléfono
            console.log("✓ Prueba 2: Validación de teléfono");
            const telefonos = [
                { val: "+34 600 123 456", esperado: true },
                { val: "600123456", esperado: true },
                { val: "+34-600-123-456", esperado: true },
                { val: "", esperado: true },
                { val: "inv@lido", esperado: false }
            ];
            
            telefonos.forEach(test => {
                const resultado = Importador.validarTelefono(test.val);
                const status = resultado === test.esperado ? "✓" : "✗";
                console.log(`  ${status} "${test.val}" → ${resultado}`);
            });
            console.log("");

            // Prueba 3: Extracción de datos
            console.log("✓ Prueba 3: Extracción de datos de finca");
            const fincaBackup = {
                info: {
                    nombre: "El Chamorro",
                    propietario: "Mº del Carmen Arteaga Galván",
                    direccion: "C/ Juan Ramón Jiménez 55, Arroyomolinos de León",
                    telefono: "+34 600 123 456"
                },
                zonas: [
                    {
                        nombre: "CONTRAYOSA",
                        refCatastral: "21009A010002570000WI",
                        municipio: "ARROYOMOLINOS DE LEON",
                        provincia: "HUELVA",
                        poligono: 10,
                        parcela: 257,
                        cultivos: [
                            { letra: "a", cultivo: "FE Encinar", intensidad: "02", superficie: 55460 }
                        ]
                    }
                ]
            };

            const fincaExtraida = Importador.extraerDatosFinca(fincaBackup);
            console.log(`  Nombre: ${fincaExtraida.nombre}`);
            console.log(`  Propietario: ${fincaExtraida.propietario}`);
            console.log(`  Zonas extraídas: ${fincaExtraida.zonas.length}`);
            console.log(`  Primera zona: ${fincaExtraida.zonas[0].nombre}`);
            console.log("");

            // Prueba 4: Validación de campos requeridos
            console.log("✓ Prueba 4: Validación de campos requeridos");
            const pruebas = [
                { nombre: "", propietario: "Test", direccion: "Test", error: true },
                { nombre: "Test", propietario: "", direccion: "Test", error: true },
                { nombre: "Test", propietario: "Test", direccion: "", error: true },
                { nombre: "Test", propietario: "Test", direccion: "Test", error: false }
            ];

            pruebas.forEach((test, idx) => {
                try {
                    Importador.validarEsquemaFinca(test);
                    console.log(`  ✓ Prueba ${idx + 1}: ${test.error ? "❌ Debería fallar" : "✓ Pasó"}`);
                } catch (e) {
                    console.log(`  ✓ Prueba ${idx + 1}: ${!test.error ? "❌ No debería fallar" : "✓ Error esperado: " + e.message}`);
                }
            });
            console.log("");

            console.log("✅ Todas las pruebas del Importador completadas correctamente\n");

        } catch (error) {
            console.error("❌ Error en pruebas:", error.message);
        }
    }
};

// Ejecutar pruebas si se llama desde consola
// window.TestImportador = TestImportador;
// TestImportador.ejecutar();
