import fs from 'fs';

const firstCss = [
  '49d0ce731a88c82a.css',
  '5771ba0673ee0159.css',
  '3dce791d66769d1a.css',
  '61bf6eca9cf03b29.css',
  'd2cb5e364131d3a3.css',
  '5b49eadc661800be.css',
  '5d29c85b5e142df2.css'
];

async function main() {
  for (const f of firstCss) {
    const res = await fetch(`https://zenlove.me/_next/static/css/${f}`);
    const text = await res.text();
    fs.writeFileSync(`scripts/${f}`, text);
    
    ['zoomIn', 'slideInUp', 'fadeIn', 'bounceIn', 'flipInY', 'rotateIn'].forEach(k => {
      if (text.includes(k)) {
        console.log(`Found ${k} in ${f}`);
        const idx = text.indexOf(`@keyframes ${k}`);
        if (idx !== -1) {
          console.log(text.slice(idx, idx + 400));
        }
      }
    });
  }
}

main().catch(console.error);
