import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// jsdom has no CSS.escape
beforeEach(() => {
  vi.stubGlobal("CSS", { escape: (value: string) => value });
});
import { type Annotation, ArticleRenderer } from "./article-renderer.js";

const annotation: Annotation = {
  _id: "ann1",
  type: "context",
  anchorText: "second sentence",
  anchorStartOffset: 10,
  anchorEndOffset: 25,
  content: "note",
  relevanceScore: 0.9,
};

function setup(overrides: Partial<Parameters<typeof ArticleRenderer>[0]> = {}) {
  const sanitize = vi.fn((html: string) => html.replace(/<script.*?<\/script>/g, ""));
  const onViewed = vi.fn();
  const onAnnotationSelect = vi.fn();
  const view = render(
    <ArticleRenderer
      content="First line. second sentence here."
      contentHtml="<p>First line. second sentence here.</p><script>x()</script>"
      sanitize={sanitize}
      annotations={[annotation]}
      activeAnnotationId={null}
      onAnnotationSelect={onAnnotationSelect}
      onViewed={onViewed}
      {...overrides}
    />,
  );
  return { sanitize, onViewed, onAnnotationSelect, view };
}

describe("ArticleRenderer", () => {
  it("renders what the injected sanitizer returns, not the raw html", () => {
    const { sanitize, view } = setup({ annotations: [] });
    expect(sanitize).toHaveBeenCalledWith(
      "<p>First line. second sentence here.</p><script>x()</script>",
    );
    expect(view.container.querySelector("script")).toBeNull();
    expect(view.container.querySelector("[data-article-body] p")?.textContent).toContain(
      "First line.",
    );
  });

  it("sanitizes the plain text when there is no html", () => {
    const { sanitize } = setup({ contentHtml: "", content: "<b>plain</b>", annotations: [] });
    expect(sanitize).toHaveBeenCalledWith("<b>plain</b>");
  });

  it("renders nothing from a sanitizer that returns an empty string", () => {
    setup({ sanitize: () => "", annotations: [] });
    expect(document.querySelector("[data-article-body]")?.innerHTML).toBe("");
  });

  it("calls onViewed when an annotation opens, not when it closes", () => {
    const { onViewed, onAnnotationSelect, view } = setup();
    const mark = view.container.querySelector(".annotation-mark") as HTMLElement;
    fireEvent.click(mark);
    expect(onAnnotationSelect).toHaveBeenLastCalledWith("ann1");
    expect(onViewed).toHaveBeenCalledWith("ann1");

    onViewed.mockClear();
    view.rerender(
      <ArticleRenderer
        content="First line. second sentence here."
        contentHtml="<p>First line. second sentence here.</p>"
        sanitize={(h) => h}
        annotations={[annotation]}
        activeAnnotationId="ann1"
        onAnnotationSelect={onAnnotationSelect}
        onViewed={onViewed}
      />,
    );
    fireEvent.click(view.container.querySelector(".annotation-mark") as HTMLElement);
    expect(onAnnotationSelect).toHaveBeenLastCalledWith(null);
    expect(onViewed).not.toHaveBeenCalled();
  });

  it("works without onViewed", () => {
    const { view } = setup({ onViewed: undefined });
    expect(() =>
      fireEvent.click(view.container.querySelector(".annotation-mark") as HTMLElement),
    ).not.toThrow();
  });

  it("opens an annotation from the keyboard", () => {
    const { onViewed, view } = setup();
    fireEvent.keyDown(view.container.querySelector(".annotation-mark") as HTMLElement, {
      key: "Enter",
    });
    expect(onViewed).toHaveBeenCalledWith("ann1");
  });

  it("escapes annotation fields written into attributes", () => {
    setup({
      annotations: [{ ...annotation, _id: 'x" onmouseover="alert(1)', type: "context" }],
    });
    const mark = document.querySelector(".annotation-mark") as HTMLElement;
    expect(mark.hasAttribute("onmouseover")).toBe(false);
    expect(mark.getAttribute("data-annotation-id")).toBe('x" onmouseover="alert(1)');
  });

  it("appends a caller class to the body", () => {
    setup({ className: "extra", annotations: [] });
    expect(screen.getByText(/First line/).closest("[data-article-body]")?.className).toBe(
      "reader-prose extra",
    );
  });
});
