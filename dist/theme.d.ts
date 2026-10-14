import type { CSSProperties } from "react";
import { type ReaderSettings } from "./reader-settings.js";
/** The light/dark scheme the surrounding app resolved; "auto" themes follow it. */
export type ColorScheme = "light" | "dark";
export type ThemeSettings = Pick<ReaderSettings, "theme" | "pen" | "highlighter">;
/** The concrete theme to draw: "auto" becomes night or paper by the app's scheme. */
export declare function resolveReaderTheme(theme: ReaderSettings["theme"], scheme: ColorScheme): Exclude<ReaderSettings["theme"], "auto">;
/**
 * The app colour scheme an explicit reader theme needs, for apps that switch
 * their own light/dark mode with it. "system" means follow the OS.
 */
export declare function desiredColorScheme(theme: ReaderSettings["theme"]): "system" | ColorScheme;
export interface ReaderRootProps {
    "data-reader-theme": string;
    "data-pen": string;
    "data-highlighter": string;
    style: CSSProperties;
}
/**
 * Props for the element that wraps the reader: the theme, pen and highlighter
 * data attributes that reader.css keys off, and the typography custom
 * properties. Spread them on a wrapper to scope the reader to a subtree.
 */
export declare function readerRootProps(settings: Pick<ReaderSettings, "theme" | "pen" | "highlighter" | "typeface" | "size" | "spacing" | "width">, scheme: ColorScheme): ReaderRootProps;
/**
 * Applies the reader theme, pen and highlighter to <html> so every surface
 * (and portals such as popovers and toasts) can use the --reader-* tokens.
 * Apps that scope the reader to a wrapper use `readerRootProps` instead.
 */
export declare function useReaderTheme(settings: ThemeSettings, scheme: ColorScheme): void;
