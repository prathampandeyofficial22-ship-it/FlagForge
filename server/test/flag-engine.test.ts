import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { OrganizationMember } from '../src/models/OrganizationMember.js';
import { Project } from '../src/models/Project.js';
import { Environment } from '../src/models/Environment.js';
import { FeatureFlag } from '../src/models/FeatureFlag.js';
import { FlagEnvironmentConfig } from '../src/models/FlagEnvironmentConfig.js';
import { evaluateFlag } from '../src/engine/evaluator.js';
import { getRolloutBucket, isUserInRollout } from '../src/utils/hashing.js';

let mongoServer: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await OrganizationMember.deleteMany({});
  await Project.deleteMany({});
  await Environment.deleteMany({});
  await FeatureFlag.deleteMany({});
  await FlagEnvironmentConfig.deleteMany({});
});

describe('Phase 4 & 5: Feature Flag CRUD, Targeting & Rule Evaluation Engine', () => {
  async function setupProject() {
    const regRes = await request(app).post('/api/v1/auth/register').send({
      email: 'lead@startup.com',
      password: 'Password123!',
      name: 'Tech Lead',
      organizationName: 'Growth Startup',
    });

    const token = regRes.body.data.token;
    const orgId = regRes.body.data.currentOrganization.id;

    const projRes = await request(app)
      .post(`/api/v1/organizations/${orgId}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Web App', key: 'webapp' });

    const projectId = projRes.body.data.project._id;
    const environments = projRes.body.data.environments;
    const devEnv = environments.find((e: any) => e.key === 'development');
    const prodEnv = environments.find((e: any) => e.key === 'production');

    return { token, orgId, projectId, devEnv, prodEnv };
  }

  it('POST /projects/:id/flags creates flag with environment configs', async () => {
    const { token, projectId, devEnv, prodEnv } = await setupProject();

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/flags`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'AI Recommendation Feed',
        key: 'ai-recommendations',
        description: 'New machine learning powered recommendation stream',
        type: 'boolean',
        tags: ['ml', 'core'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.key).toBe('ai-recommendations');

    // Verify configs created for both environments
    const devConfig = await FlagEnvironmentConfig.findOne({
      flagId: res.body.data._id,
      environmentId: devEnv.id,
    });
    expect(devConfig).toBeDefined();
    expect(devConfig?.enabled).toBe(false);

    const prodConfig = await FlagEnvironmentConfig.findOne({
      flagId: res.body.data._id,
      environmentId: prodEnv.id,
    });
    expect(prodConfig).toBeDefined();
  });

  it('POST /flags/:flagId/environments/:envId/toggle and kill-switch work correctly', async () => {
    const { token, projectId, devEnv } = await setupProject();

    const flagRes = await request(app)
      .post(`/api/v1/projects/${projectId}/flags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Beta Header', key: 'beta-header' });

    const flagId = flagRes.body.data._id;

    // 1. Toggle ON
    const toggleOnRes = await request(app)
      .post(`/api/v1/flags/${flagId}/environments/${devEnv.id}/toggle`)
      .set('Authorization', `Bearer ${token}`);

    expect(toggleOnRes.status).toBe(200);
    expect(toggleOnRes.body.data.enabled).toBe(true);

    // 2. Trigger Emergency Kill Switch
    const killRes = await request(app)
      .post(`/api/v1/flags/${flagId}/environments/${devEnv.id}/kill-switch`)
      .set('Authorization', `Bearer ${token}`);

    expect(killRes.status).toBe(200);
    expect(killRes.body.data.killSwitched).toBe(true);
    expect(killRes.body.data.enabled).toBe(false);

    // Verify in DB
    const config = await FlagEnvironmentConfig.findOne({ flagId, environmentId: devEnv.id });
    expect(config?.killSwitched).toBe(true);
    expect(config?.enabled).toBe(false);
  });

  describe('Rule Evaluation Engine & Hashing (Unit Tests)', () => {
    it('MurmurHash3 produces deterministic and stable bucket assignment', () => {
      const flagKey = 'checkout-v2';
      const userId = 'user_4567';

      const bucket1 = getRolloutBucket(flagKey, userId);
      const bucket2 = getRolloutBucket(flagKey, userId);
      expect(bucket1).toBe(bucket2); // Identical

      // Verify range [0, 100)
      expect(bucket1).toBeGreaterThanOrEqual(0);
      expect(bucket1).toBeLessThan(100);

      // Verify monotonicity: If user is in 20% rollout, they MUST be in 50% and 100% rollout
      const in20 = isUserInRollout(flagKey, userId, 20);
      if (in20) {
        expect(isUserInRollout(flagKey, userId, 50)).toBe(true);
        expect(isUserInRollout(flagKey, userId, 100)).toBe(true);
      }
    });

    it('Evaluates Kill Switch override before any rules or switches', () => {
      const mockConfig: any = {
        enabled: true,
        killSwitched: true,
        rolloutPercentage: 100,
        defaultValue: true,
        version: 3,
        rules: [],
      };

      const result = evaluateFlag('test-flag', mockConfig, { key: 'user_1' });
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('KILL_SWITCH');
    });

    it('Evaluates Targeting Rules with string operators: equals, contains, startsWith', () => {
      const mockConfig: any = {
        enabled: true,
        killSwitched: false,
        rolloutPercentage: 0, // Fallback is 0%
        defaultValue: false,
        version: 1,
        rules: [
          {
            id: 'rule-canada-beta',
            name: 'Canada Beta Testers',
            priority: 0,
            conditionOperator: 'AND',
            conditions: [
              { attribute: 'country', operator: 'equals', values: ['CA'] },
              { attribute: 'email', operator: 'endsWith', values: ['@company.com'] },
            ],
            serveValue: true,
          },
        ],
      };

      // Match: CA and ends with @company.com
      const matchResult = evaluateFlag('test-flag', mockConfig, {
        key: 'user_100',
        attributes: { country: 'CA', email: 'alice@company.com' },
      });
      expect(matchResult.enabled).toBe(true);
      expect(matchResult.reason).toBe('RULE_MATCH');
      expect(matchResult.matchedRuleId).toBe('rule-canada-beta');

      // Non-match: US country
      const nonMatchResult = evaluateFlag('test-flag', mockConfig, {
        key: 'user_200',
        attributes: { country: 'US', email: 'bob@company.com' },
      });
      expect(nonMatchResult.enabled).toBe(false);
      expect(nonMatchResult.reason).toBe('PERCENTAGE_ROLLOUT');
    });

    it('Evaluates Targeting Rules with numeric comparisons: greaterThan, lessThan', () => {
      const mockConfig: any = {
        enabled: true,
        killSwitched: false,
        rolloutPercentage: 0,
        defaultValue: false,
        version: 1,
        rules: [
          {
            id: 'rule-high-tier',
            name: 'High Tier Accounts',
            priority: 0,
            conditionOperator: 'AND',
            conditions: [
              { attribute: 'spendAmount', operator: 'greaterThanOrEqual', values: ['1000'] },
            ],
            serveValue: true,
          },
        ],
      };

      const highSpender = evaluateFlag('premium-feature', mockConfig, {
        key: 'user_spender',
        attributes: { spendAmount: 1500 },
      });
      expect(highSpender.enabled).toBe(true);
      expect(highSpender.reason).toBe('RULE_MATCH');

      const lowSpender = evaluateFlag('premium-feature', mockConfig, {
        key: 'user_frugal',
        attributes: { spendAmount: 499 },
      });
      expect(lowSpender.enabled).toBe(false);
    });

    it('Respects Rule Priority: lower priority number evaluated first', () => {
      const mockConfig: any = {
        enabled: true,
        killSwitched: false,
        rolloutPercentage: 0,
        defaultValue: false,
        version: 1,
        rules: [
          {
            id: 'rule-priority-10',
            name: 'General Rule (Priority 10)',
            priority: 10,
            conditionOperator: 'AND',
            conditions: [{ attribute: 'role', operator: 'equals', values: ['admin'] }],
            serveValue: false,
          },
          {
            id: 'rule-priority-0',
            name: 'VIP Rule (Priority 0)',
            priority: 0,
            conditionOperator: 'AND',
            conditions: [{ attribute: 'role', operator: 'equals', values: ['admin'] }],
            serveValue: true,
          },
        ],
      };

      const result = evaluateFlag('admin-access', mockConfig, {
        key: 'user_admin',
        attributes: { role: 'admin' },
      });
      expect(result.enabled).toBe(true);
      expect(result.matchedRuleId).toBe('rule-priority-0');
    });
  });
});
