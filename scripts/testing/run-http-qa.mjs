import { qaEnv } from "./qa-env.mjs";
import { validateQaDatabaseUrl } from "./qa-fixture-server.mjs";
import { spawn } from "node:child_process";

const database = validateQaDatabaseUrl(process.env.ZENLOVE_QA_DATABASE_URL);
const health = await fetch(`${qaEnv.SUPABASE_URL}/__qa/health`, { signal: AbortSignal.timeout(5000) });
const fixture = await health.json();
if (!health.ok || fixture.testOnly !== true || `/${fixture.database}` !== database.pathname) throw new Error("An isolated matching QA fixture must be running");
const action = process.argv[2] || "e2e";
if (!["all", "e2e"].includes(action)) throw new Error("Expected all or e2e");
const headers = { Authorization: "Bearer qa-user-a", "Content-Type": "application/json" };
const ids = [];
try {
  // The legacy contract suites address these two URLs. Populate them with fake QA
  // content in the disposable database, never with copied customer invitations.
  for (const [id, slug] of [["qa-http-primary", "net-hoang-hon-2877"], ["card_1792173082745_06no", "thao-le-zenlove-mau01-2026"]]) {
    const existing = await fetch(`${qaEnv.NEXT_PUBLIC_SITE_URL}/api/cards/${id}`, { headers, signal: AbortSignal.timeout(5000) });
    if (existing.status !== 404) throw new Error("QA HTTP fixture id already exists; refusing to overwrite it");
    const response = await fetch(`${qaEnv.NEXT_PUBLIC_SITE_URL}/api/cards`, {
      method: "POST", headers, signal: AbortSignal.timeout(10000), body: JSON.stringify({
        id, slug, name: "QA HTTP synthetic invitation", templateName: "QA HTTP template", status: "published", groom: { name: "QA Groom" }, bride: { name: "QA Bride" },
        musicUrl: "", musicTitle: "", album: [], weddingDate: "2026-12-20", weddingTime: "11:00",
        nodes: { ROOT: { type: { resolvedName: "GeometricBox" }, props: { height: 1000 }, nodes: ["title", "body"] },
          title: { type: { resolvedName: "TextBox" }, props: { text: "QA Wedding" }, parent: "ROOT" },
          body: { type: { resolvedName: "TextBox" }, props: { text: "QA HTTP test only" }, parent: "ROOT" } },
      }),
    });
    if (!response.ok) throw new Error("Unable to create isolated QA HTTP fixtures with the QA user");
    ids.push(id);
  }
  process.exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [action === "all" ? "scripts/test-all-qa.mjs" : "scripts/e2e-check.mjs"], {
      env: { ...process.env, ...qaEnv, BASE_URL: qaEnv.NEXT_PUBLIC_SITE_URL }, stdio: "inherit", windowsHide: true,
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
} finally {
  for (const id of ids) {
    const deleted = await fetch(`${qaEnv.NEXT_PUBLIC_SITE_URL}/api/cards/${id}`, { method: "DELETE", headers, signal: AbortSignal.timeout(10000) });
    if (!deleted.ok) { console.error("Could not clean up a QA HTTP fixture"); process.exitCode = 1; }
  }
}
