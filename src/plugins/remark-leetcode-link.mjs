
import fs from 'fs';
import path from 'path';

// 簡單的遞迴遍歷函數，取代 unist-util-visit 以避免依賴問題
function visit(node, type, visitor) {
    if (node.type === type) {
        visitor(node);
    }
    if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            const result = visit(child, type, visitor);
            // 如果 visitor 修改了 children (例如把 text node 變成 array of nodes)，需要小心
            // 這裡我們簡化處理，因為我們只處理 text node 並且會直接修改 parent 的 children
        }
    }
}

// 建立題目映射表: problem_id -> { slug, title }
function createProblemMap() {
    const map = new Map();
    const leetcodeDir = path.join(process.cwd(), 'src/content/leetcode');

    if (!fs.existsSync(leetcodeDir)) return map;

    const files = fs.readdirSync(leetcodeDir);

    for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const content = fs.readFileSync(path.join(leetcodeDir, file), 'utf-8');

        // 簡單解析 frontmatter
        const idMatch = content.match(/problem_id:\s*["']?([^"'\n]+)["']?/);
        const titleMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/);

        if (idMatch) {
            const id = idMatch[1].trim();
            const title = titleMatch ? titleMatch[1].trim() : id;

            // 計算 slug: 檔名去掉副檔名，轉小寫，非英數元轉為 -
            // 注意：要配合 Astro 預設的 slug 生成邏輯或使用者的習慣
            // 這裡假設: 檔名 "215. Kth Largest..." -> "215-kth-largest..."
            const slug = file
                .replace(/\.md$/, '')
                .toLowerCase()
                .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-') // 保留中文，替換符號
                .replace(/^-+|-+$/g, ''); // 去頭去尾的 -

            map.set(id, { slug, title });
        }
    }
    return map;
}

export default function remarkLeetCodeLink() {
    const problemMap = createProblemMap();

    return (tree) => {
        // 我們需要對 tree 進行轉換。因為要分割 text node，手寫 traversal 比較容易控制 parent
        function traverseAndReplace(node) {
            if (!node.children) return;

            const newChildren = [];

            for (const child of node.children) {
                if (child.type === 'text') {
                    const regex = /\[\[(\d+)\]\]/g;
                    let lastIndex = 0;
                    let match;

                    let hasMatch = false;
                    while ((match = regex.exec(child.value)) !== null) {
                        hasMatch = true;
                        const [fullMatch, id] = match;
                        const start = match.index;

                        // 1. 加入前面的純文字
                        if (start > lastIndex) {
                            newChildren.push({
                                type: 'text',
                                value: child.value.slice(lastIndex, start)
                            });
                        }

                        // 2. 加入連結 Node
                        const problem = problemMap.get(id);
                        if (problem) {
                            newChildren.push({
                                type: 'link',
                                url: `/${problem.slug}`, // 假設根目錄路由
                                title: problem.title,
                                children: [
                                    { type: 'text', value: problem.title }
                                ]
                            });
                        } else {
                            // 找不到 ID，保留原樣但標示錯誤或僅保留文字
                            newChildren.push({
                                type: 'text',
                                value: fullMatch // 或者 `[[${id}]]`
                            });
                        }

                        lastIndex = start + fullMatch.length;
                    }

                    // 3. 加入剩餘的純文字
                    if (hasMatch) {
                        if (lastIndex < child.value.length) {
                            newChildren.push({
                                type: 'text',
                                value: child.value.slice(lastIndex)
                            });
                        }
                    } else {
                        newChildren.push(child);
                    }
                } else {
                    // 遞迴處理非 text node (例如 paragraph 內可能有 emphasis 等，雖然 [[id]] 通常是純文字)
                    traverseAndReplace(child);
                    newChildren.push(child);
                }
            }

            node.children = newChildren;
        }

        traverseAndReplace(tree);
    };
}
