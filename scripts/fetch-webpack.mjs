import fs from 'fs';

async function main() {
  const url = 'https://zenlove.me/_next/static/chunks/webpack-9c84c24b789829ba.js';
  const res = await fetch(url);
  const text = await res.text();
  console.log('Webpack chunk length:', text.length);

  // Look for 1669 or 1061 or 7835
  [1669, 1061, 7835, 391, 822, 4401].forEach(id => {
    const idx = text.indexOf(String(id));
    if (idx !== -1) {
      console.log(`Mapping for ${id}:`, text.slice(Math.max(0, idx - 50), idx + 100));
    }
  });

  // Extract the entire chunkId to filename mapping
  // Usually: {1669: "hash", 1061: "hash"}
  const match = text.match(/\{[0-9]+:"[0-9a-f]+"[^}]*\}/);
  if (match) {
    console.log('Found chunk mapping snippet:', match[0].slice(0, 500));
  }
}

main().catch(console.error);
