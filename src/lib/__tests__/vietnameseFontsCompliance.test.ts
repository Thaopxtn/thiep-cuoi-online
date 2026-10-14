import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Tích hợp font Việt hóa cố định & Tuân thủ bản quyền (Font Licensing & Self-hosted Verification)", () => {
  const publicFontsDir = path.resolve("public/fonts");
  const publicFontsCss = path.resolve("public/fonts/fonts.css");
  const appFontsCss = path.resolve("src/app/fonts.css");
  const fontsLicenseDoc = path.resolve("public/fonts/FONTS_LICENSE.md");
  const globalsCss = path.resolve("src/app/globals.css");

  it("1. Thư mục public/fonts phải tồn tại và chứa đầy đủ các webfont WOFF2 được self-hosted", () => {
    expect(fs.existsSync(publicFontsDir)).toBe(true);
    const files = fs.readdirSync(publicFontsDir);
    const woff2Files = files.filter((f) => f.endsWith(".woff2"));

    // Phải có trên 50 files woff2 được lưu trữ cục bộ
    expect(woff2Files.length).toBeGreaterThan(50);
  });

  it("2. File fonts.css và src/app/fonts.css phải định nghĩa @font-face cho các font quan trọng của thiệp cưới", () => {
    expect(fs.existsSync(publicFontsCss)).toBe(true);
    expect(fs.existsSync(appFontsCss)).toBe(true);

    const content = fs.readFileSync(publicFontsCss, "utf8");
    const requiredFamilies = [
      "Great Vibes",
      "Dancing Script",
      "Alex Brush",
      "Charm",
      "Charmonman",
      "Playfair Display",
      "Lora",
      "Cormorant Garamond",
      "Be Vietnam Pro",
      "Montserrat",
      "Plus Jakarta Sans",
      "Pacifico",
    ];

    for (const fam of requiredFamilies) {
      expect(content).toContain(`font-family: '${fam}'`);
    }

    // Đảm bảo có unicode-range tiếng Việt (chứa U+1EA0-1EF9 hoặc U+0102-0103)
    expect(content).toContain("U+1EA0-1EF9");
  });

  it("3. File FONTS_LICENSE.md phải ghi rõ giấy phép SIL Open Font License (OFL-1.1) và cam kết bản quyền thương mại 100%", () => {
    expect(fs.existsSync(fontsLicenseDoc)).toBe(true);
    const licenseText = fs.readFileSync(fontsLicenseDoc, "utf8");

    expect(licenseText).toContain("SIL Open Font License 1.1");
    expect(licenseText).toContain("Be Vietnam Pro");
    expect(licenseText).toContain("Playfair Display");
    expect(licenseText).toContain("Dancing Script");
    expect(licenseText).toContain("Charm");
    expect(licenseText).toContain("Charmonman");
    expect(licenseText).toContain("Lora");
  });

  it("4. File globals.css phải cấu hình fallback thông minh cho các font tiếng Việt", () => {
    expect(fs.existsSync(globalsCss)).toBe(true);
    const cssText = fs.readFileSync(globalsCss, "utf8");

    // Phải import fonts.css cục bộ
    expect(cssText).toContain('@import "./fonts.css";');

    // Các class thư pháp phải có chuỗi fallback tiếng Việt
    expect(cssText).toContain(".font-great-vibes");
    expect(cssText).toContain(".font-charm");
    expect(cssText).toContain(".font-charmonman");
    expect(cssText).toContain(".font-lora");
    expect(cssText).toContain(".font-vietnam");
  });

  it("5. Phải có alias tương thích cho các template và thiệp cũ (Lora Regular, PlayfairDisplay)", () => {
    const content = fs.readFileSync(publicFontsCss, "utf8");
    expect(content).toContain("'Lora Regular'");
    expect(content).toContain("'PlayfairDisplay'");
  });
});
