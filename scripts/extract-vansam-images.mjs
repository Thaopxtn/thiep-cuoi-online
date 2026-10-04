import fs from 'fs';

const content = fs.readFileSync('C:/Users/thaoh/.gemini/antigravity/brain/8aa7fe5b-4ebf-436d-a0b5-e793f5ff0e38/.system_generated/steps/1254/content.md', 'utf8');

const regex = /https:\/\/[^"')\s]+\.(?:png|jpg|jpeg|webp|svg)/gi;
const matches = Array.from(new Set(content.match(regex) || []));

console.log(`Found ${matches.length} image URLs:`);
matches.forEach((url, i) => console.log(`${i + 1}: ${url}`));
