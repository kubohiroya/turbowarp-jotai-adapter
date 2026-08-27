# TurboWarp-HTTP-Server-Jotai Architecture

This package provides TurboWarp blocks that describe a Jotai-facing state bridge. The MVP does not run Jotai inside TurboWarp. It produces JSON for an atom registry, action envelopes, and state snapshots so a React/Jotai host can validate and apply the state contract.

```text
TurboWarp blocks
  -> atom registry / actions / snapshot JSON
  -> React or host package
  -> real Jotai store and TypeScript hooks
```

The package intentionally stays separate from React component mounting. A React integration package can consume the JSON as initial state or event input, while TypeScript hooks own derived atoms, async atoms, side effects, persistence, and authenticated API access.

See [architecture.ja.md](architecture.ja.md) for the detailed design note.
