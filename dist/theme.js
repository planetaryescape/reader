"use client";
import { useEffect } from "react";
import { isDarkTheme, LINE_HEIGHTS, MAX_WIDTHS, TYPEFACE_FAMILIES, } from "./reader-settings.js";
/** The concrete theme to draw: "auto" becomes night or paper by the app's scheme. */
export function resolveReaderTheme(theme, scheme) {
    if (theme !== "auto")
        return theme;
    return scheme === "dark" ? "night" : "paper";
}
/**
 * The app colour scheme an explicit reader theme needs, for apps that switch
 * their own light/dark mode with it. "system" means follow the OS.
 */
export function desiredColorScheme(theme) {
    if (theme === "auto")
        return "system";
    return isDarkTheme(theme) ? "dark" : "light";
}
/**
 * Props for the element that wraps the reader: the theme, pen and highlighter
 * data attributes that reader.css keys off, and the typography custom
 * properties. Spread them on a wrapper to scope the reader to a subtree.
 */
export function readerRootProps(settings, scheme) {
    return {
        "data-reader-theme": resolveReaderTheme(settings.theme, scheme),
        "data-pen": settings.pen,
        "data-highlighter": settings.highlighter,
        // SAFETY: CSSProperties has no index signature for custom properties; these are plain strings.
        style: {
            "--reader-font": TYPEFACE_FAMILIES[settings.typeface],
            "--reader-size": `${settings.size}px`,
            "--reader-leading": String(LINE_HEIGHTS[settings.spacing]),
            "--reader-max-width": MAX_WIDTHS[settings.width],
        },
    };
}
/**
 * Applies the reader theme, pen and highlighter to <html> so every surface
 * (and portals such as popovers and toasts) can use the --reader-* tokens.
 * Apps that scope the reader to a wrapper use `readerRootProps` instead.
 */
export function useReaderTheme(settings, scheme) {
    useEffect(() => {
        const html = document.documentElement;
        html.dataset.readerTheme = resolveReaderTheme(settings.theme, scheme);
        html.dataset.pen = settings.pen;
        html.dataset.highlighter = settings.highlighter;
        return () => {
            delete html.dataset.readerTheme;
            delete html.dataset.pen;
            delete html.dataset.highlighter;
        };
    }, [settings.theme, settings.pen, settings.highlighter, scheme]);
}
