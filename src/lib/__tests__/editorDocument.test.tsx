import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CardNodeRenderer from "@/components/CardNodeRenderer";
import EditorCanvas from "@/components/editor/EditorCanvas";
import { getEditorLayers, getEditorNodeType, getEditorNumber, resolveEditorSelection, type EditorNodes } from "../editorDocument";

const nodes: EditorNodes = {
  ROOT: { nodes: ["visible"], props: { height: 1200 } },
  hidden: { type: { resolvedName: "TextBox" }, props: { text: "QA HIDDEN LAYER", hidden: true, top: 10000, width: 200, height: 60, zIndex: 0 } },
  visible: { type: { resolvedName: "TextBox" }, props: { text: "QA VISIBLE LAYER", hidden: false, top: "0", left: 0, width: "200", height: 60, opacity: 0, zIndex: "0" } },
  orphan: { type: "TextBox", custom: { enabled: false }, props: { text: "QA FLAT LAYER", top: 100, zIndex: -1 } },
};

describe("Shared editor document contract", () => {
  it("keeps flat orphan layers and stable numeric order including zero", () => {
    expect(getEditorLayers(nodes).map(({ id, zIndex }) => [id, zIndex])).toEqual([["orphan", -1], ["visible", 0]]);
    expect(getEditorLayers(nodes, true).map(({ id }) => id)).toEqual(["orphan", "hidden", "visible"]);
  });
  it("resolves IDs against the latest document and removes duplicates/missing/root", () => {
    const selected = resolveEditorSelection(nodes, ["visible", "ROOT", "missing", "constructor", "__proto__", "visible", "orphan"]);
    expect(selected.map(({ id }) => id)).toEqual(["visible", "orphan"]);
    const changed = { ...nodes, visible: { ...nodes.visible, props: { ...nodes.visible.props, text: "Changed", opacity: 0 } } };
    expect(resolveEditorSelection(changed, ["visible"])[0].props).toMatchObject({ text: "Changed", hidden: false, opacity: 0 });
    expect(selected[0].props).toBe(nodes.visible.props);
  });
  it.each([undefined, null, NaN, Infinity, -Infinity, "", "auto", {}, false])("uses a finite fallback for invalid geometry %s", (value) => {
    expect(getEditorNumber(value, 120)).toBe(120);
  });
  it.each([0, "0", "0.5", -10, "-10"])("preserves valid numeric geometry %s", (value) => {
    expect(getEditorNumber(value, 100)).toBe(Number(value));
  });
  it("accepts legacy type representations without rewriting stored data", () => {
    expect(getEditorNodeType(nodes.visible)).toBe("TextBox");
    expect(getEditorNodeType(nodes.orphan)).toBe("TextBox");
    expect(getEditorNodeType({ type: { other: false } })).toBe("Widget");
  });
  it("omits hidden layers in public rendering and never outputs NaN geometry", () => {
    const html = renderToStaticMarkup(<CardNodeRenderer nodes={nodes} />);
    expect(html).toContain("QA VISIBLE LAYER");
    expect(html).toContain("QA FLAT LAYER");
    expect(html).not.toContain("QA HIDDEN LAYER");
    expect(html).not.toContain("NaN");
    expect(html).toContain("opacity:0");
    expect(html).not.toContain("height:10100");
  });
  it("preserves automatic text height in public rendering", () => {
    const html = renderToStaticMarkup(<CardNodeRenderer nodes={{
      ROOT: { props: { width: 500 } },
      text: { type: { resolvedName: "TextBox" }, props: { text: "QA AUTO HEIGHT", height: "auto", top: 0, left: 0, width: 200 } },
    }} />);
    expect(html).toContain("QA AUTO HEIGHT");
    expect(html).toContain("height:auto");
    expect(html).not.toContain("autopx");
    expect(html).not.toContain("NaN");
  });
  it("renders an empty document with finite bounds even when legacy root dimensions are invalid", () => {
    const html = renderToStaticMarkup(<CardNodeRenderer nodes={{ ROOT: { props: { width: "Infinity", height: "invalid" } } }} />);
    expect(html).toContain("width:500px");
    expect(html).toContain("height:1200px");
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("Infinity");
  });
  it("uses the same visible layers and numeric geometry in the editing canvas", () => {
    const noop = () => {};
    const html = renderToStaticMarkup(<EditorCanvas
      nodes={nodes} selectedElement={null} zoomLevel={1}
      onSelectElement={noop} onUpdateElementProps={noop} onDeleteElement={noop}
      onDuplicateElement={noop} onZoomIn={noop} onZoomOut={noop} onResetZoom={noop}
      onQuickReplacePhoto={noop}
    />);
    expect(html).toContain("QA VISIBLE LAYER");
    expect(html).toContain("QA FLAT LAYER");
    expect(html).not.toContain("QA HIDDEN LAYER");
    expect(html).toContain("opacity:0");
    expect(html).not.toContain("NaN");
  });
});
