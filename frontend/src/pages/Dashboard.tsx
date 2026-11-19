import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flag,
  CheckCircle2,
  AlertTriangle,
  History,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Button } from '../components/ui/Button';

export function Dashboard() {
  const { currentOrg, currentProject } = useAuth();
  const navigate = useNavigate();

  const [orgAnalytics, setOrgAnalytics] = useState<any>(null);
  const [projectAnalytics, setProjectAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!currentOrg) return;
      setIsLoading(true);
      try {
        const orgData = await api.getOrgAnalytics(currentOrg.id);
        setOrgAnalytics(orgData);

        if (currentProject) {
          const projData = await api.getProjectAnalytics(currentProject.id);
          setProjectAnalytics(projData);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [currentOrg?.id, currentProject?.id]);

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-zinc-500">Loading metrics...</div>;
  }

  const telemetry = orgAnalytics?.telemetry || {};
  const timeseries = projectAnalytics?.timeseries || [];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Overview & Telemetry</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Real metrics and evaluation activity for {currentOrg?.name}
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-900 border border-border-dark p-4 rounded-md space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Total Flags</span>
            <Flag className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-bold font-mono text-zinc-100">
            {orgAnalytics?.totalFlags || 0}
          </p>
          <p className="text-[11px] text-zinc-500">Across {orgAnalytics?.totalProjects || 0} projects</p>
        </div>

        <div className="bg-surface-900 border border-border-dark p-4 rounded-md space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Active Environments</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-400">
            {orgAnalytics?.activeFlags || 0}
          </p>
          <p className="text-[11px] text-zinc-500">Enabled configs</p>
        </div>

        <div className="bg-surface-900 border border-border-dark p-4 rounded-md space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Kill Switches</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-400">
            {orgAnalytics?.killSwitchedFlags || 0}
          </p>
          <p className="text-[11px] text-zinc-500">Forcefully disabled</p>
        </div>

        <div className="bg-surface-900 border border-border-dark p-4 rounded-md space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Total Evaluations</span>
            <Activity className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <p className="text-xl font-bold font-mono text-zinc-100">
            {telemetry.totalEvaluations || 0}
          </p>
          <p className="text-[11px] text-zinc-500">24-hour recorded traffic</p>
        </div>
      </div>

      {/* Real Telemetry Chart or Empty Telemetry State */}
      <div className="bg-surface-900 border border-border-dark rounded-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Evaluation Activity (24h)</h3>
            <p className="text-xs text-zinc-400">
              Real-time telemetry aggregated by hourly buckets
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            {timeseries.length} data points
          </span>
        </div>

        {timeseries.length > 0 ? (
          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeseries}>
                <defs>
                  <linearGradient id="evalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit' })}
                  stroke="#52525b"
                  fontSize={10}
                />
                <YAxis stroke="#52525b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#131418',
                    borderColor: '#272930',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#f4f4f5',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="evaluations"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#evalGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-10 text-center space-y-2 border border-dashed border-border-dark rounded">
            <Activity className="w-6 h-6 text-zinc-500 mx-auto" />
            <p className="text-xs font-medium text-zinc-300">No evaluation traffic recorded yet</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Integrate the Node.js SDK or send evaluation requests to <code className="text-zinc-300">/api/v1/evaluate</code> to generate real metrics.
            </p>
          </div>
        )}
      </div>

      {/* Recent Audit Events */}
      <div className="bg-surface-900 border border-border-dark rounded-md p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-border-dark pb-3">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-400" />
            Recent Configuration Changes
          </h3>
          <Button onClick={() => navigate('/audit-logs')} variant="ghost" size="xs">
            View All Audit Logs
          </Button>
        </div>

        {orgAnalytics?.recentAuditLogs?.length > 0 ? (
          <div className="divide-y divide-border-dark">
            {orgAnalytics.recentAuditLogs.slice(0, 5).map((log: any) => (
              <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-200">{log.action}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-300">{log.entityName}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">by {log.actorEmail}</p>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {new Date(log.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-zinc-500">No audit logs recorded yet.</div>
        )}
      </div>
    </div>
  );
}
