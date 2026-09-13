import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserWorkspace } from '../types';

interface AuthContextType {
  user: UserProfile;
  currentWorkspace: UserWorkspace;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string) => UserWorkspace;
  updateProfile: (displayName: string, email: string) => void;
  signInAsUser: (email: string, displayName?: string) => void;
  signOut: () => void;
}

const STORAGE_KEY = 'moms_studio_local_user_auth_v1';

const DEFAULT_WORKSPACE: UserWorkspace = {
  id: 'ws_default_fleet',
  name: 'MOMS Fleet Studio',
  slug: 'moms-fleet-studio',
  role: 'owner',
  tier: 'pro_fleet',
  createdAt: new Date().toISOString(),
};

const DEFAULT_USER: UserProfile = {
  id: 'user_djoreally',
  email: 'DjOReally@gmail.com',
  displayName: 'DjOReally',
  activeWorkspaceId: 'ws_default_fleet',
  workspaces: [
    DEFAULT_WORKSPACE,
    {
      id: 'ws_solo_creator',
      name: 'Solo Mobile Creator',
      slug: 'solo-creator',
      role: 'owner',
      tier: 'starter',
      createdAt: new Date().toISOString(),
    },
  ],
};

function loadStoredUser(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email && Array.isArray(parsed.workspaces) && parsed.workspaces.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read user auth from localStorage', err);
  }
  return DEFAULT_USER;
}

function persistUser(user: UserProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn('Could not save user auth to localStorage', err);
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(loadStoredUser);

  useEffect(() => {
    persistUser(user);
  }, [user]);

  const currentWorkspace =
    user.workspaces.find((w) => w.id === user.activeWorkspaceId) ||
    user.workspaces[0] ||
    DEFAULT_WORKSPACE;

  const switchWorkspace = (workspaceId: string) => {
    const exists = user.workspaces.find((w) => w.id === workspaceId);
    if (exists) {
      setUser((prev) => ({
        ...prev,
        activeWorkspaceId: workspaceId,
      }));
    }
  };

  const createWorkspace = (name: string): UserWorkspace => {
    const trimmed = name.trim() || 'New Workspace';
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newWs: UserWorkspace = {
      id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      slug: slug || 'workspace',
      role: 'owner',
      tier: 'starter',
      createdAt: new Date().toISOString(),
    };

    setUser((prev) => ({
      ...prev,
      activeWorkspaceId: newWs.id,
      workspaces: [...prev.workspaces, newWs],
    }));

    return newWs;
  };

  const updateProfile = (displayName: string, email: string) => {
    setUser((prev) => ({
      ...prev,
      displayName: displayName.trim() || prev.displayName,
      email: email.trim() || prev.email,
    }));
  };

  const signInAsUser = (email: string, displayName?: string) => {
    const cleanEmail = email.trim();
    const name = displayName?.trim() || cleanEmail.split('@')[0] || 'Studio User';
    const existing = loadStoredUser();

    if (existing.email.toLowerCase() === cleanEmail.toLowerCase()) {
      setUser(existing);
      return;
    }

    const defaultWs: UserWorkspace = {
      id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${name}'s Mobile Shop`,
      slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-shop`,
      role: 'owner',
      tier: 'pro_fleet',
      createdAt: new Date().toISOString(),
    };

    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      email: cleanEmail,
      displayName: name,
      activeWorkspaceId: defaultWs.id,
      workspaces: [defaultWs],
    };

    setUser(newUser);
  };

  const signOut = () => {
    const resetUser: UserProfile = {
      id: 'guest_user',
      email: 'creator@oilchangestudio.local',
      displayName: 'Guest Creator',
      activeWorkspaceId: 'ws_guest',
      workspaces: [
        {
          id: 'ws_guest',
          name: 'Guest Studio Space',
          slug: 'guest-studio',
          role: 'owner',
          tier: 'starter',
          createdAt: new Date().toISOString(),
        },
      ],
    };
    setUser(resetUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentWorkspace,
        switchWorkspace,
        createWorkspace,
        updateProfile,
        signInAsUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
