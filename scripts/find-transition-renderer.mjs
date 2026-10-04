import fs from 'fs';

const files = fs.readdirSync('scripts').filter(f => f.endsWith('.js'));
for (const f of files) {
  const t = fs.readFileSync(`scripts/${f}`, 'utf8');
  if (t.includes('scale-in') || t.includes('slide-up')) {
    console.log('Found transitions in', f);
    const idx = t.indexOf('scale-in');
    if (idx !== -1) {
      console.log('Snippet around scale-in:');
      console.log(t.slice(Math.max(0, idx - 150), idx + 350));
    }
  }
}
