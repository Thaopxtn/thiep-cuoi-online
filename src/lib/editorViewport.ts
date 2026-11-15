interface FitEditorViewport {
  documentWidth: number;
  documentHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  padding: number;
  mode: "width" | "page";
}

/** Use the space left by open panels, keeping the existing 40–150% zoom contract. */
export function fitEditorViewport(input: FitEditorViewport): number {
  const positive = (value: number, fallback: number) => Number.isFinite(value) && value > 0 ? value : fallback;
  const width = positive(input.documentWidth, 500);
  const height = positive(input.documentHeight, 1400);
  const padding = Number.isFinite(input.padding) ? Math.max(0, input.padding) : 0;
  const widthRatio = Math.max(1, positive(input.viewportWidth, 320) - padding * 2) / width;
  const heightRatio = Math.max(1, positive(input.viewportHeight, 600) - padding * 2) / height;
  const ratio = input.mode === "width" ? widthRatio : Math.min(widthRatio, heightRatio);
  return Math.max(0.4, Math.min(1.5, Math.floor(ratio * 100) / 100));
}
