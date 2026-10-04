import fs from 'fs';

const cssFiles = [
  '295c86662cc8f5b1.css',
  '5af2499a829c1717.css',
  '2ae2b0a43bc6fe1f.css',
  '1a20cba507f2027f.css',
  'a655fa934d02c262.css',
  '8600d12a574b448c.css'
];

function extractFullKeyframes(text) {
  const keyframes = {};
  let i = 0;
  while (true) {
    const kfIdx = text.indexOf('@keyframes', i);
    if (kfIdx === -1) break;
    
    // Find name
    const openBrace = text.indexOf('{', kfIdx);
    const name = text.slice(kfIdx + 10, openBrace).trim();
    
    // Match braces
    let depth = 0;
    let endIdx = openBrace;
    while (endIdx < text.length) {
      if (text[endIdx] === '{') depth++;
      else if (text[endIdx] === '}') {
        depth--;
        if (depth === 0) break;
      }
      endIdx++;
    }
    
    const body = text.slice(openBrace, endIdx + 1);
    keyframes[name] = body;
    i = endIdx + 1;
  }
  return keyframes;
}

const allRules = {};
cssFiles.forEach(f => {
  if (fs.existsSync(`scripts/${f}`)) {
    const text = fs.readFileSync(`scripts/${f}`, 'utf8');
    const kfs = extractFullKeyframes(text);
    Object.assign(allRules, kfs);
  }
});

console.log('Extracted', Object.keys(allRules).length, 'full keyframes:');
fs.writeFileSync('scripts/all-full-keyframes.json', JSON.stringify(allRules, null, 2));
console.log(Object.keys(allRules));
