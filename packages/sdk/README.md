# @flagforge/node-sdk

The official Node.js SDK for the **FlagForge Feature Flag & Release Management Platform**.

Decouple deployments from feature releases with deterministic percentage rollouts, targeting rules, local caching, and emergency kill switches.

---

## Installation

```bash
npm install @flagforge/node-sdk
```

---

## Features

- **High-Performance In-Memory Caching**: Cache flag evaluations locally to eliminate repeated network round-trips.
- **Deterministic Canary Rollouts**: Consistent MurmurHash3 bucket assignment. The same user consistently receives the same feature status.
- **Fail-Safe Offline Fallbacks**: If the FlagForge server is temporarily unreachable or times out, the client automatically and safely falls back without throwing unhandled exceptions.
- **Lightweight**: Zero bloated dependencies.
- **First-Class TypeScript Support**: Full typings for options, results, and user contexts.

---

## API Reference

### `new FlagForgeClient(options: FlagForgeOptions)`

Options:
- `apiKey` *(string, required)*: The environment-specific SDK server or client key (`ff_server_...` or `ff_client_...`).
- `baseUrl` *(string, optional)*: Base URL for the FlagForge API (defaults to `http://localhost:4000/api/v1`).
- `enableLocalCache` *(boolean, optional, default: true)*: Whether to cache evaluations in memory.
- `cacheTtlMs` *(number, optional, default: 60000)*: Cache TTL in milliseconds.
- `timeoutMs` *(number, optional, default: 3000)*: Network request timeout in milliseconds.
- `offlineFallback` *(Record<string, boolean>, optional)*: Key-value map of fallback flag defaults.

### `client.isEnabled(flagKey: string, user?: FlagForgeUser, defaultValue?: boolean): Promise<boolean>`
Convenience method that returns a boolean indicating whether the flag is active for the given user.

### `client.evaluate<T>(flagKey: string, user?: FlagForgeUser, defaultValue?: T): Promise<EvaluationResult<T>>`
Returns the evaluation result including `enabled`, `value`, `reason`, and configuration `version`.

### `client.evaluateBatch(flagKeys?: string[], user?: FlagForgeUser): Promise<Record<string, EvaluationResult<any>>>`
Batch evaluates multiple flags in one round-trip.

### `client.clearCache(): void`
Purges the local in-memory cache.
