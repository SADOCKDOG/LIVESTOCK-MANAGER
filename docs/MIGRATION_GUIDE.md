# Guía de Migración a los Estándares de Diseño

Este documento proporciona instrucciones paso a paso para migrar componentes existentes en Livestock Manager a los nuevos estándares de diseño definidos en DESIGN.md y los documentos de referencia relacionados.

## 1. Visión General

Esta guía ayuda a los desarrolladores a actualizar componentes existentes para que se adhieran a los estándares de diseño consistentes, asegurando una experiencia de usuario uniforme y reduciendo el esfuerzo de mantenimiento a largo plazo.

## 2. Evaluación Inicial

Antes de comenzar cualquier migración, siga estos pasos:

### 2.1 Inventario de Componentes
Identifique todos los componentes que necesitan actualización:
- Tarjetas de listado (cards)
- Badges/etiquetas de estado
- Botones de acción
- Campos de entrada y filtrado
- Modales y notificaciones
- Indicadores de carga y estado vacío

### 2.2 Herramientas de Detección
Utilice estas consultas para encontrar componentes que puedan necesitar actualización:
```bash
# Buscar uso de alert()/confirm()
grep -r "alert\|confirm" js/views/ --include="*.js"

# Buscar estilos inline de badges
grep -r "background.*rgba.*0\.1" js/views/ --include="*.js"

# Buscar botones no estándar
grep -r "class.*btn" js/views/ --include="*.js" | grep -v "btn-primary\|btn-create"

# Buscar inputs no estándar
grep -r "input type.*text" js/views/ --include="*.js" | grep -v "type=\"search\""
```

## 3. Migración de Tarjetas de Registro (Card-Registro)

### 3.1 Antes (Ejemplo Común Antiguo)
```javascript
// Ejemplo de código obsoleto
return `
    <div class="card" style="border-left: 4px solid #ff0000; padding: 16px;">
        <div style="display: flex; align-items: center;">
            <span style="font-size: 24px; color: #ff0000;">🐄</span>
            <div style="margin-left: 12px;">
                <h3 style="margin: 0; color: #333;">Animal #123</h3>
                <p style="margin: 4px 0 0; color: #666; font-size: 14px;">Vaca • 250 kg</p>
            </div>
        </div>
        <div style="margin-top: 12px; text-align: right;">
            <button style="background: #ff0000; color: white; border: none; padding: 6px 12px; border-radius: 4px;">
                Ver Detalle
            </button>
        </div>
    </div>
`;
```

### 3.2 Después (Estándar Aglutinadora)
```javascript
// Usando el helper estándar de app.js
return App._cardRegistro({
    color: 'var(--c-danger)', // rojo para estado crítico
    icon: Icons.animales(),
    title: `#${a.id} <span style="color:#888; margin-left: 8px;">${Icons.hembra()}</span>`,
    metadata: `
        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
            <div style="color: #888; font-weight: 700; text-transform: uppercase;">
                <span class="var(--c-danger)" style="font-weight: 900;">${(a.especie || 'N/D').toUpperCase()}</span> · ${(a.raza || 'Sin Raza')}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.65rem; align-items: center;">
                <span style="display: flex; align-items: center; gap: 4px;">${Icons.calendar()} ${a.fecha_nacimiento ? new Date(a.fecha_nacimiento).toLocaleDateString() : '-'} ${edad !== null ? '('+edad+' años)' : ''}</span>
                <span style="display: flex; align-items: center; gap: 4px;">${Icons.peso()} ${a.peso_actual || a.peso_inicial || a.peso_nacimiento || '-'} kg</span>
                <span style="display: flex; align-items: center; gap: 4px;">${Icons.rebanos()} ${rebanoNombre}</span>
                <span style="display: flex; align-items: center; gap: 4px; color: var(--c-purple);">${Icons.paquete()} ${a.lote || '-'}</span>
            </div>
        </div>
    `,
    badge: `<div style="background:var(--c-danger)15; 
                   color:var(--c-danger); 
                   border:1px solid var(--c-danger)40; 
                   filter: drop-shadow(0 0 4px var(--c-danger)); 
                   padding: 2px 8px; 
                   border-radius: 6px; 
                   font-size: 0.6rem; 
                   font-weight: 900; 
                   text-transform: uppercase; 
                   letter-spacing: 0.5px; 
                   white-space: nowrap;">
               ${a.estado || 'activo'}
           </div>`,
    onClick: `location.hash='/animal?id=${a.id}'`
});
```

### 3.3 Pasos de Migración
1. Reemplazar contenedores genéricos `<div class="card">` por el patrón estándar de card-registro
2. Usar `App._cardRegistro()` helper cuando esté disponible
3. Implementar estructura de dos columnas (izquierda: información, derecha: estado/acción)
4. Aplicar couleurs semánticas adecuadas para badges según estado
5. Asegurar que toda la tarjeta sea clickeable con navegación a detalle
6. Usar iconos de la biblioteca `Icons.*` en lugar de emojis cuando sea funcional
7. Aplicar espaciado estándar mediante las variables CSS

## 4. Migración de Badges/Etiquetas de Estado

### 4.1 Antes (Ejemplos Comunes Antiguos)
```javascript
// Ejemplo 1: Colores hardcodeados
return `<span style="background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px;">ACTIVO</span>`;

