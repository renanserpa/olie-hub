import { execSync } from "node:child_process";

const registries = [
  "https://registry.npmjs.org/",
  "https://registry.npmmirror.com/",
];

const isCi = Boolean(process.env.CI) || Boolean(process.env.LOVABLE) || process.env.NODE_ENV === "production";

function configureOmit() {
  try {
    if (isCi) {
      execSync("npm config set omit dev --location=project", { stdio: "inherit" });
      console.log("[registry-check] CI detectado: omit dev dependencies");
    } else {
      execSync("npm config delete omit --location=project", { stdio: "ignore" });
    }
  } catch (e) {
    console.warn(`[registry-check] Não foi possível ajustar omit: ${e?.message || e}`);
  }
}

function tryRegistry(reg) {
  try {
    execSync(`npm config set registry ${reg}`, { stdio: "inherit" });
    execSync(`npm ping --registry=${reg}`, { stdio: "inherit", timeout: 15000 });
    console.log(`[registry-check] OK -> ${reg}`);
    return true;
  } catch (e) {
    console.warn(`[registry-check] Falha em ${reg}: ${e?.message || e}`);
    return false;
  }
}

configureOmit();

for (const reg of registries) {
  if (tryRegistry(reg)) {
    process.exit(0);
  }
}

execSync(`npm config set registry https://registry.npmjs.org/`, { stdio: "inherit" });
console.warn("[registry-check] Nenhum registry respondeu; deixei npmjs configurado por padrão.");
