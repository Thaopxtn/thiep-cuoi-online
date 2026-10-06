import fs from 'fs';
import path from 'path';
// @ts-ignore
import LZUTF8 from 'lzutf8';

const CACHE_DIR = path.join(process.cwd(), 'src', 'data', 'templates', 'cloned-cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const REGISTRY_FILE = path.join(process.cwd(), 'src', 'data', 'customerCards.json');

/**
 * Fetch a customer invitation HTML and extract its Craft.js nodes, audio, and toolbar settings
 */
export async function cloneCustomerCard(slugShow, meta = {}) {
  const file1 = path.join(CACHE_DIR, `${slugShow}.json`);
  if (fs.existsSync(file1)) {
    try {
      const cached = JSON.parse(fs.readFileSync(file1, 'utf8'));
      if (cached && cached.parsedNodes && Object.keys(cached.parsedNodes).length > 0) {
        console.log(`[CACHED] "${cached.name}" (${slugShow})`);
        return cached;
      }
    } catch (e) {}
  }

  const url = `https://zenlove.me/show/${slugShow}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok) {
      console.warn(`[SKIP] ${slugShow} HTTP ${res.status}`);
      return null;
    }

    const html = await res.text();

    // 1. Decompress pageData from large Base64 blocks
    const b64Blocks = html.match(/([A-Za-z0-9+/=]{1000,})/g) || [];
    let parsedNodes = null;

    for (const block of b64Blocks) {
      try {
        const dec = LZUTF8.decompress(block, { inputEncoding: 'Base64' });
        if (dec.includes('"ROOT"') || dec.includes('basicInfo') || dec.includes('TextBox')) {
          parsedNodes = JSON.parse(dec);
          break;
        }
      } catch (e) {
        // Continue searching other blocks
      }
    }

    if (!parsedNodes) {
      console.warn(`[WARN] Could not decompress nodes for ${slugShow}`);
      return null;
    }

    // 2. Extract metadata: audioSettings, toolbarSettings, name, thumbnailKey
    let audioSettings = null;
    let toolbarSettings = null;
    let cardName = meta.name || '';
    let thumbnail = meta.thumbnailKey ? `https://cdn-resource.zenlove.me/${meta.thumbnailKey}` : '';

    const audioMatch = html.match(/"audioSettings":(\{.+?\})/);
    if (audioMatch) {
      try {
        audioSettings = JSON.parse(audioMatch[1]);
        if (audioSettings.musicId && !audioSettings.fileUrl) {
          audioSettings.fileUrl = `https://cdn-resource.zenlove.me/${audioSettings.musicId}`;
        }
      } catch (e) {}
    }

    const toolbarMatch = html.match(/"toolbarSettings":(\{.+?\}),"viewContext"/);
    if (toolbarMatch) {
      try {
        toolbarSettings = JSON.parse(toolbarMatch[1]);
      } catch (e) {}
    }

    const nameMatch = html.match(/"page":\{"name":"([^"]+)"/);
    if (nameMatch) {
      cardName = nameMatch[1].replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
    }

    const cardPackage = {
      id: meta.id || slugShow,
      name: cardName || meta.name || 'Thiệp Cưới Khách Hàng',
      slug: slugShow,
      slugShow,
      source: 'zenlove_customer_product',
      clonedAt: new Date().toISOString(),
      thumbnail,
      viewCount: meta.viewCount || 0,
      likeCount: meta.likeCount || 0,
      audioSettings,
      toolbarSettings,
      parsedNodes,
    };

    // Save to cache under both slugShow and customer-[slugShow]
    const file1 = path.join(CACHE_DIR, `${slugShow}.json`);
    const file2 = path.join(CACHE_DIR, `customer-${slugShow}.json`);
    fs.writeFileSync(file1, JSON.stringify(cardPackage, null, 2), 'utf8');
    fs.writeFileSync(file2, JSON.stringify(cardPackage, null, 2), 'utf8');

    console.log(`[OK] Cloned: "${cardPackage.name}" (${slugShow}) - ${Object.keys(parsedNodes).length} nodes`);
    return cardPackage;
  } catch (err) {
    console.error(`[ERR] Failed cloning ${slugShow}:`, err.message);
    return null;
  }
}

/**
 * Main batch cloning function
 */
async function main() {
  const pagesToFetch = Number(process.argv[2]) || 1; // Default 1 page = 24 items
  console.log(`=== START CLONING ZENLOVE CUSTOMER PRODUCTS (Pages 1 to ${pagesToFetch}) ===`);

  let allCustomerMeta = [];

  for (let p = 1; p <= pagesToFetch; p++) {
    console.log(`\nFetching list page ${p}...`);
    try {
      const res = await fetch(`https://api.zenlove.me/v1/public/pages?page=${p}&limit=24`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        console.error(`Error fetching page ${p}: ${res.status}`);
        break;
      }
      const json = await res.json();
      if (json.success && json.data?.items) {
        allCustomerMeta.push(...json.data.items);
        console.log(`Found ${json.data.items.length} items (Total in ZenLove: ${json.data.meta?.total})`);
      }
    } catch (err) {
      console.error(`Failed to fetch page ${p}:`, err.message);
      break;
    }
  }

  console.log(`\nStarting deep cloning for ${allCustomerMeta.length} customer cards...`);

  const clonedList = [];
  let successCount = 0;

  for (let i = 0; i < allCustomerMeta.length; i++) {
    const item = allCustomerMeta[i];
    console.log(`\n[${i + 1}/${allCustomerMeta.length}] Cloning: ${item.name} (${item.slugShow})...`);
    const cloned = await cloneCustomerCard(item.slugShow, item);
    if (cloned) {
      successCount++;
      clonedList.push({
        id: cloned.id,
        name: cloned.name,
        slugShow: cloned.slugShow,
        thumbnail: cloned.thumbnail,
        viewCount: cloned.viewCount,
        likeCount: cloned.likeCount,
        nodesCount: Object.keys(cloned.parsedNodes).length,
        musicTitle: cloned.audioSettings?.musicTitle || '',
        musicUrl: cloned.audioSettings?.fileUrl || '',
      });
    }
    // Small delay to be polite to the server
    await new Promise((r) => setTimeout(r, 150));
  }

  // Save/merge registry file
  let existingRegistry = [];
  if (fs.existsSync(REGISTRY_FILE)) {
    try {
      existingRegistry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
    } catch (e) {}
  }

  const mergedMap = new Map();
  for (const c of existingRegistry) mergedMap.set(c.slugShow, c);
  for (const c of clonedList) mergedMap.set(c.slugShow, c);

  const finalRegistry = Array.from(mergedMap.values());
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(finalRegistry, null, 2), 'utf8');

  console.log(`\n=============================================`);
  console.log(`[FINISHED] Successfully cloned ${successCount}/${allCustomerMeta.length} customer products!`);
  console.log(`Saved registry to ${REGISTRY_FILE} (${finalRegistry.length} total entries)`);
  console.log(`Cache directory: ${CACHE_DIR}`);
  console.log(`=============================================\n`);
}

main().catch(console.error);
