export {
  type Annotation,
  ArticleRenderer,
  type ArticleRendererProps,
} from "./article-renderer.js";
export {
  findMark,
  type HighlightDoc,
  type MarkKind,
  type PlacedMark,
  useHighlights,
} from "./highlights.js";
export {
  flashParagraph,
  getArticleBody,
  getParagraphs,
  paragraphIndexOf,
  paragraphText,
  useParagraphs,
} from "./paragraphs.js";
export {
  DEFAULT_SETTINGS,
  DEFAULT_STORAGE_KEY,
  DROP_CAP_FAMILIES,
  DROP_CAP_LINES,
  isDarkTheme,
  LINE_HEIGHTS,
  MAX_WIDTHS,
  parseReaderSettings,
  type Align,
  type AnswerDepth,
  type AnswerLength,
  type AnswerLevel,
  type DropCap,
  type HighlighterColor,
  type ParagraphStyle,
  type PenColor,
  type ReaderSettings,
  type ReaderTheme,
  SIZE_RANGE,
  type Spacing,
  TEXT_DEFAULTS,
  TYPEFACE_FAMILIES,
  type Typeface,
  type WebSearch,
  type Width,
  useReaderSettings,
  webSearchEnabled,
} from "./reader-settings.js";
export {
  findTextRange,
  normalizeText,
  rangeContainsPoint,
} from "./text-range.js";
export {
  type ColorScheme,
  desiredColorScheme,
  type ReaderRootProps,
  readerRootProps,
  resolveReaderTheme,
  useReaderTheme,
} from "./theme.js";
