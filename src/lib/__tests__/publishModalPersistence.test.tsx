import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INITIAL_CARDS } from "@/data/initialCards";

const state = vi.hoisted(() => ({ index: 0, slots: [] as any[], effects: [] as Array<() => void>, api: vi.fn(), save: vi.fn() }));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  const hooks = {
    useState: (initial: unknown) => {
      const index = state.index++;
      if (!(index in state.slots)) state.slots[index] = typeof initial === "function" ? initial() : initial;
      return [state.slots[index], (value: unknown) => { state.slots[index] = typeof value === "function" ? value(state.slots[index]) : value; }];
    },
    useEffect: (effect: () => void) => { state.effects.push(effect); },
    useMemo: (fn: () => unknown) => fn(),
  };
  return { ...actual, ...hooks, default: { ...actual.default, ...hooks } };
});
vi.mock("@/lib/weddingCardService", () => ({ saveCard: state.save }));
vi.mock("@/lib/apiClient", () => ({ apiFetch: state.api }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { id: "owner", name: "QA Owner" } }) }));
import EditorPublishModal from "@/components/editor/EditorPublishModal";

const slug = "qa-existing-published-slug-longer-than-thirty-five-characters";
const card = { ...INITIAL_CARDS[0], id: "qa-publish", slug, status: "published" as const, album: [] };
function render() {
  state.index = 0;
  return EditorPublishModal({ isOpen: true, onClose: vi.fn(), templateName: "QA", templateId: "qa-template", card });
}
function textOf(node: React.ReactNode): string {
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return typeof node === "string" ? node : "";
}
function find(node: React.ReactNode, predicate: (element: React.ReactElement<any>) => boolean): React.ReactElement<any> | undefined {
  if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } }
  else if (React.isValidElement<{ children?: React.ReactNode }>(node)) return predicate(node) ? node : find(node.props.children, predicate);
}
beforeEach(() => {
  vi.clearAllMocks(); state.index = 0; state.slots = []; state.effects = [];
  vi.stubGlobal("window", { location: { origin: "http://127.0.0.1:3016" } });
});
afterEach(() => vi.unstubAllGlobals());

describe("Acknowledged publish sharing", () => {
  it("opens with the persisted slug and empty album without publishing or saving a background snapshot", () => {
    render(); state.effects.splice(0).forEach((effect) => effect());
    const modal = render();
    const link = find(modal, (element) => element.type === "a" && element.props.href === `http://127.0.0.1:3016/show/${slug}`);
    expect(link).toBeDefined();
    expect(textOf(modal)).toContain("Chưa có ảnh nào trong Album cưới.");
    expect(state.api).not.toHaveBeenCalled();
    expect(state.save).not.toHaveBeenCalled();
  });

  it("does not resend stale card content when the payment modal confirms VIP", () => {
    const upgrade = find(render(), (element) => element.type === "button" && textOf(element) === "Nâng cấp 99k");
    upgrade!.props.onClick();
    const payment = find(render(), (element) => typeof element.props.onVipActivated === "function");
    expect(payment).toBeDefined();
    payment!.props.onVipActivated();
    expect(state.api).not.toHaveBeenCalled();
    expect(state.save).not.toHaveBeenCalled();
  });
});
