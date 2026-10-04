"use client";

import { useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TemplateItem, StyleTag, ColorFamily, TemplateFeature } from "@/data/templates/types";
import { matchesTemplateQuery } from "@/lib/search";

export interface TemplateFilterState {
  category: string;
  styleTags: StyleTag[];
  colorFamily: ColorFamily | "all";
  features: TemplateFeature[];
  tag: string;
  favoritesOnly: boolean;
  source: "all" | "custom" | "presets";
  query: string;
  sortBy: "newest" | "popular" | "likes" | "title";
}

export interface UseTemplateFiltersReturn {
  filters: TemplateFilterState;
  filteredTemplates: TemplateItem[];
  activeFilterCount: number;
  setCategory: (category: string) => void;
  toggleStyleTag: (tag: StyleTag) => void;
  setColorFamily: (color: ColorFamily | "all") => void;
  toggleFeature: (feature: TemplateFeature) => void;
  setTag: (tag: string) => void;
  setFavoritesOnly: (val: boolean) => void;
  setSource: (source: "all" | "custom" | "presets") => void;
  setQuery: (query: string) => void;
  setSortBy: (sort: "newest" | "popular" | "likes" | "title") => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

export function useTemplateFilters(
  templates: TemplateItem[],
  customIds: Set<string>,
  favoriteIds: string[],
  options: { syncWithUrl?: boolean; defaultSource?: "all" | "custom" | "presets" } = {}
): UseTemplateFiltersReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const syncWithUrl = options.syncWithUrl !== false;

  // Read state from URL search params or fallback to defaults
  const filters = useMemo<TemplateFilterState>(() => {
    if (!syncWithUrl || !searchParams) {
      return {
        category: "all",
        styleTags: [],
        colorFamily: "all",
        features: [],
        tag: "all",
        favoritesOnly: false,
        source: options.defaultSource || "all",
        query: "",
        sortBy: "newest",
      };
    }

    const catParam = searchParams.get("cat") || "all";
    const styleParam = searchParams.get("style");
    const styleTags = styleParam ? (styleParam.split(",").filter(Boolean) as StyleTag[]) : [];
    const colorParam = (searchParams.get("color") as ColorFamily | "all") || "all";
    const featParam = searchParams.get("feat");
    const features = featParam ? (featParam.split(",").filter(Boolean) as TemplateFeature[]) : [];
    const tagParam = searchParams.get("tag") || "all";
    const favParam = searchParams.get("fav") === "1";
    const sourceParam = (searchParams.get("source") as any) || options.defaultSource || "all";
    const qParam = searchParams.get("q") || "";
    const sortParam = (searchParams.get("sort") as any) || "newest";

    return {
      category: catParam,
      styleTags,
      colorFamily: colorParam,
      features,
      tag: tagParam,
      favoritesOnly: favParam,
      source: sourceParam,
      query: qParam,
      sortBy: sortParam,
    };
  }, [searchParams, syncWithUrl, options.defaultSource]);

