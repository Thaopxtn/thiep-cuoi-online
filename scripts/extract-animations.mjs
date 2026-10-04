import fs from 'fs';

const cssFiles = [
  '37878e5a9e804579.css',
  '0b69344a05fb17f9.css',
  '4933cd6097277462.css',
  '9c6a6f06eb16ff6c.css',
  'de0fc822d152f4a8.css',
  '295c86662cc8f5b1.css',
  '5af2499a829c1717.css',
  '3e1e000886abbc02.css',
  '2ae2b0a43bc6fe1f.css',
  '1a20cba507f2027f.css',
  'a655fa934d02c262.css',
  '8600d12a574b448c.css'
];

async function main() {
  const allKeyframes = [];
  const allAnimations = [];

  for (const f of cssFiles) {
    const url = `https://zenlove.me/_next/static/css/${f}`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      fs.writeFileSync(`scripts/${f}`, text);

      // Extract @keyframes
      const kfMatches = text.match(/@keyframes\s+([a-zA-Z0-9_-]+)\s*\{([^}]+)\}/g) || [];
      kfMatches.forEach(kf => allKeyframes.push({ file: f, css: kf }));

      // Extract animation classes e.g. .animate-...
      const animClasses = text.match(/\.animate-[a-zA-Z0-9_-]+/g) || [];
      animClasses.forEach(ac => allAnimations.push(ac));
    } catch(e) {
      console.log('Error fetching', f, e.message);
    }
  }

  console.log('Total keyframes found:', allKeyframes.length);
  fs.writeFileSync('scripts/extracted-keyframes.json', JSON.stringify(allKeyframes, null, 2));

  console.log('Unique animation classes:', [...new Set(allAnimations)]);
}

main().catch(console.error);
