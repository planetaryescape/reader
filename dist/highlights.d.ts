export type MarkKind = "highlight" | "underline";
/** A saved mark: the quoted text, and optionally the paragraph it was made in. */
export interface HighlightDoc {
    text: string;
    kind: MarkKind;
    paragraphIndex?: number;
}
export interface PlacedMark<D extends HighlightDoc = HighlightDoc> {
    doc: D;
    range: Range;
}
/** The saved mark of `kind` covering the same words as `range`, if any. */
export declare function findMark<D extends HighlightDoc>(marks: PlacedMark<D>[], kind: MarkKind, range: Range): PlacedMark<D> | undefined;
/**
 * Paints highlighter and pen marks, and selects a mark when it's clicked so
 * the selection toolbar can remove it or ask about it.
 *
 * `docs` should be referentially stable between renders (memoise it), or the
 * marks are re-placed on every render.
 */
export declare function useHighlights<D extends HighlightDoc = HighlightDoc>({ containerRef, docs, version, }: {
    containerRef: React.RefObject<HTMLElement | null>;
    docs: D[] | undefined;
    version: number;
}): PlacedMark<D>[];
