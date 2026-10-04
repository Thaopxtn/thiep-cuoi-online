import fs from 'fs';

const base = 'C:/Users/thaoh/.gemini/antigravity/brain/8aa7fe5b-4ebf-436d-a0b5-e793f5ff0e38';
const copies = [
  ['.system_generated/steps/1411/media_0.png', 'templates_catalog_vansam.png'],
  ['.system_generated/steps/1417/media_0.png', 'vansam_opening_envelope.png'],
  ['.system_generated/steps/1425/media_0.png', 'vansam_revealed_template.png'],
  ['.system_generated/steps/1433/media_0.png', 'vansam_studio_modular.png']
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
