import fs from 'fs';

const base = 'C:/Users/thaoh/.gemini/antigravity/brain/8aa7fe5b-4ebf-436d-a0b5-e793f5ff0e38';
const copies = [
  ['.system_generated/steps/1141/media_0.png', 'opening_envelope_preview.png'],
  ['.system_generated/steps/1177/media_0.png', 'envelope_opened_template.png'],
  ['.system_generated/steps/1185/media_0.png', 'gift_modal_animation.png'],
  ['.system_generated/steps/1193/media_0.png', 'wishes_drawer_animation.png'],
  ['.system_generated/steps/1239/media_0.png', 'studio_live_animation.png']
];

copies.forEach(([src, dest]) => {
  const s = `${base}/${src}`;
  const d = `${base}/${dest}`;
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, d);
    console.log(`Copied ${src} -> ${dest}`);
  } else {
    console.log(`Src not found: ${s}`);
  }
});
