import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { satisfies } from "semver";

describe("Deployment & Docker Configuration", () => {
  const rootDir = process.cwd();

  it("uses the configured Node runtime throughout its Docker stages", () => {
    const dockerfilePath = path.join(rootDir, "Dockerfile");
    expect(fs.existsSync(dockerfilePath)).toBe(true);

    const content = fs.readFileSync(dockerfilePath, "utf-8");
    const nodeVersion = fs.readFileSync(path.join(rootDir, ".nvmrc"), "utf8").trim();
    expect(content).toContain(`FROM node:${nodeVersion}-alpine AS base`);
    expect(content).toContain("FROM base AS deps");
    expect(content).toContain("FROM base AS builder");
    expect(content).toContain("FROM base AS runner");
    expect(content).toContain("EXPOSE 3000");
    expect(content).toContain('CMD ["node", "server.js"]');
  });

  it("pins a runtime supported by the actual installed build and test toolchains", () => {
    const nodeVersion = fs.readFileSync(path.join(rootDir, ".nvmrc"), "utf8").trim();
    const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
    const lockfile = JSON.parse(fs.readFileSync(path.join(rootDir, "package-lock.json"), "utf8"));
    expect(satisfies(nodeVersion, manifest.engines.node)).toBe(true);
    expect(lockfile.packages[""].engines).toEqual(manifest.engines);
    for (const tool of ["next", "vite", "vitest"]) {
      const installed = JSON.parse(fs.readFileSync(path.join(rootDir, "node_modules", tool, "package.json"), "utf8"));
      expect(satisfies(nodeVersion, installed.engines.node), `${tool} ${installed.version}`).toBe(true);
    }
  });

  it("should have a proper .dockerignore file", () => {
    const dockerignorePath = path.join(rootDir, ".dockerignore");
    expect(fs.existsSync(dockerignorePath)).toBe(true);

    const content = fs.readFileSync(dockerignorePath, "utf-8");
    expect(content).toContain("node_modules");
    expect(content).toContain(".next");
    expect(content).toContain(".git");
  });

  it("should have a valid docker-compose.yml", () => {
    const composePath = path.join(rootDir, "docker-compose.yml");
    expect(fs.existsSync(composePath)).toBe(true);

    const content = fs.readFileSync(composePath, "utf-8");
    expect(content).toContain("zenlove-wedding");
    expect(content).toContain("3000:3000");
    expect(content).toContain("/api/health");
    expect(content).toContain("ADMIN_PASSCODE=${ADMIN_PASSCODE:?");
    expect(content).toContain("ADMIN_SESSION_SECRET=${ADMIN_SESSION_SECRET:?");
  });

  it("should support standalone output in next.config.mjs", () => {
    const configPath = path.join(rootDir, "next.config.mjs");
    expect(fs.existsSync(configPath)).toBe(true);

    const content = fs.readFileSync(configPath, "utf-8");
    expect(content).toContain("BUILD_STANDALONE");
    expect(content).toContain("standalone");
  });
});
