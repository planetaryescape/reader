export declare function getArticleBody(container: HTMLElement | null): HTMLElement | null;
export declare function getParagraphs(body: HTMLElement | null): HTMLElement[];
export declare function paragraphText(el: HTMLElement): string;
export declare function paragraphIndexOf(node: Node | null): number | null;
export declare function flashParagraph(el: HTMLElement): void;
/** Keeps `data-para` labels in sync with the rendered article. Returns a version that bumps on every re-tag. */
export declare function useParagraphs(containerRef: React.RefObject<HTMLElement | null>, ready: boolean): {
    count: number;
    version: number;
};