// Ejemplo 2: Estilos inconsistentes
return `<div style="background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; border-radius: 50px; padding: 2px 6px;">PENDIENTE</div>`;

// Ejemplo 3: Solo texto
return `<span>${a.estado}</span>`;
```

### 4.2 Después (Estándar de Viñeta Iluminada)
```javascript
// Función helper reutilizable
function crearBadge(estado) {
    const colores = {
        'activo': 'var(--c-success)',
        'en_tratamiento': 'var(--c-warning)',
        'pendiente': 'var(--c-warning)',
        'critico': 'var(--c-danger)',
        'retirada': 'var(--c-danger)',
        'vendido': 'var(--c-info)',
        'historial': 'var(--c-info)'
    };
    
    const color = colores[estado] || 'var(--c-info)';
    const texto = estado ? estado.toUpperCase() : 'ACTIVO';
    
    return `<div style="background:${color}15; 
                       color:${color}; 
                       border:1px solid ${color}40; 
                       filter: drop-shadow(0 0 4px ${color}); 
                       padding: 2px 8px; 
                       border-radius: 6px; 
                       font-size: 0.6rem; 
                       font-weight: 900; 
                       text-transform: uppercase; 
                       letter-spacing: 0.5px; 
                       white-space: nowrap;">
               ${texto}
           </div>`;
}

// Uso en _getAnimalCardProps
badge: crearBadge(a.estado);
```

### 4.3 Pasos de Migración
1. Reemplazar colores hardcodeados por variables CSS semánticas
2. Implementar el efecto de viñeta iluminada (fondo 15%, borde 40%, drop-shadow)
3. Establecer radio de borde a 6px (forma de cápsula)
4. Aplicar formato de texto: mayúsculas, peso 900, tamaño 0.6rem, letter-spacing 0.5px
5. Mantener consistencia con el posicionamiento: esquina superior derecha en card-registro
6. Usar la función helper para evitar duplicación de código

## 5. Migración de Botones de Acción

### 5.1 Antes (Ejemplos Comunes Antiguos)
```javascript
// Botón inline con estilos hardcodeados
return `<button style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold;">
            Crear Animal
        </button>`;

// Botón de enlace no estándar
return `<a href="#" style="color: #f59e0b; text-decoration: none; font-weight: 600;">
            Ver Más →
        </a>`;
```

### 5.2 Después (Estándar de Botones de Acción Hub)
```javascript
// Usando funcion helper
return crearBotonAccionHub(
    Icons.agregar(),
    'Nuevo Animal',
    'success',
    `location.hash='/animal'`
);

// O manualmente cuando no hay helper disponible
return `
    <div class="widget-link-btn--neon neon-success"
         onclick="location.hash='/animal'">
        ${Icons.agregar()}
        <span class="widget-label">NUEVO ANIMAL</span>
    </div>
`;
```

### 5.3 Pasos de Migración
1. Reemplazar botones inline con estilos hardcodeados por el patrón de botón hub
2. Usar la estructura: contenedor flex column con icono arriba y texto abajo
3. Aplicar clases adecuadas: `widget-link-btn--neon neon-[variant]`
4. Usar iconos de la biblioteca `Icons.*`
5. Convertir texto a mayúsculas
6. Aplicar espaciado estándar (8px entre icono y texto, 12px padding interno)
7. Implementar estados hover y active mediante CSS (no JavaScript inline)
8. Usar el área táctil mínima de 48x48px

## 6. Migración de Campos de Búsqueda y Filtrado

### 6.1 Antes (Ejemplos Comunes Antiguos)
```javascript
// Input de búsqueda estándar no usado
return `<input type="text" id="search" placeholder="Buscar...">`;

