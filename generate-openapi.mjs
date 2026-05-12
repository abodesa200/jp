#!/usr/bin/env node
/**
 * generate-openapi.mjs
 * Scans Next.js App Router (app/api/**\/route.ts) and generates openapi.json
 * Reads: JSDoc @openapi comments + Zod schemas (with .openapi() example support)
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

// ─── HTTP Methods ─────────────────────────────────────────────────────────────
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findRouteFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findRouteFiles(full, files);
    else if (entry.isFile() && /^route\.(ts|js)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function fileToApiPath(filePath) {
  const rel = path.relative(APP_DIR, filePath);
  const withoutFile = rel.replace(/[/\\]route\.(ts|js)$/, "");
  const apiPath = "/" + withoutFile.replace(/\\/g, "/");
  return apiPath.replace(/\[([^\]]+)\]/g, "{$1}");
}

function extractMethods(source) {
  const methods = [];
  for (const method of HTTP_METHODS) {
    const patterns = [
      new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\b`),
      new RegExp(`export\\s*\\{[^}]*\\b${method}\\b[^}]*\\}`),
      new RegExp(`export\\s+const\\s+${method}\\s*=`),
    ];
    if (patterns.some((p) => p.test(source))) methods.push(method.toLowerCase());
  }
  return methods;
}

function parseJsDoc(source, method) {
  const upperMethod = method.toUpperCase();
  const methodPattern = new RegExp(
    `/\\*\\*([\\s\\S]*?)\\*/[\\s\\S]{0,300}export\\s+(async\\s+)?function\\s+${upperMethod}\\b`, "m"
  );
  const altPattern = new RegExp(
    `/\\*\\*([\\s\\S]*?)\\*/[\\s\\S]{0,300}export\\s+const\\s+${upperMethod}\\s*=`, "m"
  );
  const match = source.match(methodPattern) || source.match(altPattern);
  if (!match) return null;
  const raw = match[1];
  if (!raw.includes("@openapi")) return null;

  const lines = raw.split("\n").map((l) => l.replace(/^\s*\*\s?/, "").trimEnd()).filter(Boolean);
  const result = {};
  const openApiIdx = lines.findIndex((l) => l.trim() === "@openapi");
  if (openApiIdx !== -1) {
    for (const line of lines.slice(openApiIdx + 1)) {
      const kv = line.match(/^(\w+):\s*(.+)$/);
      if (kv) {
        const [, key, val] = kv;
        if (key === "tags") result.tags = val.replace(/[\[\]]/g, "").split(",").map((t) => t.trim());
        else if (key === "summary") result.summary = val;
        else if (key === "description") result.description = val;
        else if (key === "operationId") result.operationId = val;
      }
    }
    for (const line of lines) {
      if (line.startsWith("@summary ")) result.summary = line.slice(9).trim();
      if (line.startsWith("@description ")) result.description = line.slice(13).trim();
      if (line.startsWith("@tags ")) result.tags = line.slice(6).trim().split(",").map((t) => t.trim());
      if (line.startsWith("@operationId ")) result.operationId = line.slice(13).trim();
    }
  }
  const responses = {};
  for (const line of lines) {
    const rm = line.match(/^@response\s+(\d{3})\s+(.+)$/);
    if (rm) responses[rm[1]] = { description: rm[2] };
  }
  if (Object.keys(responses).length) result.responses = responses;
  return Object.keys(result).length ? result : null;
}

function zodTypeToOas(zodType) {
  const map = {
    string: { type: "string" }, number: { type: "number" }, boolean: { type: "boolean" },
    array: { type: "array", items: {} }, object: { type: "object" },
    enum: { type: "string", enum: [] }, date: { type: "string", format: "date-time" },
    coerce: { type: "string" }, int: { type: "integer" }, float: { type: "number" },
    bigint: { type: "integer" }, nan: { type: "number" }, undefined: { type: "string" },
    null: { type: "string", nullable: true }, any: {}, unknown: {},
    record: { type: "object" }, map: { type: "object" }, set: { type: "array", items: {} },
    literal: { type: "string" }, union: {}, intersection: {}, tuple: { type: "array", items: {} },
    optional: {}, nullable: { nullable: true },
  };
  return { ...(map[zodType] || { type: "string" }) };
}

function exampleForType(name, oasType) {
  if (oasType.example !== undefined) return oasType.example;
  if (oasType.enum && oasType.enum.length > 0) return oasType.enum[0];
  switch (oasType.type) {
    case "number": case "integer": return 0;
    case "boolean": return false;
    case "array": return [];
    case "object": return {};
    default: return `<${name}>`;
  }
}

/**
 * ─── Resolve path aliases from tsconfig.json ─────────────────────────────────
 * Reads tsconfig paths (e.g. "@/*" → ["./src/*"]) so we can resolve
 * alias imports like "@/server/modules/auth/otp.schema".
 */
function loadAliases() {
  const aliases = [];
  const tsconfigPath = path.resolve(__dirname, "tsconfig.json");
  if (!fs.existsSync(tsconfigPath)) return aliases;
  try {
    const raw = fs.readFileSync(tsconfigPath, "utf-8");

    // Extract baseUrl via regex (avoids JSONC parse issues)
    const baseUrlMatch = raw.match(/"baseUrl"\s*:\s*"([^"]+)"/);
    const baseUrl = baseUrlMatch ? baseUrlMatch[1] : ".";
    const base = path.resolve(__dirname, baseUrl);

    // Extract the "paths" block via brace counting
    const pathsKeyIdx = raw.indexOf('"paths"');
    if (pathsKeyIdx === -1) return aliases;
    const braceStart = raw.indexOf("{", pathsKeyIdx);
    if (braceStart === -1) return aliases;

    let depth = 1, i = braceStart + 1, pathsBlock = "";
    while (i < raw.length && depth > 0) {
      const ch = raw[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      if (depth > 0) pathsBlock += ch;
      i++;
    }

    // Parse each alias entry: "alias/*": ["target/*"]
    const entryRe = /"([^"]+)"\s*:\s*\[\s*"([^"]+)"/g;
    let m;
    while ((m = entryRe.exec(pathsBlock)) !== null) {
      const aliasPrefix = m[1].replace(/\/\*$/, "");
      const targetPrefix = m[2].replace(/\/\*$/, "");
      aliases.push({ aliasPrefix, targetDir: path.resolve(base, targetPrefix) });
    }
  } catch { }
  return aliases;
}

const PATH_ALIASES = loadAliases();

function resolveAliasImport(importPath) {
  for (const { aliasPrefix, targetDir } of PATH_ALIASES) {
    if (importPath === aliasPrefix || importPath.startsWith(aliasPrefix + "/")) {
      const rest = importPath.slice(aliasPrefix.length);
      return path.join(targetDir, rest);
    }
  }
  return null;
}

/**
 * ─── NEW: Resolve all source files reachable from a route file ───────────────
 * Follows relative imports AND path alias imports one level deep so we can
 * read schemas defined in separate files (e.g. @/server/modules/auth/otp.schema.ts).
 */
function resolveSourceFiles(routeFile) {
  const sources = [{ file: routeFile, src: fs.readFileSync(routeFile, "utf-8") }];
  const dir = path.dirname(routeFile);

  // Match both relative ("./x") and alias ("@/x") imports
  const importRe = /from\s+['"]([^'"]+)['"]/g;
  const base = sources[0].src;
  let m;
  while ((m = importRe.exec(base)) !== null) {
    const raw = m[1];
    let resolved = null;

    if (raw.startsWith(".")) {
      // Relative import
      resolved = path.resolve(dir, raw);
    } else {
      // Try alias resolution
      resolved = resolveAliasImport(raw);
    }

    if (!resolved) continue;

    // Try common extensions
    for (const ext of [".ts", ".js", "/index.ts", "/index.js"]) {
      const candidate = resolved + ext;
      if (fs.existsSync(candidate)) {
        try {
          sources.push({ file: candidate, src: fs.readFileSync(candidate, "utf-8") });
        } catch { }
        break;
      }
      // Also try without adding extension (if already has one)
      if (ext === ".ts" && fs.existsSync(resolved)) {
        try {
          sources.push({ file: resolved, src: fs.readFileSync(resolved, "utf-8") });
        } catch { }
        break;
      }
    }
  }
  return sources;
}

/**
 * ─── CORE FIX: Parse .openapi({ example, description }) from field chains ───
 *
 * Extracts the JSON-like object passed to .openapi({ ... }) for a given field.
 * Returns { example, description } when found.
 */
function parseOpenApiMeta(fieldBlock, fieldName) {
  // Look for fieldName: z.xxx(...).openapi({ ... })
  // We search for .openapi({ inside the block and grab the content
  const openApiRe = /\.openapi\s*\(\s*\{/g;
  let om;
  const results = { example: undefined, description: undefined };

  while ((om = openApiRe.exec(fieldBlock)) !== null) {
    // Brace-count to extract the object
    let depth = 1;
    let i = om.index + om[0].length;
    let content = "";
    while (i < fieldBlock.length && depth > 0) {
      const ch = fieldBlock[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      if (depth > 0) content += ch;
      i++;
    }

    // Extract example: "value" or 'value' or example: 123 or example: true
    const exStr = content.match(/example\s*:\s*["']([^"'\\]*(\\.[^"'\\]*)*)["']/);
    const exNum = content.match(/example\s*:\s*(-?\d+(?:\.\d+)?)/);
    const exBool = content.match(/example\s*:\s*(true|false)/);
    if (exStr) results.example = exStr[1];
    else if (exNum) results.example = Number(exNum[1]);
    else if (exBool) results.example = exBool[1] === "true";

    const desc = content.match(/description\s*:\s*["']([^"'\\]*(\\.[^"'\\]*)*)["']/);
    if (desc) results.description = desc[1];
  }

  return results;
}

/**
 * ─── IMPROVED inferZodSchema ─────────────────────────────────────────────────
 * Now reads all imported source files AND extracts .openapi({ example }) values.
 */
function inferZodSchema(routeFile, source, method) {
  const upperMethod = method.toUpperCase();

  // Collect all relevant source (route file + imported schema files)
  const allSources = resolveSourceFiles(routeFile);
  const combinedSource = allSources.map((s) => s.src).join("\n\n");

  // Extract method body using brace-counting
  let body = "";
  const fnStart = source.search(new RegExp(`export\\s+(async\\s+)?function\\s+${upperMethod}\\b`));
  if (fnStart !== -1) {
    const braceIdx = source.indexOf("{", fnStart);
    if (braceIdx !== -1) {
      let depth = 1, i = braceIdx + 1;
      while (i < source.length && depth > 0) {
        if (source[i] === "{") depth++;
        else if (source[i] === "}") depth--;
        i++;
      }
      body = source.slice(fnStart, i);
    }
  }

  const allFields = {};

  // ── Strategy 1: z.object({ ... }) with .openapi() support ────────────────
  //
  // To avoid merging fields from multiple schemas in the same file (e.g.
  // sendOtpSchema + verifyOtpSchema), we first check which named schema
  // the route method actually uses (e.g. "sendOtpSchema.parse(body)"),
  // then look up that schema's z.object definition. If we can't identify
  // a specific schema, we fall back to the first z.object found.

  // 1a. Find the schema variable name used in the method body
  let targetSchemaName = null;
  if (body) {
    // Matches: someSchema.parse(...) or someSchema.safeParse(...)
    const schemaUseRe = /\b(\w+Schema|\w+Validator|\w+Input|\w+Body)\s*\.\s*(?:safe)?[Pp]arse\s*\(/g;
    const m = schemaUseRe.exec(body);
    if (m) targetSchemaName = m[1];
  }

  // 1b. Extract z.object blocks, scoped to the target schema when possible
  function extractObjectBlock(src, afterIndex = 0) {
    const zodObjRe = /z\.object\s*\(\s*\{/g;
    zodObjRe.lastIndex = afterIndex;
    const zm = zodObjRe.exec(src);
    if (!zm) return null;
    let depth = 1, i = zm.index + zm[0].length, block = "";
    while (i < src.length && depth > 0) {
      const ch = src[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      if (depth > 0) block += ch;
      i++;
    }
    return { block, endIndex: i };
  }

  function parseBlockFields(block) {
    const fields = {};
    const fieldNameRe = /^[ \t]*(\w+)\s*:\s*z\./gm;
    const fieldPositions = [];
    let fnm;
    while ((fnm = fieldNameRe.exec(block)) !== null) {
      fieldPositions.push({ name: fnm[1], index: fnm.index });
    }
    for (let fi = 0; fi < fieldPositions.length; fi++) {
      const { name, index } = fieldPositions[fi];
      const end = fi + 1 < fieldPositions.length ? fieldPositions[fi + 1].index : block.length;
      const fieldSlice = block.slice(index, end);
      const typeMatch = fieldSlice.match(/:\s*z\.(\w+)/);
      if (!typeMatch) continue;
      const zodType = typeMatch[1];
      const oasType = zodTypeToOas(zodType);
      if (/\.optional\(\)|\.nullable\(\)/.test(fieldSlice)) oasType.nullable = true;
      if (zodType === "enum") {
        const enumMatch = fieldSlice.match(/z\.enum\s*\(\s*\[([^\]]+)\]/);
        if (enumMatch) {
          oasType.enum = enumMatch[1].split(",").map((s) => s.trim().replace(/['"]/g, "")).filter(Boolean);
        }
      }
      if (zodType === "literal") {
        const litMatch = fieldSlice.match(/z\.literal\s*\(\s*['"]([^'"]+)['"]/);
        if (litMatch) oasType.example = litMatch[1];
      }
      const meta = parseOpenApiMeta(fieldSlice, name);
      if (meta.example !== undefined) oasType.example = meta.example;
      if (meta.description) oasType.description = meta.description;
      fields[name] = oasType;
    }
    return fields;
  }

  if (targetSchemaName) {
    // Find the declaration of the target schema in combinedSource, then grab its z.object
    const declRe = new RegExp(`(?:const|let|var)\\s+${targetSchemaName}\\s*=`);
    const declMatch = declRe.exec(combinedSource);
    if (declMatch) {
      const result = extractObjectBlock(combinedSource, declMatch.index);
      if (result) Object.assign(allFields, parseBlockFields(result.block));
    }
  }

  // Fallback: scan all z.object blocks (original behaviour)
  if (Object.keys(allFields).length === 0) {
    let searchFrom = 0;
    while (true) {
      const result = extractObjectBlock(combinedSource, searchFrom);
      if (!result) break;
      Object.assign(allFields, parseBlockFields(result.block));
      searchFrom = result.endIndex;
    }
  }

  if (Object.keys(allFields).length > 0) return { type: "object", properties: allFields };

  // ── Strategy 2: destructuring ─────────────────────────────────────────────
  if (body) {
    const destructureRe =
      /const\s*\{\s*([^}]+)\}\s*=\s*(?:await\s+)?(?:req\.json\(\)|request\.json\(\)|body|data|payload|json)/g;
    let dm;
    while ((dm = destructureRe.exec(body)) !== null) {
      dm[1].split(",")
        .map((s) => s.trim().split(/\s*[=:]/)[0].trim())
        .filter((s) => /^\w+$/.test(s))
        .forEach((name) => { allFields[name] = { type: "string" }; });
    }
    if (Object.keys(allFields).length > 0) return { type: "object", properties: allFields };
  }

  // ── Strategy 3: property accesses ────────────────────────────────────────
  if (body) {
    const skipWords = new Set(["then", "catch", "json", "text", "ok", "status", "headers", "method", "url", "body", "data", "payload", "error", "message"]);
    const accessRe = /(?:body|data|payload|json|input)\.([\w]+)/g;
    let am;
    while ((am = accessRe.exec(body)) !== null) {
      const name = am[1];
      if (!skipWords.has(name)) allFields[name] = allFields[name] || { type: "string" };
    }
    if (Object.keys(allFields).length > 0) return { type: "object", properties: allFields };
  }

  return null;
}

function buildOperationId(method, apiPath) {
  const segments = apiPath
    .replace(/^\/api\//, "").split("/").filter(Boolean)
    .map((s) => s.replace(/[{}]/g, "").replace(/-(\w)/g, (_, c) => c.toUpperCase()));
  const prefix = method === "get" ? "get" : method === "post" ? "create" : method;
  const base = segments.map((s, i) => (i === 0 ? s : s[0].toUpperCase() + s.slice(1))).join("");
  return prefix + base[0].toUpperCase() + base.slice(1);
}

function extractPathParams(apiPath) {
  return [...apiPath.matchAll(/\{(\w+)\}/g)].map(([, name]) => ({
    name, in: "path", required: true, schema: { type: "string" },
  }));
}

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
    "200": "Success", "400": "Bad request", "401": "Unauthorized",
    "403": "Forbidden", "404": "Not found", "422": "Validation error",
    "429": "Too many requests", "500": "Internal server error",
  };
  return Object.fromEntries(
    [...codes].sort().map((code) => [code, {
      description: descMap[code] || code,
      content: { "application/json": { schema: {} } },
    }])
  );
}

function inferTag(apiPath) {
  const parts = apiPath.replace(/^\/api\//, "").split("/").filter(Boolean);
  const tag = parts[0] || "General";
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function generate() {
  console.log(`\n🔍 Scanning: ${APP_DIR}`);
  const routeFiles = findRouteFiles(APP_DIR);
  console.log(`📂 Found ${routeFiles.length} route file(s)\n`);

  const openapi = {
    openapi: "3.0.0",
    info: { title: "API Documentation", version: "1.0.0", description: "Auto-generated from Next.js App Router" },
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
      // ── Pass the file path so we can resolve imported schemas ──
      const zodSchema = inferZodSchema(file, source, method);
      const pathParams = extractPathParams(apiPath);
      const tag = jsDoc?.tags?.[0] || inferTag(apiPath);
      tagSet.add(tag);

      const operation = {
        summary: jsDoc?.summary || `${method.toUpperCase()} ${apiPath}`,
        description: jsDoc?.description || "",
        operationId: jsDoc?.operationId || buildOperationId(method, apiPath),
        tags: jsDoc?.tags || [tag],
        parameters: pathParams,
        responses: jsDoc?.responses
          ? Object.fromEntries(Object.entries(jsDoc.responses).map(([code, val]) => [
            code, { description: val.description || code, content: { "application/json": { schema: {} } } },
          ]))
          : inferResponses(source, method),
      };

      if (["post", "put", "patch"].includes(method)) {
        // ── Build example from .openapi() annotations or fallback types ──
        const exampleObj = zodSchema
          ? Object.fromEntries(
            Object.entries(zodSchema.properties || {}).map(([k, v]) => [k, exampleForType(k, v)])
          )
          : undefined;

        // Build a clean schema (strip internal 'example' fields into the OAS example object)
        const cleanSchema = zodSchema
          ? {
            type: "object",
            properties: Object.fromEntries(
              Object.entries(zodSchema.properties || {}).map(([k, v]) => {
                const { example: _ex, ...rest } = v;
                return [k, rest];
              })
            ),
          }
          : {};

        operation.requestBody = {
          description: "Request body",
          required: true,
          content: {
            "application/json": {
              schema: cleanSchema,
              ...(exampleObj && Object.keys(exampleObj).length ? { example: exampleObj } : {}),
            },
          },
        };
      }

      openapi.paths[apiPath][method] = operation;

      const icon = zodSchema ? "📋" : jsDoc ? "📝" : "🔎";
      const fieldCount = zodSchema ? `(${Object.keys(zodSchema.properties || {}).length} fields)` : "(no schema)";
      // Show which fields have examples
      const withExamples = zodSchema
        ? Object.entries(zodSchema.properties || {}).filter(([, v]) => v.example !== undefined).map(([k]) => k)
        : [];
      const exStr = withExamples.length ? ` ✨ examples: [${withExamples.join(", ")}]` : "";
      console.log(`  ${icon}  ${method.toUpperCase().padEnd(7)} ${apiPath} ${fieldCount}${exStr}`);
    }
  }

  openapi.tags = [...tagSet].sort().map((name) => ({ name }));
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(openapi, null, 2), "utf-8");

  const pathCount = Object.keys(openapi.paths).length;
  const opCount = Object.values(openapi.paths).reduce((n, p) => n + Object.keys(p).length, 0);
  console.log(`\n✅ Done! ${pathCount} paths · ${opCount} operations`);
  console.log(`📄 Output: ${OUT_FILE}\n`);
}

generate();
