import fs from 'fs';

const text = fs.readFileSync('scripts/4459-b9c5a781e5e3a9a0.js', 'utf8');

// Find the style tag or jsx style
const idx = text.indexOf('envelope-away');
console.log('Index of envelope-away:', idx);
if (idx !== -1) {
  console.log(text.slice(Math.max(0, idx - 200), idx + 2000));
}
