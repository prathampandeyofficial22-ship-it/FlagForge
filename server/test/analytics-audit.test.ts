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
import { AuditLog } from '../src/models/AuditLog.js';

let mongoServer: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
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
  await AuditLog.deleteMany({});
});

describe('Phase 9: Audit Logs & Dashboard Real Analytics', () => {
  it('Tracks append-only audit trail and returns accurate dashboard telemetry', async () => {
    // 1. Register User (creates org Acme)
    const regRes = await request(app).post('/api/v1/auth/register').send({
      email: 'ops@acme.com',
      password: 'Password123!',
      name: 'Ops Lead',
      organizationName: 'Acme Cloud',
    });

    const token = regRes.body.data.token;
    const orgId = regRes.body.data.currentOrganization.id;

    // 2. Create Project
    const projRes = await request(app)
      .post(`/api/v1/organizations/${orgId}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'API Gateway', key: 'gateway' });

    const projectId = projRes.body.data.project._id;
    const devEnv = projRes.body.data.environments[0];

    // 3. Create Flag
    const flagRes = await request(app)
      .post(`/api/v1/projects/${projectId}/flags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Rate Limiter V2', key: 'rate-limit-v2' });

    const flagId = flagRes.body.data._id;

    // 4. Toggle Flag ON
    await request(app)
      .post(`/api/v1/flags/${flagId}/environments/${devEnv.id}/toggle`)
      .set('Authorization', `Bearer ${token}`);

    // 5. Query Audit Logs
    const auditRes = await request(app)
      .get(`/api/v1/organizations/${orgId}/audit-logs`)
      .set('Authorization', `Bearer ${token}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.success).toBe(true);
    expect(auditRes.body.data.logs.length).toBeGreaterThanOrEqual(3);

    const actions = auditRes.body.data.logs.map((l: any) => l.action);
    expect(actions).toContain('flag.toggled');
    expect(actions).toContain('flag.created');
    expect(actions).toContain('project.created');

    // 6. Query Dashboard Analytics: Real metrics derived from actual database records
    const analyticsRes = await request(app)
      .get(`/api/v1/organizations/${orgId}/analytics`)
      .set('Authorization', `Bearer ${token}`);

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.success).toBe(true);

    const metrics = analyticsRes.body.data;
    expect(metrics.totalProjects).toBe(1);
    expect(metrics.totalFlags).toBe(1);
    expect(metrics.activeFlags).toBe(1);
    expect(metrics.killSwitchedFlags).toBe(0);
    expect(metrics.recentAuditLogs.length).toBeGreaterThan(0);
  });
});
