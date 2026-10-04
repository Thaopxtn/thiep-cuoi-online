import fs from 'fs';

const html = fs.readFileSync('scripts/iframe_thiep-cuoi-110-pre.html', 'utf8');

// Find the base64 string starting with eyJ
const match = html.match(/eyJ[a-zA-Z0-9+/=_-]+/);
if (match) {
  const b64 = match[0];
  console.log('Base64 string length:', b64.length);
  const jsonStr = Buffer.from(b64, 'base64').toString('utf8');
  fs.writeFileSync('scripts/decoded_110_template.json', jsonStr);
  console.log('Decoded JSON length:', jsonStr.length);
  console.log('Preview:', jsonStr.slice(0, 1500));
} else {
  console.log('No base64 match found');
}
