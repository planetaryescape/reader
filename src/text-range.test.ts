import { describe, expect, it } from "vitest";
import { findTextRange, normalizeText } from "./text-range.js";

function article(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.append(root);
  return root;
}

describe("findTextRange", () => {
  it("finds text that spans inline elements", () => {
    const root = article("<p>The <em>bins</em> move to <b>Tuesdays</b> now.</p>");
    expect(findTextRange(root, "bins move to Tuesdays")?.toString()).toBe(
      "bins move to Tuesdays",
    );
  });

  it("compares whitespace loosely in the article and the quote", () => {
    const root = article("<p>the bins\n   move   to Tuesdays</p>");
    const range = findTextRange(root, "  the  bins move\tto Tuesdays ");
    expect(normalizeText(range?.toString() ?? "")).toBe("the bins move to Tuesdays");
  });

  it("prefers the paragraph it was made in when a phrase repeats", () => {
    const root = article("<p>again and again</p><p>again and again</p>");
    const second = root.querySelectorAll("p")[1] as HTMLElement;
    const range = findTextRange(root, "again", second);
    expect(range?.startContainer.parentElement).toBe(second);
  });

  it("falls back to the whole article when the preferred paragraph lacks the text", () => {
    const root = article("<p>one</p><p>two</p>");
    const first = root.querySelectorAll("p")[0] as HTMLElement;
    expect(findTextRange(root, "two", first)?.toString()).toBe("two");
  });

  it("returns null for text that is absent or empty", () => {
    const root = article("<p>hello</p>");
    expect(findTextRange(root, "goodbye")).toBeNull();
    expect(findTextRange(root, "   ")).toBeNull();
  });

  it("ignores annotation footnote numbers", () => {
    const root = article(
      '<p>alpha <mark class="annotation-mark">beta<sup>1</sup></mark> gamma</p>',
    );
    expect(findTextRange(root, "beta gamma")?.toString()).toBe("beta1 gamma");
  });

  it("does not treat quotes as markup or patterns", () => {
    const root = article("<p>cost is $5 (approx.) [sic]</p>");
    expect(findTextRange(root, "$5 (approx.) [sic]")?.toString()).toBe(
      "$5 (approx.) [sic]",
    );
  });
});
