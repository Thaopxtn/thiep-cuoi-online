import fs from 'fs';

const html = fs.readFileSync('scripts/iframe_thiep-cuoi-110-pre.html', 'utf8');

const scripts = html.match(/src="(\/_next\/static\/chunks\/[^"]+)"/g) || [];
const chunkUrls = scripts.map(s => s.replace(/src="|"$/g, ''));
console.log('Total chunks loaded in iframe 110 Pre:', chunkUrls.length);

// Let's filter chunks specific to templates (e.g. app/iframes/...)
const iframeChunks = chunkUrls.filter(u => u.includes('iframe') || u.includes('template') || u.includes('design'));
console.log('Iframe specific chunks:', iframeChunks);

fs.writeFileSync('scripts/iframe_all_chunks.json', JSON.stringify(chunkUrls, null, 2));
