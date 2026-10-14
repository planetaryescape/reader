export declare function normalizeText(text: string): string;
/** Finds `text` in the preferred paragraph first, then anywhere in `root`. */
export declare function findTextRange(root: HTMLElement, text: string, preferred?: HTMLElement | null): Range | null;
export declare function rangeContainsPoint(range: Range, x: number, y: number): boolean;
