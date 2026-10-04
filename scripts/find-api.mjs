import fs from 'fs';

const pText = fs.readFileSync('scripts/page-chunk.js', 'utf8');

// Find all endpoints like /api/... or https://...
const endpoints = pText.match(/\/api\/[^"'\s`)]+/g) || [];
console.log('Endpoints in page-chunk:', [...new Set(endpoints)]);

// Find all fetch or axios calls
const fetchMatches = pText.match(/fetch\([^)]+\)|axios\.[a-z]+\([^)]+\)/g) || [];
console.log('Fetch calls:', fetchMatches);

// Search for template array or queries
const matches = pText.match(/[a-zA-Z0-9_]+\.get\([^)]+\)/g) || [];
console.log('Get calls:', matches);
