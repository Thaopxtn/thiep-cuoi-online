import fs from 'fs';

const content = fs.readFileSync('scripts/8122-bb7d7e188a412d31.js', 'utf8');
const idx = 23880;
console.log(content.slice(idx - 1200, idx + 100));
