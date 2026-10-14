"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
/** Sanitising needs the browser's DOM, so the body renders after the first client render. */
function useMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}
function escapeAttribute(value) {
    return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
const ANNOTATION_LABELS = {
    cross_reference: "Cross-reference",
    context: "Context",
    tension: "Tension",
    question: "Question",
};
const ANNOTATION_COLORS = {
    cross_reference: "#5b7f95",
    context: "#7a8f6f",
    tension: "#b07050",
    question: "#8b7bb0",
};
/**
 * Inject annotation markers into sanitized HTML content.
 * Finds anchorText in the HTML, wraps matches with <mark> elements.
 */
function injectAnnotations(html, plainText, annotations) {
    if (annotations.length === 0)
        return html;
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
            }
            else if (ann.relevanceScore < 0.7 || ann.type === "context") {
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
export function ArticleRenderer({ content, contentHtml, sanitize, annotations, activeAnnotationId, onAnnotationSelect, onViewed, className, wrapperClassName, }) {
    const bodyRef = useRef(null);
    // Sanitize HTML then inject annotation markers
    // Sanitising needs the browser's DOM, so the article body renders after mount
    const mounted = useMounted();
    const annotatedHtml = useMemo(() => {
        if (!mounted)
            return "";
        const sanitized = sanitize(contentHtml || content);
        return injectAnnotations(sanitized, content, annotations);
    }, [mounted, content, contentHtml, annotations, sanitize]);
    // React 19 rewrites innerHTML whenever this object's identity changes, which
    // would wipe the reader's selection and paragraph tags on every re-render.
    const innerHtml = useMemo(() => ({ __html: annotatedHtml }), [annotatedHtml]);
    // Emphasise the annotation whose card is open
    // biome-ignore lint/correctness/useExhaustiveDependencies: re-apply after the HTML is replaced
    useEffect(() => {
        if (!activeAnnotationId)
            return;
        const mark = bodyRef.current?.querySelector(`[data-annotation-id="${CSS.escape(activeAnnotationId)}"]`);
        mark?.setAttribute("data-active", "");
        return () => mark?.removeAttribute("data-active");
    }, [activeAnnotationId, innerHtml]);
    const handleClick = useCallback((element) => {
        const target = element instanceof HTMLElement
            ? element.closest(".annotation-mark")
            : null;
        const annId = target?.getAttribute("data-annotation-id");
        if (!annId)
            return;
        if (activeAnnotationId === annId) {
            onAnnotationSelect(null);
            return;
        }
        onAnnotationSelect(annId);
        onViewed?.(annId);
    }, [activeAnnotationId, onAnnotationSelect, onViewed]);
    return (_jsx("div", { "data-reader-article": true, className: wrapperClassName ?? "reader-article", onClick: (e) => handleClick(e.target), onKeyDown: (e) => {
            if (e.key !== "Enter" && e.key !== " ")
                return;
            if (!e.target.closest(".annotation-mark"))
                return;
            e.preventDefault();
            handleClick(e.target);
        }, children: _jsx("div", { ref: bodyRef, "data-article-body": true, className: className ? `reader-prose ${className}` : "reader-prose", dangerouslySetInnerHTML: innerHtml }) }));
}