  // Helper to push updated search params to URL
  const updateUrlParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      if (!syncWithUrl) return;
      const current = new URLSearchParams(searchParams ? searchParams.toString() : "");
      updater(current);
      const queryString = current.toString();
      const target = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(target, { scroll: false });
    },
    [syncWithUrl, searchParams, pathname, router]
  );

  const setCategory = useCallback(
    (cat: string) => {
      updateUrlParams((params) => {
        if (!cat || cat === "all") {
          params.delete("cat");
        } else {
          params.set("cat", cat);
        }
      });
    },
    [updateUrlParams]
  );

  const toggleStyleTag = useCallback(
    (style: StyleTag) => {
      updateUrlParams((params) => {
        const currentStyles = filters.styleTags.slice();
        const idx = currentStyles.indexOf(style);
        if (idx >= 0) {
          currentStyles.splice(idx, 1);
        } else {
          currentStyles.push(style);
        }
        if (currentStyles.length === 0) {
          params.delete("style");
        } else {
          params.set("style", currentStyles.join(","));
        }
      });
    },
    [filters.styleTags, updateUrlParams]
  );

  const setColorFamily = useCallback(
    (color: ColorFamily | "all") => {
      updateUrlParams((params) => {
        if (!color || color === "all") {
          params.delete("color");
        } else {
          params.set("color", color);
        }
      });
    },
    [updateUrlParams]
  );

  const toggleFeature = useCallback(
    (feature: TemplateFeature) => {
      updateUrlParams((params) => {
        const currentFeatures = filters.features.slice();
        const idx = currentFeatures.indexOf(feature);
        if (idx >= 0) {
          currentFeatures.splice(idx, 1);
        } else {
          currentFeatures.push(feature);
        }
        if (currentFeatures.length === 0) {
          params.delete("feat");
        } else {
          params.set("feat", currentFeatures.join(","));
        }
      });
    },
    [filters.features, updateUrlParams]
  );

  const setTag = useCallback(
    (tag: string) => {
      updateUrlParams((params) => {
        if (!tag || tag === "all") {
          params.delete("tag");
        } else {
          params.set("tag", tag);
        }
      });
    },
    [updateUrlParams]
  );

  const setFavoritesOnly = useCallback(
    (val: boolean) => {
      updateUrlParams((params) => {
        if (val) {
          params.set("fav", "1");
        } else {
          params.delete("fav");
        }
      });
    },
    [updateUrlParams]
  );

  const setSource = useCallback(
    (source: "all" | "custom" | "presets") => {
      updateUrlParams((params) => {
        if (!source || source === "all") {
          params.delete("source");
        } else {
          params.set("source", source);
        }
      });
    },
    [updateUrlParams]
  );

  const setQuery = useCallback(
    (query: string) => {
      updateUrlParams((params) => {
        if (!query.trim()) {
          params.delete("q");
        } else {
          params.set("q", query.trim());
        }
      });
    },
    [updateUrlParams]
  );

  const setSortBy = useCallback(
    (sortBy: "newest" | "popular" | "likes" | "title") => {
      updateUrlParams((params) => {
        if (sortBy === "newest") {
          params.delete("sort");
        } else {
          params.set("sort", sortBy);
        }
      });
    },
    [updateUrlParams]
  );

  const clearAllFilters = useCallback(() => {
    updateUrlParams((params) => {
      params.delete("cat");
      params.delete("style");
      params.delete("color");
      params.delete("feat");
      params.delete("tag");
      params.delete("fav");
      params.delete("q");
      // Keep source and sort if relevant, or reset
      params.delete("sort");
    });
  }, [updateUrlParams]);

  // Count active filters (excluding sort and default source)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category && filters.category !== "all") count++;
    if (filters.styleTags.length > 0) count += filters.styleTags.length;
    if (filters.colorFamily && filters.colorFamily !== "all") count++;
    if (filters.features.length > 0) count += filters.features.length;
    if (filters.tag && filters.tag !== "all") count++;
    if (filters.favoritesOnly) count++;
    if (filters.query.trim()) count++;
    if (filters.source !== (options.defaultSource || "all")) count++;
    return count;
  }, [filters, options.defaultSource]);

  // Filter and sort items
  const filteredTemplates = useMemo(() => {
    return templates
      .filter((item) => {
        const isCustom = customIds.has(item.id) || item.id.startsWith("custom-");

        // 1. Source filter
        if (filters.source === "custom" && !isCustom) return false;
        if (filters.source === "presets" && isCustom) return false;

        // 2. Favorites filter
        if (filters.favoritesOnly && !favoriteIds.includes(item.id)) return false;

        // 3. Category filter
        if (filters.category !== "all" && item.category !== filters.category) return false;

        // 4. Tag filter
        if (filters.tag !== "all" && item.tag !== filters.tag) return false;

        // 5. Color family filter
        if (
          filters.colorFamily !== "all" &&
          item.meta?.colorFamily !== filters.colorFamily
        ) {
          return false;
        }

        // 6. Style tags filter (match ANY of the selected tags)
        if (filters.styleTags.length > 0) {
          const itemTags = item.meta?.styleTags || [];
          const hasMatch = filters.styleTags.some((st) => itemTags.includes(st));
          if (!hasMatch) return false;
        }

        // 7. Features filter (must include ALL of the selected features)
        if (filters.features.length > 0) {
          const itemFeatures = item.meta?.features || [];
          const hasAllFeatures = filters.features.every((f) =>
            itemFeatures.includes(f)
          );
          if (!hasAllFeatures) return false;
        }

        // 8. Diacritic-insensitive Search query
        if (filters.query.trim()) {
          if (!matchesTemplateQuery(item, filters.query)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "popular") {
          return (b.views || 0) - (a.views || 0);
        }
        if (filters.sortBy === "likes") {
          return (b.likes || 0) - (a.likes || 0);
        }
        if (filters.sortBy === "title") {
          return a.title.localeCompare(b.title, "vi");
        }
        // "newest": Compare createdAt or updatedAt descending
        const timeA = new Date(
          a.meta?.updatedAt || a.meta?.createdAt || 0
        ).getTime();
        const timeB = new Date(
          b.meta?.updatedAt || b.meta?.createdAt || 0
        ).getTime();
        return timeB - timeA;
      });
  }, [
    templates,
    customIds,
    favoriteIds,
    filters,
  ]);

  return {
    filters,
    filteredTemplates,
    activeFilterCount,
    setCategory,
    toggleStyleTag,
    setColorFamily,
    toggleFeature,
    setTag,
    setFavoritesOnly,
    setSource,
    setQuery,
    setSortBy,
    clearAllFilters,
    hasActiveFilters: activeFilterCount > 0,
  };
}
