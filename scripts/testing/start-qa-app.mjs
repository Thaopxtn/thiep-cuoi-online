import { spawn } from "node:child_process";
import { qaEnv } from "./qa-env.mjs";
import { validateQaDatabaseUrl } from "./qa-fixture-server.mjs";

// Fail before booting an app if the integration database isn't explicitly isolated.
validateQaDatabaseUrl(process.env.ZENLOVE_QA_DATABASE_URL);
const action = process.argv[2] || "dev";
if (!["dev", "build", "start"].includes(action)) throw new Error("Expected dev, build, or start");
const args = ["--max-old-space-size=1024", "node_modules/next/dist/bin/next", action];
if (action !== "build") args.push("-p", "3016", "-H", "127.0.0.1");
const child = spawn(process.execPath, args, {
  env: { ...process.env, ...qaEnv }, stdio: "inherit", windowsHide: true,
});
child.on("error", () => { process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
