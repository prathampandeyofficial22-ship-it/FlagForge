import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await api.register({
        name,
        email,
        password,
        organizationName: organizationName.trim() || undefined,
      });
      login(res.token, res.user, res.currentOrganization);
      navigate('/flags');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-surface-900 border border-border-dark p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center font-bold text-white text-xs">
            FF
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100">Create your FlagForge workspace</h1>
            <p className="text-xs text-zinc-400">Production-ready feature flag management</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Full Name"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            id="email"
            type="email"
            label="Work Email"
            placeholder="jane@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="org"
            label="Organization / Company Name"
            placeholder="Acme Corp"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            hint="Workspace name for your team and environments."
          />

          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="Minimum 8 characters with secure hashing."
            required
          />

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <Button type="submit" className="w-full" size="md" isLoading={isLoading}>
            Create Workspace & Start
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
