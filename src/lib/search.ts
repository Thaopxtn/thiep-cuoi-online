import { TemplateItem } from "@/data/templates/types";

/**
 * Remove Vietnamese diacritics and convert to lower-case ASCII for fuzzy comparison.
 * e.g., "Văn Sâm & Mai Lan" -> "van sam & mai lan"
 */
export function normalizeSearchText(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Test whether a template item matches a given search query (supports unaccented typing).
 * Matches against title, description, category, tags, author, and host/person names.
 */
export function matchesTemplateQuery(
  template: TemplateItem,
  query: string
): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;

  const tokens = q.split(" ").filter(Boolean);

  const searchableFields = [
    template.title,
    template.description,
    template.categoryName,
    template.category,
    template.tag || "",
    template.meta?.author || "",
    template.defaultData.eventTitle,
    template.defaultData.person1,
    template.defaultData.person2 || "",
    template.defaultData.venue,
    ...(template.meta?.styleTags || []),
    template.meta?.colorFamily || "",
  ];

  const haystacks = searchableFields
    .map((field) => normalizeSearchText(field))
    .join(" ");

  // Every token in the query must match somewhere in the combined haystack
  return tokens.every((token) => haystacks.includes(token));
}
