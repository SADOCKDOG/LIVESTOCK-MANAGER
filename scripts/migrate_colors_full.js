const fs = require('fs');

let content = fs.readFileSync('C:\\Users\\yo\\repo\\LIVESTOCK-MANAGER\\css\\styles.css', 'utf-8');

const map = {
  // Grays/Bg
  '#000': 'rgb(0, 0, 0)',
  '#0a0a0a': 'rgb(0, 0, 0)',
  '#0d0d0d': 'rgb(0, 0, 0)',
  '#050505': 'rgb(0, 0, 0)',
  
  '#111': 'var(--surface)',
  '#151515': 'var(--surface)',
  '#161616': 'var(--surface)',
  '#181818': 'var(--surface)',
  '#1a1a1a': 'var(--surface)',
  '#1e1e1e': 'var(--surface)',
  '#18181b': 'var(--surface)',
  '#111827': 'var(--surface)',
  '#0f0f0f': 'var(--surface)',

  '#222': 'var(--surface-light)',
  '#2a2a2a': 'var(--surface-light)',
  '#27272a': 'var(--surface-light)',
  '#2e2e2e': 'var(--surface-light)',
  '#2d2d2d': 'var(--surface-light)',
  '#1f2937': 'var(--surface-light)',

  '#333': 'var(--border)',
  '#3a3a3a': 'var(--border)',
  '#3f3f46': 'var(--border)',
  '#374151': 'var(--border)',

  '#444': 'var(--border)',
  '#555': 'var(--border)',

  // Grays/Text
  '#888': 'var(--text-s)',
  '#777': 'var(--text-s)',
  '#999': 'var(--text-s)',
  '#9ca3af': 'var(--text-s)',
  '#6b7280': 'var(--text-s)',
  '#a1a1aa': 'var(--text-s)',
  '#a0a0a0': 'var(--text-s)',
  '#aaa': 'var(--text-s)',
  '#bbb': 'var(--text-s)',
  '#ccc': 'var(--text-s)',

  '#ddd': 'rgb(221, 221, 221)',
  '#eee': 'rgb(238, 238, 238)',
  '#e4e4e7': 'rgb(228, 228, 231)',
  '#e5e7eb': 'rgb(229, 231, 235)',
  '#f0f0f0': 'rgb(240, 240, 240)',
  '#f5f5f5': 'rgb(245, 245, 245)',
  '#f9f9f9': 'rgb(249, 249, 249)',

  // Colors
  '#ef4444': 'var(--c-danger)',
  '#f87171': 'var(--c-danger)',
  '#dc2626': 'var(--c-danger)',
  '#b91c1c': 'var(--c-danger)',
  '#991b1b': 'var(--c-danger)',
  '#7f1d1d': 'var(--c-danger)',
  '#450a0a': 'var(--c-danger)',
  '#2a1a1a': 'var(--c-danger)',
  '#2a0808': 'var(--c-danger)',
  '#fca5a5': 'var(--c-danger)',

  '#10b981': 'var(--c-success)',
  '#16a34a': 'var(--c-success)',
  '#047857': 'var(--c-success)',
  '#065f46': 'var(--c-success)',
  '#a7f3d0': 'var(--c-success)',
  '#14b8a6': 'var(--c-success)',

  '#f59e0b': 'var(--c-warning)',
  '#facc15': 'var(--c-warning)',
  '#f3c14b': 'var(--c-warning)',
  '#c9851f': 'var(--c-warning)',
  '#c2410c': 'var(--c-warning)',
  '#d4a373': 'var(--c-warning)',
  '#a0673a': 'var(--c-warning)',

  '#2563eb': 'var(--c-info)',
  '#1d4ed8': 'var(--c-info)',
  '#1e3a8a': 'var(--c-info)',

  '#6d28d9': 'var(--c-purple)',
  '#7c3aed': 'var(--c-purple)',

  '#f472b6': 'var(--c-pink)'
};

for (const [hex, variable] of Object.entries(map)) {
  const regex = new RegExp(hex + '(?![0-9a-fA-F])', 'gi');
  content = content.replace(regex, variable);
}

fs.writeFileSync('C:\\Users\\yo\\repo\\LIVESTOCK-MANAGER\\css\\styles.css', content);
console.log("Colors migrated fully.");
