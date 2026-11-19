import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Organization, Project } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  currentOrg: Organization | null;
  currentProject: Project | null;
  organizations: Organization[];
  projects: Project[];
  isLoading: boolean;
  login: (token: string, user: User, org?: Organization) => void;
  logout: () => void;
  selectOrg: (org: Organization) => void;
  selectProject: (project: Project) => void;
  refreshUserData: () => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('ff_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const res = await api.me();
      setUser(res.user);
      setOrganizations(res.organizations || []);

      // If no current org, select the first one
      if (res.organizations?.length > 0) {
        const savedOrgId = localStorage.getItem('ff_selected_org');
        const match = res.organizations.find((o: Organization) => o.id === savedOrgId);
        const selected = match || res.organizations[0];
        setCurrentOrg(selected);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
      localStorage.removeItem('ff_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProjects = async () => {
    if (!currentOrg) return;
    try {
      const list = await api.listProjects(currentOrg.id);
      setProjects(list);

      const savedProjId = localStorage.getItem('ff_selected_proj');
      const match = list.find((p) => p.id === savedProjId);
      if (match) {
        setCurrentProject(match);
      } else if (list.length > 0) {
        setCurrentProject(list[0]);
        localStorage.setItem('ff_selected_proj', list[0].id);
      } else {
        setCurrentProject(null);
      }
    } catch (err) {
      console.error('Failed to list projects:', err);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  useEffect(() => {
    if (currentOrg) {
      localStorage.setItem('ff_selected_org', currentOrg.id);
      refreshProjects();
    }
  }, [currentOrg?.id]);

  const login = (token: string, newUser: User, org?: Organization) => {
    localStorage.setItem('ff_token', token);
    setUser(newUser);
    if (org) {
      setCurrentOrg(org);
      localStorage.setItem('ff_selected_org', org.id);
    }
    refreshUserData();
  };

  const logout = () => {
    localStorage.removeItem('ff_token');
    localStorage.removeItem('ff_selected_org');
    localStorage.removeItem('ff_selected_proj');
    setUser(null);
    setCurrentOrg(null);
    setCurrentProject(null);
    setOrganizations([]);
    setProjects([]);
  };

  const selectOrg = (org: Organization) => {
    setCurrentOrg(org);
    localStorage.setItem('ff_selected_org', org.id);
  };

  const selectProject = (project: Project) => {
    setCurrentProject(project);
    localStorage.setItem('ff_selected_proj', project.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentOrg,
        currentProject,
        organizations,
        projects,
        isLoading,
        login,
        logout,
        selectOrg,
        selectProject,
        refreshUserData,
        refreshProjects,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
