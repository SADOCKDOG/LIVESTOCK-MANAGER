# Librería de Componentes - Livestock Manager (SIGGAN Standard)

Este documento detalla el sistema de diseño unificado tras la auditoría UI/UX v5.2.

## Design Tokens (`css/design-tokens.css`)

### Colores
- **Primario (Oro Corcho):** `--p-cork` (#d4a373)
- **Acento (Verde Alcornoque):** `--p-accent` (#7fb069)
- **Éxito:** `--color-success` (#10b981)
- **Peligro:** `--color-danger` (#ef4444)
- **Info:** `--color-info` (#3b82f6)

### Espaciado
- `xs`: 8px
- `sm`: 12px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px

## Componentes

### Botones (`.btn`)
- **Large (58px):** `.btn`. Usado para CTAs principales.
- **Medium (48px):** `.btn-sm`, `.btn-icon`, `.wizard-btn-action`.
- **Interacción:** Escala `0.96` y Brillo `0.9` en estado `:active`.

### Tarjetas (`.card`)
- **Base:** `.card`. Padding `var(--space-lg)`, radio `var(--radius-lg)`.
- **Acento:** `.card-accent`. Borde superior de 5px. Variantes: `-green`, `-red`, `-blue`, `-purple`.
- **Lista:** `.card-item`, `.card-animal`. Borde izquierdo de 4px.

### Formularios
- **Label:** `.form-label` / `.wizard-label`. 0.75rem, negrita, uppercase.
- **Input:** `.form-input`. Altura mín. 48px, fondo `--surface-light`.
- **Error:** `.form-error`. Incluye icono ⚠️ y color `--color-danger`.

### Feedback
- **Toasts:** `.toast`. Centrados, fondo glass, borde `--p-cork`.
- **Glass backgrounds:** `.bg-green-glass`, `.bg-red-glass`, etc.

## Iconografía
- Clase base: `.icon`.
- Tamaños: `.icon-sm` (20px), `.icon-md` (24px), `.icon-lg` (28px).
- Trazo estándar: 2px.