// Selector no estándar
return `<select id="filter">
            <option value="">Todos</option>
            <option value="Vacas">Vacas</option>
            <option value="Ovejas">Ovejas</option>
        </select>`;

// Evento no optimizado
searchInput.addEventListener('keyup', filterFunction); // Debería ser input
```

### 6.2 Después (Estándar de Filtrado en Tiempo Real)
```javascript
// Input de búsqueda estándar
return `<input type="search" 
                id="search-animales" 
                class="search-input w-full"
                placeholder="Buscar por crotal, raza o rebaño..."
                oninput="AnimalesView._filtrar(this.value)">`;

// Selector estándar
return `<select id="animales-filtro-especie"
                class="form-select-gold"
                onchange="AnimalesView._setFiltro('especie', this.value)"
                style="width:120px; min-width:110px; flex-shrink:0;">
            <option value="">Todos</option>
            <option value="Vacas" ${this._filtroActivo.especie === 'Vacas' ? 'selected' : ''}>Vacas</option>
            <option value="Ovejas" ${this._filtroActivo.especie === 'Ovejas' ? 'selected' : ''}>Ovejas</option>
            <option value="Cabras" ${this._filtroActivo.especie === 'Cabras' ? 'selected' : ''}>Cabras</option>
            <option value="Cerdos" ${this._filtroActivo.especie === 'Cerdos' ? 'selected' : ''}>Cerdos</option>
        </select>`;

// Implementación del método de filtrado (ya existente en animales-view.js)
// Pero asegurando que siga el patrón estándar:
_aplicarFiltros(animales, rebanoMap) {
    let r = animales;
    if (this._filtroActivo.especie) r = r.filter(a => a.especie === this._filtroActivo.especie);
    if (this._filtroActivo.sexo) r = r.filter(a => a.sexo === this._filtroActivo.sexo);
    if (this._filtroActivo.estado) r = r.filter(a => a.estado === this._filtroActivo.estado);
    return r;
},

_filtrar(texto) {
    // Implementación estándar como se muestra en INTERACTION_PATTERNS.md
    // ...
}
```

### 6.3 Pasos de Migración
1. Cambiar `input type="text"` a `input type="search"` con clase `.search-input`
2. Usar selectores con clase `.form-select-gold`
3. Implementar filtrado en tiempo real mediante evento `oninput` (no `onkeyup`)
4. Separar lógica de filtros de selección (especie, sexo, estado) de búsqueda de texto
5. Mantener estado de filtros en objeto dedicado (`_filtroActivo`)
6. Mostrar mensaje claro cuando no hay resultados
7. Actualizar el DOM de manera eficiente (innerHTML en lote, no elemento por elemento)

## 7. Migración de Notificaciones y Feedback

### 7.1 Antes (Ejemplos Comunes Antiguos)
```javascript
// Alertas nativas prohibidas
alert("Pesaje registrado correctamente!");

confirm("¿Eliminar este animal? Esta acción no se puede deshacer");

// Feedback inconsistente
toastError("Error en el registro"); // Asumiendo función custom no estándar
```

### 7.2 Después (Estándar de Sistema de Feedback)
```javascript
// Toast para operaciones exitosas
mostrarToast("Pesaje registrado correctamente para 24 animales", "success");

// Confirm modal para acciones críticas
mostrarConfirmacion(
    "Eliminar Animal",
    "¿Estás seguro de que deseas eliminar este animal? Esta acción no se puede deshacer.",
    () => {
        // Lógica de eliminación
        eliminarAnimal(id);
    },
    () => {
        // Lógica de cancelación (opcional)
        console.log("Eliminación cancelada");
    }
);

// Toast para advertencias
mostrarToast("Período de retirada de leche activo hasta el 15 de julio", "warning");
```

### 7.3 Pasos de Migración
1. **Eliminar todo uso de** `alert()`, `confirm()`, `prompt()` nativos
2. Reemplazar notificaciones exitosas con `mostrarToast(mensaje, 'success')`
3. Reemplazar notificaciones de error/advertencia con `mostrarToast(mensaje, 'error'/'warning')`
4. Reemplazar confirmaciones de acciones críticas con `mostrarConfirmacion(titulo, mensaje, callbackOK, callbackCancel)`
5. Asegurar que todos los mensajes sean claros, accionables y en español
6. Usar iconografía semántica apropiada cuando sea posible

## 8. Migración de Estados de Carga y Vacío

### 8.1 Antes (Ejemplos Comunes Antiguos)
```javascript
// Estado de carga inconsistente
return `<div style="text-align: center; padding: 20px;">
            <div>Cargando...</div>
        </div>`;

