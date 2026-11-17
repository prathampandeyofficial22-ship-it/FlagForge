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
import { EvaluationMetric } from '../src/models/EvaluationMetric.js';

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
  await EvaluationMetric.deleteMany({});
});

describe('Phase 6 & 7: Feature Evaluation API & Caching Layer', () => {
  async function setupEnvironmentWithFlags() {
    const regRes = await request(app).post('/api/v1/auth/register').send({
      email: 'arch@fintech.io',
      password: 'Password123!',
      name: 'System Architect',
      organizationName: 'Fintech Corp',
    });

    const token = regRes.body.data.token;
    const orgId = regRes.body.data.currentOrganization.id;

    // Create Project
    const projRes = await request(app)
      .post(`/api/v1/organizations/${orgId}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Payment Gateway', key: 'payment-gw' });

    const projectId = projRes.body.data.project._id;
    const devEnv = projRes.body.data.environments.find((e: any) => e.key === 'development');

    // Create Flag: 'instant-payouts'
    const flagRes = await request(app)
      .post(`/api/v1/projects/${projectId}/flags`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Instant Payouts',
        key: 'instant-payouts',
        description: 'Instant settlement for verified merchants',
      });

    const flagId = flagRes.body.data._id;

    return {
      token,
      projectId,
      devEnvId: devEnv.id,
      serverApiKey: devEnv.serverKey,
      flagId,
      flagKey: 'instant-payouts',
    };
  }

  it('POST /api/v1/evaluate rejects requests with missing or invalid SDK keys', async () => {
    const res = await request(app)
      .post('/api/v1/evaluate')
      .send({ flagKey: 'instant-payouts' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('Missing SDK API key');

    const invalidRes = await request(app)
      .post('/api/v1/evaluate')
      .set('X-Environment-Key', 'ff_server_invalid_123456789')
      .send({ flagKey: 'instant-payouts' });

    expect(invalidRes.status).toBe(401);
    expect(invalidRes.body.error.message).toContain('Invalid or revoked SDK API key');
  });

  it('POST /api/v1/evaluate evaluates flag and respects updates with cache invalidation', async () => {
    const { token, flagId, devEnvId, serverApiKey, flagKey } = await setupEnvironmentWithFlags();

    // 1. Initially disabled
    const eval1 = await request(app)
      .post('/api/v1/evaluate')
      .set('X-Environment-Key', serverApiKey)
      .send({
        flagKey,
        user: { key: 'merchant_99' },
      });

    expect(eval1.status).toBe(200);
    expect(eval1.body.enabled).toBe(false);
    expect(eval1.body.reason).toBe('FLAG_DISABLED');

    // 2. Enable flag with 100% rollout via management API
    const updateRes = await request(app)
      .put(`/api/v1/flags/${flagId}/environments/${devEnvId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        enabled: true,
        rolloutPercentage: 100,
      });

    expect(updateRes.status).toBe(200);

    // 3. Evaluate again: Cache was busted, should now return TRUE (100% rollout)
    const eval2 = await request(app)
      .post('/api/v1/evaluate')
      .set('X-Environment-Key', serverApiKey)
      .send({
        flagKey,
        user: { key: 'merchant_99' },
      });

    expect(eval2.status).toBe(200);
    expect(eval2.body.enabled).toBe(true);
    expect(eval2.body.reason).toBe('PERCENTAGE_ROLLOUT');

    // 4. Emergency Kill Switch
    await request(app)
      .post(`/api/v1/flags/${flagId}/environments/${devEnvId}/kill-switch`)
      .set('Authorization', `Bearer ${token}`);

    // 5. Evaluate after kill-switch: Must immediately evaluate FALSE with KILL_SWITCH reason
    const eval3 = await request(app)
      .post('/api/v1/evaluate')
      .set('X-Environment-Key', serverApiKey)
      .send({
        flagKey,
        user: { key: 'merchant_99' },
      });

    expect(eval3.status).toBe(200);
    expect(eval3.body.enabled).toBe(false);
    expect(eval3.body.reason).toBe('KILL_SWITCH');
  });

  it('POST /api/v1/evaluate/batch evaluates multiple flags in one round-trip', async () => {
    const { token, projectId, devEnvId, serverApiKey } = await setupEnvironmentWithFlags();

    // Create second flag
    await request(app)
      .post(`/api/v1/projects/${projectId}/flags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dark Mode UI', key: 'dark-mode' });

    const batchRes = await request(app)
      .post('/api/v1/evaluate/batch')
      .set('X-Environment-Key', serverApiKey)
      .send({
        flagKeys: ['instant-payouts', 'dark-mode'],
        user: { key: 'user_42' },
      });

    expect(batchRes.status).toBe(200);
    expect(batchRes.body.flags).toHaveProperty('instant-payouts');
    expect(batchRes.body.flags).toHaveProperty('dark-mode');
  });
});
