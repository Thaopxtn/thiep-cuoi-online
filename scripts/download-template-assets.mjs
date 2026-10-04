import fs from 'fs';
import path from 'path';
import https from 'https';

const ASSETS = [
  // Template covers / long previews
  {
    url: 'https://cdn-resource.zenlove.me/templates/718400d5-aa80-4c7f-93c5-a2e669eca56c/long_718400d5-aa80-4c7f-93c5-a2e669eca56c.webp?format=webp&quality=80',
    dest: 'public/assets/templates/long_718400d5.webp'
  },
  {
    url: 'https://cdn-resource.zenlove.me/templates/c1328fd2-218a-49e6-8e07-aa5b824c758d/long_c1328fd2-218a-49e6-8e07-aa5b824c758d.webp?format=webp&quality=80',
    dest: 'public/assets/templates/long_c1328fd2.webp'
  },
  {
    url: 'https://cdn-resource.zenlove.me/templates/0e710ebe-05e2-4bf7-9e35-5d43d610a442/long_0e710ebe-05e2-4bf7-9e35-5d43d610a442.png?format=webp&quality=80',
    dest: 'public/assets/templates/long_0e710ebe.webp'
  },
  {
    url: 'https://cdn-resource.zenlove.me/templates/44deae86-d256-438d-953b-08634f43f579/long_44deae86-d256-438d-953b-08634f43f579.webp?format=webp&quality=80',
    dest: 'public/assets/templates/long_44deae86.webp'
  },
  {
    url: 'https://cdn-resource.zenlove.me/templates/9efa3cd1-7346-4ec6-b1c2-0a8da3d1d09d/long_9efa3cd1-7346-4ec6-b1c2-0a8da3d1d09d.webp?format=webp&quality=80',
    dest: 'public/assets/templates/long_9efa3cd1.webp'
  },
  {
    url: 'https://cdn-resource.zenlove.me/templates/d69badd9-6cdf-41ae-b6cc-31f1abedd3fc/long_d69badd9-6cdf-41ae-b6cc-31f1abedd3fc.webp?format=webp&quality=80',
    dest: 'public/assets/templates/long_d69badd9.webp'
  },
  {
    url: 'https://cdn-resource.zenlove.me/templates/5e619aa0-494b-4090-b5fd-5ee7f86d2d70/long_5e619aa0-494b-4090-b5fd-5ee7f86d2d70.webp?format=webp&quality=80',
    dest: 'public/assets/templates/long_5e619aa0.webp'
  },
  {
    url: 'https://cdn-resource.zenlove.me/templates/107e4540-857a-4a74-96b4-e44cd1325c6c/long_107e4540-857a-4a74-96b4-e44cd1325c6c.webp?format=webp&quality=80',
    dest: 'public/assets/templates/long_107e4540.webp'
  },
  {
    url: 'https://cdn-resource.zenlove.me/templates/eacdb4ad-cbaf-455e-96ba-ddd1d82d9d57/long_eacdb4ad-cbaf-455e-96ba-ddd1d82d9d57.webp?format=webp&quality=80',
    dest: 'public/assets/templates/long_eacdb4ad.webp'
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const fullPath = path.resolve(dest);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(fullPath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        file.close();
        fs.unlink(fullPath, () => {});
        console.warn(`Failed to download ${url}: ${response.statusCode}`);
        resolve(); // Continue anyway
      }
    }).on('error', (err) => {
      fs.unlink(fullPath, () => {});
      console.warn(`Error downloading ${url}: ${err.message}`);
      resolve();
    });
  });
}

async function main() {
  console.log('Downloading template assets...');
  for (const asset of ASSETS) {
    console.log(`Downloading ${asset.url} -> ${asset.dest}`);
    await downloadFile(asset.url, asset.dest);
  }
  console.log('Done downloading template assets!');
}

main();
