# Estándar de Posicionamiento de Card de Registro
> v1.0 · Creado el 2026-10-27

## 1. Ubicación
- **Ubicación**: Esquina superior derecha dentro del contenedor card-registro
- **Contenedor Padre**: `<div class="flex flex-col items-end justify-between flex-shrink-0">`
- **Contenedor Inmediato**: `<div class="top-part">` (primer hijo del contenedor padre)
- **Alineación**: Alineado a la derecha y al inicio vertical (items-start)

## 2. Componente Inmediato
- **Contenedor Inmediato**: `<div class="top-part">`
- **Propiedades**: `flex-shrink-0` para que no se contraiga

## 3. Propiedades Visuales
- **Contraste**: La relación de contraste entre texto y fondo debe cumplir con WCAG AA (4.5:1 para texto normal)
- **Tamaño objetivo táctil**: Mínimo 44x44dp cuando se usa en pantallas táctiles
- **Lectura por pantalla**: El texto debe ser legible por lectores de pantalla (no usar solo colores para transmitir información)

## 7. Ejemplos de Implementación
### 6.1 Animal Aktivo
```html
<div style="background:var(--c-success)15; 
            color:var(--c-success); 
            border:1px solid var(--c-success)40; 
            filter: drop-shadow(0 0 4px var(--c-success)); 
            padding: 2px 8px; 
            border-radius: 6px; 
```