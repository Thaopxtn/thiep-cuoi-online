import fs from 'fs';

const text = fs.readFileSync('scripts/4459-b9c5a781e5e3a9a0.js', 'utf8');
const idx = text.indexOf('@keyframes envelope-away');
console.log(text.slice(idx, idx + 2500));
