# Design Documentation: Industrial Premium System

## 1. Design Language: "Cork Manager Standard"
The UI follows the **Industrial Premium** aesthetic, characterized by high-contrast neon accents on deep graphite backgrounds, optimized for readability in harsh outdoor conditions.

## 2. Color System (OLED Optimized)
| Category | Token | Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Primary** | `--p-cork` | `#CF0` | Neon Lime - Growth, Success, Main Branding |
| **Secondary**| `--p-gold` | `#FFD600` | Neon Gold - R.E.G.A. IDs, Warning, Highlights |
| **Background**| `--bg` | `#141517` | Cold Graphite - Battery saving, Eye comfort |
| **Surface** | `--surface`| `#1E2023` | Deep Graphite - Card elevation |
| **Danger** | `--c-danger`| `#F44` | Red - Critical Alerts, Expenses, Removals |

## 3. Typography Hierarchy
- **Titles (Archivo Expanded):** Heavy weights (700-900) to convey authority and strength.
- **Body (Inter):** Clean, modern sans-serif for maximum readability.
- **Data (IBM Plex Mono):** Technical monospace for Crotales (Ear tags), weights, and dates.

## 4. UI Components

### Neon Glow & Effects
- **Outer Glow:** Active elements use `box-shadow` in their semantic color.
- **Route Pill:** Centralized header navigation context.
- **R.E.G.A Badge:** Floating gold badge for official farm identification.

### Outdoor-Ready Wizards
- **Full-Screen Focus:** `wizard-full-screen` overlays with 92% opacity and backdrop blur.
- **Rugged Interaction:** Action buttons feature a `min-height: 48px` and `14px` padding, designed for gloved or quick-touch use.
- **Guided Flow:** Fixed headers and footers with clear "Step X of N" indicators to reduce cognitive load in the field.

### Information & Registration Cards
- **Record Cards:** `.card` components with `16px` radius and semantic neon headings.
- **Contextual Help:** High-contrast `nota-box` containers for critical regulatory warnings.
- **Technical Chips:** `med-chip` system for fast filtering of technical categories (Sanitary, Breeds, etc.).

## 5. Layout Constants
- **Base Radius:** `16px` (Cards, Inputs).
- **Interactive Min:** `50px` touch area.
- **Spacing:** 4px grid system (sp-1 to sp-6).
- **Safe Areas:** Adherence to `viewport-fit=cover` for edge-to-edge immersion.

## 6. Iconography
Linear SVG icons with a 2px stroke, inheriting semantic colors from the parent module.
