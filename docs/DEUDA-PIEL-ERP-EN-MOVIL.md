# Deuda técnica: piel de ERP heredada hacia Android

**Fecha de la auditoría:** 2026-09-02 / 2026-09-03
**Versión medida:** 4.10.8 (versionCode 529), dispositivo Xiaomi 22111317G, WebView a 392 px CSS.
**Origen:** auditoría de todo lo que tiene una relación de aspecto heredada de la piel de ERP
de escritorio y llega a Android sin contraparte móvil.

## Cómo llegó a existir esto

`index.html` carga tres hojas condicionadas al escritorio:

```html
<link rel="stylesheet" href="css/erp-tokens.css"    media="(min-width: 1024px)" />
<link rel="stylesheet" href="css/erp-sidebar.css"   media="(min-width: 1024px)" />
<link rel="stylesheet" href="css/erp-overrides.css" media="(min-width: 1024px)" />
```

Todo lo que se definió **solo** dentro de `erp-overrides.css` deja de existir por debajo de
1024 px. El HTML sí se sigue emitiendo: las vistas son las mismas en ambos anchos. Cuando la
clase existía únicamente ahí, en móvil el elemento se queda con el estilo del navegador.

Eso es lo que rompía el marco de "Acciones de Registro" y lo que se corrigió creando
`css/erp-acciones.css`, una hoja que carga siempre y que solo contiene reglas bajo
`@media (max-width: 1023px)` — ámbitos disjuntos, sin posibilidad de conflicto con la hoja de
escritorio sea cual sea el orden de carga.

## Ya corregido (no es deuda)

| Elemento | Vistas afectadas | Estado |
|---|---|---|
| `.erp-action-group` / `-body` / `--centro` | 26 | Corregido en `css/erp-acciones.css` (4.10.8) |
| `.erp-filtros` | 16 | Corregido: apilado en columna con separación regular |
| Buscador duplicado en modo tabla | 19 | Corregido en `js/erp-data-table.js` (ver más abajo) |

## Descartado: no es deuda

- **15 clases `sidebar-*`.** Solo las emite `js/erp-shell.js`, que no se activa por debajo de
  1024 px. Falso positivo del barrido.
- **`.erp-solo-movil`.** Definida en `erp-overrides.css` como `display: none !important`.
  Es correcto por diseño: marca la navegación exclusiva de móvil para esconderla en escritorio.

## Deuda aplazada

Estas clases se emiten en HTML que también se pinta en móvil, pero están definidas
**únicamente** en `css/erp-overrides.css` y no tienen versión base. En Android simplemente no
se aplican: el elemento se queda con su tamaño natural. **Ninguna produce un problema visible
ni impide operar la app maestra de Android**, por eso se dejan para más adelante.

Recuento medido con:

```bash
grep -rl "\berp-ver-mas-count\b" js/views/*.js js/*.js
```

| Clase | Ficheros JS que la emiten | Dónde está definida | Efecto real en Android |
|---|---|---|---|
| `h-auto` | 10 | `erp-overrides.css:576` (`.widget-link-btn--neon.h-auto`) | Ninguno: el botón conserva su alto normal de móvil |
| `py-6` | 6 | `erp-overrides.css:577` | Ninguno: conserva el relleno vertical base |
| `px-10` | 3 | `erp-overrides.css:575` | Ninguno: conserva el relleno horizontal base |
| `py-14` | 2 | `erp-overrides.css:579` | Ninguno |
| `grid-cols-12` | 1 | `erp-overrides.css:296` (`.grid.grid-cols-12`) | Ninguno: la rejilla cae al comportamiento de `.grid` base, que en móvil es una columna — que es lo que se quiere |
| `col-span-4` | 1 | `erp-overrides.css:300` | Ninguno, por lo mismo |
| `col-span-12` | 1 | `erp-overrides.css:301` | Ninguno, por lo mismo |
| `.erp-ver-mas-count` | 1 | `erp-overrides.css:467` | El contador se ve sin su formato de ERP, legible |
| `.bottom-sheet-overlay` / `.bottom-sheet-content` | 1 | `erp-overrides.css:320` y `:325`, ambas acotadas a `#submenu-registros-overlay` | Ninguno: en escritorio convierten el submenú de registros en panel; en móvil el submenú ya usa su propio estilo |

