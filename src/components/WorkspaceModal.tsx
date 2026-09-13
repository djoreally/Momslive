import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building,
  Check,
  ChevronDown,
  Plus,
  User,
  Shield,
  LogOut,
  Sparkles,
  HardDrive,
  Cloud,
} from 'lucide-react';

interface WorkspaceSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceModal: React.FC<WorkspaceSwitcherModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    currentWorkspace,
    switchWorkspace,
    createWorkspace,
    signInAsUser,
    updateProfile,
    signOut,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'workspaces' | 'profile' | 'create'>('workspaces');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email);
  const [loginEmail, setLoginEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    const ws = createWorkspace(newWorkspaceName);
    setNewWorkspaceName('');
    setStatusMessage(`Workspace "${ws.name}" created and activated!`);
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 1200);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(displayName, email);
    setStatusMessage('Profile details updated!');
    setTimeout(() => setStatusMessage(null), 1500);
  };

  const handleQuickSwitchUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;
    signInAsUser(loginEmail);
    setStatusMessage(`Switched user profile to ${loginEmail}`);
    setLoginEmail('');
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden p-6 text-neutral-100 flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Studio Workspaces</h3>
              <p className="text-[11px] text-neutral-400">IndexedDB Local + Cloudinary Storage Isolation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold px-2 py-1"
          >
            Esc
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('workspaces')}
            className={`py-1.5 rounded-lg transition-colors ${
              activeTab === 'workspaces' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Workspaces
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-1.5 rounded-lg transition-colors ${
              activeTab === 'create' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            + Create New
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-1.5 rounded-lg transition-colors ${
              activeTab === 'profile' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            User Account
          </button>
        </div>

        {statusMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium text-center animate-in fade-in">
            {statusMessage}
          </div>
        )}

        {/* Workspaces List Tab */}
        {activeTab === 'workspaces' && (
          <div className="space-y-3">
            <div className="text-xs text-neutral-400 flex items-center justify-between">
              <span>Switch Active Workspace:</span>
              <span className="text-neutral-500">{user.workspaces.length} Spaces</span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {user.workspaces.map((ws) => {
                const isActive = ws.id === currentWorkspace.id;
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      onClose();
                    }}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-sm'
                        : 'bg-neutral-800/60 border-neutral-700/70 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isActive ? 'bg-blue-500 text-white' : 'bg-neutral-700 text-neutral-300'
                        }`}
                      >
                        {ws.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                          <span>{ws.name}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/30 text-blue-300 font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5">
                          <span>Role: {ws.role}</span>
                          <span>•</span>
                          <span className="capitalize">{ws.tier.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Create Workspace Tab */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateWorkspace} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">New Workspace Name</label>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="e.g. Tampa Mobile Fleet Services"
                required
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-neutral-400">
                Each workspace isolates recordings in IndexedDB and tags Cloudinary assets separately.
              </p>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Workspace</span>
            </button>
          </form>
        )}

        {/* User Profile & Quick Switch Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-300">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-300">Account Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-semibold text-xs border border-neutral-700 transition-colors"
              >
                Save Profile
              </button>
            </form>

            <div className="border-t border-neutral-800 pt-3 space-y-2">
              <label className="text-xs font-bold text-neutral-300">Sign in as another user</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleQuickSwitchUser}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                >
                  Switch
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="w-full py-2 rounded-xl bg-neutral-800/60 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-300 text-xs font-medium border border-neutral-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Reset to Guest Account</span>
            </button>
          </div>
        )}

        {/* Footer Note */}
        <div className="border-t border-neutral-800/80 pt-3 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span>IndexedDB WASM Local</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-purple-400" />
            <span>Cloudinary Vault CDN</span>
          </div>
        </div>
      </div>
    </div>
  );
};
