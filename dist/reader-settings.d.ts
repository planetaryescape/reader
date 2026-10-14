export type ReaderTheme = "auto" | "paper" | "sepia" | "snow" | "dusk" | "night" | "ink";
/** Explicit themes that need the app's dark mode; "auto" follows the system. */
export declare function isDarkTheme(theme: ReaderTheme): boolean;
export type PenColor = "vermilion" | "cobalt" | "forest" | "graphite";
export type HighlighterColor = "yellow" | "green" | "blue" | "pink";
export type Typeface = "serif" | "book" | "sans" | "legible";
export type Spacing = "snug" | "even" | "airy";
export type Width = "narrow" | "even" | "wide";
export type Align = "left" | "justify";
export type ParagraphStyle = "spaced" | "indented";
export type DropCap = "off" | "text" | "ornate" | "gothic";
export type AnswerLength = "brief" | "standard" | "detailed";
export type AnswerLevel = "plain" | "balanced" | "expert";
export type AnswerDepth = "quick" | "deep";
export type WebSearch = "off" | "deep" | "always";
export interface ReaderSettings {
    theme: ReaderTheme;
    pen: PenColor;
    highlighter: HighlighterColor;
    numbers: boolean;
    map: boolean;
    focus: boolean;
    typeface: Typeface;
    size: number;
    spacing: Spacing;
    width: Width;
    align: Align;
    paragraphs: ParagraphStyle;
    dropCap: DropCap;
    dropCapLines: number;
    answerLength: AnswerLength;
    answerLevel: AnswerLevel;
    answerDepth: AnswerDepth;
    webSearch: WebSearch;
}
export declare const TEXT_DEFAULTS: {
    typeface: "serif";
    size: number;
    spacing: "even";
    width: "even";
    align: "left";
    paragraphs: "spaced";
    dropCap: "text";
    dropCapLines: number;
};
export declare const DROP_CAP_LINES: readonly [2, 3, 4, 5];
export declare const DROP_CAP_FAMILIES: Record<Exclude<DropCap, "off">, string>;
export declare const DEFAULT_SETTINGS: ReaderSettings;
/** Whether the model may search the web for an answer at this depth. */
export declare function webSearchEnabled(settings: ReaderSettings): boolean;
export declare const SIZE_RANGE: {
    readonly min: 14;
    readonly max: 28;
};
export declare const TYPEFACE_FAMILIES: Record<Typeface, string>;
export declare const LINE_HEIGHTS: Record<Spacing, number>;
export declare const MAX_WIDTHS: Record<Width, string>;
/** Where `useReaderSettings` keeps preferences unless the app passes its own key. */
export declare const DEFAULT_STORAGE_KEY = "reader:settings";
/** Stored preferences may outlive the version that wrote them. Repair per field. */
export declare function parseReaderSettings(value: unknown): ReaderSettings;
/** Reader preferences kept in localStorage and shared across tabs. */
export declare function useReaderSettings(storageKey?: string): {
    settings: ReaderSettings;
    update: (patch: Partial<ReaderSettings>) => void;
    resetText: () => void;
};
