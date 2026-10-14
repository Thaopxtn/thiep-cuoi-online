import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Deployment & Docker Configuration", () => {
  const rootDir = process.cwd();

  it("should have a production-ready Dockerfile with multi-stage build", () => {
    const dockerfilePath = path.join(rootDir, "Dockerfile");
    expect(fs.existsSync(dockerfilePath)).toBe(true);

    const content = fs.readFileSync(dockerfilePath, "utf-8");
    expect(content).toContain("FROM node:20-alpine AS base");
    expect(content).toContain("FROM base AS deps");
    expect(content).toContain("FROM base AS builder");
    expect(content).toContain("FROM base AS runner");
    expect(content).toContain("EXPOSE 3000");
    expect(content).toContain('CMD ["node", "server.js"]');
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
  });

  it("should support standalone output in next.config.mjs", () => {
    const configPath = path.join(rootDir, "next.config.mjs");
    expect(fs.existsSync(configPath)).toBe(true);

    const content = fs.readFileSync(configPath, "utf-8");
    expect(content).toContain("BUILD_STANDALONE");
    expect(content).toContain("standalone");
  });
});
