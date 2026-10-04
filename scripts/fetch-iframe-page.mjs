import fs from 'fs';

async function main() {
  const url = 'https://zenlove.me/_next/static/chunks/app/(view-pages)/iframes/%5Bslug%5D/page-5cf206fa271c0cab.js';
  console.log('Fetching iframe page chunk:', url);
  const res = await fetch(url);
  const text = await res.text();
  console.log('Chunk length:', text.length);
  fs.writeFileSync('scripts/iframe-page-chunk.js', text);

  // Search for components, imports, and templates
  const imports = text.match(/n\([0-9]+\)/g) || [];
  console.log('Webpack imports count:', imports.length);

  // Search for animation and effects
  ['aos', 'data-aos', 'animate', 'transform', 'transition', 'spring', 'heart', 'envelope', 'music', 'sound', 'wave', 'confetti', 'star', 'firework'].forEach(term => {
    let count = 0;
    let pos = 0;
    while ((pos = text.toLowerCase().indexOf(term, pos)) !== -1) {
      count++;
      if (count <= 2) {
        console.log(`  [${term}]:`, text.slice(Math.max(0, pos - 40), pos + 100));
      }
      pos += term.length + 50;
    }
    if (count > 0) {
      console.log(`  Total ${term} occurrences: ${count}`);
    }
  });
}

main().catch(console.error);
