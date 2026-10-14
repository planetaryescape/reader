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
export declare function ArticleRenderer({ content, contentHtml, sanitize, annotations, activeAnnotationId, onAnnotationSelect, onViewed, className, }: ArticleRendererProps): import("react").JSX.Element;
