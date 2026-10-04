import fs from 'fs';

const html = fs.readFileSync('scripts/iframe_thiep-cuoi-110-pre.html', 'utf8');

console.log('--- Analyzing iframe_thiep-cuoi-110-pre.html ---');

// Extract the main body elements or section tags
const bodyIdx = html.indexOf('<body');
const bodyEnd = html.indexOf('</body>');
const bodyContent = html.slice(bodyIdx, bodyEnd);

console.log('Body length:', bodyContent.length);

// Extract all class names used in the template body
const classMatches = bodyContent.match(/class="([^"]+)"/g) || [];
const allClasses = new Set();
classMatches.forEach(c => {
  const names = c.replace(/class="|"/g, '').split(/\s+/);
  names.forEach(n => allClasses.add(n));
});

console.log('Unique CSS classes in body count:', allClasses.size);
const customClasses = [...allClasses].filter(c => c.startsWith('mc-') || c.includes('animate') || c.includes('envelope') || c.includes('music') || c.includes('polaroid') || c.includes('wishes') || c.includes('rsvp'));
console.log('Custom template & animation classes:', customClasses);

// Search for data payload in scripts
const dataMatches = html.match(/self\.__next_f\.push\(\[1,\s*"([\s\S]*?)"\]\)/g) || [];
console.log('Next.js push chunks in iframe:', dataMatches.length);

// Write body to file for visual inspection
fs.writeFileSync('scripts/iframe_body_110.html', bodyContent);
