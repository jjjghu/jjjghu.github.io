import { parseDocument } from 'yaml';

/** Read only YAML frontmatter, with bounded alias expansion and no custom types. */
export function readFrontmatter(source) {
    const match = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) return {};
    const document = parseDocument(match[1], { uniqueKeys: true });
    if (document.errors.length) throw document.errors[0];
    const value = document.toJS({ maxAliasCount: 50 });
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('Frontmatter must be a mapping');
    return value;
}
