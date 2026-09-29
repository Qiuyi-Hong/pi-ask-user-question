# Upstream-Faithful Ask User Question

This project maintains a downstream Pi extension based on the upstream Ask User Question package. Its language distinguishes the unchanged upstream material from the package users install.

## Language

**Upstream package**:
The `@juicesharp/rpiv-ask-user-question` package maintained in `juicesharp/rpiv-mono`.
_Avoid_: Downstream package, this repo

**Upstream snapshot**:
An unchanged copy of the upstream package at an identified upstream revision.
_Avoid_: Patched upstream, downstream package

**Downstream package**:
The installable package maintained by this project, with local compatibility corrections kept separate from the upstream snapshot.
_Avoid_: Upstream package, upstream snapshot

**Upstream-sync PR**:
A proposal to update the downstream project to a newer upstream snapshot, reviewed and merged manually by the maintainer.
_Avoid_: Automatic merge, automatic upgrade
