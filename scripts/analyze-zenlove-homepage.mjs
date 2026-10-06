import fs from 'fs';

const content = fs.readFileSync('C:/Users/thaoh/.gemini/antigravity/brain/2e336893-5be6-49f8-8ec2-dc00a7b278d8/.system_generated/steps/44/content.md', 'utf8');

// List all header tags in order
const headings = Array.from(content.matchAll(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/g)).map(m => ({ tag: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }));
console.log('Zenlove Headings:');
console.log(headings);

// List all nav links / header links
const navMatch = content.match(/<nav[^>]*>([\s\S]*?)<\/nav>/) || content.match(/<header[^>]*>([\s\S]*?)<\/header>/);
if (navMatch) {
  const navLinks = Array.from(navMatch[0].matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)).map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }));
  console.log('Zenlove Nav Links:', navLinks);
}

// List all sections
const sectionIds = Array.from(content.matchAll(/<section[^>]*id="([^"]+)"/g)).map(m => m[1]);
console.log('Zenlove Section IDs:', sectionIds);

// List footer links
const footerMatch = content.match(/<footer[^>]*>([\s\S]*?)<\/footer>/);
if (footerMatch) {
  const fLinks = Array.from(footerMatch[0].matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)).map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }));
  console.log('Zenlove Footer Links:', fLinks);
}
