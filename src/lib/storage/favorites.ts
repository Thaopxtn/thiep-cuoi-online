/**
 * Local favorites management.
 * Stored in localStorage `zenlove_favorites_v1`.
 */

export const FAVORITES_STORAGE_KEY = "zenlove_favorites_v1";
export const FAVORITES_EVENT_CHANGE = "zenlove_favorites_updated";

export function getFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isFavorite(id: string): boolean {
  return getFavoriteIds().includes(id);
}

export function toggleFavorite(id: string): boolean {
  if (typeof window === "undefined") return false;
  const list = getFavoriteIds();
  const index = list.indexOf(id);
  let favorited = false;

  if (index >= 0) {
    list.splice(index, 1);
    favorited = false;
  } else {
    list.unshift(id);
    favorited = true;
  }

  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(
      new CustomEvent(FAVORITES_EVENT_CHANGE, {
        detail: { id, favorited, list },
      })
    );
  } catch (err) {
    console.warn("Không thể lưu yêu thích:", err);
  }

  return favorited;
}
