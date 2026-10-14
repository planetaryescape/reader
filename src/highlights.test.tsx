import { act, cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type HighlightDoc, useHighlights } from "./highlights.js";

const registry = new Map<string, unknown[]>();

beforeEach(() => {
  registry.clear();
  vi.stubGlobal("Highlight", class { ranges: Range[]; constructor(...r: Range[]) { this.ranges = r; } });
  vi.stubGlobal("CSS", {
    highlights: {
      set: (name: string, value: { ranges: Range[] }) => registry.set(name, value.ranges),
      delete: (name: string) => registry.delete(name),
    },
  });
});
afterEach(() => {
  cleanup(); // unmount while the CSS stub is still there
  vi.unstubAllGlobals();
});

function Probe({ docs, html }: { docs: HighlightDoc[]; html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const marks = useHighlights({ containerRef: ref, docs, version: html.length });
  return (
    <div ref={ref}>
      <div data-article-body dangerouslySetInnerHTML={{ __html: html }} />
      <output data-testid="n">{marks.length}</output>
    </div>
  );
}

describe("useHighlights", () => {
  it("places saved quotes in the article and registers them with the browser", async () => {
    const docs: HighlightDoc[] = [
      { text: "bins move", kind: "highlight" },
      { text: "not in the article", kind: "highlight" },
    ];
    const view = render(<Probe docs={docs} html="<p>The bins move to Tuesdays.</p>" />);
    await act(async () => {});
    expect(view.getByTestId("n").textContent).toBe("1");
    expect(registry.get("user-highlight")?.map(String)).toEqual(["bins move"]);
    view.unmount();
    expect(registry.has("user-highlight")).toBe(false);
  });

  it("clears marks when the quotes go away (another item)", async () => {
    const docs: HighlightDoc[] = [{ text: "alpha", kind: "highlight" }];
    const view = render(<Probe docs={docs} html="<p>alpha</p>" />);
    await act(async () => {});
    expect(registry.get("user-highlight")).toHaveLength(1);
    view.rerender(<Probe docs={[]} html="<p>beta</p>" />);
    await act(async () => {});
    expect(registry.get("user-highlight")).toHaveLength(0);
  });
});
