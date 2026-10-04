import fs from 'fs';

const testUrls = [
  'https://zenlove.me/iframes/thiep-cuoi-110-pre',
  'https://zenlove.me/iframes/c1328fd2-218a-49e6-8e07-aa5b824c758d',
  'https://zenlove.me/iframes/thiep-tot-nghiep-01-pre',
  'https://zenlove.me/iframes/718400d5-aa80-4c7f-93c5-a2e669eca56c',
  'https://zenlove.me/iframes/0e710ebe-05e2-4bf7-9e35-5d43d610a442',
  'https://zenlove.me/iframes/aca1df12-6b9d-4737-951a-caefc566993b',
  'https://zenlove.me/iframes/thiep-cuoi-119-pre'
];

async function main() {
  for (const url of testUrls) {
    try {
      const res = await fetch(url);
      console.log(url, res.status, res.headers.get('content-type'));
      if (res.ok) {
        const html = await res.text();
        const cleanName = url.split('/').pop();
        fs.writeFileSync(`scripts/iframe_${cleanName}.html`, html);
        console.log(`Saved iframe_${cleanName}.html (${html.length} chars)`);
        
        // Find stylesheets, CSS keyframes, animation classes
        const cssLinks = html.match(/href="([^"]+\.css)"/g) || [];
        console.log('  CSS links:', cssLinks);
        
        const scriptLinks = html.match(/src="([^"]+\.js)"/g) || [];
        console.log('  Script links count:', scriptLinks.length);
      }
    } catch(e) {
      console.log(url, 'Failed:', e.message);
    }
  }
}

main().catch(console.error);
