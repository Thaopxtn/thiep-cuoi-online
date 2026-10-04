import fs from 'fs';

const text = fs.readFileSync('scripts/4459-b9c5a781e5e3a9a0.js', 'utf8');

const idx = text.indexOf('@keyframes envelope-away');
console.log('Index:', idx);
if (idx !== -1) {
  console.log(text.slice(idx, idx + 800));
} else {
  // Let's search for envelope-away anywhere
  let pos = 0;
  while ((pos = text.indexOf('envelope-away', pos)) !== -1) {
    console.log(`Match at ${pos}:`, text.slice(Math.max(0, pos - 100), pos + 250));
    pos += 20;
  }
}
