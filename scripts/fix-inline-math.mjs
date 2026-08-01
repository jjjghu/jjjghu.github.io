import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node fix-inline-math.mjs <file>");
  process.exit(1);
}

let text = readFileSync(file, "utf8");
// $$x$$ 誤寫成 block 語法但其實是同一行內的 inline math -> 轉成 $x$
text = text.replace(/\$\$(.*?)\$\$/g, (_, p1) => " \\$" + p1 + "\\$ ");
text = text.replace(/\\\$/g, () => "$");
writeFileSync(file, text);
