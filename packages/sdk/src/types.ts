export interface FlagForgeUser {
  key: string;
  attributes?: Record<string, any>;
}

export interface FlagForgeOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  enableLocalCache?: boolean;
  cacheTtlMs?: number;
  pollingIntervalMs?: number;
  offlineFallback?: Record<string, boolean>;
}

export type EvaluationReason =
  | 'RULE_MATCH'
  | 'PERCENTAGE_ROLLOUT'
  | 'DEFAULT_FALLBACK'
  | 'KILL_SWITCH'
  | 'FLAG_DISABLED'
  | 'FALLBACK'
  | 'CACHE_HIT';

export interface EvaluationResult<T = boolean> {
  flagKey: string;
  enabled: boolean;
  value: T;
  reason: EvaluationReason;
  version?: number;
}
