const fs = require('fs');
const path = require('path');

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F004}-\u{1F0CF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu;

function findEmojis(dir) {
  let emojis = new Set();
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findEmojis(fullPath).forEach(e => emojis.add(e));
    } else if (fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(emojiRegex);
      if (matches) {
        matches.forEach(e => emojis.add(e));
      }
    }
  }
  return emojis;
}

const allEmojis = findEmojis('C:\\Users\\yo\\repo\\LIVESTOCK-MANAGER\\js');
console.log("Emojis found:");
console.log(Array.from(allEmojis).join(' '));
