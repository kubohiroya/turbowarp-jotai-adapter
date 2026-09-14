# TurboWarp Jotai Adapter

[日本語](README.ja.md)

TurboWarp Jotai Adapter is an experimental TurboWarp extension package for describing Jotai-facing state contracts with blocks. It does not embed Jotai in TurboWarp. Instead, it produces JSON for an atom registry, action envelopes, and state snapshots that a React/Jotai bridge can consume.

## What it does

- defines a small block surface for atom definitions, set-atom actions, and snapshots;
- serializes a deterministic Jotai bridge plan as JSON;
- keeps React component mounting in a separate package;
- keeps the path open from block programming to TypeScript hooks and state libraries.

The package is version-pinned when used from another toolchain:

```bash
pnpm add --save-exact @kubohiroya/turbowarp-jotai-adapter@0.2.0
```

## Requirements and safety

- Node.js 22 or newer;
- pnpm through Corepack;
- TurboWarp custom extension loading.

The MVP only exchanges JSON. A host application must validate bridge JSON before applying it to a real Jotai store, especially when blocks come from untrusted projects.

## Installation

```bash
corepack enable
pnpm install --frozen-lockfile
```

## Quick start

```bash
pnpm run build
pnpm run test
```

Load `dist/jotai-bridge.js` in TurboWarp as a custom extension. The extension can define atoms, append set-atom action envelopes, and report the current bridge plan JSON.

## Block reference

<!-- BEGIN GENERATED BLOCKS -->

### `define Jotai atom [ATOM] default JSON [VALUE]`

Adds or replaces an atom definition in the current bridge plan.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `defineAtom` |
| `ATOM` | String, default: `counter` |
| `VALUE` | String, default: `0` |

### `set Jotai atom [ATOM] JSON [VALUE]`

Updates the current atom snapshot and appends a set-atom action envelope.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `setAtomValue` |
| `ATOM` | String, default: `counter` |
| `VALUE` | String, default: `1` |

### `Jotai atom [ATOM] value JSON`

Returns the current JSON value for an atom in the bridge plan.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `atomValueJson` |
| `ATOM` | String, default: `counter` |

### `Jotai set action atom [ATOM] JSON [VALUE]`

Returns a standalone set-atom action envelope as JSON.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `createSetActionJson` |
| `ATOM` | String, default: `counter` |
| `VALUE` | String, default: `1` |

### `Jotai bridge plan JSON`

Returns the current atom registry, action log, and state snapshot as bridge JSON.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `planJson` |

### `clear Jotai bridge plan`

Clears the in-memory bridge plan held by this TurboWarp extension instance.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `clearPlan` |

### `normalized JSON [VALUE]`

Parses a JSON value and returns its canonical JSON representation.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `normalizeValueJson` |
| `VALUE` | String, default: `{"label":"demo"}` |

<!-- END GENERATED BLOCKS -->

## Architecture

The package separates three layers:

```text
TurboWarp blocks
  -> atom registry / action envelope / snapshot JSON
  -> React package or host application
  -> real Jotai store and TypeScript hooks
```

This keeps the block language useful for declarative state descriptions while leaving advanced React and hook logic in TypeScript. See [docs/architecture.ja.md](docs/architecture.ja.md).

## Development

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

`pnpm run docs` regenerates the English block reference from `src/block-definitions.json`.

## License

SPDX-License-Identifier: MPL-2.0
