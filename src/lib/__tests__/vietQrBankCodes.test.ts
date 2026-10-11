import { describe, it, expect } from "vitest";
import { resolveBankCode, generateVietQrUrl } from "../vietQrBankCodes";

describe("vietQrBankCodes - resolveBankCode", () => {
  it("should resolve MB bank variations correctly", () => {
    expect(resolveBankCode("mbbank")).toBe("MB");
    expect(resolveBankCode("MB")).toBe("MB");
    expect(resolveBankCode("Ngân hàng Quân Đội")).toBe("MB");
  });

  it("should resolve Techcombank variations correctly", () => {
    expect(resolveBankCode("techcombank")).toBe("TCB");
    expect(resolveBankCode("TCB")).toBe("TCB");
  });

  it("should resolve Vietcombank variations correctly", () => {
    expect(resolveBankCode("vietcombank")).toBe("VCB");
    expect(resolveBankCode("VCB")).toBe("VCB");
  });

  it("should fallback to MB if bank name is empty or unknown", () => {
    expect(resolveBankCode("")).toBe("MB");
    expect(resolveBankCode(undefined)).toBe("MB");
  });
});

describe("vietQrBankCodes - generateVietQrUrl", () => {
  it("should return empty string if account number is missing", () => {
    expect(generateVietQrUrl("MB", "")).toBe("");
    expect(generateVietQrUrl("MB", undefined)).toBe("");
  });

  it("should generate valid VietQR image URL with clean account number", () => {
    const url = generateVietQrUrl("Techcombank", "1903-658-249", "NGUYEN VAN A");
    expect(url).toContain("https://img.vietqr.io/image/TCB-1903658249-compact2.png");
    expect(url).toContain("accountName=NGUYEN%20VAN%20A");
  });

  it("should include amount and message in URL query params if provided", () => {
    const url = generateVietQrUrl("MB", "240220038888", "CHU RE", 500000, "Mung cuoi hai ban");
    expect(url).toContain("https://img.vietqr.io/image/MB-240220038888-compact2.png");
    expect(url).toContain("amount=500000");
    expect(url).toContain("addInfo=Mung%20cuoi%20hai%20ban");
    expect(url).toContain("accountName=CHU%20RE");
  });
});
