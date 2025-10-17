// scripts/codemod-remove-tablemanager-generics.mjs
import fs from "node:fs";
import path from "node:path";

const exts = new Set([".tsx", ".ts", ".jsx", ".js"]);
const root = path.resolve("src");

let changed = 0;

function processFile(p) {
  let src = fs.readFileSync(p, "utf8");
  const before = src;

  // Remove qualquer genérico logo após <TableManager, aceitando espaços/linhas
  // Ex: <TableManager   <Tipo>, <TableManager< Tipo >, com ou sem props depois
  src = src.replace(
    /<TableManager\s*<[\s\S]*?>/g,
    (m) => m.replace(/<TableManager\s*<[\s\S]*?>/, "<TableManager"),
  );

  // Fallback: casos simples em linha única
  src = src.replace(/<TableManager<[^>\s]+/g, "<TableManager");

  if (src !== before) {
    fs.writeFileSync(p, src, "utf8");
    changed++;
    console.log("[codemod] patched:", p);
  }
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      walk(p);
    } else if (exts.has(path.extname(p))) {
      processFile(p);
    }
  }
}

walk(root);
console.log(`[codemod] arquivos alterados: ${changed}`);
