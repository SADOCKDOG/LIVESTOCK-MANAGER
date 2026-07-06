const fs = require('fs');

let content = fs.readFileSync('C:\\Users\\yo\\repo\\LIVESTOCK-MANAGER\\css\\styles.css', 'utf-8');

const mapping = {
  '#141517': 'var(--bg)',
  '#1e2023': 'var(--surface)',
  '#262a2e': 'var(--surface-light)',
  '#2c2f33': 'var(--border)',

  '#ffffff': 'var(--text-p)',
  '#fff': 'var(--text-p)',
  '#94a3b8': 'var(--text-s)',
  '#666666': 'var(--text-d)',
  '#666': 'var(--text-d)',

  '#ccff00': 'var(--c-success)',
  '#cf0': 'var(--c-success)',
  '#ffd600': 'var(--p-gold)',
  '#ff4444': 'var(--c-danger)',
  '#f44': 'var(--c-danger)',
  '#3b82f6': 'var(--c-info)',
  '#8b5cf6': 'var(--c-accent)',
  '#f97316': 'var(--c-orange)',
  '#a855f7': 'var(--c-purple)',
  '#ec4899': 'var(--c-pink)'
};

for (const [hex, variable] of Object.entries(mapping)) {
  const regex = new RegExp(hex + '(?![0-9a-fA-F])', 'gi');
  content = content.replace(regex, variable);
}

fs.writeFileSync('C:\\Users\\yo\\repo\\LIVESTOCK-MANAGER\\css\\styles.css', content);
console.log("Colors migrated.");
