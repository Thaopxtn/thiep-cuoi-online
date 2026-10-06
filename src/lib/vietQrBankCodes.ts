/**
 * Danh mục chuẩn 54 ngân hàng Việt Nam Napas 24/7 theo chuẩn VietQR API
 */
export const VIETQR_BANKS: Record<string, string> = {
  // Nhóm Big 4 & Ngân hàng TMCP lớn
  mbbank: "MB",
  mb: "MB",
  vietcombank: "VCB",
  vcb: "VCB",
  techcombank: "TCB",
  tcb: "TCB",
  vietinbank: "CTG",
  vietin: "CTG",
  ctg: "CTG",
  bidv: "BIDV",
  vpbank: "VPB",
  vp: "VPB",
  vpb: "VPB",
  tpbank: "TPB",
  tp: "TPB",
  tpb: "TPB",
  acb: "ACB",
  sacombank: "STB",
  sacom: "STB",
  stb: "STB",
  hdbank: "HDB",
  hdb: "HDB",
  shb: "SHB",
  vib: "VIB",
  msb: "MSB",
  maritime: "MSB",
  seabank: "SEAB",
  ocb: "OCB",
  lienvietpostbank: "LPB",
  lpbank: "LPB",
  lpb: "LPB",
  eximbank: "EIB",
  eib: "EIB",
  abbank: "ABB",
  abb: "ABB",
  bacabank: "BAB",
  bab: "BAB",
  ncb: "NVB",
  nvb: "NVB",
  namabank: "NAB",
  nab: "NAB",
  bvbank: "BVB",
  banviet: "BVB",
  bvb: "BVB",
  kienlongbank: "KLB",
  klb: "KLB",
  saigonbank: "SGB",
  sgb: "SGB",
  vietabank: "VAB",
  vab: "VAB",
  baovietbank: "BVB",
  pgbank: "PGB",
  pgb: "PGB",
  pvcombank: "PVCB",
  pvcb: "PVCB",
  gpbank: "GPB",
  gpb: "GPB",
  oceanbank: "OJB",
  ojb: "OJB",
  scb: "SCB",
  coopbank: "COOP",
  dongabank: "DAB",

  // Nhóm Ngân hàng số thế hệ mới
  timo: "VPB",
  cake: "VPB",
  tnex: "MSB",
  liobank: "OCB",
  ubank: "VPB",

  // Nhóm Ngân hàng nước ngoài tại VN
  shinhanbank: "SHBVN",
  shinhan: "SHBVN",
  wooribank: "WOO",
  woori: "WOO",
  uob: "UOB",
  hsbc: "HSBC",
  standardchartered: "SCVN",
  scvn: "SCVN",
  publicbank: "PBVN",
  pbvn: "PBVN",
  hongleong: "HLBVN",
  indovinabank: "IVB",
  ivb: "IVB",
  cimb: "CIMB",
  vrb: "VRB",
};

/**
 * Phân giải tên ngân hàng bất kỳ sang mã ngân hàng chuẩn Napas
 */
export function resolveBankCode(rawName?: string): string {
  if (!rawName) return "MB";
  const clean = rawName.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Tra cứu trực tiếp
  if (VIETQR_BANKS[clean]) return VIETQR_BANKS[clean];

  // Tra cứu theo từ khóa chứa trong tên
  for (const [key, code] of Object.entries(VIETQR_BANKS)) {
    if (clean.includes(key)) return code;
  }

  // Nếu đã là mã viết hoa chuẩn (VD: VCB, MB, TCB)
  const upper = rawName.trim().toUpperCase();
  if (Object.values(VIETQR_BANKS).includes(upper)) return upper;

  return "MB";
}

/**
 * Sinh URL VietQR chuẩn Napas 24/7 với template compact2
 */
export function generateVietQrUrl(
  bankName?: string,
  accountNumber?: string,
  accountName?: string,
  amount?: number | string,
  message?: string
): string {
  if (!accountNumber) return "";
  const cleanAcc = accountNumber.replace(/[^a-zA-Z0-9]/g, "");
  if (!cleanAcc) return "";
  const bankCode = resolveBankCode(bankName);
  let url = `https://img.vietqr.io/image/${bankCode}-${cleanAcc}-compact2.png`;

  const params: string[] = [];
  if (amount) params.push(`amount=${encodeURIComponent(String(amount))}`);
  if (message) params.push(`addInfo=${encodeURIComponent(message)}`);
  if (accountName) params.push(`accountName=${encodeURIComponent(accountName)}`);

  if (params.length > 0) {
    url += `?${params.join("&")}`;
  }
  return url;
}

export const POPULAR_BANKS: Array<{ code: string; name: string }> = [
  { code: "MB", name: "MB Bank (Quân Đội)" },
  { code: "VCB", name: "Vietcombank (Ngoại Thương)" },
  { code: "TCB", name: "Techcombank (Kỹ Thương)" },
  { code: "CTG", name: "VietinBank (Công Thương)" },
  { code: "BIDV", name: "BIDV (Đầu Tư & Phát Triển)" },
  { code: "VPB", name: "VPBank (Việt Nam Thịnh Vượng)" },
  { code: "ACB", name: "ACB (Á Châu)" },
  { code: "TPB", name: "TPBank (Tiên Phong)" },
  { code: "HDB", name: "HDBank (Phát Triển TP.HCM)" },
  { code: "STB", name: "Sacombank (Sài Gòn Thương Tín)" },
  { code: "VIB", name: "VIB (Quốc Tế)" },
  { code: "MSB", name: "MSB (Hàng Hải)" },
  { code: "SHB", name: "SHB (Sài Gòn - Hà Nội)" },
  { code: "OCB", name: "OCB (Phương Đông)" },
  { code: "SEAB", name: "SeABank (Đông Nam Á)" },
  { code: "NAB", name: "Nam A Bank (Nam Á)" },
];

