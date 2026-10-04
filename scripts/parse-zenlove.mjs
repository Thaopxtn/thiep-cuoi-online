import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\thaoh\\.gemini\\antigravity\\brain\\8aa7fe5b-4ebf-436d-a0b5-e793f5ff0e38\\.system_generated\\steps\\830\\content.md', 'utf8');

// Find all script tags containing self.__next_f
const regex = /self\.__next_f\.push\(\[1,\s*"([\s\S]*?)"\]\)/g;
let match;
let chunks = [];
while ((match = regex.exec(content)) !== null) {
  try {
    // unescape double quotes and slashes
    chunks.push(match[1]);
  } catch(e) {}
}

const fullText = chunks.join('');
console.log('Total __next_f chunks length:', fullText.length);

// Let's find template JSON structures
const regexTemplates = /\{[^{}]*?"id":"([0-9a-f-]{36})"[^{}]*?"name":"([^"]+)"[^{}]*?\}/g;
let tMatch;
const found = [];
while ((tMatch = regexTemplates.exec(fullText)) !== null) {
  found.push({ id: tMatch[1], name: tMatch[2] });
}

console.log('Found templates:', found.slice(0, 20));

// Also let's find any iframe URLs or API calls in fullText
const iframes = fullText.match(/\/iframes\/[a-zA-Z0-9_-]+/g) || [];
console.log('Iframes:', [...new Set(iframes)]);

// Let's search for animation keywords
const animations = fullText.match(/animate-[a-zA-Z0-9_-]+|keyframes\s+[a-zA-Z0-9_-]+/g) || [];
console.log('Animations:', [...new Set(animations)].slice(0, 20));
