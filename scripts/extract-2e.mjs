import fs from 'fs';

const html = fs.readFileSync('scripts/iframe_thiep-cuoi-110-pre.html', 'utf8');

// Find 2e:
const idx = html.indexOf('2e:');
console.log('Index of 2e::', idx);
if (idx !== -1) {
  const chunkText = html.slice(idx, idx + 4000);
  fs.writeFileSync('scripts/chunk_2e.json', chunkText);
  console.log('Chunk 2e preview:', chunkText.slice(0, 1000));
}
