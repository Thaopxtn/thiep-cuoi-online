import fs from 'fs';
import path from 'path';
import https from 'https';

const assets = [
  { url: 'https://zenlove.me/assets/logo/logo-6.svg', dest: 'public/assets/logo/logo-6.svg' },
  { url: 'https://zenlove.me/assets/logo/text-logo-dark.svg', dest: 'public/assets/logo/text-logo-dark.svg' },
  { url: 'https://zenlove.me/assets/logo/logo-5.svg', dest: 'public/assets/logo/logo-5.svg' },
  { url: 'https://cdn-resource.zenlove.me/assets/landing/hero-pc.webp', dest: 'public/assets/landing/hero-pc.webp' },
  { url: 'https://cdn-resource.zenlove.me/assets/landing/it1.png', dest: 'public/assets/landing/it1.png' },
  { url: 'https://cdn-resource.zenlove.me/assets/landing/it2.png', dest: 'public/assets/landing/it2.png' },
  { url: 'https://cdn-resource.zenlove.me/assets/landing/it3.png', dest: 'public/assets/landing/it3.png' },
  { url: 'https://zenlove.me/assets/landing/thumbnai-10min-home.webp', dest: 'public/assets/landing/thumbnai-10min-home.webp' },
  { url: 'https://zenlove.me/assets/landing/DaThongBao_BCT.png', dest: 'public/assets/landing/DaThongBao_BCT.png' },
  { url: 'https://zenlove.me/favicon.ico', dest: 'public/favicon.ico' },
  
  // Templates
  { url: 'https://cdn.zenlove.me/templates/97041aaf-a789-4dea-a1a7-eefea0af5879/long_97041aaf-a789-4dea-a1a7-eefea0af5879.webp', dest: 'public/assets/templates/t1.webp' },
  { url: 'https://cdn.zenlove.me/templates/448f3260-a1a5-45f2-8ade-86a2065a1888/long_448f3260-a1a5-45f2-8ade-86a2065a1888.jpg', dest: 'public/assets/templates/t2.jpg' },
  { url: 'https://cdn.zenlove.me/templates/23da9a74-eb25-47f0-b726-b50fe6f1b235/long_23da9a74-eb25-47f0-b726-b50fe6f1b235.webp', dest: 'public/assets/templates/t3.webp' },
  { url: 'https://cdn.zenlove.me/templates/c3a4b54b-dbe8-4386-87ec-e30dd918e8fe/long_c3a4b54b-dbe8-4386-87ec-e30dd918e8fe.webp', dest: 'public/assets/templates/t4.webp' },
  { url: 'https://cdn.zenlove.me/templates/1c312850-dfbb-463a-98a7-729d5b8d7df6/long_1c312850-dfbb-463a-98a7-729d5b8d7df6.webp', dest: 'public/assets/templates/t5.webp' },
  { url: 'https://cdn.zenlove.me/templates/dcd31536-4ba3-4232-98f2-af4c2ad5c0af/long_dcd31536-4ba3-4232-98f2-af4c2ad5c0af.jpg', dest: 'public/assets/templates/t6.jpg' },
  { url: 'https://cdn.zenlove.me/templates/eacdb4ad-cbaf-455e-96ba-ddd1d82d9d57/long_eacdb4ad-cbaf-455e-96ba-ddd1d82d9d57.webp', dest: 'public/assets/templates/t7.webp' },
  { url: 'https://cdn.zenlove.me/templates/865f1d52-ad63-442d-9931-4e08ba171579/long_865f1d52-ad63-442d-9931-4e08ba171579.webp', dest: 'public/assets/templates/t8.webp' },

  // Customer invitations (Feedback)
  { url: 'https://cdn-resource.zenlove.me/uploads/92e70f66-a8df-4d9a-9dad-2d96aa29593a/SU1HMjkwMV8xNzg3NzI2Nzg1NTg4X2N1OHE5Zmg2OTlm.jpg', dest: 'public/assets/feedback/fb1.jpg' },
  { url: 'https://cdn-resource.zenlove.me/uploads/2001a1b5-0313-4958-b85a-0fda88498bae/SU1HMDc2MF8xNzg3NjE2NDE1ODcyX21iZnhwc3AxOGo.jpg', dest: 'public/assets/feedback/fb2.jpg' },
  { url: 'https://cdn-resource.zenlove.me/uploads/3dba9bd1-42f3-46e7-9691-c8385d12953e/MTc4NzkxNjY4NTAzMzQyNzAwNTY3MDI4NzM5NjQ0MDk0MjcwMDU2NzAyODczOTY0NDA5MTAxMTFkOWI5YjI2MTUyZjFmZWM3MjIzZWM2ZDcyNTZfMTc4NzkxOTc1ODQxNF9peXJvYmJvdHc5Yw.jpg', dest: 'public/assets/feedback/fb3.jpg' },
  { url: 'https://cdn-resource.zenlove.me/uploads/8d645bb8-08a1-4b1c-acc3-8765caf9553b/SU1HNjYxNV8xNzg4MDAzMjU0MjEwX2tuZHhxbTJzd2E.jpg', dest: 'public/assets/feedback/fb4.jpg' },
  { url: 'https://cdn-resource.zenlove.me/uploads/dd18b7cf-9315-44d1-9880-8d6a8a14cefc/QkFhXzE3ODgxNTk5NTcwMjBfejc0OTVkM2VvZmU.jpg', dest: 'public/assets/feedback/fb5.jpg' },
  { url: 'https://cdn-resource.zenlove.me/uploads/e28d3f4f-0a71-4d7e-9bc8-9378043a7972/MTAwMDAwNTY0NF8xNzg2MTk4MDMwMjkyXzVjMmZsNWZxanQ4.jpg', dest: 'public/assets/feedback/fb6.jpg' },
  { url: 'https://cdn-resource.zenlove.me/uploads/12d2aeee-bb13-409d-ad7c-658886c3e40f/SExFMDg0ODdfMTc4NjU5Mjc2NjEwM196cTFsdHdhaDRoYQ.jpg', dest: 'public/assets/feedback/fb7.jpg' },
  { url: 'https://cdn-resource.zenlove.me/uploads/d0a58733-636b-4580-bd7b-7ed9a06ff47d/SU1HNTMyMF8xNzg1MDM3NTMwMDkwX2R5NWU3amhyNXRn.jpg', dest: 'public/assets/feedback/fb8.jpg' },
  { url: 'https://cdn-resource.zenlove.me/uploads/a301154a-589c-4c2e-9e0f-cc42376f012c/SEVOTDk1NTBfMTc4NjcxMjQ2Nzk4N19zYjVwb3FzNjRs.jpg', dest: 'public/assets/feedback/fb9.jpg' }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const fullDest = path.resolve(dest);
    fs.mkdirSync(path.dirname(fullDest), { recursive: true });
    const file = fs.createWriteStream(fullDest);
    
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`Downloaded: ${dest}`);
          resolve();
        });
      });
    }).on('error', (err) => {
      fs.unlink(fullDest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log(`Starting download of ${assets.length} assets...`);
  for (const item of assets) {
    try {
      await download(item.url, item.dest);
    } catch (e) {
      console.error(`Error downloading ${item.url}:`, e.message);
    }
  }
  console.log('Finished downloading assets!');
}

run();
