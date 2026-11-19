import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Flag, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { FeatureFlag } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';
import { Switch } from '../components/ui/Switch';

export function FlagsList() {
  const { currentProject } = useAuth();
  const navigate = useNavigate();

  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [initialEnabled, setInitialEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadFlags = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const data = await api.listFlags(currentProject.id);
      setFlags(data);
    } catch (err) {
      console.error('Failed to load flags:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, [currentProject?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !name.trim() || !key.trim()) return;

    setIsSubmitting(true);
    setCreateError('');

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      await api.createFlag(currentProject.id, {
        name: name.trim(),
        key: key.trim().toLowerCase(),
        description: description.trim(),
        tags,
        initialEnabled,
      });

      setIsCreateOpen(false);
      setName('');
      setKey('');
      setDescription('');
      setTagsInput('');
      setInitialEnabled(false);
      await loadFlags();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create feature flag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickToggle = async (flagId: string, envId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.toggleFlag(flagId, envId);
      await loadFlags();
    } catch (err) {
      console.error('Failed to toggle flag:', err);
    }
  };

  const allTags = Array.from(new Set(flags.flatMap((f) => f.tags || [])));

  const filteredFlags = flags.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.key.toLowerCase().includes(search.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

    const matchesTag = selectedTag === 'all' || (f.tags && f.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <span>Feature Flags</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-800 text-zinc-400 font-mono">
              {flags.length}
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage release toggles, canary percentages, and targeting rules for {currentProject?.name}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Create Flag
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter flags by name, key, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-surface-900 border border-border-dark rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
            <button
              onClick={() => setSelectedTag('all')}
              className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                selectedTag === 'all'
                  ? 'bg-zinc-200 text-zinc-900 font-medium'
                  : 'bg-surface-900 text-zinc-400 hover:text-zinc-200 border border-border-dark'
              }`}
            >
              All Tags
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className={`text-[11px] px-2.5 py-1 rounded font-mono transition-colors ${
                  selectedTag === t
                    ? 'bg-zinc-200 text-zinc-900 font-medium'
                    : 'bg-surface-900 text-zinc-400 hover:text-zinc-200 border border-border-dark'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Flags Table */}
      <div className="bg-surface-900 border border-border-dark rounded-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500">Loading feature flags...</div>
        ) : filteredFlags.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-surface-800 border border-border-dark flex items-center justify-center mx-auto text-zinc-400">
              <Flag className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-200">
                {flags.length === 0 ? 'No feature flags created yet' : 'No flags match your filter'}
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {flags.length === 0
                  ? 'Create your first feature flag to start progressive canary rollouts and targeted user releases.'
                  : 'Try clearing your search query or tag selection.'}
              </p>
            </div>
            {flags.length === 0 && (
              <Button onClick={() => setIsCreateOpen(true)} size="sm">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create Flag
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-dark bg-surface-950/50 text-zinc-400 font-medium">
                  <th className="py-2.5 px-4">Flag Key & Name</th>
                  <th className="py-2.5 px-4">Environments Status</th>
                  <th className="py-2.5 px-4">Tags</th>
                  <th className="py-2.5 px-4 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {filteredFlags.map((flag) => (
                  <tr
                    key={flag.id}
                    onClick={() => navigate(`/flags/${flag.id}`)}
                    className="hover:bg-surface-800/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-zinc-100 text-xs">
                            {flag.key}
                          </span>
                          <span className="text-[11px] text-zinc-400">({flag.name})</span>
                        </div>
                        {flag.description && (
                          <p className="text-[11px] text-zinc-500 truncate max-w-md">
                            {flag.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Environment Badges & Quick Toggles */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {Object.entries(flag.environments || {}).map(([envKey, envState]) => {
                          const isDev = envKey === 'development';
                          const isStaging = envKey === 'staging';
                          const isProd = envKey === 'production';

                          return (
                            <div
                              key={envKey}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 p-1 rounded bg-surface-950/70 border border-border-dark text-[11px]"
                            >
                              <span className="text-zinc-400 uppercase font-mono font-semibold text-[10px] px-1">
                                {isDev ? 'Dev' : isStaging ? 'Stg' : isProd ? 'Prod' : envKey.slice(0, 3)}
                              </span>

                              {envState.killSwitched ? (
                                <Badge variant="rose" size="sm">
                                  <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                                  KILLED
                                </Badge>
                              ) : (
                                <Badge
                                  variant={envState.enabled ? 'emerald' : 'zinc'}
                                  size="sm"
                                  dot
                                >
                                  {envState.enabled ? `${envState.rolloutPercentage}%` : 'OFF'}
                                </Badge>
                              )}

                              <Switch
                                size="sm"
                                checked={envState.enabled && !envState.killSwitched}
                                onChange={() => {}}
                                disabled={envState.killSwitched}
                                onClick={(e: any) =>
                                  handleQuickToggle(flag.id, envState.environmentId, e)
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {flag.tags && flag.tags.length > 0 ? (
                          flag.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-800 text-zinc-400 border border-border-dark"
                            >
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-600 text-[11px]">—</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right text-zinc-500 font-mono text-[11px]">
                      {new Date(flag.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Flag Modal */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Feature Flag"
        description="New flags are automatically bound to all environments with safe default values."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Flag Name"
            placeholder="e.g. AI Recommendation Feed"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!key) {
                setKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
              }
            }}
            required
          />

          <Input
            label="Flag Key"
            placeholder="e.g. ai-recommendations"
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase())}
            hint="Lowercase letters, numbers, and hyphens. Used in your application code."
            required
          />

          <Input
            label="Description"
            placeholder="What does this feature flag control?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Input
            label="Tags (Optional)"
            placeholder="e.g. checkout, beta, ai"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            hint="Comma separated list for grouping."
          />

          <div className="pt-1 flex items-center justify-between border-t border-border-dark">
            <div>
              <p className="text-xs font-medium text-zinc-200">Enable by default in Development</p>
              <p className="text-[11px] text-zinc-500">Staging and Production remain safe at 0% rollout.</p>
            </div>
            <Switch checked={initialEnabled} onChange={setInitialEnabled} />
          </div>

          {createError && <p className="text-xs text-rose-400">{createError}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-border-dark">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Flag
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
