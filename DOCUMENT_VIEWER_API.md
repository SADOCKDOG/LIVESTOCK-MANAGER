# DocumentViewer API

The unified PDF viewer service `window.generateAndShowPDF` replaces the deprecated `DocumentViewer.show` direct usage.

## Function

`generateAndShowPDF(opts: GeneratePDFOptions): Promise<void>`

### GeneratingPDFOptions

- `title: string` - Document title, displayed in viewer header.
- `html: string` - HTML content of the document (without wrapper).
- `filename: string` - Base filename for the generated PDF (extension added automatically).
- `shareTitle?: string` - Title used in share dialog.
- `shareText?: string` - Text used in share dialog.
- `onClose?: () => void` - Callback executed when the viewer is closed.

### Behavior

- Shows a full‑screen overlay using `DocumentViewer` internal logic.
- Generates PDF via `html2pdf` (falls back to HTML preview if library unavailable).
- Provides share functionality on Android via Capacitor `Share` plugin.
- Fallback download if sharing not possible.

### Migration

Replace direct `DocumentViewer.show({...})` calls with:

```javascript
await window.generateAndShowPDF({
  title,
  html,
  filename,
  shareTitle,
  shareText,
  onClose
});
```

See the migration guide in `MIGRATION-GUIDE.md` for details on replacing per‑wizard calls.