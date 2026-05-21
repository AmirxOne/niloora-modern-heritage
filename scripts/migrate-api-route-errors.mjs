import fs from "node:fs";
import path from "node:path";

const apiRoot = path.join(process.cwd(), "src", "app", "api");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name === "route.ts") files.push(full);
  }
  return files;
}

function toApiRoute(filePath) {
  const rel = filePath
    .replace(/\\/g, "/")
    .replace(/^.*\/src\/app/, "")
    .replace(/\/route\.ts$/, "");
  return rel || "/api";
}

for (const file of walk(apiRoot)) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes("console.error(error);")) continue;

  const apiRoute = toApiRoute(file);

  if (!content.includes("handleRouteError")) {
    if (content.includes('from "@/lib/server/http"')) {
      content = content.replace(
        'from "@/lib/server/http"',
        'from "@/lib/server/http"\nimport { handleRouteError } from "@/lib/server/route-errors"'
      );
    } else if (content.includes("from '@/lib/server/http'")) {
      content = content.replace(
        "from '@/lib/server/http'",
        "from '@/lib/server/http'\nimport { handleRouteError } from '@/lib/server/route-errors'"
      );
    } else {
      content = `import { handleRouteError } from "@/lib/server/route-errors";\n${content}`;
    }
  }

  content = content.replace(
    /\r?\n\s*console\.error\(error\);\r?\n\s*return serverError\(\);/g,
    `\n    return handleRouteError(error, { route: "${apiRoute}" });`
  );

  fs.writeFileSync(file, content);
  console.log("updated", apiRoute);
}
