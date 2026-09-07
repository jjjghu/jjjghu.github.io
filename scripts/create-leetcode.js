import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stringify } from 'yaml';

const CONTENT_DIR = fileURLToPath(new URL('../src/content/leetcode/', import.meta.url));
const MAX_RESPONSE_BYTES = 1_000_000;

export function parseProblemSlug(input) {
    if (typeof input !== 'string' || input.length > 2048) throw new Error('Invalid problem URL or slug');
    let slug = input;
    if (input.includes('://')) {
        const url = new URL(input);
        if (url.protocol !== 'https:' || !['leetcode.com', 'leetcode.cn'].includes(url.hostname) ||
            url.username || url.password || url.port) throw new Error('Expected an HTTPS LeetCode URL');
        const match = url.pathname.match(/^\/problems\/([a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)(?:\/(?:description|solutions|submissions|discuss))?\/?$/);
        if (!match) throw new Error('Invalid LeetCode problem path');
        slug = match[1];
    }
    if (!/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(slug) || slug.length > 200) throw new Error('Invalid problem slug');
    return slug;
}

function requireText(value, field, max = 200) {
    if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) {
        throw new Error(`Invalid ${field} in LeetCode response`);
    }
    return value.trim();
}

export function validateQuestion(value) {
    if (!value || typeof value !== 'object') throw new Error('Question not found');
    const id = requireText(value.questionFrontendId, 'questionFrontendId', 60);
    if (/[<>:"/\\|?*]/.test(id) || id === '.' || id === '..') throw new Error('Unsafe problem ID');
    const title = requireText(value.title, 'title');
    const translatedTitle = value.translatedTitle ? requireText(value.translatedTitle, 'translatedTitle') : title;
    const difficulty = requireText(value.difficulty, 'difficulty').toLowerCase();
    if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new Error('Unknown difficulty');
    if (!Array.isArray(value.topicTags) || value.topicTags.length > 100) throw new Error('Invalid topic tags');
    const tags = value.topicTags.map(tag => requireText(tag?.slug, 'tag', 100));
    return { id, title, translatedTitle, difficulty, tags };
}

export async function fetchQuestion(slug, fetchImpl = fetch) {
    const response = await fetchImpl('https://leetcode.cn/graphql', {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            query: `query questionData($titleSlug: String!) {
                question(titleSlug: $titleSlug) {
                    questionFrontendId title translatedTitle difficulty topicTags { slug }
                }
            }`,
            variables: { titleSlug: parseProblemSlug(slug) },
        }),
    });
    if (!response.ok) throw new Error(`LeetCode HTTP ${response.status}`);
    if (!response.headers.get('content-type')?.includes('application/json') || !response.body) throw new Error('LeetCode did not return JSON');
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > MAX_RESPONSE_BYTES) throw new Error('LeetCode response is too large');
            chunks.push(value);
        }
    } finally {
        await reader.cancel();
        reader.releaseLock();
    }
    const json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (json.errors?.length) throw new Error('LeetCode GraphQL request failed');
    validateQuestion(json.data?.question);
    return json.data.question;
}

export function createNote(data, slug, targetDir = CONTENT_DIR, date = new Date()) {
    slug = parseProblemSlug(slug);
    const question = validateQuestion(data);
    const frontmatter = stringify({
        category: 'leetcode',
        title: `${question.id}. ${question.translatedTitle}`,
        en_title: `${question.id}. ${question.title}`,
        problem_id: question.id,
        difficulty: question.difficulty,
        tags: question.tags,
        link: `https://leetcode.cn/problems/${slug}/description/`,
        en_link: `https://leetcode.com/problems/${slug}/description/`,
        date: date.toISOString().slice(0, 10),
    });
    const title = question.title.replace(/[<>:"/\\|?*]/g, '').replace(/[. ]+$/, '');
    if (!title) throw new Error('Title cannot be used as a filename');
    const filename = `${question.id}. ${title}.md`;
    if (filename.length > 240 || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])\./i.test(filename)) throw new Error('Unsupported filename');
    mkdirSync(targetDir, { recursive: true });
    const directory = realpathSync(targetDir);
    const filepath = path.resolve(directory, filename);
    if (path.dirname(filepath) !== directory) throw new Error('Filename escapes content directory');
    const body = '\n## 思路\n\n## 程式碼\n\n```cpp\n\n```\n\n## 複雜度分析\n- 時間複雜度：\n- 空間複雜度：\n';
    // Exclusive creation also rejects an existing symlink instead of following it.
    writeFileSync(filepath, `---\n${frontmatter}---\n${body}`, { encoding: 'utf8', flag: 'wx' });
    return filepath;
}

async function main() {
    const slug = parseProblemSlug(process.argv[2]);
    const data = await fetchQuestion(slug);
    console.log(`Created: ${createNote(data, slug)}`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
    main().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
