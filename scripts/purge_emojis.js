const fs = require('fs');
const path = require('path');

const emojiMap = {
  '✅': '${Icons.check()}',
  '❌': '${Icons.cerrar()}',
  '⚠': '${Icons.alerta()}',
  '⚠️': '${Icons.alerta()}',
  '✕': '${Icons.cerrar()}',
  '✓': '${Icons.check()}',
  '🧪': '${Icons.fitosanitario()}',
  '📅': '${Icons.calendar()}',
  '📋': '${Icons.documento()}',
  '📍': '${Icons.finca()}',
  '📊': '${Icons.grafico()}',
  '📈': '${Icons.tendencia()}',
  '⚡': '${Icons.rayo()}',
  '🐢': '${Icons.alerta()}',
  '🎉': '${Icons.estrella()}',
  '🧹': '${Icons.eliminar()}',
  '🗑️': '${Icons.eliminar()}',
  '🗑': '${Icons.eliminar()}',
  '💡': '${Icons.info()}',
  '✗': '${Icons.cerrar()}',
  '♀': '${Icons.hembra()}',
  '♂': '${Icons.macho()}',
  '⚤': '${Icons.reproduccion()}',
  '💰': '${Icons.dinero()}'
};

const emojiRegex = new RegExp(Object.keys(emojiMap).join('|'), 'g');

const tokenRegex = /(`(?:[^`\\]|\\.)*`)|('(?:[^'\\]|\\.)*')|("(?:[^"\\]|\\.)*")|(\/\/[^\n]*)/g;

let filesModified = 0;
let emojisPurged = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  content = content.replace(tokenRegex, (match, backtick, single, double, comment) => {
    // Reset regex index
    emojiRegex.lastIndex = 0;
    if (!emojiRegex.test(match)) return match;
    emojiRegex.lastIndex = 0;

    if (single || double) {
      let inner = single ? match.slice(1, -1) : match.slice(1, -1);
      inner = inner.replace(/`/g, '\\`');
      let newStr = '`' + inner + '`';
      let finalStr = newStr.replace(emojiRegex, (e) => {
        emojisPurged++;
        return emojiMap[e] || e;
      });
      return finalStr;
    } else if (backtick || comment) {
      let finalStr = match.replace(emojiRegex, (e) => {
        emojisPurged++;
        return emojiMap[e] || e;
      });
      return finalStr;
    }
    
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    filesModified++;
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

walkDir('C:\\Users\\yo\\repo\\LIVESTOCK-MANAGER\\js');
console.log(`Purgados ${emojisPurged} emojis en ${filesModified} archivos.`);
