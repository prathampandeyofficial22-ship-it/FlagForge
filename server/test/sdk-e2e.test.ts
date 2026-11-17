import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { OrganizationMember } from '../src/models/OrganizationMember.js';
import { Project } from '../src/models/Project.js';
import { Environment } from '../src/models/Environment.js';
import { FeatureFlag } from '../src/models/FeatureFlag.js';
import { FlagEnvironmentConfig } from '../src/models/FlagEnvironmentConfig.js';
import { FlagForgeClient } from '../../packages/sdk/src/client.js';
import { generateApiKey } from '../src/utils/hashing.js';

let mongoServer: MongoMemoryServer;
let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const app = createApp();
  await new Promise<void>((resolve) => {
    // Listen on random available port
    server = app.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
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

describe('Phase 8: End-to-End Node.js SDK Live Backend Integration', () => {
  it('Initializes SDK, queries live backend, receives evaluation, and caches results', async () => {
    // 1. Create Organization & Project
    const org = await Organization.create({ name: 'Acme Corp', slug: 'acme-corp' });
    const project = await Project.create({ organizationId: org._id, name: 'Web Store', key: 'store' });

    // 2. Create Environment with SDK Key
    const keyData = generateApiKey('server', 'store_prod');
    const env = await Environment.create({
      projectId: project._id,
      name: 'Production',
      key: 'production',
      type: 'production',
      serverApiKeyHash: keyData.hashedKey,
      serverApiKeyPrefix: keyData.prefix,
      clientApiKeyHash: 'client_hash',
      clientApiKeyPrefix: 'client_prefix',
    });

    // 3. Create Feature Flag: 'modern-cart'
    const flag = await FeatureFlag.create({
      projectId: project._id,
      key: 'modern-cart',
      name: 'Modern Cart Flow',
      type: 'boolean',
      isArchived: false,
    });

    // 4. Configure Flag with 100% Rollout in Production
    await FlagEnvironmentConfig.create({
      flagId: flag._id,
      environmentId: env._id,
      projectId: project._id,
      enabled: true,
      killSwitched: false,
      rolloutPercentage: 100,
      defaultValue: false,
      rules: [],
      version: 1,
    });

    // 5. Instantiate actual Node.js SDK pointing to live backend server
    const sdk = new FlagForgeClient({
      apiKey: keyData.rawKey,
      baseUrl,
      enableLocalCache: true,
      cacheTtlMs: 60000,
      timeoutMs: 3000,
    });

    // 6. Test evaluation
    const evalResult = await sdk.evaluate('modern-cart', { key: 'customer_101' });
    expect(evalResult.enabled).toBe(true);
    expect(evalResult.flagKey).toBe('modern-cart');
    expect(evalResult.reason).toBe('PERCENTAGE_ROLLOUT');

    // 7. Test helper method
    const isEnabled = await sdk.isEnabled('modern-cart', { key: 'customer_101' });
    expect(isEnabled).toBe(true);

    // 8. Test Cache Hit
    const cachedResult = await sdk.evaluate('modern-cart', { key: 'customer_101' });
    expect(cachedResult.reason).toBe('CACHE_HIT');

    // 9. Test unknown flag safe fallback
    const unknownResult = await sdk.evaluate('nonexistent-flag', { key: 'customer_101' }, false);
    expect(unknownResult.enabled).toBe(false);
    expect(unknownResult.reason).toBe('FALLBACK');
  });
});
