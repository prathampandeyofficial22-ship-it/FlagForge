const rawBase = import.meta.env.VITE_API_URL || '';
const API_BASE = rawBase
  ? (rawBase.endsWith('/api/v1') ? rawBase : `${rawBase.replace(/\/$/, '')}/api/v1`)
  : '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('ff_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<any>('/auth/me'),

  // Organizations
  listOrgs: () => request<any[]>('/organizations'),
  createOrg: (name: string) => request<any>('/organizations', { method: 'POST', body: JSON.stringify({ name }) }),
  getOrgMembers: (orgId: string) => request<any[]>(`/organizations/${orgId}/members`),
  inviteOrgMember: (orgId: string, email: string, role: string) =>
    request<any>(`/organizations/${orgId}/members`, { method: 'POST', body: JSON.stringify({ email, role }) }),
  removeOrgMember: (orgId: string, memberId: string) =>
    request<any>(`/organizations/${orgId}/members/${memberId}`, { method: 'DELETE' }),

  // Projects
  listProjects: (orgId: string) => request<any[]>(`/organizations/${orgId}/projects`),
  createProject: (orgId: string, body: any) =>
    request<any>(`/organizations/${orgId}/projects`, { method: 'POST', body: JSON.stringify(body) }),
  getProject: (projectId: string) => request<any>(`/projects/${projectId}`),

  // Environments
  listEnvironments: (projectId: string) => request<any[]>(`/projects/${projectId}/environments`),
  createEnvironment: (projectId: string, body: any) =>
    request<any>(`/projects/${projectId}/environments`, { method: 'POST', body: JSON.stringify(body) }),
  rotateKeys: (envId: string) => request<any>(`/environments/${envId}/rotate-keys`, { method: 'POST' }),

  // Feature Flags
  listFlags: (projectId: string) => request<any[]>(`/projects/${projectId}/flags`),
  createFlag: (projectId: string, body: any) =>
    request<any>(`/projects/${projectId}/flags`, { method: 'POST', body: JSON.stringify(body) }),
  getFlag: (flagId: string) => request<any>(`/flags/${flagId}`),
  updateFlag: (flagId: string, body: any) =>
    request<any>(`/flags/${flagId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  archiveFlag: (flagId: string) => request<any>(`/flags/${flagId}`, { method: 'DELETE' }),

  // Flag Environment Configs
  updateEnvConfig: (flagId: string, envId: string, body: any) =>
    request<any>(`/flags/${flagId}/environments/${envId}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggleFlag: (flagId: string, envId: string) =>
    request<any>(`/flags/${flagId}/environments/${envId}/toggle`, { method: 'POST' }),
  killSwitchFlag: (flagId: string, envId: string) =>
    request<any>(`/flags/${flagId}/environments/${envId}/kill-switch`, { method: 'POST' }),

  // Analytics & Audit Logs
  getOrgAnalytics: (orgId: string) => request<any>(`/organizations/${orgId}/analytics`),
  getProjectAnalytics: (projectId: string) => request<any>(`/projects/${projectId}/analytics`),
  getAuditLogs: (orgId: string, page = 1) => request<any>(`/organizations/${orgId}/audit-logs?page=${page}`),
};
