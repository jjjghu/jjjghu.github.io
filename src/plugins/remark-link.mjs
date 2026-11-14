import { scanPosts } from "../utils/post-catalog.mjs";

export default function remarkLink() {
    // 題目映射表: problem_id -> { slug, title }
    const problemMap = new Map(scanPosts().filter((post) => post.problemId).map((post) => [post.problemId, post]));

    return (tree) => {
        function traverseAndReplace(node) {
            if (node.type === 'link' || node.type === 'linkReference') return;
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
