import fs from 'fs';

const text = fs.readFileSync('scripts/4459-b9c5a781e5e3a9a0.js', 'utf8');

console.log('--- Inspecting opening animation in 4459 ---');
['curtain', 'openingAnimation', 'envelope', 'sound', 'skip', 'seal'].forEach(k => {
  const idx = text.indexOf(k);
  if (idx !== -1) {
    console.log(`[${k}]:`, text.slice(Math.max(0, idx - 40), idx + 200));
  }
});
