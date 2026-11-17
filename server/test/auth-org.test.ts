import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { OrganizationMember } from '../src/models/OrganizationMember.js';

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
});

describe('Phase 2: Authentication & Organizations API', () => {
  const testUser = {
    email: 'alice@example.com',
    password: 'Password123!',
    name: 'Alice Engineer',
    organizationName: 'Acme Corp',
  };

  it('POST /api/v1/auth/register creates user and default organization', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.currentOrganization.name).toBe('Acme Corp');
    expect(res.body.data.currentOrganization.role).toBe('owner');
  });

  it('POST /api/v1/auth/register fails on duplicate email', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);
    const res = await request(app).post('/api/v1/auth/register').send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login succeeds with valid credentials', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
  });

  it('POST /api/v1/auth/login fails with invalid password', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me returns current user and orgs', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(testUser);
    const token = regRes.body.data.token;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.organizations).toHaveLength(1);
    expect(res.body.data.organizations[0].role).toBe('owner');
  });

  it('Enforces RBAC on organization member management', async () => {
    // 1. Register Alice (owner of Acme Corp)
    const aliceRes = await request(app).post('/api/v1/auth/register').send(testUser);
    const aliceToken = aliceRes.body.data.token;
    const orgId = aliceRes.body.data.currentOrganization.id;

    // 2. Register Bob (second user)
    const bobRes = await request(app).post('/api/v1/auth/register').send({
      email: 'bob@example.com',
      password: 'Password123!',
      name: 'Bob Developer',
    });
    const bobToken = bobRes.body.data.token;

    // 3. Register Charlie (third user)
    const charlieRes = await request(app).post('/api/v1/auth/register').send({
      email: 'charlie@example.com',
      password: 'Password123!',
      name: 'Charlie Viewer',
    });

    // 4. Alice invites Bob as 'developer'
    const inviteRes = await request(app)
      .post(`/api/v1/organizations/${orgId}/members`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ email: 'bob@example.com', role: 'developer' });

    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.data.role).toBe('developer');

    // 5. Bob (developer) tries to invite Charlie — should be FORBIDDEN (requires admin)
    const bobInviteRes = await request(app)
      .post(`/api/v1/organizations/${orgId}/members`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ email: 'charlie@example.com', role: 'viewer' });

    expect(bobInviteRes.status).toBe(403);
    expect(bobInviteRes.body.error.message).toContain('Insufficient permissions');

    // 6. Charlie (non-member) tries to view members — should be FORBIDDEN
    const charlieViewRes = await request(app)
      .get(`/api/v1/organizations/${orgId}/members`)
      .set('Authorization', `Bearer ${charlieRes.body.data.token}`);

    expect(charlieViewRes.status).toBe(403);

    // 7. Bob (developer/viewer) can view members
    const bobViewRes = await request(app)
      .get(`/api/v1/organizations/${orgId}/members`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(bobViewRes.status).toBe(200);
    expect(bobViewRes.body.data.length).toBeGreaterThanOrEqual(2);
  });
});
