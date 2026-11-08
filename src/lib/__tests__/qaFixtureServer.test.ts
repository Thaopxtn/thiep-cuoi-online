import { describe, expect, it } from "vitest";
import { buildRestSql, validateQaDatabaseUrl } from "../../../scripts/testing/qa-fixture-server.mjs";

describe("Disposable PostgreSQL HTTP fixture boundaries", () => {
  it("accepts only an explicit local QA database", () => {
    expect(validateQaDatabaseUrl("postgresql://postgres@127.0.0.1:55432/zenlove_qa_20261104").hostname).toBe("127.0.0.1");
    for (const unsafe of [
      undefined, "postgresql://postgres@db.example.test/zenlove_qa_test",
      "postgresql://postgres@localhost/production", "postgresql://postgres@localhost/zenlove_qa_test?host=db.example.test",
      "postgresql://postgres@localhost/zenlove_qa_test#ignored", "https://localhost/zenlove_qa_test",
    ]) expect(() => validateQaDatabaseUrl(unsafe)).toThrow();
  });

  it("never interpolates filter or body data into SQL syntax", () => {
    const attack = "'; DROP TABLE public.cards; --\\n\\! dangerous";
    const read = buildRestSql("cards", "GET", new URLSearchParams({ id: `eq.${attack}` }));
    const write = buildRestSql("cards", "POST", new URLSearchParams(), {
      id: "qa-test", slug: "qa-test", name: "Fixture", story: attack,
    });
    expect(read).not.toContain(attack);
    expect(write).not.toContain(attack);
    expect(read).toContain(Buffer.from(attack).toString("base64"));
    expect(write).toContain("jsonb_populate_recordset");
  });

  it("rejects unknown table/column names and SQL-like control fields", () => {
    expect(() => buildRestSql("cards; DROP TABLE cards", "GET", new URLSearchParams())).toThrow();
    expect(() => buildRestSql("cards", "GET", new URLSearchParams({ select: "id;DROP TABLE cards" }))).toThrow();
    expect(() => buildRestSql("cards", "GET", new URLSearchParams({ order: "id.desc;DROP TABLE cards" }))).toThrow();
    expect(() => buildRestSql("cards", "PATCH", new URLSearchParams(), { "id) WHERE TRUE;--": "x" })).toThrow();
    expect(() => buildRestSql("cards", "GET", new URLSearchParams({ limit: "1;DROP TABLE cards" }))).toThrow();
  });
});
