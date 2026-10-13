import { describe, it, expect } from "vitest";
import {
  ENTRANCE_EFFECTS,
  EXIT_EFFECTS,
  ANIMATION_CATEGORIES,
  DURATION_PRESETS,
  DELAY_PRESETS,
  EASING_OPTIONS,
  ANIMATION_COMBOS,
  HOVER_EFFECTS,
  ANIMATION_KEYFRAME_MAP,
  CONTINUOUS_EFFECTS,
  getContinuousEffectById,
  getAnimationById,
  buildTransitionStyle,
  applyStaggerToNodes,
  applyComboToNodes,
} from "../animationCatalog";

describe("Animation Catalog & Transition System", () => {
  it("should have diverse entrance animations across all categories", () => {
    expect(ENTRANCE_EFFECTS.length).toBeGreaterThanOrEqual(15);

    const categories = new Set(ENTRANCE_EFFECTS.map((e) => e.category));
    expect(categories.has("minimal")).toBe(true);
    expect(categories.has("romantic")).toBe(true);
    expect(categories.has("zoom")).toBe(true);
    expect(categories.has("dynamic")).toBe(true);
    expect(categories.has("luxury3d")).toBe(true);
    expect(categories.has("cinematic")).toBe(true);

    // Each effect has id, name, icon, desc
    ENTRANCE_EFFECTS.forEach((eff) => {
      expect(eff.id).toBeTruthy();
      expect(eff.name).toBeTruthy();
      expect(eff.icon).toBeTruthy();
      expect(eff.desc).toBeTruthy();
    });
  });

  it("should have diverse exit animations across categories", () => {
    expect(EXIT_EFFECTS.length).toBeGreaterThanOrEqual(10);

    const noneEffect = EXIT_EFFECTS.find((e) => e.id === "none");
    expect(noneEffect).toBeDefined();

    const fadeOut = EXIT_EFFECTS.find((e) => e.id === "fadeOut");
    expect(fadeOut).toBeDefined();

    const zoomOut = EXIT_EFFECTS.find((e) => e.id === "zoomOut");
    expect(zoomOut).toBeDefined();

    const flipOut = EXIT_EFFECTS.find((e) => e.id === "flipOutX");
    expect(flipOut).toBeDefined();
  });

  it("should have diverse continuous loop animations", () => {
    expect(CONTINUOUS_EFFECTS.length).toBeGreaterThanOrEqual(6);
    expect(CONTINUOUS_EFFECTS.some((e) => e.id === "none")).toBe(true);
    expect(CONTINUOUS_EFFECTS.some((e) => e.id === "float")).toBe(true);
    expect(CONTINUOUS_EFFECTS.some((e) => e.id === "pulse")).toBe(true);
    expect(CONTINUOUS_EFFECTS.some((e) => e.id === "bounce")).toBe(true);

    const floatEffect = getContinuousEffectById("float");
    expect(floatEffect).toBeDefined();
    expect(floatEffect?.name).toBe("Bay lơ lửng");
  });

  it("should provide full category filters", () => {
    expect(ANIMATION_CATEGORIES.length).toBeGreaterThanOrEqual(6);
    expect(ANIMATION_CATEGORIES.some((c) => c.id === "all")).toBe(true);
    expect(ANIMATION_CATEGORIES.some((c) => c.id === "romantic")).toBe(true);
    expect(ANIMATION_CATEGORIES.some((c) => c.id === "luxury3d")).toBe(true);
  });

  it("should lookup animations by ID accurately", () => {
    const fadeIn = getAnimationById("fadeIn", "entrance");
    expect(fadeIn).toBeDefined();
    expect(fadeIn?.name).toBe("Mờ dần vào");

    const floatIn = getAnimationById("floatIn", "entrance");
    expect(floatIn).toBeDefined();
    expect(floatIn?.category).toBe("romantic");

    const flipOutX = getAnimationById("flipOutX", "exit");
    expect(flipOutX).toBeDefined();
    expect(flipOutX?.name).toBe("Lật úp 3D biến mất");

    const nonExistent = getAnimationById("unknownEffect", "entrance");
    expect(nonExistent).toBeUndefined();
  });

  it("should map kebab-case and camelCase in ANIMATION_KEYFRAME_MAP", () => {
    expect(ANIMATION_KEYFRAME_MAP["fadeIn"]).toBe("fadeIn");
    expect(ANIMATION_KEYFRAME_MAP["fade-in"]).toBe("fadeIn");
    expect(ANIMATION_KEYFRAME_MAP["fadeInUp"]).toBe("fadeInUp");
    expect(ANIMATION_KEYFRAME_MAP["slide-up"]).toBe("slideInUp");
    expect(ANIMATION_KEYFRAME_MAP["flipInX"]).toBe("flipInX");
    expect(ANIMATION_KEYFRAME_MAP["fadeOut"]).toBe("fadeOut");
    expect(ANIMATION_KEYFRAME_MAP["blurReveal"]).toBe("blurReveal");
  });

  it("should build correct React CSS styles with buildTransitionStyle", () => {
    // Disabled transition
    expect(buildTransitionStyle(undefined)).toEqual({});
    expect(buildTransitionStyle({ effectEnabled: false, effectType: "fadeIn" })).toEqual({});
    expect(buildTransitionStyle({ effectEnabled: true, effectType: "none" })).toEqual({});

    // Enabled transition with custom duration, delay, and easing
    const style = buildTransitionStyle({
      effectEnabled: true,
      effectType: "fadeInUp",
      effectDuration: 1.5,
      effectDelay: 0.3,
      effectEasing: "cubic-bezier(0.16, 1, 0.3, 1)",
    });

    expect(style.animationName).toBe("fadeInUp");
    expect(style.animationDuration).toBe("1.5s");
    expect(style.animationDelay).toBe("0.3s");
    expect(style.animationTimingFunction).toBe("cubic-bezier(0.16, 1, 0.3, 1)");
    expect(style.animationFillMode).toBe("both");
  });

  it("should have valid timing presets and easing options", () => {
    expect(DURATION_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(DELAY_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(EASING_OPTIONS.length).toBeGreaterThanOrEqual(3);

    DURATION_PRESETS.forEach((p) => {
      expect(p.value).toBeGreaterThan(0);
      expect(p.label).toBeTruthy();
    });

    DELAY_PRESETS.forEach((p) => {
      expect(p.value).toBeGreaterThanOrEqual(0);
      expect(p.label).toBeTruthy();
    });
  });

  it("should provide rich 1-click animation combos", () => {
    expect(ANIMATION_COMBOS.length).toBeGreaterThanOrEqual(5);

    ANIMATION_COMBOS.forEach((combo) => {
      expect(combo.id).toBeTruthy();
      expect(combo.name).toBeTruthy();
      expect(combo.entranceEffect).toBeTruthy();
      expect(combo.loopEffect).toBeTruthy();
      expect(combo.duration).toBeGreaterThan(0);
    });

    const romanceCombo = ANIMATION_COMBOS.find((c) => c.id === "sweet-romance");
    expect(romanceCombo).toBeDefined();
    expect(romanceCombo?.entranceEffect).toBe("floatIn");
  });

  it("should provide hover & tap micro-interaction effects", () => {
    expect(HOVER_EFFECTS.length).toBeGreaterThanOrEqual(4);

    const scaleGentle = HOVER_EFFECTS.find((h) => h.id === "scale-up-gentle");
    expect(scaleGentle).toBeDefined();
    expect(scaleGentle?.className).toBe("hover-effect-scale-up-gentle");
  });

  it("should calculate stagger delays based on vertical coordinate", () => {
    const dummyNodes = {
      ROOT: { type: "Container", props: { width: 450, height: 1200 } },
      node_bottom: { type: "TextBox", props: { top: 600, text: "Địa điểm" } },
      node_top: { type: "TextBox", props: { top: 100, text: "Lễ Thành Hôn" } },
      node_mid: { type: "PhotoBox", props: { top: 300, imgKey: "wedding_photo" } },
    };

    const staggered = applyStaggerToNodes(dummyNodes, 0.15);

    // ROOT is preserved
    expect(staggered.ROOT).toBeDefined();

    // Sorted top to bottom: node_top (delay 0), node_mid (delay 0.15), node_bottom (delay 0.3)
    expect(staggered.node_top.props.transition.effectDelay).toBe(0);
    expect(staggered.node_mid.props.transition.effectDelay).toBe(0.15);
    expect(staggered.node_bottom.props.transition.effectDelay).toBe(0.3);
  });

  it("should apply full combo presets to nodes with stagger support", () => {
    const dummyNodes = {
      ROOT: { type: "Container", props: { width: 450, height: 1200 } },
      node_1: { type: "TextBox", props: { top: 50, text: "Cô Dâu & Chú Rể" } },
      node_2: { type: "PhotoBox", props: { top: 200, imgKey: "photo" } },
    };

    const combo = ANIMATION_COMBOS[0]; // sweet-romance
    const result = applyComboToNodes(dummyNodes, combo, true, 0.2);

    expect(result.node_1.props.transition.effectType).toBe(combo.entranceEffect);
    expect(result.node_1.props.continuousAnimation.type).toBe(combo.loopEffect);
    expect(result.node_1.props.transition.hoverEffect).toBe(combo.hoverEffect);
    expect(result.node_1.props.transition.effectDelay).toBe(0);
    expect(result.node_2.props.transition.effectDelay).toBe(0.2);
  });
});
