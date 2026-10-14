import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./reader-settings.js";
import { desiredColorScheme, readerRootProps, resolveReaderTheme } from "./theme.js";

describe("reader theme", () => {
  it("resolves auto from the app scheme and leaves explicit themes alone", () => {
    expect(resolveReaderTheme("auto", "dark")).toBe("night");
    expect(resolveReaderTheme("auto", "light")).toBe("paper");
    expect(resolveReaderTheme("sepia", "dark")).toBe("sepia");
  });

  it("asks the app for the scheme an explicit theme needs", () => {
    expect(desiredColorScheme("auto")).toBe("system");
    expect(desiredColorScheme("ink")).toBe("dark");
    expect(desiredColorScheme("snow")).toBe("light");
  });

  it("builds wrapper props with attributes and typography variables", () => {
    const props = readerRootProps(
      { ...DEFAULT_SETTINGS, theme: "dusk", size: 22, spacing: "airy", typeface: "sans" },
      "light",
    );
    expect(props["data-reader-theme"]).toBe("dusk");
    expect(props["data-pen"]).toBe(DEFAULT_SETTINGS.pen);
    expect(props.style).toMatchObject({
      "--reader-size": "22px",
      "--reader-leading": "2.05",
    });
    expect(String((props.style as Record<string, string>)["--reader-font"])).toContain(
      "system-ui",
    );
  });
});
