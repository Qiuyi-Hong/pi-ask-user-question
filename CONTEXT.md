# Upstream-Faithful Ask User Question

This project maintains a downstream Pi extension based on the upstream Ask User Question package. Its language distinguishes the unchanged upstream material from the package users install.

## Language

**Upstream package**:
The `@juicesharp/rpiv-ask-user-question` package maintained in `juicesharp/rpiv-mono`.
_Avoid_: Downstream package, this repo

**Upstream snapshot**:
An unchanged copy of the upstream package's complete Git-tracked contents at an identified upstream Git revision.
_Avoid_: Patched upstream, downstream package

**Downstream package**:
The installable package maintained by this project, with local compatibility corrections kept separate from the upstream snapshot.
_Avoid_: Upstream package, upstream snapshot

**Upstream update**:
A change to the upstream package's complete Git-tracked contents, whether published to npm or not. Changes confined to other monorepo packages are not upstream updates for this project.
_Avoid_: npm release, any monorepo commit

**Upstream-sync PR**:
A proposal to update the downstream project to a newer upstream snapshot, reviewed and merged manually by the maintainer.
_Avoid_: Automatic merge, automatic upgrade
