# Upstream package and Pi host contract

Research for [Establish upstream package and Pi host requirements](https://github.com/Qiuyi-Hong/pi-ask-user-question/issues/2), a child of [Chart an upstream-faithful TypeScript package with reviewed sync PRs](https://github.com/Qiuyi-Hong/pi-ask-user-question/issues/1). Observed **2026-09-29 UTC**. This is factual research, not an architecture decision or an installation-failure reproduction.

Vocabulary: **upstream package** = `@juicesharp/rpiv-ask-user-question`; **upstream snapshot** = unchanged material at an identified upstream revision; **downstream package** = this project's separately defined installable package. No upstream snapshot or executable product code was added to this checkout.

## Executive findings

1. npm `latest` was **2.11.0**, published from reported `gitHead` **`61904e69e1a50e12585bdf15f0310e633a62ba36`**. Upstream repository `main` was the later **`d74b1c99830a565f3df3f37e0a36616d17ffc574`**. The actual npm tarball has **57 files**, including **40 TypeScript files**, not compiled JavaScript. Every tarball file matches both inspected source revisions byte-for-byte; the package directory differs between those revisions only by an unshipped `CHANGELOG.md` addition. They are still distinct provenance references. [U1] [U2] [U3]
2. Both source and tarball declare **`typebox: "^1.1.24"` in `dependencies`**. The current import is `"typebox"`, not `"@sinclair/typebox"`. Coding-agent and TUI already have `"*"` peers. A sibling runtime dependency, `@juicesharp/rpiv-config`, also depends on `typebox`. [U4] [U5] [U6]
3. Installed Pi and registry `latest` were both **0.99.1**. In this version the reported text is an **extension-package warning during resource loading**, not an installer rejection. It checks the selected package root's `dependencies`; it does **not** validate peer ranges or recursively inspect all manifests. Its regression test explicitly expects the extension to remain loaded. The precise user's installed artifact, host version, command and full log are unknown. [P1] [P2] [P3]
4. An unchanged nested snapshot manifest can coexist with a separately defined downstream manifest. npm does not automatically install the dependencies of arbitrary nested manifest files; Pi does not globally validate every manifest in a directory tree. The selected installation root and declared extension paths determine discovery and warning ownership. Nested manifests still matter to module scope, directory-entry discovery, workspaces if explicitly selected, and direct installation of the nested directory. This establishes a possibility, **not a chosen layout or proof that the real extension works**. [P2] [P4] [P5] [N1]
5. Retaining the manifest alone does not preserve runtime dependency availability: the selected downstream package must supply non-host runtime dependencies and ship the complete TypeScript import graph and associated locale assets. Wildcard host peers do not prove API compatibility with all Pi versions. [U4] [U7] [P6]

## Inspected source/version inventory

| Item | Exact observation | Evidence |
| --- | --- | --- |
| Research checkout | `research/upstream-package-pi-contract`, base `2d9d3394e9c18ba1ea876f9b7a6fce2c6e641e08`; initially clean | Local `git status --short`, `git rev-parse HEAD` |
| Upstream repository HEAD | `d74b1c99830a565f3df3f37e0a36616d17ffc574`; commit dated 2026-09-21T19:32:16Z | `gh api repos/juicesharp/rpiv-mono/commits/main`; [U1] |
| Upstream npm artifact | `@juicesharp/rpiv-ask-user-question@2.11.0`; `latest=2.11.0`; publication timestamp 2026-09-21T18:48:15.458Z | Versioned registry metadata [U3] and package-wide `npm view` |
| Artifact's reported source | `gitHead=61904e69e1a50e12585bdf15f0310e633a62ba36`, “Release v2.11.0”, dated 2026-09-21T18:45:38Z | [U2] [U3]; independently fetched source archive |
| Installed Pi | `@earendil-works/pi-coding-agent@0.99.1`, global installation under `/Users/qiuyihong/.nvm/versions/node/v24.14.1/lib/node_modules/` | Installed `package.json`, docs and `dist` files read directly |
| Registry Pi latest | `0.99.1`; reported `gitHead=d86654abb8862e201933517d6f1fce9f88dd117f` | [P1]; downloaded and inspected tarball |
| Pi source HEAD | `1b347794e2a630e4359f2584f4eea388145d0ddf`; source manifest version `0.99.1` | `gh api repos/earendil-works/pi/commits/main` and pinned contents [P7] |
| Probe tools | Node `v24.14.1`, npm `11.16.0` | `node --version`, `npm --version`; these are probe tools, not upstream's publication toolchain |

The five inspected Pi contract files (`resource-loader.ts`, `package-manager.ts`, `extensions/loader.ts`, `pi-manifest.ts`, `utils/git.ts`) are byte-identical between Pi's published `gitHead` and inspected source HEAD. Installed package metadata, package/extension/SDK docs, and the inspected resource/package/extension-loader and virtual-module `dist` files match the downloaded 0.99.1 artifact. These checks do not assert that every installed file or every source-HEAD file was audited.

### Artifact identifiers

**Upstream 2.11.0** ([metadata][U3], [tarball][U8]):

- SHA-512 integrity: `sha512-nSj0CfJ/cx1/I860eB8zbP/vfceriTah6yQR4fQm9gapmL02Vfy+CEuiLu3Sqcd1xhMv230ZCV/bhuZ1LFq1Pw==`
- SHA-1 shasum: `66ab175b0e7b73d8ef53f88c85916a4c12c4f7ec`
- `fileCount=57`, `unpackedSize=269610`, `_hasShrinkwrap=false`.
- Published metadata records Node `22.19.0` / npm `11.14.1`. These describe publication, not an enforced consumer requirement.

**Pi 0.99.1** ([metadata][P1], [tarball][P8]):

- SHA-512 integrity: `sha512-cWUrTOqA5M73cOYMgsh9PlhDrsBhavd+n5kVY6F7BGbGl1RjqCteVCoeVMVqhngoGACVDyw1tbLjajL8l9jrHg==`
- SHA-1 shasum: `00e7e6c668d67d0825fc8814d80097eb07ec44e0`.

“Latest” and branch HEAD are observations, not durable pins. Registry `gitHead` is publisher metadata, not by itself proof of a clean source tree; the independent byte comparisons above establish the inspected relationship.

## Upstream package boundary and execution assumptions

### Boundary and entry points

The actual package root is **`packages/rpiv-ask-user-question/`**, not the monorepo root and not an assumed `src/` or `dist/` directory. Its manifest's `repository.directory` agrees. The private root manifest declares `workspaces: ["packages/*"]`. [U4] [U9]

The package is ESM (`"type": "module"`) with:

- Pi entry: `pi.extensions: ["./index.ts"]`.
- npm exports: `".": "./index.ts"`, `"./events": "./events.ts"`.
- No `main`, `types`, `bin`, build script, install script, package-local dev dependencies, or package-local `engines` declaration.

`index.ts` defaults to a factory taking `ExtensionAPI`; it registers the tool and reconciler. It imports local files using **`.js` specifiers although the shipped files are `.ts`**, and uses top-level awaited optional imports for i18n. The questionnaire-session graph is dynamically imported on demand and pre-warmed on a timer; merely finding `index.ts` does not validate later UI imports. [U4] [U7] [U10]

The source dependency graph is internal to this package for relative production imports; a static scan of all 40 shipped TS files found no missing `.js`-to-`.ts` targets. This is a filename-closure check, not parsing, typechecking, or execution.

### External dependencies

| Import / package | Actual role and manifest |
| --- | --- |
| `@earendil-works/pi-coding-agent` | Host types and runtime UI helpers, e.g. `DynamicBorder`, `getMarkdownTheme`, a dynamic import for external-editor integration; peer `"*"` |
| `@earendil-works/pi-tui` | Runtime key parsing, editors, components, widths and rendering; peer `"*"` |
| `typebox` | Runtime `Type` schemas in `tool/types.ts`; dependency `"^1.1.24"` |
| `@juicesharp/rpiv-config` | Required static runtime config/guidance imports from `config.ts`; dependency `"^2.11.0"` |
| `@juicesharp/rpiv-i18n` and `/loader` | Optional dynamic imports caught with English fallbacks; peer `"*"`, `peerDependenciesMeta.optional=true` |
| `node:child_process`, `node:fs`, `node:os`, `node:path` | Built-ins used for external-editor integration; not npm dependencies |

Sources: manifest [U4], config imports [U5], schema import [U6], optional imports [U7] [U11], and UI graph [U12]. Neither `pi-ai` nor `pi-agent-core` is directly imported by the shipped upstream package.

`@juicesharp/rpiv-config@2.11.0` is both a sibling workspace package and a published package, not a `workspace:`-protocol dependency. Its inspected tarball contains five files: `package.json`, `README.md`, `CHANGELOG.md`, `index.ts`, `config.ts`. It exports `./index.ts`; `index.ts` re-exports `./config.js`; `config.ts` imports **`typebox` and `typebox/value`**. It declares `typebox: "^1.1.24"` as a dependency, with no host peers. [U13] [U14]

Its registry `gitHead` is the same upstream release SHA. Integrity is `sha512-fjySBPar14qTPNMNPRYmH24YCaQ0r8xzW4P4jz8/Ph7JLFzIa+TM3ySzg9jRq0hh8wVqIAD4j4pcU66fdCkIag==`, shasum `20b7111960649d4ccb4982d50b03d2a689ef8492`. The range `^2.11.0` does not itself fix every future resolved installation to this inspected version.

### Files, build and tests

The explicit `files` list ships the TS module tree, `locales/`, Markdown `docs/`, README and LICENSE; it excludes top-level docs PNG/JPG/SVG images. The actual artifact contains **40 `.ts`, nine locale JSON files plus `package.json`, six `.md`, and LICENSE**. It has no JS, declaration files, tests, test fixtures, package-local changelog, lockfile, node_modules or compiled output. The repository directory contains **35 `.test.ts` files**, additional assets, `test-fixtures.ts` and changelog. [U4] [U8]

The package test command is `vitest run`, but its tooling lives in the monorepo: root dev dependencies include TypeScript `6.0.3`, Vitest `4.1.10`, Pi packages `0.80.6` and TypeBox `1.3.6`; root engines are Node `>=22.0.0` and npm `>=11.0.0`. Root checking is Biome with `--write`, then `tsc --noEmit`; root publishing calls that check. This is **not a package-local compilation contract**. [U9]

Root TS settings use ES2022, `module/moduleResolution: Node16`, strict checking, `noEmit: true`. Root Vitest configuration includes all workspace tests and `test/setup.ts`, which imports/resets modules in unrelated workspaces. Several package tests import private, unpublished **`@juicesharp/rpiv-test-utils`**; localization tests also import i18n. The ship-manifest test checks coverage of production TS files. Copying the package directory alone therefore does not establish a self-contained runnable upstream test environment; the npm artifact is not a test distribution. These tests/configurations were read, **not executed**. [U15] [U16] [U17] [U18]

The upstream README says Node 22+, whereas Pi 0.99.1's manifest requires **Node `>=22.19.0`**. Upstream wildcard Pi peers and older development pins provide no proven minimum or maximum Pi API compatibility. [U19] [P1]

## Pi host-provided dependency contract

### Exact names and ranges

Pi's package documentation lists five canonical host-provided packages, to be declared as `peerDependencies` with exactly **`"*"`**, not placed in `dependencies` or bundled:

- `@earendil-works/pi-ai`
- `@earendil-works/pi-agent-core`
- `@earendil-works/pi-coding-agent`
- `@earendil-works/pi-tui`
- `typebox`

The warning implementation additionally recognizes compatibility names: **`@mariozechner/pi-ai`, `@mariozechner/pi-agent-core`, `@mariozechner/pi-coding-agent`, `@mariozechner/pi-tui`, `@sinclair/typebox`**. Loader aliases/virtual modules map these old spellings to the current host modules; the old TypeBox spelling is not the actual import in this upstream artifact, nor proof of compatibility with every historical TypeBox API. [P2] [P6] [P9] [P10]

For the shipped upstream graph the directly applicable canonical peers are **coding-agent, TUI and typebox**. `@juicesharp/rpiv-config` and optional i18n are **not** host-provided by Pi's list or module mapping.

### What “validation” actually does in 0.99.1

`collectExtensionPackageWarnings()` in `resource-loader.ts:53–107`:

1. Takes enabled extension paths and their **`metadata.packageRoot`**, deduplicating roots.
2. Reads those roots' `package.json` files and checks keys in **`dependencies` only**.
3. Produces a warning listing recognized host names, regardless of whether a physical copy is actually installed.
4. Does not read `peerDependencies`, test their `"*"` range, inspect dev/optional dependencies, verify bundling, walk ancestors for ownership, or recursively validate nested/transitive manifests.

Reload collects this warning, still loads the extension set, then merges warnings. Main/TUI diagnostics label it `warning`; the regression test expects one loaded extension and the warning together. Invalid JSON in an enabled package-root manifest is a separate fatal parse case covered by another test. [P2] [P3] [P11] [P12]

The wording was added by commit **`8d897edaa69bf810fa6d14f854ce0cf101f11093`**, dated 2026-09-23, to warn about duplicate runtime modules and suppress git peer installs. This chronology reinforces that source, artifact and host versions must be recorded; it does not identify the user's host. [P13]

### Runtime resolution and install flags

Pi loads extension modules through Jiti and expects a default factory function. Import/factory failures become extension load errors, separately from package warnings. Its current modes differ: [P20]

- Bundled Node / compiled binaries use host **virtual modules** with `tryNative: false`.
- Pi's TypeScript source runtime uses virtual modules and `tsconfigPaths: true`.
- Unbundled built Node uses host aliases.

Mapped specifiers include the canonical/legacy roots above, TypeBox `/compile` and `/value`, and Pi-AI `/compat`, `/oauth`, `/providers/all`. The AI root resolves to its compatibility entry. This is a specific mapping table, **not a guarantee for every arbitrary package subpath**. [P9] [P10]

The docs warn that physical host copies can bypass mapping in compiled ESM and duplicate classes/registries. A source regression test demonstrates physical dependency resolution in compiled ESM. Thus a correct manifest is not equivalent to proof of host-singleton resolution for every environment. [P6] [P14]

Managed npm installs use `npm install <spec> --prefix <root> --legacy-peer-deps`; managed git dependency installs use `npm install --omit=dev --legacy-peer-deps`. pnpm equivalents disable automatic peers and strict peer checks; Bun omits peers (and dev dependencies for git). An unknown custom package manager falls back to plain git `install`. These Pi argument builders **do not automatically add `--ignore-scripts`**; research probes explicitly did. [P15]

Consequently npm-managed Pi peers are not auto-installed or semver-solved by Pi's npm command. Ordinary npm outside Pi normally auto-installs non-optional peers; declaration and runtime host provision are distinct contracts. Local paths are not dependency-installed by Pi. [P15] [N1]

## Installation paths and nested manifests

| Source | Selected package root / installation | Discovery and failure boundary |
| --- | --- | --- |
| `npm:@juicesharp/rpiv-ask-user-question@2.11.0` | npm installs the registry artifact beneath Pi's managed npm storage; package root is its installed name directory, not the repository root | Pi reads that artifact root's `pi.extensions`; here it selects `index.ts`. The root's direct `typebox` declaration qualifies for the warning in 0.99.1. Dependency/network/script errors can fail installation independently; the warning is not that failure. |
| Pi `git:` or supported GitHub repository URL | Clone/reconcile repository at requested ref; dependency install runs in **clone root** when its `package.json` exists | Pi reads clone-root `pi` or conventional `extensions/`, `skills/`, `prompts/`, `themes/`. It does not use `repository.directory`, enumerate npm workspaces as Pi packages, or select `packages/rpiv-ask-user-question` automatically. |
| `pi install ./directory` | Existing resolved directory, no copy or dependency installation | Directory root supplies metadata/manifest; nested resources must be selected by manifest/conventions. Missing dependencies can subsequently fail loading. |
| Local file / explicit `-e ./index.ts` | Direct extension path, not npm installation | No inferred ancestor package-root warning ownership. Import/factory validation still happens; bypassing a warning is not dependency correction. |

Sources: install dispatch [P4], source/resource resolution [P5] [P16], git parser [P17], discovery [P18], extension import/factory errors [P20]. User installations are persisted to settings by `installAndPersist`; it was not called during this research.

For **this upstream monorepo**, the repository root has a private workspace manifest, **no `pi` resource manifest and no conventional root resource directories**. A direct Pi git source therefore does not discover this child package through normal package-root collection. A local root-directory source is forwarded as an extension-directory fallback when no package resources exist; that still does not recursively choose the workspace child. Installing the actual child directory locally is a different input. Neither the whole upstream git install nor the fallback directory was executed. [U9] [P5] [P18]

The git source structure has repository/ref fields, **no package-subdirectory selector**. A parse-only probe of the GitHub browser `tree/main/packages/...` URL retained that browser URL as the clone URL; it did not produce a child-package path. This is not a demonstrated clone failure, but it cannot be treated as supported subdirectory installation. Pi `git:` handling also differs from npm's own git-dependency packaging/build behavior. [P17] [N1]

### Coexistence facts, without selecting an architecture

- **Outer npm manifest versus nested snapshot:** a tarball may contain a nested, unchanged original `package.json`. With no workspace/dependency selection of that nested package, npm resolves the outer package's dependency declarations, not all nested manifests. An inert fixture containing the exact original nested manifest packed successfully; an offline lock-only resolution with peers disabled resolved only the outer fixture, not nested `typebox` or config dependencies. [N1] (probe evidence below)
- **Pi resource root versus nested entry:** outer `pi.extensions` may name a nested file. Pi resolves it relative to the outer root and preserves the outer `packageRoot` metadata. If the entry is a directory, smart extension discovery can read that nested directory's `pi.extensions`, or fall back to its `index.ts`/`index.js`; warning ownership still remains outer in this inspected path. No global recursive manifest rejection occurs. [P2] [P5] [P18]
- **Selecting the nested directory directly changes ownership:** it becomes the package root, so its original direct `typebox` dependency qualifies for the warning. Registering it as an npm dependency/workspace also gives its manifest dependency-resolution relevance. The mere presence of a second manifest and explicit selection of that manifest are different facts.
- **Module boundary remains:** a nested `"type": "module"` is still a nearest package scope for Node/Jiti semantics. `exports` regulates package-name entry points, not an outer manifest's direct filesystem selection. A manifest is not merged into the outer manifest just because its code is imported. [N2]
- **Shipping and dependencies remain necessary:** relative TS imports require their sibling tree; i18n locale loading anchors `./locales/<code>.json` to `index.ts`'s `import.meta.url`. Bare config imports require an available installed dependency. Host peers must be declared by the installable package rather than assumed to be installed from nested data. [U7] [U20] [P6]
- **Transitive caveat:** moving only the outer direct `typebox` declaration does not remove the inspected config dependency's own `typebox` declaration or guarantee absence of a physical TypeBox copy. Pi's warning does not audit that transitive manifest. This is a constraint for later review, not a recommendation to edit or vendor config.
- **Discovery is not execution:** `readPiManifest` accepts a `pi` object and string-array resource fields; it is not a full npm/peer validator. Explicit entries/globs feed filesystem collection; absent `pi` uses conventional resource directories. Direct directory entries can use the nested entry rules above. Missing manifest-entry paths can simply produce no resources; imports/factories can fail later. [P18] [P19]

Pi/Jiti supports TS without a separate compilation step, and an own-code probe verified a `./child.js` import resolving `child.ts`. Do **not** generalize this to raw Node execution: Node 24.14.1's native TS loader does not rewrite `.js` specifiers or load TS under `node_modules`; native ESM resolution does not search extensions. The upstream artifact depends on an appropriate loader; none of its executable modules were run here. [P20] [N2] [N3]

## License and attribution

The upstream package's shipped LICENSE is **MIT**, with **`Copyright (c) 2026 juicesharp`**; the monorepo root LICENSE has the same text. The package author/registry author is `juicesharp`. [U4] [U21]

The grant permits use, copying, modification, merging, publishing, distribution, sublicensing and sale, conditioned on including the copyright notice and permission notice in **all copies or substantial portions**. Keep the full upstream LICENSE accompanying redistributed snapshot material and do not remove the original notice. Merely setting an outer npm `license` field or linking to upstream is not a substitute for shipping the notice.

The inspected text does not require an upstream PR, source publication, a particular downstream package name, or preservation of npm's `author` field as a license condition. Accurate upstream attribution/provenance and the project's unchanged-snapshot requirement are separate considerations. No separate NOTICE or additional source-header attribution requirement was found in the inspected package. This is a reading of the distributed license, not a determination about every possible downstream addition.

Config also declares MIT and shares the root licensing context, but its inspected five-file npm artifact has **no LICENSE file**. That packaging fact does not erase the root grant; any later redistribution of config source needs its applicable notice considered too. Ordinary installation of config as a dependency is distinct from copying its source into a snapshot.

## Validation and safe probe evidence

All archives, metadata snapshots, comparison scripts, synthetic fixtures and logs were written only to **`/tmp/pi-upstream-contract.oI4ZjY/`**, outside every project checkout. Installed official Pi was read/imported for metadata/discovery helpers; **no upstream extension, upstream test, or lifecycle script was executed**. No actual Pi install/reload/session, user settings change, GitHub write, commit, push or publishing occurred.

Read-only source/artifact retrieval is reproducible with pinned inputs:

```sh
# Run from an external scratch directory, not a project checkout.
gh api repos/juicesharp/rpiv-mono/tarball/d74b1c99830a565f3df3f37e0a36616d17ffc574 > upstream-head.tgz
gh api repos/juicesharp/rpiv-mono/tarball/61904e69e1a50e12585bdf15f0310e633a62ba36 > upstream-release.tgz
npm view @juicesharp/rpiv-ask-user-question@2.11.0 --json --ignore-scripts > upstream-metadata.json
curl -fsSL https://registry.npmjs.org/@juicesharp/rpiv-ask-user-question/-/rpiv-ask-user-question-2.11.0.tgz -o upstream-npm.tgz
gh api repos/earendil-works/pi/tarball/d86654abb8862e201933517d6f1fce9f88dd117f > pi-source.tgz
npm view @earendil-works/pi-coding-agent@0.99.1 --json --ignore-scripts > pi-metadata.json
```

| Check | Observed result | Limit |
| --- | --- | --- |
| Python SHA-512/SHA-1 and file count against registry metadata | Upstream integrity/shasum/count passed; Pi tarball SHA-512 passed | Hash checks are not a publisher trust or security audit |
| Compare all 57 upstream artifact files with pinned release and HEAD archives | Zero mismatches with either source; only package-directory source difference is changelog's `Unreleased` heading | No assertion that repository HEAD equals publication commit |
| Static relative-import filename scan | No missing relative `.js`-to-`.ts` targets across 40 shipped TS files | No upstream module execution or typecheck |
| Official installed `DefaultPackageManager.resolveExtensionSources` with inert local fixtures and in-memory settings, `PI_OFFLINE=1` | Outer direct nested file and nested-directory entry each discover one placeholder; both retain outer packageRoot. Direct nested target owns nested packageRoot | Files contain own inert placeholders, not executable upstream source |
| Isolated exact warning function from installed `dist/core/resource-loader.js`, evaluated with scratch fs inputs | Original manifest as selected nested root warns about `typebox`; valid outer root does not. Changing an outer peer to `^1.0.0` still produces no warning | Function-level probe, not real extension load or symptom reproduction |
| `npm pack --ignore-scripts --json` on own fixture | Included outer manifest, nested original manifest and inert placeholder | No upstream scripts or extension execution |
| `npm install --package-lock-only --ignore-scripts --legacy-peer-deps --offline --no-audit --no-fund <own-fixture.tgz>` | Only outer fixture resolved; no `node_modules` created and no nested dependency resolution | Tests inert nested-data case, not workspace/dependency selection |
| Installed Jiti own TS fixture (`tryNative:false`, `moduleCache:false`) | `./child.js` resolves own sibling `child.ts`, result `7` | Confirms this basic loader rule, not full upstream compatibility |
| Read Pi regression tests and warning introduction diff through `gh` | Warning-plus-loaded-extension expectation and managed-peer suppression documented | Tests were inspected, not run |

Exploratory CLI/search mistakes (an incompatible `gh issue view` flag combination and two guessed test filenames) were corrected; they did not block source acquisition. Logs and fixtures are temporary, not durable deliverables; the pinned inputs, methods and outcomes above are the durable record.

## Open uncertainties and later decision implications

**Unverified user inputs:** exact upstream package version/tarball, dependency tree/lockfile, Pi version and runtime form, `npmCommand`, installation source/command, diagnostic phase and accompanying errors. The supplied phrase alone cannot establish installation rejection, a load failure, a broken tool, or an identical failure across versions. Do not manufacture such a reproduction.

**Unverified behavior:** complete upstream runtime/API compatibility on Pi 0.99.1 or other hosts; native versus Jiti resolution of every dynamic/transitive import; interactions when optional i18n is separately installed; all npm/pnpm/Bun tree layouts. These require explicitly authorized real-artifact execution with controlled inputs, not more manifest speculation.

Facts that later human decisions must account for:

- Which pinned **source boundary** is intended for an upstream snapshot: repository package directory versus published subset? The artifact omits tests/assets/changelog; they are not interchangeable records.
- Which installation root must work for each distribution? A valid npm artifact root does not automatically make its repository-root git source discoverable, and a browser subdirectory URL is not a package selector.
- Which non-host dependencies and optional integrations are part of the supported runtime contract? Config introduces a transitive TypeBox dependency; optional peers are suppressed by managed installs.
- What host/runtime versions and checks will substantiate compatibility, beyond required wildcard peer declarations? Manifest compliance and successful discovery are weaker than actual tool/UI operation.
- What attribution and provenance will accompany the unchanged material in the **published** artifact, not only the repository?

No layout, build strategy, test-porting scheme, dependency correction mechanism, release process or sync workflow is selected here. The researched facts for [Establish upstream package and Pi host requirements](https://github.com/Qiuyi-Hong/pi-ask-user-question/issues/2) are supported above or explicitly marked unverified; other tickets remain outside scope.

## Primary sources

References to Pi source below use published `gitHead` `d86654abb8862e201933517d6f1fce9f88dd117f`; the five contract files compared against source HEAD were identical. Upstream source references use observed HEAD unless explicitly labeled release. Registry metadata/artifact links are version-specific.

[U1]: https://github.com/juicesharp/rpiv-mono/commit/d74b1c99830a565f3df3f37e0a36616d17ffc574
[U2]: https://github.com/juicesharp/rpiv-mono/commit/61904e69e1a50e12585bdf15f0310e633a62ba36
[U3]: https://registry.npmjs.org/@juicesharp%2Frpiv-ask-user-question/2.11.0
[U4]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/packages/rpiv-ask-user-question/package.json#L1-L101
[U5]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/packages/rpiv-ask-user-question/config.ts#L1-L2
[U6]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/packages/rpiv-ask-user-question/tool/types.ts#L1-L2
[U7]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/packages/rpiv-ask-user-question/index.ts#L19-L54
[U8]: https://registry.npmjs.org/@juicesharp/rpiv-ask-user-question/-/rpiv-ask-user-question-2.11.0.tgz
[U9]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/package.json#L1-L50
[U10]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/packages/rpiv-ask-user-question/ask-user-question.ts#L108-L265
[U11]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/packages/rpiv-ask-user-question/state/i18n-bridge.ts#L23-L47
[U12]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/packages/rpiv-ask-user-question/state/build-questionnaire.ts#L1-L34
[U13]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/packages/rpiv-config/package.json#L1-L39
[U14]: https://registry.npmjs.org/@juicesharp%2Frpiv-config/2.11.0
[U15]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/tsconfig.base.json
[U16]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/vitest.config.ts
[U17]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/test/setup.ts
[U18]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/packages/test-utils/package.json
[U19]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/packages/rpiv-ask-user-question/README.md#requirements
[U20]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/packages/rpiv-i18n/loader.ts#L37-L70
[U21]: https://github.com/juicesharp/rpiv-mono/blob/d74b1c99830a565f3df3f37e0a36616d17ffc574/packages/rpiv-ask-user-question/LICENSE#L1-L21
[P1]: https://registry.npmjs.org/@earendil-works%2Fpi-coding-agent/0.99.1
[P2]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/src/core/resource-loader.ts#L53-L107
[P3]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/test/resource-loader.test.ts#L43-L101
[P4]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/src/core/package-manager.ts#L1036-L1065
[P5]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/src/core/package-manager.ts#L2214-L2390
[P6]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/docs/packages.md#declare-dependencies
[P7]: https://github.com/earendil-works/pi/commit/1b347794e2a630e4359f2584f4eea388145d0ddf
[P8]: https://registry.npmjs.org/@earendil-works/pi-coding-agent/-/pi-coding-agent-0.99.1.tgz
[P9]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/src/core/extensions/loader.ts#L67-L125
[P10]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/src/core/extensions/virtual-modules.ts#L1-L39
[P11]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/src/core/resource-loader.ts#L516-L580
[P12]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/src/main.ts#L789-L801
[P13]: https://github.com/earendil-works/pi/commit/8d897edaa69bf810fa6d14f854ce0cf101f11093
[P14]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/test/extensions-discovery.test.ts#L72-L105
[P15]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/src/core/package-manager.ts#L1781-L1922
[P16]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/src/core/package-manager.ts#L1281-L1389
[P17]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/src/utils/git.ts#L1-L243
[P18]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/src/core/package-manager.ts#L563-L658
[P19]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/src/core/pi-manifest.ts#L1-L34
[P20]: https://github.com/earendil-works/pi/blob/d86654abb8862e201933517d6f1fce9f88dd117f/packages/coding-agent/src/core/extensions/loader.ts#L539-L642
[N1]: https://docs.npmjs.com/cli/v11/configuring-npm/package-json
[N2]: https://github.com/nodejs/node/blob/v24.14.1/doc/api/packages.md
[N3]: https://github.com/nodejs/node/blob/v24.14.1/doc/api/typescript.md#type-stripping-in-dependencies
