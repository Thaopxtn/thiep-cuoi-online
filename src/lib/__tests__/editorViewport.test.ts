import { describe, expect, it } from "vitest";
import { fitEditorViewport } from "../editorViewport";

const input = { documentWidth: 500, documentHeight: 1400, viewportWidth: 320, viewportHeight: 600, padding: 16, mode: "width" as const };

describe("Editor viewport fit", () => {
  it("fits the actual document at320px without cropping its edges", () => {
    const zoom = fitEditorViewport(input);
    expect(zoom).toBe(0.57);
    expect(500 * zoom).toBeLessThanOrEqual(320 - 32);
  });
  it("uses the remaining width when both panels are open", () => {
    expect(fitEditorViewport({ ...input, mode: "page", viewportWidth: 348, viewportHeight: 900, documentHeight: 800, padding: 24 })).toBe(0.6);
  });
  it("uses the document's custom width instead of assuming500px", () => {
    expect(fitEditorViewport({ ...input, documentWidth: 600 })).toBe(0.48);
  });
  it("fits page height and stays within the supported range for very long/short documents", () => {
    expect(fitEditorViewport({ ...input, mode: "page", viewportWidth: 1000, viewportHeight: 800 })).toBe(0.54);
    expect(fitEditorViewport({ ...input, mode: "page", documentHeight: 10000 })).toBe(0.4);
    expect(fitEditorViewport({ ...input, documentWidth: 100, viewportWidth: 2000 })).toBe(1.5);
  });
  it("handles invalid dimensions without NaN or infinity", () => {
    expect(fitEditorViewport({ ...input, documentWidth: NaN, documentHeight: 0, viewportWidth: Infinity, padding: NaN })).toBe(0.64);
  });
});
