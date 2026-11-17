export type OrgRole = 'owner' | 'admin' | 'developer' | 'viewer';
export type EnvironmentType = 'development' | 'staging' | 'production' | 'custom';
export type FlagType = 'boolean' | 'string' | 'number' | 'json';
export type RuleOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'in'
  | 'notIn';

export interface User {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: OrgRole;
}

export interface Environment {
  _id: string;
  name: string;
  key: string;
  type: EnvironmentType;
  serverApiKeyPrefix: string;
  clientApiKeyPrefix: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  flagCount: number;
  environments: Environment[];
  createdAt: string;
}

export interface TargetingCondition {
  attribute: string;
  operator: RuleOperator;
  values: string[];
}

export interface TargetingRule {
  id: string;
  name: string;
  priority: number;
  conditions: TargetingCondition[];
  conditionOperator: 'AND' | 'OR';
  serveValue: any;
  rolloutPercentage?: number;
}

export interface FlagEnvironmentConfig {
  environmentId: string;
  environmentName: string;
  environmentKey: string;
  environmentType: EnvironmentType;
  enabled: boolean;
  killSwitched: boolean;
  killSwitchedAt?: string;
  defaultValue: any;
  rolloutPercentage: number;
  rules: TargetingRule[];
  version: number;
  updatedAt: string;
}

export interface FeatureFlag {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description?: string;
  type: FlagType;
  tags: string[];
  isArchived: boolean;
  environments: Record<string, {
    environmentId: string;
    environmentName: string;
    enabled: boolean;
    killSwitched: boolean;
    rolloutPercentage: number;
    ruleCount: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  _id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  beforeSnapshot?: Record<string, any>;
  afterSnapshot?: Record<string, any>;
  createdAt: string;
}
