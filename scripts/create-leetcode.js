
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('請提供 LeetCode URL 或 題目Slug (例如: two-sum)');
    process.exit(1);
}

const input = args[0];
// Extract slug from URL or use as is
// Handles:
// https://leetcode.com/problems/two-sum/
// https://leetcode.cn/problems/two-sum/
// two-sum
let slug = input.replace(/\/$/, '').split('/').pop();

async function fetchFromLeetCodeCN(slug) {
    const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        translatedTitle
        titleSlug
        difficulty
        topicTags {
          name
          slug
          translatedName
        }
      }
    }
  `;

    try {
        const response = await fetch('https://leetcode.cn/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 1. 更新 User-Agent 為現代瀏覽器
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // 2. 加入 Referer 模仿從官網進入
                'Referer': 'https://leetcode.cn/problemset/all/',
                'Origin': 'https://leetcode.cn',
                // 3. 增加接受的語言，有助於避開基礎檢查
                'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            body: JSON.stringify({
                query,
                variables: { titleSlug: slug }
            })
        });

        // 先檢查 HTTP 狀態碼
        if (!response.ok) {
            console.error(`HTTP 錯誤: ${response.status}`);
            return null;
        }

        const text = await response.text();

        // 檢查是否回傳了 HTML 而不是 JSON
        if (text.trim().startsWith('<!DOCTYPE')) {
            console.error('LeetCode 回傳了 HTML 頁面而非資料（可能是被防火牆阻擋或需要驗證）。');
            return null;
        }

        const json = JSON.parse(text);
        return json.data.question;
    } catch (e) {
        console.error('抓取 leetcode.cn 時發生錯誤:', e.message);
        return null;
    }
}

async function main() {
    console.log(`正在獲取題目資訊: ${slug}...`);
    let data = await fetchFromLeetCodeCN(slug);

    if (!data) {
        console.error('無法獲取題目資訊。請確認 slug 是否正確，或檢查網路連線。');
        process.exit(1);
    }

    const { questionFrontendId, title, translatedTitle, difficulty, topicTags } = data;

    const cnTitle = translatedTitle || title;
    const enTitle = title;
    const diff = difficulty.toLowerCase();
    // Ensure "array" -> "array", etc. Usually they are consistent.
    const tags = topicTags ? topicTags.map(t => t.slug) : [];
    const date = new Date().toISOString().split('T')[0];

    const fileContent = `---
category: "leetcode"

title: "${questionFrontendId}. ${cnTitle}"
en_title: "${questionFrontendId}. ${enTitle}"

problem_id: "${questionFrontendId}"
difficulty: "${diff}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]

link: "https://leetcode.cn/problems/${slug}/description/"
en_link: "https://leetcode.com/problems/${slug}/description/"
date: "${date}"
---
小貼士：
## 思路

## 程式碼
### 1.
\`\`\````cpp
    \`\`\`
## 複雜度分析
- 時間複雜度：
- 空間複雜度：
`;

    const targetDir = path.resolve(__dirname, '../src/content/leetcode');

    // Filename: <id>. <en_title>.md
    // Remove special characters forbidden in Windows filenames
    const safeTitle = enTitle.replace(/[<>:"/\\|?*]/g, '');
    const fileName = `${questionFrontendId}. ${safeTitle}.md`;
    const filePath = path.join(targetDir, fileName);

    if (fs.existsSync(filePath)) {
        console.error(`檔案已存在: ${filePath}`);
        process.exit(1);
    }

    // Ensure directory exists (it should, but good practice)
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(filePath, fileContent);
    console.log(`成功創建: ${filePath}`);
}

main();
