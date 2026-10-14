import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  parseReaderSettings,
  webSearchEnabled,
} from "./reader-settings.js";

describe("reader preferences", () => {
  it.each([
    null,
    [],
    "invalid",
    42,
  ])("repairs invalid storage roots", (value) => {
    expect(parseReaderSettings(value)).toEqual(DEFAULT_SETTINGS);
  });
  it("keeps valid preferences while repairing removed choices and impossible sizes", () => {
    expect(
      parseReaderSettings({
        theme: "sepia",
        pen: "forest",
        typeface: "removed",
        size: 999,
        map: false,
        dropCapLines: -1,
      }),
    ).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "sepia",
      pen: "forest",
      map: false,
    });
  });
  it("fills missing settings without persisting unknown keys", () => {
    expect(parseReaderSettings({ theme: "night", oldFeature: true })).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "night",
    });
  });
  it.each([
    ["off", "quick", false],
    ["off", "deep", false],
    ["deep", "quick", false],
    ["deep", "deep", true],
    ["always", "quick", true],
    ["always", "deep", true],
  ] as const)("applies the %s web policy for %s answers", (webSearch, answerDepth, enabled) => {
    expect(
      webSearchEnabled({ ...DEFAULT_SETTINGS, webSearch, answerDepth }),
    ).toBe(enabled);
  });
});

describe("useReaderSettings storage", () => {
  it("keeps preferences per storage key and repairs corrupt values", async () => {
    const { renderHook, act } = await import("@testing-library/react");
    const { useReaderSettings } = await import("./reader-settings.js");
    window.localStorage.setItem("test:corrupt", "{not json");
    const corrupt = renderHook(() => useReaderSettings("test:corrupt"));
    expect(corrupt.result.current.settings).toEqual(DEFAULT_SETTINGS);

    const a = renderHook(() => useReaderSettings("test:a"));
    act(() => a.result.current.update({ theme: "ink", size: 24 }));
    expect(JSON.parse(window.localStorage.getItem("test:a") ?? "{}")).toMatchObject({
      theme: "ink",
      size: 24,
    });
    const b = renderHook(() => useReaderSettings("test:b"));
    expect(b.result.current.settings.theme).toBe("auto");
    act(() => a.result.current.resetText());
    expect(a.result.current.settings.size).toBe(DEFAULT_SETTINGS.size);
    expect(a.result.current.settings.theme).toBe("ink");
  });
});
