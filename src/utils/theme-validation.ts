import { parse, walk } from "css-tree";

export const MAX_THEMES = 20;
export const MAX_THEME_CSS = 100_000;

export interface CustomTheme {
  id: string;
  name: string;
  tags: string[];
  css: string;
}

/** Custom themes may style the page but cannot load resources. */
export function validateThemeCss(css: unknown): css is string {
  if (typeof css !== "string" || !css.trim() || css.length > MAX_THEME_CSS) return false;
  // Reject escaped identifiers so resource-loading constructs cannot be disguised.
  if (/[\\\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(css)) return false;
  try {
    const ast = parse(css, { parseCustomProperty: true, onParseError(error) { throw error; } });
    let valid = true;
    walk(ast, (node) => {
      if (node.type === "Url" || node.type === "Raw") valid = false;
      if (node.type === "Atrule" && !["media", "supports", "container", "layer", "keyframes", "-webkit-keyframes", "scope", "starting-style"].includes(node.name.toLowerCase())) valid = false;
      if (node.type === "Function" && ["url", "src", "image", "image-set", "-webkit-image-set", "expression", "attr"].includes(node.name.toLowerCase())) valid = false;
      if (node.type === "Declaration" && ["behavior", "-moz-binding"].includes(node.property.toLowerCase())) valid = false;
    });
    return valid;
  } catch { return false; }
}

export function parseCustomThemes(raw: string | null): CustomTheme[] {
  if (!raw || raw.length > MAX_THEMES * (MAX_THEME_CSS + 10_000)) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || data.length > MAX_THEMES) return [];
    const ids = new Set<string>();
    const themes: CustomTheme[] = [];
    for (const item of data) {
      if (!item || typeof item !== "object" || typeof item.id !== "string" ||
          !/^custom-[a-zA-Z0-9-]{1,80}$/.test(item.id) || ids.has(item.id) ||
          typeof item.name !== "string" || !item.name.trim() || item.name.length > 100 ||
          !Array.isArray(item.tags) || item.tags.length > 20 ||
          !item.tags.every((tag: unknown) => typeof tag === "string" && tag.length <= 50) ||
          !validateThemeCss(item.css)) continue;
      ids.add(item.id);
      themes.push({ id: item.id, name: item.name, tags: item.tags, css: item.css });
    }
    return themes;
  } catch { return []; }
}
