import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir, readlink } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { list } from "tar";
import ts from "typescript";

const run = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const snapshotPath = "upstream/rpiv-ask-user-question";
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const upstream = manifest.upstreamSnapshot;
const [checkout, archive] = process.argv.slice(2);
assert.ok(checkout && archive, "Usage: node --experimental-strip-types tools/verify-package.ts <upstream-git-checkout> <actual-npm-tarball>");

interface SnapshotFile {
  mode: string;
  data: Buffer;
}

function safePath(path: string) {
  assert.ok(path && !path.startsWith("/") && !path.includes("\\") && !path.split("/").some((part) => part === ".." || part === "." || part === ""), `Unsafe path: ${path}`);
}

async function readTree(directory: string): Promise<Map<string, SnapshotFile>> {
  const files = new Map<string, SnapshotFile>();
  async function walk(path: string) {
    for (const item of await readdir(path, { withFileTypes: true })) {
      const absolute = join(path, item.name);
      const name = relative(directory, absolute).split(sep).join("/");
      safePath(name);
      if (item.isDirectory()) await walk(absolute);
      else if (item.isSymbolicLink()) files.set(name, { mode: "120000", data: Buffer.from(await readlink(absolute)) });
      else {
        assert.ok(item.isFile(), `Unexpected file type: ${name}`);
        const mode = (await lstat(absolute)).mode & 0o111 ? "100755" : "100644";
        files.set(name, { mode, data: await readFile(absolute) });
      }
    }
  }
  await walk(directory);
  return files;
}

function blobId(data: Buffer) {
  return createHash("sha1").update(`blob ${data.length}\0`).update(data).digest("hex");
}

function sameInventory(actual: Map<string, SnapshotFile>, expected: Map<string, unknown>, label: string) {
  assert.deepEqual([...actual.keys()].sort(), [...expected.keys()].sort(), `${label}: missing or extra snapshot files`);
}

assert.equal(manifest.name, "@qiuyihong/pi-ask-user-question");
assert.equal(manifest.version, "0.1.0");
assert.equal(manifest.author, "Qiuyi Hong");
assert.equal(manifest.type, "module");
assert.equal(manifest.license, "MIT");
assert.equal(manifest.repository.url, "git+https://github.com/Qiuyi-Hong/pi-ask-user-question.git");
assert.equal(manifest.engines.node, ">=22.19.0");
assert.deepEqual(manifest.pi.extensions, [`./${snapshotPath}/index.ts`]);
assert.deepEqual(manifest.exports, { ".": `./${snapshotPath}/index.ts`, "./events": `./${snapshotPath}/events.ts` });
assert.deepEqual(manifest.dependencies, { "@juicesharp/rpiv-config": "2.11.0" });
assert.deepEqual(manifest.peerDependencies, {
  "@earendil-works/pi-coding-agent": "*", "@earendil-works/pi-tui": "*", "typebox": "*", "@juicesharp/rpiv-i18n": "*",
});
assert.deepEqual(manifest.peerDependenciesMeta, { "@juicesharp/rpiv-i18n": { optional: true } });
for (const field of ["workspaces", "bundledDependencies", "bundleDependencies", "overrides"]) assert.equal(manifest[field], undefined, field);
for (const hook of ["preinstall", "install", "postinstall", "prepare", "prepack", "postpack"]) assert.equal(manifest.scripts?.[hook], undefined, hook);
assert.equal(upstream.repository, "https://github.com/juicesharp/rpiv-mono");
assert.equal(upstream.directory, "packages/rpiv-ask-user-question");
assert.deepEqual(Object.keys(upstream).sort(), ["commit", "directory", "packageVersion", "repository"]);
assert.match(upstream.commit, /^[a-f0-9]{40}$/);

// Git objects, rather than a checked-out working tree, preserve upstream modes
// and bytes even when checkout filters or platform line endings are configured.
const remote = await run("git", ["-C", checkout, "config", "--get", "remote.origin.url"]);
assert.equal(remote.stdout.trim().replace(/\.git$/, ""), upstream.repository);
await run("git", ["-C", checkout, "rev-parse", "--verify", `${upstream.commit}^{commit}`]);
const tree = `${upstream.commit}:${upstream.directory}`;
const inventory = await run("git", ["-C", checkout, "ls-tree", "-rz", tree], { maxBuffer: 16_000_000 });
const expected = new Map<string, { mode: string; oid: string }>();
for (const entry of inventory.stdout.split("\0").filter(Boolean)) {
  const match = /^(\d{6}) blob ([a-f0-9]{40})\t(.+)$/.exec(entry);
  assert.ok(match, `Unsupported or incomplete Git entry: ${entry}`);
  const [, mode, oid, path] = match;
  safePath(path);
  assert.ok(["100644", "100755", "120000"].includes(mode), `Unsupported Git mode: ${mode}`);
  expected.set(path, { mode, oid });
}
assert.ok(expected.size > 0, "Empty upstream package");
const local = await readTree(join(root, snapshotPath));
sameInventory(local, expected, "Git source");
for (const [path, file] of local) {
  const source = expected.get(path)!;
  assert.equal(file.mode, source.mode, `Git mode: ${path}`);
  assert.equal(blobId(file.data), source.oid, `Git bytes/target: ${path}`);
}
assert.equal(JSON.parse(local.get("package.json")!.data.toString("utf8")).version, upstream.packageVersion);

