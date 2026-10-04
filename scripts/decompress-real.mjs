import fs from 'fs';
import LZUTF8 from 'lzutf8';

const html110 = fs.readFileSync('scripts/iframe_thiep-cuoi-110-pre.html', 'utf8');

// Find the base64 string
const match = html110.match(/eyJ[a-zA-Z0-9+/=_-]+/);
if (match) {
  const b64 = match[0];
  console.log('Found b64, length:', b64.length);
  try {
    const decompressed = LZUTF8.decompress(b64, { inputEncoding: "Base64" });
    console.log('Decompressed successfully! Length:', decompressed.length);
    fs.writeFileSync('scripts/thiep-cuoi-110-pagedata.json', decompressed);
    
    const parsed = JSON.parse(decompressed);
    console.log('Keys in parsed template:', Object.keys(parsed));
    if (parsed.ROOT) {
      console.log('ROOT props:', parsed.ROOT.props);
    }
  } catch(e) {
    console.error('Decompression error:', e.message);
  }
}
