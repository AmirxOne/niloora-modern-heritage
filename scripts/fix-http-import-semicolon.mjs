import fs from "node:fs";
import path from "node:path";

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name === "route.ts") files.push(full);
  }
  return files;
}

const apiRoot = path.join(process.cwd(), "src", "app", "api");
let fixed = 0;

for (const file of walk(apiRoot)) {
  const content = fs.readFileSync(file, "utf8");
  const next = content.replace(
    /from "@\/lib\/server\/http"\r?\nimport \{ handleRouteError \}/g,
    'from "@/lib/server/http";\nimport { handleRouteError }'
  );
  if (next !== content) {
    fs.writeFileSync(file, next);
    fixed += 1;
  }
}

console.log(`fixed ${fixed} files`);
