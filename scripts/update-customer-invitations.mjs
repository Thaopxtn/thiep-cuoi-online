import fs from 'fs';
import path from 'path';

const REGISTRY_FILE = path.join(process.cwd(), 'src', 'data', 'customerCards.json');
const CACHE_DIR = path.join(process.cwd(), 'src', 'data', 'templates', 'cloned-cache');
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'data', 'customerInvitations.ts');

function cleanText(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCoupleFromTitle(title) {
  if (!title) return { groom: '', bride: '' };
  let clean = title
    .replace(/^(thiệp cưới của|thiệp cưới|đám cưới của|đám cưới|lễ thành hôn của|lễ vu quy của|wedding-invitation-|wedding invitation -|wedding invitation|save the date)\s*[-:]?\s*/i, '')
    .trim();

  // If starts with "wedding-invitation-" or similar slug style: "vudinhkhiem - nguyenkhanhlinh"
  const parts = clean.split(/\s*(?:và|&|\+|\s-\s)\s*/i);
  if (parts.length >= 2) {
    let g = parts[0].trim().replace(/^cô dâu\s+/i, '').replace(/^chú rể\s+/i, '');
    let b = parts[1].trim().replace(/^cô dâu\s+/i, '').replace(/^chú rể\s+/i, '');
    // capitalize nicely if all lowercase
    const formatName = (str) => {
      if (!str) return '';
      if (str === str.toLowerCase()) {
        return str.replace(/\b\w/g, (c) => c.toUpperCase());
      }
      return str;
    };
    return { groom: formatName(g), bride: formatName(b) };
  }
  return { groom: clean, bride: '' };
}

function processAllCards() {
  if (!fs.existsSync(REGISTRY_FILE)) {
    console.error('Customer cards registry not found!');
    return;
  }

  const raw = fs.readFileSync(REGISTRY_FILE, 'utf8');
  const cards = JSON.parse(raw);
  console.log(`Processing ${cards.length} customer cards...`);

  const list = [];

  for (const c of cards) {
    const slug = c.slugShow || c.id;
    let title = c.name || `Thiệp Cưới ${slug}`;
    let image = c.thumbnail || '';
    let views = c.viewCount || Math.floor(Math.random() * 50) + 12;
    let date = '2026';
    let venue = '';
    let { groom: groomName, bride: brideName } = extractCoupleFromTitle(title);
    let musicTitle = c.musicTitle || '';
    let nodesCount = c.nodesCount || 0;

    // Check details in cached JSON
    const cacheFile = path.join(CACHE_DIR, `${slug}.json`);
    if (fs.existsSync(cacheFile)) {
      try {
        const cardData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        const parsedNodes = cardData.parsedNodes || {};
        nodesCount = Object.keys(parsedNodes).length;

        if (!musicTitle && cardData.audioSettings?.musicTitle) {
          musicTitle = cardData.audioSettings.musicTitle;
        }

        // Gather all text strings from TextBox nodes
        const allTexts = [];
        for (const node of Object.values(parsedNodes)) {
          if (node.type?.resolvedName === 'TextBox') {
            const raw = node.props?.text?.rawText || node.props?.text || '';
            const t = cleanText(raw);
            if (t) allTexts.push(t);
          } else if (node.type?.resolvedName === 'PhotoBox' && !image) {
            // Fallback image from first photo node
            const pKey = node.props?.previewKey || node.props?.src;
            if (pKey && pKey.startsWith('http')) {
              image = pKey;
            } else if (pKey) {
              image = `https://cdn-resource.zenlove.me/${pKey}`;
            }
          }
        }

        // 1. Find Wedding Date
        for (const t of allTexts) {
          const match = t.match(/\b(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4})\b/);
          if (match) {
            date = match[1];
            break;
          }
        }

        // 2. Find Venue
        for (const t of allTexts) {
          if (
            /Trung tâm|Nhà hàng|Khách sạn|Tư gia|Trống Đồng|White Palace|Riverside|Melia|Daewoo|Palace|Plaza|Hotel|Resort|Đ\/c:|Địa chỉ:/i.test(
              t
            ) &&
            t.length < 90 &&
            t.length > 8
          ) {
            venue = t;
            break;
          }
        }

        // 3. Extract Couple Names if title was generic
        if (!brideName || title.toLowerCase() === 'thiệp cưới' || title.toLowerCase() === 'bản nháp') {
          for (let i = 0; i < allTexts.length; i++) {
            const t = allTexts[i];
            if (t.includes(' & ') || t.includes(' và ')) {
              const pair = extractCoupleFromTitle(t);
              if (pair.groom && pair.bride && pair.groom.length < 30 && pair.bride.length < 30) {
                groomName = pair.groom;
                brideName = pair.bride;
                if (title.toLowerCase() === 'thiệp cưới' || title.toLowerCase() === 'bản nháp') {
                  title = `Thiệp cưới ${pair.groom} & ${pair.bride}`;
                }
                break;
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Error reading cache for ${slug}:`, err.message);
      }
    }

    // Default fallback image if none
    if (!image) {
      image = 'https://cdn-resource.zenlove.me/uploads/bba1a801-b981-4a47-9f2d-9ae5dfa69fa5/Q01EMDg2NTc0XzE3ODkwOTY4MDcyNjVfYTl5cTV4eG56bA.jpg';
    }

    list.push({
      slug,
      href: `/show/${slug}`,
      title,
      image,
      date,
      views,
      groomName: groomName || undefined,
      brideName: brideName || undefined,
      venue: venue || undefined,
      musicTitle: musicTitle || undefined,
      nodesCount,
    });
  }

  // Generate TypeScript file
  const tsContent = `export interface CustomerInvitation {
  slug: string;
  href: string;
  title: string;
  image: string;
  date: string;
  views?: number;
  brideName?: string;
  groomName?: string;
  venue?: string;
  musicTitle?: string;
  nodesCount?: number;
}

export const CUSTOMER_INVITATIONS: CustomerInvitation[] = ${JSON.stringify(list, null, 2)};
`;

  fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf8');
  console.log(`[SUCCESS] Wrote ${list.length} customer invitations to ${OUTPUT_FILE}`);
}

processAllCards();
