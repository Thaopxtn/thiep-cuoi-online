/**
 * QA Automation Test Runner - Thiệp Cưới ZenLove
 * Chạy toàn bộ kiểm thử hệ thống: Unit tests, API security, SSRF, Auth Guard, Performance & End-to-End checks
 * Lệnh chạy: npm run test:all hoặc node scripts/test-all-qa.mjs
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3005";
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "zenlove_admin_secure_2026";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "zenlove_qa_master_key_2026";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
};

async function testEndpoint(name, url, options = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, options);
    const duration = Date.now() - start;
    let data = null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    const passed = res.ok;
    return {
      name,
      url,
      passed,
      status: res.status,
      duration,
      data,
      error: passed ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      name,
      url,
      passed: false,
      status: 0,
      duration: Date.now() - start,
      data: null,
      error: err.message,
    };
  }
}

async function runQASuite() {
  const startTime = Date.now();
  console.log(`\n${colors.bold}${colors.magenta}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}   💎 ZENLOVE WEDDING - QA AUTOMATED TESTER SUITE (ALL-IN-ONE)   ${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}================================================================${colors.reset}\n`);

  const reportData = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    unitTests: { passed: 0, total: 0, duration: 0, output: "" },
    apiChecks: [],
    perfBenchmarks: [],
    passed: true,
  };

  // -------------------------------------------------------------
  // BƯỚC 1: UNIT TESTS (VITEST)
  // -------------------------------------------------------------
  console.log(`${colors.bold}${colors.cyan}[GIAI ĐOẠN 1] Chạy Unit Tests Logic Hệ Thống (Vitest)...${colors.reset}`);
  try {
    const vitestStart = Date.now();
    const vitestOutput = execSync("npx vitest run --no-file-parallelism", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    reportData.unitTests.duration = Date.now() - vitestStart;
    reportData.unitTests.output = vitestOutput;

    // Phân tích kết quả thực tế (không hardcode)
    const cleanOutput = vitestOutput.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
    const matchFiles = cleanOutput.match(/Test Files\s+(\d+)\s+passed/i);
    const matchTests = cleanOutput.match(/Tests\s+(\d+)\s+passed/i);
    const filesPassed = matchFiles ? matchFiles[1] : "0";
    const testsPassed = matchTests ? matchTests[1] : "0";

    reportData.unitTests.passed = parseInt(testsPassed, 10) || 0;
    reportData.unitTests.total = parseInt(testsPassed, 10) || 0;

    console.log(
      `  ${colors.green}✓ Unit Tests hoàn thành:${colors.reset} ${filesPassed} test files (${testsPassed} tests passed) trong ${reportData.unitTests.duration}ms\n`
    );
  } catch (err) {
    console.log(`  ${colors.red}✗ Unit Tests phát hiện lỗi:${colors.reset} ${err.message}\n`);
    reportData.unitTests.output = err.stdout || err.message;
    reportData.passed = false;
  }

  // -------------------------------------------------------------
  // BƯỚC 2: API CONTRACT, AUTH GUARD & SECURITY CHECKS
  // -------------------------------------------------------------
  console.log(`${colors.bold}${colors.cyan}[GIAI ĐOẠN 2] Kiểm Thử API Contracts, Auth Guard & An Ninh Mạng...${colors.reset}`);

  // Đăng nhập Admin hợp lệ để lấy token dùng cho các test kiểm thử quyền
  let adminToken = "";
  try {
    const authVerifyRes = await fetch(`${BASE_URL}/api/admin/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: ADMIN_PASSCODE }),
    });
    if (authVerifyRes.ok) {
      const authData = await authVerifyRes.json();
      adminToken = authData.token || "";
    }
  } catch {}

  const checks = [
    {
      name: "Trang chủ Homepage (HTML Response)",
      url: `${BASE_URL}/`,
      options: { method: "GET" },
      validate: (r) => r.passed && typeof r.data === "string" && r.data.length > 500,
    },
    {
      name: "API Danh sách Thiệp Công Khai (/api/cards)",
      url: `${BASE_URL}/api/cards`,
      options: { method: "GET" },
      validate: (r) => r.passed && r.data && Array.isArray(r.data.cards || r.data),
    },
    {
      name: "API Chi tiết Thiệp (/api/show/net-hoang-hon-2877)",
      url: `${BASE_URL}/api/show/net-hoang-hon-2877`,
      options: { method: "GET" },
      validate: (r) => r.passed && r.data && r.data.success && r.data.card,
    },
    {
      name: "Trang Khách Mời Cá Nhân Hóa (?to=QATester)",
      url: `${BASE_URL}/show/net-hoang-hon-2877?to=QATester`,
      options: { method: "GET" },
      validate: (r) => r.passed && typeof r.data === "string" && r.data.includes("QATester"),
    },
    {
      name: "Trang Quản Lý Thiệp Dashboard (/dashboard)",
      url: `${BASE_URL}/dashboard`,
      options: { method: "GET" },
      validate: (r) => r.passed && typeof r.data === "string",
    },
    {
      name: "Bảo Vệ Auth Guard: Chặn Clone Mẫu khi chưa login (HTTP 401)",
      url: `${BASE_URL}/api/cards/clone`,
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: "son-duyen" }),
      },
      validate: (r) => r.status === 401,
    },
    {
      name: "Chống Bot Spam: Bẫy Honeypot RSVP",
      url: `${BASE_URL}/api/show/net-hoang-hon-2877/rsvp`,
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Spam Bot",
          phone: "0123456789",
          b_field_trap: "trap_value_detected",
        }),
      },
      validate: (r) => r.passed && r.data && r.data.success,
    },
    {
      name: "Kiểm Tra Validation Input: Từ chối SĐT RSVP không hợp lệ (HTTP 400)",
      url: `${BASE_URL}/api/show/net-hoang-hon-2877/rsvp`,
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          phone: "123", // Quá ngắn
          attending: true,
        }),
      },
      validate: (r) => r.status === 400,
    },
    {
      name: "Kho Template Giao Diện (/templates)",
      url: `${BASE_URL}/templates`,
      options: { method: "GET" },
      validate: (r) => r.passed && typeof r.data === "string" && r.data.length > 500,
    },
    {
      name: "Chi Tiết Mẫu Thiệp Độc Bản (/templates/son-duyen)",
      url: `${BASE_URL}/templates/son-duyen`,
      options: { method: "GET" },
      validate: (r) => r.passed && typeof r.data === "string" && r.data.includes("son-duyen"),
    },
    {
      name: "Chuyển Hướng Kho Template Cũ (/kho-template -> /templates)",
      url: `${BASE_URL}/kho-template`,
      options: { method: "GET" },
      validate: (r) => r.passed && typeof r.data === "string",
    },
    // ================= AN NINH BẢO MẬT ADMIN & IDOR =================
    {
      name: "Bảo Vệ Admin: Chặn Khách truy cập GET /api/admin/activities (HTTP 401)",
      url: `${BASE_URL}/api/admin/activities`,
      options: { method: "GET" },
      validate: (r) => r.status === 401,
    },
    {
      name: "Bảo Vệ Admin: Chặn Khách truy cập GET /api/admin/stats (HTTP 401)",
      url: `${BASE_URL}/api/admin/stats`,
      options: { method: "GET" },
      validate: (r) => r.status === 401,
    },
    {
      name: "Bảo Vệ Admin: Chặn Khách truy cập GET /api/admin/cards (HTTP 401)",
      url: `${BASE_URL}/api/admin/cards`,
      options: { method: "GET" },
      validate: (r) => r.status === 401,
    },
    {
      name: "Bảo Vệ Admin: Chặn Khách truy cập GET /api/admin/users (HTTP 401)",
      url: `${BASE_URL}/api/admin/users`,
      options: { method: "GET" },
      validate: (r) => r.status === 401,
    },
    {
      name: "Bảo Vệ Admin: Chặn Khách truy cập GET /api/admin/rsvps (HTTP 401)",
      url: `${BASE_URL}/api/admin/rsvps`,
      options: { method: "GET" },
      validate: (r) => r.status === 401,
    },
    {
      name: "Quyền Quản Trị Hợp Lệ: Truy cập GET /api/admin/stats với Bearer Token",
      url: `${BASE_URL}/api/admin/stats`,
      options: {
        method: "GET",
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : { "x-admin-key": ADMIN_API_KEY },
      },
      validate: (r) => r.status === 200 && r.data && r.data.success && r.data.stats,
    },
    {
      name: "Quyền Quản Trị Hợp Lệ: Truy cập GET /api/admin/activities với Bearer Token",
      url: `${BASE_URL}/api/admin/activities?limit=10`,
      options: {
        method: "GET",
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : { "x-admin-key": ADMIN_API_KEY },
      },
      validate: (r) => r.status === 200 && r.data && r.data.success && Array.isArray(r.data.activities),
    },
    {
      name: "Bảo Vệ SSRF: Chặn gọi IP nội bộ qua Image Proxy (/api/proxy-image?url=http://127.0.0.1)",
      url: `${BASE_URL}/api/proxy-image?url=http://127.0.0.1:3005`,
      options: { method: "GET" },
      validate: (r) => r.status === 403,
    },
    {
      name: "Bảo Vệ Quyền Riêng Tư Khách Mời: Không để lộ SĐT qua GET /api/show/[slug]/rsvp",
      url: `${BASE_URL}/api/show/net-hoang-hon-2877/rsvp`,
      options: { method: "GET" },
      validate: (r) => {
        if (!r.passed || !r.data || !Array.isArray(r.data.rsvps)) return false;
        // Kiểm tra toàn bộ khách trong danh sách công khai không chứa phone
        return r.data.rsvps.every((item) => item.phone === undefined);
      },
    },
    {
      name: "Chống Tạo Thiệp Ảo (Ghost Cards): Trả về 404 cho Slug không tồn tại",
      url: `${BASE_URL}/api/show/non-existent-wedding-slug-xyz123/rsvp`,
      options: { method: "GET" },
      validate: (r) => r.status === 404,
    },
  ];

  let passedApiCount = 0;
  for (let i = 0; i < checks.length; i++) {
    const item = checks[i];
    process.stdout.write(`  [${i + 1}/${checks.length}] ${item.name}... `);
    const res = await testEndpoint(item.name, item.url, item.options);
    const valid = item.validate ? item.validate(res) : res.passed;

    if (valid) {
      passedApiCount++;
      console.log(`${colors.green}✓ PASS${colors.reset} (${res.status} • ${res.duration}ms)`);
      reportData.apiChecks.push({ name: item.name, status: res.status, duration: res.duration, passed: true });
    } else {
      console.log(`${colors.red}✗ FAIL${colors.reset} (${res.status} • ${res.duration}ms)`);
      reportData.apiChecks.push({
        name: item.name,
        status: res.status,
        duration: res.duration,
        passed: false,
        error: res.error,
      });
      reportData.passed = false;
    }
  }

  // -------------------------------------------------------------
  // BƯỚC 3: BENCHMARK HIỆU NĂNG TẢI TRANG (PERFORMANCE AUDIT)
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}${colors.cyan}[GIAI ĐOẠN 3] Đánh Giá Hiệu Năng Tốc Độ Tải Trang...${colors.reset}`);

  const perfTargets = [
    { name: "Homepage SSR", url: `${BASE_URL}/` },
    { name: "Template Library", url: `${BASE_URL}/templates` },
    { name: "Public Wedding Card", url: `${BASE_URL}/show/net-hoang-hon-2877` },
    { name: "Admin Stats API", url: `${BASE_URL}/api/admin/stats`, headers: { Authorization: `Bearer ${adminToken}` } },
    { name: "Admin Activities API", url: `${BASE_URL}/api/admin/activities`, headers: { Authorization: `Bearer ${adminToken}` } },
  ];

  for (const t of perfTargets) {
    const start = Date.now();
    await fetch(t.url, { headers: t.headers || {} });
    const lat = Date.now() - start;
    const speedRating = lat < 500 ? `${colors.green}SIÊU NHANH (<500ms)${colors.reset}` : `${colors.yellow}BÌNH THƯỜNG (<2s)${colors.reset}`;
    console.log(`  ⚡ ${t.name.padEnd(25)} : ${colors.bold}${lat}ms${colors.reset} (${speedRating})`);
    reportData.perfBenchmarks.push({ name: t.name, latency: lat });
  }

  // -------------------------------------------------------------
  // BƯỚC 4: XUẤT BÁO CÁO HTML & JSON TỰ ĐỘNG
  // -------------------------------------------------------------
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const reportsDir = path.join(process.cwd(), "test-reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const passRate = checks.length > 0 ? Math.round((passedApiCount / checks.length) * 100) : 0;

  const htmlReport = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>ZenLove QA Test Report - ${new Date().toLocaleDateString("vi-VN")}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }
    .container { max-width: 1000px; margin: 0 auto; background: #1e293b; border-radius: 1.5rem; padding: 2.5rem; border: 1px solid #334155; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    h1 { color: #f43f5e; margin-top: 0; font-size: 1.8rem; }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: bold; font-size: 0.8rem; }
    .badge-success { background: #065f46; color: #34d399; }
    .badge-fail { background: #991b1b; color: #fca5a5; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 2rem 0; }
    .card { background: #0f172a; padding: 1.25rem; border-radius: 1rem; border: 1px solid #334155; text-align: center; }
    .card-title { font-size: 0.8rem; color: #94a3b8; }
    .card-val { font-size: 1.6rem; font-weight: 800; margin-top: 0.5rem; color: #38bdf8; }
    table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; font-size: 0.9rem; }
    th, td { text-align: left; padding: 0.75rem 1rem; border-bottom: 1px solid #334155; }
    th { background: #0f172a; color: #94a3b8; text-transform: uppercase; font-size: 0.75rem; }
    tr:hover { background: rgba(255,255,255,0.02); }
  </style>
</head>
<body>
  <div class="container">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h1>💎 ZenLove Wedding QA Test Report</h1>
      <span class="badge ${reportData.passed ? "badge-success" : "badge-fail"}">
        ${reportData.passed ? "TẤT CẢ KIỂM THỬ ĐẠT (PASS)" : "CÓ LỖI CẦN XỬ LÝ (FAIL)"}
      </span>
    </div>
    <p style="color: #94a3b8; font-size: 0.85rem;">Thời gian thực thi: ${new Date().toLocaleString("vi-VN")} • Tổng thời gian: ${totalDuration}s</p>

    <div class="grid">
      <div class="card">
        <div class="card-title">Unit Tests (Vitest)</div>
        <div class="card-val" style="color: #34d399;">${reportData.unitTests.passed} / ${reportData.unitTests.total}</div>
      </div>
      <div class="card">
        <div class="card-title">API Contracts & Security</div>
        <div class="card-val" style="color: #38bdf8;">${passedApiCount} / ${checks.length}</div>
      </div>
      <div class="card">
        <div class="card-title">Tỷ Lệ Thành Công</div>
        <div class="card-val" style="color: #f43f5e;">${passRate}%</div>
      </div>
      <div class="card">
        <div class="card-title">Môi Trường</div>
        <div class="card-val" style="font-size: 1rem; margin-top: 0.8rem; color: #cbd5e1;">Localhost 3005</div>
      </div>
    </div>

    <h3>📋 Chi tiết kiểm thử API & Bảo mật</h3>
    <table>
      <thead>
        <tr>
          <th>Tên Kịch Bản</th>
          <th>Trạng Thái</th>
          <th>HTTP Code</th>
          <th>Thời Gian</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.apiChecks
          .map(
            (c) => `<tr>
          <td>${c.name}</td>
          <td><span class="badge ${c.passed ? "badge-success" : "badge-fail"}">${c.passed ? "PASS" : "FAIL"}</span></td>
          <td>${c.status}</td>
          <td>${c.duration}ms</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(reportsDir, "qa-report.html"), htmlReport, "utf-8");
  fs.writeFileSync(path.join(reportsDir, "qa-report.json"), JSON.stringify(reportData, null, 2), "utf-8");

  console.log(`\n${colors.bold}${colors.green}================================================================${colors.reset}`);
  console.log(`  🎉 HOÀN TẤT QA TEST TOÀN BỘ HỆ THỐNG`);
  console.log(`  - Unit Tests: ${reportData.unitTests.passed}/${reportData.unitTests.total} passed`);
  console.log(`  - API Checks: ${passedApiCount}/${checks.length} passed`);
  console.log(`  - Báo cáo HTML: test-reports/qa-report.html`);
  console.log(`${colors.bold}${colors.green}================================================================${colors.reset}\n`);

  if (!reportData.passed) {
    process.exit(1);
  }
}

runQASuite();
