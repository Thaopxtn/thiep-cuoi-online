import fs from 'fs';

const chunks = JSON.parse(fs.readFileSync('scripts/iframe_all_chunks.json', 'utf8'));

async function scanChunks() {
  console.log('Scanning', chunks.length, 'chunks...');
  for (const chunkUrl of chunks) {
    const filename = chunkUrl.split('/').pop();
    const url = `https://zenlove.me${chunkUrl}`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      
      if (text.includes('90976:') || text.includes('openingAnimation') || text.includes('ZenStockBox')) {
        console.log(`\n*** MATCH in ${filename} ***`);
        fs.writeFileSync(`scripts/${filename}`, text);
        
        ['90976:', 'openingAnimation', 'ZenStockBox', 'effectEnabled', 'slide-up'].forEach(k => {
          const idx = text.indexOf(k);
          if (idx !== -1) {
            console.log(`  [${k}]:`, text.slice(Math.max(0, idx - 50), idx + 250));
          }
        });
      }
    } catch(e) {}
  }
}

scanChunks().catch(console.error);
