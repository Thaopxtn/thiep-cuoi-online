import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { getCard } = vi.hoisted(() => ({ getCard: vi.fn() }));
vi.mock("@/lib/serverDb", () => ({ getCardByIdOrSlugFromDb: getCard }));
import ShowSlugLayout from "@/app/show/[slug]/layout";

describe("Public card structured data", () => {
  it("keeps user text inside one JSON-LD script and preserves the JSON data", async () => {
    const attack = '</script><script>alert("injected")</script><!--';
    getCard.mockResolvedValue({
      groom: { name: attack }, bride: { name: "Bình" }, story: attack,
      weddingDate: "2026-12-01", weddingTime: "11:00",
      events: [{ venue: attack, address: attack }],
    });

    const markup = renderToStaticMarkup(await ShowSlugLayout({
      params: { slug: "published-card" }, children: <main>Thiệp cưới</main>,
    }));
    expect(markup.match(/<script\b/g)).toHaveLength(1);
    expect(markup.match(/<\/script>/g)).toHaveLength(1);
    const json = markup.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1];
    expect(json).toBeDefined();
    const schema = JSON.parse(json!);
    expect(schema.description).toBe(attack);
    expect(schema.location.name).toBe(attack);
    expect(schema.name).toContain(attack);
    expect(markup).toContain("<main>Thiệp cưới</main>");
  });
});
