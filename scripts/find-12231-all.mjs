import fs from 'fs';

const files = fs.readdirSync('scripts').filter(f => f.endsWith('.js'));
for (const f of files) {
  const t = fs.readFileSync(`scripts/${f}`, 'utf8');
  if (t.includes('12231:')) {
    console.log('Found in', f);
    const idx = t.indexOf('12231:');
    console.log(t.slice(idx, idx + 400));
  }
}
