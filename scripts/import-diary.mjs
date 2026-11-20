// 把日記原稿複製成「解題之外」的草稿。原稿不會被更動，已存在的草稿也不會被覆寫。
// 用法：node scripts/import-diary.mjs <日記檔或資料夾>...
// 草稿放在 src/content/beyond/drafts/（已列入 .gitignore，只在 npm run dev 看得到）。
// 要發布某一篇，把它從 drafts/ 搬到上一層的 src/content/beyond/。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const beyondDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/content/beyond');
const draftsDir = path.join(beyondDir, 'drafts');

const DATED_NAME = /^\d{4}_\d{2}_\d{2}/;
const DATE_LINE = /^\s*\d{4}\s*\/\s*\d{1,2}\s*\/\s*\d{1,2}\s*$/;
const ENDS_LIKE_SENTENCE = /[。，：；！？…,.:;!?]$/;

const DELIMITER = /^\\?(-{3,}|={3,})\s*$/;
const DIALOGUE = /^[A-Za-z]\s*[：:]/;

/**
 * 被一對 --- 包住的補充說明（※ 開頭）或 A、B 對話，改寫成 Markdown 引言，分隔記號本身拿掉；
 * 「解題之外」的版面把引言顯示成灰色段落。其他用途的 --- 不動。
 */
export function quoteNotes(lines) {
    const out = [];
    for (let i = 0; i < lines.length; i++) {
        const end = DELIMITER.test(lines[i]) ? lines.findIndex((line, j) => j > i && DELIMITER.test(line)) : -1;
        const inner = end > i ? lines.slice(i + 1, end) : [];
        const text = inner.filter((line) => line.trim());
        const isNote = text.length > 0 && inner.length <= 12 && (text[0].startsWith('※') || text.some((line) => DIALOGUE.test(line)));
        if (!isNote) {
            out.push(lines[i]);
            continue;
        }
        const first = inner.findIndex((line) => line.trim());
        const last = inner.findLastIndex((line) => line.trim());
        // 引言前後都要空一行，否則後面的文字會被併進引言
        if (out.length && out[out.length - 1].trim() !== '') out.push('');
        out.push(...inner.slice(first, last + 1).map((line) => (line.trim() ? `> ${line}` : '>')));
        if ((lines[end + 1] ?? '').trim() !== '') out.push('');
        i = end;
    }
    return out;
}

/** 原稿文字轉成草稿內容：拿掉開頭的日期行，緊接的短標題改放到 frontmatter。 */
export function convert(text) {
    let lines = text.replace(/^\u{FEFF}/u, '').split(/\r?\n/).map((line) => line.replace(/^[ \t]+/, ''));
    if (lines[0] === '---') return lines.join('\n'); // 已經有 frontmatter，原樣保留
    let title;
    const hadDateLine = DATE_LINE.test(lines[0] ?? '');
    if (hadDateLine) lines.shift();
    while (lines.length && lines[0].trim() === '') lines.shift();
    const first = (lines[0] ?? '').trim();
    const standsAlone = (lines[1] ?? '').trim() === '';
    // 兩種標題：整行用「」包起來的，或日期行之後獨立成段的短句
    if (/^「.+」$/.test(first) || (hadDateLine && standsAlone && first.length <= 30 && !ENDS_LIKE_SENTENCE.test(first))) {
        if (first !== '「」') title = first;
        lines.shift();
    }
    lines = quoteNotes(lines);
    // 其餘的 --- 或 === 是日記裡的分段記號。Markdown 會把它當成分隔線，緊貼文字時還會把上一行變成大標題，
    // 所以在行首加反斜線，讓它照原樣顯示成文字。
    for (let i = 0; i < lines.length; i++) {
        if (/^(-{3,}|={3,})\s*$/.test(lines[i])) lines[i] = '\\' + lines[i];
    }
    const body = lines.join('\n').trim() + '\n';
    return title ? `---\ntitle: ${JSON.stringify(title)}\n---\n\n${body}` : body;
}

function* sourceFiles(target) {
    if (fs.statSync(target).isDirectory()) {
        for (const name of fs.readdirSync(target)) {
            if (!name.startsWith('.')) yield* sourceFiles(path.join(target, name));
        }
    } else if (/\.(txt|md)$/i.test(target)) {
        yield target;
    }
}

function draftName(file) {
    const base = path.basename(file).replace(/\.(txt|md)$/i, '').trim().replace(/[\s()（）]+/g, '-').replace(/-+$/, '');
    // 檔名沒有日期的（例如主題資料夾裡的文章）加上資料夾名，避免撞名
    return DATED_NAME.test(base) ? base : `${path.basename(path.dirname(file))}-${base}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const targets = process.argv.slice(2);
    if (targets.length === 0) {
        console.error('用法：node scripts/import-diary.mjs <日記檔或資料夾>...');
        process.exit(1);
    }
    fs.mkdirSync(draftsDir, { recursive: true });
    let copied = 0;
    let skipped = 0;
    for (const file of targets.flatMap((target) => [...sourceFiles(target)])) {
        const name = `${draftName(file)}.md`;
        if (fs.existsSync(path.join(draftsDir, name)) || fs.existsSync(path.join(beyondDir, name))) {
            skipped++;
            continue;
        }
        fs.writeFileSync(path.join(draftsDir, name), convert(fs.readFileSync(file, 'utf8')));
        copied++;
    }
    console.log(`新增 ${copied} 篇草稿，略過 ${skipped} 篇已存在的。`);
}
