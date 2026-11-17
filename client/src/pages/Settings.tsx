import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, UserPlus, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';

export function Settings() {
  const { currentOrg, user } = useAuth();

  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'developer' | 'viewer'>('developer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadMembers = async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const data = await api.getOrgMembers(currentOrg.id);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load organization members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [currentOrg?.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !inviteEmail.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      await api.inviteOrgMember(currentOrg.id, inviteEmail.trim(), inviteRole);
      setIsInviteOpen(false);
      setInviteEmail('');
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to invite member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!currentOrg) return;
    if (!confirm(`Are you sure you want to remove ${memberEmail} from this organization?`)) {
      return;
    }

    try {
      await api.removeOrgMember(currentOrg.id, memberId);
      await loadMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const isOwnerOrAdmin = currentOrg?.role === 'owner' || currentOrg?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-zinc-400" />
          Settings & Access Control
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Manage workspace organization, team memberships, and role-based permissions
        </p>
      </div>

      {/* Organization Details Card */}
      <div className="bg-surface-900 border border-border-dark rounded-md p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-100">Organization Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-zinc-500">Workspace Name</span>
            <p className="font-medium text-zinc-200">{currentOrg?.name}</p>
          </div>
          <div className="space-y-1">
            <span className="text-zinc-500">Unique Slug</span>
            <p className="font-mono text-zinc-300">{currentOrg?.slug}</p>
          </div>
          <div className="space-y-1">
            <span className="text-zinc-500">Your Organization Role</span>
            <div>
              <Badge variant="blue" size="sm" className="capitalize">
                {currentOrg?.role}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-surface-900 border border-border-dark rounded-md p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border-dark pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              Team Members ({members.length})
            </h3>
            <p className="text-xs text-zinc-400">
              Users with access to this workspace's projects and feature flags
            </p>
          </div>
          {isOwnerOrAdmin && (
            <Button onClick={() => setIsInviteOpen(true)} size="xs">
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              Invite Member
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-xs text-zinc-500">Loading members...</div>
        ) : (
          <div className="divide-y divide-border-dark">
            {members.map((m) => {
              const isCurrentUser = m.user?.id === user?.id;
              return (
                <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-800 border border-border-dark flex items-center justify-center font-bold text-zinc-300 text-xs">
                      {m.user?.name ? m.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-100">{m.user?.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-surface-800 text-zinc-400 px-1.5 py-0.2 rounded font-mono">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-500 font-mono text-[11px]">{m.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        m.role === 'owner'
                          ? 'purple'
                          : m.role === 'admin'
                          ? 'amber'
                          : m.role === 'developer'
                          ? 'emerald'
                          : 'zinc'
                      }
                      size="sm"
                      className="capitalize"
                    >
                      {m.role}
                    </Badge>

                    {isOwnerOrAdmin && !isCurrentUser && m.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(m.id, m.user?.email)}
                        className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RBAC Reference Table */}
      <div className="bg-surface-900 border border-border-dark rounded-md p-5 space-y-3">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-zinc-400" />
          Role Permission Hierarchy
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-dark text-zinc-400 font-medium">
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Flags Management</th>
                <th className="py-2 px-3">Targeting & Rollouts</th>
                <th className="py-2 px-3">SDK Key Rotation</th>
                <th className="py-2 px-3">Member Administration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark text-zinc-300">
              <tr>
                <td className="py-2 px-3 font-semibold text-purple-400">Owner</td>
                <td className="py-2 px-3">Full Access</td>
                <td className="py-2 px-3">Full Access</td>
                <td className="py-2 px-3">Full Access</td>
                <td className="py-2 px-3">Full Access</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-amber-400">Admin</td>
                <td className="py-2 px-3">Full Access</td>
                <td className="py-2 px-3">Full Access</td>
                <td className="py-2 px-3">Full Access</td>
                <td className="py-2 px-3">Manage Developers & Viewers</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-emerald-400">Developer</td>
                <td className="py-2 px-3">Create & Update</td>
                <td className="py-2 px-3">Configure & Toggle</td>
                <td className="py-2 px-3">Read Only</td>
                <td className="py-2 px-3">Read Only</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-zinc-400">Viewer</td>
                <td className="py-2 px-3">Read Only</td>
                <td className="py-2 px-3">Read Only</td>
                <td className="py-2 px-3">None</td>
                <td className="py-2 px-3">Read Only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Dialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Organization Member"
        description="Invited user must already have registered an account with this email address."
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="User Email"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-300">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-surface-900 border border-border-dark rounded text-sm text-zinc-100 focus:outline-none focus:border-brand-500"
            >
              <option value="developer">Developer (Create & modify flags, rules, rollouts)</option>
              <option value="admin">Admin (Manage members, rotate keys, manage environments)</option>
              <option value="viewer">Viewer (Read-only access to flags and audit logs)</option>
            </select>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-border-dark">
            <Button type="button" variant="secondary" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
