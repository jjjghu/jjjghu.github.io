import fs from "fs";
import path from "path";
import { fileToSlug } from "../utils/slug-generator.mjs";

// 建立題目映射表: problem_id -> { slug, title }
function createProblemMap() {
    const map = new Map();
    const contentDirs = ["leetcode", "zerojudge"];

    contentDirs.forEach((dir) => {
        const fullDir = path.join(process.cwd(), `src/content/${dir}`);

        if (!fs.existsSync(fullDir)) return;

        const files = fs.readdirSync(fullDir);

        for (const file of files) {
            if (!file.endsWith(".md")) continue;

            const content = fs.readFileSync(path.join(fullDir, file), "utf-8");

            const idMatch = content.match(/problem_id:\s*["']?([^"'\n]+)["']?/);
            const titleMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/);

            if (!idMatch) continue;

            const id = idMatch[1].trim();
            const title = titleMatch ? titleMatch[1].trim() : id;

            // 用與 Astro 相同的 slug 邏輯，避免 [[ ]] 連結與實際路由不一致
            map.set(id, { slug: fileToSlug(file, id), title });
        }
    });

    return map;
}

export default function remarkLink() {
    const problemMap = createProblemMap();

    return (tree) => {
        function traverseAndReplace(node) {
            if (!node.children) return;

            const newChildren = [];

            for (const child of node.children) {
                if (child.type === "text") {
                    // 改用 \S+ 去匹配包含字母跟數字的 problem id，但需避開中括號
                    const regex = /\[\[([a-zA-Z0-9_-]+)\]\]/g;
                    let lastIndex = 0;
                    let match;
                    let hasMatch = false;

                    while ((match = regex.exec(child.value)) !== null) {
                        hasMatch = true;
                        const [fullMatch, id] = match;
                        const start = match.index;

                        if (start > lastIndex) {
                            newChildren.push({
                                type: "text",
                                value: child.value.slice(lastIndex, start),
                            });
                        }

                        const problem = problemMap.get(id);
                        if (problem) {
                            newChildren.push({
                                type: "link",
                                url: `/${problem.slug}`,
                                title: problem.title,
                                children: [{ type: "text", value: problem.title }],
                            });
                        } else {
                            newChildren.push({ type: "text", value: fullMatch });
                        }

                        lastIndex = start + fullMatch.length;
                    }

                    if (hasMatch) {
                        if (lastIndex < child.value.length) {
                            newChildren.push({
                                type: "text",
                                value: child.value.slice(lastIndex),
                            });
                        }
                    } else {
                        newChildren.push(child);
                    }
                } else {
                    traverseAndReplace(child);
                    newChildren.push(child);
                }
            }

            node.children = newChildren;
        }

        traverseAndReplace(tree);
    };
}