// Estado vacío poco informativo
return `<div style="text-align: center; padding: 20px;">
            <p>No hay datos</p>
        </div>`;
```

### 8.2 Después (Estándar de Estados de Carga y Vacío)
```javascript
// Estado de carga con esqueleto
return `
    <div class="skeleton-loader" style="padding: 24px;">
        <div class="skeleton-item" style="height: 20px; width: 60%;"></div>
        <div class="skeleton-item" style="height: 14px; width: 80%; margin: 8px 0;"></div>
        <div class="skeleton-item" style="height: 14px; width: 50%; margin: 4px 0;"></div>
        <div class="skeleton-item" style="height: 14px; width: 70%; margin: 4px 0;"></div>
    </div>
`;

// Estado vacío informativo y accionable
return `
    <div class="empty-state" style="text-align: center; padding: 32px 16px;">
        <div class="empty-state-icon" style="font-size: 48px; color: var(--text-s); margin-bottom: 16px;">
            ${Icons.animales()}
        </div>
        <p class="empty-state-text" style="color: var(--text-primary); font-size: 1rem; margin-bottom: 24px; max-width: 400px;">
            Aún no hay animales registrados. Agrega tu primer animal para comenzar.
        </p>
        <div class="empty-state-actions">
            <button class="btn btn-create btn-lg" 
                    onclick="location.hash='/animal'">
                ${Icons.agregar()} Registrar primer animal
            </button>
        </div>
    </div>
`;
```

### 8.3 Pasos de Migración
1. Reemplazar indicadores de carga genéricos por esqueletos o spinners estándar
2. Implementar estados vacíos con:
   - Icono representativo (24-48px)
   - Mensaje claro y accionable
   - Botón de acción principal cuando aplique
3. Usar contenedores con padding adecuado (24-32px)
4. Asegurar que los estados de carga se muestren durante todas las operaciones asíncronas
5. Implementar transiciones suaves entre estados de carga, vacío y contenido

## 9. Migración de Iconos y Imágenes

### 9.1 Antes (Ejemplos Comunes Antiguos)
```javascript
// Emojis usados para funcionalidad (deberían ser SVG)
return `<span>🐄 ${animal.nombre}</span>`;

// Iconos inconsistentes
return `<span>⚠️</span> Adelanto de pago pendiente`;
```

### 9.2 Después (Estándar de Sistema de Iconos)
```javascript
// Iconos funcionales -> SVG desde Icons.*
return `<span>${Icons.animales()} ${animal.nombre}</span>`;

// Iconos decorativos -> pueden seguir siendo emojis
return `<span>💰</span> ${formatoMoneda(monto)}`;

// Uso correcto en botones
return `
    <div class="widget-link-btn--neon neon-success"
         onclick="location.hash='/animal'">
        ${Icons.agregar()} <!-- Funcional: SVG -->
        <span class="widget-label">NUEVO ANIMAL</span>
    </div>
`;

// Uso correcto en badges (texto)
return `<div class="badge-warning">PENDIENTE</div>`; // El color viene de CSS, texto simple está bien
```

### 9.3 Pasos de Migración
1. **Migrar a SVG**: Todos los iconos funcionales (pestañas, botones de acción, items de menú, cabeceras de card/sección) deben usar `Icons.*` desde `js/icons.js`
2. **Mantener emojis**: Los iconos decorativos (prefijos en labels de KPI, estados en texto simple, mensajes informativos) pueden continuar usando emojis
3. **Seguir la política de iconos**: Priorizar por impacto visual y frecuencia de uso
4. **Mantener consistencia**: Usar siempre el mismo icono para la misma acción en toda la aplicación
5. **Aplicar tamaños adecuados**:
   - Pequeños: 16-20px (labels, badges)
   - Medios: 24-32px (botones, cabeceras)
   - Grandes: 36-48px (FAB, acciones principales)

## 10. Migración de Diseño General y Layout

### 10.1 Antes (Ejemplos Comunes Antiguos)
```javascript
// Márgenes y padding inconsistentes
return `<div style="margin: 10px 20px; padding: 15px;">
            <!-- Contenido -->
        </div>`;

// Diseño de flexbox no estándar
return `<div style="display: flex;">
            <div style="width: 70%;">
                <!-- Izquierda -->
            </div>
            <div style="width: 30%; margin-left: 20px;">
                <!-- Derecha -->
            </div>
        </div>`;
