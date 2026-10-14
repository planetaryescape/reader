import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import {
  getArticleBody,
  getParagraphs,
  paragraphIndexOf,
  paragraphText,
  useParagraphs,
} from "./paragraphs.js";

beforeAll(() => {
  // jsdom has no ResizeObserver; the hook only needs it to exist.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function Probe({ html, ready = true }: { html: string; ready?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { count } = useParagraphs(ref, ready);
  return (
    <div ref={ref}>
      <div data-article-body dangerouslySetInnerHTML={{ __html: html }} />
      <output data-testid="count">{count}</output>
    </div>
  );
}

async function settle() {
  await act(async () => {
    await new Promise((r) => requestAnimationFrame(() => r(null)));
  });
}

describe("useParagraphs", () => {
  it("numbers leaf blocks from 1 and skips containers and empty blocks", async () => {
    const view = render(
      <Probe html="<h2>Title</h2><blockquote><p>quoted</p></blockquote><p> </p><ul><li>one</li><li>two</li></ul>" />,
    );
    await settle();
    const body = getArticleBody(view.container) as HTMLElement;
    expect(getParagraphs(body).map((el) => [el.tagName, el.dataset.para])).toEqual([
      ["H2", "1"],
      ["P", "2"],
      ["LI", "3"],
      ["LI", "4"],
    ]);
    expect(view.getByTestId("count").textContent).toBe("4");
  });

  it("re-tags when the article changes and drops stale labels", async () => {
    const view = render(<Probe html="<p>one</p><p>two</p>" />);
    await settle();
    view.rerender(<Probe html="<p>only</p>" />);
    await settle();
    const body = getArticleBody(view.container) as HTMLElement;
    expect(getParagraphs(body)).toHaveLength(1);
    expect(view.getByTestId("count").textContent).toBe("1");
  });

  it("does nothing until ready", async () => {
    const view = render(<Probe html="<p>one</p>" ready={false} />);
    await settle();
    expect(getParagraphs(getArticleBody(view.container))).toHaveLength(0);
  });

  it("marks the first long prose paragraph for a drop cap", async () => {
    const long = "Lorem ipsum dolor sit amet ".repeat(8);
    const view = render(<Probe html={`<p>2024-01-01</p><p>${long}</p>`} />);
    await settle();
    const [date, prose] = getParagraphs(getArticleBody(view.container));
    expect(date?.hasAttribute("data-dropcap")).toBe(false);
    expect(prose?.hasAttribute("data-dropcap")).toBe(true);
  });
});

describe("paragraph helpers", () => {
  it("maps nodes to zero-based paragraph indexes", () => {
    const root = document.createElement("div");
    root.innerHTML = '<p data-para="3">hi <em>there</em></p><p>untagged</p>';
    const em = root.querySelector("em") as HTMLElement;
    expect(paragraphIndexOf(em.firstChild)).toBe(2);
    expect(paragraphIndexOf(root.querySelectorAll("p")[1] ?? null)).toBeNull();
    expect(paragraphIndexOf(null)).toBeNull();
  });

  it("reads paragraph text without annotation numbers and extra whitespace", () => {
    const el = document.createElement("p");
    el.innerHTML = 'one  <mark class="annotation-mark">two<sup>9</sup></mark>\n three';
    expect(paragraphText(el)).toBe("one two three");
  });
});
