#!/usr/bin/env node
/**
 * generate-openapi.mjs
 * Scans Next.js App Router (app/api/**\/route.ts) and generates openapi.json
 * Reads: JSDoc @openapi comments + Zod schemas (basic inference)
 *
 * Usage:
 *   node generate-openapi.mjs
 *   node generate-openapi.mjs --out ./docs/openapi.json
 *   node generate-openapi.mjs --base-url https://api.myapp.com
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const APP_DIR = path.resolve(getArg("--app-dir") || "./app");
const OUT_FILE = path.resolve(getArg("--out") || "./openapi.json");
const BASE_URL = getArg("--base-url") || "http://localhost:3000";

// ─── HTTP Methods supported by Next.js App Router ────────────────────────────
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Recursively find all route.ts / route.js files */
function findRouteFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findRouteFiles(full, files);
    } else if (entry.isFile() && /^route\.(ts|js)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

/** Convert file path → OpenAPI path string
 *  app/api/auth/send-otp/route.ts  →  /api/auth/send-otp
 *  app/api/rides/[id]/route.ts     →  /api/rides/{id}
 */
function fileToApiPath(filePath) {
  const rel = path.relative(APP_DIR, filePath);           // api/auth/send-otp/route.ts
  const withoutFile = rel.replace(/[/\\]route\.(ts|js)$/, ""); // api/auth/send-otp
  const apiPath = "/" + withoutFile.replace(/\\/g, "/");  // /api/auth/send-otp
  // Next.js dynamic segments [id] → {id}
  return apiPath.replace(/\[([^\]]+)\]/g, "{$1}");
}