```

### 10.2 Después (Estándar de Layout y Espaciado)
```javascript
// Usando tokens de espaciado
return `<div class="p-6 md:p-8">
            <!-- Contenido con padding estándar -->
        </div>`;

// Layout flexbox estándar para card-registro
return `
    <div class="card-registro" 
         style="display:flex; gap:10px; align-items:stretch; --registro-color: var(--c-info);"
         onclick="location.hash='/animal?id=${a.id}'">
        <div class="flex-1 min-w-0 flex flex-col justify-center">
            <!-- Información principal izquierda -->
        </div>
        <div class="flex flex-col items-end justify-between flex-shrink-0">
            <!-- Estado y acción derecha -->
        </div>
    </div>
`;
```

### 10.3 Pasos de Migración
1. Reemplazar márgenes y padding hardcodeados por variables CSS o clases utilitarias
2. Implementar el sistema de espaciado base-4 (múltiplos de 4px) usando:
   - Clases utilitarias: `p-[n]`, `mx-[n]`, etc. (si se usan)
   - O variables CSS directamente: `padding: var(--space-6);`
3. Aplicar el patrón estándar de card-registro (dos columnas con alineación específica)
4. Usar áreas de toque mínimas de 48x48px para todos los elementos interactivos
5. Aplicar radios de borde consistentes usando las variables CSS
6. Implementar el sistema de columnas y contenedores según los lineamientos de layout

## 11. Herramientas de Ayuda para Migración

### 11.1 Funciones Helper Recomendadas
Agregue estas funciones a un archivo de utilidades común (ej: `js/ui-helpers.js`):

```javascript
// ui-helpers.js
export class UIHelpers {
    static crearBadge(estado) {
        // Implementación como se muestra arriba
    }
    
    static crearBotonAccionHub(icono, texto, variante, onClick) {
        // Implementación como se muestra arriba
    }
    
    static mostrarToast(mensaje, tipo = 'info', duracion = 3000) {
        // Implementación como se muestra arriba
    }
    
    static mostrarConfirmacion(titulo, mensaje, callbackOK, callbackCancel) {
        // Implementación como se muestra arriba
    }
    
