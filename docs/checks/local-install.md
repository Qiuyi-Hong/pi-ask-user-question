# Initial local candidate check report

This report covers [issue #13](https://github.com/Qiuyi-Hong/pi-ask-user-question/issues/13). It records an initial reviewable candidate and a prepared-local English smoke, not the later 36-case acceptance gate or a published release. The outer `package.json` remains the sole installation/provenance authority; the JSON files here record observed validation results.

## Candidate and artifact

Upstream `main` was freshly resolved to `68d9a0014b70006d7b04b57933752338a2716db7`, whose selected package manifest is `2.12.0`. The historical research SHAs were not used as automatic selections. A filtered read-only clone supplied Git objects for that full immutable commit; `git archive <commit>:packages/rpiv-ask-user-question` captured only the complete selected package into `upstream/rpiv-ask-user-question/`.

[Source inventory](upstream-inventory.txt) records all **105 tracked files**, their Git modes, and blob IDs. All are regular `100644` files in this candidate. The validator compared every path, blob byte, type/target, and relevant mode with those Git objects; it rejected extras and omissions. `.gitattributes` disables checkout text conversion for the snapshot. No upstream file was edited or generated.

[Actual artifact inspection](artifact.json) binds the outer `@qiuyihong/pi-ask-user-question@0.1.0` identity, upstream source, snapshot tree, **109 tarball files**, and npm-compatible SHA-512 integrity. All 105 snapshot files, including images, tests, fixtures, changelog, locales, original manifest, and the full upstream MIT notice, match the checked source. The other four files are the outer manifest, downstream README, downstream MIT license, and requirements matrix. No installed dependencies or bundled host code are shipped. The negative artifact check removes an upstream image from a separate test tarball and requires inspection to fail.

The original snapshot's manifest now has wildcard host peers and config `^2.12.0`; it remains unchanged. The outer installation contract retains the approved exact published config **2.11.0**, optional i18n peer, direct factory and existing exports. This local result checks that pairing only within the smoke below; it does not establish all upstream features or integration scenarios.

## Strict TypeScript result

[Compiler/configuration/module record](typecheck.json): TypeScript **6.0.3**, strict, no emit, ES2022, Node16 module resolution, JSON module resolution, and **40 production snapshot modules plus all three downstream test/tooling modules**. Declaration checking remains enabled; there are no ambient replacement stubs or excluded failing production imports. Only upstream monorepo-only tests and their fixture file are outside this production check.

The actual selected declarations are Pi coding-agent/TUI **0.99.1**, TypeBox **1.3.27**, required config **2.11.0**, optional i18n **2.11.0** for compile-time resolution, and Node declarations **22.19.19**. The published MCP SDK **1.31.0** is a development-only declaration companion needed by Pi's Google provider declarations when npm peer auto-installation is suppressed. The lockfile records the full development resolution. Neither development i18n nor the SDK is supplied to the English runtime tree.

`npm run typecheck` exits 0 with no diagnostics. Initial NodeNext checking found JSON-attribute errors in host declarations; the final configuration uses upstream's Node16 convention and resolves the real JSON data. Missing optional SDK declarations were supplied by the published SDK, without skipping declaration checks or altering source.

## Prepared local runtime result

[Recorded smoke and resolved dependencies](local-smoke.json), with the [raw terminal transcript](local-smoke-terminal.txt), records **macOS 26.7 / Darwin 25.6.0, arm64, Node 24.14.1, npm 11.16.0, normal npm-distributed bundled Pi CLI 0.99.1**. The recorded UTC timestamp falls on **1 October 2026 in Europe/London**.

The trusted harness created fresh HOME, Pi agent directory, workspace, npm user/global configuration and cache, and separate dependency trees. Candidate processes received an explicit environment without authenticated provider, npm, GitHub, write, or publishing credentials. On macOS they ran under the recorded Seatbelt profile, with user-directory reads restricted and writes limited to scratch/device paths. Dependencies were prepared with `npm ci --omit=dev --legacy-peer-deps --ignore-scripts`; Pi itself was freshly installed at 0.99.1 with lifecycle scripts disabled.

Normal `pi install <prepared outer root>` succeeded. `pi list` and the persisted source resolved to that outer root; the installed outer manifest matched the candidate. Verbose loading selected its unchanged questionnaire extension, and the real tool was advertised by Pi to the local OpenAI-compatible model fixture. The fixture substitutes only the external model service, not Pi, its validation path, config, UI, or the factory.

The questionnaire rendered on a real 120×40 PTY with English `Type something.` chrome. An Enter key selected Blue, and Pi returned exactly:

> User has answered your questions: "Which color should we use?"="Blue". You can now continue with the user's answers in mind.

The model then completed the turn. This exercises deferred questionnaire UI imports, real schema handling and host rendering/input, and the required config module (including its `typebox` and `typebox/value` imports). Both the prepared package tree and the fresh host tree lacked i18n; existing integration/module caches were not used. Config and host resolved TypeBox **1.3.27**, with no overrides or vendored dependencies.

Installation diagnostics are recorded separately from loading/runtime diagnostics. There was no downstream-root host-dependency warning or relevant missing-module, import, or factory error. Pi did report two unrelated offline startup notices for absent `fd` and `ripgrep`; these search helpers are not used by the questionnaire smoke.

## Reproduce and limits

Follow the outer-root preparation and maintainer commands in the downstream README. The artifact test may use `UPSTREAM_CHECKOUT` pointing at the read-only source clone. `PI_SMOKE_REPORT` can select an additional output location for the generated smoke JSON; full diagnostics also remain in the test's printed temporary directory.

The full downstream suite comprises actual artifact fidelity/rejection and the fresh real-Pi local smoke. The [final full-suite transcript](full-suite.txt) records **2 passed, 0 failed, 0 skipped** in 47.1 seconds after review. The [final strict typecheck transcript](typecheck.txt) also records exit 0 with no diagnostics. The [independent code reviews](code-review.md) report **Standards: 0 findings; Spec: 0 findings**. Preserved upstream monorepo tests are shipped material, not part of that command.

Linux, native Windows, Node 22.19.0, named npm-registry fixture installation, downstream GitHub/git installation, i18n-present behavior, broader config/TypeBox operations, advanced/multi-question/editor/cancellation/event cases, and GitHub/release authority demonstrations remain later work. No 36-case pass, upstream-sync acceptance, immutable downstream release tag, npm publication, or resolution of the user's unknown original installation failure is claimed.
