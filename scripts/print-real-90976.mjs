import fs from 'fs';

const text = fs.readFileSync('scripts/7137-cd34199fe4088d3a.js', 'utf8');
const idx = text.indexOf('90976:');
console.log('Index:', idx);
if (idx !== -1) {
  console.log(text.slice(idx, idx + 2500));
}
