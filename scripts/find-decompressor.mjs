import fs from 'fs';

const files = fs.readdirSync('scripts').filter(f => f.endsWith('.js'));

for (const file of files) {
  const content = fs.readFileSync(`scripts/${file}`, 'utf8');
  if (content.includes('90976:') || content.includes('zm:')) {
    console.log(`Found in ${file}`);
    const idx = content.indexOf('90976:');
    if (idx !== -1) {
      console.log('Snippet of 90976:');
      console.log(content.slice(idx, idx + 1000));
    }
  }
}
