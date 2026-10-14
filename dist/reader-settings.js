"use client";
import { useCallback, useSyncExternalStore } from "react";
import { z } from "zod";
const DARK_THEMES = new Set(["dusk", "night", "ink"]);
/** Explicit themes that need the app's dark mode; "auto" follows the system. */
export function isDarkTheme(theme) {
    return DARK_THEMES.has(theme);
}
export const TEXT_DEFAULTS = {
    typeface: "serif",
    size: 20,
    spacing: "even",
    width: "even",
    align: "left",
    paragraphs: "spaced",
    dropCap: "text",
    dropCapLines: 3,
};
export const DROP_CAP_LINES = [2, 3, 4, 5];
export const DROP_CAP_FAMILIES = {
    text: "var(--reader-font)",
    ornate: "var(--font-cinzel-decorative), var(--font-newsreader), serif",
    gothic: "var(--font-unifraktur), var(--font-newsreader), serif",
};
export const DEFAULT_SETTINGS = {
    theme: "auto",
    pen: "cobalt",
    highlighter: "yellow",
    numbers: false,
    map: true,
    focus: false,
    ...TEXT_DEFAULTS,
    answerLength: "standard",
    answerLevel: "balanced",
    answerDepth: "quick",
    webSearch: "deep",
};
/** Whether the model may search the web for an answer at this depth. */
export function webSearchEnabled(settings) {
    return (settings.webSearch === "always" ||
        (settings.webSearch === "deep" && settings.answerDepth === "deep"));
}
export const SIZE_RANGE = { min: 14, max: 28 };
export const TYPEFACE_FAMILIES = {
    serif: "var(--font-newsreader), Georgia, serif",
    book: "var(--font-literata), Georgia, serif",
    sans: "var(--font-dm-sans), system-ui, sans-serif",
    legible: "var(--font-atkinson), system-ui, sans-serif",
};
export const LINE_HEIGHTS = {
    snug: 1.55,
    even: 1.8,
    airy: 2.05,
};
export const MAX_WIDTHS = {
    narrow: "36rem",
    even: "42rem",
    wide: "50rem",
};
/** Where `useReaderSettings` keeps preferences unless the app passes its own key. */
export const DEFAULT_STORAGE_KEY = "reader:settings";
const settingsSchema = z.object({
    theme: z
        .enum(["auto", "paper", "sepia", "snow", "dusk", "night", "ink"])
        .catch(DEFAULT_SETTINGS.theme),
    pen: z
        .enum(["vermilion", "cobalt", "forest", "graphite"])
        .catch(DEFAULT_SETTINGS.pen),
    highlighter: z
        .enum(["yellow", "green", "blue", "pink"])
        .catch(DEFAULT_SETTINGS.highlighter),
    numbers: z.boolean().catch(DEFAULT_SETTINGS.numbers),
    map: z.boolean().catch(DEFAULT_SETTINGS.map),
    focus: z.boolean().catch(DEFAULT_SETTINGS.focus),
    typeface: z
        .enum(["serif", "book", "sans", "legible"])
        .catch(DEFAULT_SETTINGS.typeface),
    size: z
        .number()
        .finite()
        .min(SIZE_RANGE.min)
        .max(SIZE_RANGE.max)
        .catch(DEFAULT_SETTINGS.size),
    spacing: z.enum(["snug", "even", "airy"]).catch(DEFAULT_SETTINGS.spacing),
    width: z.enum(["narrow", "even", "wide"]).catch(DEFAULT_SETTINGS.width),
    align: z.enum(["left", "justify"]).catch(DEFAULT_SETTINGS.align),
    paragraphs: z.enum(["spaced", "indented"]).catch(DEFAULT_SETTINGS.paragraphs),
    dropCap: z
        .enum(["off", "text", "ornate", "gothic"])
        .catch(DEFAULT_SETTINGS.dropCap),
    dropCapLines: z
        .number()
        .int()
        .min(2)
        .max(5)
        .catch(DEFAULT_SETTINGS.dropCapLines),
    answerLength: z
        .enum(["brief", "standard", "detailed"])
        .catch(DEFAULT_SETTINGS.answerLength),
    answerLevel: z
        .enum(["plain", "balanced", "expert"])
        .catch(DEFAULT_SETTINGS.answerLevel),
    answerDepth: z.enum(["quick", "deep"]).catch(DEFAULT_SETTINGS.answerDepth),
    webSearch: z
        .enum(["off", "deep", "always"])
        .catch(DEFAULT_SETTINGS.webSearch),
});
/** Stored preferences may outlive the version that wrote them. Repair per field. */
export function parseReaderSettings(value) {
    const parsed = settingsSchema.safeParse(value);
    return parsed.success ? parsed.data : { ...DEFAULT_SETTINGS };
}
// One store per storage key, so two readers on a page never share a cache.
const stores = new Map();
function storeFor(key) {
    const existing = stores.get(key);
    if (existing)
        return existing;
    const listeners = new Set();
    let cached = null;
    const store = {
        read() {
            if (cached)
                return cached;
            try {
                const raw = window.localStorage.getItem(key);
                cached = parseReaderSettings(raw ? JSON.parse(raw) : {});
            }
            catch {
                cached = DEFAULT_SETTINGS;
            }
            return cached;
        },
        write(next) {
            cached = next;
            try {
                window.localStorage.setItem(key, JSON.stringify(next));
            }
            catch {
                // Private mode or full storage: keep the in-memory value for this session.
            }
            for (const listener of listeners)
                listener();
        },
        subscribe(listener) {
            listeners.add(listener);
            const onStorage = (e) => {
                if (e.key !== key && e.key !== null)
                    return;
                cached = null;
                listener();
            };
            window.addEventListener("storage", onStorage);
            return () => {
                listeners.delete(listener);
                window.removeEventListener("storage", onStorage);
            };
        },
    };
    stores.set(key, store);
    return store;
}
/** Reader preferences kept in localStorage and shared across tabs. */
export function useReaderSettings(storageKey = DEFAULT_STORAGE_KEY) {
    const store = storeFor(storageKey);
    const settings = useSyncExternalStore(store.subscribe, store.read, () => DEFAULT_SETTINGS);
    const update = useCallback((patch) => {
        store.write({ ...store.read(), ...patch });
    }, [store]);
    const resetText = useCallback(() => {
        store.write({ ...store.read(), ...TEXT_DEFAULTS });
    }, [store]);
    return { settings, update, resetText };
}
