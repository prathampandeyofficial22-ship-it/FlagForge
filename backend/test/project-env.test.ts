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
import { hashToken } from '../src/utils/hashing.js';

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
});

describe('Phase 3: Projects & Environments API', () => {
  async function createRegisteredUser() {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'founder@acme.com',
      password: 'Password123!',
      name: 'Acme Founder',
      organizationName: 'Acme Technologies',
    });
    return {
      token: res.body.data.token,
      orgId: res.body.data.currentOrganization.id,
      user: res.body.data.user,
    };
  }

  it('POST /organizations/:orgId/projects creates project and auto-provisions environments', async () => {
    const { token, orgId } = await createRegisteredUser();

    const res = await request(app)
      .post(`/api/v1/organizations/${orgId}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Billing Service',
        key: 'billing-service',
        description: 'Core billing and invoicing service',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.project.name).toBe('Billing Service');
    expect(res.body.data.project.key).toBe('billing-service');

    // Verify 3 environments were auto-created
    const envs = res.body.data.environments;
    expect(envs).toHaveLength(3);
    expect(envs.map((e: any) => e.key)).toEqual(['development', 'staging', 'production']);

    // Verify SDK keys returned in response
    const devEnv = envs.find((e: any) => e.key === 'development');
    expect(devEnv.serverKey).toMatch(/^ff_server_/);
    expect(devEnv.clientKey).toMatch(/^ff_client_/);

    // Verify in database: raw keys must NOT be stored, only SHA-256 hashes
    const dbEnv = await Environment.findById(devEnv.id);
    expect(dbEnv?.serverApiKeyHash).toBe(hashToken(devEnv.serverKey));
    expect(dbEnv?.clientApiKeyHash).toBe(hashToken(devEnv.clientKey));
  });

  it('Enforces unique project keys within the same organization', async () => {
    const { token, orgId } = await createRegisteredUser();

    await request(app)
      .post(`/api/v1/organizations/${orgId}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Auth Microservice', key: 'auth-svc' });

    const duplicateRes = await request(app)
      .post(`/api/v1/organizations/${orgId}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Auth Service V2', key: 'auth-svc' });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.error.message).toContain("key 'auth-svc' already exists");
  });

  it('POST /environments/:envId/rotate-keys successfully rotates SDK keys', async () => {
    const { token, orgId } = await createRegisteredUser();

    const projRes = await request(app)
      .post(`/api/v1/organizations/${orgId}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Search Service', key: 'search' });

    const envId = projRes.body.data.environments[0].id;
    const oldServerKey = projRes.body.data.environments[0].serverKey;

    // Rotate keys
    const rotateRes = await request(app)
      .post(`/api/v1/environments/${envId}/rotate-keys`)
      .set('Authorization', `Bearer ${token}`);

    expect(rotateRes.status).toBe(200);
    expect(rotateRes.body.success).toBe(true);
    expect(rotateRes.body.data.serverApiKey).toBeDefined();
    expect(rotateRes.body.data.serverApiKey).not.toBe(oldServerKey);
    expect(rotateRes.body.data.serverApiKey).toMatch(/^ff_server_/);

    // Verify DB updated
    const updatedEnv = await Environment.findById(envId);
    expect(updatedEnv?.serverApiKeyHash).toBe(hashToken(rotateRes.body.data.serverApiKey));
  });
});
