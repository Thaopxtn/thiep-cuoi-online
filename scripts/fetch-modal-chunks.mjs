import fs from 'fs';

async function fetchAndAnalyze(filename) {
  const url = `https://zenlove.me/_next/${filename}`;
  console.log('Fetching', url);
  const res = await fetch(url);
  const text = await res.text();
  console.log(`Length of ${filename}:`, text.length);
  fs.writeFileSync(`scripts/${filename.replace(/[\/\\]/g, '_')}`, text);

  // Search for key components, animations, iframes
  ['iframe', 'src', 'design-template', 'animate', 'keyframes', 'framer-motion', 'transition', 'spring', 'audio', 'qr', 'rsvp'].forEach(word => {
    let count = 0;
    let pos = 0;
    while ((pos = text.indexOf(word, pos)) !== -1) {
      count++;
      if (count <= 3) {
        console.log(`  [${word}]:`, text.slice(Math.max(0, pos - 40), pos + 100));
      }
      pos += word.length + 50;
    }
    if (count > 0) {
      console.log(`  Total ${word} occurrences: ${count}`);
    }
  });
}

async function main() {
  await fetchAndAnalyze('static/chunks/1669.12c0c279cf8d595e.js');
  await fetchAndAnalyze('static/chunks/1061.bbedf30245e1860e.js');
}

main().catch(console.error);
