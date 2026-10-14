import https from 'https';
import fs from 'fs';
import path from 'path';

// Danh sách font cần tự host phục vụ thiệp cưới ZenLove
const FONTS_TO_FETCH = [
  // 1. Thư pháp & Viết tay (Script & Calligraphy)
  { name: 'Great Vibes', query: 'Great+Vibes&display=swap' },
  { name: 'Dancing Script', query: 'Dancing+Script:wght@400;600;700&display=swap' },
  { name: 'Alex Brush', query: 'Alex+Brush&display=swap' },
  { name: 'Allura', query: 'Allura&display=swap' },
  { name: 'Parisienne', query: 'Parisienne&display=swap' },
  { name: 'Ephesis', query: 'Ephesis&display=swap' },
  { name: 'Pinyon Script', query: 'Pinyon+Script&display=swap' },
  { name: 'Sacramento', query: 'Sacramento&display=swap' },
  { name: 'Charm', query: 'Charm:wght@400;700&display=swap' },
  { name: 'Charmonman', query: 'Charmonman:wght@400;700&display=swap' },
  { name: 'Pacifico', query: 'Pacifico&display=swap' },
  
  // 2. Hoàng gia & Cổ điển (Luxury Serif)
  { name: 'Playfair Display', query: 'Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap' },
  { name: 'Cormorant Garamond', query: 'Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap' },
  { name: 'Cinzel', query: 'Cinzel:wght@400;600;700;900&display=swap' },
  { name: 'Prata', query: 'Prata&display=swap' },
  { name: 'Lora', query: 'Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap' },

  // 3. Hiện đại & Quốc dân (Modern Sans-Serif)
  { name: 'Be Vietnam Pro', query: 'Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap' },
  { name: 'Montserrat', query: 'Montserrat:wght@300;400;500;600;700;800&display=swap' },
  { name: 'Plus Jakarta Sans', query: 'Plus+Jakarta+Sans:wght@400;500;600;700&display=swap' },
];

const FONTS_DIR = path.resolve('public/fonts');
if (!fs.existsSync(FONTS_DIR)) {
  fs.mkdirSync(FONTS_DIR, { recursive: true });
}

function fetchCss(query) {
  return new Promise((resolve, reject) => {
    const url = `https://fonts.googleapis.com/css2?family=${query}`;
    https.get(url, {
      headers: {
        // User-agent modern browser to get woff2
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath)) {
      return resolve(); // already downloaded
    }
    const file = fs.createWriteStream(destPath);
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log(`Bắt đầu tải các bộ font Việt hóa và web fonts cố định vào ${FONTS_DIR}...`);
  
  let combinedCss = `/* ==========================================================================\n`;
  combinedCss += `   ZENLOVE WEDDING INVITATION - SELF-HOSTED VIETNAMESE WEB FONTS\n`;
  combinedCss += `   Bản quyền: SIL Open Font License 1.1 (OFL-1.1) / Thương mại miễn phí 100%\n`;
  combinedCss += `   Tự host cố định trong /fonts/ để chạy offline & ổn định trên mọi thiết bị\n`;
  combinedCss += `   ========================================================================== */\n\n`;

  let totalDownloaded = 0;

  for (const font of FONTS_TO_FETCH) {
    console.log(`Đang xử lý font: ${font.name}...`);
    try {
      const css = await fetchCss(font.query);
      
      // Parse @font-face blocks
      const fontFaceRegex = /@font-face\s*\{([^}]+)\}/g;
      let match;
      let blockIndex = 0;

      while ((match = fontFaceRegex.exec(css)) !== null) {
        blockIndex++;
        let block = match[1];

        // Extract url(...)
        const urlMatch = block.match(/url\((https:\/\/[^)]+)\)\s*format\(['"]?woff2['"]?\)/);
        if (!urlMatch) continue;

        const remoteUrl = urlMatch[1];
        // Clean safe filename
        const safeFamily = font.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const hash = path.basename(remoteUrl).replace(/[^a-zA-Z0-9._-]/g, '');
        const filename = `${safeFamily}-${hash}`;
        const localPath = path.join(FONTS_DIR, filename);

        // Download font file
        await downloadFile(remoteUrl, localPath);
        totalDownloaded++;

        // Replace remote URL with local path /fonts/...
        let localBlock = block.replace(urlMatch[0], `url('/fonts/${filename}') format('woff2')`);
        
        combinedCss += `@font-face {\n${localBlock.trim()}\n}\n\n`;
      }
    } catch (err) {
      console.error(`Lỗi khi tải font ${font.name}:`, err.message);
    }
  }

  // Save generated local font css
  const outputCssPath = path.resolve('public/fonts/fonts.css');
  fs.writeFileSync(outputCssPath, combinedCss, 'utf8');
  console.log(`Hoàn thành! Đã tải ${totalDownloaded} file font woff2.`);
  console.log(`File CSS font cố định đã lưu tại: ${outputCssPath}`);
}

run();
