import fs from "node:fs";
import path from "node:path";

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".ts")) files.push(full);
  }
  return files;
}

let fixed = 0;
for (const file of walk(path.join(process.cwd(), "src", "app", "api"))) {
  const content = fs.readFileSync(file, "utf8");
  if (!content.includes("`n")) continue;
  const next = content.replaceAll(";`n", ";\n");
  fs.writeFileSync(file, next);
  fixed += 1;
}

console.log(`fixed ${fixed} files`);
