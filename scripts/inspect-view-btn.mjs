import fs from 'fs';

const text = fs.readFileSync('scripts/8122-bb7d7e188a412d31.js', 'utf8');
const idx = text.indexOf('let u=');
console.log('Index of let u=:', idx);
if (idx !== -1) {
  console.log(text.slice(idx, idx + 1500));
}