/** Extract exported HTTP methods from source code */
function extractMethods(source) {
  const methods = [];
  for (const method of HTTP_METHODS) {
    // Matches: export async function GET / export function GET / export { GET }
    const patterns = [
      new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\b`),
      new RegExp(`export\\s*\\{[^}]*\\b${method}\\b[^}]*\\}`),
      new RegExp(`export\\s+const\\s+${method}\\s*=`),
    ];
    if (patterns.some((p) => p.test(source))) {
      methods.push(method.toLowerCase());
    }
  }
  return methods;
}

/** Parse JSDoc @openapi block above a method export */
function parseJsDoc(source, method) {
  const upperMethod = method.toUpperCase();

  const methodPattern = new RegExp(
    `/\\*\\*([\\s\\S]*?)\\*/[\\s\\S]{0,300}export\\s+(async\\s+)?function\\s+${upperMethod}\\b`,
    "m"
  );
  const altPattern = new RegExp(
    `/\\*\\*([\\s\\S]*?)\\*/[\\s\\S]{0,300}export\\s+const\\s+${upperMethod}\\s*=`,
    "m"
  );

  const match = source.match(methodPattern) || source.match(altPattern);
  if (!match) return null;

  const raw = match[1];
  if (!raw.includes("@openapi")) return null;

  const lines = raw
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, "").trimEnd())
    .filter(Boolean);

  const result = {};

  const openApiIdx = lines.findIndex((l) => l.trim() === "@openapi");
  if (openApiIdx !== -1) {
    const yamlLines = lines.slice(openApiIdx + 1);
    for (const line of yamlLines) {
      const kv = line.match(/^(\w+):\s*(.+)$/);
      if (kv) {
        const [, key, val] = kv;
        if (key === "tags") {
          result.tags = val.replace(/[\[\]]/g, "").split(",").map((t) => t.trim());
        } else if (key === "summary") {
          result.summary = val;
        } else if (key === "description") {
          result.description = val;
        } else if (key === "operationId") {
          result.operationId = val;
        }
      }
    }

    for (const line of lines) {
      if (line.startsWith("@summary ")) result.summary = line.slice(9).trim();
      if (line.startsWith("@description ")) result.description = line.slice(13).trim();
      if (line.startsWith("@tags ")) {
        result.tags = line.slice(6).trim().split(",").map((t) => t.trim());
      }
      if (line.startsWith("@operationId ")) result.operationId = line.slice(13).trim();
    }
  }

  const responses = {};
  for (const line of lines) {
    const rm = line.match(/^@response\s+(\d{3})\s+(.+)$/);
    if (rm) {
      responses[rm[1]] = { description: rm[2] };
    }
  }
  if (Object.keys(responses).length) result.responses = responses;

  return Object.keys(result).length ? result : null;
}

/** Map basic Zod type names → OpenAPI type objects */
function zodTypeToOas(zodType) {
  const map = {
    string: { type: "string" },
    number: { type: "number" },
    boolean: { type: "boolean" },
    array: { type: "array", items: {} },
    object: { type: "object" },
    enum: { type: "string", enum: [] },
    date: { type: "string", format: "date-time" },
    coerce: { type: "string" },
    int: { type: "integer" },
    float: { type: "number" },
    bigint: { type: "integer" },
    nan: { type: "number" },
    undefined: { type: "string" },
    null: { type: "string", nullable: true },
    any: {},
    unknown: {},
    record: { type: "object" },
    map: { type: "object" },
    set: { type: "array", items: {} },
    literal: { type: "string" },
    union: {},
    intersection: {},
    tuple: { type: "array", items: {} },
    optional: {},
    nullable: { nullable: true },
  };
  return { ...(map[zodType] || { type: "string" }) };
}

/**
 * Build an example value for an OAS type object
 */
function exampleForType(name, oasType) {
  if (oasType.enum && oasType.enum.length > 0) return oasType.enum[0];
  switch (oasType.type) {
    case "number":
    case "integer": return 0;
    case "boolean": return false;
    case "array":   return [];
    case "object":  return {};
    default:        return `<${name}>`;
  }
}

/**
 * Improved Zod schema inference.
 *
 * Strategy order:
 *  1. Parse z.object({...}) blocks from the whole file using brace-counting
 *     (handles nested objects and chained methods like .optional(), .default())
 *  2. Destructuring: const { a, b } = await req.json()
 *  3. Property access: body.email, data.name, etc.
 */
function inferZodSchema(source, method) {
  const upperMethod = method.toUpperCase();

  // Extract method body using brace-counting (reliable across multiline functions)
  let body = "";
  const fnStart = source.search(
    new RegExp(`export\\s+(async\\s+)?function\\s+${upperMethod}\\b`)
  );
  if (fnStart !== -1) {
    const braceIdx = source.indexOf("{", fnStart);
    if (braceIdx !== -1) {
      let depth = 1;
      let i = braceIdx + 1;
      while (i < source.length && depth > 0) {
        if (source[i] === "{") depth++;
        else if (source[i] === "}") depth--;
        i++;
      }
      body = source.slice(fnStart, i);
    }
  }

  // ── Strategy 1: z.object({ ... }) anywhere in the file ───────────────────
  const allFields = {};

  const zodObjRe = /z\.object\s*\(\s*\{/g;
  let zm;
  while ((zm = zodObjRe.exec(source)) !== null) {
    // Walk forward matching braces to get the full object content
    let depth = 1;
    let i = zm.index + zm[0].length;
    let block = "";
    while (i < source.length && depth > 0) {
      const ch = source[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      if (depth > 0) block += ch;
      i++;
    }

    // Parse top-level fields (skip deeply nested ones to avoid noise)
    // Field pattern: identifier: z.type(...).chain()...
    const fieldRe =
      /^[ \t]*(\w+)\s*:\s*z\.(\w+)\s*(?:\((?:[^)(]|\((?:[^)(]|\([^)(]*\))*\))*\))?((?:\s*\.\w+\s*(?:\((?:[^)(]|\((?:[^)(]|\([^)(]*\))*\))*\))?)*)/gm;

    let fm;
    while ((fm = fieldRe.exec(block)) !== null) {
      const [, name, zodType, chain] = fm;
      if (!name || name.startsWith("//")) continue;

      const oasType = zodTypeToOas(zodType);

      // Mark nullable if chain contains .optional() or .nullable()
      if (/\.optional\(\)|\.nullable\(\)/.test(chain)) {
        oasType.nullable = true;
      }

      // Capture enum values from z.enum(["a", "b"]) in the original block
      if (zodType === "enum") {
        const enumMatch = block.match(
          new RegExp(`${name}\\s*:\\s*z\\.enum\\s*\\(\\s*\\[([^\\]]+)\\]`)
        );
        if (enumMatch) {
          oasType.enum = enumMatch[1]
            .split(",")
            .map((s) => s.trim().replace(/['"]/g, ""))
            .filter(Boolean);
        }
      }

      // Capture string from z.literal("value")
      if (zodType === "literal") {
        const litMatch = block.match(
          new RegExp(`${name}\\s*:\\s*z\\.literal\\s*\\(\\s*['"]([^'"]+)['"]`)
        );
        if (litMatch) oasType.example = litMatch[1];
      }

      allFields[name] = oasType;
    }
  }

  if (Object.keys(allFields).length > 0) {
    return { type: "object", properties: allFields };
  }

  // ── Strategy 2: destructuring from req.json() / body / data ──────────────
  if (body) {
    const destructureRe =
      /const\s*\{\s*([^}]+)\}\s*=\s*(?:await\s+)?(?:req\.json\(\)|request\.json\(\)|body|data|payload|json)/g;
    let dm;
    while ((dm = destructureRe.exec(body)) !== null) {
      dm[1]
        .split(",")
        .map((s) => s.trim().split(/\s*[=:]/)[0].trim()) // handle aliases & defaults
        .filter((s) => /^\w+$/.test(s))
        .forEach((name) => {
          allFields[name] = { type: "string" };
        });
    }
    if (Object.keys(allFields).length > 0) {
      return { type: "object", properties: allFields };
    }
  }

  // ── Strategy 3: property accesses like body.email, data.name ─────────────
  if (body) {
    const skipWords = new Set([
      "then", "catch", "json", "text", "ok", "status", "headers",
      "method", "url", "body", "data", "payload", "error", "message",
    ]);
    const accessRe = /(?:body|data|payload|json|input)\.([\w]+)/g;
    let am;
    while ((am = accessRe.exec(body)) !== null) {
      const name = am[1];
      if (!skipWords.has(name)) {
        allFields[name] = allFields[name] || { type: "string" };
      }
    }
    if (Object.keys(allFields).length > 0) {
      return { type: "object", properties: allFields };
    }
  }

  return null;
}

/** Build a camelCase operationId from method + path */
function buildOperationId(method, apiPath) {
  const segments = apiPath
    .replace(/^\/api\//, "")
    .split("/")
    .filter(Boolean)
    .map((s) => s.replace(/[{}]/g, "").replace(/-(\w)/g, (_, c) => c.toUpperCase()));

  const prefix = method === "get" ? "get" : method === "post" ? "create" : method;
  const base = segments.map((s, i) => (i === 0 ? s : s[0].toUpperCase() + s.slice(1))).join("");
  return prefix + base[0].toUpperCase() + base.slice(1);
}

/** Detect path params from the apiPath, e.g. /api/rides/{id} → [{name: id, in: path}] */
function extractPathParams(apiPath) {
  return [...apiPath.matchAll(/\{(\w+)\}/g)].map(([, name]) => ({
    name,
    in: "path",
    required: true,
    schema: { type: "string" },
  }));
}

/** Infer common response codes from source content */
function inferResponses(source, method) {
  const body = (() => {
    const m = source.match(
      new RegExp(`export\\s+(async\\s+)?function\\s+${method.toUpperCase()}[\\s\\S]{0,5000}?(?=\\nexport|\\nconst|$)`, "m")
    );
    return m ? m[0] : source;
  })();

  const codes = new Set(["200"]);
  if (/status\s*\(\s*400\b/.test(body) || /BadRequest/i.test(body)) codes.add("400");
  if (/status\s*\(\s*401\b/.test(body) || /Unauthorized/i.test(body)) codes.add("401");
  if (/status\s*\(\s*403\b/.test(body) || /Forbidden/i.test(body)) codes.add("403");
  if (/status\s*\(\s*404\b/.test(body) || /NotFound/i.test(body)) codes.add("404");
  if (/status\s*\(\s*422\b/.test(body)) codes.add("422");
  if (/status\s*\(\s*429\b/.test(body) || /RateLimit/i.test(body)) codes.add("429");
  if (/status\s*\(\s*500\b/.test(body)) codes.add("500");

  const descMap = {
    "200": "Success",
    "400": "Bad request",
    "401": "Unauthorized",
    "403": "Forbidden",
    "404": "Not found",
    "422": "Validation error",
    "429": "Too many requests",
    "500": "Internal server error",
  };

  return Object.fromEntries(
    [...codes].sort().map((code) => [
      code,
      {
        description: descMap[code] || code,
        content: { "application/json": { schema: {} } },
      },
    ])
  );
}

/** Infer tag from path (e.g. /api/auth/... → Auth) */
function inferTag(apiPath) {
  const parts = apiPath.replace(/^\/api\//, "").split("/").filter(Boolean);
  const tag = parts[0] || "General";
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function generate() {
  console.log(`\n🔍 Scanning: ${APP_DIR}`);

  const routeFiles = findRouteFiles(path.join(APP_DIR));
  console.log(`📂 Found ${routeFiles.length} route file(s)\n`);

  const openapi = {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "Auto-generated from Next.js App Router",
    },
    servers: [{ url: BASE_URL }],
    tags: [],
    paths: {},
  };

  const tagSet = new Set();

  routeFiles.sort((a, b) => fileToApiPath(a).localeCompare(fileToApiPath(b)));

  for (const file of routeFiles) {
    const apiPath = fileToApiPath(file);
    const source = fs.readFileSync(file, "utf-8");
    const methods = extractMethods(source);

    if (!methods.length) {
      console.log(`  ⚠️  No HTTP exports found: ${apiPath}`);
      continue;
    }

    openapi.paths[apiPath] = {};

    for (const method of methods) {
      const jsDoc = parseJsDoc(source, method);
      const zodSchema = inferZodSchema(source, method);
      const pathParams = extractPathParams(apiPath);
      const inferredTag = inferTag(apiPath);
      const tag = jsDoc?.tags?.[0] || inferredTag;

      tagSet.add(tag);

      const operation = {
        summary: jsDoc?.summary || `${method.toUpperCase()} ${apiPath}`,
        description: jsDoc?.description || "",
        operationId: jsDoc?.operationId || buildOperationId(method, apiPath),
        tags: jsDoc?.tags || [tag],
        parameters: pathParams,
        responses: jsDoc?.responses
          ? Object.fromEntries(
              Object.entries(jsDoc.responses).map(([code, val]) => [
                code,
                {
                  description: val.description || code,
                  content: { "application/json": { schema: {} } },
                },
              ])
            )
          : inferResponses(source, method),
      };

      // Add requestBody for mutating methods
      if (["post", "put", "patch"].includes(method)) {
        // Build example object from inferred schema
        const exampleObj = zodSchema
          ? Object.fromEntries(
              Object.entries(zodSchema.properties || {}).map(([k, v]) => [
                k,
                exampleForType(k, v),
              ])
            )
          : undefined;

        operation.requestBody = {
          description: "Request body",
          required: true,
          content: {
            "application/json": {
              schema: zodSchema || {},
              ...(exampleObj && Object.keys(exampleObj).length
                ? { example: exampleObj }
                : {}),
            },
          },
        };
      }

      openapi.paths[apiPath][method] = operation;

      const icon = zodSchema ? "📋" : jsDoc ? "📝" : "🔎";
      const schemaSource = zodSchema
        ? `(${Object.keys(zodSchema.properties || {}).length} fields)`
        : "(no schema)";
      console.log(`  ${icon}  ${method.toUpperCase().padEnd(7)} ${apiPath} ${schemaSource}`);
    }
  }

  // Populate tags array (sorted alphabetically)
  openapi.tags = [...tagSet].sort().map((name) => ({ name }));

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(openapi, null, 2), "utf-8");

  const pathCount = Object.keys(openapi.paths).length;
  const opCount = Object.values(openapi.paths).reduce(
    (n, p) => n + Object.keys(p).length,
    0
  );

  console.log(`\n✅ Done! ${pathCount} paths · ${opCount} operations`);
  console.log(`📄 Output: ${OUT_FILE}\n`);
}

generate();

// // #!/usr/bin/env node
// // /**
// //  * generate-openapi.mjs
// //  * Scans Next.js App Router (app/api/**\/route.ts) and generates openapi.json
// //  * Reads: JSDoc @openapi comments + Zod schemas (basic inference)
// //  *
// //  * Usage:
// //  *   node generate-openapi.mjs
// //  *   node generate-openapi.mjs --out ./docs/openapi.json
// //  *   node generate-openapi.mjs --base-url https://api.myapp.com
// //  */

// // import fs from "fs";
// // import path from "path";
// // import { fileURLToPath } from "url";

// // const __dirname = path.dirname(fileURLToPath(import.meta.url));

// // // ─── Config ───────────────────────────────────────────────────────────────────
// // const args = process.argv.slice(2);
// // const getArg = (flag) => {
// //   const i = args.indexOf(flag);
// //   return i !== -1 ? args[i + 1] : null;
// // };

// // const APP_DIR = path.resolve(getArg("--app-dir") || "./app");
// // const OUT_FILE = path.resolve(getArg("--out") || "./openapi.json");
// // const BASE_URL = getArg("--base-url") || "http://localhost:3000";

// // // ─── HTTP Methods supported by Next.js App Router ────────────────────────────
// // const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

// // // ─── Helpers ─────────────────────────────────────────────────────────────────

// // /** Recursively find all route.ts / route.js files */
// // function findRouteFiles(dir, files = []) {
// //   if (!fs.existsSync(dir)) return files;
// //   for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
// //     const full = path.join(dir, entry.name);
// //     if (entry.isDirectory()) {
// //       findRouteFiles(full, files);
// //     } else if (entry.isFile() && /^route\.(ts|js)$/.test(entry.name)) {
// //       files.push(full);
// //     }
// //   }
// //   return files;
// // }

// // /** Convert file path → OpenAPI path string
// //  *  app/api/auth/send-otp/route.ts  →  /api/auth/send-otp
// //  *  app/api/rides/[id]/route.ts     →  /api/rides/{id}
// //  */
// // function fileToApiPath(filePath) {
// //   const rel = path.relative(APP_DIR, filePath);           // api/auth/send-otp/route.ts
// //   const withoutFile = rel.replace(/[/\\]route\.(ts|js)$/, ""); // api/auth/send-otp
// //   const apiPath = "/" + withoutFile.replace(/\\/g, "/");  // /api/auth/send-otp
// //   // Next.js dynamic segments [id] → {id}
// //   return apiPath.replace(/\[([^\]]+)\]/g, "{$1}");
// // }

// // /** Extract exported HTTP methods from source code */
// // function extractMethods(source) {
// //   const methods = [];
// //   for (const method of HTTP_METHODS) {
// //     // Matches: export async function GET / export function GET / export { GET }
// //     const patterns = [
// //       new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\b`),
// //       new RegExp(`export\\s*\\{[^}]*\\b${method}\\b[^}]*\\}`),
// //       new RegExp(`export\\s+const\\s+${method}\\s*=`),
// //     ];
// //     if (patterns.some((p) => p.test(source))) {
// //       methods.push(method.toLowerCase());
// //     }
// //   }
// //   return methods;
// // }

// // /** Parse JSDoc @openapi block above a method export
// //  *
// //  * Supports two styles:
// //  *
// //  * Style 1 – full YAML block inside the comment:
// //  * \/**
// //  *  * @openapi
// //  *  * summary: Send OTP to email
// //  *  * description: ...
// //  *  * tags: [Auth]
// //  *  * requestBody:
// //  *  *   ...
// //  *  * responses:
// //  *  *   "200":
// //  *  *     description: OK
// //  *  *\/
// //  *
// //  * Style 2 – simple key: value lines (auto-parsed):
// //  * \/**
// //  *  * @openapi
// //  *  * @summary Send OTP to email
// //  *  * @description Send OTP via email using Resend
// //  *  * @tags Auth
// //  *  * @response 200 Success
// //  *  * @response 400 Bad request
// //  *  *\/
// //  */
// // function parseJsDoc(source, method) {
// //   const upperMethod = method.toUpperCase();

// //   // Find JSDoc block just before the export for this method
// //   const methodPattern = new RegExp(
// //     `/\\*\\*([\\s\\S]*?)\\*/[\\s\\S]{0,300}export\\s+(async\\s+)?function\\s+${upperMethod}\\b`,
// //     "m"
// //   );
// //   const altPattern = new RegExp(
// //     `/\\*\\*([\\s\\S]*?)\\*/[\\s\\S]{0,300}export\\s+const\\s+${upperMethod}\\s*=`,
// //     "m"
// //   );

// //   const match = source.match(methodPattern) || source.match(altPattern);
// //   if (!match) return null;

// //   const raw = match[1];
// //   if (!raw.includes("@openapi")) return null;

// //   const lines = raw
// //     .split("\n")
// //     .map((l) => l.replace(/^\s*\*\s?/, "").trimEnd())
// //     .filter(Boolean);

// //   const result = {};

// //   // Style 1: YAML block (indented content after @openapi line)
// //   const openApiIdx = lines.findIndex((l) => l.trim() === "@openapi");
// //   if (openApiIdx !== -1) {
// //     const yamlLines = lines.slice(openApiIdx + 1);
// //     // Try simple key-value parsing (no full YAML parser needed for common cases)
// //     for (const line of yamlLines) {
// //       const kv = line.match(/^(\w+):\s*(.+)$/);
// //       if (kv) {
// //         const [, key, val] = kv;
// //         if (key === "tags") {
// //           result.tags = val.replace(/[\[\]]/g, "").split(",").map((t) => t.trim());
// //         } else if (key === "summary") {
// //           result.summary = val;
// //         } else if (key === "description") {
// //           result.description = val;
// //         } else if (key === "operationId") {
// //           result.operationId = val;
// //         }
// //       }
// //     }

// //     // Style 2: @tag annotations
// //     for (const line of lines) {
// //       if (line.startsWith("@summary ")) result.summary = line.slice(9).trim();
// //       if (line.startsWith("@description ")) result.description = line.slice(13).trim();
// //       if (line.startsWith("@tags ")) {
// //         result.tags = line.slice(6).trim().split(",").map((t) => t.trim());
// //       }
// //       if (line.startsWith("@operationId ")) result.operationId = line.slice(13).trim();
// //     }
// //   }

// //   // Collect @response annotations
// //   const responses = {};
// //   for (const line of lines) {
// //     const rm = line.match(/^@response\s+(\d{3})\s+(.+)$/);
// //     if (rm) {
// //       responses[rm[1]] = { description: rm[2] };
// //     }
// //   }
// //   if (Object.keys(responses).length) result.responses = responses;

// //   return Object.keys(result).length ? result : null;
// // }

// // /** Infer Zod schema fields referenced in the method body (best-effort) */
// // function inferZodSchema(source, method) {
// //   const upperMethod = method.toUpperCase();

// //   // Grab the function body for this specific method
// //   const bodyPattern = new RegExp(
// //     `export\\s+(async\\s+)?function\\s+${upperMethod}[\\s\\S]{0,5000}?(?=\\nexport|\\nconst|$)`,
// //     "m"
// //   );
// //   const bodyMatch = source.match(bodyPattern);
// //   if (!bodyMatch) return null;

// //   const body = bodyMatch[0];

// //   // Look for .parse() or .safeParse() calls referencing a Zod schema
// //   const parseMatches = [...body.matchAll(/(\w+)\.(?:safe)?[Pp]arse\(/g)];
// //   if (!parseMatches.length) return null;

// //   // Collect field names from z.object({ ... }) definitions in the same file
// //   const fields = {};
// //   const objectPattern = /z\.object\(\{([\s\S]*?)\}\)/g;
// //   let objMatch;
// //   while ((objMatch = objectPattern.exec(source)) !== null) {
// //     const block = objMatch[1];
// //     // Each field: fieldName: z.string() / z.number() / z.enum([...]) etc.
// //     const fieldPattern = /(\w+)\s*:\s*z\.(\w+)\s*\(([^)]*)\)/g;
// //     let fm;
// //     while ((fm = fieldPattern.exec(block)) !== null) {
// //       const [, name, zodType] = fm;
// //       fields[name] = zodTypeToOas(zodType);
// //     }
// //   }

// //   return Object.keys(fields).length
// //     ? {
// //         type: "object",
// //         properties: fields,
// //       }
// //     : null;
// // }

// // /** Map basic Zod type names → OpenAPI type objects */
// // function zodTypeToOas(zodType) {
// //   const map = {
// //     string: { type: "string" },
// //     number: { type: "number" },
// //     boolean: { type: "boolean" },
// //     array: { type: "array", items: {} },
// //     object: { type: "object" },
// //     enum: { type: "string", enum: [] },
// //     date: { type: "string", format: "date-time" },
// //     coerce: { type: "string" },
// //   };
// //   return map[zodType] || { type: "string" };
// // }

// // /** Build a camelCase operationId from method + path */
// // function buildOperationId(method, apiPath) {
// //   const segments = apiPath
// //     .replace(/^\/api\//, "")
// //     .split("/")
// //     .filter(Boolean)
// //     .map((s) => s.replace(/[{}]/g, "").replace(/-(\w)/g, (_, c) => c.toUpperCase()));

// //   const prefix = method === "get" ? "get" : method === "post" ? "create" : method;
// //   const base = segments.map((s, i) => (i === 0 ? s : s[0].toUpperCase() + s.slice(1))).join("");
// //   return prefix + base[0].toUpperCase() + base.slice(1);
// // }

// // /** Detect path params from the apiPath, e.g. /api/rides/{id} → [{name: id, in: path}] */
// // function extractPathParams(apiPath) {
// //   return [...apiPath.matchAll(/\{(\w+)\}/g)].map(([, name]) => ({
// //     name,
// //     in: "path",
// //     required: true,
// //     schema: { type: "string" },
// //   }));
// // }

// // /** Infer common response codes from source content */
// // function inferResponses(source, method) {
// //   const body = (() => {
// //     const m = source.match(
// //       new RegExp(`export\\s+(async\\s+)?function\\s+${method.toUpperCase()}[\\s\\S]{0,5000}?(?=\\nexport|\\nconst|$)`, "m")
// //     );
// //     return m ? m[0] : source;
// //   })();

// //   const codes = new Set(["200"]);
// //   if (/status\s*\(\s*400\b/.test(body) || /BadRequest/i.test(body)) codes.add("400");
// //   if (/status\s*\(\s*401\b/.test(body) || /Unauthorized/i.test(body)) codes.add("401");
// //   if (/status\s*\(\s*403\b/.test(body) || /Forbidden/i.test(body)) codes.add("403");
// //   if (/status\s*\(\s*404\b/.test(body) || /NotFound/i.test(body)) codes.add("404");
// //   if (/status\s*\(\s*422\b/.test(body)) codes.add("422");
// //   if (/status\s*\(\s*429\b/.test(body) || /RateLimit/i.test(body)) codes.add("429");
// //   if (/status\s*\(\s*500\b/.test(body)) codes.add("500");

// //   const descMap = {
// //     "200": "Success",
// //     "400": "Bad request",
// //     "401": "Unauthorized",
// //     "403": "Forbidden",
// //     "404": "Not found",
// //     "422": "Validation error",
// //     "429": "Too many requests",
// //     "500": "Internal server error",
// //   };

// //   return Object.fromEntries(
// //     [...codes].sort().map((code) => [
// //       code,
// //       {
// //         description: descMap[code] || code,
// //         content: { "application/json": { schema: {} } },
// //       },
// //     ])
// //   );
// // }

// // /** Infer tag from path (e.g. /api/auth/... → Auth) */
// // function inferTag(apiPath) {
// //   const parts = apiPath.replace(/^\/api\//, "").split("/").filter(Boolean);
// //   const tag = parts[0] || "General";
// //   return tag.charAt(0).toUpperCase() + tag.slice(1);
// // }

// // // ─── Main ─────────────────────────────────────────────────────────────────────

// // function generate() {
// //   console.log(`\n🔍 Scanning: ${APP_DIR}`);

// //   const routeFiles = findRouteFiles(path.join(APP_DIR));
// //   console.log(`📂 Found ${routeFiles.length} route file(s)\n`);

// //   const openapi = {
// //     openapi: "3.0.0",
// //     info: {
// //       title: "API Documentation",
// //       version: "1.0.0",
// //       description: "Auto-generated from Next.js App Router",
// //     },
// //     servers: [{ url: BASE_URL }],
// //     tags: [],
// //     paths: {},
// //   };

// //   const tagSet = new Set();

// //   // Sort so related paths appear together (e.g. /api/auth/* grouped)
// //   routeFiles.sort((a, b) => fileToApiPath(a).localeCompare(fileToApiPath(b)));

// //   for (const file of routeFiles) {
// //     const apiPath = fileToApiPath(file);
// //     const source = fs.readFileSync(file, "utf-8");
// //     const methods = extractMethods(source);

// //     if (!methods.length) {
// //       console.log(`  ⚠️  No HTTP exports found: ${apiPath}`);
// //       continue;
// //     }

// //     openapi.paths[apiPath] = {};

// //     for (const method of methods) {
// //       const jsDoc = parseJsDoc(source, method);
// //       const zodSchema = inferZodSchema(source, method);
// //       const pathParams = extractPathParams(apiPath);
// //       const inferredTag = inferTag(apiPath);
// //       const tag = jsDoc?.tags?.[0] || inferredTag;

// //       tagSet.add(tag);

// //       const operation = {
// //         summary: jsDoc?.summary || `${method.toUpperCase()} ${apiPath}`,
// //         description: jsDoc?.description || "",
// //         operationId:
// //           jsDoc?.operationId || buildOperationId(method, apiPath),
// //         tags: jsDoc?.tags || [tag],
// //         parameters: pathParams,
// //         responses: jsDoc?.responses
// //           ? Object.fromEntries(
// //               Object.entries(jsDoc.responses).map(([code, val]) => [
// //                 code,
// //                 {
// //                   description: val.description || code,
// //                   content: { "application/json": { schema: {} } },
// //                 },
// //               ])
// //             )
// //           : inferResponses(source, method),
// //       };

// //       // Add requestBody for mutating methods
// //       if (["post", "put", "patch"].includes(method)) {
// //         operation.requestBody = {
// //           description: "Request body",
// //           required: true,
// //           content: {
// //             "application/json": {
// //               schema: zodSchema || {},
// //               ...(zodSchema
// //                 ? {
// //                     example: Object.fromEntries(
// //                       Object.keys(zodSchema.properties || {}).map((k) => [
// //                         k,
// //                         zodSchema.properties[k].type === "number"
// //                           ? 0
// //                           : zodSchema.properties[k].type === "boolean"
// //                           ? false
// //                           : `<${k}>`,
// //                       ])
// //                     ),
// //                   }
// //                 : {}),
// //             },
// //           },
// //         };
// //       }

// //       openapi.paths[apiPath][method] = operation;

// //       const icon = zodSchema ? "📋" : jsDoc ? "📝" : "🔎";
// //       console.log(`  ${icon}  ${method.toUpperCase().padEnd(7)} ${apiPath}`);
// //     }
// //   }

// //   // Populate tags array (sorted alphabetically)
// //   openapi.tags = [...tagSet].sort().map((name) => ({ name }));

// //   fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
// //   fs.writeFileSync(OUT_FILE, JSON.stringify(openapi, null, 2), "utf-8");

// //   const pathCount = Object.keys(openapi.paths).length;
// //   const opCount = Object.values(openapi.paths).reduce(
// //     (n, p) => n + Object.keys(p).length,
// //     0
// //   );

// //   console.log(`\n✅ Done! ${pathCount} paths · ${opCount} operations`);
// //   console.log(`📄 Output: ${OUT_FILE}\n`);
// // }

// // generate();




// //#!/usr/bin/env node
// /**
//  * generate-openapi.mjs
//  * Scans Next.js App Router (app/api/**\/route.ts) and generates openapi.json
//  * Reads: JSDoc @openapi comments + Zod schemas (basic inference)
//  *
//  * Usage:
//  *   node generate-openapi.mjs
//  *   node generate-openapi.mjs --out ./docs/openapi.json
//  *   node generate-openapi.mjs --base-url https://api.myapp.com
//  */

// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// // ─── Config ───────────────────────────────────────────────────────────────────
// const args = process.argv.slice(2);
// const getArg = (flag) => {
//   const i = args.indexOf(flag);
//   return i !== -1 ? args[i + 1] : null;
// };

// const APP_DIR = path.resolve(getArg("--app-dir") || "./app");
// const OUT_FILE = path.resolve(getArg("--out") || "./openapi.json");
// const BASE_URL = getArg("--base-url") || "http://localhost:3000";

// // ─── HTTP Methods supported by Next.js App Router ────────────────────────────
// const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

// // ─── Helpers ─────────────────────────────────────────────────────────────────

// /** Recursively find all route.ts / route.js files */
// function findRouteFiles(dir, files = []) {
//   if (!fs.existsSync(dir)) return files;
//   for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
//     const full = path.join(dir, entry.name);
//     if (entry.isDirectory()) {
//       findRouteFiles(full, files);
//     } else if (entry.isFile() && /^route\.(ts|js)$/.test(entry.name)) {
//       files.push(full);
//     }
//   }
//   return files;
// }

// /** Convert file path → OpenAPI path string
//  *  app/api/auth/send-otp/route.ts  →  /api/auth/send-otp
//  *  app/api/rides/[id]/route.ts     →  /api/rides/{id}
//  */
// function fileToApiPath(filePath) {
//   const rel = path.relative(APP_DIR, filePath);           // api/auth/send-otp/route.ts
//   const withoutFile = rel.replace(/[/\\]route\.(ts|js)$/, ""); // api/auth/send-otp
//   const apiPath = "/" + withoutFile.replace(/\\/g, "/");  // /api/auth/send-otp
//   // Next.js dynamic segments [id] → {id}
//   return apiPath.replace(/\[([^\]]+)\]/g, "{$1}");
// }

// /** Extract exported HTTP methods from source code */
// function extractMethods(source) {
//   const methods = [];
//   for (const method of HTTP_METHODS) {
//     // Matches: export async function GET / export function GET / export { GET }
//     const patterns = [
//       new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\b`),
//       new RegExp(`export\\s*\\{[^}]*\\b${method}\\b[^}]*\\}`),
//       new RegExp(`export\\s+const\\s+${method}\\s*=`),
//     ];
//     if (patterns.some((p) => p.test(source))) {
//       methods.push(method.toLowerCase());
//     }
//   }
//   return methods;
// }

// /** Parse JSDoc @openapi block above a method export */
// function parseJsDoc(source, method) {
//   const upperMethod = method.toUpperCase();

//   const methodPattern = new RegExp(
//     `/\\*\\*([\\s\\S]*?)\\*/[\\s\\S]{0,300}export\\s+(async\\s+)?function\\s+${upperMethod}\\b`,
//     "m"
//   );
//   const altPattern = new RegExp(
//     `/\\*\\*([\\s\\S]*?)\\*/[\\s\\S]{0,300}export\\s+const\\s+${upperMethod}\\s*=`,
//     "m"
//   );

//   const match = source.match(methodPattern) || source.match(altPattern);
//   if (!match) return null;

//   const raw = match[1];
//   if (!raw.includes("@openapi")) return null;

//   const lines = raw
//     .split("\n")
//     .map((l) => l.replace(/^\s*\*\s?/, "").trimEnd())
//     .filter(Boolean);

//   const result = {};

//   const openApiIdx = lines.findIndex((l) => l.trim() === "@openapi");
//   if (openApiIdx !== -1) {
//     const yamlLines = lines.slice(openApiIdx + 1);
//     for (const line of yamlLines) {
//       const kv = line.match(/^(\w+):\s*(.+)$/);
//       if (kv) {
//         const [, key, val] = kv;
//         if (key === "tags") {
//           result.tags = val.replace(/[\[\]]/g, "").split(",").map((t) => t.trim());
//         } else if (key === "summary") {
//           result.summary = val;
//         } else if (key === "description") {
//           result.description = val;
//         } else if (key === "operationId") {
//           result.operationId = val;
//         }
//       }
//     }

//     for (const line of lines) {
//       if (line.startsWith("@summary ")) result.summary = line.slice(9).trim();
//       if (line.startsWith("@description ")) result.description = line.slice(13).trim();
//       if (line.startsWith("@tags ")) {
//         result.tags = line.slice(6).trim().split(",").map((t) => t.trim());
//       }
//       if (line.startsWith("@operationId ")) result.operationId = line.slice(13).trim();
//     }
//   }

//   const responses = {};
//   for (const line of lines) {
//     const rm = line.match(/^@response\s+(\d{3})\s+(.+)$/);
//     if (rm) {
//       responses[rm[1]] = { description: rm[2] };
//     }
//   }
//   if (Object.keys(responses).length) result.responses = responses;

//   return Object.keys(result).length ? result : null;
// }

// /** Map basic Zod type names → OpenAPI type objects */
// function zodTypeToOas(zodType) {
//   const map = {
//     string: { type: "string" },
//     number: { type: "number" },
//     boolean: { type: "boolean" },
//     array: { type: "array", items: {} },
//     object: { type: "object" },
//     enum: { type: "string", enum: [] },
//     date: { type: "string", format: "date-time" },
//     coerce: { type: "string" },
//     int: { type: "integer" },
//     float: { type: "number" },
//     bigint: { type: "integer" },
//     nan: { type: "number" },
//     undefined: { type: "string" },
//     null: { type: "string", nullable: true },
//     any: {},
//     unknown: {},
//     record: { type: "object" },
//     map: { type: "object" },
//     set: { type: "array", items: {} },
//     literal: { type: "string" },
//     union: {},
//     intersection: {},
//     tuple: { type: "array", items: {} },
//     optional: {},
//     nullable: { nullable: true },
//   };
//   return { ...(map[zodType] || { type: "string" }) };
// }

// /**
//  * Build an example value for an OAS type object
//  */
// function exampleForType(name, oasType) {
//   if (oasType.enum && oasType.enum.length > 0) return oasType.enum[0];
//   switch (oasType.type) {
//     case "number":
//     case "integer": return 0;
//     case "boolean": return false;
//     case "array":   return [];
//     case "object":  return {};
//     default:        return `<${name}>`;
//   }
// }

// /**
//  * Improved Zod schema inference.
//  *
//  * Strategy order:
//  *  1. Parse z.object({...}) blocks from the whole file using brace-counting
//  *     (handles nested objects and chained methods like .optional(), .default())
//  *  2. Destructuring: const { a, b } = await req.json()
//  *  3. Property access: body.email, data.name, etc.
//  */
// function inferZodSchema(source, method) {
//   const upperMethod = method.toUpperCase();

//   // Extract method body using brace-counting (reliable across multiline functions)
//   let body = "";
//   const fnStart = source.search(
//     new RegExp(`export\\s+(async\\s+)?function\\s+${upperMethod}\\b`)
//   );
//   if (fnStart !== -1) {
//     const braceIdx = source.indexOf("{", fnStart);
//     if (braceIdx !== -1) {
//       let depth = 1;
//       let i = braceIdx + 1;
//       while (i < source.length && depth > 0) {
//         if (source[i] === "{") depth++;
//         else if (source[i] === "}") depth--;
//         i++;
//       }
//       body = source.slice(fnStart, i);
//     }
//   }

//   // ── Strategy 1: z.object({ ... }) anywhere in the file ───────────────────
//   const allFields = {};

//   const zodObjRe = /z\.object\s*\(\s*\{/g;
//   let zm;
//   while ((zm = zodObjRe.exec(source)) !== null) {
//     // Walk forward matching braces to get the full object content
//     let depth = 1;
//     let i = zm.index + zm[0].length;
//     let block = "";
//     while (i < source.length && depth > 0) {
//       const ch = source[i];
//       if (ch === "{") depth++;
//       else if (ch === "}") depth--;
//       if (depth > 0) block += ch;
//       i++;
//     }

//     // Parse top-level fields (skip deeply nested ones to avoid noise)
//     // Field pattern: identifier: z.type(...).chain()...
//     const fieldRe =
//       /^[ \t]*(\w+)\s*:\s*z\.(\w+)\s*(?:\((?:[^)(]|\((?:[^)(]|\([^)(]*\))*\))*\))?((?:\s*\.\w+\s*(?:\((?:[^)(]|\((?:[^)(]|\([^)(]*\))*\))*\))?)*)/gm;

//     let fm;
//     while ((fm = fieldRe.exec(block)) !== null) {
//       const [, name, zodType, chain] = fm;
//       if (!name || name.startsWith("//")) continue;

//       const oasType = zodTypeToOas(zodType);

//       // Mark nullable if chain contains .optional() or .nullable()
//       if (/\.optional\(\)|\.nullable\(\)/.test(chain)) {
//         oasType.nullable = true;
//       }

//       // Capture enum values from z.enum(["a", "b"]) in the original block
//       if (zodType === "enum") {
//         const enumMatch = block.match(
//           new RegExp(`${name}\\s*:\\s*z\\.enum\\s*\\(\\s*\\[([^\\]]+)\\]`)
//         );
//         if (enumMatch) {
//           oasType.enum = enumMatch[1]
//             .split(",")
//             .map((s) => s.trim().replace(/['"]/g, ""))
//             .filter(Boolean);
//         }
//       }

//       // Capture string from z.literal("value")
//       if (zodType === "literal") {
//         const litMatch = block.match(
//           new RegExp(`${name}\\s*:\\s*z\\.literal\\s*\\(\\s*['"]([^'"]+)['"]`)
//         );
//         if (litMatch) oasType.example = litMatch[1];
//       }

//       allFields[name] = oasType;
//     }
//   }

//   if (Object.keys(allFields).length > 0) {
//     return { type: "object", properties: allFields };
//   }

//   // ── Strategy 2: destructuring from req.json() / body / data ──────────────
//   if (body) {
//     const destructureRe =
//       /const\s*\{\s*([^}]+)\}\s*=\s*(?:await\s+)?(?:req\.json\(\)|request\.json\(\)|body|data|payload|json)/g;
//     let dm;
//     while ((dm = destructureRe.exec(body)) !== null) {
//       dm[1]
//         .split(",")
//         .map((s) => s.trim().split(/\s*[=:]/)[0].trim()) // handle aliases & defaults
//         .filter((s) => /^\w+$/.test(s))
//         .forEach((name) => {
//           allFields[name] = { type: "string" };
//         });
//     }
//     if (Object.keys(allFields).length > 0) {
//       return { type: "object", properties: allFields };
//     }
//   }

//   // ── Strategy 3: property accesses like body.email, data.name ─────────────
//   if (body) {
//     const skipWords = new Set([
//       "then", "catch", "json", "text", "ok", "status", "headers",
//       "method", "url", "body", "data", "payload", "error", "message",
//     ]);
//     const accessRe = /(?:body|data|payload|json|input)\.([\w]+)/g;
//     let am;
//     while ((am = accessRe.exec(body)) !== null) {
//       const name = am[1];
//       if (!skipWords.has(name)) {
//         allFields[name] = allFields[name] || { type: "string" };
//       }
//     }
//     if (Object.keys(allFields).length > 0) {
//       return { type: "object", properties: allFields };
//     }
//   }

//   return null;
// }

// /** Build a camelCase operationId from method + path */
// function buildOperationId(method, apiPath) {
//   const segments = apiPath
//     .replace(/^\/api\//, "")
//     .split("/")
//     .filter(Boolean)
//     .map((s) => s.replace(/[{}]/g, "").replace(/-(\w)/g, (_, c) => c.toUpperCase()));

//   const prefix = method === "get" ? "get" : method === "post" ? "create" : method;
//   const base = segments.map((s, i) => (i === 0 ? s : s[0].toUpperCase() + s.slice(1))).join("");
//   return prefix + base[0].toUpperCase() + base.slice(1);
// }

// /** Detect path params from the apiPath, e.g. /api/rides/{id} → [{name: id, in: path}] */
// function extractPathParams(apiPath) {
//   return [...apiPath.matchAll(/\{(\w+)\}/g)].map(([, name]) => ({
//     name,
//     in: "path",
//     required: true,
//     schema: { type: "string" },
//   }));
// }

// /** Infer common response codes from source content */
// function inferResponses(source, method) {
//   const body = (() => {
//     const m = source.match(
//       new RegExp(`export\\s+(async\\s+)?function\\s+${method.toUpperCase()}[\\s\\S]{0,5000}?(?=\\nexport|\\nconst|$)`, "m")
//     );
//     return m ? m[0] : source;
//   })();

//   const codes = new Set(["200"]);
//   if (/status\s*\(\s*400\b/.test(body) || /BadRequest/i.test(body)) codes.add("400");
//   if (/status\s*\(\s*401\b/.test(body) || /Unauthorized/i.test(body)) codes.add("401");
//   if (/status\s*\(\s*403\b/.test(body) || /Forbidden/i.test(body)) codes.add("403");
//   if (/status\s*\(\s*404\b/.test(body) || /NotFound/i.test(body)) codes.add("404");
//   if (/status\s*\(\s*422\b/.test(body)) codes.add("422");
//   if (/status\s*\(\s*429\b/.test(body) || /RateLimit/i.test(body)) codes.add("429");
//   if (/status\s*\(\s*500\b/.test(body)) codes.add("500");

//   const descMap = {
//     "200": "Success",
//     "400": "Bad request",
//     "401": "Unauthorized",
//     "403": "Forbidden",
//     "404": "Not found",
//     "422": "Validation error",
//     "429": "Too many requests",
//     "500": "Internal server error",
//   };

//   return Object.fromEntries(
//     [...codes].sort().map((code) => [
//       code,
//       {
//         description: descMap[code] || code,
//         content: { "application/json": { schema: {} } },
//       },
//     ])
//   );
// }

// /** Infer tag from path (e.g. /api/auth/... → Auth) */
// function inferTag(apiPath) {
//   const parts = apiPath.replace(/^\/api\//, "").split("/").filter(Boolean);
//   const tag = parts[0] || "General";
//   return tag.charAt(0).toUpperCase() + tag.slice(1);
// }

// // ─── Main ─────────────────────────────────────────────────────────────────────

// function generate() {
//   console.log(`\n🔍 Scanning: ${APP_DIR}`);

//   const routeFiles = findRouteFiles(path.join(APP_DIR));
//   console.log(`📂 Found ${routeFiles.length} route file(s)\n`);

//   const openapi = {
//     openapi: "3.0.0",
//     info: {
//       title: "API Documentation",
//       version: "1.0.0",
//       description: "Auto-generated from Next.js App Router",
//     },
//     servers: [{ url: BASE_URL }],
//     tags: [],
//     paths: {},
//   };

//   const tagSet = new Set();

//   routeFiles.sort((a, b) => fileToApiPath(a).localeCompare(fileToApiPath(b)));

//   for (const file of routeFiles) {
//     const apiPath = fileToApiPath(file);
//     const source = fs.readFileSync(file, "utf-8");
//     const methods = extractMethods(source);

//     if (!methods.length) {
//       console.log(`  ⚠️  No HTTP exports found: ${apiPath}`);
//       continue;
//     }

//     openapi.paths[apiPath] = {};

//     for (const method of methods) {
//       const jsDoc = parseJsDoc(source, method);
//       const zodSchema = inferZodSchema(source, method);
//       const pathParams = extractPathParams(apiPath);
//       const inferredTag = inferTag(apiPath);
//       const tag = jsDoc?.tags?.[0] || inferredTag;

//       tagSet.add(tag);

//       const operation = {
//         summary: jsDoc?.summary || `${method.toUpperCase()} ${apiPath}`,
//         description: jsDoc?.description || "",
//         operationId: jsDoc?.operationId || buildOperationId(method, apiPath),
//         tags: jsDoc?.tags || [tag],
//         parameters: pathParams,
//         responses: jsDoc?.responses
//           ? Object.fromEntries(
//               Object.entries(jsDoc.responses).map(([code, val]) => [
//                 code,
//                 {
//                   description: val.description || code,
//                   content: { "application/json": { schema: {} } },
//                 },
//               ])
//             )
//           : inferResponses(source, method),
//       };

//       // Add requestBody for mutating methods
//       if (["post", "put", "patch"].includes(method)) {
//         // Build example object from inferred schema
//         const exampleObj = zodSchema
//           ? Object.fromEntries(
//               Object.entries(zodSchema.properties || {}).map(([k, v]) => [
//                 k,
//                 exampleForType(k, v),
//               ])
//             )
//           : undefined;

//         operation.requestBody = {
//           description: "Request body",
//           required: true,
//           content: {
//             "application/json": {
//               schema: zodSchema || {},
//               ...(exampleObj && Object.keys(exampleObj).length
//                 ? { example: exampleObj }
//                 : {}),
//             },
//           },
//         };
//       }

//       openapi.paths[apiPath][method] = operation;

//       const icon = zodSchema ? "📋" : jsDoc ? "📝" : "🔎";
//       const schemaSource = zodSchema
//         ? `(${Object.keys(zodSchema.properties || {}).length} fields)`
//         : "(no schema)";
//       console.log(`  ${icon}  ${method.toUpperCase().padEnd(7)} ${apiPath} ${schemaSource}`);
//     }
//   }

//   // Populate tags array (sorted alphabetically)
//   openapi.tags = [...tagSet].sort().map((name) => ({ name }));

//   fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
//   fs.writeFileSync(OUT_FILE, JSON.stringify(openapi, null, 2), "utf-8");

//   const pathCount = Object.keys(openapi.paths).length;
//   const opCount = Object.values(openapi.paths).reduce(
//     (n, p) => n + Object.keys(p).length,
//     0
//   );

//   console.log(`\n✅ Done! ${pathCount} paths · ${opCount} operations`);
//   console.log(`📄 Output: ${OUT_FILE}\n`);
// }

// generate();
