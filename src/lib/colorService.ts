export interface ColorItem {
  id: number;
  name: string;
  hex: string;
}

export async function fetchColors(): Promise<ColorItem[]> {
  try {
    const res = await fetch("/api/colors");
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.colors : [];
  } catch {
    return [];
  }
}
