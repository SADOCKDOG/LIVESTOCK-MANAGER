# Plantilla Aprobada: Card de Registro (Patrón Aglutinadora)

Este documento define el estándar visual y estructural para todas las tarjetas de listado ("Cards de Registro") en Livestock Manager Premium.

## 1. Estructura HTML (Estandarizada)

```html
<div class="card-registro" onclick="App.route('/detalle?id=123')" 
     style="display:flex; gap:10px; align-items:stretch; --registro-color: var(--c-info); cursor:pointer;">
    
    <!-- BLOQUE IZQUIERDO: Identificación y Datos -->
    <div class="flex-1 min-w-0 flex flex-col justify-center">
        <!-- Encabezado de la Card -->
        <div class="flex items-center gap-10 min-w-0">
            <span class="text-xl" style="color:var(--c-info);">${Icons.animales()}</span>
            <div class="font-950 uppercase text-[0.9rem] tracking-tight" style="color:var(--p-gold); font-weight: 950;">
                TÍTULO PRINCIPAL (ID/CROTAL/NOMBRE)
            </div>
        </div>
        <!-- Metadatos Secundarios -->
        <div class="flex flex-wrap gap-x-12 gap-y-2 text-[0.62rem] text-gray font-800 uppercase mt-4">
            <span>DATO 1</span>
            <span>·</span>
            <span>DATO 2</span>
        </div>
    </div>

    <!-- BLOQUE DERECHO: Estado y Acción -->
    <div class="flex flex-col items-end justify-between flex-shrink-0">
        <!-- Parte Superior: Viñeta Iluminada (Status Badge) -->
        <div class="top-part">
            <div style="background:var(--c-info)15; color:var(--c-info); border: 1px solid var(--c-info)40; filter: drop-shadow(0 0 4px var(--c-info)); padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                ESTADO / VALOR
            </div>
        </div>
        <!-- Parte Inferior: Link de Acción -->
        <div class="bottom-part">
            <span style="color:var(--c-warning); font-weight:800; font-size:0.7rem; text-transform:uppercase;">
                FICHA ${Icons.flechaDerecha()}
            </span>
        </div>
    </div>
</div>
```

## 2. Reglas de Estilo Normativas

### 2.1 Contenedor Principal
- Debe usar `display: flex`.
- Debe usar `align-items: stretch` para que la columna derecha ocupe todo el alto disponible y permita el `justify-between`.
- La variable `--registro-color` se usa para el acento lateral y los efectos neón.

### 2.2 Tipografía y Colores
- **Identificador Primario:** Siempre en **Oro (`var(--p-gold)`)** con peso **950**.
- **Metadatos:** Gris suave (`#888` / `.text-gray`), tamaño reducido (`0.62rem` o `--fs-tiny`), siempre en **UPPERCASE**.
- **Acción:** El texto "FICHA" siempre usa `var(--c-warning)` (Ambar/Oro Oscuro) para invitar al click.

### 2.3 Viñeta Iluminada (Status Badge)
Es el elemento distintivo del Neon Branding:
- **Fondo:** 15% de opacidad del color semántico.
- **Borde:** 40% de opacidad del color semántico.
- **Efecto:** `drop-shadow(0 0 4px color)` para simular retroiluminación.
- **Forma:** Cápsula con `border-radius: 6px`.

## 3. Integración en el Patrón Aglutinadora

La Card de Registro siempre debe estar precedida por:
1. **Summary Card (`.card-resumen`):** Bloque de KPIs superior con botón de colapso.
2. **Integrated Filters:** Fila con `input[type="search"]` y selectores de filtrado dinámico.

## 4. Implementación en JS (Helper)

Se recomienda usar una función centralizada o helper en cada vista:

```javascript
_cardRegistro(opts) {
    const color = opts.color || 'var(--c-info)';
    return `
      <div class="card-registro" onclick="${opts.onClick}" style="display:flex; gap:10px; align-items:stretch; --registro-color: ${color}; cursor:pointer;">
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <div class="flex items-center gap-10 min-w-0">
            <span class="text-xl" style="color:${color};">${opts.icon}</span>
            <div class="font-950 uppercase text-[0.9rem] tracking-tight" style="color:var(--p-gold); font-weight: 950;">${opts.title}</div>
          </div>
          <div class="flex flex-wrap gap-x-12 gap-y-2 text-[0.62rem] text-gray font-800 uppercase mt-4">${opts.metadata}</div>
        </div>
        <div class="flex flex-col items-end justify-between flex-shrink-0">
          <div class="top-part">
            ${opts.badge ? `<div style="background:${color}15; color:${color}; border:1px solid ${color}40; filter: drop-shadow(0 0 4px ${color}); padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">${opts.badge}</div>` : ''}
          </div>
          <div class="bottom-part">
            <span style="color:var(--c-warning); font-weight:800; font-size:0.7rem; text-transform:uppercase;">FICHA ${Icons.flechaDerecha()}</span>
          </div>
        </div>
      </div>`;
}
```
