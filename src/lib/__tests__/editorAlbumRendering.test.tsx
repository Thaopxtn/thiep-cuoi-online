import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import EditorLeftDrawer from "@/components/editor/EditorLeftDrawer";
import { INITIAL_CARDS } from "@/data/initialCards";

function renderAlbum(cardAlbum: string[] | undefined, storedAlbum: string[]) {
  return renderToStaticMarkup(<EditorLeftDrawer
    activeTab="image" isOpen onClose={vi.fn()} onAddImage={vi.fn()}
    onAddText={vi.fn()} onChangeMusic={vi.fn()} onSelectTemplate={vi.fn()}
    cardAlbum={cardAlbum}
    card={{ ...INITIAL_CARDS[0], album: storedAlbum, coverImage: "https://example.test/old-cover.webp" }}
    nodes={{ photo: { type: { resolvedName: "PhotoBox" }, props: { imgKey: "https://example.test/canvas-photo.webp" } } }}
  />);
}

describe("Editor album rendering", () => {
  it("keeps an explicitly emptied album empty instead of restoring cover/canvas photos", () => {
    const html = renderAlbum([], ["https://example.test/previous.webp"]);
    expect(html.replace(/<[^>]*>/g, "")).toMatch(/Album phát hành\s*\(\s*0\s*\)/);
    expect(html).not.toContain('alt="Album ảnh cưới 1"');
  });

  it("keeps a persisted empty album empty when no override is supplied", () => {
    const html = renderAlbum(undefined, []);
    expect(html).not.toContain('alt="Album ảnh cưới 1"');
  });

  it("renders the arranged album in preference to an older stored album", () => {
    const html = renderAlbum(["https://example.test/arranged.webp"], ["https://example.test/previous.webp"]);
    expect(html).toContain('src="https://example.test/arranged.webp"');
    expect(html).not.toContain('src="https://example.test/previous.webp"');
  });
});