    // Agregar otros helpers según necesiten
}
```

### 11.2 Verificación de Migración
Después de migrar un componente, verifique:

1. **Consistencia Visual**:
   - [ ] Colores usan variables CSS semánticas
   - [ ] Tipografía usa escalas estándar
   - [ ] Espaciado usa múltiplos de 4px
   - [ ] Radios de borde son consistentes
   - [ ] Sombras siguen el patrón establecido

2. **Funcionalidad de Interacción**:
   - [ ] Estados de carga mostrados apropiadamente
   - [ ] Estados vacíos son informativos y accionables
   - [ ] Feedback usa toasts/modals estándar
   - [ ] Filtrado funciona en tiempo real
   - [ ] Navegación de ficha usa hash params limpios
   - [ ] Todo es accesible por teclado

3. **Código y Mantenimiento**:
   - [ ] No hay estilos inline innecesarios
   - [ ] No hay uso de alert()/confirm()/prompt() nativos
   - [ ] Iconos funcionales usan Icons.* library
   - [ ] Código es modular y reutilizable
   - [ ] Comentarios explican lógica no obvia

## 12. Plan de Migración por Módulo

### 12.1 Prioridad Alta (Hacer Primero)
1. **animales-view.js** - Ya parcialmente migrado, completar badges y reforzar estándares
2. **app.js** - Actualizar `_cardRegistro` y `_getAnimalCardProps` para usar badges estándar
3. **Componentes de formularios** - Asegurar entradas estándar y patrón de submit

### 12.2 Prioridad Media
1. **comercializacion-view.js** - Actualizar badges de estado de contratos
2. **produccion-view.js** - Estandarizar KPI cards y botones de acción
3. **ganaderia-view.js** - Asegurar consistencia en tarjetas de rebaño

### 12.3 Prioridad Baja (Según Disponibilidad)
1. **Vistas de reportes y análisis** - Mejorar estados de carga y filtros
2. **Configuración y ajustes** - Estandarizar formularios y toggles
3. **Componentes reutilizados en múltiples vistas** - Crear componentes compartidos

## 13. Verificación de Cumplimiento

Use esta lista de verificación para validar que un componente sigue los estándares:

### 13.1 Diseño y Layout
- [ ] Usa variables CSS para colores (`--c-success`, etc.)
- [ ] Usa escala tipográfica estándar (`--text-base`, `--text-label`, etc.)
- [ ] Implementa espaciado múltiplo de 4px
- [ ] Aplica radios de borde consistentes (`--radius-md`, etc.)
- [ ] Sigue patrón de card-registro (dos columnas con estado/arribajo-derecha)
- [ ] Área táctil mínima 48x48px respetada

### 13.2 Componentes Específicos
- **Badges**: Efecto viñeta iluminada (15% fondo, 40% borde, drop-shadow)
- **Botones**: Patrón hub con icono arriba/texto abajo, clases estándar
- **Inputs**: `type="search"` con clase `.search-input`
- **Select**: Clase `.form-select-gold`
- **Feedback**: Toasts y modals estándar, cero alertas/nativas
- **Estados vacíos**: Icono + mensaje accionable + botón cuando aplica
- **Estados de carga**: Esqueleto o spinner apropiado
- **Iconos**: Funcionales usan `Icons.*`, decorativos pueden ser emojis

### 13.3 Accesibilidad
- [ ] Navegable por teclado (Tab orden lógico)
- [ ] Elementos interactivos tienen indicador de foco visible
- [ ] ARIA labels usados cuando necesario
- [ ] Contraste de colores cumple WCAG AA (4.5:1)
- [ ] No depender únicamente del color para información
- [ ] Estados dinámicos anunciados para lectores de pantalla

### 13.4 Código de Calidad
- [ ] Cero uso de `alert()/confirm()/prompt()` nativos
- [ ] Estilos inline mínimos y justificados
- [ ] Funciones helper usadas cuando estén disponible
- [ ] Código modular y fácil de testear
- [ ] Comentarios explicativos para lógica compleja
- [ ] Nombres de variables y funciones descriptivos

## 14. Preguntas Frecuentes (FAQ)

### P: ¿Debo migrar todos los componentes de una sola vez?
**R**: No. Se recomienda una migración gradual por módulo, comenzando con los componentes de mayor uso y priorizando aquellos que muestran inconsistencias más evidentes.

### P: ¿Qué pasa si un componente requiere una variante que no existe en el estándar?
**R**: Primero verifique si realmente necesita una variante nueva. Si es absolutamente necesario, documente la variante propuesta siguiendo el mismo patrón y propóngala para inclusión en el estándar antes de implementarla.

### P: ¿Cómo manejo los temas (oscuro/claro) en mis componentes?
**R**: Use siempre las variables CSS (como `--c-success`) en lugar de valores hardcodeado. Los temas se manejan a nivel de `:root` o `[data-theme="dark"]`.

### P: ¿Mis cambios afectarán el rendimiento?
**R**: Los estándares están diseñados para ser eficientes. Usar variables CSS es más performante que estilos inline repetitivos, y los patrones de renderizado (como innerHTML en lote) son más eficientes que manipulaciones DOM individuales.

### P: ¿Dónde encuento los íconos para usar?
**R**: Todos los íconos funcionales están en `js/icons.js`. Revise ese archivo para ver qué está disponible. Si necesita un nuevo ícono, agréguelo siguiendo las convenciones existentes.

### P: ¿Qué hago con componentes que ya usan un patrón diferente pero funcionan bien?
**R**: Si un componente sigue un patrón interno consistente y cumple con los requisitos de accesibilidad y usabilidad, puede mantenerse hasta que se planifique una refactorización más grande. Sin embargo, todos los nuevos componentes deben seguir el estándar actual.

## 15. Recursos Adicionales

- **DESIGN.md**: Contrato de diseño principal
- **docs/STATUS_BADGE_STANDARD.md**: Detalle completo de badges
- **docs/WIDGET_BUTTON_STANDARD.md**: Detalle completo de botones hub
- **docs/INTERACTION_PATTERNS.md**: Patrones de filtrado, navegación y feedback
- **docs/DESIGN_TOKENS.md**: Lista completa de tokens de diseño
- **js/icons.js**: Biblioteca de iconos disponibles
- **js/app.js**: Implementación de helpers como `_cardRegistro`

---

> **Nota Final**: La consistencia en el diseño no se trata de hacer que todo se vea idéntico, sino de crear una experiencia predecible y confiable para los usuarios. Cuando los elementos se comportan y se ven como se espera, los usuarios pueden enfocarse en sus tareas en lugar de intentar entender cómo funciona la interfaz.

Esta guía será actualizada periódicamente según evolucione el sistema de diseño. Por favor, consulte siempre la versión más reciente antes de comenzar cualquier trabajo de migración.