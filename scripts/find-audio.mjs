import fs from 'fs';

const content = fs.readFileSync('C:/Users/thaoh/.gemini/antigravity/brain/8aa7fe5b-4ebf-436d-a0b5-e793f5ff0e38/.system_generated/steps/1254/content.md', 'utf8');

const audioRegex = /https:\/\/[^"')\s]+\.(?:mp3|wav|ogg|m4a)/gi;
const audioMatches = Array.from(new Set(content.match(audioRegex) || []));
console.log('Audio matches:', audioMatches);

// Also look for sound / audio tags
const soundMatches = content.match(/sound[^"',;{}]+/gi) || [];
console.log('Sound matches:', soundMatches.slice(0, 10));
