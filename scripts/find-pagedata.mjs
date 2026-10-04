import fs from 'fs';

const html = fs.readFileSync('scripts/iframe_thiep-cuoi-110-pre.html', 'utf8');

const idx = html.indexOf('pageData');
console.log('Index of pageData:', idx);
if (idx !== -1) {
  // Let's print out what is around pageData
  console.log(html.slice(Math.max(0, idx - 100), idx + 2000));
}

// Let's also check openingAnimation
const animIdx = html.indexOf('openingAnimation');
console.log('Index of openingAnimation:', animIdx);
if (animIdx !== -1) {
  console.log(html.slice(Math.max(0, animIdx - 50), animIdx + 500));
}
