import fs from 'fs';

const candidateChunks = [
  '8122-bb7d7e188a412d31.js',
  '6883-87b8f28392ea7c27.js',
  '8110-a8db58050c03e2f4.js',
  '9736-0a3a0d15884c2cc5.js',
  '7693-4c8d7f22463f91e6.js',
  '6245-2ba8acbb1fb88cdf.js',
  '9109-58d9d9909be8bf7a.js',
  '9488-5d7543c5f0aafe3d.js',
  '5149-9c1b93d8ae2ef75c.js',
  '3434-f17a5dc7ad2cb199.js',
  '2867-3f92e8ac99dd1566.js',
  '3374-199a1143f181902e.js',
  '3477-769d5a97dcbb7cc2.js'
];

async function main() {
  for (const chunk of candidateChunks) {
    const url = `https://zenlove.me/_next/static/chunks/${chunk}`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      
      if (text.includes('template-item') || text.includes('Xem mẫu') || text.includes('Sử dụng mẫu')) {
        console.log(`\n================ FOUND IN ${chunk} (${text.length} chars) ================`);
        fs.writeFileSync(`scripts/${chunk}`, text);
        
        // Find snippets
        ['Xem mẫu', 'Sử dụng mẫu', 'template-item', 'iframe', 'keyframes', 'animate-'].forEach(term => {
          let pos = 0;
          while ((pos = text.indexOf(term, pos)) !== -1) {
            console.log(`[${term} @ ${pos}]:`, text.slice(Math.max(0, pos - 80), pos + 220));
            pos += term.length + 100;
          }
        });
      }
    } catch(e) {
      console.error('Error fetching', chunk, e.message);
    }
  }
}

main().catch(console.error);
