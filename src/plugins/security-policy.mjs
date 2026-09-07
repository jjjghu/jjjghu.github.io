import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, serialize, defaultTreeAdapter as adapter } from 'parse5';

export function secureHtml(html) {
    const document = parse(html);
    const hashes = new Set();
    let head;
    function visit(node) {
        if (node.tagName === 'head') head = node;
        if (node.tagName === 'script' && !node.attrs.some(attr => attr.name === 'src')) {
            const source = node.childNodes.map(child => child.value || '').join('');
            hashes.add(`'sha256-${createHash('sha256').update(source).digest('base64')}'`);
        }
        for (const child of node.childNodes || []) visit(child);
    }
    visit(document);
    if (!head) throw new Error('HTML output has no head');
    const policy = [
        "default-src 'self'",
        `script-src 'self' ${[...hashes].join(' ')}`,
        "script-src-attr 'none'",
        // Custom themes, syntax highlighting and layout controls require inline CSS.
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
        "frame-src 'none'",
    ].join('; ');
    const meta = adapter.createElement('meta', 'http://www.w3.org/1999/xhtml', [
        { name: 'http-equiv', value: 'Content-Security-Policy' },
        { name: 'content', value: policy },
    ]);
    // Place the policy before every resource and script, including public/*.html.
    adapter.insertBefore(head, meta, head.childNodes[0]);
    return serialize(document);
}

export default function securityPolicy() {
    return {
        name: 'static-security-policy',
        hooks: {
            'astro:build:done': async ({ dir }) => {
                async function visit(directory) {
                    for (const entry of await readdir(directory, { withFileTypes: true })) {
                        const filename = path.join(directory, entry.name);
                        if (entry.isDirectory()) await visit(filename);
                        else if (entry.isFile() && entry.name.endsWith('.html')) {
                            await writeFile(filename, secureHtml(await readFile(filename, 'utf8')));
                        }
                    }
                }
                await visit(fileURLToPath(dir));
            },
        },
    };
}
