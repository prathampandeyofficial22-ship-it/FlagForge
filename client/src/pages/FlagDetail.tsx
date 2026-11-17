import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  ShieldAlert,
  Sliders,
  Users,
} from 'lucide-react';
import { api } from '../api/client';
import { TargetingRule, TargetingCondition, RuleOperator } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Switch';

export function FlagDetail() {
  const { flagId } = useParams<{ flagId: string }>();
  const navigate = useNavigate();

  const [flag, setFlag] = useState<any>(null);
  const [selectedEnvId, setSelectedEnvId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Form states for the selected environment
  const [enabled, setEnabled] = useState(false);
  const [rolloutPercentage, setRolloutPercentage] = useState(0);
  const [rules, setRules] = useState<TargetingRule[]>([]);
  const [killSwitched, setKillSwitched] = useState(false);

  const loadFlag = async () => {
    if (!flagId) return;
    setIsLoading(true);
    try {
      const data = await api.getFlag(flagId);
      setFlag(data);

      const envs = data.environments || [];
      const envId = selectedEnvId || envs[0]?.environmentId || '';
      setSelectedEnvId(envId);

      const config = envs.find((e: any) => e.environmentId === envId);
      if (config) {
        setEnabled(config.enabled);
        setRolloutPercentage(config.rolloutPercentage);
        setRules(config.rules || []);
        setKillSwitched(config.killSwitched);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load feature flag');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlag();
  }, [flagId]);

  const handleSelectEnv = (envId: string) => {
    setSelectedEnvId(envId);
    const config = flag?.environments?.find((e: any) => e.environmentId === envId);
    if (config) {
      setEnabled(config.enabled);
      setRolloutPercentage(config.rolloutPercentage);
      setRules(config.rules || []);
      setKillSwitched(config.killSwitched);
    }
  };

  const handleCopyKey = () => {
    if (!flag?.key) return;
    navigator.clipboard.writeText(flag.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSave = async () => {
    if (!flagId || !selectedEnvId) return;
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      await api.updateEnvConfig(flagId, selectedEnvId, {
        enabled,
        rolloutPercentage,
        rules,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadFlag();
    } catch (err: any) {
      setError(err.message || 'Failed to update environment configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKillSwitch = async () => {
    if (!flagId || !selectedEnvId) return;
    if (!confirm('Are you sure you want to trigger the EMERGENCY KILL SWITCH? This will immediately disable this feature for all users across this environment.')) {
      return;
    }

    try {
      await api.killSwitchFlag(flagId, selectedEnvId);
      await loadFlag();
    } catch (err: any) {
      setError(err.message || 'Failed to trigger kill switch');
    }
  };

  const handleRestoreFromKillSwitch = async () => {
    if (!flagId || !selectedEnvId) return;
    try {
      // Toggling flag automatically clears kill switch
      await api.toggleFlag(flagId, selectedEnvId);
      await loadFlag();
    } catch (err: any) {
      setError(err.message || 'Failed to restore flag');
    }
  };

  // Targeting Rules Handlers
  const handleAddRule = () => {
    const newRule: TargetingRule = {
      id: `rule-${Date.now()}`,
      name: `Targeting Rule #${rules.length + 1}`,
      priority: rules.length,
      conditionOperator: 'AND',
      serveValue: true,
      conditions: [
        {
          attribute: 'email',
          operator: 'endsWith',
          values: ['@example.com'],
        },
      ],
    };
    setRules([...rules, newRule]);
  };

  const handleRemoveRule = (ruleId: string) => {
    setRules(rules.filter((r) => r.id !== ruleId));
  };

  const handleRuleChange = (ruleId: string, updates: Partial<TargetingRule>) => {
    setRules(rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)));
  };

  const handleAddCondition = (ruleId: string) => {
    setRules(
      rules.map((r) => {
        if (r.id !== ruleId) return r;
        const newCond: TargetingCondition = {
          attribute: 'userId',
          operator: 'equals',
          values: [''],
        };
        return { ...r, conditions: [...r.conditions, newCond] };
      })
    );
  };

  const handleRemoveCondition = (ruleId: string, condIndex: number) => {
    setRules(
      rules.map((r) => {
        if (r.id !== ruleId) return r;
        return {
          ...r,
          conditions: r.conditions.filter((_, idx) => idx !== condIndex),
        };
      })
    );
  };

  const handleConditionChange = (
    ruleId: string,
    condIndex: number,
    updates: Partial<TargetingCondition>
  ) => {
    setRules(
      rules.map((r) => {
        if (r.id !== ruleId) return r;
        const updatedConditions = r.conditions.map((cond, idx) =>
          idx === condIndex ? { ...cond, ...updates } : cond
        );
        return { ...r, conditions: updatedConditions };
      })
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-zinc-500">Loading flag configuration...</div>;
  }

  if (!flag) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-zinc-300">Feature flag not found</p>
        <Button onClick={() => navigate('/flags')} variant="secondary" size="sm">
          Back to Flags
        </Button>
      </div>
    );
  }

  const selectedEnv = flag.environments?.find((e: any) => e.environmentId === selectedEnvId);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Metadata */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border-dark pb-4">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/flags')}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Flags</span>
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-semibold text-zinc-100">{flag.name}</h1>
            <div className="flex items-center gap-1 bg-surface-900 border border-border-dark px-2 py-0.5 rounded font-mono text-xs text-zinc-300">
              <span>{flag.key}</span>
              <button
                onClick={handleCopyKey}
                title="Copy flag key"
                className="text-zinc-500 hover:text-zinc-300 ml-1"
              >
                {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <Badge variant="blue" size="sm">{flag.type}</Badge>
          </div>
          {flag.description && <p className="text-xs text-zinc-400">{flag.description}</p>}
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <Check className="w-3.5 h-3.5" /> Configuration Saved
            </span>
          )}
          <Button onClick={handleSave} isLoading={isSaving} size="sm">
            <Save className="w-3.5 h-3.5 mr-1" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Environment Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-border-dark">
        {flag.environments?.map((env: any) => {
          const isSelected = env.environmentId === selectedEnvId;
          return (
            <button
              key={env.environmentId}
              onClick={() => handleSelectEnv(env.environmentId)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                isSelected
                  ? 'border-brand-500 text-zinc-100'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <span className="capitalize">{env.environmentName}</span>
              {env.killSwitched ? (
                <Badge variant="rose" size="sm">KILLED</Badge>
              ) : (
                <Badge variant={env.enabled ? 'emerald' : 'zinc'} size="sm" dot>
                  {env.enabled ? `${env.rolloutPercentage}%` : 'OFF'}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Kill Switch Alert Banner */}
      {killSwitched ? (
        <div className="p-4 rounded-md bg-rose-950/40 border border-rose-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-rose-300 uppercase tracking-wide">
                Emergency Kill Switch Active
              </p>
              <p className="text-xs text-rose-200/80">
                This feature flag is forcefully killed in {selectedEnv?.environmentName}. All evaluations return false and cache has been invalidated.
              </p>
            </div>
          </div>
          <Button onClick={handleRestoreFromKillSwitch} variant="secondary" size="xs">
            Restore Feature
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button
            onClick={handleKillSwitch}
            variant="danger"
            size="xs"
            className="text-[11px]"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Emergency Kill Switch
          </Button>
        </div>
      )}

      {/* Master Toggle & Rollout Section */}
      <div className="bg-surface-900 border border-border-dark rounded-md p-5 space-y-6">
        <div className="flex items-center justify-between border-b border-border-dark pb-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-zinc-400" />
              Master Switch
            </h3>
            <p className="text-xs text-zinc-400">
              When disabled, evaluation returns false for all requests regardless of targeting rules.
            </p>
          </div>
          <Switch
            checked={enabled && !killSwitched}
            onChange={(val) => {
              setEnabled(val);
              if (val && rolloutPercentage === 0) setRolloutPercentage(100);
            }}
            disabled={killSwitched}
            label={enabled ? 'Enabled' : 'Disabled'}
          />
        </div>

        {/* Gradual Percentage Canary Rollout */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-zinc-200">Canary Rollout Percentage</h4>
              <p className="text-[11px] text-zinc-500">
                Deterministic hash bucket assigns users consistently without state flapping.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-brand-400 bg-surface-950 px-2 py-0.5 rounded border border-border-dark">
              {rolloutPercentage}% of users
            </span>
          </div>

          {/* Rollout Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            {[0, 10, 25, 50, 75, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRolloutPercentage(preset)}
                className={`text-xs px-2.5 py-1 rounded font-mono border transition-colors ${
                  rolloutPercentage === preset
                    ? 'bg-brand-600 text-white border-brand-500 font-semibold'
                    : 'bg-surface-950 text-zinc-400 hover:text-zinc-200 border-border-dark'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>

          {/* Slider */}
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={rolloutPercentage}
            onChange={(e) => setRolloutPercentage(parseInt(e.target.value, 10))}
            className="w-full accent-brand-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Targeting Rules Section */}
      <div className="bg-surface-900 border border-border-dark rounded-md p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border-dark pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              Targeting Rules
            </h3>
            <p className="text-xs text-zinc-400">
              Target specific user cohorts based on identifiers, plan tier, email domain, country, or custom attributes.
            </p>
          </div>
          <Button onClick={handleAddRule} variant="outline" size="xs">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Rule
          </Button>
        </div>

        {rules.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-border-dark rounded">
            No custom targeting rules configured. All evaluations default to the general rollout percentage.
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-surface-950 border border-border-dark rounded-md p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-surface-800 text-zinc-400 rounded">
                      PRIORITY {rule.priority}
                    </span>
                    <input
                      type="text"
                      value={rule.name}
                      onChange={(e) => handleRuleChange(rule.id, { name: e.target.value })}
                      className="bg-transparent border-b border-transparent hover:border-border-dark focus:border-brand-500 text-xs font-medium text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveRule(rule.id)}
                    className="text-zinc-500 hover:text-rose-400 p-1"
                    title="Delete rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Match Condition Operator (AND / OR) */}
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>Match</span>
                  <select
                    value={rule.conditionOperator}
                    onChange={(e) =>
                      handleRuleChange(rule.id, {
                        conditionOperator: e.target.value as 'AND' | 'OR',
                      })
                    }
                    className="bg-surface-900 border border-border-dark rounded px-2 py-0.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="AND">ALL (AND)</option>
                    <option value="OR">ANY (OR)</option>
                  </select>
                  <span>of the following conditions:</span>
                </div>

                {/* Conditions Table */}
                <div className="space-y-2">
                  {rule.conditions.map((cond, condIdx) => (
                    <div key={condIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Attribute (e.g. country, email, plan)"
                        value={cond.attribute}
                        onChange={(e) =>
                          handleConditionChange(rule.id, condIdx, { attribute: e.target.value })
                        }
                        className="w-1/3 px-2.5 py-1 bg-surface-900 border border-border-dark rounded text-xs text-zinc-200 focus:outline-none focus:border-brand-500"
                      />

                      <select
                        value={cond.operator}
                        onChange={(e) =>
                          handleConditionChange(rule.id, condIdx, {
                            operator: e.target.value as RuleOperator,
                          })
                        }
                        className="w-1/3 px-2.5 py-1 bg-surface-900 border border-border-dark rounded text-xs text-zinc-200 focus:outline-none focus:border-brand-500"
                      >
                        <option value="equals">equals</option>
                        <option value="notEquals">does not equal</option>
                        <option value="contains">contains</option>
                        <option value="notContains">does not contain</option>
                        <option value="startsWith">starts with</option>
                        <option value="endsWith">ends with</option>
                        <option value="in">is in list</option>
                        <option value="notIn">is not in list</option>
                        <option value="greaterThan">&gt; greater than</option>
                        <option value="lessThan">&lt; less than</option>
                        <option value="greaterThanOrEqual">&gt;= greater or equal</option>
                        <option value="lessThanOrEqual">&lt;= less or equal</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Values (comma separated)"
                        value={cond.values.join(', ')}
                        onChange={(e) =>
                          handleConditionChange(rule.id, condIdx, {
                            values: e.target.value.split(',').map((v) => v.trim()),
                          })
                        }
                        className="flex-1 px-2.5 py-1 bg-surface-900 border border-border-dark rounded text-xs text-zinc-200 focus:outline-none focus:border-brand-500"
                      />

                      <button
                        onClick={() => handleRemoveCondition(rule.id, condIdx)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                        title="Remove condition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleAddCondition(rule.id)}
                    className="text-[11px] text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Condition
                  </button>

                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <span>Serve value:</span>
                    <select
                      value={String(rule.serveValue)}
                      onChange={(e) =>
                        handleRuleChange(rule.id, { serveValue: e.target.value === 'true' })
                      }
                      className="bg-surface-900 border border-border-dark rounded px-2 py-0.5 text-xs text-zinc-200 focus:outline-none"
                    >
                      <option value="true">TRUE (Enabled)</option>
                      <option value="false">FALSE (Disabled)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
