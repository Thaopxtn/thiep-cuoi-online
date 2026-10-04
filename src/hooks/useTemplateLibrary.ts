"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { TemplateItem, TEMPLATES_DATA } from "@/data/templates";
import {
  getAllTemplates,
  getCustomTemplates,
  hydrateStorage,
  TEMPLATES_EVENT_CHANGE,
} from "@/lib/templateStorage";
import {
  FAVORITES_EVENT_CHANGE,
  getFavoriteIds,
  isFavorite,
  toggleFavorite,
} from "@/lib/storage/favorites";

export interface TemplateLibraryState {
  allTemplates: TemplateItem[];
  presets: TemplateItem[];
  customTemplates: TemplateItem[];
  customIds: Set<string>;
  favoriteIds: string[];
  isReady: boolean;
  refresh: () => void;
  toggleFav: (id: string) => boolean;
  isFav: (id: string) => boolean;
}

export function useTemplateLibrary(): TemplateLibraryState {
  const [allTemplates, setAllTemplates] = useState<TemplateItem[]>(TEMPLATES_DATA);
  const [customTemplates, setCustomTemplates] = useState<TemplateItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(() => {
    const custom = getCustomTemplates();
    const merged = getAllTemplates();
    setCustomTemplates(custom);
    setAllTemplates(merged);
    setFavoriteIds(getFavoriteIds());
    setIsReady(true);
  }, []);

  useEffect(() => {
    // Initial hydration from IndexedDB / Storage
    hydrateStorage().then(() => {
      refresh();
    });

    const handleStorageChange = () => {
      refresh();
    };

    const handleFavoritesChange = () => {
      setFavoriteIds(getFavoriteIds());
    };

    window.addEventListener(TEMPLATES_EVENT_CHANGE, handleStorageChange);
    window.addEventListener(FAVORITES_EVENT_CHANGE, handleFavoritesChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(TEMPLATES_EVENT_CHANGE, handleStorageChange);
      window.removeEventListener(FAVORITES_EVENT_CHANGE, handleFavoritesChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refresh]);

  const customIds = useMemo(() => {
    return new Set(customTemplates.map((t) => t.id));
  }, [customTemplates]);

  const presets = useMemo(() => {
    return allTemplates.filter((t) => !customIds.has(t.id));
  }, [allTemplates, customIds]);

  const handleToggleFav = useCallback((id: string) => {
    const result = toggleFavorite(id);
    setFavoriteIds(getFavoriteIds());
    return result;
  }, []);

  const handleIsFav = useCallback(
    (id: string) => {
      return favoriteIds.includes(id) || isFavorite(id);
    },
    [favoriteIds]
  );

  return {
    allTemplates,
    presets,
    customTemplates,
    customIds,
    favoriteIds,
    isReady,
    refresh,
    toggleFav: handleToggleFav,
    isFav: handleIsFav,
  };
}
