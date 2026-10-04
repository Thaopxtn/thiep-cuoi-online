import fs from 'fs';
import LZUTF8 from 'lzutf8';

const uuids = [
  '7fe56f35-2009-4249-97f8-d61f0afbbe23',
  '9efa3cd1-7346-4ec6-b1c2-0a8da3d1d09d',
  '1f6001bb-85b3-425b-aa17-a3075bab3907',
  'be56fc48-f365-4a34-88b7-f4b66ba0c675',
  '4bfac705-6030-43b4-bab1-d536aafe5bc1',
  'ff78aad9-f6e9-4f1c-9903-6901d2b554cc',
  '132dbbff-f337-4b43-8a37-f9a748eabbdf',
  'eacdb4ad-cbaf-455e-96ba-ddd1d82d9d57'
];

async function fetchAndDecompress() {
  for (const id of uuids) {
    const url = `https://zenlove.me/iframes/${id}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const html = await res.text();
        const match = html.match(/eyJ[a-zA-Z0-9+/=_-]+/);
        if (match) {
          const decompressed = LZUTF8.decompress(match[0], { inputEncoding: "Base64" });
          fs.writeFileSync(`scripts/template_${id}_pagedata.json`, decompressed);
          console.log(`Fetched & decompressed ${id} (${decompressed.length} bytes)`);
        }
      }
    } catch(e) {
      console.error('Error fetching', id, e.message);
    }
  }
}

fetchAndDecompress().catch(console.error);