Las cuatro primeras (`h-auto`, `py-6`, `px-10`, `py-14`) son utilidades de aspecto Tailwind
que en este proyecto **no tienen definición base**: existen solo como afinado del chip
`.widget-link-btn--neon` dentro de la piel de ERP. Si algún día se quiere que hagan algo en
móvil, lo coherente es darles una definición base en `css/styles.css` y no duplicarlas en
`erp-acciones.css`.

### Cuándo hay que retomarlo

- Si se añade una vista nueva que apoye su maquetación en `grid-cols-12` esperando columnas
  reales, habrá que llevar la rejilla a la hoja base.
- Si se decide que el chip de acción tenga alturas variables (`h-auto`) también en móvil.
- Antes de eso, no hay motivo: se midió cada caso y ninguno degrada la pantalla.

## Corrección del buscador duplicado (hecha, documentada aquí por trazabilidad)

**Por qué existía.** Las vistas nacieron primero en móvil, con tarjetas y su propio buscador
(`input.search-input` + un `_filtrar()` que consulta 2 o 3 campos). La tabla ERP llegó después
como componente autónomo, con **su propio** buscador, ordenación, paginación y exportación.
Nadie retiró el buscador de la vista al añadir la tabla, porque en modo tarjetas sigue
haciendo falta. En modo tabla convivían los dos, con estados independientes.

**No era solo cosmético.** `_renderErpTable()` hace `new window.ErpDataTable({...}).render()`
en cada refresco, y el constructor partía de cero. Teclear en el buscador de la vista
destruía en silencio el orden y la búsqueda de la tabla.

Medido en Android **y** en la PWA a 1400 px, con los mismos números antes del arreglo:

```
antes   {sort:'ciudad', term:'mad', input:'mad', filas:1}
después {sort:null,     term:'',    input:'',    filas:3}
```

**Qué se hizo**, todo en `js/erp-data-table.js`, sin tocar ninguna de las vistas:

1. `_heredarEstado()` en el constructor: recoge `searchTerm`, `sortKey`, `sortAsc` y
   `currentPage` de la instancia anterior registrada en `window['dt_<containerId>']`, siempre
   que las columnas sigan siendo las mismas. Esto arregla la pérdida de estado en *cualquier*
   refresco, no solo al teclear.
2. `_ocultarBuscadorDeVista()` al final de `render()`: esconde el buscador propio de la vista
   mientras la tabla está en pantalla. Se elige el de la tabla porque busca en todas las
   columnas y mantiene coherentes orden, paginación y exportación a CSV; el de la vista solo
   mira 2 o 3 campos. Se oculta únicamente el buscador emparejado con esa tabla (el más
   cercano subiendo por los ancestros), no todos los de la página: hay vistas con varias
   secciones y solo una lleva tabla.

Verificación tras el arreglo:

- Android, `#/proveedores` en modo tabla: `después` idéntico a `antes`; 1 buscador visible.
- Android en modo tarjetas (el de fábrica en móvil): buscador propio visible, 3 tarjetas.
- PWA a 1400 px, barrido de las 19 vistas con tabla (animales, documentos, proveedores, zonas,
  instalaciones, silos, rebaños, transportistas, compradores, contratos, subexplotaciones,
  saneamientos, botiquín, sanidad, albaranes de venta, explotación, comercialización,
  fitosanitarios y gastos): en todas, 1 tabla y **0** buscadores propios visibles.
- `#/agenda`, que no lleva tabla ERP, conserva su buscador.
