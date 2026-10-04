import fs from 'fs';

const html = fs.readFileSync('scripts/iframe_thiep-cuoi-110-pre.html', 'utf8');

const regex = /self\.__next_f\.push\(\[1,\s*"([\s\S]*?)"\]\)/g;
let match;
let fullText = '';
while ((match = regex.exec(html)) !== null) {
  try {
    // Unescape unicode and slashes
    const unescaped = match[1]
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n');
    fullText += unescaped;
  } catch(e) {}
}

fs.writeFileSync('scripts/iframe_110_decompiled.txt', fullText);
console.log('Decompiled length:', fullText.length);

// Find all HTML elements or component tags in decompiled
const tagMatches = fullText.match(/\"className\":\"([^\"]+)\"/g) || [];
const classes = new Set();
tagMatches.forEach(t => {
  const c = t.replace(/\"className\":\"|\"/g, '').split(/\s+/);
  c.forEach(n => classes.add(n));
});

console.log('Unique classes in decompiled:', classes.size);
const specialClasses = [...classes].filter(c => c.includes('animate') || c.includes('transition') || c.includes('transform') || c.includes('hover') || c.includes('fade') || c.includes('scale') || c.includes('mc-') || c.includes('fixed') || c.includes('sticky'));
console.log('Special transition/animation classes found in 110 Pre:');
console.log(specialClasses);

// Search for libraries: AOS, framer-motion, swiper
console.log('Libraries mentioned:');
['framer-motion', 'aos', 'swiper', 'gsap', 'canvas-confetti', 'lucide'].forEach(lib => {
  if (fullText.toLowerCase().includes(lib)) {
    console.log(`  Found: ${lib}`);
  }
});
