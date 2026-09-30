# Pi Ask User Question

Downstream packaging of [juicesharp's `@juicesharp/rpiv-ask-user-question`](https://github.com/juicesharp/rpiv-mono/tree/main/packages/rpiv-ask-user-question). The questionnaire, tool, UI, events, and localization code are a complete unchanged upstream snapshot. Qiuyi Hong maintains the downstream package; this is a separate distribution, without upstream endorsement.

The authoritative package is the repository's outer root, named `@qiuyihong/pi-ask-user-question`, version `0.1.0`. Pi loads the snapshot's existing TypeScript factory directly. The public package exports are `.` and `./events`. Use Pi's loader for these TypeScript entry points.

## Prepare and install locally

Use Pi **0.99.1**'s normal npm-distributed Node CLI and Node **22.19.0 or later within 22.x, or 24.x**. See the [requirements and evidence matrix](docs/requirements.md) for the approved support target and combinations actually checked.

From a clean checkout of the downstream repository, prepare the **outer root** explicitly:

```sh
npm ci --omit=dev --legacy-peer-deps --ignore-scripts --no-audit --no-fund
pi install /absolute/path/to/pi-ask-user-question
pi list
```

On Windows, pass the absolute checkout path in quotes when it contains spaces. Pi does not install dependencies for local sources. `--legacy-peer-deps` suppresses npm's automatic host-peer installation. Required config is installed at `2.11.0`; its own transitive dependencies remain intact. No install-time source transformation runs.

Install the outer directory, rather than `upstream/rpiv-ask-user-question/`. The nested manifest records upstream context and module scope. It is neither a workspace nor an independently supported downstream installation root.

English fallback requires no i18n package. The optional i18n peer contract is retained; the full integration-present setup and validation belong to the later compatibility matrix. This initial slice establishes prepared local installation with i18n absent. No npm release or downstream Git release tag has been published by this work.

For questionnaire usage and keyboard controls, read the unchanged [upstream README](upstream/rpiv-ask-user-question/README.md) and [keyboard documentation](upstream/rpiv-ask-user-question/docs/keyboard.md). Their upstream installation examples refer to the upstream package; use the outer-root instructions above for this downstream package.

## Identify the installation

`pi list` shows configured sources. Inspect the selected **outer** manifest to identify the installed downstream version and its pinned upstream source:

```sh
node --input-type=module -e 'import fs from "node:fs"; const p = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); console.log(JSON.stringify({name:p.name, version:p.version, upstreamSnapshot:p.upstreamSnapshot}, null, 2));' /absolute/path/to/pi-ask-user-question/package.json
git -C /absolute/path/to/pi-ask-user-question rev-parse HEAD
```

The four `upstreamSnapshot` fields in the outer manifest are the source of truth: repository, package directory, full immutable commit, and original package version. The nested version is distinct from the downstream version and does not establish npm publication of that commit. A configured source alone does not prove which contents are installed; inspect the actual local/Git checkout too.

## Maintainer checks

```sh
npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund
npm run typecheck
node --experimental-strip-types --test tests/local-install.test.ts
npm pack --ignore-scripts --pack-destination /absolute/path/to/artifacts
node --experimental-strip-types tools/verify-package.ts /absolute/path/to/rpiv-mono /absolute/path/to/artifacts/qiuyihong-pi-ask-user-question-0.1.0.tgz
npm test
```

The downstream smoke test installs real Pi 0.99.1 in a fresh environment and drives its terminal questionnaire through a local model fixture. It uses isolated Pi state, workspace, HOME, npm configuration/cache, and dependency trees; on macOS candidate processes also run under a filesystem sandbox. Diagnostics are retained in the temporary directory printed by the test. Preserved upstream tests require their monorepo's tooling and are not the downstream test command.

For artifact inspection, use a read-only clone of `https://github.com/juicesharp/rpiv-mono.git` with the full `upstreamSnapshot.commit` available. The verifier compares the local snapshot to Git objects, then compares the actual tarball to that checked snapshot, including file types, symlink targets, executable modes, non-runtime files, and the full MIT notice. It also checks the outer metadata and all production relative imports. `npm test` runs these checks and the local smoke; `UPSTREAM_CHECKOUT` may point to the same source clone to avoid refetching it.

The npm artifact ships the complete snapshot, including tests, fixtures, changelog, docs/images, locales, original manifest, and [full upstream MIT notice](upstream/rpiv-ask-user-question/LICENSE). The downstream additions use [MIT](LICENSE). Credits and license notices remain attached to the unchanged upstream material.
