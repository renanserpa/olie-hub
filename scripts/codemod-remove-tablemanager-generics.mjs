// scripts/codemod-remove-tablemanager-generics.mjs
import fs from "node:fs";
import path from "node:path";

const exts = new Set([".tsx", ".ts", ".jsx", ".js"]);
const root = path.resolve("src");

let changed = 0;

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      walk(p);
    } else if (exts.has(path.extname(p))) {
      let src = fs.readFileSync(p, "utf8");
      const before = src;
      // remove genéricos imediatamente após o nome do componente
      // <TableManager<QualquerCoisa ...  ->  <TableManager ...
      src = src.replace(/<TableManager<[^>\s]+/g, "<TableManager");
      if (src !== before) {
        fs.writeFileSync(p, src, "utf8");
        changed++;
        console.log("[codemod] patched:", p);
      }
    }
  }
}

walk(root);
console.log(`[codemod] arquivos alterados: ${changed}`);
