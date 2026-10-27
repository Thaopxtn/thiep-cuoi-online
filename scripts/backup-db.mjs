/**
 * Kịch bản tự động sao lưu dữ liệu toàn sàn ZenLove Wedding
 * Lệnh chạy: npm run backup hoặc node scripts/backup-db.mjs
 */

import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("src/data");
const BACKUP_ROOT = path.resolve("backups");

const FILES_TO_BACKUP = [
  "cards-local-db.json",
  "partner-applications.json",
  "customerCards.json",
];

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFolder = path.join(BACKUP_ROOT, `backup_${timestamp}`);

  if (!fs.existsSync(backupFolder)) {
    fs.mkdirSync(backupFolder, { recursive: true });
  }

  console.log(`\n📦 BẮT ĐẦU SAO LƯU DỮ LIỆU ZENLOVE WEDDING...`);
  console.log(`Thư mục đích: ${backupFolder}\n`);

  let totalCards = 0;
  let totalPartners = 0;
  let copiedFiles = 0;

  for (const fileName of FILES_TO_BACKUP) {
    const srcFile = path.join(DATA_DIR, fileName);
    const destFile = path.join(backupFolder, fileName);

    if (fs.existsSync(srcFile)) {
      const data = fs.readFileSync(srcFile, "utf8");
      fs.writeFileSync(destFile, data, "utf8");
      copiedFiles++;
      console.log(`  ✓ Đã sao lưu: ${fileName} (${(data.length / 1024).toFixed(1)} KB)`);

      try {
        const parsed = JSON.parse(data);
        if (fileName === "cards-local-db.json" && Array.isArray(parsed)) {
          totalCards = parsed.length;
        }
        if (fileName === "partner-applications.json" && Array.isArray(parsed)) {
          totalPartners = parsed.length;
        }
      } catch {}
    } else {
      console.log(`  - Bỏ qua (không tồn tại): ${fileName}`);
    }
  }

  // Tạo file metadata tóm tắt
  const metadata = {
    timestamp: new Date().toISOString(),
    totalCards,
    totalPartners,
    filesCount: copiedFiles,
    nodeEnv: process.env.NODE_ENV || "development",
  };

  fs.writeFileSync(
    path.join(backupFolder, "backup-metadata.json"),
    JSON.stringify(metadata, null, 2),
    "utf8"
  );

  // Giữ tối đa 10 bản sao lưu gần nhất, dọn dẹp các bản cũ hơn
  try {
    const allBackups = fs
      .readdirSync(BACKUP_ROOT)
      .filter((dir) => dir.startsWith("backup_"))
      .sort()
      .reverse();

    if (allBackups.length > 10) {
      const toDelete = allBackups.slice(10);
      for (const old of toDelete) {
        fs.rmSync(path.join(BACKUP_ROOT, old), { recursive: true, force: true });
      }
      console.log(`\n🧹 Đã dọn dẹp ${toDelete.length} bản sao lưu cũ.`);
    }
  } catch (err) {
    console.warn("Lỗi dọn dẹp bản sao lưu cũ:", err);
  }

  console.log(`\n🎉 SAO LƯU HOÀN TẤT THÀNH CÔNG!`);
  console.log(`- Tổng số thiệp cưới: ${totalCards}`);
  console.log(`- Tổng đối tác: ${totalPartners}`);
  console.log(`- Đường dẫn lưu: ${backupFolder}\n`);
}

runBackup();
