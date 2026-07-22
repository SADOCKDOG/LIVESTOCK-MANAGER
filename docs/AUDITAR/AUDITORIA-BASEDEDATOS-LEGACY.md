# Auditoría: `docs/AUDITAR/BASEDEDATOS/` — base de datos legacy (Visual FoxPro/dBase)

**Naturaleza**: NO es documentación normativa española (no es SIGGAN/BOE/BOJA/FEGA). Es el volcado completo de la base de datos de un **software comercial legacy de gestión ganadera latinoamericano** (formato Visual FoxPro / dBase III+, ficheros `.DAT`=DBF, `.FPT`=memos, `.MEM`=variables de memoria), con fechas de 1996 a 2023. El vocabulario ("potrero", "semoviente", "cuadra") y las razas del catálogo (Brahman, Carora, Gyr, Indubrasil, Nelore, Guzerat — razas tropicales, Carora es una raza lechera desarrollada en Venezuela) confirman origen venezolano/latinoamericano, no español.

**Alcance de esta auditoría**: solo el módulo ganadero (censo, reproducción, sanidad, pesajes, potreros). Se excluyen explícitamente nómina (`EMPLEADO.DAT`, `PAGOSNOM.DAT`) y contabilidad (`CUENTAS.DAT`, `MOVCTA.DAT`, `GRPCTA.DAT`, `PROVEED.DAT`), y los ficheros de sistema (`FOXUSER.DBF`, `SETUP.DAT`, `RPRO.DAT`, `System.app`, `*.MEM`).

**Por qué no es un gap de `PLAN-MEJORA-SIGGAN.md`**: al no ser normativa oficial española, no aplica ninguna cita legal ni encaja en el modelo de cumplimiento SIGGAN/BADIGEX que rige el resto de `docs/AUDITAR/`. Se documenta aquí solo como referencia de comparación de funcionalidades con un software de gestión ganadera de otro mercado.

## Tabla central: `SEMVTE.DAT` (Semoviente = ficha de animal)

60 campos. Equivalente a la ficha de animal de Livestock Manager (`js/animales.js`), pero con más detalle genealógico de cría comercial:

- **Identificación**: código, sexo, tipo de alta (nacido/adquirido), fecha nacimiento/ingreso
- **Ubicación**: potrero, cuadra (grupo), lote
- **Genealogía**: madre (`COPSEM`), padre (`COPJSEM`), nº de parto de la madre en que nació este animal, código de embrión (transferencia embrionaria), "pajuela" (monta con semen congelado)
- **Marcas físicas**: 4 campos de "señas" libres, flags tatuado/herrado/aretado/descornado
- **Peso al nacer, nº de partos** (si es hembra), **condición corporal** (referencia a `CONDCORP`)
- **Salud**: estado sano/enfermo, comentario, fecha y comentario de muerte
- **Venta**: fecha, comentario, precio compra/venta, motivo, destino
- **Registro genealógico**: identificación electrónica, nº de registro/asociación de criadores (razas puras registradas), clasificación y tipo de registro
- 3 campos de historial de reubicación embebidos

## Catálogos de apoyo

| Tabla | Contenido | Datos reales encontrados |
|---|---|---|
| `RAZAS.DAT` | 20 razas | Brahman, Holstein, Criollo, Carora, Gyr, Indubrasil, Jersey, Angus Negro, Nelore, Guzerat, Hereford, Charolais, Pardo Suizo, Indobrasil, Beefmaster, Simmental, Angus, Brangus, Limousin, Mestizo Desc. |
| `CALIDANI.DAT` | Calidad del animal | Elite / Comercial / Superior |
| `CONDCORP.DAT` | **Escala de Condición Corporal (BCS) 1-9** | 9 niveles con descripción veterinaria detallada (ECC1 "Flaco" → ECC9 "Muy Gordo"), escala estándar internacional de nutrición bovina |
| `PROBPAL.DAT` | Catálogo de enfermedades/diagnósticos | 12 entradas clasificadas Reproductivo/No Reproductivo: Brucelosis, Mastitis, Fiebre Aftosa, Anaplasmosis, Diarrea Viral Bovina, Leptospirosis, Neosporosis, Hipoplasia Ovárica, Metritis, Neumonía Bovina, Ovario Quístico, Rinotraqueitis (IBR) — cada una con descripción clínica breve |
| `MOTMTE.DAT` | Motivo de muerte/pérdida | Enfermedad, Accidente, Muerte Desconocida, Desnutrición, Perdido-Extraviado |
| `MOTVTA.DAT` | Motivo de venta | Problemas Reproductivos, Bajo Peso, Defecto Genital, Peso Adecuado para la venta |
| `POTRERO.DAT` | Potreros (parcelas) | código, sector, nombre, hectáreas, tipo de pasto, carga máxima |
| `SECTOR.DAT` | Sectores/zonas de la finca | agrupa potreros |
| `CUADRA.DAT` / `LOTE.DAT` | Agrupaciones de manejo | grupos/lotes de animales |
| `PROCEDE.DAT` / `VTADESTI.DAT` | Procedencia / destino de venta | catálogos vacíos, sin sembrar en esta instancia |
| `REGVAC.DAT` / `INGVAC.DAT` | Catálogo de vacunas + entradas de stock | código, descripción, sexo destinatario, dosis, inventario, precio |

## Registros de eventos (histórico por animal)

- `SERVICIO.DAT` — monta/servicio (fecha, tipo natural/IA, efectivo, semental, inseminador, nº de pajuela)
- `PALPCNES.DAT` — palpación/diagnóstico de gestación (fecha, resultado, próxima palpación, peso estimado, fecha probable de parto, meses de preñez)
- `PARTOS.DAT` — partos (fecha, nº machos/hembras/muertos, peso, tipo de parto)
- `PESO.DAT` — pesajes (fecha, peso, tipo de pesaje)
- `PRDCCION.DAT` — producción de leche (fecha, litros AM/PM, por cuadra/lote/potrero) — control lechero diario
- `REVVET.DAT` — revisión veterinaria (fecha, diagnóstico, comentario)
- `HISTCOMEN.DAT` / `HISTCORP.DAT` / `HISTREUB.DAT` — histórico de comentarios / condición corporal / reubicaciones

## Comparación con Livestock Manager

Cubierto de forma equivalente: razas (`js/db.js` `RAZAS_SEED`), movimientos internos (`js/movimientos.js`, `js/rebanos.js`), pesajes (`js/pesajes.js`), reproducción — monta/palpación/parto (`js/reproduccion.js`), saneamiento (`js/saneamientos.js`).

**No modelado hoy en Livestock Manager**:
- Escala de Condición Corporal (BCS 1-9) — no existe en ningún módulo.
- Catálogo estructurado de enfermedades/diagnósticos con clasificación reproductivo/no-reproductivo — hoy `MOTIVOS_TRATAMIENTO` (`comunidades-service.js`) es una lista genérica de 10 categorías (profilaxis, vacunación, desparasitación...), no un catálogo de enfermedades específicas.

Ninguno de los dos es una exigencia normativa SIGGAN — son buenas prácticas de manejo ganadero, de valor opcional. Ver evaluación de accionabilidad en el hilo de conversación de esta auditoría (2026-07-22).
