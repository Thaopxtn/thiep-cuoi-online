import fs from 'fs';

const text = fs.readFileSync('scripts/7137-cd34199fe4088d3a.js', 'utf8');
const idx = text.indexOf('12231:');
console.log('Index of 12231:', idx);
if (idx !== -1) {
  console.log(text.slice(idx, idx + 500));
}
