# @planetaryescape/reader

The reading surface shared by [Marginalia](https://github.com/planetaryescape/marginalia) and [mxr](https://github.com/planetaryescape/mxr): render a cleaned article, draw saved quotes over it, and theme it with plain CSS. React 19 is a peer dependency. Licensed MIT OR Apache-2.0.

The package renders HTML it is given and never decides whether that HTML is safe. You pass `sanitize`, so each app keeps its own trust policy.

## Install

Releases are git tags with `dist/` committed, so no build runs on install:

```sh
npm install github:planetaryescape/reader#v0.1.3
```

```css
@import "@planetaryescape/reader/reader.css";
```

## Render an article

```tsx
import { ArticleRenderer, readerRootProps, useHighlights, useParagraphs } from "@planetaryescape/reader";
import "@planetaryescape/reader/reader.css";

function Article({ item, settings, scheme }) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState("");
  const { version } = useParagraphs(ref, true);
  const docs = useMemo(() => item.highlights.map((h) => ({ text: h.quote, kind: "highlight" as const })), [item]);
  useHighlights({ containerRef: ref, docs, version });

  return (
    <div className="reader-root" {...readerRootProps(settings, scheme)}>
      <div ref={ref}>
        <ArticleRenderer
          content={item.text}
          contentHtml={item.html ?? ""}
          sanitize={mySanitize}
          annotations={[]}
          activeAnnotationId={null}
          onAnnotationSelect={() => {}}
        />
      </div>
    </div>
  );
}
```

`mySanitize(html: string): string` runs in the browser after mount. Whatever it returns is inserted with `innerHTML`, so it is the XSS boundary. Memoise the `docs` array you give `useHighlights`.

## API

Components and hooks (modules with hooks start with `"use client"`):

- `ArticleRenderer`: props `content`, `contentHtml`, `sanitize` (required), `annotations`, `activeAnnotationId`, `onAnnotationSelect`, `onViewed?(annotationId)`, `className?` (added after `reader-prose` on the body), `wrapperClassName?`. Renders `<div data-reader-article class="reader-article">` (the class is `wrapperClassName` when given) around `<div data-article-body class="reader-prose">`. Code in the article keeps the app's own monospace font. An empty `contentHtml` falls back to sanitizing `content`.
- `useParagraphs(containerRef, ready)` numbers leaf blocks with `data-para` and marks the drop-cap paragraph. Returns `{ count, version }`.
- `useHighlights({ containerRef, docs, version })` finds each `{ text, kind, paragraphIndex? }` in the article by its text, registers the ranges with the CSS Custom Highlight API (`::highlight(user-highlight)`, `user-underline`) and selects a mark on click. Does nothing where the API is missing.
- `useReaderSettings(storageKey?)` keeps `ReaderSettings` in localStorage (default key `reader:settings`) across tabs. `parseReaderSettings` repairs stored values field by field.
- `readerRootProps(settings, scheme)` returns the `data-reader-theme`, `data-pen`, `data-highlighter` attributes and `--reader-font/size/leading/max-width` for a wrapper. `useReaderTheme(settings, scheme)` sets the attributes on `<html>` instead. `resolveReaderTheme` turns `auto` into `night` or `paper`; `desiredColorScheme` says which app scheme a theme needs.

Pure helpers: `findTextRange`, `normalizeText`, `rangeContainsPoint`, `findMark`, `getArticleBody`, `getParagraphs`, `paragraphText`, `paragraphIndexOf`, `flashParagraph`. Settings model: `DEFAULT_SETTINGS`, `DEFAULT_STORAGE_KEY`, `TEXT_DEFAULTS`, `TYPEFACE_FAMILIES`, `DROP_CAP_FAMILIES`, `DROP_CAP_LINES`, `LINE_HEIGHTS`, `MAX_WIDTHS`, `SIZE_RANGE`, `isDarkTheme`, `webSearchEnabled` and the setting types.

## CSS

`reader.css` has no dependencies. Six themes (`paper`, `sepia`, `snow`, `dusk`, `night`, `ink`) set `--reader-bg`, `--reader-surface`, `--reader-fg`, `--reader-fg-soft`, `--reader-muted`, `--reader-border`, `--reader-border-strong`, `--reader-chip`, `--pen` and `--highlighter` on any element carrying `data-reader-theme`; add the `reader-root` class to a wrapper that should also paint its own background and text colour. Article styles key on the wrapper's `data-reader-article` attribute, not its class. Article typography is written inside `:where()` so it has no specificity: a Tailwind class or app rule overrides it. Font stacks come from `--reader-font`, which `TYPEFACE_FAMILIES` fills with `var(--font-newsreader)` style names. Define those variables, or set `--reader-font` yourself, to get the fonts you want; the fallbacks are system serif and sans.

## Development

```sh
bun install
bun run typecheck && bun run test
bun run build:dist   # tsc -> dist/, copies reader.css
bun run check:dist   # fails when dist/ differs from a fresh build
```

`dist/` is committed because git-tag installs skip build scripts. Rebuild and commit it with every source change.
