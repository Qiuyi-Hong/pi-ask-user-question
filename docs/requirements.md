# Requirements and compatibility evidence

The approved support target comes from [the parent implementation spec](https://github.com/Qiuyi-Hong/pi-ask-user-question/issues/12). This candidate implements [the prepared local installation slice](https://github.com/Qiuyi-Hong/pi-ask-user-question/issues/13); it is not a release acceptance report.

| Dimension | Approved target | Initial slice evidence |
| --- | --- | --- |
| Host | Pi 0.99.1, normal npm-distributed bundled Node CLI | Prepared local smoke with the real CLI |
| Node | 22.x from 22.19.0, and 24.x | 24.14.1 |
| OS | Linux, macOS, native Windows | macOS 26.7, arm64 |
| Source | Exact named npm version, immutable downstream GitHub/git candidate, prepared local outer root | Prepared local outer root |
| Config | Required published 2.11.0 | Exact pin; real config loaded through Pi |
| i18n | Genuine absence; explicitly supplied resolvable 2.11.0 | English fallback with i18n absent |
| Acceptance | All 36 combinations before upstream-sync acceptance or publication | Still outstanding; this slice is insufficient for release |

The later gate requires all **3 OS × 2 exact Node baselines (22.19.0 and 24.14.1) × 3 installation sources × 2 i18n modes = 36** results. Native Windows is required, including terminal/editor and CRLF behavior; WSL does not replace it. A physical transitive TypeBox installation is permitted only with coherent runtime behavior. Exact config pins do not freeze the full transitive tree.

Host peers use `"*"` to meet Pi's declaration contract, not to promise support for every host version. The metadata declares the Node minimum; no runtime version gate is added. Other patches within the approved Node lines are supported targets, without being individually tested.

Node below 22.19.0 and standalone Node execution of the extension are unsupported. Other Pi versions, Node major lines, OS families, architectures/releases not evidenced, compiled binaries, custom/source/unbundled/SDK hosts, pnpm, Bun, custom installers, and untested integration versions are unverified. Unverified does not mean demonstrated broken.

The intended future reproducible source forms are `pi install npm:@qiuyihong/pi-ask-user-question@0.1.0` and `pi install git:github.com/Qiuyi-Hong/pi-ask-user-question@v0.1.0`, after an approved release exists. They are not available-release claims. Registry-fixture, GitHub/git, localization, full behavior, and authority validation remain later work. No release tag or publication is created by the local slice.
