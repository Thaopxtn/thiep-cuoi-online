import fs from 'fs';

const text = fs.readFileSync('scripts/6984-1b5cca11179e1bf1.js', 'utf8');
const idx = text.indexOf('let n={"fade-in":');
console.log(text.slice(idx, idx + 1800));
