import { useState, useEffect } from 'react';
import { Layers, Key, RefreshCw, Copy, Check, Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Environment } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';

export function Environments() {
  const { currentProject } = useAuth();

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Environment Modal
  const [isNewEnvOpen, setIsNewEnvOpen] = useState(false);
  const [envName, setEnvName] = useState('');
  const [envKey, setEnvKey] = useState('');
  const [envType, setEnvType] = useState<'development' | 'staging' | 'production' | 'custom'>('custom');
  const [isCreating, setIsCreating] = useState(false);

  // Rotate Key Modal
  const [selectedEnvForRotate, setSelectedEnvForRotate] = useState<Environment | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotatedKeys, setRotatedKeys] = useState<{ serverApiKey: string; clientApiKey: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadEnvironments = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const data = await api.listEnvironments(currentProject.id);
      setEnvironments(data);
    } catch (err) {
      console.error('Failed to load environments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEnvironments();
  }, [currentProject?.id]);

  const handleCreateEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !envName.trim()) return;

    setIsCreating(true);
    try {
      const res = await api.createEnvironment(currentProject.id, {
        name: envName.trim(),
        key: envKey.trim() || undefined,
        type: envType,
      });

      setIsNewEnvOpen(false);
      setEnvName('');
      setEnvKey('');
      // Show rotated keys modal to display initial credentials
      setSelectedEnvForRotate(res.environment);
      setRotatedKeys({
        serverApiKey: res.serverApiKey,
        clientApiKey: res.clientApiKey,
      });
      await loadEnvironments();
    } catch (err) {
      console.error('Failed to create environment:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmRotate = async () => {
    if (!selectedEnvForRotate) return;
    setIsRotating(true);
    try {
      const res = await api.rotateKeys(selectedEnvForRotate._id);
      setRotatedKeys({
        serverApiKey: res.serverApiKey,
        clientApiKey: res.clientApiKey,
      });
      await loadEnvironments();
    } catch (err) {
      console.error('Failed to rotate keys:', err);
    } finally {
      setIsRotating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-zinc-400" />
            Environments & SDK Credentials
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage target environments and cryptographically secure SDK keys for {currentProject?.name}
          </p>
        </div>
        <Button onClick={() => setIsNewEnvOpen(true)} size="sm">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Environment
        </Button>
      </div>

      {/* Environments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500">Loading environments...</div>
        ) : (
          environments.map((env) => (
            <div
              key={env._id}
              className="bg-surface-900 border border-border-dark rounded-md p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-dark pb-3">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-semibold text-zinc-100">{env.name}</h3>
                  <span className="font-mono text-xs text-zinc-400 bg-surface-950 px-2 py-0.5 rounded border border-border-dark">
                    {env.key}
                  </span>
                  <Badge
                    variant={
                      env.type === 'production'
                        ? 'amber'
                        : env.type === 'staging'
                        ? 'blue'
                        : 'emerald'
                    }
                    size="sm"
                  >
                    {env.type}
                  </Badge>
                </div>

                <Button
                  onClick={() => {
                    setSelectedEnvForRotate(env);
                    setRotatedKeys(null);
                  }}
                  variant="outline"
                  size="xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Rotate Keys
                </Button>
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 bg-surface-950 border border-border-dark p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-zinc-400" />
                      Server SDK Key (Backend Microservices)
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase">SHA-256 Hashed</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 font-mono text-xs text-zinc-400">
                    <span>{env.serverApiKeyPrefix || 'ff_server_live_••••'}</span>
                    <span className="text-[11px] text-zinc-500">Stored as Hash</span>
                  </div>
                </div>

                <div className="space-y-1 bg-surface-950 border border-border-dark p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-zinc-400" />
                      Client SDK Key (Web / Mobile)
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase">SHA-256 Hashed</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 font-mono text-xs text-zinc-400">
                    <span>{env.clientApiKeyPrefix || 'ff_client_live_••••'}</span>
                    <span className="text-[11px] text-zinc-500">Stored as Hash</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Environment Modal */}
      <Dialog
        isOpen={isNewEnvOpen}
        onClose={() => setIsNewEnvOpen(false)}
        title="Add Environment"
        description="Provision an isolated environment for feature evaluations."
      >
        <form onSubmit={handleCreateEnv} className="space-y-4">
          <Input
            label="Environment Name"
            placeholder="e.g. QA or Pre-Production"
            value={envName}
            onChange={(e) => {
              setEnvName(e.target.value);
              if (!envKey) {
                setEnvKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
              }
            }}
            required
          />
          <Input
            label="Environment Key"
            placeholder="e.g. qa"
            value={envKey}
            onChange={(e) => setEnvKey(e.target.value.toLowerCase())}
            required
          />
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-300">Environment Type</label>
            <select
              value={envType}
              onChange={(e) => setEnvType(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-surface-900 border border-border-dark rounded text-sm text-zinc-100 focus:outline-none focus:border-brand-500"
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border-dark">
            <Button type="button" variant="secondary" onClick={() => setIsNewEnvOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create Environment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Rotate Key Confirmation / Display Modal */}
      <Dialog
        isOpen={Boolean(selectedEnvForRotate)}
        onClose={() => {
          setSelectedEnvForRotate(null);
          setRotatedKeys(null);
        }}
        title={`SDK Credentials: ${selectedEnvForRotate?.name}`}
        description="Keys are cryptographically hashed. Plaintext values are only displayed upon creation or rotation."
      >
        {!rotatedKeys ? (
          <div className="space-y-4">
            <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded text-xs text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                Rotating keys will immediately invalidate active SDK connections for {selectedEnvForRotate?.name}. Any services using the previous key will receive 401 Unauthorized responses until updated.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border-dark">
              <Button
                variant="secondary"
                onClick={() => setSelectedEnvForRotate(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmRotate}
                isLoading={isRotating}
              >
                Rotate Keys Now
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded text-xs text-emerald-200">
              Keys generated successfully! Copy and store these credentials in your environment variables. They will not be displayed again.
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">Server SDK Key</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={rotatedKeys.serverApiKey}
                  className="w-full px-3 py-1.5 bg-surface-950 border border-border-dark rounded text-xs font-mono text-zinc-100 select-all"
                />
                <Button
                  onClick={() => copyToClipboard(rotatedKeys.serverApiKey, 'server')}
                  variant="secondary"
                  size="sm"
                >
                  {copiedKey === 'server' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">Client SDK Key</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={rotatedKeys.clientApiKey}
                  className="w-full px-3 py-1.5 bg-surface-950 border border-border-dark rounded text-xs font-mono text-zinc-100 select-all"
                />
                <Button
                  onClick={() => copyToClipboard(rotatedKeys.clientApiKey, 'client')}
                  variant="secondary"
                  size="sm"
                >
                  {copiedKey === 'client' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border-dark">
              <Button
                onClick={() => {
                  setSelectedEnvForRotate(null);
                  setRotatedKeys(null);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
