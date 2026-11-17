import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Flag,
  BarChart3,
  Layers,
  History,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
  Building2,
  FolderGit2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { api } from '../../api/client';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const {
    user,
    currentOrg,
    currentProject,
    organizations,
    projects,
    selectOrg,
    selectProject,
    refreshProjects,
    refreshUserData,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewOrgOpen, setIsNewOrgOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectKey, setNewProjectKey] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showProjDropdown, setShowProjDropdown] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !newProjectName.trim()) return;

    setIsCreating(true);
    setCreateError('');
    try {
      const res = await api.createProject(currentOrg.id, {
        name: newProjectName.trim(),
        key: newProjectKey.trim() || undefined,
      });
      await refreshProjects();
      selectProject(res.project);
      setIsNewProjectOpen(false);
      setNewProjectName('');
      setNewProjectKey('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsCreating(true);
    setCreateError('');
    try {
      const newOrg = await api.createOrg(newOrgName.trim());
      await refreshUserData();
      selectOrg({
        id: newOrg._id,
        name: newOrg.name,
        slug: newOrg.slug,
        role: 'owner',
      });
      setIsNewOrgOpen(false);
      setNewOrgName('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create organization');
    } finally {
      setIsCreating(false);
    }
  };

  const navItems = [
    { label: 'Feature Flags', icon: Flag, to: '/flags' },
    { label: 'Overview & Metrics', icon: BarChart3, to: '/' },
    { label: 'Environments & SDK Keys', icon: Layers, to: '/environments' },
    { label: 'Audit Trail', icon: History, to: '/audit-logs' },
    { label: 'Settings & Members', icon: Settings, to: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-surface-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-13 bg-surface-900 border-b border-border-dark flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div
            onClick={() => navigate('/flags')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center font-bold text-white text-xs tracking-wider">
              FF
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-100">
              FlagForge
            </span>
          </div>

          <span className="text-zinc-600">/</span>

          {/* Organization Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowOrgDropdown(!showOrgDropdown);
                setShowProjDropdown(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-800 text-xs text-zinc-200 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-medium max-w-[120px] truncate">
                {currentOrg?.name || 'Workspace'}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {showOrgDropdown && (
              <div className="absolute left-0 mt-1 w-52 bg-surface-900 border border-border-dark rounded-md shadow-xl py-1 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Organizations
                </div>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      selectOrg(org);
                      setShowOrgDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-surface-800 flex items-center justify-between"
                  >
                    <span className="truncate">{org.name}</span>
                    <span className="text-[10px] text-zinc-500 capitalize">{org.role}</span>
                  </button>
                ))}
                <div className="border-t border-border-dark mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowOrgDropdown(false);
                      setIsNewOrgOpen(true);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-brand-400 hover:bg-surface-800 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Organization
                  </button>
                </div>
              </div>
            )}
          </div>

          <span className="text-zinc-600">/</span>

          {/* Project Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProjDropdown(!showProjDropdown);
                setShowOrgDropdown(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-800 text-xs text-zinc-200 transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-medium max-w-[140px] truncate">
                {currentProject?.name || 'Select Project'}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {showProjDropdown && (
              <div className="absolute left-0 mt-1 w-56 bg-surface-900 border border-border-dark rounded-md shadow-xl py-1 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Projects
                </div>
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      selectProject(proj);
                      setShowProjDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-surface-800 flex items-center justify-between"
                  >
                    <span className="truncate">{proj.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{proj.key}</span>
                  </button>
                ))}
                <div className="border-t border-border-dark mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowProjDropdown(false);
                      setIsNewProjectOpen(true);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-brand-400 hover:bg-surface-800 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User profile & actions */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-zinc-200">{user?.name}</p>
            <p className="text-[11px] text-zinc-400 font-mono truncate max-w-[180px]">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-surface-800 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-56 bg-surface-950 border-r border-border-dark p-3 flex flex-col justify-between shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-surface-800 text-zinc-100 font-semibold border-l-2 border-brand-500'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-surface-900'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-3 bg-surface-900 border border-border-dark rounded-md text-[11px] text-zinc-400 space-y-1">
            <div className="flex items-center justify-between text-zinc-300 font-medium">
              <span>SDK API Endpoint</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <p className="font-mono text-[10px] text-zinc-500 truncate">
              /api/v1/evaluate
            </p>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 overflow-y-auto bg-surface-950 p-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Create Project Modal */}
      <Dialog
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        title="Create New Project"
        description="Projects isolate feature flags, targeting rules, and SDK keys."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g. Mobile Checkout"
            value={newProjectName}
            onChange={(e) => {
              setNewProjectName(e.target.value);
              if (!newProjectKey) {
                setNewProjectKey(
                  e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
                );
              }
            }}
            required
          />
          <Input
            label="Project Key (Slug)"
            placeholder="e.g. mobile-checkout"
            value={newProjectKey}
            onChange={(e) => setNewProjectKey(e.target.value.toLowerCase())}
            hint="Unique identifier used in SDK configurations."
            required
          />
          {createError && <p className="text-xs text-rose-400">{createError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsNewProjectOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create Project
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Create Organization Modal */}
      <Dialog
        isOpen={isNewOrgOpen}
        onClose={() => setIsNewOrgOpen(false)}
        title="Create Organization"
        description="Organizations group members, permissions, and projects."
      >
        <form onSubmit={handleCreateOrg} className="space-y-4">
          <Input
            label="Organization Name"
            placeholder="e.g. Acme Corporation"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            required
          />
          {createError && <p className="text-xs text-rose-400">{createError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsNewOrgOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create Organization
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