// Check every production module, including deferred modules, rather than the
// upstream npm 'files' subset. Monorepo-only tests/fixtures are snapshot data.
const production = [...local.keys()].filter((path) => path.endsWith(".ts") && !path.endsWith(".test.ts") && path !== "test-fixtures.ts");
const importedPackages = new Set<string>();
for (const path of production) {
  const source = ts.createSourceFile(path, local.get(path)!.data.toString("utf8"), ts.ScriptTarget.Latest, true);
  function checkSpecifier(value: string) {
    if (value.startsWith(".")) {
      const target = resolve(root, snapshotPath, dirname(path), value.replace(/\.js$/, ".ts"));
      const relativeTarget = relative(join(root, snapshotPath), target).split(sep).join("/");
      safePath(relativeTarget);
      assert.ok(local.has(relativeTarget), `Missing relative import: ${path} -> ${value}`);
    } else if (!value.startsWith("node:")) {
      const packageName = value.startsWith("@") ? value.split("/").slice(0, 2).join("/") : value.split("/")[0];
      assert.ok(packageName in manifest.dependencies || packageName in manifest.peerDependencies, `Undeclared import: ${path} -> ${value}`);
      importedPackages.add(packageName);
    }
  }
  function visit(node: ts.Node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) checkSpecifier(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) checkSpecifier(node.arguments[0].text);
    ts.forEachChild(node, visit);
  }
  visit(source);
}
assert.deepEqual([...importedPackages].sort(), [...Object.keys(manifest.dependencies), ...Object.keys(manifest.peerDependencies)].sort());
for (const path of [...manifest.pi.extensions, ...Object.values<string>(manifest.exports)]) assert.ok(local.has(path.slice(`./${snapshotPath}/`.length)), `Missing public entry: ${path}`);

const packed = new Map<string, SnapshotFile>();
await list({
  file: archive, strict: true,
  onReadEntry(entry) {
    assert.ok(entry.path.startsWith("package/"), `Unexpected tarball root: ${entry.path}`);
    const path = entry.path.slice("package/".length).replace(/\/$/, "");
    safePath(path);
    assert.ok(!path.split("/").includes("node_modules"), `Installed dependency tree: ${path}`);
    if (entry.type === "Directory") { entry.resume(); return; }
    assert.ok(!packed.has(path), `Duplicate tarball file: ${path}`);
    assert.ok(entry.type === "File" || entry.type === "SymbolicLink", `Unexpected tarball type: ${path}: ${entry.type}`);
    const file: SnapshotFile = { mode: entry.type === "SymbolicLink" ? "120000" : (entry.mode ?? 0) & 0o111 ? "100755" : "100644", data: Buffer.alloc(0) };
    packed.set(path, file);
    const chunks: Buffer[] = [];
    entry.on("data", (chunk: Buffer) => chunks.push(chunk));
    entry.on("end", () => { file.data = entry.type === "SymbolicLink" ? Buffer.from(entry.linkpath ?? "") : Buffer.concat(chunks); });
    entry.resume();
  },
});
const packedSnapshot = new Map([...packed].filter(([path]) => path.startsWith(`${snapshotPath}/`)).map(([path, file]) => [path.slice(snapshotPath.length + 1), file]));
sameInventory(packedSnapshot, local, "Actual tarball");
for (const [path, file] of packedSnapshot) {
  const source = local.get(path)!;
  assert.equal(file.mode, source.mode, `Tarball mode: ${path}`);
  assert.deepEqual(file.data, source.data, `Tarball bytes/target: ${path}`);
}
const downstreamFiles = ["package.json", "README.md", "LICENSE", "docs/requirements.md"];
assert.deepEqual([...packed.keys()].filter((path) => !path.startsWith(`${snapshotPath}/`)).sort(), downstreamFiles.sort());
for (const path of downstreamFiles) assert.deepEqual(packed.get(path)!.data, await readFile(join(root, path)), `Downstream artifact file: ${path}`);
assert.ok(local.get("LICENSE")!.data.toString("utf8").includes("Copyright (c) 2026 juicesharp"));
const tarball = await readFile(archive);
const treeIdentity = await run("git", ["-C", checkout, "rev-parse", tree]);
console.log(JSON.stringify({
  name: manifest.name, version: manifest.version, upstreamSnapshot: upstream,
  snapshotTree: treeIdentity.stdout.trim(), snapshotFiles: local.size,
  productionModules: production.length, artifactFiles: packed.size,
  integrity: `sha512-${createHash("sha512").update(tarball).digest("base64")}`,
  sourceFidelity: "Complete paths, bytes, types/targets, and executable modes match Git objects",
  artifactFidelity: "Complete snapshot and downstream distribution files match checked source",
  relativeImports: "All production relative module targets exist",
  metadata: "Identity, provenance, direct entries, host peers, config pin, and optional i18n checked",
}, null, 2));
