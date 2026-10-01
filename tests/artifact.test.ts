import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { create } from "tar";

const run = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));

test("actual npm artifact retains the complete pinned upstream package and downstream requirements", { timeout: 120_000 }, async () => {
  const scratch = await mkdtemp(join(tmpdir(), "pi-artifact-"));
  let source = process.env.UPSTREAM_CHECKOUT;
  if (!source) {
    source = join(scratch, "upstream-repository");
    await run("git", ["clone", "--filter=blob:none", "--no-checkout", "--single-branch", "https://github.com/juicesharp/rpiv-mono.git", source]);
  }
  const packed = await run("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", scratch], { cwd: root });
  const [artifact] = JSON.parse(packed.stdout);
  const checked = await run(process.execPath, ["--experimental-strip-types", "tools/verify-package.ts", source, join(scratch, artifact.filename)], { cwd: root });
  const report = JSON.parse(checked.stdout);
  assert.equal(report.snapshotFiles, 105);
  assert.equal(report.artifactFiles, 109);
  assert.equal(report.integrity, artifact.integrity);
  assert.equal(report.snapshotTree, "113f1dd1714cacb47fc0b9e5679029a64f22c4b5");

  // An image omitted by upstream's npm runtime subset still belongs to this
  // complete downstream snapshot. Exercise the actual archive boundary.
  const reduced = join(scratch, "missing-upstream-image.tgz");
  await create({ cwd: root, file: reduced, gzip: true, prefix: "package", filter: (path) => path !== "upstream/rpiv-ask-user-question/docs/cover.png" },
    ["package.json", "README.md", "LICENSE", "docs/requirements.md", "upstream/rpiv-ask-user-question"]);
  await assert.rejects(
    run(process.execPath, ["--experimental-strip-types", "tools/verify-package.ts", source, reduced], { cwd: root }),
    (error: unknown) => error instanceof Error && error.message.includes("Actual tarball: missing or extra snapshot files"),
  );
});
