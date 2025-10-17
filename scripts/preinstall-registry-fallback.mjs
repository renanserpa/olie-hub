// scripts/preinstall-registry-fallback.mjs
import { execSync } from "node:child_process";

function setRegistry(url) {
  try {
    execSync(`npm config set registry ${url}`, { stdio: "inherit" });
    console.log(`[preinstall] registry set to: ${url}`);
  } catch (e) {
    console.error("[preinstall] failed to set registry:", e?.message || e);
  }
}

function setNetTweaks() {
  const cmds = [
    "npm config set fetch-retries 5",
    "npm config set fetch-retry-factor 2",
    "npm config set fetch-retry-maxtimeout 60000",
    "npm config set fetch-retry-mintimeout 1000",
    "npm config set prefer-offline true",
    "npm config set audit false",
    "npm config set fund false",
    "npm config set strict-ssl true",
  ];
  for (const c of cmds) {
    try {
      execSync(c, { stdio: "inherit" });
    } catch {}
  }
}

function ping() {
  try {
    execSync("npm ping", { stdio: "inherit" });
    return true;
  } catch (e) {
    console.warn("[preinstall] npm ping failed:", e?.message || e);
    return false;
  }
}

setNetTweaks();

// 1ª tentativa: npmjs oficial
setRegistry("https://registry.npmjs.org/");
if (!ping()) {
  // Fallback: npmmirror
  setRegistry("https://registry.npmmirror.com/");
  // 2ª tentativa
  ping(); // ignore resultado, seguimos com o que der
}
