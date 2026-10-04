import fs from 'fs';

const cssFiles = fs.readdirSync('scripts').filter(f => f.endsWith('.css'));
for (const f of cssFiles) {
  const text = fs.readFileSync(`scripts/${f}`, 'utf8');
  ['zoomIn', 'slideInUp', 'slideInDown', 'fadeIn', 'bounceIn', 'flipInY'].forEach(k => {
    if (text.includes(k)) {
      console.log(`Found ${k} in ${f}`);
      const idx = text.indexOf(`@keyframes ${k}`);
      if (idx !== -1) {
        console.log(text.slice(idx, idx + 300));
      }
    }
  });
}
