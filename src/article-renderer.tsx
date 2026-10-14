"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface Annotation {
  _id: string;
  type: "cross_reference" | "context" | "tension" | "question";
  anchorText: string;
  anchorStartOffset: number;
  anchorEndOffset: number;
  content: string;
  notePath?: string;
  noteExcerpt?: string;
  relevanceScore: number;
}

export interface ArticleRendererProps {
  /** Plain text of the article; used when there is no HTML and to locate annotations. */
  content: string;
  contentHtml: string;
  /**
   * Turns untrusted HTML into markup that is safe to insert. Required: the
   * renderer trusts what this returns and adds nothing of its own, so each app
   * keeps its own trust policy. It runs in the browser, after mount.
   */
  sanitize: (html: string) => string;
  annotations: Annotation[];
  activeAnnotationId: string | null;
  /** Called with the clicked annotation, or null when the open one is clicked again. */
  onAnnotationSelect: (annotationId: string | null) => void;
  /** Called when an annotation is opened (not when it is closed again). */
  onViewed?: (annotationId: string) => void;
  /** Extra classes for the article body, after the package's `reader-prose`. */
  className?: string;
}

/** Sanitising needs the browser's DOM, so the body renders after the first client render. */
function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function escapeAttribute(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => `&#${c.charCodeAt(0)};`,
  );
}

const ANNOTATION_LABELS: Record<string, string> = {
  cross_reference: "Cross-reference",
  context: "Context",
  tension: "Tension",
  question: "Question",
};

const ANNOTATION_COLORS: Record<string, string> = {
  cross_reference: "#5b7f95",
  context: "#7a8f6f",
  tension: "#b07050",
  question: "#8b7bb0",
};

/**
 * Inject annotation markers into sanitized HTML content.
 * Finds anchorText in the HTML, wraps matches with <mark> elements.
 */
function injectAnnotations(
  html: string,
  plainText: string,
  annotations: Annotation[],
): string {
  if (annotations.length === 0) return html;

  // Sort by start offset descending so injecting from end to start
  // doesn't mess up earlier offsets
  const sorted = [...annotations]
    .filter((a) => plainText.includes(a.anchorText))
    .sort((a, b) => b.anchorStartOffset - a.anchorStartOffset);

  let result = html;

  for (const ann of sorted) {
    const escaped = ann.anchorText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Allow HTML tags interleaved in the text
    const flexiblePattern = escaped.replace(/\s+/g, "(?:\\s|<[^>]*>)*");

    const regex = new RegExp(flexiblePattern, "i");
    const match = result.match(regex);

    if (match && match.index !== undefined) {
      const color = ANNOTATION_COLORS[ann.type] || "#5b7f95";
      const idx = annotations.indexOf(ann) + 1;

      // Weight tier: resonant (high signal), standard, quiet
      let weight = "standard";
      if (ann.relevanceScore >= 0.85 || ann.type === "tension") {
        weight = "resonant";
      } else if (ann.relevanceScore < 0.7 || ann.type === "context") {
        weight = "quiet";
      }

      const before = result.slice(0, match.index);
      const after = result.slice(match.index + match[0].length);
      const marker =
        // Focusable so annotations can be opened from the keyboard (Tab, then Enter)
        `<mark class="annotation-mark" data-annotation-id="${escapeAttribute(ann._id)}" data-type="${escapeAttribute(ann.type)}" data-weight="${weight}" tabindex="0" role="button" aria-label="${ANNOTATION_LABELS[ann.type] ?? "Annotation"}: open note">` +
        `${match[0]}<sup style="font-size: 0.6em; font-family: system-ui, sans-serif; font-weight: 700; color: ${color}; margin-left: 3px; user-select: none;">${idx}</sup></mark>`;
      result = before + marker + after;
    }
  }

  return result;
}

export function ArticleRenderer({
  content,
  contentHtml,
  sanitize,
  annotations,
  activeAnnotationId,
  onAnnotationSelect,
  onViewed,
  className,
}: ArticleRendererProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  // Sanitize HTML then inject annotation markers
  // Sanitising needs the browser's DOM, so the article body renders after mount
  const mounted = useMounted();
  const annotatedHtml = useMemo(() => {
    if (!mounted) return "";
    const sanitized = sanitize(contentHtml || content);
    return injectAnnotations(sanitized, content, annotations);
  }, [mounted, content, contentHtml, annotations, sanitize]);

  // React 19 rewrites innerHTML whenever this object's identity changes, which
  // would wipe the reader's selection and paragraph tags on every re-render.
  const innerHtml = useMemo(() => ({ __html: annotatedHtml }), [annotatedHtml]);

  // Emphasise the annotation whose card is open
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-apply after the HTML is replaced
  useEffect(() => {
    if (!activeAnnotationId) return;
    const mark = bodyRef.current?.querySelector(
      `[data-annotation-id="${CSS.escape(activeAnnotationId)}"]`,
    );
    mark?.setAttribute("data-active", "");
    return () => mark?.removeAttribute("data-active");
  }, [activeAnnotationId, innerHtml]);

  const handleClick = useCallback(
    (element: EventTarget) => {
      const target =
        element instanceof HTMLElement
          ? element.closest(".annotation-mark")
          : null;
      const annId = target?.getAttribute("data-annotation-id");
      if (!annId) return;
      if (activeAnnotationId === annId) {
        onAnnotationSelect(null);
        return;
      }
      onAnnotationSelect(annId);
      onViewed?.(annId);
    },
    [activeAnnotationId, onAnnotationSelect, onViewed],
  );

  return (
    <div
      className="reader-article"
      onClick={(e) => handleClick(e.target)}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        if (!(e.target as HTMLElement).closest(".annotation-mark")) return;
        e.preventDefault();
        handleClick(e.target);
      }}
    >
      {/* Article HTML with full prose styling */}
      <div
        ref={bodyRef}
        data-article-body
        className={className ? `reader-prose ${className}` : "reader-prose"}
        dangerouslySetInnerHTML={innerHtml}
      />
    </div>
  );
}
