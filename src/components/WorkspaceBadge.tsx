import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building, ChevronDown, User } from 'lucide-react';
import { WorkspaceModal } from './WorkspaceModal';

export const WorkspaceBadge: React.FC = () => {
  const { currentWorkspace, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        id="workspace-switcher-btn"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800/90 hover:bg-neutral-700/90 border border-neutral-700 text-neutral-200 hover:text-white transition-all shadow-sm group"
        title={`Active Workspace: ${currentWorkspace.name} (${user.email})`}
      >
        <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">
          {currentWorkspace.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex flex-col text-left leading-none max-w-[110px] sm:max-w-[140px]">
          <span className="text-[11px] font-bold text-white truncate group-hover:text-blue-300 transition-colors">
            {currentWorkspace.name}
          </span>
          <span className="text-[9px] text-neutral-400 truncate">
            {user.displayName || user.email.split('@')[0]}
          </span>
        </div>
        <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:text-white transition-transform" />
      </button>

      <WorkspaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
