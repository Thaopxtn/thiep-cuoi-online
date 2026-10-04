import fs from 'fs';
import LZUTF8 from 'lzutf8';

function decompressIframe(filename, outName) {
  const html = fs.readFileSync(`scripts/${filename}`, 'utf8');
  const match = html.match(/eyJ[a-zA-Z0-9+/=_-]+/);
  if (match) {
    try {
      const decompressed = LZUTF8.decompress(match[0], { inputEncoding: "Base64" });
      fs.writeFileSync(`scripts/${outName}`, decompressed);
      console.log(`Decompressed ${filename} -> ${outName} (${decompressed.length} bytes)`);
      const parsed = JSON.parse(decompressed);
      console.log(`  Nodes count in ${outName}:`, Object.keys(parsed).length);
    } catch(e) {
      console.error(`Error decompressing ${filename}:`, e.message);
    }
  } else {
    console.log(`No base64 match in ${filename}`);
  }
}

decompressIframe('iframe_0e710ebe-05e2-4bf7-9e35-5d43d610a442.html', 'template_0e71_pagedata.json');
decompressIframe('iframe_thiep-tot-nghiep-01-pre.html', 'template_graduation_pagedata.json');
decompressIframe('iframe_thiep-cuoi-119-pre.html', 'template_119_pagedata.json');
