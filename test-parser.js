// Test script for pdf-catastro.js pure functions

function parsearSuperficie(str) {
  if (!str) return null;
  const limpio = String(str).replace(/\./g, '').replace(',', '.');
  const n = parseFloat(limpio);
  return Number.isFinite(n) ? n : null;
}

function m2AHectareas(m2) {
  if (!Number.isFinite(m2)) return null;
  return Math.round((m2 / 10000) * 10000) / 10000;
}

function parsearCatastro(lineas) {
  const d = {
    refCatastral: null,
    poligono: null, parcela: null,
    paraje: null, municipio: null, provincia: null,
    localizacion: null,
    clase: null, usoPrincipal: null,
    superficieGrafica: null, superficieConstruida: null,
    anoConstruccion: null,
    cultivos: [], construcciones: []
  };

  const texto = lineas.join('\n');

  // Referencia catastral: rústica (5 díg + letra + 12 díg + 2 letras) o urbana.
  const ref = texto.match(/[0-9]{5}[A-Z][0-9]{12}[A-Z]{2}/i) ||
              texto.match(/[0-9]{7}[A-Z]{2}[0-9]{4}[A-Z][0-9]{4}[A-Z]{2}/i);
  if (ref) d.refCatastral = ref[0].toUpperCase();

  const pol = texto.match(/Pol[íi]gono\s+(\d+)\s+Parcela\s+(\d+)/i);
  if (pol) {
    d.poligono = parseInt(pol[1], 10);
    d.parcela = parseInt(pol[2], 10);
  }

  // Localización, paraje, municipio y provincia
  for (let i = 0; i < lineas.length; i++) {
    if (!/Pol[íi]gono\s+\d+\s+Parcela\s+\d+/i.test(lineas[i])) continue;

    d.localizacion = (i > 0 && /Localizaci[óo]n/i.test(lineas[i - 1]))
      ? lineas[i - 1].replace(/Localizaci[óo]n:?\s*/i, '').trim() + ' ' + lineas[i]
      : lineas[i];

    for (let j = i + 1; j < Math.min(i + 8, lineas.length); j++) {
      const m = lineas[j].match(
        /^([A-ZÁÉÍÓÚÑa-zñáéíóú\s\-,]+?)\.\s*([A-ZÁÉÍÓÚÑa-zñáéíóú\s\-,]+?)\s*\(([A-ZÁÉÍÓÚÑa-zñáéíóú\s]+)\)/
      );
      if (m) {
        d.paraje = m[1].trim();
        d.municipio = m[2].trim();
        d.provincia = m[3].trim();
        d.localizacion += ' ' + lineas[j];
        break;
      }
    }
    if (d.paraje) break;
  }

  const clase = texto.match(/Clase\s+(R[úu]stico|Urbano|BICE|Agrario|Industrial)/i);
  if (clase) d.clase = clase[1];

  const uso = texto.match(/Uso\s+principal\s+([A-ZÁÉÍÓÚÑa-zñáéíóú ]{3,20})/i);
  if (uso) d.usoPrincipal = uso[1].trim();

  const sup = texto.match(/Superficie\s+gr[áa]fica\s+([\d.,]+)/i);
  if (sup) d.superficieGrafica = parsearSuperficie(sup[1]);

  const supC = texto.match(/Superficie\s+construida\s+([\d.,]+)/i);
  if (supC) d.superficieConstruida = parsearSuperficie(supC[1]);

  const ano = texto.match(/A[ñn]o\s+construcci[óo]n\s+(\d{4})/i);
  if (ano) d.anoConstruccion = parseInt(ano[1], 10);

  // CULTIVOS SIGPAC: "a FE Encinar 02 55.460"
  const iCultivo = lineas.findIndex(l => /^CULTIVO/i.test(l.trim()));
  if (iCultivo >= 0) {
    for (let i = iCultivo + 1; i < lineas.length; i++) {
      const l = lineas[i].trim();
      if (/^(CONSTRUCCI|PARCELA)/i.test(l)) break;
      if (!l || /^Subparcela/i.test(l)) continue;
      const m = l.match(/^([a-z0-9])\s+(.+?)\s+(\d{2})\s+([\d.,]+)\s*$/i);
      if (m) {
        d.cultivos.push({
          letra: m[1].toLowerCase(),
          cultivo: m[2].trim(),
          intensidad: m[3],
          superficie: parsearSuperficie(m[4])
        });
      }
    }
  }

  return d;
}

// Test with corrected sample lines (12 digits in ref catastral)
const testLines = [
  "CONSULTA DESCRIPTIVA Y GRÁFICA DE DATOS CATASTRALES",
  "Referencia Catastral: 12345A678901234567BC",  // 5 digits + 1 letter + 12 digits + 2 letters
  "Polígono 1 Parcela 2",
  "Paraje El Roble. Municipio de Cáceres (Cáceres)",
  "Localización: Paraje El Roble. Polígono 1 Parcela 2",
  "Clase Rústico",
  "Uso principal Pastos",
  "Superficie gráfica 10.000,00",
  "Superficie construida 0,00",
  "CULTIVO",
  "a Pastos 01 10.000,00",
  "b Cultivo herbáceo 02 5.000,00",
  "CONSTRUCCIÓN"
];

console.log('Testing parsearSuperficie...');
console.log('10.000,00 =>', parsearSuperficie('10.000,00'));
console.log('0,00 =>', parsearSuperficie('0,00'));
console.log('5.000,00 =>', parsearSuperficie('5.000,00'));

console.log('\nTesting m2AHectareas...');
console.log('10000 =>', m2AHectareas(10000));
console.log('5000 =>', m2AHectareas(5000));

console.log('\nTesting parsearCatastro...');
const result = parsearCatastro(testLines);
console.log(JSON.stringify(result, null, 2));

console.log('\n--- Verifying expected output matches ImportarZonasView expectations ---');
console.log('refCatastral:', result.refCatastral);
console.log('poligono:', result.poligono);
console.log('parcela:', result.parcela);
console.log('superficieGrafica (m2):', result.superficieGrafica);
console.log('superficie (ha):', m2AHectareas(result.superficieGrafica));
console.log('usoPrincipal:', result.usoPrincipal);
console.log('cultivos:', result.cultivos.length);
console.log('paraje:', result.paraje);
console.log('municipio:', result.municipio);
console.log('provincia:', result.provincia);
console.log('clase:', result.clase);