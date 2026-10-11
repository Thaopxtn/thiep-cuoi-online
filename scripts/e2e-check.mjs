/**
 * Kịch bản kiểm thử End-to-End & Health Check tự động cho hệ thống Thiệp Cưới ZenLove
 * Chạy độc lập qua: npm run test:e2e
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3005";
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "zenlove_admin_secure_2026";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "zenlove_qa_master_key_2026";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
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

async function runAllChecks() {
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  🚀 BẮT ĐẦU KIỂM THỬ HỆ THỐNG TỰ ĐỘNG (E2E CHECK) ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  Target: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  // Đăng nhập Admin để lấy token hợp lệ
  let adminToken = "";
  try {
    const authRes = await fetch(`${BASE_URL}/api/admin/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: ADMIN_PASSCODE }),
    });
    if (authRes.ok) {
      const authData = await authRes.json();
      adminToken = authData.token || "";
    }
  } catch {}

  const checks = [
    // 1. Kiểm tra Trang chủ
    {
      name: "Trang chủ (Homepage)",
      url: `${BASE_URL}/`,
      options: { method: "GET" },
      validate: (r) => r.passed && typeof r.data === "string" && r.data.length > 500,
    },
    // 2. Kiểm tra API lấy danh sách thiệp công khai
    {
      name: "API Danh sách Thiệp (/api/cards)",
      url: `${BASE_URL}/api/cards`,
      options: { method: "GET" },
      validate: (r) => r.passed && r.data && Array.isArray(r.data.cards || r.data),
    },
    // 3. Kiểm tra API Chi tiết thiệp khách mời
    {
      name: "API Chi tiết Thiệp (/api/show/net-hoang-hon-2877)",
      url: `${BASE_URL}/api/show/net-hoang-hon-2877`,
      options: { method: "GET" },
      validate: (r) => r.passed && r.data && r.data.success && r.data.card,
    },
    // 4. Kiểm tra Trang xem thiệp khách mời với tham số cá nhân hóa ?to=
    {
      name: "Trang Khách Mời (?to=KiemThuTuDong)",
      url: `${BASE_URL}/show/net-hoang-hon-2877?to=KiemThuTuDong`,
      options: { method: "GET" },
      validate: (r) => r.passed && typeof r.data === "string",
    },
    // 5. Kiểm tra Trang Dashboard quản lý
    {
      name: "Trang Dashboard (/dashboard)",
      url: `${BASE_URL}/dashboard`,
      options: { method: "GET" },
      validate: (r) => r.passed && typeof r.data === "string",
    },
    // 6. Kiểm tra API gửi lời chúc (Honeypot trap an toàn)
    {
      name: "Bẫy Honeypot Lời Chúc (POST Wishes Trap)",
      url: `${BASE_URL}/api/show/net-hoang-hon-2877/wishes`,
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Robot Kiểm Thử E2E",
          content: "Chúc mừng hạnh phúc!",
          w_field_trap: "bot_trap_detected",
        }),
      },
      validate: (r) => r.passed && r.data && r.data.success,
    },
    // 7. Kiểm tra API gửi xác nhận tham dự (Honeypot trap an toàn)
    {
      name: "Bẫy Honeypot RSVP (POST RSVP Trap)",
      url: `${BASE_URL}/api/show/net-hoang-hon-2877/rsvp`,
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Robot Kiểm Thử E2E",
          phone: "0999888777",
          attending: true,
          guests: 2,
          b_field_trap: "bot_trap_detected",
        }),
      },
      validate: (r) => r.passed && r.data && r.data.success,
    },
    // 8. Kiểm tra Kho Template (/templates)
    {
      name: "Kho Template ZenLove (/templates)",
      url: `${BASE_URL}/templates`,
      options: { method: "GET" },
      validate: (r) => r.passed && typeof r.data === "string" && r.data.length > 500,
    },
    // 9. Kiểm tra Trang Chi Tiết Mẫu Thiệp ZenLove (/templates/son-duyen)
    {
      name: "Chi Tiết Mẫu ZenLove (/templates/son-duyen)",
      url: `${BASE_URL}/templates/son-duyen`,
      options: { method: "GET" },
      validate: (r) => r.passed && typeof r.data === "string" && r.data.includes("son-duyen"),
    },
    // 10. Kiểm tra Redirect Kho Template Cũ (/kho-template -> /templates)
    {
      name: "Chuyển Hướng /kho-template -> /templates",
      url: `${BASE_URL}/kho-template`,
      options: { method: "GET" },
      validate: (r) => r.passed && typeof r.data === "string",
    },
    // 11. Kiểm tra Auth Guard API (POST /api/cards/clone phải trả về 401 khi chưa đăng nhập)
    {
      name: "Bảo Vệ API Clone Thiệp (POST /api/cards/clone -> 401 khi chưa login)",
      url: `${BASE_URL}/api/cards/clone`,
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: "son-duyen" }),
      },
      validate: (r) => r.status === 401,
    },
    // 12. Kiểm tra Bảo Vệ Quyền Quản Trị (GET /api/admin/activities -> 401 khi không có token)
    {
      name: "Bảo Vệ API Admin (GET /api/admin/activities -> 401 chặn khách)",
      url: `${BASE_URL}/api/admin/activities`,
      options: { method: "GET" },
      validate: (r) => r.status === 401,
    },
    // 13. Kiểm tra Xác thực Quản Trị Hợp Lệ với Bearer Token
    {
      name: "Quyền Quản Trị Hợp Lệ (GET /api/admin/stats với Bearer Token)",
      url: `${BASE_URL}/api/admin/stats`,
      options: {
        method: "GET",
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : { "x-admin-key": ADMIN_API_KEY },
      },
      validate: (r) => r.status === 200 && r.data && r.data.success,
    },
  ];

  let passedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < checks.length; i++) {
    const item = checks[i];
    process.stdout.write(`[${i + 1}/${checks.length}] Đang kiểm tra: ${item.name}... `);
    const result = await testEndpoint(item.name, item.url, item.options);
    const isValid = item.validate ? item.validate(result) : result.passed;

    if (isValid) {
      passedCount++;
      console.log(`${colors.green}✓ PASS${colors.reset} (${result.status} • ${result.duration}ms)`);
    } else {
      failedCount++;
      console.log(
        `${colors.red}✗ FAIL${colors.reset} (${result.status} • ${result.duration}ms) - ${result.error || "Validate failed"}`
      );
    }
  }

  console.log(`\n${colors.bold}---------------- BÁO CÁO KẾT QUẢ KIỂM THỬ ----------------${colors.reset}`);
  console.log(`  Tổng số kiểm tra: ${checks.length}`);
  console.log(`  Thành công:       ${colors.green}${passedCount}${colors.reset}`);
  console.log(`  Thất bại:         ${failedCount > 0 ? colors.red + failedCount : colors.green + "0"}${colors.reset}`);
  console.log(`${colors.bold}----------------------------------------------------------${colors.reset}\n`);

  if (failedCount > 0) {
    console.error(`${colors.red}❌ Hệ thống phát hiện lỗi trong quá trình kiểm thử tự động!${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}🎉 TẤT CẢ CÁC KIỂM THỬ ĐÃ VƯỢT QUA XUẤT SẮC!${colors.reset}\n`);
    process.exit(0);
  }
}

runAllChecks();
