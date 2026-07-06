const fs = require('fs');

const content = fs.readFileSync('C:\\Users\\yo\\repo\\LIVESTOCK-MANAGER\\css\\styles.css', 'utf-8');

const regex = /#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/g;
const matches = content.match(regex) || [];

const uniqueHex = [...new Set(matches.map(h => h.toLowerCase()))];
console.log(uniqueHex.join(', '));
